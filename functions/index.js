const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

initializeApp();
const db = getFirestore();

// Set this to a secret key of your choice, or use Firebase defineSecret for production
const INTEGRITY_KEY = process.env.INTEGRITY_KEY || "changeme";

/**
 * Ad-hoc Data Integrity Check (HTTP Callable)
 *
 * Trigger: GET/POST https://<region>-<project>.cloudfunctions.net/runIntegrityCheck?key=YOUR_KEY
 *
 * Checks and auto-fixes:
 *  1. Stats/counters accuracy (users, publicEvents vs actual counts)
 *  2. Orphaned events (events from deleted users)
 *  3. Homepage events existence
 */
exports.runIntegrityCheck = onRequest(
    {
        memory: "256MiB",
        timeoutSeconds: 60,
        cors: true,
    },
    async (req, res) => {
        // ─── AUTH CHECK ───
        if (req.query.key !== INTEGRITY_KEY) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const report = { issues: 0, fixes: 0, details: [] };

        try {
            // ─── 1. STATS/COUNTERS INTEGRITY ───
            logger.info("━ 1. Checking stats/counters integrity...");

            const countersRef = db.doc("stats/counters");
            const countersSnap = await countersRef.get();

            const usersAgg = await db.collection("users").count().get();
            const actualUsers = usersAgg.data().count;

            const publicEventsAgg = await db
                .collection("events")
                .where("isPublic", "==", true)
                .count()
                .get();
            const actualPublicEvents = publicEventsAgg.data().count;

            if (!countersSnap.exists) {
                logger.warn("stats/counters document missing — creating it");
                await countersRef.set({
                    users: actualUsers,
                    publicEvents: actualPublicEvents,
                    visits: 0,
                });
                report.issues++;
                report.fixes++;
                report.details.push("Created missing stats/counters document");
            } else {
                const counters = countersSnap.data();
                const usersDrift = (counters.users ?? 0) !== actualUsers;
                const eventsDrift = (counters.publicEvents ?? 0) !== actualPublicEvents;

                if (usersDrift || eventsDrift) {
                    const updates = {};
                    if (usersDrift) {
                        logger.warn(`Users counter drift: stored=${counters.users ?? 0}, actual=${actualUsers}`);
                        updates.users = actualUsers;
                        report.issues++;
                        report.details.push(`Users drift: ${counters.users ?? 0} → ${actualUsers}`);
                    }
                    if (eventsDrift) {
                        logger.warn(`Public events drift: stored=${counters.publicEvents ?? 0}, actual=${actualPublicEvents}`);
                        updates.publicEvents = actualPublicEvents;
                        report.issues++;
                        report.details.push(`Public events drift: ${counters.publicEvents ?? 0} → ${actualPublicEvents}`);
                    }
                    await countersRef.update(updates);
                    report.fixes++;
                } else {
                    report.details.push("Counters accurate ✓");
                }
            }

            // ─── 2. ORPHANED EVENTS ───
            logger.info("━ 2. Checking for orphaned events...");

            const usersSnap = await db.collection("users").get();
            const knownUids = new Set(["homepage"]);
            usersSnap.forEach((doc) => {
                const uid = doc.data().uid;
                if (uid) knownUids.add(uid);
            });

            const allEventsSnap = await db.collection("events").get();
            const orphans = [];
            allEventsSnap.forEach((doc) => {
                const data = doc.data();
                if (!knownUids.has(data.userId)) {
                    orphans.push({ id: doc.id, title: data.title, userId: data.userId });
                }
            });

            if (orphans.length === 0) {
                report.details.push("No orphaned events ✓");
            } else {
                logger.warn(`Found ${orphans.length} orphaned events — batch deleting`);
                report.issues += orphans.length;

                const batchSize = 500;
                for (let i = 0; i < orphans.length; i += batchSize) {
                    const batch = db.batch();
                    const chunk = orphans.slice(i, i + batchSize);
                    chunk.forEach((orphan) => {
                        batch.delete(db.doc(`events/${orphan.id}`));
                    });
                    await batch.commit();
                    report.fixes += chunk.length;
                }

                report.details.push(`Deleted ${orphans.length} orphaned events`);

                // Recount after deletion
                const recount = await db
                    .collection("events")
                    .where("isPublic", "==", true)
                    .count()
                    .get();
                await countersRef.update({ publicEvents: recount.data().count });
            }

            // ─── 3. HOMEPAGE EVENTS ───
            logger.info("━ 3. Checking homepage events...");

            const homepageSnap = await db
                .collection("events")
                .where("userId", "==", "homepage")
                .where("isPublic", "==", true)
                .get();

            if (homepageSnap.empty) {
                report.issues++;
                report.details.push("⚠️ No homepage events — landing page will be empty");
            } else {
                report.details.push(`${homepageSnap.size} homepage events ✓`);
            }

            // ─── RESPONSE ───
            return res.status(200).json({
                message: "Integrity check complete",
                issuesFound: report.issues,
                issuesFixed: report.fixes,
                details: report.details,
            });
        } catch (err) {
            logger.error("Integrity check failed:", err);
            return res.status(500).json({ error: err.message });
        }
    }
);

/**
 * Trigger: When a new user slug is claimed, increment the global user counter.
 */
exports.onUserCreated = onDocumentCreated("users/{slug}", async (event) => {
    logger.info(`Incrementing user counter for new slug: ${event.params.slug}`);
    try {
        const countersRef = db.doc("stats/counters");
        await countersRef.update({ users: FieldValue.increment(1) });
    } catch (err) {
        logger.error("Failed to increment users counter:", err);
        // If update fails (e.g. doc doesn't exist), integrity check can fix it later
    }
});

/**
 * Trigger: When an event is created, increment publicEvents if it's public.
 */
exports.onEventCreated = onDocumentCreated("events/{eventId}", async (event) => {
    const data = event.data.data();
    if (data.isPublic === true) {
        logger.info(`Incrementing publicEvents for new event: ${event.params.eventId}`);
        try {
            const countersRef = db.doc("stats/counters");
            await countersRef.update({ publicEvents: FieldValue.increment(1) });
        } catch (err) {
            logger.error("Failed to increment publicEvents counter:", err);
        }
    }
});

/**
 * Trigger: When an event is deleted, decrement publicEvents if it was public.
 */
exports.onEventDeleted = onDocumentDeleted("events/{eventId}", async (event) => {
    const data = event.data.data();
    if (data.isPublic === true) {
        logger.info(`Decrementing publicEvents for deleted event: ${event.params.eventId}`);
        try {
            const countersRef = db.doc("stats/counters");
            await countersRef.update({ publicEvents: FieldValue.increment(-1) });
        } catch (err) {
            logger.error("Failed to decrement publicEvents counter:", err);
        }
    }
});

/**
 * Trigger: When an event is updated, adjust publicEvents if visibility changed.
 */
exports.onEventUpdated = onDocumentUpdated("events/{eventId}", async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    const wasPublic = before.isPublic === true;
    const isPublic = after.isPublic === true;

    if (!wasPublic && isPublic) {
        logger.info(`Incrementing publicEvents: event ${event.params.eventId} became public`);
        try {
            const countersRef = db.doc("stats/counters");
            await countersRef.update({ publicEvents: FieldValue.increment(1) });
        } catch (err) {
            logger.error("Failed to increment publicEvents counter:", err);
        }
    } else if (wasPublic && !isPublic) {
        logger.info(`Decrementing publicEvents: event ${event.params.eventId} became private`);
        try {
            const countersRef = db.doc("stats/counters");
            await countersRef.update({ publicEvents: FieldValue.increment(-1) });
        } catch (err) {
            logger.error("Failed to decrement publicEvents counter:", err);
        }
    }
});

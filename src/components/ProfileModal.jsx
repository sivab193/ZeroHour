"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, query, collection, where, getDocs, updateDoc, increment } from "firebase/firestore";
import { Loader2, Copy, Check } from "lucide-react";

const inputStyles = "w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all";
const countersRef = doc(db, "stats", "counters");

export function ProfileModal({ isOpen, onClose, user }) {
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [existingSlug, setExistingSlug] = useState(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            checkExistingSlug();
        }
    }, [isOpen, user]);

    const checkExistingSlug = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const q = query(collection(db, "users"), where("uid", "==", user.uid));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                setExistingSlug(querySnapshot.docs[0].id);
            }
        } catch (err) {
            console.error("Error checking slug:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleClaim = async (e) => {
        e.preventDefault();
        setError("");

        const cleanSlug = slug.trim().toLowerCase();
        if (cleanSlug.length < 3 || cleanSlug.length > 40) {
            setError("URL must be between 3 and 40 characters.");
            return;
        }
        if (!/^[a-z0-9-]+$/.test(cleanSlug)) {
            setError("Only letters, numbers, and hyphens allowed.");
            return;
        }

        setLoading(true);

        try {
            const slugRef = doc(db, "users", cleanSlug);
            const slugSnap = await getDoc(slugRef);

            if (slugSnap.exists()) {
                setError("This URL is already taken.");
                setLoading(false);
                return;
            }

            await setDoc(slugRef, {
                uid: user.uid,
                createdAt: new Date().toISOString()
            });

            setExistingSlug(cleanSlug);
        } catch (err) {
            console.error(err);
            setError("Failed to claim URL. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const publicUrl = existingSlug ? `${window.location.origin}/${existingSlug}` : "";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(publicUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Public Profile"
        >
            <div className="space-y-6">
                {loading && !existingSlug ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                    </div>
                ) : existingSlug ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                            <h3 className="text-emerald-400 font-bold mb-2">You have a public profile!</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Share this link to show your public countdowns.
                            </p>

                            <div className="flex items-center gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10">
                                <code className="flex-1 text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap text-emerald-400/80">
                                    {publicUrl}
                                </code>
                                <button
                                    onClick={copyToClipboard}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                                </button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Note: Only events marked as &quot;Public&quot; will be visible here.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleClaim} className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Claim a unique URL for your public profile. This cannot be changed later.
                        </p>

                        <div>
                            <label className="block text-sm font-medium mb-1.5 text-foreground">Custom URL</label>
                            <div className="flex items-center">
                                <span className="bg-white/5 px-3 py-2.5 border border-white/10 border-r-0 rounded-l-xl text-emerald-500 text-sm font-mono">
                                    /
                                </span>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="flex-1 p-2.5 border border-white/10 rounded-r-xl bg-white/5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all"
                                    placeholder="your-name"
                                    minLength={3}
                                    maxLength={40}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5">
                                3-40 chars, letters, numbers, and hyphens only.
                            </p>
                        </div>

                        {error && (
                            <p className="text-sm text-red-400 bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-2.5 rounded-full font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Claim URL"}
                        </button>
                    </form>
                )}
            </div>
        </Modal>
    );
}

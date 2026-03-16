"use client";

import { useState } from "react";
import { formatISO } from "date-fns";

export function useGoogleCalendar() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchUpcomingEvents = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("googleCalendarAccessToken");
            if (!token) {
                throw new Error("No Google Calendar access token found. Please sign in with Google again.");
            }

            const timeMin = formatISO(new Date());
            const response = await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&singleEvents=true&orderBy=startTime&maxResults=50`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error("Google Calendar access denied or expired. Please sign out and sign in with Google again.");
                }
                throw new Error("Failed to fetch Google Calendar events.");
            }

            const data = await response.json();

            // Map the events to ZeroHour format
            const mappedEvents = (data.items || []).map(event => {
                // Determine start date and timezone
                let dateStr = "";
                let tz = Intl.DateTimeFormat().resolvedOptions().timeZone; // Default to local

                if (event.start.dateTime) {
                    dateStr = event.start.dateTime;
                    if (event.start.timeZone) {
                        tz = event.start.timeZone;
                    }
                } else if (event.start.date) {
                    // All day event, treat as midnight in local timezone
                    dateStr = `${event.start.date}T00:00:00`;
                }

                // If dateStr ends in Z, it's UTC, we might want to store it as a local-ish string with timezone or just keep it as is
                // since date-fns-tz will parse it with the given timezone anyway. Actually ZeroHour just wants a string it can parse.
                // Looking at EventModal, it saves date as output from FloatingDatePicker, which is typically a local string without Z.
                // It's safer to just slice off the Z or the offset if we have a timezone, but let's see how ZeroHour handles it.
                // We'll just pass the string, date-fns `new Date(string)` handles ISO perfectly.
                // Wait, ZeroHour uses floating-date-picker, which likely expects a format like `2025-12-14T22:53` (from constants).

                let formattedDate = dateStr;
                if (dateStr.includes("T")) {
                     // Extract just the YYYY-MM-DDTHH:mm part
                     formattedDate = dateStr.substring(0, 16);
                } else {
                     formattedDate = `${dateStr}T00:00`;
                }

                return {
                    id: event.id,
                    title: event.summary || "Untitled Event",
                    date: formattedDate,
                    timezone: tz,
                    displayFormat: "default",
                    isPublic: false,
                    category: "Other",
                    googleEventId: event.id,
                    selected: false, // For UI selection
                };
            }).filter(e => e.date); // Exclude events with no date

            setEvents(mappedEvents);
            return mappedEvents;

        } catch (err) {
            console.error(err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return { fetchUpcomingEvents, events, loading, error };
}

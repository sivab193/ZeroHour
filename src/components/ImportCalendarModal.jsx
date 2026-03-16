"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { Loader2, CheckSquare, Square, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export function ImportCalendarModal({ isOpen, onClose, onImport }) {
    const { fetchUpcomingEvents, loading, error } = useGoogleCalendar();
    const [events, setEvents] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [importing, setImporting] = useState(false);

    const loadEvents = async () => {
        const fetchedEvents = await fetchUpcomingEvents();
        if (fetchedEvents && fetchedEvents.length > 0) {
            setEvents(fetchedEvents);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadEvents();
        } else {
            setEvents([]);
            setSelectedIds(new Set());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const toggleSelection = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectAll = () => {
        if (selectedIds.size === events.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(events.map(e => e.id)));
        }
    };

    const handleImport = async () => {
        setImporting(true);
        const selectedEvents = events.filter(e => selectedIds.has(e.id));

        // Strip out temporary UI fields before passing back
        const eventsToImport = selectedEvents.map(e => {
            const { googleEventId, selected, id, ...cleanEvent } = e;
            return cleanEvent;
        });

        await onImport(eventsToImport);
        setImporting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import from Google Calendar">
            <div className="space-y-4">
                {error ? (
                    <div className="text-sm text-red-500 bg-red-500/10 p-4 rounded-xl border border-red-500/20 text-center">
                        <p>{error}</p>
                        <button
                            onClick={loadEvents}
                            className="mt-3 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 text-zinc-400">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        <p className="text-sm">Fetching your calendar...</p>
                    </div>
                ) : events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Calendar className="w-12 h-12 text-zinc-600 mb-4" />
                        <p className="text-zinc-400 text-sm">No upcoming events found in your primary calendar.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-sm font-medium text-foreground">
                                {events.length} event{events.length !== 1 && 's'} found
                            </span>
                            <button
                                type="button"
                                onClick={selectAll}
                                className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                            >
                                {selectedIds.size === events.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {events.map((event) => (
                                <div
                                    key={event.id}
                                    onClick={() => toggleSelection(event.id)}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                                        selectedIds.has(event.id)
                                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                            : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
                                    )}
                                >
                                    <div className="shrink-0 text-emerald-500">
                                        {selectedIds.has(event.id) ? (
                                            <CheckSquare className="w-5 h-5" />
                                        ) : (
                                            <Square className="w-5 h-5 text-zinc-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{event.title}</p>
                                        <p className="text-xs text-zinc-500 mt-0.5">
                                            {format(new Date(event.date), "MMM d, yyyy 'at' h:mm a")} • {event.timezone}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleImport}
                                disabled={selectedIds.size === 0 || importing}
                                className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2"
                            >
                                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import Selected"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

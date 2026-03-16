"use client";

import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Trash2 } from "lucide-react";
import { COMMON_TIMEZONES } from "@/lib/constants";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { FloatingDatePicker } from "@/components/ui/floating-date-picker";
import { cn } from "@/lib/utils";

const inputStyles = "w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all";
const selectStyles = "w-full p-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/30 transition-all appearance-none cursor-pointer";

export function EventModal({ isOpen, onClose, onSave, onDelete, event }) {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [displayFormat, setDisplayFormat] = useState("default");
    const [isPublic, setIsPublic] = useState(false);
    const [category, setCategory] = useState("Other");

    const CATEGORIES = ["Other", "Birthdays", "Movies", "Work", "Vacations", "Anniversaries", "Academic and exam"];

    useEffect(() => {
        if (event) {
            setTitle(event.title);
            setDate(event.date);
            setTimezone(event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
            setDisplayFormat(event.displayFormat || "default");
            setIsPublic(event.isPublic || false);
            setCategory(event.category || "Other");
        } else {
            setTitle("");
            setDate("");
            setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
            setDisplayFormat("default");
            setIsPublic(false);
            setCategory("Other");
        }
    }, [event, isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            id: event?.id,
            title,
            date,
            timezone,
            displayFormat,
            isPublic,
            category,
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={event ? "Edit Event" : "Add Event"}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className={inputStyles}
                        placeholder="Event name"
                        required
                    />
                </div>
                <div className="pt-6">
                    <FloatingDatePicker value={date} onChange={setDate} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Timezone</label>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className={selectStyles}
                    >
                        {COMMON_TIMEZONES.map((tz) => (
                            <option key={tz.value} value={tz.value} className="bg-zinc-900 text-white">
                                {tz.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Display Format</label>
                    <select
                        value={displayFormat}
                        onChange={(e) => setDisplayFormat(e.target.value)}
                        className={selectStyles}
                    >
                        <option value="default" className="bg-zinc-900 text-white">Default (Days/Hrs/Min/Sec)</option>
                        <option value="weeks" className="bg-zinc-900 text-white">Weeks (Wks/Days/Hrs/Min/Sec)</option>
                        <option value="months" className="bg-zinc-900 text-white">Months (Mths/Days/Hrs/Min/Sec)</option>
                        <option value="days_only" className="bg-zinc-900 text-white">Total Days Only</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1.5 text-foreground">Category</label>
                    <input
                        type="text"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className={inputStyles}
                        placeholder="e.g. Vacation"
                        maxLength={30}
                    />
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {CATEGORIES.map((cat) => (
                            <button
                                type="button"
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={cn(
                                    "text-[10px] px-2.5 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                                    category === cat
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                        : "bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-3 py-1">
                    <input
                        type="checkbox"
                        id="isPublic"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                        className="w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/50 focus:ring-offset-0 accent-emerald-500"
                    />
                    <label htmlFor="isPublic" className="text-sm font-medium text-foreground">
                        Public Event (Visible on your public profile)
                    </label>
                </div>
                <div className="flex justify-between items-center pt-4">
                    {event && onDelete ? (
                        <button
                            type="button"
                            onClick={() => {
                                onDelete(event.id);
                                onClose();
                            }}
                            className="text-red-400 hover:bg-red-500/10 p-2.5 rounded-xl transition-colors"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    ) : (
                        <div />
                    )}
                    <button
                        type="submit"
                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20"
                    >
                        Save
                    </button>
                </div>
            </form>
        </Modal>
    );
}

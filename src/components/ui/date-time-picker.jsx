"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button"; // I'll need a button component too, or standard HTML button styled
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export function DateTimePicker({ date, setDate }) {
    const [selectedDate, setSelectedDate] = React.useState(
        date ? new Date(date) : undefined
    );

    // Update internal state if prop changes
    React.useEffect(() => {
        if (date && !isNaN(new Date(date).getTime())) {
            setSelectedDate(new Date(date));
        }
    }, [date]);

    const handleDateSelect = (day) => {
        if (!day) return; // User unselected a day

        const newDate = new Date(day);
        // Preserve time from current selection if exists
        if (selectedDate) {
            newDate.setHours(selectedDate.getHours());
            newDate.setMinutes(selectedDate.getMinutes());
        } else {
            // Default to current time if no previous selection
            const now = new Date();
            newDate.setHours(now.getHours());
            newDate.setMinutes(now.getMinutes());
        }

        setSelectedDate(newDate);
        // Convert to ISO string for parent "YYYY-MM-DDTHH:mm"
        setDate(format(newDate, "yyyy-MM-dd'T'HH:mm"));
    };

    const handleTimeChange = (type, value) => {
        if (!selectedDate) return;
        const newDate = new Date(selectedDate);
        if (type === "hour") newDate.setHours(parseInt(value));
        if (type === "minute") newDate.setMinutes(parseInt(value));

        setSelectedDate(newDate);
        setDate(format(newDate, "yyyy-MM-dd'T'HH:mm"));
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <button
                    className={cn(
                        "w-full justify-start text-left font-normal flex items-center gap-2 p-2 rounded-lg border bg-background hover:bg-accent hover:text-accent-foreground transition-colors",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                        format(selectedDate, "PPP p")
                    ) : (
                        <span>Pick a date</span>
                    )}
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    initialFocus
                />
                <div className="p-3 border-t border-border">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Time</span>
                        <div className="ml-auto flex items-center gap-1">
                            <select
                                className="bg-transparent border rounded p-1 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={selectedDate ? selectedDate.getHours() : 0}
                                onChange={(e) => handleTimeChange("hour", e.target.value)}
                            >
                                {Array.from({ length: 24 }).map((_, i) => (
                                    <option key={i} value={i} className="bg-zinc-900 text-white">
                                        {i.toString().padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                            <span>:</span>
                            <select
                                className="bg-transparent border rounded p-1 text-sm focus:ring-2 focus:ring-primary outline-none"
                                value={selectedDate ? selectedDate.getMinutes() : 0}
                                onChange={(e) => handleTimeChange("minute", e.target.value)}
                            >
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <option key={i * 15} value={i * 15} className="bg-zinc-900 text-white">
                                        {(i * 15).toString().padStart(2, '0')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}


import { performance } from 'perf_hooks';

const itemCount = 10000;
const iterations = 1000;
const categories = ["Birthdays", "Movies", "Work", "Vacations", "Anniversaries", "Other"];
const filterCategory = "Work";

const events = Array.from({ length: itemCount }, (_, i) => ({
    id: i,
    category: categories[i % categories.length],
    date: new Date().toISOString(),
}));

console.log(`Benchmarking with ${itemCount} items and ${iterations} iterations...`);

// Baseline: Repeated filtering
const startBaseline = performance.now();
for (let i = 0; i < iterations; i++) {
    const isEmpty = events.filter(e => filterCategory === "All" || (e.category || "Other") === filterCategory).length === 0;
    if (!isEmpty) {
        const mapped = events
            .filter(e => filterCategory === "All" || (e.category || "Other") === filterCategory)
            .map(e => e.id);
    }
}
const endBaseline = performance.now();
const baselineTime = endBaseline - startBaseline;
console.log(`Baseline (repeated filtering): ${baselineTime.toFixed(2)}ms`);

// Optimized: Single filtering
const startOptimized = performance.now();
for (let i = 0; i < iterations; i++) {
    const filteredEvents = events.filter(e => filterCategory === "All" || (e.category || "Other") === filterCategory);
    const isEmpty = filteredEvents.length === 0;
    if (!isEmpty) {
        const mapped = filteredEvents.map(e => e.id);
    }
}
const endOptimized = performance.now();
const optimizedTime = endOptimized - startOptimized;
console.log(`Optimized (single filtering): ${optimizedTime.toFixed(2)}ms`);

const improvement = ((baselineTime - optimizedTime) / baselineTime) * 100;
console.log(`Improvement: ${improvement.toFixed(2)}%`);

/** Wspólna „dziś” dla całej aplikacji — bez hardkodowanych dat symulacji. */
export function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

export function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

export function daysUntil(dateStr) {
    if (!dateStr) return null;
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    const today = getToday();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

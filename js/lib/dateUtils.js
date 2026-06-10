/** Wspólna „dziś” dla całej aplikacji — bez hardkodowanych dat symulacji. */
export function getToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

/** ISO YYYY-MM-DD w lokalnej strefie czasowej (bez przesunięć UTC). */
export function toLocalISO(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function parseISODateLocal(dateStr) {
    if (!dateStr) return getToday();
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function getTodayISO() {
    return toLocalISO(getToday());
}

export function daysUntil(dateStr) {
    if (!dateStr) return null;
    const due = parseISODateLocal(dateStr);
    due.setHours(0, 0, 0, 0);
    const today = getToday();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

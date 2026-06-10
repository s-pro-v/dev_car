/**
 * Popularne marki samochodów (PL) — nazwy kanoniczne + aliasy wyszukiwania.
 */

export const VEHICLE_BRANDS = [
    { name: 'Volkswagen', aliases: ['vw', 'volks'] },
    { name: 'Audi', aliases: [] },
    { name: 'Skoda', aliases: ['škoda'] },
    { name: 'Seat', aliases: [] },
    { name: 'Cupra', aliases: [] },
    { name: 'BMW', aliases: [] },
    { name: 'Mercedes-Benz', aliases: ['mercedes', 'merc', 'mb'] },
    { name: 'Opel', aliases: [] },
    { name: 'Ford', aliases: [] },
    { name: 'Toyota', aliases: [] },
    { name: 'Lexus', aliases: [] },
    { name: 'Hyundai', aliases: [] },
    { name: 'Kia', aliases: [] },
    { name: 'Genesis', aliases: [] },
    { name: 'Renault', aliases: [] },
    { name: 'Dacia', aliases: [] },
    { name: 'Peugeot', aliases: [] },
    { name: 'Citroën', aliases: ['citroen'] },
    { name: 'DS Automobiles', aliases: ['ds'] },
    { name: 'Fiat', aliases: [] },
    { name: 'Alfa Romeo', aliases: ['alfa'] },
    { name: 'Jeep', aliases: [] },
    { name: 'Nissan', aliases: [] },
    { name: 'Mazda', aliases: [] },
    { name: 'Honda', aliases: [] },
    { name: 'Suzuki', aliases: [] },
    { name: 'Mitsubishi', aliases: [] },
    { name: 'Subaru', aliases: [] },
    { name: 'Volvo', aliases: [] },
    { name: 'Land Rover', aliases: [] },
    { name: 'Jaguar', aliases: [] },
    { name: 'Mini', aliases: [] },
    { name: 'Porsche', aliases: [] },
    { name: 'Tesla', aliases: [] },
    { name: 'Chevrolet', aliases: ['chevy'] },
    { name: 'Chrysler', aliases: [] },
    { name: 'Saab', aliases: [] },
    { name: 'Smart', aliases: [] },
    { name: 'Lancia', aliases: [] },
    { name: 'SsangYong', aliases: ['ssangyong', 'ssang yong'] },
    { name: 'Isuzu', aliases: [] },
    { name: 'Iveco', aliases: [] }
];

function normalizeQuery(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function brandSearchKey(brand) {
    return normalizeQuery([brand.name, ...brand.aliases].join(' '));
}

export function filterBrands(query, limit = 8) {
    const q = normalizeQuery(query);
    if (!q) {
        return VEHICLE_BRANDS.slice(0, limit).map(b => b.name);
    }

    const scored = VEHICLE_BRANDS.map(brand => {
        const nameNorm = normalizeQuery(brand.name);
        const key = brandSearchKey(brand);
        let score = 0;

        if (nameNorm === q) score = 100;
        else if (nameNorm.startsWith(q)) score = 80;
        else if (key.includes(q)) score = 60;
        else if (brand.aliases.some(alias => normalizeQuery(alias).startsWith(q))) score = 70;

        return { name: brand.name, score };
    })
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'pl'));

    return scored.slice(0, limit).map(entry => entry.name);
}

export function resolveBrandName(input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return '';

    const q = normalizeQuery(trimmed);
    const exact = VEHICLE_BRANDS.find(brand => normalizeQuery(brand.name) === q);
    if (exact) return exact.name;

    const aliasMatch = VEHICLE_BRANDS.find(brand =>
        brand.aliases.some(alias => normalizeQuery(alias) === q)
    );
    if (aliasMatch) return aliasMatch.name;

    const startsWith = VEHICLE_BRANDS.find(brand => normalizeQuery(brand.name).startsWith(q));
    if (startsWith && q.length >= 2) return startsWith.name;

    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

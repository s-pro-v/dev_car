import { resolveBrandName } from './vehicleBrands.js';

function normalizeQuery(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

export const VEHICLE_MODELS = {
    Volkswagen: [
        'Golf VII', 'Golf VIII', 'Passat B8', 'Passat B9', 'Polo', 'Tiguan', 'Tiguan Allspace',
        'Touareg', 'T-Roc', 'T-Cross', 'Taigo', 'Arteon', 'Touran', 'Sharan', 'Caddy', 'Transporter',
        'Multivan', 'Amarok', 'ID.3', 'ID.4', 'ID.5', 'ID.7', 'Up!'
    ],
    Audi: [
        'A1', 'A3', 'A4 B9', 'A4 B10', 'A5', 'A6 C8', 'A6 C9', 'A7', 'A8', 'Q2', 'Q3', 'Q4 e-tron',
        'Q5', 'Q7', 'Q8', 'e-tron', 'e-tron GT', 'TT', 'R8'
    ],
    Skoda: [
        'Fabia III', 'Fabia IV', 'Scala', 'Rapid', 'Octavia III', 'Octavia IV', 'Superb III', 'Superb IV',
        'Kamiq', 'Karoq', 'Kodiaq', 'Enyaq', 'Enyaq Coupé', 'Citigo'
    ],
    Seat: [
        'Ibiza', 'Leon III', 'Leon IV', 'Arona', 'Ateca', 'Tarraco', 'Alhambra', 'Mii'
    ],
    Cupra: [
        'Formentor', 'Born', 'Leon', 'Ateca', 'Terramar', 'Tavascan'
    ],
    BMW: [
        'Seria 1', 'Seria 2', 'Seria 3', 'Seria 4', 'Seria 5', 'Seria 6', 'Seria 7', 'Seria 8',
        'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'XM', 'Z4', 'i3', 'i4', 'i5', 'i7', 'iX', 'iX1', 'iX2', 'iX3'
    ],
    'Mercedes-Benz': [
        'Klasa A', 'Klasa B', 'Klasa C', 'Klasa E', 'Klasa S', 'CLA', 'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Klasa',
        'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'AMG GT', 'V-Klasa', 'Citan', 'Sprinter'
    ],
    Opel: [
        'Corsa', 'Astra', 'Astra Sports Tourer', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Zafira', 'Frontera'
    ],
    Ford: [
        'Fiesta', 'Focus', 'Mondeo', 'Puma', 'Kuga', 'Edge', 'Explorer', 'Mustang', 'Mustang Mach-E',
        'Ranger', 'Transit', 'Transit Custom', 'Tourneo Connect', 'Galaxy', 'S-Max'
    ],
    Toyota: [
        'Yaris', 'Yaris Cross', 'Corolla', 'Corolla Cross', 'C-HR', 'RAV4', 'Highlander', 'Camry', 'Prius',
        'Aygo X', 'Land Cruiser', 'Hilux', 'Proace', 'bZ4X'
    ],
    Lexus: [
        'UX', 'NX', 'RX', 'RZ', 'ES', 'IS', 'LS', 'LC', 'LBX'
    ],
    Hyundai: [
        'i10', 'i20', 'i30', 'i30 N', 'Bayon', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq 5', 'Ioniq 6', 'Ioniq 7', 'Staria'
    ],
    Kia: [
        'Picanto', 'Rio', 'Ceed', 'XCeed', 'Stonic', 'Niro', 'Sportage', 'Sorento', 'EV6', 'EV9', 'Carnival'
    ],
    Genesis: [
        'G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'
    ],
    Renault: [
        'Clio', 'Captur', 'Megane', 'Megane E-Tech', 'Arkana', 'Austral', 'Kadjar', 'Scenic E-Tech', 'Talisman',
        'Kangoo', 'Trafic', 'Master', 'Zoe'
    ],
    Dacia: [
        'Sandero', 'Sandero Stepway', 'Logan', 'Duster', 'Jogger', 'Spring', 'Lodgy', 'Dokker'
    ],
    Peugeot: [
        '208', '2008', '308', '308 SW', '3008', '408', '5008', '508', '508 SW', 'Rifter', 'Partner', 'Traveller', 'e-208', 'e-2008'
    ],
    Citroën: [
        'C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'SpaceTourer', 'Ami', 'ë-C4'
    ],
    'DS Automobiles': [
        'DS 3', 'DS 4', 'DS 7', 'DS 9', 'DS 3 Crossback', 'DS 7 Crossback'
    ],
    Fiat: [
        '500', '500e', 'Panda', 'Tipo', 'Tipo Cross', '500X', '500L', 'Doblo', 'Ducato', 'Scudo'
    ],
    'Alfa Romeo': [
        'Giulietta', 'Giulia', 'Stelvio', 'Tonale', 'MiTo'
    ],
    Jeep: [
        'Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Avenger'
    ],
    Nissan: [
        'Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Navara', 'Townstar'
    ],
    Mazda: [
        'Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-80', 'MX-5', 'MX-30'
    ],
    Honda: [
        'Jazz', 'Civic', 'Civic Type R', 'HR-V', 'CR-V', 'ZR-V', 'e:Ny1', 'Accord'
    ],
    Suzuki: [
        'Swift', 'Ignis', 'Vitara', 'S-Cross', 'Jimny', 'Across', 'Swace'
    ],
    Mitsubishi: [
        'Space Star', 'Colt', 'ASX', 'Eclipse Cross', 'Outlander', 'L200'
    ],
    Subaru: [
        'Impreza', 'Legacy', 'Outback', 'Forester', 'XV', 'Levorg', 'BRZ', 'Solterra'
    ],
    Volvo: [
        'V40', 'V60', 'V90', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX90', 'EM90'
    ],
    'Land Rover': [
        'Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque'
    ],
    Jaguar: [
        'XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type'
    ],
    Mini: [
        'Mini 3-drzwiowe', 'Mini 5-drzwiowe', 'Mini Clubman', 'Mini Countryman', 'Mini Cabrio', 'Mini Electric'
    ],
    Porsche: [
        '911', '718 Boxster', '718 Cayman', 'Panamera', 'Macan', 'Cayenne', 'Taycan'
    ],
    Tesla: [
        'Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck'
    ],
    Chevrolet: [
        'Spark', 'Aveo', 'Cruze', 'Malibu', 'Trax', 'Captiva', 'Orlando'
    ],
    Chrysler: [
        '300C', 'Pacifica', 'Voyager'
    ],
    Saab: [
        '9-3', '9-5', '9-4X'
    ],
    Smart: [
        '#1', '#3', 'Fortwo', 'Forfour'
    ],
    Lancia: [
        'Ypsilon', 'Delta', 'Thema'
    ],
    SsangYong: [
        'Tivoli', 'Korando', 'Rexton', 'Musso', 'Torres'
    ],
    Isuzu: [
        'D-Max', 'MU-X'
    ],
    Iveco: [
        'Daily', 'Eurocargo'
    ]
};

export function getModelsForBrand(brandInput) {
    const brand = resolveBrandName(brandInput);
    return VEHICLE_MODELS[brand] || [];
}

export function filterModels(brandInput, query, limit = 8) {
    const models = getModelsForBrand(brandInput);
    const q = normalizeQuery(query);

    if (!models.length) {
        return [];
    }

    if (!q) {
        return models.slice(0, limit);
    }

    const scored = models.map(name => {
        const nameNorm = normalizeQuery(name);
        let score = 0;
        if (nameNorm === q) score = 100;
        else if (nameNorm.startsWith(q)) score = 80;
        else if (nameNorm.includes(q)) score = 60;
        return { name, score };
    })
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'pl'));

    return scored.slice(0, limit).map(entry => entry.name);
}

export function resolveModelName(brandInput, input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return '';

    const models = getModelsForBrand(brandInput);
    const q = normalizeQuery(trimmed);

    const exact = models.find(model => normalizeQuery(model) === q);
    if (exact) return exact;

    const startsWith = models.find(model => normalizeQuery(model).startsWith(q));
    if (startsWith && q.length >= 2) return startsWith;

    return trimmed.replace(/\s+/g, ' ');
}

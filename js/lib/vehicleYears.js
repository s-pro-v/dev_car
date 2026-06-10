import { resolveBrandName } from './vehicleBrands.js';
import { resolveModelName } from './vehicleModels.js';

const CURRENT_YEAR = new Date().getFullYear();

function normalizeQuery(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function buildRange(from, to = CURRENT_YEAR) {
    const years = [];
    for (let year = to; year >= from; year -= 1) {
        years.push(year);
    }
    return years;
}

function assignModels(map, models, years) {
    models.forEach(model => {
        map[model] = years;
    });
}

/** Typowe zakresy produkcji — lata malejąco (najnowsze pierwsze). */
const Y = {
    recent: buildRange(2018),
    mid: buildRange(2012, 2022),
    older: buildRange(2005, 2018),
    classic: buildRange(1995, 2012),
    van: buildRange(2010),
    evRecent: buildRange(2020),
    pickup: buildRange(2012),
    luxury: buildRange(2015),
    default: buildRange(2003)
};

function buildVolkswagen() {
    const m = { _default: Y.default };
    assignModels(m, ['Golf VII'], buildRange(2012, 2019));
    assignModels(m, ['Golf VIII'], buildRange(2020));
    assignModels(m, ['Passat B8'], buildRange(2014, 2023));
    assignModels(m, ['Passat B9'], buildRange(2023));
    assignModels(m, ['Polo'], buildRange(2017));
    assignModels(m, ['Tiguan', 'Tiguan Allspace'], buildRange(2016));
    assignModels(m, ['T-Roc'], buildRange(2017));
    assignModels(m, ['T-Cross', 'Taigo'], buildRange(2019));
    assignModels(m, ['Touareg'], buildRange(2018));
    assignModels(m, ['Arteon'], buildRange(2017));
    assignModels(m, ['Touran'], buildRange(2015));
    assignModels(m, ['Sharan'], buildRange(2010, 2022));
    assignModels(m, ['ID.3', 'ID.4', 'ID.5', 'ID.7'], Y.evRecent);
    assignModels(m, ['Up!'], buildRange(2011, 2023));
    assignModels(m, ['Caddy', 'Transporter', 'Multivan'], Y.van);
    m.Amarok = Y.pickup;
    return m;
}

function buildAudi() {
    const m = { _default: Y.recent };
    assignModels(m, ['A1'], buildRange(2018));
    assignModels(m, ['A3'], buildRange(2012));
    assignModels(m, ['A4 B9'], buildRange(2015, 2023));
    assignModels(m, ['A4 B10'], buildRange(2024));
    assignModels(m, ['A5'], buildRange(2016));
    assignModels(m, ['A6 C8'], buildRange(2018, 2024));
    assignModels(m, ['A6 C9'], buildRange(2025));
    assignModels(m, ['A7'], buildRange(2018));
    assignModels(m, ['A8'], buildRange(2017));
    assignModels(m, ['Q2'], buildRange(2016));
    assignModels(m, ['Q3'], buildRange(2011));
    assignModels(m, ['Q5'], buildRange(2017));
    assignModels(m, ['Q7'], buildRange(2015));
    assignModels(m, ['Q8'], buildRange(2018));
    assignModels(m, ['Q4 e-tron', 'e-tron', 'e-tron GT'], Y.evRecent);
    assignModels(m, ['TT'], buildRange(2014, 2023));
    m.R8 = buildRange(2015);
    return m;
}

function buildSkoda() {
    const m = { _default: Y.recent };
    assignModels(m, ['Fabia III'], buildRange(2014, 2021));
    assignModels(m, ['Fabia IV'], buildRange(2021));
    assignModels(m, ['Octavia III'], buildRange(2013, 2020));
    assignModels(m, ['Octavia IV'], buildRange(2020));
    assignModels(m, ['Superb III'], buildRange(2015, 2023));
    assignModels(m, ['Superb IV'], buildRange(2024));
    assignModels(m, ['Scala', 'Kamiq', 'Karoq', 'Kodiaq'], buildRange(2017));
    assignModels(m, ['Enyaq', 'Enyaq Coupé'], Y.evRecent);
    assignModels(m, ['Rapid'], buildRange(2012, 2023));
    assignModels(m, ['Citigo'], buildRange(2011, 2023));
    return m;
}

function buildSeatCupra() {
    const m = { _default: Y.recent };
    assignModels(m, ['Ibiza'], buildRange(2017));
    assignModels(m, ['Leon III'], buildRange(2012, 2020));
    assignModels(m, ['Leon IV', 'Leon'], buildRange(2020));
    assignModels(m, ['Arona', 'Ateca', 'Tarraco', 'Formentor', 'Terramar'], buildRange(2016));
    assignModels(m, ['Born', 'Tavascan'], Y.evRecent);
    assignModels(m, ['Alhambra'], buildRange(2010, 2020));
    assignModels(m, ['Mii'], buildRange(2011, 2021));
    return m;
}

function buildBmw() {
    const m = { _default: Y.recent };
    assignModels(m, ['Seria 1', 'Seria 2', 'X1', 'X2'], buildRange(2019));
    assignModels(m, ['Seria 3', 'Seria 4'], buildRange(2012));
    assignModels(m, ['Seria 5', 'Seria 6', 'Seria 7', 'Seria 8'], buildRange(2017));
    assignModels(m, ['X3', 'X4', 'X5', 'X6', 'X7', 'XM'], buildRange(2018));
    assignModels(m, ['i3'], buildRange(2013, 2022));
    assignModels(m, ['i4', 'i5', 'i7', 'iX', 'iX1', 'iX2', 'iX3'], Y.evRecent);
    m.Z4 = buildRange(2018);
    return m;
}

function buildMercedes() {
    const m = { _default: Y.recent };
    assignModels(m, ['Klasa A', 'Klasa B', 'CLA'], buildRange(2018));
    assignModels(m, ['Klasa C'], buildRange(2014));
    assignModels(m, ['Klasa E'], buildRange(2016));
    assignModels(m, ['Klasa S'], buildRange(2013));
    assignModels(m, ['CLS'], buildRange(2018, 2023));
    assignModels(m, ['GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Klasa'], buildRange(2019));
    assignModels(m, ['EQA', 'EQB', 'EQC', 'EQE', 'EQS'], Y.evRecent);
    assignModels(m, ['V-Klasa', 'Citan', 'Sprinter'], Y.van);
    m['AMG GT'] = buildRange(2014);
    return m;
}

function buildGenericRecent(models) {
    return Object.fromEntries(models.map(name => [name, Y.recent]));
}

export const VEHICLE_YEARS = {
    Volkswagen: buildVolkswagen(),
    Audi: buildAudi(),
    Skoda: buildSkoda(),
    Seat: buildSeatCupra(),
    Cupra: buildSeatCupra(),
    BMW: buildBmw(),
    'Mercedes-Benz': buildMercedes(),
    Opel: buildGenericRecent(['Corsa', 'Astra', 'Astra Sports Tourer', 'Insignia', 'Mokka', 'Crossland', 'Grandland', 'Combo', 'Zafira', 'Frontera']),
    Ford: buildGenericRecent(['Fiesta', 'Focus', 'Mondeo', 'Puma', 'Kuga', 'Edge', 'Explorer', 'Mustang', 'Mustang Mach-E', 'Ranger', 'Transit', 'Transit Custom', 'Tourneo Connect', 'Galaxy', 'S-Max']),
    Toyota: buildGenericRecent(['Yaris', 'Yaris Cross', 'Corolla', 'Corolla Cross', 'C-HR', 'RAV4', 'Highlander', 'Camry', 'Prius', 'Aygo X', 'Land Cruiser', 'Hilux', 'Proace', 'bZ4X']),
    Lexus: buildGenericRecent(['UX', 'NX', 'RX', 'RZ', 'ES', 'IS', 'LS', 'LC', 'LBX']),
    Hyundai: buildGenericRecent(['i10', 'i20', 'i30', 'i30 N', 'Bayon', 'Kona', 'Tucson', 'Santa Fe', 'Ioniq 5', 'Ioniq 6', 'Ioniq 7', 'Staria']),
    Kia: buildGenericRecent(['Picanto', 'Rio', 'Ceed', 'XCeed', 'Stonic', 'Niro', 'Sportage', 'Sorento', 'EV6', 'EV9', 'Carnival']),
    Genesis: buildGenericRecent(['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80']),
    Renault: buildGenericRecent(['Clio', 'Captur', 'Megane', 'Megane E-Tech', 'Arkana', 'Austral', 'Kadjar', 'Scenic E-Tech', 'Talisman', 'Kangoo', 'Trafic', 'Master', 'Zoe']),
    Dacia: buildGenericRecent(['Sandero', 'Sandero Stepway', 'Logan', 'Duster', 'Jogger', 'Spring', 'Lodgy', 'Dokker']),
    Peugeot: buildGenericRecent(['208', '2008', '308', '308 SW', '3008', '408', '5008', '508', '508 SW', 'Rifter', 'Partner', 'Traveller', 'e-208', 'e-2008']),
    Citroën: buildGenericRecent(['C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'SpaceTourer', 'Ami', 'ë-C4']),
    'DS Automobiles': buildGenericRecent(['DS 3', 'DS 4', 'DS 7', 'DS 9', 'DS 3 Crossback', 'DS 7 Crossback']),
    Fiat: buildGenericRecent(['500', '500e', 'Panda', 'Tipo', 'Tipo Cross', '500X', '500L', 'Doblo', 'Ducato', 'Scudo']),
    'Alfa Romeo': buildGenericRecent(['Giulietta', 'Giulia', 'Stelvio', 'Tonale', 'MiTo']),
    Jeep: buildGenericRecent(['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Avenger']),
    Nissan: buildGenericRecent(['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Navara', 'Townstar']),
    Mazda: buildGenericRecent(['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'CX-80', 'MX-5', 'MX-30']),
    Honda: buildGenericRecent(['Jazz', 'Civic', 'Civic Type R', 'HR-V', 'CR-V', 'ZR-V', 'e:Ny1', 'Accord']),
    Suzuki: buildGenericRecent(['Swift', 'Ignis', 'Vitara', 'S-Cross', 'Jimny', 'Across', 'Swace']),
    Mitsubishi: buildGenericRecent(['Space Star', 'Colt', 'ASX', 'Eclipse Cross', 'Outlander', 'L200']),
    Subaru: buildGenericRecent(['Impreza', 'Legacy', 'Outback', 'Forester', 'XV', 'Levorg', 'BRZ', 'Solterra']),
    Volvo: buildGenericRecent(['V40', 'V60', 'V90', 'S60', 'S90', 'XC40', 'XC60', 'XC90', 'C40', 'EX30', 'EX90', 'EM90']),
    'Land Rover': buildGenericRecent(['Defender', 'Discovery', 'Discovery Sport', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque']),
    Jaguar: buildGenericRecent(['XE', 'XF', 'XJ', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type']),
    Mini: buildGenericRecent(['Mini 3-drzwiowe', 'Mini 5-drzwiowe', 'Mini Clubman', 'Mini Countryman', 'Mini Cabrio', 'Mini Electric']),
    Porsche: buildGenericRecent(['911', '718 Boxster', '718 Cayman', 'Panamera', 'Macan', 'Cayenne', 'Taycan']),
    Tesla: buildGenericRecent(['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck']),
    Chevrolet: { _default: Y.mid },
    Chrysler: { _default: Y.mid },
    Saab: { _default: Y.classic },
    Smart: { _default: buildRange(2014) },
    Lancia: { _default: Y.older },
    SsangYong: { _default: Y.mid },
    Isuzu: { _default: Y.pickup },
    Iveco: { _default: Y.van }
};

Object.values(VEHICLE_YEARS).forEach(brandMap => {
    if (!brandMap._default) {
        brandMap._default = Y.default;
    }
});

function findModelKey(brandMap, model) {
    if (!model || !brandMap) return null;
    if (brandMap[model]) return model;

    const q = normalizeQuery(model);
    const keys = Object.keys(brandMap).filter(k => k !== '_default');

    const exact = keys.find(k => normalizeQuery(k) === q);
    if (exact) return exact;

    const starts = keys.find(k => normalizeQuery(k).startsWith(q) || q.startsWith(normalizeQuery(k)));
    if (starts) return starts;

    return keys.find(k => {
        const kn = normalizeQuery(k);
        return kn.includes(q) || q.includes(kn);
    }) || null;
}

export function getYearsForVehicle(brandInput, modelInput) {
    const brand = resolveBrandName(brandInput);
    const model = resolveModelName(brandInput, modelInput);
    const brandMap = VEHICLE_YEARS[brand];

    if (!brandMap) return Y.default;
    if (!model) return brandMap._default || Y.default;

    const key = findModelKey(brandMap, model);
    if (key) return brandMap[key];

    return brandMap._default || Y.default;
}

export function filterYears(brandInput, modelInput, query, limit = 8) {
    const years = getYearsForVehicle(brandInput, modelInput);
    const q = String(query || '').trim();

    if (!q) return years.slice(0, limit);

    const matched = years.filter(year => String(year).startsWith(q));
    return matched.slice(0, limit);
}

export function resolveYear(brandInput, modelInput, input) {
    const years = getYearsForVehicle(brandInput, modelInput);
    const parsed = parseInt(String(input).trim(), 10);

    if (!parsed || Number.isNaN(parsed)) {
        return years[0] || CURRENT_YEAR;
    }

    if (years.includes(parsed)) return parsed;

    const prefixMatches = years.filter(year => String(year).startsWith(String(parsed)));
    if (prefixMatches.length === 1) return prefixMatches[0];
    if (prefixMatches.length > 1) return prefixMatches[0];

    const min = years[years.length - 1];
    const max = years[0];
    if (parsed < min) return min;
    if (parsed > max) return max;
    return parsed;
}

export function getSuggestedYear(brandInput, modelInput) {
    const years = getYearsForVehicle(brandInput, modelInput);
    return years[0] || CURRENT_YEAR;
}

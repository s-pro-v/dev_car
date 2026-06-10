import { resolveBrandName } from './vehicleBrands.js';
import { resolveModelName } from './vehicleModels.js';

function normalizeQuery(value) {
    return (value || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/** Wspólne zestawy silników — format z mocą ułatwia dopasowanie harmonogramu serwisowego. */
const E = {
    vwSmallTsi: [
        '1.0 TSI (85 KM)', '1.0 TSI (110 KM)', '1.0 TSI (115 KM)',
        '1.2 TSI (90 KM)', '1.4 TSI (125 KM)', '1.5 TSI (130 KM)', '1.5 TSI (150 KM)'
    ],
    vwCompact: [
        '1.0 TSI (110 KM)', '1.5 TSI (130 KM)', '1.5 TSI (150 KM)',
        '2.0 TSI (180 KM)', '2.0 TSI (245 KM) GTI',
        '1.6 TDI (90 KM)', '1.6 TDI (110 KM)', '2.0 TDI (110 KM)', '2.0 TDI (150 KM)', '2.0 TDI (184 KM) GTD'
    ],
    vwMid: [
        '1.5 TSI (150 KM)', '2.0 TSI (190 KM)', '2.0 TSI (280 KM) R',
        '2.0 TDI (122 KM)', '2.0 TDI (150 KM)', '2.0 TDI (190 KM)', '2.0 TDI (240 KM) BiTDI'
    ],
    vwSuv: [
        '1.5 TSI (130 KM)', '1.5 TSI (150 KM)', '2.0 TSI (190 KM)',
        '2.0 TDI (115 KM)', '2.0 TDI (150 KM)', '2.0 TDI (190 KM)', '2.0 TDI (200 KM) 4MOTION'
    ],
    vwEv: ['Elektryczny (150 KM)', 'Elektryczny (204 KM)', 'Elektryczny (286 KM)'],
    vwDsgNote: ['2.0 TDI (150 KM) DSG', '2.0 TFSI (190 KM) S tronic', '1.5 TSI (150 KM) DSG'],
    vagDefault: [
        '1.0 TSI (110 KM)', '1.5 TSI (150 KM)', '2.0 TSI (190 KM)',
        '1.6 TDI (110 KM)', '2.0 TDI (150 KM)', '2.0 TDI (190 KM)'
    ],
    audiCompact: [
        '1.0 TFSI (110 KM)', '1.4 TFSI (150 KM)', '2.0 TFSI (190 KM)', '2.0 TFSI (245 KM)',
        '1.6 TDI (110 KM)', '2.0 TDI (150 KM)', '2.0 TDI (190 KM)'
    ],
    audiMid: [
        '2.0 TFSI (190 KM)', '2.0 TFSI (252 KM)', '2.0 TFSI (265 KM)',
        '2.0 TDI (150 KM)', '2.0 TDI (190 KM)', '3.0 TDI (218 KM)', '3.0 TDI (286 KM)',
        '2.0 TFSI (252 KM) S tronic', '2.0 TDI (150 KM) multitronic'
    ],
    audiSuv: [
        '2.0 TFSI (190 KM)', '2.0 TFSI (252 KM)', '3.0 TFSI (340 KM)',
        '2.0 TDI (150 KM)', '2.0 TDI (190 KM)', '3.0 TDI (249 KM)', '3.0 TDI (286 KM)',
        '2.0 TDI (204 KM) quattro S tronic'
    ],
    audiEv: ['Elektryczny (204 KM)', 'Elektryczny (300 KM)', 'Elektryczny (476 KM) quattro'],
    bmwCompact: [
        '118i (136 KM)', '120i (170 KM)', 'M135i (306 KM)',
        '118d (150 KM)', '120d (190 KM)', '220d (190 KM) xDrive'
    ],
    bmwMid: [
        '320i (184 KM)', '330i (258 KM)', 'M340i (374 KM)',
        '318d (150 KM)', '320d (190 KM)', '330d (265 KM)', '330d (286 KM) xDrive'
    ],
    bmwSuv: [
        'xDrive20i (184 KM)', 'xDrive30i (252 KM)', 'M40i (360 KM)',
        'sDrive18d (150 KM)', 'xDrive20d (190 KM)', 'xDrive30d (265 KM)', 'xDrive40d (340 KM)'
    ],
    bmwEv: ['Elektryczny (204 KM)', 'Elektryczny (286 KM)', 'Elektryczny (400 KM) xDrive'],
    mbCompact: [
        'A180 (136 KM)', 'A200 (163 KM)', 'A250 (224 KM)',
        'A180d (116 KM)', 'A200d (150 KM)', 'A220d (190 KM)'
    ],
    mbMid: [
        'C180 (156 KM)', 'C200 (204 KM)', 'C300 (258 KM)',
        'C220d (194 KM)', 'C300d (265 KM)', 'C400d (330 KM) 4MATIC',
        'C200 9G-Tronic', 'C220d 9G-Tronic automat'
    ],
    mbSuv: [
        'GLA 200 (163 KM)', 'GLA 250 (224 KM)', 'GLC 200 (204 KM)', 'GLC 300 (258 KM)',
        'GLA 200d (150 KM)', 'GLC 220d (194 KM)', 'GLC 300d (265 KM) 4MATIC'
    ],
    mbEv: ['EQA 250+ (190 KM)', 'EQB 300 (228 KM)', 'EQC 400 (408 KM)', 'EQE 350+ (288 KM)'],
    toyotaHybrid: [
        '1.5 Hybrid (116 KM)', '1.8 Hybrid (122 KM)', '2.0 Hybrid (184 KM)', '2.5 Hybrid (218 KM)'
    ],
    toyotaPetrol: ['1.0 VVT-i (72 KM)', '1.33 Dual VVT-i (99 KM)', '1.6 Valvematic (132 KM)', '2.0 Dynamic Force (177 KM)'],
    fordEcoboost: [
        '1.0 EcoBoost (100 KM)', '1.0 EcoBoost (125 KM)', '1.5 EcoBoost (150 KM)', '1.5 EcoBoost (182 KM)',
        '2.0 EcoBoost (245 KM)', '2.0 TDCi (150 KM)', '2.0 TDCi (180 KM)'
    ],
    hyundaiKia: [
        '1.0 T-GDI (100 KM)', '1.4 MPI (100 KM)', '1.5 T-GDI (140 KM)', '1.6 T-GDI (180 KM)',
        '1.6 CRDi (136 KM)', '1.6 CRDi (115 KM)', '2.0 CRDi (185 KM)', 'Elektryczny (204 KM)'
    ],
    renaultDacia: [
        '1.0 SCe (75 KM)', '1.0 TCe (90 KM)', '1.3 TCe (140 KM)', '1.5 dCi (85 KM)', '1.5 dCi (115 KM)',
        '1.5 Blue dCi (115 KM)', 'Elektryczny (120 KM)'
    ],
    psa: [
        '1.2 PureTech (75 KM)', '1.2 PureTech (110 KM)', '1.2 PureTech (130 KM)',
        '1.5 BlueHDi (102 KM)', '1.5 BlueHDi (130 KM)', '1.6 BlueHDi (120 KM)', 'Elektryczny (136 KM)'
    ],
    dieselVan: ['1.6 HDi (90 KM)', '2.0 HDi (150 KM)', '2.0 Multijet (140 KM)', '2.0 TDCi (130 KM)']
};

function assignModels(map, models, engines) {
    models.forEach(model => {
        map[model] = engines;
    });
}

function buildVolkswagen() {
    const m = { _default: E.vagDefault };
    assignModels(m, ['Golf VII', 'Golf VIII'], E.vwCompact);
    assignModels(m, ['Passat B8', 'Passat B9', 'Arteon'], E.vwMid);
    assignModels(m, ['Polo', 'Up!'], E.vwSmallTsi);
    assignModels(m, ['Tiguan', 'Tiguan Allspace', 'T-Roc', 'T-Cross', 'Taigo', 'Touareg'], E.vwSuv);
    assignModels(m, ['Touran', 'Sharan'], [...E.vwMid, '2.0 TDI (150 KM) DSG']);
    assignModels(m, ['ID.3', 'ID.4', 'ID.5', 'ID.7'], E.vwEv);
    assignModels(m, ['Caddy', 'Transporter', 'Multivan'], E.dieselVan);
    m.Amarok = ['2.0 BiTDI (163 KM)', '2.0 BiTDI (180 KM)', '3.0 V6 TDI (224 KM)', '3.0 V6 TDI (258 KM)'];
    return m;
}

function buildAudi() {
    const m = { _default: E.audiMid };
    assignModels(m, ['A1', 'A3', 'Q2'], E.audiCompact);
    assignModels(m, ['A4 B9', 'A4 B10', 'A5', 'A6 C8', 'A6 C9', 'A7', 'A8'], E.audiMid);
    assignModels(m, ['Q3', 'Q5', 'Q7', 'Q8'], E.audiSuv);
    assignModels(m, ['Q4 e-tron', 'e-tron', 'e-tron GT'], E.audiEv);
    m.TT = ['2.0 TFSI (230 KM)', '2.0 TFSI (245 KM) quattro', '2.0 TDI (184 KM)'];
    m.R8 = ['5.2 FSI (570 KM)', '5.2 FSI (620 KM) quattro'];
    return m;
}

function buildSkoda() {
    const m = { _default: E.vagDefault };
    assignModels(m, ['Fabia III', 'Fabia IV', 'Scala', 'Citigo'], E.vwSmallTsi);
    assignModels(m, ['Octavia III', 'Octavia IV', 'Superb III', 'Superb IV', 'Rapid'], E.vwMid);
    assignModels(m, ['Kamiq', 'Karoq', 'Kodiaq'], E.vwSuv);
    assignModels(m, ['Enyaq', 'Enyaq Coupé'], E.vwEv);
    return m;
}

function buildSeatCupra(brand) {
    const m = { _default: E.vagDefault };
    assignModels(m, ['Ibiza', 'Mii'], E.vwSmallTsi);
    assignModels(m, ['Leon III', 'Leon IV', 'Leon', 'Arona'], E.vwCompact);
    assignModels(m, ['Ateca', 'Tarraco', 'Formentor', 'Terramar'], E.vwSuv);
    assignModels(m, ['Alhambra'], E.vwMid);
    assignModels(m, ['Born', 'Tavascan'], E.vwEv);
    if (brand === 'Cupra') {
        m.Formentor = [...E.vwCompact, '2.0 TSI (310 KM) 4Drive', '1.4 e-Hybrid (245 KM)'];
    }
    return m;
}

function buildBmw() {
    const m = { _default: E.bmwMid };
    assignModels(m, ['Seria 1', 'Seria 2', 'X1', 'X2'], E.bmwCompact);
    assignModels(m, ['Seria 3', 'Seria 4', 'Seria 5', 'Seria 6', 'Seria 7', 'Seria 8'], E.bmwMid);
    assignModels(m, ['X3', 'X4', 'X5', 'X6', 'X7', 'XM'], E.bmwSuv);
    assignModels(m, ['i3', 'i4', 'i5', 'i7', 'iX', 'iX1', 'iX2', 'iX3'], E.bmwEv);
    m.Z4 = ['sDrive20i (197 KM)', 'M40i (340 KM)'];
    return m;
}

function buildMercedes() {
    const m = { _default: E.mbMid };
    assignModels(m, ['Klasa A', 'Klasa B', 'CLA'], E.mbCompact);
    assignModels(m, ['Klasa C', 'Klasa E', 'Klasa S', 'CLS'], E.mbMid);
    assignModels(m, ['GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Klasa'], E.mbSuv);
    assignModels(m, ['EQA', 'EQB', 'EQC', 'EQE', 'EQS'], E.mbEv);
    m['AMG GT'] = ['AMG GT 43 (367 KM)', 'AMG GT 63 (639 KM) 4MATIC+'];
    assignModels(m, ['V-Klasa', 'Citan', 'Sprinter'], E.dieselVan);
    return m;
}

function buildToyotaLexus(isLexus) {
    if (isLexus) {
        return {
            _default: [...E.toyotaHybrid, '2.0 Turbo (279 KM)', '3.5 V6 (308 KM)'],
            UX: E.toyotaHybrid,
            NX: [...E.toyotaHybrid, '2.4 Turbo (279 KM)'],
            RX: [...E.toyotaHybrid, '2.4 Turbo (279 KM)', '3.5 V6 (308 KM)'],
            RZ: E.toyotaHybrid,
            ES: E.toyotaHybrid,
            IS: ['IS 300h (223 KM)', '2.0 Turbo (241 KM)'],
            LS: ['LS 500h (359 KM)', '3.5 V6 (466 KM)'],
            LC: ['LC 500 (477 KM)', 'LC 500h (359 KM)'],
            LBX: E.toyotaHybrid
        };
    }
    return {
        _default: E.toyotaHybrid,
        Yaris: E.toyotaHybrid,
        'Yaris Cross': E.toyotaHybrid,
        Corolla: E.toyotaHybrid,
        'Corolla Cross': E.toyotaHybrid,
        'C-HR': E.toyotaHybrid,
        RAV4: [...E.toyotaHybrid, '2.5 Hybrid (222 KM) AWD'],
        Highlander: E.toyotaHybrid,
        Camry: E.toyotaHybrid,
        Prius: E.toyotaHybrid,
        'Aygo X': E.toyotaPetrol,
        'Land Cruiser': ['2.8 D-4D (204 KM)', '3.5 V6 (415 KM)'],
        Hilux: ['2.4 D-4D (150 KM)', '2.8 D-4D (204 KM)'],
        Proace: E.dieselVan,
        bZ4X: E.toyotaHybrid
    };
}

function buildFord() {
    const m = { _default: E.fordEcoboost };
    assignModels(m, ['Fiesta', 'Focus', 'Puma'], E.fordEcoboost);
    m.Mondeo = ['1.5 EcoBoost (160 KM)', '2.0 EcoBoost (240 KM)', '2.0 TDCi (150 KM)', '2.0 TDCi (180 KM)'];
    assignModels(m, ['Kuga', 'Edge', 'Explorer'], [...E.fordEcoboost, '2.5 Hybrid (190 KM)']);
    m.Mustang = ['2.3 EcoBoost (317 KM)', '5.0 V8 (450 KM) GT'];
    m['Mustang Mach-E'] = E.vwEv;
    m.Ranger = ['2.0 EcoBlue (170 KM)', '2.0 Bi-Turbo (205 KM)', '3.0 V6 (240 KM)'];
    assignModels(m, ['Transit', 'Transit Custom', 'Tourneo Connect', 'Galaxy', 'S-Max'], E.dieselVan);
    return m;
}

function buildOpel() {
    const m = { _default: E.psa };
    assignModels(m, ['Corsa', 'Astra', 'Astra Sports Tourer', 'Mokka', 'Crossland', 'Grandland', 'Frontera'], E.psa);
    m.Insignia = E.vwMid;
    assignModels(m, ['Combo', 'Zafira'], E.dieselVan);
    return m;
}

function buildPsaStellantis() {
    return {
        _default: E.psa,
        ...Object.fromEntries(
            ['208', '2008', '308', '308 SW', '3008', '408', '5008', '508', '508 SW', 'Rifter', 'Partner', 'Traveller', 'e-208', 'e-2008',
                'C1', 'C3', 'C3 Aircross', 'C4', 'C4 X', 'C5 Aircross', 'C5 X', 'Berlingo', 'SpaceTourer', 'Ami', 'ë-C4',
                'DS 3', 'DS 4', 'DS 7', 'DS 9', 'DS 3 Crossback', 'DS 7 Crossback',
                '500', '500e', 'Panda', 'Tipo', 'Tipo Cross', '500X', '500L', 'Doblo', 'Ducato', 'Scudo'
            ].map(name => [name, name.includes('e') || name.includes('500e') || name.startsWith('Ami') ? [...E.psa, ...E.vwEv.slice(0, 2)] : E.psa])
        )
    };
}

function buildHyundaiKia(isKia) {
    const m = { _default: E.hyundaiKia };
    if (isKia) {
        assignModels(m, ['Picanto', 'Rio', 'Stonic'], E.hyundaiKia.slice(0, 4));
        assignModels(m, ['Ceed', 'XCeed', 'Niro', 'Sportage', 'Sorento', 'Carnival'], E.hyundaiKia);
        assignModels(m, ['EV6', 'EV9'], E.vwEv);
    } else {
        assignModels(m, ['i10', 'i20', 'Bayon'], E.hyundaiKia.slice(0, 4));
        assignModels(m, ['i30', 'i30 N', 'Kona', 'Tucson', 'Santa Fe', 'Staria'], E.hyundaiKia);
        assignModels(m, ['Ioniq 5', 'Ioniq 6', 'Ioniq 7'], E.vwEv);
    }
    return m;
}

export const VEHICLE_ENGINES = {
    Volkswagen: buildVolkswagen(),
    Audi: buildAudi(),
    Skoda: buildSkoda(),
    Seat: buildSeatCupra('Seat'),
    Cupra: buildSeatCupra('Cupra'),
    BMW: buildBmw(),
    'Mercedes-Benz': buildMercedes(),
    Opel: buildOpel(),
    Ford: buildFord(),
    Toyota: buildToyotaLexus(false),
    Lexus: buildToyotaLexus(true),
    Hyundai: buildHyundaiKia(false),
    Kia: buildHyundaiKia(true),
    Genesis: {
        _default: ['2.0 Turbo (245 KM)', '2.5 Turbo (304 KM)', '3.5 V6 (380 KM)', 'Elektryczny (325 KM)'],
        G70: ['2.0 Turbo (245 KM)', '2.0 Turbo (252 KM) AWD', '2.2 CRDi (210 KM)'],
        G80: ['2.5 Turbo (304 KM)', '3.5 V6 (380 KM)', 'Elektryczny (365 KM)'],
        G90: ['3.5 V6 (380 KM)', '3.5 V6 (415 KM) e-Supercharger'],
        GV60: E.vwEv,
        GV70: ['2.5 Turbo (304 KM)', '2.2 CRDi (210 KM)', 'Elektryczny (325 KM)'],
        GV80: ['2.5 Turbo (304 KM)', '3.5 V6 (380 KM)', '3.0 CRDi (278 KM)']
    },
    Renault: {
        _default: E.renaultDacia,
        ...Object.fromEntries(['Clio', 'Captur', 'Megane', 'Megane E-Tech', 'Arkana', 'Austral', 'Kadjar', 'Scenic E-Tech', 'Talisman', 'Zoe'].map(n => [n, n.includes('E-Tech') || n === 'Zoe' ? [...E.renaultDacia, ...E.vwEv.slice(0, 2)] : E.renaultDacia])),
        Kangoo: E.dieselVan,
        Trafic: E.dieselVan,
        Master: E.dieselVan
    },
    Dacia: {
        _default: E.renaultDacia,
        Sandero: E.renaultDacia,
        'Sandero Stepway': E.renaultDacia,
        Logan: E.renaultDacia,
        Duster: ['1.0 TCe (90 KM)', '1.0 TCe (100 KM)', '1.3 TCe (130 KM)', '1.5 Blue dCi (115 KM)'],
        Jogger: ['1.0 TCe (110 KM)', '1.6 Hybrid (140 KM)'],
        Spring: ['Elektryczny (45 KM)', 'Elektryczny (65 KM)'],
        Lodgy: E.dieselVan,
        Dokker: E.dieselVan
    },
    Peugeot: buildPsaStellantis(),
    Citroën: buildPsaStellantis(),
    'DS Automobiles': buildPsaStellantis(),
    Fiat: buildPsaStellantis(),
    'Alfa Romeo': {
        _default: ['1.4 MultiAir (170 KM)', '2.0 Turbo (200 KM)', '2.2 JTDm (160 KM)', '2.2 JTDm (190 KM)'],
        Giulietta: ['1.4 TB (120 KM)', '1.75 TBi (240 KM)', '2.0 JTDM (150 KM)'],
        Giulia: ['2.0 Turbo (200 KM)', '2.0 Turbo (280 KM)', '2.2 JTDM (190 KM)', '2.9 V6 (510 KM) Quadrifoglio'],
        Stelvio: ['2.0 Turbo (200 KM)', '2.0 Turbo (280 KM)', '2.2 JTDM (210 KM)', '2.9 V6 (510 KM) Quadrifoglio'],
        Tonale: ['1.5 Hybrid (130 KM)', '1.3 PHEV (275 KM)', '2.0 Turbo (268 KM) AWD'],
        MiTo: ['1.4 (78 KM)', '1.4 TB (140 KM)', '1.3 MultiJet (95 KM)']
    },
    Jeep: {
        _default: ['1.0 Turbo (120 KM)', '1.3 Turbo (150 KM)', '2.0 MultiJet (140 KM)', '2.2 MultiJet (200 KM)'],
        Renegade: ['1.0 Turbo (120 KM)', '1.3 Turbo (150 KM)', '1.6 MultiJet (130 KM)', '4xe PHEV (240 KM)'],
        Compass: ['1.3 Turbo (150 KM)', '2.0 MultiJet (170 KM)', '4xe PHEV (240 KM)'],
        Cherokee: ['2.2 MultiJet (200 KM)', '3.2 V6 (272 KM)'],
        'Grand Cherokee': ['3.0 CRD (250 KM)', '3.6 V6 (286 KM)', '2.0 Turbo (272 KM) 4xe'],
        Wrangler: ['2.0 Turbo (272 KM)', '3.6 V6 (284 KM)', '4xe PHEV (380 KM)'],
        Avenger: ['1.2 Turbo (100 KM)', 'Elektryczny (156 KM)']
    },
    Nissan: {
        _default: ['1.0 DIG-T (100 KM)', '1.3 DIG-T (140 KM)', '1.5 dCi (115 KM)', 'Elektryczny (160 KM)'],
        Micra: ['1.0 IG-T (100 KM)', '1.0 IG-T (117 KM)'],
        Juke: ['1.0 DIG-T (117 KM)', '1.6 Hybrid (143 KM)'],
        Qashqai: ['1.3 DIG-T (140 KM)', '1.3 DIG-T (160 KM)', '1.5 e-Power (190 KM)'],
        'X-Trail': ['1.5 e-Power (213 KM)', '1.7 dCi (150 KM)'],
        Leaf: E.vwEv,
        Ariya: E.vwEv,
        Navara: ['2.3 dCi (163 KM)', '2.3 dCi (190 KM)'],
        Townstar: E.dieselVan
    },
    Mazda: {
        _default: ['1.5 Skyactiv-G (90 KM)', '2.0 Skyactiv-G (122 KM)', '2.0 Skyactiv-G (165 KM)', '2.2 Skyactiv-D (150 KM)'],
        Mazda2: ['1.5 Skyactiv-G (90 KM)', '1.5 Skyactiv-G (115 KM)'],
        Mazda3: ['2.0 Skyactiv-G (122 KM)', '2.0 Skyactiv-G (186 KM)', '2.0 e-Skyactiv-X (186 KM)'],
        Mazda6: ['2.0 Skyactiv-G (165 KM)', '2.5 Skyactiv-G (194 KM)', '2.2 Skyactiv-D (184 KM)'],
        'CX-3': ['2.0 Skyactiv-G (121 KM)', '1.8 Skyactiv-D (116 KM)'],
        'CX-30': ['2.0 Skyactiv-G (122 KM)', '2.0 e-Skyactiv-X (186 KM)', '2.2 Skyactiv-D (150 KM)'],
        'CX-5': ['2.0 Skyactiv-G (165 KM)', '2.5 Skyactiv-G (194 KM)', '2.2 Skyactiv-D (150 KM)', '2.2 Skyactiv-D (184 KM)'],
        'CX-60': ['2.5 e-Skyactiv PHEV (327 KM)', '3.3 e-Skyactiv PHEV (394 KM)', '2.2 Skyactiv-D (200 KM)'],
        'CX-80': ['2.5 e-Skyactiv PHEV (327 KM)', '3.3 e-Skyactiv PHEV (394 KM)'],
        'MX-5': ['1.5 Skyactiv-G (132 KM)', '2.0 Skyactiv-G (184 KM)'],
        'MX-30': E.vwEv
    },
    Honda: {
        _default: [...E.toyotaHybrid, '1.0 VTEC Turbo (126 KM)', '1.5 VTEC Turbo (182 KM)'],
        Jazz: E.toyotaHybrid,
        Civic: ['1.0 VTEC Turbo (126 KM)', '1.5 VTEC Turbo (182 KM)', '2.0 Hybrid (184 KM)'],
        'Civic Type R': ['2.0 VTEC Turbo (320 KM)', '2.0 VTEC Turbo (329 KM)'],
        'HR-V': E.toyotaHybrid,
        'CR-V': ['2.0 Hybrid (184 KM)', '2.0 i-MMD (204 KM)'],
        'ZR-V': E.toyotaHybrid,
        'e:Ny1': E.vwEv,
        Accord: ['2.0 Hybrid (204 KM)', '1.5 VTEC Turbo (192 KM)']
    },
    Suzuki: {
        _default: ['1.2 DualJet (90 KM)', '1.4 Boosterjet (140 KM)', '1.5 Hybrid (115 KM)', '1.9 DDiS (120 KM)'],
        Swift: ['1.2 DualJet (83 KM)', '1.2 Hybrid (83 KM)', '1.4 Boosterjet (140 KM)'],
        Ignis: ['1.2 DualJet (83 KM)', '1.2 Hybrid (83 KM)'],
        Vitara: ['1.4 Boosterjet (140 KM)', '1.5 Hybrid (115 KM)', '1.9 DDiS (120 KM)'],
        'S-Cross': ['1.4 Boosterjet (140 KM)', '1.5 Hybrid (115 KM)'],
        Jimny: ['1.5 VVT (102 KM)'],
        Across: E.toyotaHybrid,
        Swace: E.toyotaHybrid
    },
    Mitsubishi: {
        _default: ['1.0 Turbo (92 KM)', '1.2 MIVEC (80 KM)', '1.6 MIVEC (117 KM)', '2.2 DI-D (150 KM)'],
        'Space Star': ['1.0 (71 KM)', '1.2 (80 KM)'],
        Colt: ['1.0 Turbo (92 KM)', '1.6 Hybrid (143 KM)'],
        ASX: ['1.6 MIVEC (117 KM)', '2.0 MIVEC (150 KM)'],
        'Eclipse Cross': ['1.5 Turbo (163 KM)', '2.4 PHEV (224 KM)'],
        Outlander: ['2.0 MIVEC (150 KM)', '2.4 PHEV (224 KM)', '2.2 DI-D (150 KM)'],
        L200: ['2.2 DI-D (150 KM)', '2.4 DI-D (181 KM)']
    },
    Subaru: {
        _default: ['2.0i (150 KM)', '2.5i (175 KM)', '2.0i e-Boxer (150 KM)', '2.0 Turbo (265 KM)'],
        Impreza: ['1.6i (114 KM)', '2.0i (156 KM)'],
        Legacy: ['2.5i (169 KM)', '2.0 Turbo (260 KM)'],
        Outback: ['2.5i (169 KM)', '2.4 Turbo (260 KM)'],
        Forester: ['2.0i e-Boxer (150 KM)', '2.5i (169 KM)'],
        XV: ['1.6i (114 KM)', '2.0i e-Boxer (150 KM)'],
        Levorg: ['1.6 Turbo (170 KM)', '2.0 Turbo (268 KM)'],
        BRZ: ['2.4 Boxer (234 KM)'],
        Solterra: E.vwEv
    },
    Volvo: {
        _default: ['T2 (129 KM)', 'T3 (163 KM)', 'T4 (190 KM)', 'B3 (163 KM)', 'B4 (197 KM)', 'D3 (150 KM)', 'D4 (190 KM)', 'Elektryczny (231 KM)'],
        V40: ['T2 (122 KM)', 'T3 (152 KM)', 'D2 (120 KM)', 'D3 (150 KM)'],
        V60: ['T4 (190 KM)', 'T5 (250 KM)', 'B4 (197 KM)', 'D4 (190 KM)', 'T6 Twin Engine (340 KM)'],
        V90: ['T4 (190 KM)', 'B4 (197 KM)', 'D4 (190 KM)', 'T6 Twin Engine (340 KM)'],
        S60: ['T4 (190 KM)', 'B4 (197 KM)', 'D4 (190 KM)', 'T8 Twin Engine (390 KM)'],
        S90: ['T4 (190 KM)', 'B4 (197 KM)', 'D5 (235 KM)', 'T8 Twin Engine (390 KM)'],
        XC40: ['T3 (163 KM)', 'T4 (190 KM)', 'B4 (197 KM)', 'Recharge PHEV (262 KM)'],
        XC60: ['T4 (190 KM)', 'B4 (197 KM)', 'D4 (190 KM)', 'T8 Twin Engine (390 KM)'],
        XC90: ['T5 (250 KM)', 'B5 (250 KM)', 'D5 (235 KM)', 'T8 Twin Engine (390 KM)'],
        C40: E.vwEv,
        EX30: E.vwEv,
        EX90: E.vwEv,
        EM90: E.vwEv
    },
    'Land Rover': {
        _default: ['2.0 Turbo (200 KM)', '2.0 Turbo (249 KM)', '3.0 I6 (400 KM)', '2.0 D (163 KM)', '2.0 D (204 KM)', '3.0 D (249 KM)'],
        Defender: ['2.0 D (200 KM)', '3.0 I6 (400 KM)', '3.0 D (249 KM)', '5.0 V8 (525 KM)'],
        Discovery: ['2.0 Turbo (300 KM)', '3.0 I6 (360 KM)', '3.0 D (249 KM)'],
        'Discovery Sport': ['1.5 Turbo (163 KM)', '2.0 D (150 KM)', '2.0 D (204 KM)'],
        'Range Rover': ['3.0 I6 (400 KM)', '4.4 V8 (530 KM)', '3.0 D (350 KM) PHEV'],
        'Range Rover Sport': ['3.0 I6 (400 KM)', '4.4 V8 (530 KM)', '3.0 D (249 KM)'],
        'Range Rover Velar': ['2.0 Turbo (249 KM)', '3.0 I6 (400 KM)', '2.0 D (204 KM)'],
        'Range Rover Evoque': ['1.5 Turbo (163 KM)', '2.0 Turbo (249 KM)', '2.0 D (150 KM) PHEV']
    },
    Jaguar: {
        _default: ['2.0 Turbo (200 KM)', '2.0 Turbo (250 KM)', '3.0 V6 (340 KM)', '2.0 D (163 KM)', '2.0 D (204 KM)'],
        XE: ['2.0 Turbo (200 KM)', '2.0 Turbo (250 KM)', '2.0 D (163 KM)'],
        XF: ['2.0 Turbo (250 KM)', '2.0 D (204 KM)', '3.0 V6 (340 KM)'],
        XJ: ['3.0 V6 (340 KM)', '5.0 V8 (575 KM)'],
        'F-Pace': ['2.0 Turbo (250 KM)', '2.0 D (204 KM)', '3.0 I6 (400 KM)'],
        'E-Pace': ['1.5 Turbo (160 KM)', '2.0 Turbo (249 KM)', '2.0 D (150 KM)'],
        'I-Pace': E.vwEv,
        'F-Type': ['2.0 Turbo (300 KM)', '3.0 V6 (380 KM)', '5.0 V8 (575 KM)']
    },
    Mini: {
        _default: ['One (102 KM)', 'Cooper (136 KM)', 'Cooper S (192 KM)', 'Cooper D (116 KM)', 'Cooper SD (170 KM)', 'Elektryczny (184 KM)'],
        'Mini 3-drzwiowe': ['One (102 KM)', 'Cooper (136 KM)', 'Cooper S (192 KM)'],
        'Mini 5-drzwiowe': ['One (102 KM)', 'Cooper (136 KM)', 'Cooper S (192 KM)'],
        'Mini Clubman': ['Cooper (136 KM)', 'Cooper S (192 KM)', 'Cooper D (116 KM)'],
        'Mini Countryman': ['Cooper (136 KM)', 'Cooper S (192 KM)', 'Cooper SE PHEV (224 KM)'],
        'Mini Cabrio': ['Cooper (136 KM)', 'Cooper S (192 KM)'],
        'Mini Electric': E.vwEv
    },
    Porsche: {
        _default: ['2.0 Turbo (265 KM)', '3.0 Turbo (354 KM)', '4.0 (450 KM)'],
        '911': ['Carrera (385 KM)', 'Carrera S (450 KM)', 'Turbo S (650 KM)'],
        '718 Boxster': ['2.0 (300 KM)', '2.5 (350 KM)', '4.0 GTS (400 KM)'],
        '718 Cayman': ['2.0 (300 KM)', '2.5 (350 KM)', '4.0 GTS (400 KM)'],
        Panamera: ['2.9 (330 KM)', '4.0 (620 KM)', '2.9 Hybrid (462 KM)'],
        Macan: ['2.0 (265 KM)', '2.9 (380 KM)', '3.0 (354 KM)'],
        Cayenne: ['3.0 (340 KM)', '2.9 (440 KM)', '3.0 Hybrid (462 KM)'],
        Taycan: E.vwEv
    },
    Tesla: {
        _default: E.vwEv,
        'Model 3': ['Standard Range (283 KM)', 'Long Range (366 KM)', 'Performance (513 KM)'],
        'Model Y': ['Standard Range (455 KM)', 'Long Range (533 KM)', 'Performance (514 KM)'],
        'Model S': ['Long Range (634 KM)', 'Plaid (1020 KM)'],
        'Model X': ['Long Range (560 KM)', 'Plaid (1020 KM)'],
        Cybertruck: ['AWD (600 KM)', 'Cyberbeast (845 KM)']
    },
    Chevrolet: { _default: ['1.2 (70 KM)', '1.4 (100 KM)', '1.6 (115 KM)', '1.7 CDTi (130 KM)', '2.0 CDTi (163 KM)'] },
    Chrysler: { _default: ['3.6 V6 (286 KM)', '3.0 CRD (240 KM)'], '300C': ['3.0 CRD (240 KM)', '3.6 V6 (286 KM)', '6.4 V8 (485 KM)'], Pacifica: ['3.6 V6 (287 KM)', 'PHEV (260 KM)'], Voyager: ['3.6 V6 (287 KM)'] },
    Saab: { _default: ['1.9 TiD (150 KM)', '2.0 Turbo (150 KM)', '2.0 Turbo (220 KM)', '2.8 V6 (255 KM)'], '9-3': ['1.9 TiD (150 KM)', '2.0 Turbo (175 KM)', '2.8 V6 (255 KM)'], '9-5': ['2.0 Turbo (220 KM)', '2.0 BioPower (220 KM)', '2.8 V6 (300 KM)'], '9-4X': ['2.8 V6 (300 KM)'] },
    Smart: { _default: E.vwEv, '#1': E.vwEv, '#3': E.vwEv, Fortwo: E.vwEv, Forfour: ['1.0 (71 KM)', '0.9 Turbo (90 KM)', 'Elektryczny (82 KM)'] },
    Lancia: { _default: ['0.9 TwinAir (85 KM)', '1.2 (69 KM)', '1.4 T-Jet (120 KM)', '1.3 Multijet (95 KM)', '1.6 Multijet (105 KM)'] },
    SsangYong: { _default: ['1.5 Turbo (163 KM)', '2.0 Turbo (220 KM)', '2.2 e-XDi (178 KM)'] },
    Isuzu: { _default: ['1.9 Ddi (150 KM)', '2.2 Ddi (163 KM)', '3.0 Ddi (190 KM)'], 'D-Max': ['1.9 Ddi (150 KM)', '2.2 Ddi (163 KM)', '3.0 Ddi (190 KM)'], 'MU-X': ['2.2 Ddi (163 KM)', '3.0 Ddi (190 KM)'] },
    Iveco: { _default: E.dieselVan, Daily: E.dieselVan, Eurocargo: ['3.0 (210 KM)', '3.9 (170 KM)', '6.0 (210 KM)'] }
};

function findModelKey(brandMap, model) {
    if (!model || !brandMap) return null;
    if (brandMap[model]) return model;

    const q = normalizeQuery(model);
    const keys = Object.keys(brandMap).filter(k => k !== '_default');

    const exact = keys.find(k => normalizeQuery(k) === q);
    if (exact) return exact;

    const starts = keys.find(k => normalizeQuery(k).startsWith(q) || q.startsWith(normalizeQuery(k)));
    if (starts) return starts;

    const contains = keys.find(k => {
        const kn = normalizeQuery(k);
        return kn.includes(q) || q.includes(kn);
    });
    return contains || null;
}

export function getEnginesForVehicle(brandInput, modelInput) {
    const brand = resolveBrandName(brandInput);
    const model = resolveModelName(brandInput, modelInput);
    const brandMap = VEHICLE_ENGINES[brand];

    if (!brandMap) return [];
    if (!model) return brandMap._default || [];

    const key = findModelKey(brandMap, model);
    if (key) return brandMap[key];

    return brandMap._default || [];
}

export function filterEngines(brandInput, modelInput, query, limit = 8) {
    const engines = getEnginesForVehicle(brandInput, modelInput);
    const q = normalizeQuery(query);

    if (!engines.length) return [];

    if (!q) return engines.slice(0, limit);

    const scored = engines.map(name => {
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

export function resolveEngineName(brandInput, modelInput, input) {
    const trimmed = (input || '').trim();
    if (!trimmed) return '';

    const engines = getEnginesForVehicle(brandInput, modelInput);
    const q = normalizeQuery(trimmed);

    const exact = engines.find(engine => normalizeQuery(engine) === q);
    if (exact) return exact;

    const startsWith = engines.find(engine => normalizeQuery(engine).startsWith(q));
    if (startsWith && q.length >= 2) return startsWith;

    return trimmed.replace(/\s+/g, ' ');
}

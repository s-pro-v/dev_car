/**
 * Profile serwisowe wg grup producentów.
 * Interwały oparte na typowych zaleceniach serwisowych (km / miesiące / lata).
 */

export const MAINTENANCE_PROFILES = [
    {
        id: 'vag',
        label: 'Grupa VAG (VW, Audi, Skoda, Seat)',
        brands: ['volkswagen', 'vw', 'audi', 'skoda', 'seat', 'cupra'],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 480,
                notes: 'Olej LongLife + filtry oleju, powietrza i kabinowy — interwał VAG co 15 000 km lub rok.'
            },
            {
                templateKey: 'dsg_oil',
                itemName: 'Wymiana oleju skrzyni DSG / S-Tronic',
                intervalKm: 60000,
                priority: 'high',
                estimatedCost: 1100,
                enginePatterns: [/dsg|s-tronic|stronic|multitronic|automat/i],
                notes: 'Zalecane co 60 000 km — ważne dla trwałości skrzyni dwusprzęgłowej.'
            },
            {
                templateKey: 'timing',
                itemName: 'Rozrząd + pompa wody (profilaktyka)',
                intervalYears: 6,
                priority: 'high',
                estimatedCost: 1800,
                notes: 'Profilaktyczna wymiana co 6 lat lub wg zaleceń producenta dla danego silnika.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 180,
                notes: 'Co 2 lata — płyn hamulcowy absorbuje wilgoć i traci skuteczność.'
            },
            {
                templateKey: 'spark_plugs',
                itemName: 'Wymiana świec zapłonowych',
                intervalKm: 60000,
                priority: 'medium',
                estimatedCost: 350,
                enginePatterns: [/tfsi|tsi|fsi|mpi|benzyna|petrol|1\.[24]|2\.[05]/i],
                excludeEnginePatterns: [/tdi|diesel|dci|hdi|cdti/i],
                notes: 'Typowy interwał dla silników benzynowych TSI/TFSI.'
            },
            {
                templateKey: 'coolant',
                itemName: 'Wymiana płynu chłodniczego',
                intervalYears: 5,
                priority: 'medium',
                estimatedCost: 220,
                notes: 'Co 5 lat — ochrona przed korozją układu chłodzenia.'
            }
        ]
    },
    {
        id: 'bmw',
        label: 'BMW',
        brands: ['bmw'],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy (Condition Based)',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 650,
                notes: 'Interwał CBS — zwykle co 15 000 km lub rok, zależnie od stylu jazdy.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 200,
                notes: 'Co 2 lata wg harmonogramu CBS.'
            },
            {
                templateKey: 'spark_plugs',
                itemName: 'Wymiana świec zapłonowych',
                intervalKm: 60000,
                priority: 'medium',
                estimatedCost: 420,
                enginePatterns: [/benzyna|petrol|b48|b58|n20|n55|320|330|520|118|218/i],
                excludeEnginePatterns: [/diesel|d\d/i],
                notes: 'Dla silników benzynowych — sprawdź specyfikację dla Twojego kodu silnika.'
            },
            {
                templateKey: 'coolant',
                itemName: 'Wymiana płynu chłodniczego',
                intervalYears: 5,
                priority: 'medium',
                estimatedCost: 280,
                notes: 'Co 5 lat — płyn BMW Longlife.'
            }
        ]
    },
    {
        id: 'mercedes',
        label: 'Mercedes-Benz',
        brands: ['mercedes', 'mercedes-benz', 'mercedes benz', 'mb'],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy (Assyst)',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 700,
                notes: 'System Assyst Plus — zwykle co 15 000 km lub rok.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 210,
                notes: 'Co 2 lata wg książki serwisowej Mercedes.'
            },
            {
                templateKey: 'transmission_oil',
                itemName: 'Wymiana oleju skrzyni automatycznej',
                intervalKm: 60000,
                priority: 'high',
                estimatedCost: 950,
                enginePatterns: [/automat|automatic|9g-tronic|7g-tronic/i],
                notes: 'Profilaktyczna wymiana oleju w skrzyni automatycznej co ok. 60 000 km.'
            },
            {
                templateKey: 'coolant',
                itemName: 'Wymiana płynu chłodniczego',
                intervalYears: 5,
                priority: 'medium',
                estimatedCost: 260,
                notes: 'Co 5 lat — płyn MB specyfikacji MB 325.0.'
            }
        ]
    },
    {
        id: 'toyota',
        label: 'Toyota / Lexus',
        brands: ['toyota', 'lexus'],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 380,
                notes: 'Co 15 000 km lub rok — olej 0W-20/5W-30 wg specyfikacji.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 160,
                notes: 'Co 2 lata — prosty i ważny serwis profilaktyczny.'
            },
            {
                templateKey: 'air_filter',
                itemName: 'Wymiana filtra powietrza',
                intervalKm: 40000,
                priority: 'low',
                estimatedCost: 90,
                notes: 'Co 40 000 km — lepszy przepływ powietrza i ekonomia paliwa.'
            },
            {
                templateKey: 'coolant',
                itemName: 'Wymiana płynu chłodniczego Super Long Life',
                intervalKm: 160000,
                intervalYears: 10,
                priority: 'low',
                estimatedCost: 200,
                notes: 'Toyota SLLC — wymiana co 10 lat lub 160 000 km.'
            }
        ]
    },
    {
        id: 'ford',
        label: 'Ford',
        brands: ['ford'],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 420,
                notes: 'Co 15 000 km lub rok — EcoBoost i TDCi.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 170,
                notes: 'Co 2 lata wg zaleceń Ford.'
            },
            {
                templateKey: 'timing_belt',
                itemName: 'Wymiana paska rozrządu + pompka wody',
                intervalKm: 160000,
                intervalYears: 10,
                priority: 'high',
                estimatedCost: 1400,
                enginePatterns: [/tdci|tdi|1\.[56]|2\.0/i],
                excludeEnginePatterns: [/ecoboost|benzyna|petrol/i],
                notes: 'Silniki diesla — typowy interwał paska rozrządu Ford.'
            }
        ]
    },
    {
        id: 'stellantis',
        label: 'Stellantis (Opel, Peugeot, Citroën, Fiat)',
        brands: ['opel', 'peugeot', 'citroen', 'citroën', 'fiat', 'ds', 'alfa', 'alfa romeo'],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 400,
                notes: 'Co 15 000 km lub rok — silniki PureTech, BlueHDi, CDTI.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 165,
                notes: 'Co 2 lata — wymagane w książce serwisowej.'
            },
            {
                templateKey: 'timing_belt',
                itemName: 'Wymiana paska rozrządu',
                intervalKm: 120000,
                intervalYears: 8,
                priority: 'high',
                estimatedCost: 1200,
                notes: 'Sprawdź w dokumentacji — wiele silników wymaga wymiany co 120 000 km.'
            },
            {
                templateKey: 'dpf',
                itemName: 'Kontrola / regeneracja filtra DPF',
                intervalKm: 120000,
                priority: 'medium',
                estimatedCost: 450,
                enginePatterns: [/hdi|bluehdi|cdti|dci|diesel|tdi|multijet/i],
                notes: 'Dla silników diesla — profilaktyka filtra cząstek stałych.'
            }
        ]
    },
    {
        id: 'korean',
        label: 'Hyundai / Kia',
        brands: ['hyundai', 'kia', 'genesis'],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 360,
                notes: 'Co 15 000 km lub rok — silniki T-GDI i CRDi.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 155,
                notes: 'Co 2 lata wg harmonogramu producenta.'
            },
            {
                templateKey: 'spark_plugs',
                itemName: 'Wymiana świec zapłonowych',
                intervalKm: 60000,
                priority: 'medium',
                estimatedCost: 280,
                enginePatterns: [/t-gdi|tgdi|gdi|benzyna|petrol|1\.[046]|1\.6/i],
                excludeEnginePatterns: [/crdi|diesel|dci/i],
                notes: 'Silniki benzynowe turbo — co ok. 60 000 km.'
            },
            {
                templateKey: 'coolant',
                itemName: 'Wymiana płynu chłodniczego',
                intervalYears: 5,
                priority: 'medium',
                estimatedCost: 190,
                notes: 'Co 5 lat — ochrona układu chłodzenia.'
            }
        ]
    },
    {
        id: 'default',
        label: 'Harmonogram ogólny',
        brands: [],
        items: [
            {
                templateKey: 'oil',
                itemName: 'Serwis olejowo-filtrowy',
                intervalKm: 15000,
                intervalMonths: 12,
                priority: 'medium',
                estimatedCost: 400,
                notes: 'Standardowy interwał co 15 000 km lub rok — dostosuj do książki serwisowej.'
            },
            {
                templateKey: 'brake_fluid',
                itemName: 'Wymiana płynu hamulcowego',
                intervalMonths: 24,
                priority: 'medium',
                estimatedCost: 170,
                notes: 'Co 2 lata — ważne dla skuteczności hamowania.'
            },
            {
                templateKey: 'air_filter',
                itemName: 'Wymiana filtra powietrza',
                intervalKm: 30000,
                priority: 'low',
                estimatedCost: 80,
                notes: 'Co 30 000 km — prosta wymiana eksploatacyjna.'
            },
            {
                templateKey: 'cabin_filter',
                itemName: 'Wymiana filtra kabinowego',
                intervalMonths: 24,
                priority: 'low',
                estimatedCost: 70,
                notes: 'Co 2 lata — lepsza jakość powietrza w kabinie.'
            }
        ]
    }
];

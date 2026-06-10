import { STORAGE_KEYS } from './constants.js';
import { generateMaintenanceItems, createNextMaintenanceItem } from './generateMaintenanceSchedule.js';
import { computeItemPriority, getServiceCategoryForTemplate, computeNextInspectionDate } from './maintenanceUtils.js';

class DriveCareStore {
    constructor() {
        this.listeners = [];
        this.load();
    }

    load() {
        const SEED_VEHICLES = [
            {
                id: 'v-1',
                brand: 'Volkswagen',
                model: 'Golf VII Variant',
                plateNumber: 'PO 9G721',
                year: 2017,
                engine: '2.0 TDI (150 KM)',
                mileage: 184500,
                vin: 'WVWZZZAUZHP081734',
                insuranceDueDate: '2026-11-15',
                nextInspectionDate: '2026-07-28'
            },
            {
                id: 'v-2',
                brand: 'Audi',
                model: 'A4 B9 Avant',
                plateNumber: 'WI 829AX',
                year: 2018,
                engine: '2.0 TFSI (252 KM)',
                mileage: 121300,
                vin: 'WAUZZZF47JA032918',
                insuranceDueDate: '2026-06-25',
                nextInspectionDate: '2026-09-12'
            }
        ];

        const SEED_SERVICE_LOGS = [
            {
                id: 'l-1',
                vehicleId: 'v-1',
                date: '2025-07-28',
                mileage: 172100,
                workDone: 'Okresowe badanie techniczne (SKP Poznań)',
                cost: 98.00,
                category: 'inspection',
                notes: 'Wynik pozytywny, układ hamulcowy stabilny, amortyzatory sprawne w 78%.',
                nextInspectionDate: '2026-07-28'
            },
            {
                id: 'l-2',
                vehicleId: 'v-1',
                date: '2025-10-12',
                mileage: 176000,
                workDone: 'Serwis olejowo-filtrowy kompletny',
                cost: 520.00,
                category: 'oil_fluids',
                notes: 'Zalany Liqui Moly Top Tec 4200 5W30 (4.3 litra). Nowe filtry: oleju, powietrza, kabinowy węglowy, paliwa (Knecht/Mann).'
            },
            {
                id: 'l-3',
                vehicleId: 'v-1',
                date: '2026-03-10',
                mileage: 181200,
                workDone: 'Wymiana tarcz i klocków hamulcowych przód + płyn hamulcowy',
                cost: 1350.00,
                category: 'repair',
                notes: 'Tarcze wentylowane ATE, klocki hamulcowe ceramiczne ATE Ceramic (mniejsze pylenie). Wymiana płynu hamulcowego ze sprężeniem ABS.'
            },
            {
                id: 'l-4',
                vehicleId: 'v-2',
                date: '2025-09-12',
                mileage: 114200,
                workDone: 'Roczny przegląd urzędowy oraz geometria zawieszenia 3D',
                cost: 250.00,
                category: 'inspection',
                notes: 'Wykonana korekta zbieżności osi przedniej po wymianie sworznia lewego wahacza.',
                nextInspectionDate: '2026-09-12'
            },
            {
                id: 'l-5',
                vehicleId: 'v-2',
                date: '2025-12-05',
                mileage: 118500,
                workDone: 'Wymiana zestawu rozrządu z pompą wody (Profilaktyka VAG)',
                cost: 2100.00,
                category: 'repair',
                notes: 'Zestaw oryginalny OEM, nowa pompa wody z elektryczną żaluzją chłodzenia, świeży płyn chłodniczy motul G12+.'
            }
        ];

        const SEED_REPLACEMENT_ITEMS = [
            {
                id: 'r-1',
                vehicleId: 'v-1',
                itemName: 'Kompletny rozrząd (pasek, rolki, napinacz + pompa wody)',
                estimatedCost: 1600,
                priority: 'high',
                status: 'planned',
                targetDate: '2026-07-20',
                notes: 'Oryginalny zestaw Continental z uwagi na wiek samochodu (ponad 6 lat od montażu).'
            },
            {
                id: 'r-2',
                vehicleId: 'v-1',
                itemName: 'Zakup 4x opony letnie Premium 225/45 R17',
                estimatedCost: 1750,
                priority: 'medium',
                status: 'planned',
                targetDate: '2026-06-15',
                notes: 'Zalecane: Michelin Pilot Sport 5 lub Goodyear Eagle F1 Asymmetric 6. Aktualne mają już tylko 3.5mm bieżnika.'
            },
            {
                id: 'r-3',
                vehicleId: 'v-1',
                itemName: 'Wymiana piór wycieraczek tył + przód (Bosch Aerotwin)',
                estimatedCost: 135,
                priority: 'low',
                status: 'planned',
                notes: 'Aktualne zaczynają mazać szybę o zmierzchu.'
            },
            {
                id: 'r-4',
                vehicleId: 'v-2',
                itemName: 'Wymiana oleju w skrzyni automatycznej S-Tronic (DSG)',
                estimatedCost: 1100,
                priority: 'high',
                status: 'planned',
                targetDate: '2026-06-20',
                notes: 'Zalecany stały interwał co 60 000 km, skrzynia zaczyna delikatnie przeciągać biegi na zimnym silniku.'
            }
        ];

        this.vehicles = JSON.parse(localStorage.getItem(STORAGE_KEYS.vehicles)) || [];
        if (this.vehicles.length === 0) {
            this.vehicles = SEED_VEHICLES;
            localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(SEED_VEHICLES));
        }

        this.serviceLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.serviceLogs)) || [];
        if (this.serviceLogs.length === 0) {
            this.serviceLogs = SEED_SERVICE_LOGS;
            localStorage.setItem(STORAGE_KEYS.serviceLogs, JSON.stringify(SEED_SERVICE_LOGS));
        }

        this.replacementItems = JSON.parse(localStorage.getItem(STORAGE_KEYS.replacementItems)) || [];
        if (this.replacementItems.length === 0) {
            this.replacementItems = SEED_REPLACEMENT_ITEMS;
            localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(SEED_REPLACEMENT_ITEMS));
        }

        // Active vehicle selection — walidacja ID z localStorage
        this.selectedVehicleId = localStorage.getItem(STORAGE_KEYS.selectedVehicle);
        const vehicleExists = this.vehicles.some(v => v.id === this.selectedVehicleId);
        if (!vehicleExists) {
            this.selectedVehicleId = this.vehicles.length > 0 ? this.vehicles[0].id : null;
            if (this.selectedVehicleId) {
                localStorage.setItem(STORAGE_KEYS.selectedVehicle, this.selectedVehicleId);
            } else {
                localStorage.removeItem(STORAGE_KEYS.selectedVehicle);
            }
        }
    }

    recomputeVehicleFromLogs(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        const logs = this.serviceLogs.filter(l => l.vehicleId === vehicleId);
        let changed = false;

        if (logs.length > 0) {
            const highestMileage = Math.max(...logs.map(l => l.mileage || 0));
            if (vehicle.mileage !== highestMileage) {
                vehicle.mileage = highestMileage;
                changed = true;
            }
        }

        const inspectionLogs = logs
            .filter(l => l.category === 'inspection')
            .sort((a, b) => {
                const dateDiff = new Date(b.date) - new Date(a.date);
                if (dateDiff !== 0) return dateDiff;
                return (b.mileage || 0) - (a.mileage || 0);
            });

        if (inspectionLogs.length > 0) {
            const latestInspection = inspectionLogs[0];
            const latestNext = latestInspection.nextInspectionDate
                || computeNextInspectionDate(latestInspection.date);
            if (latestNext && vehicle.nextInspectionDate !== latestNext) {
                vehicle.nextInspectionDate = latestNext;
                changed = true;
            }
        }

        if (changed) {
            localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(this.vehicles));
            this.refreshMaintenancePriorities(vehicleId);
        }
    }

    syncVehicleFromLog(log) {
        this.recomputeVehicleFromLogs(log.vehicleId);
    }

    refreshMaintenancePriorities(vehicleId) {
        const vehicle = this.vehicles.find(v => v.id === vehicleId);
        if (!vehicle) return;

        let changed = false;
        this.replacementItems.forEach(item => {
            if (item.vehicleId !== vehicleId || item.status !== 'planned') return;

            const basePriority = item.basePriority || item.priority;
            const nextPriority = computeItemPriority(item, vehicle, basePriority);
            if (nextPriority !== item.priority) {
                item.priority = nextPriority;
                changed = true;
            }
        });

        if (changed) {
            localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(l => l(this));
    }

    // Vehicle operations
    selectVehicle(id) {
        if (!this.vehicles.some(v => v.id === id)) return;
        this.selectedVehicleId = id;
        localStorage.setItem(STORAGE_KEYS.selectedVehicle, id);
        this.notify();
    }

    addVehicle(vehicle, options = {}) {
        const generateSchedule = options.generateSchedule !== false;
        let generatedCount = 0;

        if (generateSchedule) {
            const { profile, items } = generateMaintenanceItems(vehicle);
            vehicle.maintenanceProfile = profile.id;
            vehicle.maintenanceProfileLabel = profile.label;
            const existingKeys = new Set(
                this.replacementItems
                    .filter(r => r.vehicleId === vehicle.id && r.source === 'auto' && r.templateKey)
                    .map(r => r.templateKey)
            );
            items.forEach(item => {
                if (item.templateKey && existingKeys.has(item.templateKey)) return;
                this.replacementItems.push(item);
                if (item.templateKey) existingKeys.add(item.templateKey);
                generatedCount += 1;
            });
            localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
        }

        this.vehicles.push(vehicle);
        localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(this.vehicles));
        this.selectedVehicleId = vehicle.id;
        localStorage.setItem(STORAGE_KEYS.selectedVehicle, vehicle.id);
        this.notify();
        return {
            generatedCount,
            profileLabel: vehicle.maintenanceProfileLabel || null
        };
    }

    updateVehicle(vehicle, options = {}) {
        const previous = this.vehicles.find(v => v.id === vehicle.id);
        this.vehicles = this.vehicles.map(v => v.id === vehicle.id ? vehicle : v);
        localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(this.vehicles));

        if (options.regenerateSchedule && previous) {
            this.replacementItems = this.replacementItems.filter(
                item => !(item.vehicleId === vehicle.id && item.source === 'auto' && item.status === 'planned')
            );
            const { profile, items } = generateMaintenanceItems(vehicle);
            vehicle.maintenanceProfile = profile.id;
            vehicle.maintenanceProfileLabel = profile.label;
            const existingKeys = new Set(
                this.replacementItems
                    .filter(r => r.vehicleId === vehicle.id && r.source === 'auto' && r.templateKey)
                    .map(r => r.templateKey)
            );
            items.forEach(item => {
                if (item.templateKey && existingKeys.has(item.templateKey)) return;
                this.replacementItems.push(item);
                if (item.templateKey) existingKeys.add(item.templateKey);
            });
            localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
            localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(this.vehicles));
        }

        this.refreshMaintenancePriorities(vehicle.id);
        this.notify();
    }

    deleteVehicle(id) {
        this.vehicles = this.vehicles.filter(v => v.id !== id);
        localStorage.setItem(STORAGE_KEYS.vehicles, JSON.stringify(this.vehicles));
        this.serviceLogs = this.serviceLogs.filter(l => l.vehicleId !== id);
        localStorage.setItem(STORAGE_KEYS.serviceLogs, JSON.stringify(this.serviceLogs));
        this.replacementItems = this.replacementItems.filter(r => r.vehicleId !== id);
        localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));

        if (this.selectedVehicleId === id) {
            this.selectedVehicleId = this.vehicles.length > 0 ? this.vehicles[0].id : null;
            if (this.selectedVehicleId) {
                localStorage.setItem(STORAGE_KEYS.selectedVehicle, this.selectedVehicleId);
            } else {
                localStorage.removeItem(STORAGE_KEYS.selectedVehicle);
            }
        }
        this.notify();
    }

    // Service Log operations
    addServiceLog(log) {
        this.serviceLogs.unshift(log);
        localStorage.setItem(STORAGE_KEYS.serviceLogs, JSON.stringify(this.serviceLogs));
        this.syncVehicleFromLog(log);
        this.notify();
    }

    deleteServiceLog(id) {
        const log = this.serviceLogs.find(l => l.id === id);
        this.serviceLogs = this.serviceLogs.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEYS.serviceLogs, JSON.stringify(this.serviceLogs));
        if (log) {
            this.recomputeVehicleFromLogs(log.vehicleId);
        }
        this.notify();
    }

    updateServiceLog(log) {
        this.serviceLogs = this.serviceLogs.map(l => l.id === log.id ? log : l);
        localStorage.setItem(STORAGE_KEYS.serviceLogs, JSON.stringify(this.serviceLogs));
        this.syncVehicleFromLog(log);
        this.notify();
    }

    // Replacement Item operations
    addReplacementItem(item) {
        this.replacementItems.push(item);
        localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
        this.notify();
    }

    updateReplacementItem(item) {
        this.replacementItems = this.replacementItems.map(r => r.id === item.id ? item : r);
        localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
        this.notify();
    }

    deleteReplacementItem(id) {
        this.replacementItems = this.replacementItems.filter(r => r.id !== id);
        localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
        this.notify();
    }

    completeReplacementItem(id, date, mileage, cost) {
        const item = this.replacementItems.find(r => r.id === id);
        if (!item) return false;

        item.status = 'completed';
        item.completedAt = new Date().toISOString();
        item.completedDate = date;
        item.completedMileage = mileage;
        localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));

        if (item.templateKey) {
            this.replacementItems = this.replacementItems.filter(
                r => !(
                    r.vehicleId === item.vehicleId
                    && r.templateKey === item.templateKey
                    && r.status === 'planned'
                )
            );
            localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
        }

        this.addServiceLog({
            id: 'l-' + Date.now(),
            vehicleId: item.vehicleId,
            date,
            mileage,
            cost,
            category: getServiceCategoryForTemplate(item.templateKey),
            workDone: 'Wymiana: ' + item.itemName,
            notes: 'Zadanie oznaczone jako wykonane z tablicy wymian.'
        });

        const nextItem = createNextMaintenanceItem(item, mileage, date);
        if (nextItem) {
            item.nextTargetMileage = nextItem.targetMileage;
            item.nextTargetDate = nextItem.targetDate;
            item.nextReplacementId = nextItem.id;
            this.replacementItems.push(nextItem);
            localStorage.setItem(STORAGE_KEYS.replacementItems, JSON.stringify(this.replacementItems));
        }

        this.notify();
        return true;
    }
}

export const store = new DriveCareStore();

export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}


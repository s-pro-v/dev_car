import { MAINTENANCE_PROFILES } from './maintenanceTemplates.js';
import {
    normalizeBrand,
    matchesEngine,
    addMonthsToISO,
    addYearsToISO,
    computeItemPriority
} from './maintenanceUtils.js';
import { getTodayISO, parseISODateLocal } from './dateUtils.js';

export function resolveMaintenanceProfile(vehicle) {
    const brandNorm = normalizeBrand(vehicle.brand);

    for (const profile of MAINTENANCE_PROFILES) {
        if (profile.id === 'default') continue;
        if (profile.brands.some(alias => brandNorm === alias || brandNorm.startsWith(alias + ' '))) {
            return profile;
        }
    }

    return MAINTENANCE_PROFILES.find(p => p.id === 'default');
}

function applyScheduleIntervals(item, template, referenceMileage, referenceDateISO) {
    const refDate = parseISODateLocal(referenceDateISO);

    if (template.intervalKm) {
        item.intervalKm = template.intervalKm;
        item.targetMileage = referenceMileage + template.intervalKm;
    }

    if (template.intervalMonths) {
        item.intervalMonths = template.intervalMonths;
        item.targetDate = addMonthsToISO(template.intervalMonths, refDate);
    } else if (template.intervalYears) {
        item.intervalYears = template.intervalYears;
        item.targetDate = addYearsToISO(template.intervalYears, refDate);
    }
}

function shouldIncludeTemplate(template, vehicle) {
    if (template.enginePatterns && !matchesEngine(vehicle.engine, template.enginePatterns)) {
        return false;
    }
    if (template.excludeEnginePatterns && matchesEngine(vehicle.engine, template.excludeEnginePatterns)) {
        return false;
    }
    return true;
}

function buildReplacementItem(vehicle, profile, template) {
    const basePriority = template.priority || 'medium';
    const item = {
        id: `r-auto-${vehicle.id}-${template.templateKey}-${Date.now()}`,
        vehicleId: vehicle.id,
        itemName: template.itemName,
        estimatedCost: template.estimatedCost || 0,
        priority: basePriority,
        basePriority,
        status: 'planned',
        source: 'auto',
        templateKey: template.templateKey,
        maintenanceProfile: profile.id,
        notes: template.notes || `Interwał wg zaleceń: ${profile.label}.`
    };

    applyScheduleIntervals(item, template, vehicle.mileage, getTodayISO());
    item.priority = computeItemPriority(item, vehicle, basePriority);

    return item;
}

export function generateMaintenanceItems(vehicle) {
    const profile = resolveMaintenanceProfile(vehicle);
    const items = [];

    for (const template of profile.items) {
        if (!shouldIncludeTemplate(template, vehicle)) continue;
        items.push(buildReplacementItem(vehicle, profile, template));
    }

    return { profile, items };
}

export function createNextMaintenanceItem(completedItem, mileage, dateStr) {
    if (completedItem.source !== 'auto' || !completedItem.templateKey) {
        return null;
    }

    const template = {
        intervalKm: completedItem.intervalKm,
        intervalMonths: completedItem.intervalMonths,
        intervalYears: completedItem.intervalYears
    };

    const next = {
        id: `r-auto-${completedItem.vehicleId}-${completedItem.templateKey}-${Date.now()}`,
        vehicleId: completedItem.vehicleId,
        itemName: completedItem.itemName,
        estimatedCost: completedItem.estimatedCost || 0,
        priority: completedItem.basePriority || completedItem.priority || 'medium',
        basePriority: completedItem.basePriority || completedItem.priority || 'medium',
        status: 'planned',
        source: 'auto',
        templateKey: completedItem.templateKey,
        maintenanceProfile: completedItem.maintenanceProfile,
        notes: completedItem.notes
    };

    applyScheduleIntervals(next, template, mileage, dateStr);
    next.priority = computeItemPriority(next, { mileage }, next.basePriority);

    return next;
}

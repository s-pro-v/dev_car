import { daysUntil, parseISODateLocal, toLocalISO } from './dateUtils.js';

export const KM_SOON_THRESHOLD = 3000;
export const DAYS_SOON_THRESHOLD = 30;

export function normalizeBrand(brand) {
    return (brand || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

export function matchesEngine(engine, patterns) {
    if (!patterns || patterns.length === 0) return true;
    const value = (engine || '').toLowerCase();
    if (!value) return false;
    return patterns.some(pattern => pattern.test(value));
}

export function addMonthsToISO(months, fromDate = new Date()) {
    const date = new Date(fromDate);
    date.setMonth(date.getMonth() + months);
    return toLocalISO(date);
}

export function addYearsToISO(years, fromDate = new Date()) {
    const date = new Date(fromDate);
    date.setFullYear(date.getFullYear() + years);
    return toLocalISO(date);
}

/** Kolejne badanie techniczne — co 12 miesięcy od ostatniego SKP. */
export function computeNextInspectionDate(fromDateISO) {
    if (!fromDateISO) return undefined;
    return addMonthsToISO(12, parseISODateLocal(fromDateISO));
}

const TEMPLATE_LOG_CATEGORIES = {
    oil: 'oil_fluids',
    dsg_oil: 'oil_fluids',
    transmission_oil: 'oil_fluids',
    brake_fluid: 'oil_fluids',
    coolant: 'oil_fluids'
};

export function getServiceCategoryForTemplate(templateKey) {
    if (!templateKey) return 'repair';
    return TEMPLATE_LOG_CATEGORIES[templateKey] || 'repair';
}

export function getKmRemaining(item, vehicleMileage) {
    if (item.targetMileage == null) return null;
    return item.targetMileage - vehicleMileage;
}

export function getReplacementDueStatus(item, vehicle) {
    const kmRemaining = getKmRemaining(item, vehicle.mileage);
    const daysRemaining = item.targetDate ? daysUntil(item.targetDate) : null;

    const kmOverdue = kmRemaining !== null && kmRemaining < 0;
    const dateOverdue = daysRemaining !== null && daysRemaining < 0;
    const kmSoon = kmRemaining !== null && kmRemaining >= 0 && kmRemaining <= KM_SOON_THRESHOLD;
    const dateSoon = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= DAYS_SOON_THRESHOLD;

    if (kmOverdue || dateOverdue) {
        const parts = [];
        if (kmOverdue) {
            parts.push(`przekroczono o ${Math.abs(kmRemaining).toLocaleString('pl-PL')} km`);
        }
        if (dateOverdue) {
            parts.push(`termin minął ${Math.abs(daysRemaining)} dni temu`);
        }
        return {
            level: 'overdue',
            isOverdue: true,
            isSoon: false,
            text: parts.join(' · '),
            kmRemaining,
            daysRemaining
        };
    }

    if (kmSoon || dateSoon) {
        const parts = [];
        if (kmSoon) {
            parts.push(`za ${kmRemaining.toLocaleString('pl-PL')} km`);
        }
        if (dateSoon) {
            parts.push(`za ${daysRemaining} dni`);
        }
        return {
            level: 'soon',
            isOverdue: false,
            isSoon: true,
            text: parts.join(' · '),
            kmRemaining,
            daysRemaining
        };
    }

    if (kmRemaining !== null && daysRemaining !== null) {
        return {
            level: 'ok',
            isOverdue: false,
            isSoon: false,
            text: `za ${kmRemaining.toLocaleString('pl-PL')} km · termin za ${daysRemaining} dni`,
            kmRemaining,
            daysRemaining
        };
    }

    if (kmRemaining !== null) {
        return {
            level: 'ok',
            isOverdue: false,
            isSoon: false,
            text: `przy ${item.targetMileage.toLocaleString('pl-PL')} km (za ${kmRemaining.toLocaleString('pl-PL')} km)`,
            kmRemaining,
            daysRemaining
        };
    }

    if (daysRemaining !== null) {
        return {
            level: 'ok',
            isOverdue: false,
            isSoon: false,
            text: `termin za ${daysRemaining} dni`,
            kmRemaining,
            daysRemaining
        };
    }

    return {
        level: 'ok',
        isOverdue: false,
        isSoon: false,
        text: 'Zaplanowane',
        kmRemaining,
        daysRemaining
    };
}

export function computeItemPriority(item, vehicle, basePriority = item.basePriority || item.priority) {
    const status = getReplacementDueStatus(item, vehicle);
    if (status.level === 'overdue') return 'high';
    if (status.level === 'soon') {
        if (basePriority === 'low') return 'medium';
        return 'high';
    }
    return basePriority || item.priority || 'medium';
}

const URGENCY_ORDER = { overdue: 0, soon: 1, ok: 2 };

export function wasTemplateCompletedBefore(vehicleId, templateKey, replacementItems) {
    if (!templateKey) return false;
    return replacementItems.some(
        item => item.vehicleId === vehicleId
            && item.templateKey === templateKey
            && item.status === 'completed'
    );
}

/** Czy zaplanowana pozycja ma być na liście „Do wymiany”. */
export function isPlannedReplacementVisible(item, vehicle, replacementItems) {
    if (item.status !== 'planned') return false;

    if (item.source !== 'auto' || !item.templateKey) return true;

    const due = getReplacementDueStatus(item, vehicle);
    if (due.level === 'overdue' || due.level === 'soon') return true;

    return !wasTemplateCompletedBefore(item.vehicleId, item.templateKey, replacementItems);
}

function pickMoreUrgentItem(current, candidate, vehicle) {
    const currentLevel = getReplacementDueStatus(current, vehicle).level;
    const candidateLevel = getReplacementDueStatus(candidate, vehicle).level;
    return URGENCY_ORDER[candidateLevel] < URGENCY_ORDER[currentLevel] ? candidate : current;
}

export function sortPlannedByUrgency(items, vehicle) {
    return [...items].sort((a, b) => {
        const aLevel = getReplacementDueStatus(a, vehicle).level;
        const bLevel = getReplacementDueStatus(b, vehicle).level;
        const diff = URGENCY_ORDER[aLevel] - URGENCY_ORDER[bLevel];
        if (diff !== 0) return diff;
        return (a.itemName || '').localeCompare(b.itemName || '', 'pl');
    });
}

/** Aktywna lista wymian — zalecenia producenta + ręczne; po wykonaniu ukryte do zbliżającego się terminu. */
export function getVisiblePlannedReplacements(vehicle, replacementItems) {
    const planned = replacementItems.filter(
        item => item.vehicleId === vehicle.id && item.status === 'planned'
    );

    const manual = [];
    const byTemplateKey = new Map();

    planned.forEach(item => {
        if (!isPlannedReplacementVisible(item, vehicle, replacementItems)) return;

        if (!item.templateKey || item.source !== 'auto') {
            manual.push(item);
            return;
        }

        const existing = byTemplateKey.get(item.templateKey);
        byTemplateKey.set(
            item.templateKey,
            existing ? pickMoreUrgentItem(existing, item, vehicle) : item
        );
    });

    return sortPlannedByUrgency([...manual, ...byTemplateKey.values()], vehicle);
}

export function resolveNextReplacementTargets(completedItem, replacementItems) {
    if (completedItem.nextTargetMileage != null || completedItem.nextTargetDate) {
        return {
            targetMileage: completedItem.nextTargetMileage ?? null,
            targetDate: completedItem.nextTargetDate ?? null
        };
    }

    if (!completedItem.templateKey) {
        return { targetMileage: null, targetDate: null };
    }

    const plannedSuccessor = replacementItems.find(
        item => item.vehicleId === completedItem.vehicleId
            && item.templateKey === completedItem.templateKey
            && item.status === 'planned'
    );

    if (!plannedSuccessor) {
        return { targetMileage: null, targetDate: null };
    }

    return {
        targetMileage: plannedSuccessor.targetMileage ?? null,
        targetDate: plannedSuccessor.targetDate ?? null
    };
}

export function getCompletedReplacementDetails(completedItem, vehicle, replacementItems) {
    const performedParts = [];

    if (completedItem.completedDate) {
        performedParts.push(`Wykonano: ${completedItem.completedDate}`);
    }
    if (completedItem.completedMileage != null) {
        performedParts.push(`${completedItem.completedMileage.toLocaleString('pl-PL')} km`);
    }

    const next = resolveNextReplacementTargets(completedItem, replacementItems);
    const nextParts = [];

    if (next.targetMileage != null) {
        const remaining = next.targetMileage - vehicle.mileage;
        nextParts.push(
            `przy ${next.targetMileage.toLocaleString('pl-PL')} km (za ${remaining.toLocaleString('pl-PL')} km)`
        );
    }

    if (next.targetDate) {
        const days = daysUntil(next.targetDate);
        let dayLabel;
        if (days === null) {
            dayLabel = next.targetDate;
        } else if (days < 0) {
            dayLabel = `${next.targetDate} (zaległe o ${Math.abs(days)} dni)`;
        } else if (days === 0) {
            dayLabel = `${next.targetDate} (dziś)`;
        } else {
            dayLabel = `${next.targetDate} (za ${days} dni)`;
        }
        nextParts.push(dayLabel);
    }

    return {
        performedText: performedParts.length > 0 ? performedParts.join(' · ') : null,
        nextText: nextParts.length > 0 ? nextParts.join(' · ') : null
    };
}

export function analyzePlannedReplacements(vehicle, replacementItems) {
    const planned = getVisiblePlannedReplacements(vehicle, replacementItems);

    let overdueCount = 0;
    let soonCount = 0;
    const overdueItems = [];
    const soonItems = [];

    planned.forEach(item => {
        const status = getReplacementDueStatus(item, vehicle);
        if (status.level === 'overdue') {
            overdueCount += 1;
            overdueItems.push(item);
        } else if (status.level === 'soon') {
            soonCount += 1;
            soonItems.push(item);
        }
    });

    return {
        planned,
        plannedCount: planned.length,
        overdueCount,
        soonCount,
        overdueItems,
        soonItems,
        urgentCount: overdueCount + soonCount
    };
}

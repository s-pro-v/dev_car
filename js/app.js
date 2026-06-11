import './components/ReminderSystem.js';
import './components/VehicleSelector.js';
import './components/ServiceLogBook.js';
import './components/PartsReplacementBoard.js';
import './components/ProjectEstimator.js';
import './components/VehicleDashboard.js';

import { store } from './lib/store.js';
import { analyzePlannedReplacements } from './lib/maintenanceUtils.js';
import { initTutorial } from './lib/tutorial.js';
import { initNavigation, getActiveTabId, navigateToTab } from './lib/navigation.js';
import { initTheme } from './lib/theme.js';

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initTutorial({
        navigateToTab,
        autoStart: !window.matchMedia('(max-width: 767px)').matches,
    });
    initClock();

    store.subscribe((state) => {
        updateAppStats(state);
    });

    document.addEventListener('tab-changed', () => {
        updateAppStats(store);
    });

    updateAppStats(store);
});

function updateAppStats(state) {
    const activeCar = state.vehicles.find(v => v.id === state.selectedVehicleId);
    const replacementAnalysis = activeCar
        ? analyzePlannedReplacements(activeCar, state.replacementItems)
        : null;
    const pendingCount = replacementAnalysis ? replacementAnalysis.plannedCount : 0;
    const urgentCount = replacementAnalysis ? replacementAnalysis.urgentCount : 0;
    const badgeCount = urgentCount > 0 ? urgentCount : pendingCount;

    const fleetDisplay = document.getElementById('fleet-count-display');
    if (fleetDisplay) {
        const count = state.vehicles.length;
        fleetDisplay.textContent = `Baza: Łącznie ${count} ${count === 1 ? 'auto' : count < 5 ? 'auta' : 'aut'}`;
    }

    const desktopBadge = document.getElementById('pending-replacements-badge');
    const drawerBadge = document.getElementById('mobile-pending-replacements-badge');
    const dockBadge = document.getElementById('dock-pending-replacements-badge');

    [desktopBadge, drawerBadge, dockBadge].forEach(badge => {
        if (!badge) return;
        if (badgeCount > 0) {
            badge.textContent = badgeCount;
            badge.classList.remove('badge-count--hidden');
        } else {
            badge.classList.add('badge-count--hidden');
        }
    });
}

function initClock() {
    const timeDisplay = document.getElementById('system-time-display');
    if (!timeDisplay) return;

    const updateDisplay = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        timeDisplay.textContent = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`;
    };

    updateDisplay();
    setInterval(updateDisplay, 1000);
}

export { navigateToTab, getActiveTabId };

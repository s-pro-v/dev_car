import { store } from './store.js';
import { refreshIcons } from './icons.js';

import { TAB_IDS, STORAGE_KEYS } from './constants.js';

const savedTab = localStorage.getItem(STORAGE_KEYS.activeTab);
let activeTabId = TAB_IDS.includes(savedTab) ? savedTab : 'logs';

export { TAB_IDS };

export function getActiveTabId() {
    return activeTabId;
}

export function navigateToTab(tabId) {
    if (!TAB_IDS.includes(tabId)) return;

    activeTabId = tabId;
    localStorage.setItem(STORAGE_KEYS.activeTab, tabId);

    document.querySelectorAll('.nav-tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.mobile-nav-tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.dock-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-panel').forEach((panel) => {
        const isActive = panel.id === `${tabId}-tab`;
        panel.classList.toggle('active', isActive);
        if (isActive) {
            const comp = panel.firstElementChild;
            if (comp && typeof comp.render === 'function') {
                comp.render();
            }
        }
    });

    refreshIcons();
    document.dispatchEvent(new CustomEvent('tab-changed', { detail: tabId }));
}

function closeMobileDrawer() {
    const drawer = document.getElementById('mobile-menu-drawer');
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (!drawer || !drawer.classList.contains('open')) return;

    drawer.classList.remove('open');
    const icon = menuBtn?.querySelector('i');
    if (icon) icon.setAttribute('data-lucide', 'menu');
    refreshIcons();
}

export function initNavigation() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenuDrawer = document.getElementById('mobile-menu-drawer');

    if (mobileMenuBtn && mobileMenuDrawer) {
        mobileMenuBtn.addEventListener('click', () => {
            const isOpen = mobileMenuDrawer.classList.contains('open');
            const icon = mobileMenuBtn.querySelector('i');
            if (!isOpen) {
                mobileMenuDrawer.classList.add('open');
                if (icon) icon.setAttribute('data-lucide', 'x');
            } else {
                mobileMenuDrawer.classList.remove('open');
                if (icon) icon.setAttribute('data-lucide', 'menu');
            }
            refreshIcons();
        });
    }

    ['.nav-tab-btn', '.mobile-nav-tab-btn', '.dock-btn'].forEach((selector) => {
        document.querySelectorAll(selector).forEach((btn) => {
            btn.addEventListener('click', () => {
                navigateToTab(btn.getAttribute('data-tab'));
                closeMobileDrawer();
            });
        });
    });

    document.addEventListener('navigate-tab', (e) => {
        if (TAB_IDS.includes(e.detail)) {
            navigateToTab(e.detail);
        }
    });

    navigateToTab(activeTabId);
}

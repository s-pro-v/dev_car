import { refreshIcons } from './icons.js';

import { STORAGE_KEYS } from './constants.js';

const STEPS = [
    {
        icon: 'sparkles',
        title: 'Witaj w DriveCare',
        lead: 'Twój cyfrowy dziennik serwisowy — od pierwszego wpisu po prognozę kosztów.',
        body: `
            <p>Samouczek <strong>podświetli</strong> kolejne elementy interfejsu. Panel kroków zawsze widoczny u dołu ekranu — klikaj <strong>Dalej</strong>.</p>
            <ul class="tutorial-list">
                <li>ewidencja napraw i kosztów</li>
                <li>planowanie wymian i terminów SKP / OC</li>
                <li>analiza budżetu i paliwa</li>
                <li>pulpit stanu technicznego pojazdu</li>
            </ul>
        `,
        tab: null,
        target: null
    },
    {
        icon: 'car',
        title: 'Krok 1 — Dodaj pojazd',
        lead: 'Zacznij od wyboru auta lub dodania nowego do bazy.',
        body: `
            <p>Podświetlona sekcja u góry — wybierz auto z listy albo kliknij <strong>Dodaj auto</strong>.</p>
            <ul class="tutorial-list">
                <li>Marka, model, nr rejestracyjny — wymagane</li>
                <li>Daty <strong>SKP</strong> i <strong>OC</strong> — odliczanie w zakładce wymian</li>
            </ul>
        `,
        tab: null,
        target: '[data-tutorial="vehicle-controls"]'
    },
    {
        icon: 'bell-ring',
        title: 'Krok 2 — Alerty boczne',
        lead: 'Po prawej stronie masz wąskie kafelki alertów — SKP, OC, olej i wymiany.',
        body: `
            <p>Kliknij kafelek, aby rozwinąć panel ze statusem, wyjaśnieniem i sugerowanym krokiem.</p>
            <p><strong>Czerwony</strong> — pilne, <strong>pomarańczowy</strong> — uwaga, <strong>zielony</strong> — OK.</p>
        `,
        tab: null,
        target: '[data-tutorial="reminders-panel"]'
    },
    {
        icon: 'wrench',
        title: 'Krok 3 — Ewidencja serwisowa',
        lead: 'Zapisuj historię napraw: co zrobiono, kiedy i za ile.',
        body: `
            <ul class="tutorial-list">
                <li>Statystyki u góry — suma kosztów i liczba wizyt</li>
                <li><strong>Nowy wpis serwisowy</strong> — dodawanie napraw</li>
            </ul>
        `,
        tab: 'logs',
        target: '[data-tutorial="log-stats"]'
    },
    {
        icon: 'layers',
        title: 'Krok 4 — Co do wymiany',
        lead: 'Planuj części, naprawy i pilnuj terminów urzędowych.',
        body: `
            <ul class="tutorial-list">
                <li>Karty SKP i OC — odliczanie do terminów</li>
                <li><strong>Dodaj element</strong> — planowanie wymian</li>
                <li><strong>Wymienione</strong> — przenosi zadanie do ewidencji</li>
            </ul>
        `,
        tab: 'wymiany',
        target: '[data-tutorial="parts-countdown"]'
    },
    {
        icon: 'coins',
        title: 'Krok 5 — Analiza i koszty',
        lead: 'Poznaj strukturę wydatków i symuluj koszty paliwa.',
        body: `
            <ul class="tutorial-list">
                <li>Po lewej — rozkład wydatków wg kategorii</li>
                <li>Po prawej — symulator paliwa</li>
            </ul>
        `,
        tab: 'koszty',
        target: '[data-tutorial="cost-breakdown"]'
    },
    {
        icon: 'layout-dashboard',
        title: 'Krok 6 — Pulpit pojazdu',
        lead: 'Zbiorczy widok kondycji auta w jednym miejscu.',
        body: `
            <ul class="tutorial-list">
                <li>Wskaźnik kondycji 0–100</li>
                <li>Statystyki kosztów i nadchodzące terminy</li>
                <li><strong>Eksport JSON</strong> — kopia danych pojazdu</li>
            </ul>
        `,
        tab: 'pulpit',
        target: '[data-tutorial="dashboard-health"]'
    },
    {
        icon: 'compass',
        title: 'Krok 7 — Nawigacja i motyw',
        lead: 'Jak poruszać się po aplikacji.',
        body: `
            <ul class="tutorial-list">
                <li>4 zakładki — ewidencja, wymiany, koszty, pulpit</li>
                <li>Przełącznik słońca / księżyca — motyw jasny lub ciemny</li>
            </ul>
        `,
        tab: 'logs',
        target: ['[data-tutorial="main-nav"]', '[data-tutorial="mobile-nav"]']
    },
    {
        icon: 'check-circle',
        title: 'Gotowe — możesz jechać',
        lead: 'Masz pełny obraz aplikacji.',
        body: `
            <p>Samouczek uruchomisz ponownie z podświetlonej karty poniżej.</p>
            <p class="tutorial-tip">Kliknij <strong>Zakończ samouczek</strong>, aby wrócić do pracy.</p>
        `,
        tab: null,
        target: '[data-tutorial="guide-card"]'
    }
];

let layoutHandler = null;

function isElementVisible(el) {
    if (!el) return false;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
}

function resolveTarget(step) {
    if (!step.target) return null;
    const selectors = Array.isArray(step.target) ? step.target : [step.target];
    for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (isElementVisible(el)) return el;
    }
    return null;
}

function updateStepIcon(root, iconName) {
    const iconWrap = root.querySelector('.tutorial-step__icon');
    if (!iconWrap) return;
    iconWrap.innerHTML = `<i data-lucide="${iconName}"></i>`;
}

function positionSpotlight(spotlight, overlay, targetEl) {
    if (!targetEl) {
        spotlight.hidden = true;
        overlay.hidden = false;
        return;
    }

    overlay.hidden = true;
    spotlight.hidden = false;

    const rect = targetEl.getBoundingClientRect();
    const pad = 6;
    spotlight.style.top = `${Math.max(0, rect.top - pad)}px`;
    spotlight.style.left = `${Math.max(0, rect.left - pad)}px`;
    spotlight.style.width = `${rect.width + pad * 2}px`;
    spotlight.style.height = `${rect.height + pad * 2}px`;
}

function openTutorial(root) {
    root.hidden = false;
    root.classList.add('tutorial-root--active');
    document.documentElement.classList.add('tutorial-active');
    document.body.classList.add('tutorial-active');
}

function closeTutorial(root) {
    const spotlight = root.querySelector('.tutorial-spotlight');
    const overlay = root.querySelector('.tutorial-overlay');

    if (spotlight) spotlight.hidden = true;
    if (overlay) overlay.hidden = true;

    root.classList.remove('tutorial-root--active');
    root.hidden = true;
    document.documentElement.classList.remove('tutorial-active');
    document.body.classList.remove('tutorial-active');
}

function renderStep(root, stepIndex, navigateToTab) {
    const step = STEPS[stepIndex];
    const total = STEPS.length;
    const spotlight = root.querySelector('.tutorial-spotlight');
    const overlay = root.querySelector('.tutorial-overlay');

    root.querySelector('.tutorial-step-index').textContent = `Krok ${stepIndex + 1} z ${total}`;
    root.querySelector('.tutorial-progress__fill').style.width = `${((stepIndex + 1) / total) * 100}%`;

    updateStepIcon(root, step.icon);
    root.querySelector('.tutorial-step__title').textContent = step.title;
    root.querySelector('.tutorial-step__lead').textContent = step.lead;
    root.querySelector('.tutorial-step__body').innerHTML = step.body;

    const prevBtn = root.querySelector('#tutorial-prev');
    const nextBtn = root.querySelector('#tutorial-next');
    const skipBtn = root.querySelector('#tutorial-skip');

    prevBtn.disabled = stepIndex === 0;
    nextBtn.textContent = stepIndex === total - 1 ? 'Zakończ samouczek' : 'Dalej';
    skipBtn.textContent = stepIndex === total - 1 ? 'Zamknij' : 'Pomiń samouczek';

    if (step.tab && typeof navigateToTab === 'function') {
        navigateToTab(step.tab);
    }

    refreshIcons();

    const applyHighlight = () => {
        const targetEl = resolveTarget(step);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        }
        window.setTimeout(() => {
            const resolved = resolveTarget(step);
            positionSpotlight(spotlight, overlay, resolved);
        }, step.tab ? 320 : 100);
    };

    requestAnimationFrame(() => requestAnimationFrame(applyHighlight));
}

export function initTutorial({ navigateToTab, autoStart = true }) {
    const root = document.getElementById('tutorial-root');
    if (!root) return;

    let stepIndex = 0;
    let isOpen = false;

    const bindLayout = () => {
        if (layoutHandler) return;
        layoutHandler = () => {
            if (!isOpen) return;
            const step = STEPS[stepIndex];
            const spotlight = root.querySelector('.tutorial-spotlight');
            const overlay = root.querySelector('.tutorial-overlay');
            positionSpotlight(spotlight, overlay, resolveTarget(step));
        };
        window.addEventListener('resize', layoutHandler);
        window.addEventListener('scroll', layoutHandler, true);
    };

    const unbindLayout = () => {
        if (!layoutHandler) return;
        window.removeEventListener('resize', layoutHandler);
        window.removeEventListener('scroll', layoutHandler, true);
        layoutHandler = null;
    };

    const finish = (markComplete) => {
        if (markComplete) localStorage.setItem(STORAGE_KEYS.tutorial, '1');
        isOpen = false;
        unbindLayout();
        closeTutorial(root);
    };

    const goTo = (index) => {
        stepIndex = Math.max(0, Math.min(index, STEPS.length - 1));
        renderStep(root, stepIndex, navigateToTab);
        bindLayout();
    };

    const start = () => {
        isOpen = true;
        openTutorial(root);
        goTo(0);
    };

    root.querySelector('#tutorial-prev').addEventListener('click', () => goTo(stepIndex - 1));
    root.querySelector('#tutorial-next').addEventListener('click', () => {
        if (stepIndex >= STEPS.length - 1) {
            finish(true);
            return;
        }
        goTo(stepIndex + 1);
    });
    root.querySelector('#tutorial-skip').addEventListener('click', () => finish(stepIndex >= STEPS.length - 1));
    root.querySelector('#tutorial-close').addEventListener('click', () => finish(false));

    const overlay = root.querySelector('.tutorial-overlay');
    if (overlay) overlay.addEventListener('click', () => finish(false));

    const openBtn = document.getElementById('open-help-btn');
    const openBtnMobile = document.getElementById('open-help-btn-mobile');
    if (openBtn) openBtn.addEventListener('click', start);
    if (openBtnMobile) openBtnMobile.addEventListener('click', start);

    window.addEventListener('keydown', (e) => {
        if (!isOpen) return;
        if (e.key === 'Escape') finish(false);
    });

    if (autoStart && !localStorage.getItem(STORAGE_KEYS.tutorial)) {
        setTimeout(start, 600);
    }
}

export function resetTutorial() {
    localStorage.removeItem(STORAGE_KEYS.tutorial);
}

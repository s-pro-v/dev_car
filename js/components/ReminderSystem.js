import { store, escapeHTML } from '../lib/store.js';
import { daysUntil } from '../lib/dateUtils.js';
import { analyzePlannedReplacements } from '../lib/maintenanceUtils.js';
import { refreshIcons } from '../lib/icons.js';

const SEVERITY_LABELS = {
    critical: 'Pilne',
    warning: 'Uwaga',
    info: 'Informacja',
    success: 'OK'
};

const CATEGORY_LABELS = {
    SKP: 'Przegląd',
    OC: 'Ubezpieczenie',
    Olej: 'Serwis oleju',
    'Części': 'Wymiany'
};

const CATEGORY_CODES = {
    SKP: 'SKP',
    OC: 'OC',
    Olej: 'OLEJ',
    'Części': 'CZĘŚCI'
};

class ReminderSystem extends HTMLElement {
    constructor() {
        super();
        this.selectedAlertId = null;
    }

    connectedCallback() {
        this.unsubscribe = store.subscribe(() => this.render());
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        document.body.classList.remove('alert-drawer-open');
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Brak daty';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    buildAlerts(vehicle) {
        const inspectionDays = daysUntil(vehicle.nextInspectionDate);
        const insuranceDays = daysUntil(vehicle.insuranceDueDate);

        const activeLogs = store.serviceLogs.filter(log => log.vehicleId === vehicle.id);
        const oilLogs = activeLogs.filter(log => log.category === 'oil_fluids');

        let lastOilMileage = null;
        let lastOilReplacementMileage = null;
        if (oilLogs.length > 0) {
            const sortedOil = [...oilLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
            lastOilReplacementMileage = sortedOil[0].mileage;
            lastOilMileage = sortedOil[0].mileage;
        }

        const mileageSinceOil = lastOilMileage !== null ? vehicle.mileage - lastOilMileage : null;
        const replacementAnalysis = analyzePlannedReplacements(vehicle, store.replacementItems);

        const alerts = [];

        if (inspectionDays !== null) {
            if (inspectionDays < 0) {
                alerts.push({
                    id: 'inspection_overdue',
                    type: 'critical',
                    category: 'SKP',
                    title: 'Przegląd techniczny wygasł',
                    shortDesc: `Termin minął ${Math.abs(inspectionDays)} dni temu (${this.formatDate(vehicle.nextInspectionDate)}).`,
                    infoLabel: 'Możliwa kara od 1500 zł i zatrzymanie dowodu rejestracyjnego.',
                    helpTip: 'Bez ważnego badania technicznego ubezpieczyciel może odmówić wypłaty odszkodowania. Umów wizytę w SKP — diagnosta sprawdzi hamulce, zbieżność, spaliny i oświetlenie.',
                    icon: 'alert-triangle',
                    actionText: 'Zapisz przegląd w ewidencji',
                    actionTab: 'logs'
                });
            } else if (inspectionDays <= 14) {
                alerts.push({
                    id: 'inspection_due_soon',
                    type: 'warning',
                    category: 'SKP',
                    title: 'Zbliża się termin SKP',
                    shortDesc: `Badanie techniczne za ${inspectionDays} dni (${this.formatDate(vehicle.nextInspectionDate)}).`,
                    infoLabel: 'Warto zarezerwować termin w stacji diagnostycznej.',
                    helpTip: 'Przed wizytą sprawdź kontrolki, oświetlenie i tablicę rejestracyjną. Przygotuj ok. 98 zł (161 zł przy instalacji LPG).',
                    icon: 'calendar',
                    actionText: 'Otwórz ewidencję',
                    actionTab: 'logs'
                });
            } else {
                alerts.push({
                    id: 'inspection_ok',
                    type: 'success',
                    category: 'SKP',
                    title: 'Badanie techniczne ważne',
                    shortDesc: `Pozostało ${inspectionDays} dni do kolejnego terminu (${this.formatDate(vehicle.nextInspectionDate)}).`,
                    helpTip: 'Pojazd ma aktualne dopuszczenie do ruchu. Kolejna wizyta w SKP nie jest na razie pilna.',
                    icon: 'clipboard-check'
                });
            }
        } else {
            alerts.push({
                id: 'inspection_missing',
                type: 'info',
                category: 'SKP',
                title: 'Brak daty przeglądu',
                shortDesc: 'Uzupełnij datę kolejnego badania technicznego w danych pojazdu.',
                helpTip: 'Edytuj pojazd i wpisz termin SKP — aplikacja sama przypomni o wizycie.',
                icon: 'info'
            });
        }

        if (insuranceDays !== null) {
            if (insuranceDays < 0) {
                alerts.push({
                    id: 'insurance_overdue',
                    type: 'critical',
                    category: 'OC',
                    title: 'Brak ważnego ubezpieczenia OC',
                    shortDesc: `Polisa wygasła ${Math.abs(insuranceDays)} dni temu (${this.formatDate(vehicle.insuranceDueDate)}).`,
                    infoLabel: 'UFG może nałożyć karę — nawet gdy auto stoi w garażu.',
                    helpTip: 'Przedłuż polisę OC jak najszybciej u swojego agenta lub online. Jazda bez OC jest nielegalna.',
                    icon: 'alert-triangle',
                    actionText: 'Przejdź do pulpitu',
                    actionTab: 'pulpit'
                });
            } else if (insuranceDays <= 30) {
                alerts.push({
                    id: 'insurance_due_soon',
                    type: 'warning',
                    category: 'OC',
                    title: 'Kończy się polisa OC',
                    shortDesc: `Ubezpieczenie traci ważność za ${insuranceDays} dni (${this.formatDate(vehicle.insuranceDueDate)}).`,
                    infoLabel: 'Porównaj oferty ok. 2 tygodnie przed końcem polisy.',
                    helpTip: 'Automatyczne wznowienie bywa droższe niż oferta u konkurencji. Sprawdź ceny przed przedłużeniem.',
                    icon: 'shield-check',
                    actionText: 'Przejdź do pulpitu',
                    actionTab: 'pulpit'
                });
            } else {
                alerts.push({
                    id: 'insurance_ok',
                    type: 'success',
                    category: 'OC',
                    title: 'Ubezpieczenie OC aktywne',
                    shortDesc: `Polisa ważna jeszcze ${insuranceDays} dni.`,
                    helpTip: 'Masz aktualne ubezpieczenie odpowiedzialności cywilnej.',
                    icon: 'shield-check'
                });
            }
        }

        const MAX_OIL_KM = 15000;
        if (mileageSinceOil !== null) {
            if (mileageSinceOil >= MAX_OIL_KM) {
                alerts.push({
                    id: 'oil_exceeded',
                    type: 'critical',
                    category: 'Olej',
                    title: 'Wymiana oleju po terminie',
                    shortDesc: `Od ostatniego serwisu olejowego minęło ${mileageSinceOil.toLocaleString('pl-PL')} km (limit: 15 000 km).`,
                    infoLabel: 'Stary olej przyspiesza zużycie silnika.',
                    helpTip: 'Umów wymianę oleju i filtrów w warsztacie. Stosuj lepkość i normę zalecaną przez producenta.',
                    icon: 'alert-triangle',
                    actionText: 'Dodaj wpis serwisowy',
                    actionTab: 'logs'
                });
            } else if (mileageSinceOil >= 10000) {
                const remaining = MAX_OIL_KM - mileageSinceOil;
                alerts.push({
                    id: 'oil_due_soon',
                    type: 'warning',
                    category: 'Olej',
                    title: 'Zbliża się wymiana oleju',
                    shortDesc: `Przejechano ${mileageSinceOil.toLocaleString('pl-PL')} km od wymiany. Zostało ok. ${remaining.toLocaleString('pl-PL')} km.`,
                    infoLabel: lastOilReplacementMileage
                        ? `Zalecany serwis przy ${(lastOilReplacementMileage + MAX_OIL_KM).toLocaleString('pl-PL')} km.`
                        : 'Zaplanuj serwis olejowy z wyprzedzeniem.',
                    helpTip: 'Kup filtry oleju, powietrza i kabinowy. Sprawdź specyfikację oleju dla Twojego silnika.',
                    icon: 'clock',
                    actionText: 'Historia serwisu',
                    actionTab: 'logs'
                });
            } else {
                const remaining = MAX_OIL_KM - mileageSinceOil;
                alerts.push({
                    id: 'oil_ok',
                    type: 'success',
                    category: 'Olej',
                    title: 'Olej w normie',
                    shortDesc: `Od wymiany ${mileageSinceOil.toLocaleString('pl-PL')} km. Kolejny serwis za ${remaining.toLocaleString('pl-PL')} km.`,
                    helpTip: 'Olej jest w bezpiecznym interwale. Kontroluj poziom bagnetem raz w miesiącu.',
                    icon: 'droplet'
                });
            }
        } else {
            alerts.push({
                id: 'oil_missing',
                type: 'warning',
                category: 'Olej',
                title: 'Brak wpisu o wymianie oleju',
                shortDesc: 'Nie ma zapisu serwisu olejowego w ewidencji.',
                infoLabel: 'Bez tego system nie policzy kolejnego terminu.',
                helpTip: 'Dodaj wpis w ewidencji (kategoria „Filtry, oleje i płyny”) z datą i przebiegiem ostatniej wymiany.',
                icon: 'info',
                actionText: 'Dodaj wpis',
                actionTab: 'logs'
            });
        }

        if (replacementAnalysis.plannedCount > 0) {
            const urgentNames = [
                ...replacementAnalysis.overdueItems,
                ...replacementAnalysis.soonItems
            ].slice(0, 4).map(item => item.itemName);

            if (replacementAnalysis.overdueCount > 0) {
                alerts.push({
                    id: 'parts_overdue',
                    type: 'critical',
                    category: 'Części',
                    title: `Zaległe wymiany (${replacementAnalysis.overdueCount})`,
                    shortDesc: `${replacementAnalysis.overdueCount} zadań po terminie lub przebiegu.`,
                    infoLabel: urgentNames.join(', '),
                    helpTip: 'Sprawdź tablicę wymian — zadania oznaczone automatycznie wg marki pojazdu mają terminy km i daty. Po naprawie oznacz jako wykonane, aby zaplanować kolejny interwał.',
                    icon: 'alert-triangle',
                    actionText: 'Tablica wymian',
                    actionTab: 'wymiany'
                });
            } else if (replacementAnalysis.soonCount > 0) {
                alerts.push({
                    id: 'parts_due_soon',
                    type: 'warning',
                    category: 'Części',
                    title: `Zbliżające się wymiany (${replacementAnalysis.soonCount})`,
                    shortDesc: `${replacementAnalysis.soonCount} zadań wymaga uwagi w najbliższym czasie.`,
                    infoLabel: urgentNames.join(', '),
                    helpTip: 'System monitoruje przebieg i daty z harmonogramu serwisowego dopasowanego do marki pojazdu.',
                    icon: 'wrench',
                    actionText: 'Tablica wymian',
                    actionTab: 'wymiany'
                });
            } else {
                alerts.push({
                    id: 'parts_ok',
                    type: 'success',
                    category: 'Części',
                    title: 'Harmonogram wymian aktualny',
                    shortDesc: `${replacementAnalysis.plannedCount} zaplanowanych zadań — brak pilnych terminów.`,
                    helpTip: 'Po dodaniu pojazdu aplikacja tworzy typowy harmonogram wg producenta. Priorytety rosną automatycznie przy zbliżaniu się terminu.',
                    icon: 'layers'
                });
            }
        }

        const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

        return alerts.map(alert => ({
            ...alert,
            severityLabel: SEVERITY_LABELS[alert.type],
            tabLabel: CATEGORY_LABELS[alert.category] || alert.category,
            tabCode: CATEGORY_CODES[alert.category] || alert.category
        }));
    }

    getStatusMeta(alert, vehicle) {
        const inspectionDays = daysUntil(vehicle.nextInspectionDate);
        const insuranceDays = daysUntil(vehicle.insuranceDueDate);
        const MAX_OIL_KM = 15000;

        const oilLogs = store.serviceLogs
            .filter(log => log.vehicleId === vehicle.id && log.category === 'oil_fluids')
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        const lastOilMileage = oilLogs.length > 0 ? oilLogs[0].mileage : null;
        const mileageSinceOil = lastOilMileage !== null ? vehicle.mileage - lastOilMileage : null;

        const replacementAnalysis = analyzePlannedReplacements(vehicle, store.replacementItems);
        const { plannedCount, urgentCount, overdueCount, soonCount } = replacementAnalysis;

        if (alert.category === 'OC') {
            if (insuranceDays === null) {
                return { badge: 'BRAK DANYCH', headline: 'Uzupełnij datę polisy', sub: alert.shortDesc, percent: 0 };
            }
            if (insuranceDays < 0) {
                return {
                    badge: 'WYGASŁA',
                    headline: `Polisa wygasła ${Math.abs(insuranceDays)} dni temu`,
                    sub: `${Math.abs(insuranceDays)} dni po terminie`,
                    percent: 0
                };
            }
            if (insuranceDays <= 30) {
                return {
                    badge: 'UWAGA',
                    headline: `Twoja polisa wygasa za: ${insuranceDays} dni`,
                    sub: `${insuranceDays} dni pozostało`,
                    percent: Math.max(8, Math.round((insuranceDays / 30) * 100))
                };
            }
            return {
                badge: 'AKTYWNA',
                headline: `Polisa ważna jeszcze ${insuranceDays} dni`,
                sub: `${insuranceDays} dni pozostało`,
                percent: Math.min(100, Math.max(40, Math.round((insuranceDays / 365) * 100)))
            };
        }

        if (alert.category === 'SKP') {
            if (inspectionDays === null) {
                return { badge: 'BRAK DANYCH', headline: 'Uzupełnij datę SKP', sub: alert.shortDesc, percent: 0 };
            }
            if (inspectionDays < 0) {
                return {
                    badge: 'WYGASŁO',
                    headline: `Badanie wygasło ${Math.abs(inspectionDays)} dni temu`,
                    sub: `${Math.abs(inspectionDays)} dni po terminie`,
                    percent: 0
                };
            }
            if (inspectionDays <= 14) {
                return {
                    badge: 'UWAGA',
                    headline: `SKP za ${inspectionDays} dni`,
                    sub: `${inspectionDays} dni pozostało`,
                    percent: Math.max(8, Math.round((inspectionDays / 14) * 100))
                };
            }
            return {
                badge: 'WAŻNE',
                headline: `Badanie ważne jeszcze ${inspectionDays} dni`,
                sub: `${inspectionDays} dni pozostało`,
                percent: Math.min(100, Math.max(40, Math.round((inspectionDays / 365) * 100)))
            };
        }

        if (alert.category === 'Olej') {
            if (mileageSinceOil === null) {
                return { badge: 'BRAK WPISU', headline: 'Brak historii oleju', sub: alert.shortDesc, percent: 0 };
            }
            if (mileageSinceOil >= MAX_OIL_KM) {
                return {
                    badge: 'PO TERMINIE',
                    headline: `${mileageSinceOil.toLocaleString('pl-PL')} km od wymiany`,
                    sub: 'Limit 15 000 km przekroczony',
                    percent: 0
                };
            }
            const remaining = MAX_OIL_KM - mileageSinceOil;
            const percent = Math.max(8, Math.round((remaining / MAX_OIL_KM) * 100));
            return {
                badge: mileageSinceOil >= 10000 ? 'UWAGA' : 'OK',
                headline: `Do wymiany ok. ${remaining.toLocaleString('pl-PL')} km`,
                sub: `${mileageSinceOil.toLocaleString('pl-PL')} km od ostatniego serwisu`,
                percent
            };
        }

        return {
            badge: overdueCount > 0 ? 'ZALEGŁE' : soonCount > 0 ? 'UWAGA' : plannedCount > 0 ? 'ZAPLANOWANE' : 'OK',
            headline: overdueCount > 0
                ? `${overdueCount} zadań po terminie`
                : soonCount > 0
                    ? `${soonCount} wymian wkrótce`
                    : plannedCount > 0
                        ? `${plannedCount} zadań w harmonogramie`
                        : 'Brak zaplanowanych wymian',
            sub: urgentCount > 0 ? `${urgentCount} wymaga uwagi` : `${plannedCount} zaplanowanych`,
            percent: plannedCount === 0
                ? 100
                : Math.max(8, Math.round(((plannedCount - urgentCount) / plannedCount) * 100))
        };
    }

    toggleAlert(id) {
        this.selectedAlertId = this.selectedAlertId === id ? null : id;
        this.render();
    }

    closeDrawer() {
        this.selectedAlertId = null;
        this.render();
    }

    renderTab(alert) {
        const isOpen = this.selectedAlertId === alert.id;
        return `
            <button
                type="button"
                class="alert-tab alert-tab--${escapeHTML(alert.type)} ${isOpen ? 'alert-tab--open' : ''}"
                data-id="${escapeHTML(alert.id)}"
                aria-expanded="${isOpen}"
                aria-label="${escapeHTML(alert.tabLabel)} — ${escapeHTML(alert.severityLabel)}"
                title="${escapeHTML(alert.title)}"
            >
                <span class="alert-tab__icon">
                    <i data-lucide="${escapeHTML(alert.icon)}"></i>
                </span>
                <span class="alert-tab__code">${escapeHTML(alert.tabCode)}</span>
                <span class="alert-tab__label">${escapeHTML(alert.tabLabel)}</span>
                ${alert.type === 'critical' || alert.type === 'warning' ? `<span class="alert-tab__dot" aria-hidden="true"></span>` : ''}
            </button>
        `;
    }

    renderDrawer(alert, vehicle) {
        const status = this.getStatusMeta(alert, vehicle);
        const typeClass = `alert-drawer__inner--${alert.type}`;

        return `
            <aside class="alert-drawer alert-drawer--open" aria-label="Szczegóły alertu ${escapeHTML(alert.category)}">
                <div class="alert-drawer__inner ${typeClass}">
                    <header class="alert-drawer__toolbar">
                        <button type="button" class="alert-drawer__close btn-icon" aria-label="Zamknij panel">
                            <i data-lucide="x"></i>
                        </button>
                    </header>

                    <div class="alert-status">
                        <div class="alert-status__head">
                            <span class="alert-status__title">Status</span>
                            <span class="alert-status__badge alert-status__badge--${escapeHTML(alert.type)}">${escapeHTML(status.badge)}</span>
                        </div>
                        <p class="alert-status__headline">${escapeHTML(status.headline)}</p>
                        <p class="alert-status__sub">${escapeHTML(status.sub)}</p>
                        <div class="alert-status__bar" role="presentation">
                            <span class="alert-status__bar-fill alert-status__bar-fill--${escapeHTML(alert.type)}" style="width: ${status.percent}%"></span>
                        </div>
                    </div>

                    <div class="alert-detail">
                        <div class="alert-detail__meta">
                            <span class="alert-detail__category">${escapeHTML(alert.category)}</span>
                            <span class="alert-detail__severity alert-detail__severity--${escapeHTML(alert.type)}">${escapeHTML(alert.severityLabel)}</span>
                        </div>

                        <h3 class="alert-detail__title">${escapeHTML(alert.title)}</h3>
                        <p class="alert-detail__summary">${escapeHTML(alert.shortDesc)}</p>

                        ${alert.infoLabel ? `
                            <div class="alert-detail__highlight">
                                <span class="alert-detail__highlight-label">Na co uważać</span>
                                <p>${escapeHTML(alert.infoLabel)}</p>
                            </div>
                        ` : ''}

                        <div class="alert-detail__help">
                            <h4 class="alert-detail__help-title">
                                <i data-lucide="info"></i>
                                Wyjaśnienie
                            </h4>
                            <p>${escapeHTML(alert.helpTip)}</p>
                        </div>

                        ${alert.actionText && alert.actionTab ? `
                            <button type="button" class="btn-primary alert-detail__action" data-tab="${escapeHTML(alert.actionTab)}">
                                <span>${escapeHTML(alert.actionText)}</span>
                                <i data-lucide="arrow-right"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </aside>
        `;
    }

    render() {
        const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);
        const drawerOpen = !!this.selectedAlertId;

        document.body.classList.toggle('alert-drawer-open', drawerOpen);

        if (!vehicle) {
            this.innerHTML = '';
            refreshIcons();
            return;
        }

        const alerts = this.buildAlerts(vehicle);
        if (this.selectedAlertId && !alerts.some(a => a.id === this.selectedAlertId)) {
            this.selectedAlertId = null;
        }

        const selected = alerts.find(a => a.id === this.selectedAlertId);

        this.innerHTML = `
            <div class="alert-system ${drawerOpen ? 'alert-system--drawer-open' : ''}" data-tutorial="reminders-panel">
                <div class="alert-system__backdrop ${drawerOpen ? 'alert-system__backdrop--open' : ''}" aria-hidden="${!drawerOpen}"></div>

                ${selected ? this.renderDrawer(selected, vehicle) : ''}

                <nav class="alert-dock" aria-label="Alerty pojazdu">
                    ${alerts.map(alert => this.renderTab(alert)).join('')}
                </nav>
            </div>
        `;

        refreshIcons();
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.querySelector('.alert-system__backdrop')?.addEventListener('click', () => this.closeDrawer());
        this.querySelector('.alert-drawer__close')?.addEventListener('click', () => this.closeDrawer());

        this.querySelectorAll('.alert-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                this.toggleAlert(btn.getAttribute('data-id'));
            });
        });

        this.querySelector('.alert-detail__action')?.addEventListener('click', (e) => {
            const tab = e.currentTarget.getAttribute('data-tab');
            document.dispatchEvent(new CustomEvent('navigate-tab', { detail: tab, bubbles: true }));
            this.closeDrawer();
        });
    }
}

customElements.define('reminder-system', ReminderSystem);

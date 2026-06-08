import { store, escapeHTML } from '../lib/store.js';
import { daysUntil } from '../lib/dateUtils.js';
import { refreshIcons } from '../lib/icons.js';

class ReminderSystem extends HTMLElement {
    constructor() {
        super();
        this.showExtendedTips = {};
    }

    connectedCallback() {
        this.unsubscribe = store.subscribe(() => this.render());
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    calculateDaysRemaining(dueDateStr) {
        return daysUntil(dueDateStr);
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Brak informacji';
        const d = new Date(dateStr);
        return d.toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    toggleTip(id) {
        this.showExtendedTips[id] = !this.showExtendedTips[id];
        this.render();
    }

    render() {
        const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);
        if (!vehicle) {
            this.innerHTML = `
                <div class="reminders-panel reminders-panel--empty">
                    <p class="empty-state-desc">Wybierz lub dodaj pojazd, aby zobaczyć alerty serwisowe.</p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const inspectionDays = this.calculateDaysRemaining(vehicle.nextInspectionDate);
        const insuranceDays = this.calculateDaysRemaining(vehicle.insuranceDueDate);

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

        const plannedHighPriority = store.replacementItems.filter(
            item => item.vehicleId === vehicle.id && item.status === 'planned' && item.priority === 'high'
        );

        const alerts = [];

        // 1. INSPECTION
        if (inspectionDays !== null) {
            if (inspectionDays < 0) {
                alerts.push({
                    id: 'inspection_overdue',
                    type: 'critical',
                    title: 'Przegląd techniczny wygasł!',
                    shortDesc: `Twój termin okresowego badania technicznego minął ${Math.abs(inspectionDays)} dni temu (${this.formatDate(vehicle.nextInspectionDate)}).`,
                    infoLabel: 'KARA OD 1500 ZŁ + RYZYKO ZATRZYMANIA DOWODU REJESTRACYJNEGO',
                    helpTip: 'Bez ważnego badania technicznego ubezpieczyciel OC/AC może odmówić wypłaty odszkodowania po kolizji z Twojej winy. Niezwłocznie udaj się na Stację Kontroli Pojazdów (SKP). Diagnosta sprawdzi zbieżność, analizę spalin, wycieki płynów oraz siłę hamowania.',
                    icon: 'alert-triangle',
                    actionText: 'Zarejestruj przegląd',
                    actionTab: 'logs'
                });
            } else if (inspectionDays <= 14) {
                alerts.push({
                    id: 'inspection_due_soon',
                    type: 'warning',
                    title: 'Konieczność wykonania badania technicznego',
                    shortDesc: `Kolejne urzędowe badanie techniczne za ${inspectionDays} dni (${this.formatDate(vehicle.nextInspectionDate)}).`,
                    infoLabel: 'ZALECANA REZERWACJA TERMINU W SKP',
                    helpTip: 'Przed wizytą upewnij się, że nie palą się żadne kontrolki ostrzegawcze (np. Check Engine) i sprawdź oświetlenie (żarówki tablicy rejestracyjnej, pozycje, kierunkowskazy). Zabierz ze sobą 98 PLN (lub 161 PLN jeśli auto ma instalację LPG).',
                    icon: 'calendar',
                    actionText: 'Szczegóły ewidencji',
                    actionTab: 'logs'
                });
            } else {
                alerts.push({
                    id: 'inspection_ok',
                    type: 'success',
                    title: 'Badanie techniczne ważne',
                    shortDesc: `Pozostało jeszcze ${inspectionDays} dni ważności dowodu (${this.formatDate(vehicle.nextInspectionDate)}).`,
                    helpTip: 'Twój pojazd posiada aktualne dopuszczenie do ruchu drogowego. Kolejna weryfikacja diagnostyczna nie wymaga pośpiechu.',
                    icon: 'shield-check'
                });
            }
        } else {
            alerts.push({
                id: 'inspection_missing',
                type: 'info',
                title: 'Uzupełnij datę przeglądu technicznego',
                shortDesc: 'Nie zarejestrowano daty kolejnego badania dla tego auta.',
                helpTip: 'Przejdź do edycji pojazdu i dopisz datę kolejnego urzędowego badania technicznego, aby system automatycznie przypomniał Ci o wizycie w SKP.',
                icon: 'info'
            });
        }

        // 2. INSURANCE
        if (insuranceDays !== null) {
            if (insuranceDays < 0) {
                alerts.push({
                    id: 'insurance_overdue',
                    type: 'critical',
                    title: 'Brak ubezpieczenia OC!',
                    shortDesc: `Polisa ubezpieczeniowa wygasła ${Math.abs(insuranceDays)} dni temu (${this.formatDate(vehicle.insuranceDueDate)}).`,
                    infoLabel: 'RYZYKO KARY OD UFG DO 8480 ZŁ (KARA NAWET ZA JEDEN DZIEŃ ZWŁOKI)',
                    helpTip: 'Ubezpieczeniowy Fundusz Gwarancyjny nakłada wysokie kary finansowe za brak ciągłości OC, nawet gdy auto stoi bezczynnie w garażu. Niezwłocznie przedłuż polisę taryfową online u agenta.',
                    icon: 'alert-triangle'
                });
            } else if (insuranceDays <= 30) {
                alerts.push({
                    id: 'insurance_due_soon',
                    type: 'warning',
                    title: 'Zbliża się płatność polisy OC',
                    shortDesc: `Ubezpieczenie OC traci ważność za ${insuranceDays} dni (${this.formatDate(vehicle.insuranceDueDate)}).`,
                    infoLabel: 'ZALECANE PORÓWNANIE OFERT KONKURENCYJNYCH',
                    helpTip: 'Aktualna polisa automatycznie wznowi się na kolejny rok (by uniknąć przerw), ale najczęściej nowa cena taryfowa jest wyższa niż oferty promocyjne u konkurencji. Warto porównać ceny 14 dni przed końcem ubezpieczenia.',
                    icon: 'shield-check',
                    actionText: 'Przejdź do pulpitu',
                    actionTab: 'pulpit'
                });
            } else {
                alerts.push({
                    id: 'insurance_ok',
                    type: 'success',
                    title: 'Ubezpieczenie OC aktywne',
                    shortDesc: `Twoja polisa chroni auto jeszcze przez ${insuranceDays} dni.`,
                    helpTip: 'Masz pełne bezpieczeństwo cywilne w trasie. Spokojna głowa.',
                    icon: 'shield-check'
                });
            }
        }

        // 3. OIL
        const MAX_OIL_KM = 15000;
        if (mileageSinceOil !== null) {
            if (mileageSinceOil >= MAX_OIL_KM) {
                alerts.push({
                    id: 'oil_exceeded',
                    type: 'critical',
                    title: 'Olej silnikowy do natychmiastowej wymiany!',
                    shortDesc: `Przejechałeś już ${mileageSinceOil.toLocaleString('pl-PL')} km od ostatniego serwisu olejowego (zalecana wymiana co max 15k).`,
                    infoLabel: 'UWAGA: STARY OLEJ TRACI LEPKOŚĆ, CO PROWADZI DO ZATARCIA TURBINY',
                    helpTip: 'Zanieczyszczenia i opiłki metalu osiadające w filtrze oraz degradacja wiskozowa oleju drastycznie skracają żywotność panewek wału korbowego i układów rozrządu ze zmienną fazą. Umów wizytę w warsztacie w tym tygodniu.',
                    icon: 'alert-triangle',
                    actionText: 'Zapisz nową wymianę',
                    actionTab: 'logs'
                });
            } else if (mileageSinceOil >= 10000) {
                const remaining = MAX_OIL_KM - mileageSinceOil;
                alerts.push({
                    id: 'oil_due_soon',
                    type: 'warning',
                    title: 'Zaplanuj zakup oleju i filtrów',
                    shortDesc: `Od wymiany oleju przejechano ${mileageSinceOil.toLocaleString('pl-PL')} km. Pozostało ok. ${remaining.toLocaleString('pl-PL')} km interwału.`,
                    infoLabel: 'ZALECANY PRZEGLĄD PRZY PRZEBIEGU ' + (lastOilReplacementMileage ? (lastOilReplacementMileage + MAX_OIL_KM).toLocaleString('pl-PL') : '') + ' KM',
                    helpTip: 'Kup zestaw dedykowanych filtrów olejowych, powietrza oraz kabinowy. Sprawdź specyfikację lepkości i normy producenta (np. VW 507.00 dla silników TDI lub VW 504.00 dla benzynowych TFSI). Zaplanuj wizytę w warsztacie z wyprzedzeniem.',
                    icon: 'clock',
                    actionText: 'Przeglądaj historię',
                    actionTab: 'logs'
                });
            } else {
                const remaining = MAX_OIL_KM - mileageSinceOil;
                alerts.push({
                    id: 'oil_ok',
                    type: 'success',
                    title: 'Olej silnikowy w doskonałej kondycji',
                    shortDesc: `Wymieniono ${mileageSinceOil.toLocaleString('pl-PL')} km temu (Kolejny serwis za ${remaining.toLocaleString('pl-PL')} km).`,
                    helpTip: 'Czysty olej zachowuje wszystkie właściwości redukcji tarcia. Monitoruj regularnie poziom oleju bagnetem raz w miesiącu.',
                    icon: 'shield-check'
                });
            }
        } else {
            alerts.push({
                id: 'oil_missing',
                type: 'warning',
                title: 'Brak danych o wymianie oleju',
                shortDesc: 'Nie odnaleźliśmy żadnych zarejestrowanych wpisów o wymianie filtrów i oleju silnikowego.',
                infoLabel: 'NIEZBĘDNE SPRAWDZENIE STANU SILNIKA',
                helpTip: 'Wprowadź historyczny koszt i przebieg ostatniego serwisu olejowego w zakładce "Ewidencja Serwisowa" jako pozycję z kategorii "Filtry, Oleje i Płyny", aby system mógł automatycznie prognozować zużycie.',
                icon: 'info',
                actionText: 'Dodaj wpis oleju',
                actionTab: 'logs'
            });
        }

        // 4. URGENT PARTS
        if (plannedHighPriority.length > 0) {
            alerts.push({
                id: 'urgent_parts',
                type: 'warning',
                title: `Planowane pilne wymiany części (${plannedHighPriority.length})`,
                shortDesc: `Masz zapisane pilne zadania techniczne dla ${escapeHTML(vehicle.brand)} ${escapeHTML(vehicle.model)}.`,
                infoLabel: 'KLUCZOWE BEZPIECZEŃSTWO DRÓG',
                helpTip: `Lista zaplanowanych elementów o wysokim priorytecie: ${plannedHighPriority.map(p => escapeHTML(p.itemName)).join(', ')}. Po wymianie części u mechanika, oznacz te pozycje jako "Wymienione", a system automatycznie utworzy wpis w księdze kosztów.`,
                icon: 'wrench',
                actionText: 'Zobacz tablicę części',
                actionTab: 'wymiany'
            });
        }

        // Sort: critical first, warning second, info third, success at the end
        const priorityOrder = { critical: 0, warning: 1, info: 2, success: 3 };
        alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);

        const criticalCount = alerts.filter(a => a.type === 'critical').length;
        const warningCount = alerts.filter(a => a.type === 'warning').length;

        this.innerHTML = `
            <div class="reminders-panel" data-tutorial="reminders-panel">
                
                <!-- Reminder Header Bar -->
                <div class="reminders-header">
                    <div class="reminders-header__left">
                        <div class="reminders-bell-wrapper">
                            <i data-lucide="bell"></i>
                        </div>
                        <div>
                            <h3 class="reminders-title">Aktywny System Przypomnień i Alertów</h3>
                            <p class="reminders-desc">
                                Informacje i alerty eksploatacyjne dla pojazdu <strong>${escapeHTML(vehicle.brand)} ${escapeHTML(vehicle.model)}</strong> (${escapeHTML(vehicle.plateNumber)})
                            </p>
                        </div>
                    </div>

                    <!-- Dynamic status Pill alerts summaries -->
                    <div class="reminders-pills">
                        ${criticalCount > 0 ? `
                            <span class="status-pill status-pill--critical">
                                ${criticalCount} CRITICAL ALERT${criticalCount > 1 ? 'S' : ''}
                            </span>
                        ` : ''}
                        ${warningCount > 0 ? `
                            <span class="status-pill status-pill--warning">
                                ${warningCount} Ostrzeżenie${warningCount > 1 ? 'a' : 'ie'}
                            </span>
                        ` : ''}
                        ${criticalCount === 0 && warningCount === 0 ? `
                            <span class="status-pill status-pill--safe">
                                Pojazd zweryfikowany: Bezpieczny
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Primary Reminders List -->
                <div class="reminders-list">
                    <div class="reminders-grid">
                        ${alerts.map(alert => {
            const isOpen = this.showExtendedTips[alert.id] || false;

            let cardModifier = 'alert-card--info';

            if (alert.type === 'critical') {
                cardModifier = 'alert-card--critical';
            } else if (alert.type === 'warning') {
                cardModifier = 'alert-card--warning';
            } else if (alert.type === 'success') {
                cardModifier = 'alert-card--success';
            }

            return `
                                <div class="alert-card ${cardModifier}">
                                    <div class="alert-card__top">
                                        <div class="alert-card__header-row">
                                            <div class="alert-icon">
                                                <i data-lucide="${escapeHTML(alert.icon)}"></i>
                                            </div>
                                            <div>
                                                <h4 class="alert-title">
                                                    ${escapeHTML(alert.title)}
                                                </h4>
                                                <p class="alert-desc">
                                                    ${escapeHTML(alert.shortDesc)}
                                                </p>
                                            </div>
                                        </div>

                                        ${alert.infoLabel ? `
                                            <div class="alert-status-bar">
                                                <span class="alert-status-bar__dot"></span>
                                                <span class="alert-status-bar__label">Status prawno-techniczny: </span>
                                                <span class="alert-status-bar__val">${escapeHTML(alert.infoLabel)}</span>
                                            </div>
                                        ` : ''}

                                        ${isOpen ? `
                                            <div class="alert-details">
                                                <div class="alert-details__header">
                                                    <i data-lucide="info"></i>
                                                    <span>Dlaczego to jest ważne &amp; Wskazówki:</span>
                                                </div>
                                                <p>${escapeHTML(alert.helpTip)}</p>
                                            </div>
                                        ` : ''}
                                    </div>

                                    <!-- Bottom Interactive Row -->
                                    <div class="alert-actions">
                                        <button class="btn-toggle-tip" data-id="${escapeHTML(alert.id)}">
                                            <span>${isOpen ? 'Ukryj wyjaśnienie' : 'Więcej szczegółów'}</span>
                                            <i data-lucide="chevron-right" class="${isOpen ? 'rotate-90' : ''}"></i>
                                        </button>
                                        
                                        ${alert.actionText && alert.actionTab ? `
                                            <button class="btn-action-tab" data-tab="${escapeHTML(alert.actionTab)}">
                                                <span>${escapeHTML(alert.actionText)}</span>
                                                <i data-lucide="chevron-right"></i>
                                            </button>
                                        ` : ''}
                                    </div>
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
            </div>
        `;

        refreshIcons();

        // Hook events
        this.querySelectorAll('.btn-toggle-tip').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                this.toggleTip(id);
            });
        });

        this.querySelectorAll('.btn-action-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.getAttribute('data-tab');
                document.dispatchEvent(new CustomEvent('navigate-tab', { detail: tab, bubbles: true }));
            });
        });
    }
}

customElements.define('reminder-system', ReminderSystem);

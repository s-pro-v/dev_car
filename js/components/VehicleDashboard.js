import { store, escapeHTML } from '../lib/store.js';
import { daysUntil } from '../lib/dateUtils.js';
import { analyzePlannedReplacements } from '../lib/maintenanceUtils.js';
import { refreshIcons } from '../lib/icons.js';

class VehicleDashboard extends HTMLElement {
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

    getHealthScore(vehicle, logs, replacements) {
        let score = 100;
        const inspectionDays = this.calculateDaysRemaining(vehicle.nextInspectionDate);
        const insuranceDays = this.calculateDaysRemaining(vehicle.insuranceDueDate);

        if (insuranceDays !== null && insuranceDays < 0) score -= 35;
        else if (insuranceDays !== null && insuranceDays <= 30) score -= 15;

        if (inspectionDays !== null && inspectionDays < 0) score -= 25;
        else if (inspectionDays !== null && inspectionDays <= 30) score -= 10;

        const oilLogs = logs.filter(l => l.category === 'oil_fluids');
        const lastOil = oilLogs.sort((a, b) => b.mileage - a.mileage)[0];
        if (lastOil) {
            const kmSinceOil = vehicle.mileage - lastOil.mileage;
            if (kmSinceOil >= 15000) score -= 20;
            else if (kmSinceOil >= 10000) score -= 8;
        } else {
            score -= 10;
        }

        const urgentParts = analyzePlannedReplacements(vehicle, replacements).urgentCount;
        score -= urgentParts * 5;

        return Math.max(0, Math.min(100, score));
    }

    getHealthLabel(score) {
        if (score >= 85) return { text: 'Doskonały', modifier: 'dashboard-health--good' };
        if (score >= 65) return { text: 'Stabilny', modifier: 'dashboard-health--ok' };
        if (score >= 45) return { text: 'Wymaga uwagi', modifier: 'dashboard-health--warn' };
        return { text: 'Krytyczny', modifier: 'dashboard-health--bad' };
    }

    formatDaysLabel(days) {
        if (days === null) return 'Brak daty';
        if (days < 0) return `${Math.abs(days)} dni po terminie`;
        if (days === 0) return 'Dziś';
        if (days === 1) return 'Jutro';
        return `Za ${days} dni`;
    }

    exportVehicleData(vehicle) {
        const payload = {
            exportedAt: new Date().toISOString(),
            vehicle,
            serviceLogs: store.serviceLogs.filter(l => l.vehicleId === vehicle.id),
            replacementItems: store.replacementItems.filter(r => r.vehicleId === vehicle.id)
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `drivecare-${vehicle.plateNumber.replace(/\s+/g, '-')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }

    bindEvents(vehicle) {
        this.querySelectorAll('[data-goto-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('navigate-tab', {
                    detail: btn.getAttribute('data-goto-tab'),
                    bubbles: true
                }));
            });
        });

        const exportBtn = this.querySelector('#export-vehicle-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportVehicleData(vehicle));
        }
    }

    render() {
        const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);

        if (!vehicle) {
            this.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="layout-dashboard"></i>
                    <h3 class="empty-state-title">Wybierz lub Dodaj Pojazd</h3>
                    <p class="empty-state-desc">
                        Pulpit pokaże podsumowanie stanu technicznego, kosztów i nadchodzących terminów dla aktywnego auta.
                    </p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const logs = store.serviceLogs
            .filter(l => l.vehicleId === vehicle.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const replacements = store.replacementItems.filter(r => r.vehicleId === vehicle.id);
        const replacementAnalysis = analyzePlannedReplacements(vehicle, replacements);
        const planned = replacementAnalysis.planned;
        const recentLogs = logs.slice(0, 3);
        const upcomingParts = planned.slice(0, 3);

        const totalSpent = logs.reduce((sum, l) => sum + l.cost, 0);
        const yearSpent = logs
            .filter(l => new Date(l.date).getFullYear() === new Date().getFullYear())
            .reduce((sum, l) => sum + l.cost, 0);

        const inspectionDays = this.calculateDaysRemaining(vehicle.nextInspectionDate);
        const insuranceDays = this.calculateDaysRemaining(vehicle.insuranceDueDate);
        const healthScore = this.getHealthScore(vehicle, logs, replacements);
        const health = this.getHealthLabel(healthScore);

        const checklist = [
            { icon: 'gauge', text: 'Sprawdź poziom oleju i płynu chłodniczego bagnetem / zbiorniczkiem.' },
            { icon: 'circle-dot', text: 'Oceń stan opon — min. 1,6 mm bieżnika to próg prawny w Polsce.' },
            { icon: 'lightbulb', text: 'Przetestuj światła, kierunkowskazy i wycieraczki przed dłuższą trasą.' },
            { icon: 'file-check', text: 'Miej pod ręką dowód rejestracyjny, polisę OC i ostatni wpis z przeglądu.' }
        ];

        this.innerHTML = `
            <div class="dashboard-layout">
                <div class="dashboard-intro">
                    <div>
                        <span class="dashboard-intro__badge">Pulpit Pojazdu</span>
                        <h2 class="dashboard-intro__title">${escapeHTML(vehicle.brand)} ${escapeHTML(vehicle.model)} — podsumowanie</h2>
                        <p class="dashboard-intro__desc">
                            Szybki przegląd kondycji technicznej, kosztów serwisowych i najbliższych działań dla pojazdu ${escapeHTML(vehicle.plateNumber)}.
                        </p>
                    </div>
                    <button id="export-vehicle-btn" class="btn-secondary" data-tutorial="export-data">
                        <i data-lucide="download"></i>
                        <span>Eksportuj dane JSON</span>
                    </button>
                </div>

                <div class="dashboard-health ${health.modifier}" data-tutorial="dashboard-health">
                    <div class="dashboard-health__ring">
                        <span class="dashboard-health__score">${healthScore}</span>
                        <span class="dashboard-health__unit">/100</span>
                    </div>
                    <div>
                        <h3 class="dashboard-health__label">Wskaźnik kondycji: ${health.text}</h3>
                        <p class="dashboard-health__desc">
                            Ocena na podstawie terminów SKP, polisy OC, interwału oleju i pilnych wymian części.
                        </p>
                    </div>
                </div>

                <div class="grid-4 dashboard-stats">
                    <div class="dashboard-stat">
                        <span class="dashboard-stat__label">Koszt w tym roku</span>
                        <span class="dashboard-stat__value">${yearSpent.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span>
                    </div>
                    <div class="dashboard-stat">
                        <span class="dashboard-stat__label">Łącznie serwisów</span>
                        <span class="dashboard-stat__value">${totalSpent.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</span>
                    </div>
                    <div class="dashboard-stat">
                        <span class="dashboard-stat__label">Kolejny przegląd</span>
                        <span class="dashboard-stat__value ${inspectionDays !== null && inspectionDays < 0 ? 'dashboard-stat__value--bad' : ''}">${this.formatDaysLabel(inspectionDays)}</span>
                    </div>
                    <div class="dashboard-stat">
                        <span class="dashboard-stat__label">Polisa OC</span>
                        <span class="dashboard-stat__value ${insuranceDays !== null && insuranceDays < 0 ? 'dashboard-stat__value--bad' : ''}">${this.formatDaysLabel(insuranceDays)}</span>
                    </div>
                </div>

                <div class="grid-2">
                    <div class="dashboard-panel">
                        <div class="dashboard-panel__header">
                            <div class="section-title">
                                <i data-lucide="history"></i>
                                <span>Ostatnie serwisy</span>
                            </div>
                            <button class="btn-action-tab" data-goto-tab="logs">
                                <span>Cała ewidencja</span>
                                <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                        <div class="dashboard-panel__body">
                            ${recentLogs.length > 0 ? recentLogs.map(log => `
                                <div class="dashboard-list-item">
                                    <div>
                                        <span class="dashboard-list-item__title">${escapeHTML(log.workDone)}</span>
                                        <span class="dashboard-list-item__meta">${escapeHTML(log.date)} · ${escapeHTML(log.mileage.toLocaleString('pl-PL'))} km</span>
                                    </div>
                                    <span class="dashboard-list-item__cost">${escapeHTML(log.cost.toLocaleString('pl-PL', { minimumFractionDigits: 2 }))} zł</span>
                                </div>
                            `).join('') : `
                                <p class="dashboard-empty">Brak wpisów serwisowych. Dodaj pierwszy w ewidencji.</p>
                            `}
                        </div>
                    </div>

                    <div class="dashboard-panel">
                        <div class="dashboard-panel__header">
                            <div class="section-title">
                                <i data-lucide="layers"></i>
                                <span>Planowane wymiany (${planned.length})</span>
                            </div>
                            <button class="btn-action-tab" data-goto-tab="wymiany">
                                <span>Tablica zadań</span>
                                <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                        <div class="dashboard-panel__body">
                            ${upcomingParts.length > 0 ? upcomingParts.map(item => `
                                <div class="dashboard-list-item">
                                    <div>
                                        <span class="dashboard-list-item__title">${escapeHTML(item.itemName)}</span>
                                        <span class="dashboard-list-item__meta">${item.targetDate ? escapeHTML(item.targetDate) : 'Bez terminu'} · ~${escapeHTML((item.estimatedCost || 0).toLocaleString('pl-PL'))} zł</span>
                                    </div>
                                    <span class="badge badge--${item.priority === 'high' ? 'critical' : item.priority === 'medium' ? 'warning' : 'info'}">${item.priority === 'high' ? 'Pilne' : item.priority === 'medium' ? 'Ważne' : 'Plan'}</span>
                                </div>
                            `).join('') : `
                                <p class="dashboard-empty">Brak zaplanowanych wymian — świetna wiadomość!</p>
                            `}
                        </div>
                    </div>
                </div>

                <div class="dashboard-panel">
                    <div class="dashboard-panel__header">
                        <div class="section-title">
                            <i data-lucide="clipboard-check"></i>
                            <span>Checklista przed jazdą</span>
                        </div>
                        <button class="btn-action-tab" data-goto-tab="koszty">
                            <span>Analiza kosztów</span>
                            <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                    <div class="dashboard-checklist">
                        ${checklist.map(item => `
                            <div class="dashboard-checklist__item">
                                <i data-lucide="${item.icon}"></i>
                                <span>${escapeHTML(item.text)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.bindEvents(vehicle);
        refreshIcons();
    }
}

customElements.define('vehicle-dashboard', VehicleDashboard);

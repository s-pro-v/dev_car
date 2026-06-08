import { store, escapeHTML } from '../lib/store.js';
import { destroyDateInputs, enhanceDateInputs } from '../lib/datePicker.js';
import { showConfirm } from '../lib/confirmDialog.js';
import { getTodayISO } from '../lib/dateUtils.js';
import { refreshIcons } from '../lib/icons.js';

class ServiceLogBook extends HTMLElement {
    constructor() {
        super();
        this.showModal = false;
        this.isEditMode = false;
        this.editingLogId = null;
    }

    connectedCallback() {
        this.unsubscribe = store.subscribe(() => {
            if (this.showModal) return;
            this.render();
        });
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        destroyDateInputs(this);
    }

    getCategoryBadge(category) {
        switch (category) {
            case 'inspection':
                return `<span class="badge badge--warning">Przegląd</span>`;
            case 'repair':
                return `<span class="badge badge--critical">Naprawa</span>`;
            case 'oil_fluids':
                return `<span class="badge badge--info">Eksploatacja</span>`;
            case 'wheels_tires':
                return `<span class="badge badge--success">Opony</span>`;
            default:
                return `<span class="badge badge--gray">Inne</span>`;
        }
    }

    render() {
        destroyDateInputs(this);

        const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);
        if (!vehicle) {
            this.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="shield-alert"></i>
                    <h3 class="empty-state-title">Wybierz lub Dodaj Pojazd</h3>
                    <p class="empty-state-desc">
                        Zanim zaczniesz prowadzić ewidencję napraw i przeglądów ("co zrobiono, za ile"), musisz dodać pojazd do bazy powyżej.
                    </p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const activeLogs = store.serviceLogs
            .filter(log => log.vehicleId === vehicle.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        const totalCost = activeLogs.reduce((sum, log) => sum + log.cost, 0);
        const averageCost = activeLogs.length > 0 ? (totalCost / activeLogs.length) : 0;

        const editingLog = this.editingLogId ? activeLogs.find(l => l.id === this.editingLogId) : null;

        this.innerHTML = `
            <div class="stack">
                <!-- Dynamic stats row -->
                <div class="grid-3" data-tutorial="log-stats">
                    <div class="stat-card">
                        <div class="stat-icon stat-icon--primary">
                            <i data-lucide="coins"></i>
                        </div>
                        <div>
                            <h4 class="stat-label">Łączny Koszt Serwisów</h4>
                            <p class="stat-value">
                                ${totalCost.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN
                            </p>
                        </div>
                    </div>
 
                    <div class="stat-card">
                        <div class="stat-icon stat-icon--secondary">
                            <i data-lucide="wrench"></i>
                        </div>
                        <div>
                            <h4 class="stat-label">Liczba Wpisów w Ewidencji</h4>
                            <p class="stat-value">
                                ${activeLogs.length} ${activeLogs.length === 1 ? 'wpis' : activeLogs.length > 1 && activeLogs.length < 5 ? 'wpisy' : 'wpisów'}
                            </p>
                        </div>
                    </div>
 
                    <div class="stat-card">
                        <div class="stat-icon stat-icon--muted">
                            <i data-lucide="milestone"></i>
                        </div>
                        <div>
                            <h4 class="stat-label">Średni Koszt Wyjazdu do Garażu</h4>
                            <p class="stat-value">
                                ${averageCost.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PLN
                            </p>
                        </div>
                    </div>
                </div>
 
                <!-- Main Records Section -->
                <div class="card card--flush">
                    <div class="card-header--compact">
                        <div class="section-title">
                            <i data-lucide="badge-info"></i>
                            <span>Historia Napraw i Przeglądów</span>
                        </div>
                        <button id="open-add-log-btn" class="btn-primary" data-tutorial="add-log-btn">
                            <i data-lucide="plus"></i>
                            <span>Nowy wpis serwisowy</span>
                        </button>
                    </div>
 
                    ${activeLogs.length > 0 ? `
                        <div class="log-table-wrapper">
                            <table class="log-table">
                                <thead>
                                    <tr>
                                        <th class="th-title">Kiedy</th>
                                        <th>Przebieg</th>
                                        <th class="th-title">Co Zrobiono / Opis serwisu</th>
                                        <th class="th-cost">Za ile</th>
                                        <th>Kiedy Kolejny Przegląd / Termin</th>
                                        <th class="log-table__actions-head">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${activeLogs.map(log => `
                                        <tr class="log-row">
                                            <td class="log-table__cell--date">
                                                <div class="log-date">
                                                    <i data-lucide="calendar"></i>
                                                    <span>${escapeHTML(log.date)}</span>
                                                </div>
                                            </td>
                                            <td class="log-table__cell--mono">
                                                ${escapeHTML(log.mileage.toLocaleString('pl-PL'))} km
                                            </td>
                                            <td>
                                                <div class="log-info-cell">
                                                    <div class="log-work-title-row">
                                                        ${this.getCategoryBadge(log.category)}
                                                        <span class="log-work-title" title="${escapeHTML(log.workDone)}">
                                                            ${escapeHTML(log.workDone)}
                                                        </span>
                                                    </div>
                                                    ${log.notes ? `
                                                        <p class="log-notes">
                                                            ${escapeHTML(log.notes)}
                                                        </p>
                                                    ` : ''}
                                                </div>
                                            </td>
                                            <td>
                                                <span class="log-cost-badge">
                                                    ${escapeHTML(log.cost.toLocaleString('pl-PL', { minimumFractionDigits: 2 }))} zł
                                                </span>
                                            </td>
                                            <td class="log-table__cell--mono">
                                                ${log.nextInspectionDate ? `
                                                    <div class="log-next-date">
                                                        Kolejny: <span class="log-next-date__val">${escapeHTML(log.nextInspectionDate)}</span>
                                                    </div>
                                                ` : `
                                                    <span class="log-next-date__none">Brak terminu</span>
                                                `}
                                            </td>
                                            <td class="log-table__actions-cell">
                                                <div class="row-actions">
                                                    <button class="edit-log-btn row-actions-btn" data-id="${escapeHTML(log.id)}" title="Edytuj wpis">
                                                        <i data-lucide="edit-2"></i>
                                                    </button>
                                                    <button class="delete-log-btn row-actions-btn row-actions-btn--danger" data-id="${escapeHTML(log.id)}" title="Usuń wpis">
                                                        <i data-lucide="trash-2"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : `
                        <div class="empty-state empty-state--embedded">
                            <i data-lucide="wrench"></i>
                            <h4 class="empty-state-title empty-state-title--muted">Książka serwisowa pusta</h4>
                            <p class="empty-state-desc">
                                Nie zalogowałeś jeszcze żadnego serwisu dla pojazdu **${escapeHTML(vehicle.brand)} ${escapeHTML(vehicle.model)}**. Kliknij przycisk powyżej, aby wprowadzić dane.
                            </p>
                        </div>
                    `}
                </div>
 
                <!-- Form Modal (Add / Edit) -->
                <div id="log-modal" class="custom-modal ${this.showModal ? 'modal-open' : ''}">
                    <div class="modal-backdrop"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                ${this.isEditMode ? 'Edycja Wpisu Serwisowego' : 'Zapisz Nową Naprawę / Przegląd'}
                            </h3>
                            <button id="close-modal-btn" class="btn-icon">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="log-form" class="form-grid">
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label">Kiedy przegląd / serwis (Data) *</label>
                                        <input type="date" id="log-date" required value="${editingLog ? escapeHTML(editingLog.date) : getTodayISO()}" class="form-input form-input--mono">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Przebieg podczas serwisu (km) *</label>
                                        <input type="number" id="log-mileage" required value="${editingLog ? escapeHTML(editingLog.mileage) : escapeHTML(vehicle.mileage)}" class="form-input form-input--mono">
                                    </div>
                                </div>
 
                                <div class="form-group">
                                    <label class="form-label">Co zrobiono / Zakres naprawy *</label>
                                    <input type="text" id="log-work" required value="${editingLog ? escapeHTML(editingLog.workDone) : ''}" class="form-input" placeholder="np. Wymiana oleju silnikowego, filtrów oraz klocków przód">
                                </div>
 
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label form-label--primary">Koszt Serwisu (Za ile PLN) *</label>
                                        <input type="number" id="log-cost" required step="any" value="${editingLog ? escapeHTML(editingLog.cost) : 0}" class="form-input form-input--mono form-input--highlight-primary" placeholder="np. 450.00">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Kategoria serwisu</label>
                                        <select id="log-category" class="form-select">
                                            <option value="repair" ${editingLog && editingLog.category === 'repair' ? 'selected' : ''}>Naprawa i wymiana części</option>
                                            <option value="inspection" ${editingLog && editingLog.category === 'inspection' ? 'selected' : ''}>Przegląd okresowy / SKP</option>
                                            <option value="oil_fluids" ${editingLog && editingLog.category === 'oil_fluids' ? 'selected' : ''}>Filtry, oleje i płyny eksploatacyjne</option>
                                            <option value="wheels_tires" ${editingLog && editingLog.category === 'wheels_tires' ? 'selected' : ''}>Opony i wyważanie kół</option>
                                            <option value="other" ${editingLog && editingLog.category === 'other' ? 'selected' : ''}>Inne / Akcesoria</option>
                                        </select>
                                    </div>
                                </div>
 
                                <div class="form-group">
                                    <label class="form-label">Data Kolejnego Przeglądu (Reminder)</label>
                                    <input type="date" id="log-next-inspection" value="${editingLog && editingLog.nextInspectionDate ? escapeHTML(editingLog.nextInspectionDate) : ''}" class="form-input form-input--mono">
                                </div>
 
                                <div class="form-group">
                                    <label class="form-label">Zapiski, części, szczegółowe kody seryjne</label>
                                    <textarea id="log-notes" rows="3" class="form-textarea" placeholder="Wpisz szczegóły...">${editingLog && editingLog.notes ? escapeHTML(editingLog.notes) : ''}</textarea>
                                </div>
 
                                <div class="form-actions">
                                    <button type="button" id="cancel-modal-btn" class="btn-secondary">Anuluj</button>
                                    <button type="submit" class="btn-primary">
                                        ${this.isEditMode ? 'Zapisz zmiany' : 'Dodaj wpis do bazy'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        refreshIcons();
        enhanceDateInputs(this);
        this.attachEventListeners();
    }

    attachEventListeners() {
        const openAdd = this.querySelector('#open-add-log-btn');
        if (openAdd) {
            openAdd.addEventListener('click', () => {
                this.showModal = true;
                this.isEditMode = false;
                this.editingLogId = null;
                document.documentElement.classList.add('modal-open');
                document.body.classList.add('modal-open');
                this.render();
            });
        }

        const closeModal = () => {
            this.showModal = false;
            this.editingLogId = null;
            this.isEditMode = false;
            document.documentElement.classList.remove('modal-open');
            document.body.classList.remove('modal-open');
            this.render();
        };

        const closeBtn = this.querySelector('#close-modal-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);

        const cancelBtn = this.querySelector('#cancel-modal-btn');
        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        const backdrop = this.querySelector('#log-modal .modal-backdrop');
        if (backdrop) backdrop.addEventListener('click', closeModal);

        // Edit button triggers
        this.querySelectorAll('.edit-log-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.editingLogId = btn.getAttribute('data-id');
                this.showModal = true;
                this.isEditMode = true;
                document.documentElement.classList.add('modal-open');
                document.body.classList.add('modal-open');
                this.render();
            });
        });

        // Delete button triggers
        this.querySelectorAll('.delete-log-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const confirmed = await showConfirm({
                    title: 'Usuń wpis serwisowy',
                    message: 'Czy na pewno chcesz usunąć ten wpis z historii? Tej operacji nie można cofnąć.',
                    confirmLabel: 'Tak, usuń',
                    cancelLabel: 'Anuluj',
                    variant: 'danger'
                });
                if (confirmed) {
                    store.deleteServiceLog(id);
                }
            });
        });

        // Form Submit
        const form = this.querySelector('#log-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);
                if (vehicle) {
                    const payload = {
                        id: this.isEditMode && this.editingLogId ? this.editingLogId : 'log-' + Date.now(),
                        vehicleId: vehicle.id,
                        date: this.querySelector('#log-date').value,
                        mileage: parseInt(this.querySelector('#log-mileage').value) || 0,
                        workDone: this.querySelector('#log-work').value,
                        cost: parseFloat(this.querySelector('#log-cost').value) || 0,
                        nextInspectionDate: this.querySelector('#log-next-inspection').value || undefined,
                        category: this.querySelector('#log-category').value,
                        notes: this.querySelector('#log-notes').value || undefined
                    };

                    if (this.isEditMode) {
                        store.updateServiceLog(payload);
                    } else {
                        store.addServiceLog(payload);
                    }

                    this.showModal = false;
                    this.editingLogId = null;
                    this.isEditMode = false;
                    document.documentElement.classList.remove('modal-open');
                    document.body.classList.remove('modal-open');
                    this.render();
                }
            });
        }
    }
}

customElements.define('service-logbook', ServiceLogBook);

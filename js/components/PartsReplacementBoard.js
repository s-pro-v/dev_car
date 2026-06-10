import { store, escapeHTML } from '../lib/store.js';
import { destroyDateInputs, enhanceDateInputs } from '../lib/datePicker.js';
import { showConfirm } from '../lib/confirmDialog.js';
import { daysUntil, getTodayISO } from '../lib/dateUtils.js';
import { getReplacementDueStatus, getVisiblePlannedReplacements, getCompletedReplacementDetails } from '../lib/maintenanceUtils.js';
import { refreshIcons } from '../lib/icons.js';

class PartsReplacementBoard extends HTMLElement {
    constructor() {
        super();
        this.showAddModal = false;
        this.showCompleteModal = false;
        this.completingItem = null;
    }

    connectedCallback() {
        this.unsubscribe = store.subscribe(() => {
            if (this.showAddModal || this.showCompleteModal) return;
            this.render();
        });
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        destroyDateInputs(this);
    }

    getDaysRemainingStr(targetDateStr) {
        if (!targetDateStr) return null;
        const diffDays = daysUntil(targetDateStr);
        if (diffDays === null) return null;

        if (diffDays < 0) {
            return { text: `Zaległe o ${Math.abs(diffDays)} dni!`, isOverdue: true };
        }
        if (diffDays === 0) {
            return { text: 'Dziś termin!', isOverdue: true };
        }
        return { text: `Pozostało ${diffDays} dni`, isOverdue: false };
    }

    render() {
        destroyDateInputs(this);

        const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);
        if (!vehicle) {
            this.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="alert-octagon"></i>
                    <h3 class="empty-state-title">Wybierz lub Dodaj Pojazd</h3>
                    <p class="empty-state-desc">
                        Zanim zaczniesz rozplanowywać pozycje eksploatacyjne do wymiany, dodaj auto na karcie głównej.
                    </p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const activeItems = store.replacementItems.filter(item => item.vehicleId === vehicle.id);
        const plannedItems = getVisiblePlannedReplacements(vehicle, store.replacementItems);
        const finishedItems = activeItems
            .filter(item => item.status === 'completed')
            .sort((a, b) => (b.completedAt || b.id).localeCompare(a.completedAt || a.id));

        const totalForecastCost = plannedItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

        // Simulation dates
        const inspectionCountdown = this.getDaysRemainingStr(vehicle.nextInspectionDate);
        const ocCountdown = this.getDaysRemainingStr(vehicle.insuranceDueDate);

        this.innerHTML = `
            <div class="stack parts-board">
                <div class="parts-intro">
                    <div>
                        <span class="parts-intro__badge">Planowanie Serwisu</span>
                        <h2 class="parts-intro__title">Co do wymiany — ${escapeHTML(vehicle.brand)} ${escapeHTML(vehicle.model)}</h2>
                        <p class="parts-intro__desc">
                            Zalecenia producenta wg profilu serwisowego — po oznaczeniu „Wymienione” pozycja znika z listy do czasu kolejnego terminu.
                            ${vehicle.maintenanceProfileLabel ? `
                                <span class="parts-intro__profile">Harmonogram: ${escapeHTML(vehicle.maintenanceProfileLabel)}</span>
                            ` : ''}
                        </p>
                    </div>
                    <i data-lucide="layers"></i>
                </div>

                <!-- Dynamic Alerts Strip -->
                <div class="grid-2 parts-board__alerts" data-tutorial="parts-countdown">
                    <!-- Inspection alert card -->
                    <div class="countdown-card">
                        <div class="countdown-card__start">
                            <div class="${inspectionCountdown && inspectionCountdown.isOverdue
                ? 'countdown-icon-wrapper countdown-icon-wrapper--overdue'
                : 'countdown-icon-wrapper countdown-icon-wrapper--standard'
            }">
                                <i data-lucide="calendar"></i>
                            </div>
                            <div class="countdown-card__info">
                                <h4 class="countdown-card__title">Okresowy Przegląd Techniczny</h4>
                                <p class="countdown-card__value">
                                    Termin: <span>${escapeHTML(vehicle.nextInspectionDate) || 'Ustalisz powyżej'}</span>
                                </p>
                            </div>
                        </div>
                        ${inspectionCountdown ? `
                            <span class="${inspectionCountdown.isOverdue
                    ? 'countdown-badge countdown-badge--overdue'
                    : 'countdown-badge countdown-badge--standard'
                }">
                                ${escapeHTML(inspectionCountdown.text)}
                            </span>
                        ` : ''}
                    </div>

                    <!-- Insurance OC card -->
                    <div class="countdown-card">
                        <div class="countdown-card__start">
                            <div class="${ocCountdown && ocCountdown.isOverdue
                ? 'countdown-icon-wrapper countdown-icon-wrapper--overdue'
                : 'countdown-icon-wrapper countdown-icon-wrapper--success'
            }">
                                <i data-lucide="shield-check"></i>
                            </div>
                            <div class="countdown-card__info">
                                <h4 class="countdown-card__title">Polisa Ubezpieczeniowa OC</h4>
                                <p class="countdown-card__value">
                                    Koniec: <span>${escapeHTML(vehicle.insuranceDueDate) || 'Ustalisz powyżej'}</span>
                                </p>
                            </div>
                        </div>
                        ${ocCountdown ? `
                            <span class="${ocCountdown.isOverdue
                    ? 'countdown-badge countdown-badge--overdue'
                    : 'countdown-badge countdown-badge--success'
                }">
                                ${escapeHTML(ocCountdown.text)}
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Kanban / Tasks Area -->
                <div class="kanban-layout">
                    
                    <!-- Column 1: Planned Replacements - "Co do wymiany" -->
                    <div class="kanban-column kanban-column--primary">
                        <div class="card-header--compact card-header--compact-wrap">
                            <div class="section-title">
                                <i data-lucide="alert-octagon"></i>
                                <span>Do wymiany i naprawy (${plannedItems.length})</span>
                            </div>
                            <button id="open-add-part-btn" class="btn-primary btn-primary--compact btn-primary--compact-mobile" data-tutorial="add-part-btn">
                                <i data-lucide="plus"></i>
                                <span>Dodaj element</span>
                            </button>
                        </div>

                        <div class="kanban-column__body">
                            ${plannedItems.length > 0 ? plannedItems.map(item => {
                    const daysLeft = this.getDaysRemainingStr(item.targetDate);
                    const mileageLeft = getReplacementDueStatus(item, vehicle);
                    let prioBadge = '';
                    if (item.priority === 'high') {
                        prioBadge = `<span class="badge badge--critical">Krytyczny</span>`;
                    } else if (item.priority === 'medium') {
                        prioBadge = `<span class="badge badge--warning">Ważny</span>`;
                    } else {
                        prioBadge = `<span class="badge badge--info">Zalecany</span>`;
                    }

                    return `
                                    <div class="task-card ${mileageLeft.isOverdue ? 'task-card--overdue' : mileageLeft.isSoon ? 'task-card--soon' : ''}">
                                        <div class="task-card__info">
                                            <div class="task-card__head">
                                                <h4 class="task-title" title="${escapeHTML(item.itemName)}">${escapeHTML(item.itemName)}</h4>
                                                <div class="task-card__badges">
                                                    ${item.source === 'auto' ? `<span class="badge badge--auto">Producent</span>` : ''}
                                                    ${prioBadge}
                                                    ${item.estimatedCost ? `
                                                        <span class="badge badge--gray">
                                                            ~${item.estimatedCost.toLocaleString('pl-PL')} zł
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            </div>
                                            ${item.notes ? `<p class="task-desc">${escapeHTML(item.notes)}</p>` : ''}
                                            ${item.targetMileage ? `
                                                <div class="task-meta">
                                                    <i data-lucide="milestone"></i>
                                                    <span>Cel: <span class="task-meta__date">${item.targetMileage.toLocaleString('pl-PL')} km</span></span>
                                                    <span class="task-meta__days ${mileageLeft.isOverdue ? 'task-meta__days--overdue' : mileageLeft.isSoon ? 'task-meta__days--soon' : 'task-meta__days--standard'}">
                                                        (${escapeHTML(mileageLeft.text)})
                                                    </span>
                                                </div>
                                            ` : ''}
                                            ${item.targetDate ? `
                                                <div class="task-meta">
                                                    <i data-lucide="calendar"></i>
                                                    <span>Planowana data: <span class="task-meta__date">${escapeHTML(item.targetDate)}</span></span>
                                                    ${daysLeft ? `
                                                        <span class="task-meta__days ${daysLeft.isOverdue ? 'task-meta__days--overdue' : 'task-meta__days--standard'}">
                                                            (${escapeHTML(daysLeft.text)})
                                                        </span>
                                                    ` : ''}
                                                </div>
                                            ` : ''}
                                        </div>
                                        <div class="task-actions">
                                            <button class="complete-btn btn-complete" data-id="${escapeHTML(item.id)}" title="Wymieniono! Przenieś do historii serwisu">
                                                <i data-lucide="check-circle"></i>
                                                <span>Wymienione</span>
                                            </button>
                                            <button class="delete-btn btn-icon btn-icon--danger" data-id="${escapeHTML(item.id)}" title="Skasuj zadanie">
                                                <i data-lucide="trash-2"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                }).join('') : `
                                <div class="empty-state empty-state--embedded">
                                    <i data-lucide="check-circle"></i>
                                    <h4 class="empty-state-title empty-state-title--muted">Idealny stan techniczny!</h4>
                                    <p class="empty-state-desc">Twoja lista części do pilnej naprawy jest pusta. Droga wolna!</p>
                                </div>
                            `}
                        </div>

                        ${plannedItems.length > 0 ? `
                            <div class="forecast-bar forecast-bar--flush">
                                <span>Prognozowany budżet na naprawy:</span>
                                <span class="forecast-bar__val">
                                    ~${totalForecastCost.toLocaleString('pl-PL')} PLN
                                </span>
                            </div>
                        ` : ''}
                    </div>

                    <!-- Column 2: Completed / Replaced items - History -->
                    <div class="kanban-column kanban-column--history">
                        <div class="card-header--compact">
                            <div class="section-title">
                                <i data-lucide="shield-check"></i>
                                <span>Ostatnio wymienione (${finishedItems.length})</span>
                            </div>
                        </div>

                        <div class="kanban-column__body">
                            ${finishedItems.length > 0 ? `
                                <div class="completed-list">
                                    ${finishedItems.map(item => {
                    const history = getCompletedReplacementDetails(item, vehicle, store.replacementItems);
                    return `
                                        <div class="completed-item">
                                            <div class="completed-item__body">
                                                <span class="completed-item__title" title="${escapeHTML(item.itemName)}">${escapeHTML(item.itemName)}</span>
                                                ${history.performedText ? `
                                                    <p class="completed-item__meta">${escapeHTML(history.performedText)}</p>
                                                ` : ''}
                                                ${history.nextText ? `
                                                    <p class="completed-item__next">
                                                        <i data-lucide="calendar-clock"></i>
                                                        <span>Kolejna wymiana: ${escapeHTML(history.nextText)}</span>
                                                    </p>
                                                ` : ''}
                                                ${item.notes ? `<p class="task-desc task-desc--done">${escapeHTML(item.notes)}</p>` : ''}
                                            </div>
                                            <div class="completed-item__actions">
                                                <span class="badge badge--success">OK</span>
                                                <button class="delete-btn btn-icon btn-icon--danger" data-id="${escapeHTML(item.id)}" title="Usuń z pamięci">
                                                    <i data-lucide="trash-2"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `;
                }).join('')}
                                </div>
                            ` : `
                                <div class="empty-state empty-state--embedded-lg">
                                    <p class="empty-state-desc empty-state-desc--italic">
                                        Brak historii niedawnych wymian w tym sezonie.
                                    </p>
                                </div>
                            `}
                        </div>
                    </div>

                </div>

                <!-- Modal: Create planned replacement item -->
                <div id="add-part-modal" class="custom-modal ${this.showAddModal ? 'modal-open' : ''}">
                    <div class="modal-backdrop"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                Co należy wymienić / naprawić?
                            </h3>
                            <button class="close-add-modal-btn btn-icon">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="add-part-form" class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Nazwa części lub usterki *</label>
                                    <input type="text" id="part-name" required class="form-input" placeholder="np. Tarcze i klocki hamulcowe tył, Amortyzatory przód, Łączniki stabilizatora...">
                                </div>

                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label">Szacowany koszt części & pracy (PLN)</label>
                                        <input type="number" id="part-cost" class="form-input form-input--mono" placeholder="np. 500">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Priorytet wymiany</label>
                                        <select id="part-priority" class="form-select">
                                            <option value="high">Krytyczny (Zagraża bezpieczeństwu/awarią SILNIKA)</option>
                                            <option value="medium" selected>Ważny (Zalecany do najbliższego serwisu oleju)</option>
                                            <option value="low">Niski (Mogę jeszcze poczekać, drobna usterka)</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Planowany termin wymiany (Opcjonalnie)</label>
                                    <input type="date" id="part-date" class="form-input form-input--mono">
                                </div>

                                <div class="form-group">
                                    <label class="form-label">Zalecenia i dodatkowe notatki</label>
                                    <textarea id="part-notes" rows="3" class="form-textarea" placeholder="Zanotuj zalecanego producenta (np. Bosch, TRW, Lemförder) lub specyficzne objawy..."></textarea>
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="close-add-modal-btn btn-secondary">Anuluj</button>
                                    <button type="submit" class="btn-primary">Dodaj do listy wymian</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Modal: Confirm Completion -->
                ${this.completingItem ? `
                <div id="complete-modal" class="custom-modal ${this.showCompleteModal ? 'modal-open' : ''}">
                    <div class="modal-backdrop"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                Potwierdzenie Wykonania Wymiany
                            </h3>
                            <button class="close-complete-modal-btn btn-icon">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="complete-part-form" class="form-grid">
                                <div class="form-notice form-notice--success" role="status">
                                    <i data-lucide="book-check"></i>
                                    <div class="form-notice__content">
                                        <p class="form-notice__title">Zapis w ewidencji serwisowej</p>
                                        <p class="form-notice__text">
                                            Pozycja <strong>${escapeHTML(this.completingItem.itemName)}</strong> zostanie zapisana w historii napraw po zatwierdzeniu.
                                            Uzupełnij datę, przebieg i koszt — wpis trafi też do analizy kosztów.
                                        </p>
                                    </div>
                                </div>

                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label">Data montażu / wymiany *</label>
                                        <input type="date" id="complete-date" required value="${getTodayISO()}" class="form-input form-input--mono">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Przebieg auta przy wymianie (km) *</label>
                                        <input type="number" id="complete-mileage" required value="${escapeHTML(vehicle.mileage)}" class="form-input form-input--mono">
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label class="form-label form-label--success">Rzeczywisty koszt łączny (Za ile PLN) *</label>
                                    <input type="number" id="complete-cost" required value="${escapeHTML(this.completingItem.estimatedCost || 0)}" class="form-input form-input--mono form-input--highlight-success">
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="close-complete-modal-btn btn-secondary">Anuluj</button>
                                    <button type="submit" class="btn-primary btn-primary--success">Zatwierdź i zapisz w ewidencji</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                ` : ''}

            </div>
        `;

        refreshIcons();
        enhanceDateInputs(this);
        this.attachEventListeners();
    }

    attachEventListeners() {
        const setModalOpen = (open) => {
            document.documentElement.classList.toggle('modal-open', open);
            document.body.classList.toggle('modal-open', open);
        };

        const openAdd = this.querySelector('#open-add-part-btn');
        if (openAdd) {
            openAdd.addEventListener('click', () => {
                this.showAddModal = true;
                setModalOpen(true);
                this.render();
            });
        }

        this.querySelectorAll('.close-add-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showAddModal = false;
                if (!this.showCompleteModal) setModalOpen(false);
                this.render();
            });
        });

        this.querySelectorAll('.close-complete-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showCompleteModal = false;
                this.completingItem = null;
                if (!this.showAddModal) setModalOpen(false);
                this.render();
            });
        });

        this.querySelectorAll('#add-part-modal .modal-backdrop, #complete-modal .modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                const modal = backdrop.closest('.custom-modal');
                if (modal?.id === 'add-part-modal') {
                    this.showAddModal = false;
                }
                if (modal?.id === 'complete-modal') {
                    this.showCompleteModal = false;
                    this.completingItem = null;
                }
                if (!this.showAddModal && !this.showCompleteModal) setModalOpen(false);
                this.render();
            });
        });

        // Add part submit
        const addForm = this.querySelector('#add-part-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);
                if (vehicle) {
                    const newItem = {
                        id: 'item-' + Date.now(),
                        vehicleId: vehicle.id,
                        itemName: this.querySelector('#part-name').value,
                        estimatedCost: parseFloat(this.querySelector('#part-cost').value) || 0,
                        priority: this.querySelector('#part-priority').value,
                        status: 'planned',
                        targetDate: this.querySelector('#part-date').value || undefined,
                        notes: this.querySelector('#part-notes').value || undefined
                    };
                    store.addReplacementItem(newItem);
                    this.showAddModal = false;
                    if (!this.showCompleteModal) setModalOpen(false);
                    this.render();
                }
            });
        }

        // Delete triggers
        this.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const confirmed = await showConfirm({
                    title: 'Usuń zadanie',
                    message: 'Czy na pewno chcesz skasować to zadanie z listy wymian?',
                    confirmLabel: 'Tak, usuń',
                    cancelLabel: 'Anuluj',
                    variant: 'danger'
                });
                if (confirmed) {
                    store.deleteReplacementItem(id);
                }
            });
        });

        // Complete trigger opens modal
        this.querySelectorAll('.complete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const item = store.replacementItems.find(r => r.id === id);
                if (item) {
                    this.completingItem = item;
                    this.showCompleteModal = true;
                    setModalOpen(true);
                    this.render();
                }
            });
        });

        // Complete form submit
        const completeForm = this.querySelector('#complete-part-form');
        if (completeForm) {
            completeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.completingItem) {
                    const date = this.querySelector('#complete-date').value;
                    const mileage = parseInt(this.querySelector('#complete-mileage').value) || 0;
                    const cost = parseFloat(this.querySelector('#complete-cost').value) || 0;

                    store.completeReplacementItem(this.completingItem.id, date, mileage, cost);

                    this.showCompleteModal = false;
                    this.completingItem = null;
                    if (!this.showAddModal) setModalOpen(false);
                    this.render();
                }
            });
        }
    }
}

customElements.define('parts-board', PartsReplacementBoard);

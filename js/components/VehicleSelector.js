import { store, escapeHTML } from '../lib/store.js';
import { destroyDateInputs, enhanceDateInputs } from '../lib/datePicker.js';
import { destroyBrandInputs, enhanceBrandInputs, resolveBrandName } from '../lib/brandAutocomplete.js';
import { destroyModelInputs, enhanceModelInputs, resolveModelName } from '../lib/modelAutocomplete.js';
import { destroyEngineInputs, enhanceEngineInputs, resolveEngineName } from '../lib/engineAutocomplete.js';
import { destroyYearInputs, enhanceYearInputs, resolveYear } from '../lib/yearAutocomplete.js';
import { showConfirm } from '../lib/confirmDialog.js';
import { daysUntil } from '../lib/dateUtils.js';
import { refreshIcons } from '../lib/icons.js';

class VehicleSelector extends HTMLElement {
    constructor() {
        super();
        this.showAddModal = false;
        this.showEditModal = false;
    }

    connectedCallback() {
        this.unsubscribe = store.subscribe(() => {
            if (this.showAddModal || this.showEditModal) return;
            this.render();
        });
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        destroyDateInputs(this);
        destroyBrandInputs(this);
        destroyModelInputs(this);
        destroyEngineInputs(this);
        destroyYearInputs(this);
    }

    render() {
        destroyDateInputs(this);
        destroyBrandInputs(this);
        destroyModelInputs(this);
        destroyEngineInputs(this);
        destroyYearInputs(this);

        const vehicles = store.vehicles;
        const selectedId = store.selectedVehicleId;
        const activeCar = vehicles.find(v => v.id === selectedId);

        let vehicleOptions = vehicles.map(v =>
            `<option value="${escapeHTML(v.id)}" ${v.id === selectedId ? 'selected' : ''} class="vehicle-select__option">${escapeHTML(v.brand)} ${escapeHTML(v.model)} (${escapeHTML(v.plateNumber)})</option>`
        ).join('');

        let specsHtml = '';
        if (activeCar) {
            specsHtml = `
                <div class="vehicle-specs">
                    
                    <!-- Przebieg -->
                    <div class="spec-tile">
                        <i data-lucide="milestone"></i>
                        <div>
                            <span class="spec-tile-label">Przebieg</span>
                            <span class="spec-tile-value">${escapeHTML(activeCar.mileage.toLocaleString('pl-PL'))} km</span>
                        </div>
                    </div>
 
                    <!-- Silnik / Rocznik -->
                    <div class="spec-tile">
                        <i data-lucide="hash"></i>
                        <div>
                            <span class="spec-tile-label">Silnik / Rocznik</span>
                            <span class="spec-tile-value spec-tile-value--truncate" title="${escapeHTML(activeCar.engine || 'N/A')} • ${escapeHTML(activeCar.year)}">
                                ${escapeHTML(activeCar.engine || 'N/A')} • ${escapeHTML(activeCar.year)}
                            </span>
                        </div>
                    </div>
 
                    <!-- Przegląd SKP -->
                    <div class="spec-tile">
                        <i data-lucide="calendar"></i>
                        <div>
                            <span class="spec-tile-label">Kolejny Przegląd</span>
                            <span class="spec-tile-value ${activeCar.nextInspectionDate && daysUntil(activeCar.nextInspectionDate) < 0
                    ? 'spec-tile-value--warning'
                    : ''
                }">
                                ${escapeHTML(activeCar.nextInspectionDate) || 'Nie ustawiono'}
                            </span>
                        </div>
                    </div>
 
                    <!-- Ubezpieczenie OC -->
                    <div class="spec-tile">
                        <i data-lucide="shield-alert"></i>
                        <div>
                            <span class="spec-tile-label">Ubezpieczenie OC</span>
                            <span class="spec-tile-value spec-tile-value--truncate">
                                ${escapeHTML(activeCar.insuranceDueDate) || 'Nie ustawiono'}
                            </span>
                        </div>
                    </div>

                    ${activeCar.maintenanceProfileLabel ? `
                    <div class="spec-tile">
                        <i data-lucide="calendar-clock"></i>
                        <div>
                            <span class="spec-tile-label">Harmonogram serwisowy</span>
                            <span class="spec-tile-value spec-tile-value--truncate" title="${escapeHTML(activeCar.maintenanceProfileLabel)}">
                                ${escapeHTML(activeCar.maintenanceProfileLabel)}
                            </span>
                        </div>
                    </div>
                    ` : ''}
 
                </div>
            `;
        }

        this.innerHTML = `
            <div class="vehicle-selector">
            <div class="vehicle-hero">
                <div class="vehicle-hero__header">
                    
                    <!-- Active car label -->
                    <div class="vehicle-info">
                        <div class="vehicle-icon-wrapper">
                            <i data-lucide="car"></i>
                        </div>
                        <div>
                            <h3 class="vehicle-title-label">Aktywny Pojazd</h3>
                            ${activeCar ? `
                                <div class="vehicle-name-row">
                                    <span class="vehicle-name">${escapeHTML(activeCar.brand)} ${escapeHTML(activeCar.model)}</span>
                                    <span class="vehicle-plate">${escapeHTML(activeCar.plateNumber)}</span>
                                </div>
                            ` : `
                                <p class="guide-desc guide-desc--spacing">Brak pojazdów w bazie. Dodaj swój pierwszy pojazd.</p>
                            `}
                        </div>
                    </div>
 
                    <!-- Dropdown selector and vehicle actions -->
                    <div class="vehicle-controls" data-tutorial="vehicle-controls">
                        ${vehicles.length > 0 ? `
                            <div class="vehicle-select-wrapper">
                                <select id="vehicle-dropdown-select" class="vehicle-select">
                                    ${vehicleOptions}
                                </select>
                                <div class="vehicle-select-arrow">
                                    <span>▼</span>
                                </div>
                            </div>
                        ` : ''}

                        ${activeCar ? `
                            <div class="vehicle-actions">
                                <button id="open-edit-btn" class="btn-icon" title="Edytuj pojazd">
                                    <i data-lucide="edit-2"></i>
                                </button>
                                <button id="delete-car-btn" class="btn-icon btn-icon--danger" title="Usuń pojazd">
                                    <i data-lucide="trash-2"></i>
                                </button>
                            </div>
                        ` : ''}

                        <button id="open-add-btn" class="btn-primary">
                            <i data-lucide="plus"></i>
                            <span>Dodaj auto</span>
                        </button>
                    </div>
                </div>
 
                ${specsHtml}
            </div>
 
                <!-- Modal Dodawania Pojazdu -->
                <div id="add-modal" class="custom-modal ${this.showAddModal ? 'modal-open' : ''}">
                    <div class="modal-backdrop"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                Nowy Pojazd w Ewidencji
                            </h3>
                            <button class="close-modal-btn btn-icon" data-modal="add">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="add-vehicle-form" class="form-grid">
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label" for="add-brand">Marka <span class="form-label__required">*</span></label>
                                        <input
                                            type="text"
                                            id="add-brand"
                                            required
                                            class="form-input"
                                            placeholder="Zacznij pisać, np. Volks…"
                                            autocomplete="off"
                                            data-brand-autocomplete
                                        >
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="add-model">Model <span class="form-label__required">*</span></label>
                                        <input
                                            type="text"
                                            id="add-model"
                                            required
                                            class="form-input"
                                            placeholder="Najpierw wybierz markę"
                                            autocomplete="off"
                                            data-model-autocomplete
                                            data-brand-input="#add-brand"
                                        >
                                    </div>
                                </div>
                                <div class="form-grid form-grid--3">
                                    <div class="form-group">
                                        <label class="form-label">Nr rejestracyjny <span class="form-label__required">*</span></label>
                                        <input type="text" id="add-plate" required class="form-input form-input--uppercase" placeholder="np. PO12345">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="add-year">Rocznik</label>
                                        <input
                                            type="text"
                                            id="add-year"
                                            class="form-input form-input--mono"
                                            placeholder="Rocznik"
                                            autocomplete="off"
                                            inputmode="numeric"
                                            data-year-autocomplete
                                            data-brand-input="#add-brand"
                                            data-model-input="#add-model"
                                        >
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="add-engine">Silnik</label>
                                        <input
                                            type="text"
                                            id="add-engine"
                                            class="form-input"
                                            placeholder="Najpierw wybierz model"
                                            autocomplete="off"
                                            data-engine-autocomplete
                                            data-brand-input="#add-brand"
                                            data-model-input="#add-model"
                                        >
                                    </div>
                                </div>
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label">Aktualny przebieg (km)</label>
                                        <input type="number" id="add-mileage" value="150000" class="form-input">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Numer VIN (Opcjonalnie)</label>
                                        <input type="text" id="add-vin" class="form-input form-input--uppercase form-input--mono" maxlength="17" placeholder="17 znaków VIN">
                                    </div>
                                </div>
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label">Data Kolejnego Przeglądu</label>
                                        <input type="date" id="add-inspection" class="form-input form-input--mono">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Koniec Ubezpieczenia OC</label>
                                        <input type="date" id="add-insurance" class="form-input form-input--mono">
                                    </div>
                                </div>
                                <label class="form-check form-check--boxed">
                                    <input type="checkbox" id="add-auto-schedule" checked>
                                    <span>Wygeneruj harmonogram wymian wg marki pojazdu</span>
                                </label>
                                <p class="form-hint">Na podstawie marki i opisu silnika dodamy typowe interwały serwisowe (olej, płyn hamulcowy, rozrząd itd.) do tablicy wymian.</p>
                                <div class="form-actions">
                                    <button type="button" class="close-modal-btn btn-secondary" data-modal="add">Anuluj</button>
                                    <button type="submit" class="btn-primary">Dodaj auto</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
 
                <!-- Modal Edycji Pojazdu -->
                ${activeCar ? `
                <div id="edit-modal" class="custom-modal ${this.showEditModal ? 'modal-open' : ''}">
                    <div class="modal-backdrop"></div>
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 class="modal-title">
                                Edycja Informacji o Pojeździe
                            </h3>
                            <button class="close-modal-btn btn-icon" data-modal="edit">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <form id="edit-vehicle-form" class="form-grid">
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label" for="edit-brand">Marka <span class="form-label__required">*</span></label>
                                        <input
                                            type="text"
                                            id="edit-brand"
                                            required
                                            value="${escapeHTML(activeCar.brand)}"
                                            class="form-input"
                                            placeholder="Zacznij pisać markę"
                                            autocomplete="off"
                                            data-brand-autocomplete
                                        >
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="edit-model">Model <span class="form-label__required">*</span></label>
                                        <input
                                            type="text"
                                            id="edit-model"
                                            required
                                            value="${escapeHTML(activeCar.model)}"
                                            class="form-input"
                                            placeholder="Zacznij pisać model"
                                            autocomplete="off"
                                            data-model-autocomplete
                                            data-brand-input="#edit-brand"
                                        >
                                    </div>
                                </div>
                                <div class="form-grid form-grid--3">
                                    <div class="form-group">
                                        <label class="form-label">Nr rejestracyjny <span class="form-label__required">*</span></label>
                                        <input type="text" id="edit-plate" required value="${escapeHTML(activeCar.plateNumber)}" class="form-input form-input--uppercase">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="edit-year">Rocznik</label>
                                        <input
                                            type="text"
                                            id="edit-year"
                                            value="${escapeHTML(activeCar.year)}"
                                            class="form-input form-input--mono"
                                            placeholder="Rocznik"
                                            autocomplete="off"
                                            inputmode="numeric"
                                            data-year-autocomplete
                                            data-brand-input="#edit-brand"
                                            data-model-input="#edit-model"
                                        >
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" for="edit-engine">Silnik</label>
                                        <input
                                            type="text"
                                            id="edit-engine"
                                            value="${escapeHTML(activeCar.engine || '')}"
                                            class="form-input"
                                            placeholder="Zacznij pisać silnik"
                                            autocomplete="off"
                                            data-engine-autocomplete
                                            data-brand-input="#edit-brand"
                                            data-model-input="#edit-model"
                                        >
                                    </div>
                                </div>
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label">Aktualny przebieg (km)</label>
                                        <input type="number" id="edit-mileage" value="${escapeHTML(activeCar.mileage)}" class="form-input">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Numer VIN (Opcjonalnie)</label>
                                        <input type="text" id="edit-vin" value="${escapeHTML(activeCar.vin || '')}" class="form-input form-input--uppercase form-input--mono" maxlength="17" placeholder="17 znaków VIN">
                                    </div>
                                </div>
                                <div class="form-grid form-grid--2">
                                    <div class="form-group">
                                        <label class="form-label">Data Kolejnego Przeglądu</label>
                                        <input type="date" id="edit-inspection" value="${escapeHTML(activeCar.nextInspectionDate || '')}" class="form-input form-input--mono">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Koniec Ubezpieczenia OC</label>
                                        <input type="date" id="edit-insurance" value="${escapeHTML(activeCar.insuranceDueDate || '')}" class="form-input form-input--mono">
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="close-modal-btn btn-secondary" data-modal="edit">Anuluj</button>
                                    <button type="submit" class="btn-primary">Zapisz auto</button>
                                </div>
                                <label class="form-check form-check--boxed">
                                    <input type="checkbox" id="edit-regenerate-schedule">
                                    <span>Przelicz harmonogram wymian wg nowej marki / silnika</span>
                                </label>
                                <p class="form-hint">Usuwa automatyczne zadania i tworzy je ponownie — ręcznie dodane pozycje pozostają.</p>
                            </form>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;

        refreshIcons();
        enhanceDateInputs(this);
        enhanceBrandInputs(this);
        enhanceModelInputs(this);
        enhanceEngineInputs(this);
        enhanceYearInputs(this);

        this.attachEventListeners();
    }

    closeModal(modalType) {
        if (modalType === 'add') this.showAddModal = false;
        if (modalType === 'edit') this.showEditModal = false;
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        this.render();
    }

    openModal(modalType) {
        if (modalType === 'add') this.showAddModal = true;
        if (modalType === 'edit') this.showEditModal = true;
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
        this.render();
    }

    attachEventListeners() {
        const select = this.querySelector('#vehicle-dropdown-select');
        if (select) {
            select.addEventListener('change', (e) => {
                store.selectVehicle(e.target.value);
            });
        }

        const openAdd = this.querySelector('#open-add-btn');
        if (openAdd) {
            openAdd.addEventListener('click', () => this.openModal('add'));
        }

        const openEdit = this.querySelector('#open-edit-btn');
        if (openEdit) {
            openEdit.addEventListener('click', () => this.openModal('edit'));
        }

        this.querySelectorAll('.close-modal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModal(btn.getAttribute('data-modal'));
            });
        });

        this.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', () => {
                const modal = backdrop.closest('.custom-modal');
                if (modal?.id === 'add-modal') this.closeModal('add');
                if (modal?.id === 'edit-modal') this.closeModal('edit');
            });
        });

        const addForm = this.querySelector('#add-vehicle-form');
        if (addForm) {
            addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const brand = resolveBrandName(this.querySelector('#add-brand').value.trim());
                const model = resolveModelName(brand, this.querySelector('#add-model').value.trim());
                const plateNumber = this.querySelector('#add-plate').value.toUpperCase().trim();

                if (!brand || !model || !plateNumber) return;

                const newCar = {
                    id: 'vehicle-' + Date.now(),
                    brand,
                    model,
                    plateNumber,
                    year: resolveYear(brand, model, this.querySelector('#add-year').value),
                    engine: resolveEngineName(brand, model, this.querySelector('#add-engine').value.trim()),
                    mileage: parseInt(this.querySelector('#add-mileage').value, 10) || 0,
                    vin: this.querySelector('#add-vin').value.toUpperCase().trim() || undefined,
                    nextInspectionDate: this.querySelector('#add-inspection').value || undefined,
                    insuranceDueDate: this.querySelector('#add-insurance').value || undefined
                };
                const generateSchedule = this.querySelector('#add-auto-schedule')?.checked !== false;
                const result = store.addVehicle(newCar, { generateSchedule });
                this.closeModal('add');

                if (result.generatedCount > 0) {
                    document.dispatchEvent(new CustomEvent('navigate-tab', { detail: 'wymiany', bubbles: true }));
                }
            });
        }

        const editForm = this.querySelector('#edit-vehicle-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const activeCar = store.vehicles.find(v => v.id === store.selectedVehicleId);
                if (activeCar) {
                    const brand = resolveBrandName(this.querySelector('#edit-brand').value.trim());
                    const model = resolveModelName(brand, this.querySelector('#edit-model').value.trim());
                    const updatedCar = {
                        id: activeCar.id,
                        brand,
                        model,
                        plateNumber: this.querySelector('#edit-plate').value.toUpperCase().trim(),
                        year: resolveYear(brand, model, this.querySelector('#edit-year').value),
                        engine: resolveEngineName(brand, model, this.querySelector('#edit-engine').value.trim()),
                        mileage: parseInt(this.querySelector('#edit-mileage').value) || 0,
                        vin: this.querySelector('#edit-vin').value.toUpperCase().trim() || undefined,
                        nextInspectionDate: this.querySelector('#edit-inspection').value || undefined,
                        insuranceDueDate: this.querySelector('#edit-insurance').value || undefined,
                        maintenanceProfile: activeCar.maintenanceProfile,
                        maintenanceProfileLabel: activeCar.maintenanceProfileLabel
                    };
                    const regenerateSchedule = this.querySelector('#edit-regenerate-schedule')?.checked === true;
                    store.updateVehicle(updatedCar, { regenerateSchedule });
                    this.closeModal('edit');
                }
            });
        }

        const deleteBtn = this.querySelector('#delete-car-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                const activeCar = store.vehicles.find(v => v.id === store.selectedVehicleId);
                if (!activeCar) return;

                const confirmed = await showConfirm({
                    title: 'Usuń pojazd',
                    message: `Czy na pewno chcesz usunąć pojazd ${activeCar.brand} ${activeCar.model}? Usunie to również wszystkie powiązane wpisy serwisowe i zadania.`,
                    confirmLabel: 'Tak, usuń pojazd',
                    cancelLabel: 'Anuluj',
                    variant: 'danger'
                });

                if (confirmed) {
                    store.deleteVehicle(activeCar.id);
                    this.showEditModal = false;
                    this.showAddModal = false;
                    this.render();
                }
            });
        }
    }
}

customElements.define('vehicle-selector', VehicleSelector);

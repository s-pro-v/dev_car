import { store, escapeHTML } from '../lib/store.js';
import { refreshIcons } from '../lib/icons.js';

class ProjectEstimator extends HTMLElement {
    constructor() {
        super();
        this.fuelType = 'diesel';
        this.consumption = 6.5;
        this.pricePerUnit = 6.80;
        this.monthlyKm = 1500;
    }

    connectedCallback() {
        this.unsubscribe = store.subscribe(() => this.render());
        this.render();
    }

    disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
    }

    render() {
        const vehicle = store.vehicles.find(v => v.id === store.selectedVehicleId);
        if (!vehicle) {
            this.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="trending-up"></i>
                    <h3 class="empty-state-title">Wybierz lub Dodaj Pojazd</h3>
                    <p class="empty-state-desc">
                        Zanim przejdziesz do szczegółowych wykresów, dodaj i wybierz auto na karcie głównej.
                    </p>
                </div>
            `;
            refreshIcons();
            return;
        }

        const activeLogs = store.serviceLogs.filter(log => log.vehicleId === vehicle.id);

        // Group by categories safely (preventing prototype pollution)
        const categoryTotals = activeLogs.reduce((acc, log) => {
            const safeCategory = ['repair', 'inspection', 'oil_fluids', 'wheels_tires', 'other'].includes(log.category)
                ? log.category
                : 'other';
            acc[safeCategory] = (acc[safeCategory] || 0) + log.cost;
            return acc;
        }, {});

        const totalSpent = activeLogs.reduce((sum, log) => sum + log.cost, 0);

        const categoriesList = [
            { key: 'repair', label: 'Naprawy i Części' },
            { key: 'inspection', label: 'Przeglądy / Urzędy' },
            { key: 'oil_fluids', label: 'Filtry, Oleje i Płyny' },
            { key: 'wheels_tires', label: 'Opony i Koła' },
            { key: 'other', label: 'Inne Wydatki' }
        ];

        // Fuel calculations
        const fuelCostPer100km = this.consumption * this.pricePerUnit;
        const monthlyFuelCost = (this.monthlyKm / 100) * fuelCostPer100km;
        const yearlyFuelCost = monthlyFuelCost * 12;

        const ecoSaving = (0.5 * this.pricePerUnit * (this.monthlyKm / 100) * 12).toFixed(0);

        this.innerHTML = `
            <div class="stack">
                
                <!-- Intro info bar -->
                <div class="estimator-intro">
                    <div>
                        <span class="estimator-intro__badge">Kluczowe Analizy</span>
                        <h2 class="estimator-intro__title">Centrum Rentowności i Kalkulator Eksploatacji</h2>
                        <p class="estimator-intro__desc">
                            Analizuj wydatki warsztatowe, badaj ich rozkład procentowy oraz planuj długoterminowe budżety podróży paliwowych.
                        </p>
                    </div>
                    <i data-lucide="compass"></i>
                </div>

                <div class="grid-2">
                    
                    <!-- Left Card: Category Breakdown -->
                    <div class="breakdown-card" data-tutorial="cost-breakdown">
                        <div class="breakdown-card__header">
                            <h3 class="section-title">
                                <i data-lucide="coins"></i>
                                <span>Rozkład Wydatków Warsztatowych</span>
                            </h3>
                        </div>

                        ${activeLogs.length > 0 ? `
                            <div class="stack--md">
                                <div class="breakdown-total">
                                    <span class="breakdown-total__label">Łączny zarejestrowany koszt:</span>
                                    <span class="breakdown-total__val">
                                        ${totalSpent.toLocaleString('pl-PL')} PLN
                                    </span>
                                </div>

                                <div class="category-list">
                                    ${categoriesList.map(cat => {
            const amt = categoryTotals[cat.key] || 0;
            const pct = totalSpent > 0 ? (amt / totalSpent) * 100 : 0;
            return `
                                            <div class="category-row">
                                                <div class="category-row__info">
                                                    <span class="category-row__label">
                                                        <span class="category-dot category-dot--${cat.key}"></span>
                                                        ${cat.label}
                                                    </span>
                                                    <span class="category-row__value">
                                                        ${amt.toLocaleString('pl-PL')} PLN <span class="category-row__pct category-row__pct--${cat.key}">(${pct.toFixed(1)}%)</span>
                                                    </span>
                                                </div>
                                                <div class="progress-bar">
                                                    <div class="progress-fill progress-fill--${cat.key}" data-progress="${pct}"></div>
                                                </div>
                                            </div>
                                        `;
        }).join('')}
                                </div>

                                <div class="breakdown-tip">
                                    <i data-lucide="alert-circle"></i>
                                    <span>Dane te są kompilowane bezpośrednio na podstawie Twoich wpisów w historycznym dzienniku zdarzeń. Dodawaj kolejne paragony, by zwiększyć dokładność profilowania.</span>
                                </div>
                            </div>
                        ` : `
                            <div class="empty-state empty-state--embedded">
                                <i data-lucide="alert-circle"></i>
                                <p class="empty-state-desc">Historia napraw jest pusta, brak danych do wyliczenia rozkładów procentowych.</p>
                            </div>
                        `}
                    </div>

                    <!-- Right Card: Fuel Simulator -->
                    <div class="fuel-card" data-tutorial="fuel-simulator">
                        <div class="breakdown-card__header">
                            <h3 class="section-title">
                                <i data-lucide="fuel"></i>
                                <span>Kalkulator i Symulacja Kosztów Paliwa</span>
                            </h3>
                        </div>

                        <p class="fuel-card__desc">
                            Zasymuluj realne koszty podróży służbowych i wakacyjnych dla auta **${escapeHTML(vehicle.brand)} ${escapeHTML(vehicle.model)}** na podstawie uśrednionego spalania/zużycia energii:
                        </p>

                        <div class="form-grid form-grid--2">
                            <!-- Rodzaj Zasilania -->
                            <div class="form-group">
                                <label class="form-label">Rodzaj Zasilania</label>
                                <select id="fuel-type-select" class="form-select">
                                    <option value="diesel" ${this.fuelType === 'diesel' ? 'selected' : ''}>Diesel (ON)</option>
                                    <option value="gasoline" ${this.fuelType === 'gasoline' ? 'selected' : ''}>Benzyna (Pb95/Pb98)</option>
                                    <option value="lpg" ${this.fuelType === 'lpg' ? 'selected' : ''}>Autogaz (LPG)</option>
                                    <option value="electric" ${this.fuelType === 'electric' ? 'selected' : ''}>Energia Elektryczna (kWh)</option>
                                </select>
                            </div>

                            <!-- Średnie Spalanie -->
                            <div class="form-group">
                                <label id="consumption-label" class="form-label">
                                    ${this.fuelType === 'electric' ? 'Średnie zużycie (kWh/100km)' : 'Średnie Spalanie (L/100km)'}
                                </label>
                                <input type="number" id="consumption-input" step="any" value="${this.consumption}" class="form-input form-input--mono">
                            </div>
                        </div>

                        <div class="form-grid form-grid--2">
                            <!-- Cena za Litr -->
                            <div class="form-group">
                                <label id="price-label" class="form-label">
                                    ${this.fuelType === 'electric' ? 'Cena za 1 kWh (PLN)' : 'Cena za 1 Litr (PLN)'}
                                </label>
                                <input type="number" id="price-input" step="any" value="${this.pricePerUnit}" class="form-input form-input--mono">
                            </div>

                            <!-- Miesięczny Dystans -->
                            <div class="form-group">
                                <label class="form-label">Miesięczny Dystans (km)</label>
                                <input type="number" id="mileage-input" value="${this.monthlyKm}" class="form-input form-input--mono">
                            </div>
                        </div>

                        <!-- Dynamic math cards -->
                        <div class="result-tiles">
                            <div class="result-tile">
                                <span class="result-tile__label">Koszt 100 km</span>
                                <span class="result-tile__value">${fuelCostPer100km.toFixed(2)} zł</span>
                            </div>
                            <div class="result-tile result-tile--accented">
                                <span class="result-tile__label">Koszt Miesięczny</span>
                                <span class="result-tile__value">${monthlyFuelCost.toFixed(2)} zł</span>
                            </div>
                            <div class="result-tile result-tile--highlight">
                                <span class="result-tile__label">Roczny Budżet</span>
                                <span class="result-tile__value">${yearlyFuelCost.toFixed(2)} zł</span>
                            </div>
                        </div>

                        <div class="eco-tip">
                            <i data-lucide="sparkles"></i>
                            <p>
                                <strong>Tip Eko Drive:</strong> Zmniejszenie spalania o zaledwie 0.5 litra na setkę da Ci oszczędność rzędu <strong>${ecoSaving} zł rocznie</strong>! Dodatkowo chronisz podzespoły takie jak turbo czy filtr cząstek stałych (DPF/GPF).
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        `;

        refreshIcons();
        this.querySelectorAll('.progress-fill[data-progress]').forEach(el => {
            el.style.setProperty('--progress', `${el.dataset.progress}%`);
        });
        this.attachEventListeners();
    }

    attachEventListeners() {
        const fuelSelect = this.querySelector('#fuel-type-select');
        const consumptionInput = this.querySelector('#consumption-input');
        const priceInput = this.querySelector('#price-input');
        const mileageInput = this.querySelector('#mileage-input');

        if (fuelSelect) {
            fuelSelect.addEventListener('change', () => {
                this.fuelType = fuelSelect.value;
                if (this.fuelType === 'diesel') { this.pricePerUnit = 6.80; this.consumption = 6.2; }
                if (this.fuelType === 'gasoline') { this.pricePerUnit = 6.75; this.consumption = 7.4; }
                if (this.fuelType === 'lpg') { this.pricePerUnit = 3.15; this.consumption = 10.2; }
                if (this.fuelType === 'electric') { this.pricePerUnit = 1.20; this.consumption = 19.0; }
                this.render();
            });
        }

        const handleInput = () => {
            if (consumptionInput) this.consumption = parseFloat(consumptionInput.value) || 0;
            if (priceInput) this.pricePerUnit = parseFloat(priceInput.value) || 0;
            if (mileageInput) this.monthlyKm = parseInt(mileageInput.value) || 0;
            this.updateOutputs();
        };

        if (consumptionInput) consumptionInput.addEventListener('input', handleInput);
        if (priceInput) priceInput.addEventListener('input', handleInput);
        if (mileageInput) mileageInput.addEventListener('input', handleInput);
    }

    updateOutputs() {
        const fuelCostPer100km = this.consumption * this.pricePerUnit;
        const monthlyFuelCost = (this.monthlyKm / 100) * fuelCostPer100km;
        const yearlyFuelCost = monthlyFuelCost * 12;
        const ecoSaving = (0.5 * this.pricePerUnit * (this.monthlyKm / 100) * 12).toFixed(0);

        const cards = this.querySelectorAll('.result-tiles > .result-tile');
        if (cards.length >= 3) {
            cards[0].querySelector('.result-tile__value').textContent = `${fuelCostPer100km.toFixed(2)} zł`;
            cards[1].querySelector('.result-tile__value').textContent = `${monthlyFuelCost.toFixed(2)} zł`;
            cards[2].querySelector('.result-tile__value').textContent = `${yearlyFuelCost.toFixed(2)} zł`;
        }

        const tipText = this.querySelector('.eco-tip p strong');
        if (tipText) {
            // Find parent paragraph to rewrite saving value
            const p = tipText.closest('p');
            if (p) {
                p.innerHTML = `<strong>Tip Eko Drive:</strong> Zmniejszenie spalania o zaledwie 0.5 litra na setkę da Ci oszczędność rzędu <strong>${ecoSaving} zł rocznie</strong>! Dodatkowo chronisz podzespoły takie jak turbo czy filtr cząstek stałych (DPF/GPF).`;
            }
        }
    }
}

customElements.define('project-estimator', ProjectEstimator);

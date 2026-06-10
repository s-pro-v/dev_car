import { escapeHTML } from './store.js';
import { resolveBrandName } from './vehicleBrands.js';
import { resolveModelName } from './vehicleModels.js';
import { filterEngines, resolveEngineName } from './vehicleEngines.js';

class EngineAutocompleteInstance {
    constructor(input) {
        this.input = input;
        this.input.dataset.engineAcReady = '1';
        this.activeIndex = -1;
        this.suggestions = [];

        this.brandInput = this.findInput(this.input.dataset.brandInput, '[data-brand-autocomplete]');
        this.modelInput = this.findInput(this.input.dataset.modelInput, '[data-model-autocomplete]');

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'brand-autocomplete';
        input.parentNode.insertBefore(this.wrapper, input);
        this.wrapper.appendChild(input);

        this.list = document.createElement('ul');
        this.list.className = 'brand-autocomplete__list hidden';
        this.list.setAttribute('role', 'listbox');
        this.list.id = `engine-ac-${Math.random().toString(36).slice(2, 9)}`;
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-autocomplete', 'list');
        this.input.setAttribute('aria-expanded', 'false');
        this.input.setAttribute('aria-controls', this.list.id);
        this.wrapper.appendChild(this.list);

        this.onInput = this.handleInput.bind(this);
        this.onFocus = this.handleFocus.bind(this);
        this.onBlur = this.handleBlur.bind(this);
        this.onKeyDown = this.handleKeyDown.bind(this);
        this.onListClick = this.handleListClick.bind(this);
        this.onDocMouseDown = this.handleDocMouseDown.bind(this);
        this.onParentChange = this.handleParentChange.bind(this);

        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('focus', this.onFocus);
        this.input.addEventListener('blur', this.onBlur);
        this.input.addEventListener('keydown', this.onKeyDown);
        this.list.addEventListener('mousedown', this.onListClick);
        document.addEventListener('mousedown', this.onDocMouseDown);

        [this.brandInput, this.modelInput].forEach(el => {
            if (!el) return;
            el.addEventListener('input', this.onParentChange);
            el.addEventListener('change', this.onParentChange);
        });
    }

    findInput(selector, fallbackSelector) {
        if (selector) {
            return this.input.closest('.vehicle-selector')?.querySelector(selector)
                || document.querySelector(selector);
        }
        return this.input.closest('form')?.querySelector(fallbackSelector) || null;
    }

    getBrandValue() {
        return this.brandInput ? this.brandInput.value : '';
    }

    getModelValue() {
        return this.modelInput ? this.modelInput.value : '';
    }

    getSuggestions() {
        return filterEngines(this.getBrandValue(), this.getModelValue(), this.input.value);
    }

    handleParentChange() {
        if (document.activeElement === this.input) {
            this.open(this.getSuggestions());
        }
        this.updatePlaceholder();
    }

    updatePlaceholder() {
        const brand = resolveBrandName(this.getBrandValue());
        const model = resolveModelName(this.getBrandValue(), this.getModelValue());

        if (!brand) {
            this.input.placeholder = 'Najpierw wybierz markę';
            return;
        }
        if (!model) {
            this.input.placeholder = 'Najpierw wybierz model';
            return;
        }

        const sample = filterEngines(brand, model, '', 1)[0];
        this.input.placeholder = sample ? `np. ${sample}` : 'np. 2.0 TDI (150 KM)';
    }

    handleInput() {
        this.open(this.getSuggestions());
    }

    handleFocus() {
        this.updatePlaceholder();
        this.open(this.getSuggestions());
    }

    handleBlur() {
        window.setTimeout(() => {
            if (!this.wrapper.contains(document.activeElement)) {
                this.applyResolvedValue();
                this.close();
            }
        }, 120);
    }

    handleDocMouseDown(e) {
        if (!this.wrapper.contains(e.target)) {
            this.close();
        }
    }

    handleKeyDown(e) {
        if (!this.suggestions.length) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.open(this.getSuggestions());
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            this.activeIndex = Math.min(this.activeIndex + 1, this.suggestions.length - 1);
            this.renderList();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.activeIndex = Math.max(this.activeIndex - 1, 0);
            this.renderList();
        } else if (e.key === 'Enter' && this.activeIndex >= 0) {
            e.preventDefault();
            this.select(this.suggestions[this.activeIndex]);
        } else if (e.key === 'Escape') {
            this.close();
        } else if (e.key === 'Tab') {
            if (this.activeIndex >= 0) {
                this.select(this.suggestions[this.activeIndex]);
            } else {
                this.applyResolvedValue();
            }
            this.close();
        }
    }

    handleListClick(e) {
        const option = e.target.closest('[data-engine]');
        if (!option) return;
        e.preventDefault();
        this.select(option.getAttribute('data-engine'));
        this.input.focus();
    }

    applyResolvedValue() {
        const resolved = resolveEngineName(this.getBrandValue(), this.getModelValue(), this.input.value);
        if (resolved && resolved !== this.input.value) {
            this.input.value = resolved;
        }
    }

    select(engineName) {
        this.input.value = engineName;
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.close();
    }

    open(suggestions) {
        this.suggestions = suggestions;
        this.activeIndex = suggestions.length ? 0 : -1;
        this.renderList();
    }

    renderList() {
        const brand = resolveBrandName(this.getBrandValue());
        const model = resolveModelName(this.getBrandValue(), this.getModelValue());

        if (!brand) {
            this.list.classList.remove('hidden');
            this.input.setAttribute('aria-expanded', 'true');
            this.list.innerHTML = `
                <li class="brand-autocomplete__option brand-autocomplete__option--hint" role="option" aria-disabled="true">
                    Najpierw wybierz markę pojazdu
                </li>
            `;
            return;
        }

        if (!model) {
            this.list.classList.remove('hidden');
            this.input.setAttribute('aria-expanded', 'true');
            this.list.innerHTML = `
                <li class="brand-autocomplete__option brand-autocomplete__option--hint" role="option" aria-disabled="true">
                    Najpierw wybierz model pojazdu
                </li>
            `;
            return;
        }

        if (!this.suggestions.length) {
            this.list.classList.add('hidden');
            this.input.setAttribute('aria-expanded', 'false');
            this.list.innerHTML = '';
            return;
        }

        this.list.classList.remove('hidden');
        this.input.setAttribute('aria-expanded', 'true');
        this.list.innerHTML = this.suggestions.map((engine, index) => `
            <li
                class="brand-autocomplete__option ${index === this.activeIndex ? 'brand-autocomplete__option--active' : ''}"
                role="option"
                aria-selected="${index === this.activeIndex}"
                data-engine="${escapeHTML(engine)}"
            >
                ${escapeHTML(engine)}
            </li>
        `).join('');

        this.list.querySelector('.brand-autocomplete__option--active')?.scrollIntoView({ block: 'nearest' });
    }

    close() {
        this.suggestions = [];
        this.activeIndex = -1;
        this.list.classList.add('hidden');
        this.input.setAttribute('aria-expanded', 'false');
        this.list.innerHTML = '';
    }

    destroy() {
        this.close();
        document.removeEventListener('mousedown', this.onDocMouseDown);
        this.input.removeEventListener('input', this.onInput);
        this.input.removeEventListener('focus', this.onFocus);
        this.input.removeEventListener('blur', this.onBlur);
        this.input.removeEventListener('keydown', this.onKeyDown);
        this.list.removeEventListener('mousedown', this.onListClick);
        [this.brandInput, this.modelInput].forEach(el => {
            if (!el) return;
            el.removeEventListener('input', this.onParentChange);
            el.removeEventListener('change', this.onParentChange);
        });
        this.list.remove();
        this.wrapper.replaceWith(this.input);
        delete this.input.dataset.engineAcReady;
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-controls');
    }
}

const instances = new WeakMap();

export function enhanceEngineInputs(root = document) {
    root.querySelectorAll('input[data-engine-autocomplete]').forEach((input) => {
        if (input.dataset.engineAcReady) return;
        const instance = new EngineAutocompleteInstance(input);
        instance.updatePlaceholder();
        instances.set(input, instance);
    });
}

export function destroyEngineInputs(root = document) {
    root.querySelectorAll('input[data-engine-autocomplete][data-engine-ac-ready]').forEach((input) => {
        const instance = instances.get(input);
        if (instance) {
            instance.destroy();
            instances.delete(input);
        }
    });
}

export { resolveEngineName };

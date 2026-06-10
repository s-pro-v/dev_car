import { escapeHTML } from './store.js';
import { resolveBrandName } from './vehicleBrands.js';
import { filterModels, resolveModelName } from './vehicleModels.js';

class ModelAutocompleteInstance {
    constructor(input) {
        this.input = input;
        this.input.dataset.modelAcReady = '1';
        this.activeIndex = -1;
        this.suggestions = [];

        this.brandInput = this.findBrandInput();

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'brand-autocomplete';
        input.parentNode.insertBefore(this.wrapper, input);
        this.wrapper.appendChild(input);

        this.list = document.createElement('ul');
        this.list.className = 'brand-autocomplete__list hidden';
        this.list.setAttribute('role', 'listbox');
        this.list.id = `model-ac-${Math.random().toString(36).slice(2, 9)}`;
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
        this.onBrandChange = this.handleBrandChange.bind(this);

        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('focus', this.onFocus);
        this.input.addEventListener('blur', this.onBlur);
        this.input.addEventListener('keydown', this.onKeyDown);
        this.list.addEventListener('mousedown', this.onListClick);
        document.addEventListener('mousedown', this.onDocMouseDown);

        if (this.brandInput) {
            this.brandInput.addEventListener('input', this.onBrandChange);
            this.brandInput.addEventListener('change', this.onBrandChange);
        }
    }

    findBrandInput() {
        const selector = this.input.dataset.brandInput;
        if (selector) {
            return this.input.closest('.vehicle-selector')?.querySelector(selector)
                || document.querySelector(selector);
        }
        return this.input.closest('form')?.querySelector('[data-brand-autocomplete]') || null;
    }

    getBrandValue() {
        return this.brandInput ? this.brandInput.value : '';
    }

    getSuggestions() {
        return filterModels(this.getBrandValue(), this.input.value);
    }

    handleBrandChange() {
        if (document.activeElement === this.input) {
            this.open(this.getSuggestions());
        }
        this.updatePlaceholder();
    }

    updatePlaceholder() {
        const brand = resolveBrandName(this.getBrandValue());
        if (brand) {
            this.input.placeholder = `np. ${filterModels(brand, '', 1)[0] || 'model'}`;
        } else {
            this.input.placeholder = 'Najpierw wybierz markę';
        }
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
        const option = e.target.closest('[data-model]');
        if (!option) return;
        e.preventDefault();
        this.select(option.getAttribute('data-model'));
        this.input.focus();
    }

    applyResolvedValue() {
        const resolved = resolveModelName(this.getBrandValue(), this.input.value);
        if (resolved && resolved !== this.input.value) {
            this.input.value = resolved;
        }
    }

    select(modelName) {
        this.input.value = modelName;
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

        if (!this.suggestions.length) {
            this.list.classList.add('hidden');
            this.input.setAttribute('aria-expanded', 'false');
            this.list.innerHTML = '';
            return;
        }

        this.list.classList.remove('hidden');
        this.input.setAttribute('aria-expanded', 'true');
        this.list.innerHTML = this.suggestions.map((model, index) => `
            <li
                class="brand-autocomplete__option ${index === this.activeIndex ? 'brand-autocomplete__option--active' : ''}"
                role="option"
                aria-selected="${index === this.activeIndex}"
                data-model="${escapeHTML(model)}"
            >
                ${escapeHTML(model)}
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
        if (this.brandInput) {
            this.brandInput.removeEventListener('input', this.onBrandChange);
            this.brandInput.removeEventListener('change', this.onBrandChange);
        }
        this.list.remove();
        this.wrapper.replaceWith(this.input);
        delete this.input.dataset.modelAcReady;
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-controls');
    }
}

const instances = new WeakMap();

export function enhanceModelInputs(root = document) {
    root.querySelectorAll('input[data-model-autocomplete]').forEach((input) => {
        if (input.dataset.modelAcReady) return;
        const instance = new ModelAutocompleteInstance(input);
        instance.updatePlaceholder();
        instances.set(input, instance);
    });
}

export function destroyModelInputs(root = document) {
    root.querySelectorAll('input[data-model-autocomplete][data-model-ac-ready]').forEach((input) => {
        const instance = instances.get(input);
        if (instance) {
            instance.destroy();
            instances.delete(input);
        }
    });
}

export { resolveModelName };

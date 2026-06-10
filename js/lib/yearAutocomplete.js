import { escapeHTML } from './store.js';
import { resolveBrandName } from './vehicleBrands.js';
import { resolveModelName } from './vehicleModels.js';
import { filterYears, resolveYear, getSuggestedYear } from './vehicleYears.js';

class YearAutocompleteInstance {
    constructor(input) {
        this.input = input;
        this.input.dataset.yearAcReady = '1';
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
        this.list.id = `year-ac-${Math.random().toString(36).slice(2, 9)}`;
        this.input.setAttribute('role', 'combobox');
        this.input.setAttribute('aria-autocomplete', 'list');
        this.input.setAttribute('aria-expanded', 'false');
        this.input.setAttribute('aria-controls', this.list.id);
        this.input.setAttribute('inputmode', 'numeric');
        this.input.setAttribute('maxlength', '4');
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
        return filterYears(this.getBrandValue(), this.getModelValue(), this.input.value);
    }

    handleParentChange() {
        const suggested = getSuggestedYear(this.getBrandValue(), this.getModelValue());
        if (!this.input.value || this.input.dataset.userEdited !== '1') {
            this.input.value = String(suggested);
        }
        if (document.activeElement === this.input) {
            this.open(this.getSuggestions());
        }
        this.updatePlaceholder();
    }

    updatePlaceholder() {
        const brand = resolveBrandName(this.getBrandValue());
        const model = resolveModelName(this.getBrandValue(), this.getModelValue());

        if (!brand) {
            this.input.placeholder = 'Marka';
            return;
        }
        if (!model) {
            this.input.placeholder = 'Model';
            return;
        }

        const years = filterYears(brand, model, '', 3);
        if (years.length >= 2) {
            this.input.placeholder = `${years[1]}–${years[0]}`;
        } else if (years.length === 1) {
            this.input.placeholder = String(years[0]);
        }
    }

    handleInput() {
        this.input.dataset.userEdited = '1';
        this.input.value = this.input.value.replace(/\D/g, '').slice(0, 4);
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
        const option = e.target.closest('[data-year]');
        if (!option) return;
        e.preventDefault();
        this.select(Number(option.getAttribute('data-year')));
        this.input.focus();
    }

    applyResolvedValue() {
        const resolved = resolveYear(this.getBrandValue(), this.getModelValue(), this.input.value);
        this.input.value = String(resolved);
    }

    select(year) {
        this.input.value = String(year);
        this.input.dataset.userEdited = '1';
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
        this.list.innerHTML = this.suggestions.map((year, index) => `
            <li
                class="brand-autocomplete__option ${index === this.activeIndex ? 'brand-autocomplete__option--active' : ''}"
                role="option"
                aria-selected="${index === this.activeIndex}"
                data-year="${year}"
            >
                ${escapeHTML(String(year))}
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
        delete this.input.dataset.yearAcReady;
        delete this.input.dataset.userEdited;
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-controls');
        this.input.removeAttribute('inputmode');
        this.input.removeAttribute('maxlength');
    }
}

const instances = new WeakMap();

export function enhanceYearInputs(root = document) {
    root.querySelectorAll('input[data-year-autocomplete]').forEach((input) => {
        if (input.dataset.yearAcReady) return;
        const instance = new YearAutocompleteInstance(input);
        instance.updatePlaceholder();
        instances.set(input, instance);
    });
}

export function destroyYearInputs(root = document) {
    root.querySelectorAll('input[data-year-autocomplete][data-year-ac-ready]').forEach((input) => {
        const instance = instances.get(input);
        if (instance) {
            instance.destroy();
            instances.delete(input);
        }
    });
}

export { resolveYear, getSuggestedYear };

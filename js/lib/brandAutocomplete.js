import { escapeHTML } from './store.js';
import { filterBrands, resolveBrandName } from './vehicleBrands.js';

class BrandAutocompleteInstance {
    constructor(input) {
        this.input = input;
        this.input.dataset.brandAcReady = '1';
        this.activeIndex = -1;
        this.suggestions = [];

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'brand-autocomplete';
        input.parentNode.insertBefore(this.wrapper, input);
        this.wrapper.appendChild(input);

        this.list = document.createElement('ul');
        this.list.className = 'brand-autocomplete__list hidden';
        this.list.setAttribute('role', 'listbox');
        this.list.id = `brand-ac-${Math.random().toString(36).slice(2, 9)}`;
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

        this.input.addEventListener('input', this.onInput);
        this.input.addEventListener('focus', this.onFocus);
        this.input.addEventListener('blur', this.onBlur);
        this.input.addEventListener('keydown', this.onKeyDown);
        this.list.addEventListener('mousedown', this.onListClick);
        document.addEventListener('mousedown', this.onDocMouseDown);
    }

    handleInput() {
        this.open(filterBrands(this.input.value));
    }

    handleFocus() {
        this.open(filterBrands(this.input.value));
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
                this.open(filterBrands(this.input.value));
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
        const option = e.target.closest('[data-brand]');
        if (!option) return;
        e.preventDefault();
        this.select(option.getAttribute('data-brand'));
        this.input.focus();
    }

    applyResolvedValue() {
        const resolved = resolveBrandName(this.input.value);
        if (resolved && resolved !== this.input.value) {
            this.input.value = resolved;
        }
    }

    select(brandName) {
        this.input.value = brandName;
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.close();
    }

    open(suggestions) {
        this.suggestions = suggestions;
        this.activeIndex = suggestions.length ? 0 : -1;
        this.renderList();
    }

    renderList() {
        if (!this.suggestions.length) {
            this.list.classList.add('hidden');
            this.input.setAttribute('aria-expanded', 'false');
            this.list.innerHTML = '';
            return;
        }

        this.list.classList.remove('hidden');
        this.input.setAttribute('aria-expanded', 'true');
        this.list.innerHTML = this.suggestions.map((brand, index) => `
            <li
                class="brand-autocomplete__option ${index === this.activeIndex ? 'brand-autocomplete__option--active' : ''}"
                role="option"
                aria-selected="${index === this.activeIndex}"
                data-brand="${escapeHTML(brand)}"
            >
                ${escapeHTML(brand)}
            </li>
        `).join('');

        const activeEl = this.list.querySelector('.brand-autocomplete__option--active');
        activeEl?.scrollIntoView({ block: 'nearest' });
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
        this.list.remove();
        this.wrapper.replaceWith(this.input);
        delete this.input.dataset.brandAcReady;
        this.input.removeAttribute('role');
        this.input.removeAttribute('aria-autocomplete');
        this.input.removeAttribute('aria-expanded');
        this.input.removeAttribute('aria-controls');
    }
}

const instances = new WeakMap();

export function enhanceBrandInputs(root = document) {
    root.querySelectorAll('input[data-brand-autocomplete]').forEach((input) => {
        if (input.dataset.brandAcReady) return;
        instances.set(input, new BrandAutocompleteInstance(input));
    });
}

export function destroyBrandInputs(root = document) {
    root.querySelectorAll('input[data-brand-autocomplete][data-brand-ac-ready]').forEach((input) => {
        const instance = instances.get(input);
        if (instance) {
            instance.destroy();
            instances.delete(input);
        }
    });
}

export { resolveBrandName };

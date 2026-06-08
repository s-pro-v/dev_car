const MONTHS_PL = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const WEEKDAYS_PL = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

function pad2(n) {
    return String(n).padStart(2, '0');
}

function toIso(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseIso(value) {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    const date = new Date(y, m - 1, d);
    return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplay(iso) {
    const date = parseIso(iso);
    if (!date) return 'Wybierz datę';
    return `${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

function isSameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

class DatePickerInstance {
    constructor(input) {
        this.input = input;
        this.input.dataset.dpReady = '1';
        this.input.classList.add('date-picker__native');
        this.viewDate = parseIso(input.value) || new Date();
        this.open = false;

        this.wrapper = document.createElement('div');
        this.wrapper.className = 'date-picker';
        input.parentNode.insertBefore(this.wrapper, input);
        this.wrapper.appendChild(input);

        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'date-picker__trigger form-input form-input--mono';
        this.trigger.innerHTML = `
            <span class="date-picker__value"></span>
            <span class="date-picker__icon" aria-hidden="true">
                <i data-lucide="calendar"></i>
            </span>
        `;
        this.wrapper.appendChild(this.trigger);

        this.popover = document.createElement('div');
        this.popover.className = 'date-picker__popover hidden';
        this.popover.innerHTML = `
            <div class="date-picker__head">
                <button type="button" class="date-picker__nav" data-dir="-1" aria-label="Poprzedni miesiąc">
                    <i data-lucide="chevron-left"></i>
                </button>
                <span class="date-picker__month"></span>
                <button type="button" class="date-picker__nav" data-dir="1" aria-label="Następny miesiąc">
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
            <div class="date-picker__weekdays"></div>
            <div class="date-picker__grid"></div>
            <div class="date-picker__footer">
                <button type="button" class="date-picker__today">Dziś</button>
                <button type="button" class="date-picker__clear">Wyczyść</button>
            </div>
        `;
        document.body.appendChild(this.popover);

        this.valueEl = this.trigger.querySelector('.date-picker__value');
        this.monthEl = this.popover.querySelector('.date-picker__month');
        this.gridEl = this.popover.querySelector('.date-picker__grid');
        this.weekdaysEl = this.popover.querySelector('.date-picker__weekdays');

        this.weekdaysEl.innerHTML = WEEKDAYS_PL
            .map(day => `<span class="date-picker__weekday">${day}</span>`)
            .join('');

        this.bindEvents();
        this.syncDisplay();
        this.renderCalendar();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ root: this.wrapper });
            lucide.createIcons({ root: this.popover });
        }
    }

    bindEvents() {
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggle();
        });

        this.popover.addEventListener('click', (e) => {
            const nav = e.target.closest('.date-picker__nav');
            if (nav) {
                e.preventDefault();
                this.viewDate.setMonth(this.viewDate.getMonth() + Number(nav.dataset.dir));
                this.renderCalendar();
                return;
            }

            const dayBtn = e.target.closest('.date-picker__day');
            if (dayBtn && !dayBtn.disabled) {
                e.preventDefault();
                this.setValue(dayBtn.dataset.date);
                this.close();
                return;
            }

            if (e.target.closest('.date-picker__today')) {
                e.preventDefault();
                const today = new Date();
                this.viewDate = new Date(today);
                this.setValue(toIso(today));
                this.close();
                return;
            }

            if (e.target.closest('.date-picker__clear')) {
                e.preventDefault();
                this.setValue('');
                this.close();
            }
        });

        this.onDocClick = (e) => {
            if (!this.open) return;
            if (this.wrapper.contains(e.target) || this.popover.contains(e.target)) return;
            this.close();
        };

        this.onKeydown = (e) => {
            if (e.key === 'Escape' && this.open) this.close();
        };

        this.onReposition = () => {
            if (this.open) this.positionPopover();
        };

        this.input.addEventListener('change', () => this.syncDisplay());
    }

    toggle() {
        if (this.open) this.close();
        else this.openPicker();
    }

    openPicker() {
        const selected = parseIso(this.input.value);
        if (selected) this.viewDate = new Date(selected);

        this.open = true;
        this.popover.classList.remove('hidden');
        this.wrapper.classList.add('date-picker--open');
        this.renderCalendar();
        this.positionPopover();

        document.addEventListener('click', this.onDocClick);
        document.addEventListener('keydown', this.onKeydown);
        window.addEventListener('resize', this.onReposition);
        window.addEventListener('scroll', this.onReposition, true);
    }

    close() {
        this.open = false;
        this.popover.classList.add('hidden');
        this.wrapper.classList.remove('date-picker--open');

        document.removeEventListener('click', this.onDocClick);
        document.removeEventListener('keydown', this.onKeydown);
        window.removeEventListener('resize', this.onReposition);
        window.removeEventListener('scroll', this.onReposition, true);
    }

    positionPopover() {
        const rect = this.trigger.getBoundingClientRect();
        const popRect = this.popover.getBoundingClientRect();
        const gap = 6;
        let top = rect.bottom + gap;
        let left = rect.left;

        if (left + popRect.width > window.innerWidth - 8) {
            left = window.innerWidth - popRect.width - 8;
        }
        if (left < 8) left = 8;

        if (top + popRect.height > window.innerHeight - 8) {
            top = rect.top - popRect.height - gap;
        }

        this.popover.style.top = `${Math.max(8, top)}px`;
        this.popover.style.left = `${left}px`;
    }

    setValue(iso) {
        this.input.value = iso;
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
        this.syncDisplay();
    }

    syncDisplay() {
        const hasValue = Boolean(this.input.value);
        this.valueEl.textContent = formatDisplay(this.input.value);
        this.trigger.classList.toggle('date-picker__trigger--empty', !hasValue);
    }

    renderCalendar() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        this.monthEl.textContent = `${MONTHS_PL[month]} ${year}`;

        const firstDay = new Date(year, month, 1);
        const startOffset = (firstDay.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrev = new Date(year, month, 0).getDate();
        const selected = parseIso(this.input.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const cells = [];

        for (let i = startOffset - 1; i >= 0; i -= 1) {
            const day = daysInPrev - i;
            const date = new Date(year, month - 1, day);
            cells.push(this.dayCell(date, { muted: true, selected, today }));
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day);
            cells.push(this.dayCell(date, { muted: false, selected, today }));
        }

        while (cells.length % 7 !== 0 || cells.length < 42) {
            const day = cells.length - startOffset - daysInMonth + 1;
            const date = new Date(year, month + 1, day);
            cells.push(this.dayCell(date, { muted: true, selected, today }));
        }

        this.gridEl.innerHTML = cells.join('');
    }

    dayCell(date, { muted, selected, today }) {
        const iso = toIso(date);
        const classes = ['date-picker__day'];
        if (muted) classes.push('date-picker__day--muted');
        if (selected && isSameDay(date, selected)) classes.push('date-picker__day--selected');
        if (isSameDay(date, today)) classes.push('date-picker__day--today');

        return `<button type="button" class="${classes.join(' ')}" data-date="${iso}">${date.getDate()}</button>`;
    }

    destroy() {
        this.close();
        this.popover.remove();
        this.wrapper.replaceWith(this.input);
        delete this.input.dataset.dpReady;
        this.input.classList.remove('date-picker__native');
    }
}

const instances = new WeakMap();

export function enhanceDateInputs(root = document) {
    root.querySelectorAll('input[type="date"].form-input').forEach((input) => {
        if (input.dataset.dpReady) return;
        instances.set(input, new DatePickerInstance(input));
    });
}

export function destroyDateInputs(root = document) {
    root.querySelectorAll('input[type="date"].form-input[data-dp-ready]').forEach((input) => {
        const instance = instances.get(input);
        if (instance) {
            instance.destroy();
            instances.delete(input);
        }
    });
}

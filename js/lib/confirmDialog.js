let dialogEl = null;
let activeResolve = null;
let escapeHandler = null;

function ensureDialog() {
    if (dialogEl) return dialogEl;

    dialogEl = document.createElement('div');
    dialogEl.id = 'confirm-dialog';
    dialogEl.className = 'custom-modal confirm-dialog';
    dialogEl.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-content--confirm" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
            <div class="modal-header">
                <div class="confirm-dialog__title-wrap">
                    <i data-lucide="alert-triangle" class="confirm-dialog__icon"></i>
                    <h3 id="confirm-dialog-title" class="modal-title confirm-dialog__title"></h3>
                </div>
                <button type="button" class="btn-icon confirm-dialog__close" aria-label="Zamknij">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body confirm-dialog__body">
                <p class="confirm-dialog__message"></p>
                <div class="confirm-dialog__actions">
                    <button type="button" class="btn-secondary confirm-dialog__cancel"></button>
                    <button type="button" class="btn-danger confirm-dialog__confirm"></button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(dialogEl);

    const close = (result) => finish(result);

    dialogEl.querySelector('.modal-backdrop').addEventListener('click', () => close(false));
    dialogEl.querySelector('.confirm-dialog__close').addEventListener('click', () => close(false));
    dialogEl.querySelector('.confirm-dialog__cancel').addEventListener('click', () => close(false));
    dialogEl.querySelector('.confirm-dialog__confirm').addEventListener('click', () => close(true));

    return dialogEl;
}

function finish(result) {
    if (!dialogEl || !activeResolve) return;

    dialogEl.classList.remove('modal-open');
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');

    if (escapeHandler) {
        window.removeEventListener('keydown', escapeHandler);
        escapeHandler = null;
    }

    const resolve = activeResolve;
    activeResolve = null;
    resolve(result);
}

/**
 * @param {Object} options
 * @param {string} options.message
 * @param {string} [options.title]
 * @param {string} [options.confirmLabel]
 * @param {string} [options.cancelLabel]
 * @param {'danger'|'primary'} [options.variant]
 * @returns {Promise<boolean>}
 */
export function showConfirm({
    title = 'Potwierdzenie',
    message,
    confirmLabel = 'Tak, potwierdzam',
    cancelLabel = 'Anuluj',
    variant = 'danger'
}) {
    return new Promise((resolve) => {
        if (activeResolve) finish(false);

        const dialog = ensureDialog();
        activeResolve = resolve;

        dialog.querySelector('.confirm-dialog__title').textContent = title;
        dialog.querySelector('.confirm-dialog__message').textContent = message;
        dialog.querySelector('.confirm-dialog__cancel').textContent = cancelLabel;

        const confirmBtn = dialog.querySelector('.confirm-dialog__confirm');
        confirmBtn.textContent = confirmLabel;
        confirmBtn.classList.toggle('btn-danger', variant === 'danger');
        confirmBtn.classList.toggle('btn-primary', variant === 'primary');

        const icon = dialog.querySelector('.confirm-dialog__icon');
        icon.setAttribute('data-lucide', variant === 'danger' ? 'alert-triangle' : 'help-circle');

        dialog.classList.add('modal-open');
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');

        escapeHandler = (e) => {
            if (e.key === 'Escape') finish(false);
        };
        window.addEventListener('keydown', escapeHandler);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ root: dialog });
        }

        dialog.querySelector('.confirm-dialog__confirm').focus();
    });
}

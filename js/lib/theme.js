import { refreshIcons } from './icons.js';
import { STORAGE_KEYS } from './constants.js';

export function initTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle');

    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'dark';
    applyTheme(savedTheme);

    const toggleAction = () => {
        const isDark = document.documentElement.classList.contains('dark-theme');
        applyTheme(isDark ? 'light' : 'dark');
    };

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleAction);
    if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', toggleAction);
}

export function applyTheme(theme) {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle');
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    const updateIcons = (btn, isLightTheme) => {
        if (!btn) return;
        const icon = btn.querySelector('i');
        if (icon) icon.setAttribute('data-lucide', isLightTheme ? 'moon' : 'sun');
    };

    if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
        document.documentElement.classList.remove('dark-theme');
        updateIcons(themeToggleBtn, true);
        updateIcons(mobileThemeToggleBtn, true);
        if (metaTheme) metaTheme.setAttribute('content', '#f3f4f6');
    } else {
        document.documentElement.classList.add('dark-theme');
        document.documentElement.classList.remove('light-theme');
        updateIcons(themeToggleBtn, false);
        updateIcons(mobileThemeToggleBtn, false);
        if (metaTheme) metaTheme.setAttribute('content', '#1c1c1c');
    }

    localStorage.setItem(STORAGE_KEYS.theme, theme);
    refreshIcons();
}

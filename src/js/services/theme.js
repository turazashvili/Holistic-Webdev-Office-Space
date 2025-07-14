/**
 * Theme Manager - Handles light/dark theme switching
 */

export class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.storageKey = 'theme_preference';
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    }

    /**
     * Initialize theme manager
     */
    async init() {
        // Get saved theme preference or detect system preference
        const savedTheme = this.getSavedTheme();
        const systemTheme = this.getSystemTheme();
        
        this.currentTheme = savedTheme || systemTheme;
        this.applyTheme(this.currentTheme);
        
        // Listen for system theme changes
        this.mediaQuery.addEventListener('change', (e) => {
            if (!this.getSavedTheme()) {
                // Only auto-switch if user hasn't set a preference
                const newTheme = e.matches ? 'dark' : 'light';
                this.applyTheme(newTheme);
            }
        });

        // Update theme toggle button
        this.updateThemeToggle();
    }

    /**
     * Get saved theme from localStorage
     */
    getSavedTheme() {
        try {
            return localStorage.getItem(this.storageKey);
        } catch (error) {
            console.warn('Could not access localStorage for theme preference');
            return null;
        }
    }

    /**
     * Get system theme preference
     */
    getSystemTheme() {
        return this.mediaQuery.matches ? 'dark' : 'light';
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Announce theme change to screen readers
        const announcement = `Theme switched to ${theme} mode`;
        this.announceToScreenReader(announcement);
        
        console.log(`🎨 Theme applied: ${theme}`);
    }

    /**
     * Toggle between light and dark themes
     */
    toggle() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    }

    /**
     * Set specific theme
     */
    setTheme(theme) {
        if (theme !== 'light' && theme !== 'dark') {
            console.warn(`Invalid theme: ${theme}. Using light theme.`);
            theme = 'light';
        }

        this.applyTheme(theme);
        this.saveTheme(theme);
        this.updateThemeToggle();
    }

    /**
     * Save theme preference to localStorage
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.storageKey, theme);
        } catch (error) {
            console.warn('Could not save theme preference to localStorage');
        }
    }

    /**
     * Update theme toggle button appearance
     */
    updateThemeToggle() {
        const toggleButton = document.querySelector('.header__theme-toggle');
        if (toggleButton) {
            const icon = toggleButton.querySelector('.theme-toggle__icon');
            if (icon) {
                icon.textContent = this.currentTheme === 'light' ? '🌙' : '☀️';
            }
            
            toggleButton.setAttribute('aria-label', 
                `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`
            );
        }
    }

    /**
     * Update meta theme-color for mobile browsers
     */
    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }

        // Set theme color based on current theme
        const colors = {
            light: '#ffffff',
            dark: '#1f2937'
        };

        metaThemeColor.content = colors[theme] || colors.light;
    }

    /**
     * Announce theme change to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove announcement after a short delay
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Get current theme
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Check if current theme is dark
     */
    isDarkMode() {
        return this.currentTheme === 'dark';
    }

    /**
     * Reset theme to system preference
     */
    resetToSystem() {
        // Remove saved preference
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            console.warn('Could not remove theme preference from localStorage');
        }

        // Apply system theme
        const systemTheme = this.getSystemTheme();
        this.applyTheme(systemTheme);
        this.updateThemeToggle();
    }

    /**
     * Get theme statistics for debugging
     */
    getThemeInfo() {
        return {
            current: this.currentTheme,
            saved: this.getSavedTheme(),
            system: this.getSystemTheme(),
            supportsColorScheme: this.mediaQuery.matches !== undefined
        };
    }
}

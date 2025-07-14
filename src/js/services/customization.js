/**
 * Customization Service - Handles user preferences and dashboard customization
 */

export class CustomizationService {
    constructor(storage, eventBus) {
        this.storage = storage;
        this.eventBus = eventBus;
        this.preferences = this.loadPreferences();
        this.defaultPreferences = {
            theme: 'light',
            widgetOrder: ['announcements', 'quickLaunch', 'tasks', 'calendar', 'tickets'],
            hiddenWidgets: [],
            autoRefresh: true,
            refreshInterval: 300000, // 5 minutes
            compactMode: false,
            showWidgetTitles: true,
            animationsEnabled: true,
            highContrastMode: false,
            fontSize: 'medium', // small, medium, large
            layout: 'grid' // grid, list
        };
    }

    /**
     * Initialize customization service
     */
    init() {
        console.log('🎨 Initializing Customization Service...');
        
        // Apply saved preferences
        this.applyPreferences();
        
        // Listen for preference changes
        this.setupEventListeners();
        
        console.log('✅ Customization Service initialized');
    }

    /**
     * Load preferences from storage
     */
    loadPreferences() {
        const saved = this.storage.getUserPreferences();
        return { ...this.defaultPreferences, ...saved };
    }

    /**
     * Save preferences to storage
     */
    savePreferences() {
        this.storage.setUserPreferences(this.preferences);
        this.eventBus.emit('preferences:changed', this.preferences);
    }

    /**
     * Apply current preferences to the dashboard
     */
    applyPreferences() {
        // Apply theme
        this.applyTheme(this.preferences.theme);
        
        // Apply font size
        this.applyFontSize(this.preferences.fontSize);
        
        // Apply compact mode
        this.applyCompactMode(this.preferences.compactMode);
        
        // Apply high contrast mode
        this.applyHighContrastMode(this.preferences.highContrastMode);
        
        // Apply animations
        this.applyAnimations(this.preferences.animationsEnabled);
        
        // Apply widget visibility
        this.applyWidgetVisibility();
        
        // Apply widget order
        this.applyWidgetOrder();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for theme changes
        this.eventBus.on('theme:change-requested', (theme) => {
            this.setTheme(theme);
        });

        // Listen for widget reorder
        this.eventBus.on('widget:reorder', (newOrder) => {
            this.setWidgetOrder(newOrder);
        });

        // Listen for widget visibility changes
        this.eventBus.on('widget:visibility-changed', (widgetName, visible) => {
            this.setWidgetVisibility(widgetName, visible);
        });
    }

    /**
     * Get current preferences
     */
    getPreferences() {
        return { ...this.preferences };
    }

    /**
     * Set theme preference
     */
    setTheme(theme) {
        if (!['light', 'dark', 'auto'].includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }

        this.preferences.theme = theme;
        this.applyTheme(theme);
        this.savePreferences();
    }

    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        let actualTheme = theme;
        
        if (theme === 'auto') {
            // Use system preference
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        document.documentElement.setAttribute('data-theme', actualTheme);
        this.eventBus.emit('theme:applied', actualTheme);
    }

    /**
     * Set font size preference
     */
    setFontSize(size) {
        if (!['small', 'medium', 'large'].includes(size)) {
            console.warn(`Invalid font size: ${size}`);
            return;
        }

        this.preferences.fontSize = size;
        this.applyFontSize(size);
        this.savePreferences();
    }

    /**
     * Apply font size to document
     */
    applyFontSize(size) {
        const sizes = {
            small: '14px',
            medium: '16px',
            large: '18px'
        };

        document.documentElement.style.fontSize = sizes[size] || sizes.medium;
        document.body.setAttribute('data-font-size', size);
    }

    /**
     * Set compact mode preference
     */
    setCompactMode(enabled) {
        this.preferences.compactMode = enabled;
        this.applyCompactMode(enabled);
        this.savePreferences();
    }

    /**
     * Apply compact mode
     */
    applyCompactMode(enabled) {
        document.body.classList.toggle('compact-mode', enabled);
    }

    /**
     * Set high contrast mode preference
     */
    setHighContrastMode(enabled) {
        this.preferences.highContrastMode = enabled;
        this.applyHighContrastMode(enabled);
        this.savePreferences();
    }

    /**
     * Apply high contrast mode
     */
    applyHighContrastMode(enabled) {
        document.body.classList.toggle('high-contrast', enabled);
    }

    /**
     * Set animations preference
     */
    setAnimationsEnabled(enabled) {
        this.preferences.animationsEnabled = enabled;
        this.applyAnimations(enabled);
        this.savePreferences();
    }

    /**
     * Apply animations setting
     */
    applyAnimations(enabled) {
        document.body.classList.toggle('no-animations', !enabled);
    }

    /**
     * Set widget order
     */
    setWidgetOrder(order) {
        if (!Array.isArray(order)) {
            console.warn('Widget order must be an array');
            return;
        }

        this.preferences.widgetOrder = order;
        this.applyWidgetOrder();
        this.savePreferences();
    }

    /**
     * Apply widget order to dashboard
     */
    applyWidgetOrder() {
        const dashboard = document.querySelector('.dashboard__grid');
        if (!dashboard) return;

        const widgets = Array.from(dashboard.children);
        const orderedWidgets = [];

        // Reorder widgets according to preferences
        this.preferences.widgetOrder.forEach(widgetName => {
            const widget = widgets.find(w => w.classList.contains(`widget--${widgetName}`));
            if (widget) {
                orderedWidgets.push(widget);
            }
        });

        // Add any widgets not in the order list
        widgets.forEach(widget => {
            if (!orderedWidgets.includes(widget)) {
                orderedWidgets.push(widget);
            }
        });

        // Reorder in DOM
        orderedWidgets.forEach(widget => {
            dashboard.appendChild(widget);
        });
    }

    /**
     * Set widget visibility
     */
    setWidgetVisibility(widgetName, visible) {
        const hiddenWidgets = new Set(this.preferences.hiddenWidgets);
        
        if (visible) {
            hiddenWidgets.delete(widgetName);
        } else {
            hiddenWidgets.add(widgetName);
        }

        this.preferences.hiddenWidgets = Array.from(hiddenWidgets);
        this.applyWidgetVisibility();
        this.savePreferences();
    }

    /**
     * Apply widget visibility
     */
    applyWidgetVisibility() {
        this.preferences.hiddenWidgets.forEach(widgetName => {
            const widget = document.querySelector(`.widget--${widgetName}`);
            if (widget) {
                widget.style.display = 'none';
                widget.setAttribute('aria-hidden', 'true');
            }
        });

        // Show visible widgets
        const allWidgets = document.querySelectorAll('[class*="widget--"]');
        allWidgets.forEach(widget => {
            const widgetName = Array.from(widget.classList)
                .find(cls => cls.startsWith('widget--'))
                ?.replace('widget--', '');
            
            if (widgetName && !this.preferences.hiddenWidgets.includes(widgetName)) {
                widget.style.display = '';
                widget.setAttribute('aria-hidden', 'false');
            }
        });
    }

    /**
     * Toggle widget visibility
     */
    toggleWidgetVisibility(widgetName) {
        const isHidden = this.preferences.hiddenWidgets.includes(widgetName);
        this.setWidgetVisibility(widgetName, isHidden);
    }

    /**
     * Reset preferences to defaults
     */
    resetToDefaults() {
        this.preferences = { ...this.defaultPreferences };
        this.applyPreferences();
        this.savePreferences();
        this.eventBus.emit('preferences:reset');
    }

    /**
     * Export preferences as JSON
     */
    exportPreferences() {
        return JSON.stringify(this.preferences, null, 2);
    }

    /**
     * Import preferences from JSON
     */
    importPreferences(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            
            // Validate imported preferences
            if (this.validatePreferences(imported)) {
                this.preferences = { ...this.defaultPreferences, ...imported };
                this.applyPreferences();
                this.savePreferences();
                return true;
            } else {
                console.error('Invalid preferences format');
                return false;
            }
        } catch (error) {
            console.error('Failed to import preferences:', error);
            return false;
        }
    }

    /**
     * Validate preferences object
     */
    validatePreferences(prefs) {
        // Basic validation
        if (typeof prefs !== 'object' || prefs === null) {
            return false;
        }

        // Validate theme
        if (prefs.theme && !['light', 'dark', 'auto'].includes(prefs.theme)) {
            return false;
        }

        // Validate widget order
        if (prefs.widgetOrder && !Array.isArray(prefs.widgetOrder)) {
            return false;
        }

        // Validate hidden widgets
        if (prefs.hiddenWidgets && !Array.isArray(prefs.hiddenWidgets)) {
            return false;
        }

        return true;
    }

    /**
     * Create customization panel
     */
    createCustomizationPanel() {
        const panel = document.createElement('div');
        panel.className = 'customization-panel';
        panel.innerHTML = `
            <div class="customization-panel__header">
                <h3>Dashboard Settings</h3>
                <button class="customization-panel__close" aria-label="Close settings">×</button>
            </div>
            <div class="customization-panel__content">
                <div class="setting-group">
                    <label for="theme-select">Theme</label>
                    <select id="theme-select">
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                    </select>
                </div>
                
                <div class="setting-group">
                    <label for="font-size-select">Font Size</label>
                    <select id="font-size-select">
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>
                
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="compact-mode"> Compact Mode
                    </label>
                </div>
                
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="high-contrast"> High Contrast
                    </label>
                </div>
                
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="animations"> Enable Animations
                    </label>
                </div>
                
                <div class="setting-group">
                    <label>
                        <input type="checkbox" id="auto-refresh"> Auto Refresh
                    </label>
                </div>
                
                <div class="setting-actions">
                    <button id="reset-settings">Reset to Defaults</button>
                    <button id="export-settings">Export Settings</button>
                    <input type="file" id="import-settings" accept=".json" style="display: none;">
                    <button id="import-settings-btn">Import Settings</button>
                </div>
            </div>
        `;

        // Set current values
        panel.querySelector('#theme-select').value = this.preferences.theme;
        panel.querySelector('#font-size-select').value = this.preferences.fontSize;
        panel.querySelector('#compact-mode').checked = this.preferences.compactMode;
        panel.querySelector('#high-contrast').checked = this.preferences.highContrastMode;
        panel.querySelector('#animations').checked = this.preferences.animationsEnabled;
        panel.querySelector('#auto-refresh').checked = this.preferences.autoRefresh;

        // Add event listeners
        this.addPanelEventListeners(panel);

        return panel;
    }

    /**
     * Add event listeners to customization panel
     */
    addPanelEventListeners(panel) {
        // Theme change
        panel.querySelector('#theme-select').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });

        // Font size change
        panel.querySelector('#font-size-select').addEventListener('change', (e) => {
            this.setFontSize(e.target.value);
        });

        // Compact mode toggle
        panel.querySelector('#compact-mode').addEventListener('change', (e) => {
            this.setCompactMode(e.target.checked);
        });

        // High contrast toggle
        panel.querySelector('#high-contrast').addEventListener('change', (e) => {
            this.setHighContrastMode(e.target.checked);
        });

        // Animations toggle
        panel.querySelector('#animations').addEventListener('change', (e) => {
            this.setAnimationsEnabled(e.target.checked);
        });

        // Auto refresh toggle
        panel.querySelector('#auto-refresh').addEventListener('change', (e) => {
            this.preferences.autoRefresh = e.target.checked;
            this.savePreferences();
            this.eventBus.emit('auto-refresh:toggled', e.target.checked);
        });

        // Reset settings
        panel.querySelector('#reset-settings').addEventListener('click', () => {
            if (confirm('Reset all settings to defaults?')) {
                this.resetToDefaults();
                // Update panel values
                panel.querySelector('#theme-select').value = this.preferences.theme;
                panel.querySelector('#font-size-select').value = this.preferences.fontSize;
                panel.querySelector('#compact-mode').checked = this.preferences.compactMode;
                panel.querySelector('#high-contrast').checked = this.preferences.highContrastMode;
                panel.querySelector('#animations').checked = this.preferences.animationsEnabled;
                panel.querySelector('#auto-refresh').checked = this.preferences.autoRefresh;
            }
        });

        // Export settings
        panel.querySelector('#export-settings').addEventListener('click', () => {
            const dataStr = this.exportPreferences();
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'dashboard-settings.json';
            link.click();
            URL.revokeObjectURL(url);
        });

        // Import settings
        panel.querySelector('#import-settings-btn').addEventListener('click', () => {
            panel.querySelector('#import-settings').click();
        });

        panel.querySelector('#import-settings').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (this.importPreferences(e.target.result)) {
                        alert('Settings imported successfully!');
                        // Update panel values
                        panel.querySelector('#theme-select').value = this.preferences.theme;
                        panel.querySelector('#font-size-select').value = this.preferences.fontSize;
                        panel.querySelector('#compact-mode').checked = this.preferences.compactMode;
                        panel.querySelector('#high-contrast').checked = this.preferences.highContrastMode;
                        panel.querySelector('#animations').checked = this.preferences.animationsEnabled;
                        panel.querySelector('#auto-refresh').checked = this.preferences.autoRefresh;
                    } else {
                        alert('Failed to import settings. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        });

        // Close panel
        panel.querySelector('.customization-panel__close').addEventListener('click', () => {
            document.body.removeChild(panel);
        });
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            preferences: this.preferences,
            defaultPreferences: this.defaultPreferences,
            storageAvailable: this.storage.isAvailable()
        };
    }
}

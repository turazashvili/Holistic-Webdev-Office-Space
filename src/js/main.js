/**
 * Smart Day-Starter Dashboard - Main JavaScript Entry Point
 * ES6 Modules Architecture
 */

// Import core modules
import { StorageService } from './services/storage.js';
import { ThemeManager } from './services/theme.js';
import { EventBus } from './services/eventBus.js';
import { RealtimeService } from './services/realtime.js';
import { CustomizationService } from './services/customization.js';

// Import widget modules
import { AnnouncementsWidget } from './widgets/announcements.js';
import { TasksWidget } from './widgets/tasks.js';
import { CalendarWidget } from './widgets/calendar.js';
import { QuickLaunchWidget } from './widgets/quickLaunch.js';
import { TicketsWidget } from './widgets/tickets.js';

// Import utilities
import { LoadingManager } from './utils/loading.js';
import { AccessibilityManager } from './utils/accessibility.js';

/**
 * Main Dashboard Application Class
 */
class DashboardApp {
    constructor() {
        this.isInitialized = false;
        this.widgets = new Map();
        this.services = {
            storage: new StorageService(),
            theme: new ThemeManager(),
            eventBus: new EventBus(),
            loading: new LoadingManager(),
            accessibility: new AccessibilityManager()
        };
        
        // Initialize advanced services after basic ones
        this.services.realtime = new RealtimeService(this.services.eventBus, this.services.storage);
        this.services.customization = new CustomizationService(this.services.storage, this.services.eventBus);
    }

    /**
     * Initialize the dashboard application
     */
    async init() {
        try {
            console.log('🚀 Initializing Smart Day-Starter Dashboard...');
            
            // Show loading indicator
            this.services.loading.show('Loading dashboard...');

            // Initialize core services
            await this.initializeServices();

            // Initialize widgets
            await this.initializeWidgets();

            // Set up event listeners
            this.setupEventListeners();

            // Set up real-time handlers
            this.setupRealtimeHandlers();

            // Hide loading indicator
            this.services.loading.hide();

            this.isInitialized = true;
            console.log('✅ Dashboard initialized successfully');

            // Announce to screen readers
            this.services.accessibility.announce('Dashboard loaded successfully');

        } catch (error) {
            console.error('❌ Failed to initialize dashboard:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Initialize core services
     */
    async initializeServices() {
        console.log('🔧 Initializing services...');

        // Initialize theme manager
        await this.services.theme.init();

        // Initialize accessibility manager
        this.services.accessibility.init();

        // Initialize customization service
        this.services.customization.init();

        // Initialize real-time service
        this.services.realtime.init();

        // Test storage availability
        if (!this.services.storage.isAvailable()) {
            console.warn('⚠️ LocalStorage not available, using memory storage');
        }

        console.log('✅ Services initialized');
    }

    /**
     * Initialize all dashboard widgets
     */
    async initializeWidgets() {
        console.log('🧩 Initializing widgets...');

        const widgetConfigs = [
            {
                name: 'announcements',
                class: AnnouncementsWidget,
                container: '#announcements-container',
                priority: 1
            },
            {
                name: 'quickLaunch',
                class: QuickLaunchWidget,
                container: '#quick-launch-container',
                priority: 2
            },
            {
                name: 'tasks',
                class: TasksWidget,
                container: '#tasks-container',
                priority: 3
            },
            {
                name: 'calendar',
                class: CalendarWidget,
                container: '#calendar-container',
                priority: 4
            },
            {
                name: 'tickets',
                class: TicketsWidget,
                container: '#tickets-container',
                priority: 5
            }
        ];

        // Sort by priority and initialize widgets
        widgetConfigs.sort((a, b) => a.priority - b.priority);

        for (const config of widgetConfigs) {
            try {
                const container = document.querySelector(config.container);
                if (!container) {
                    console.warn(`⚠️ Container not found for ${config.name}: ${config.container}`);
                    continue;
                }

                const widget = new config.class(container, this.services);
                await widget.init();
                
                this.widgets.set(config.name, widget);
                console.log(`✅ ${config.name} widget initialized`);

            } catch (error) {
                console.error(`❌ Failed to initialize ${config.name} widget:`, error);
            }
        }

        console.log(`✅ ${this.widgets.size} widgets initialized`);
    }

    /**
     * Set up global event listeners
     */
    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');

        // Theme toggle
        const themeToggle = document.querySelector('.header__theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.services.theme.toggle();
            });
        }

        // Settings button (placeholder for now)
        const settingsButton = document.querySelector('.header__settings');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.showSettingsPanel();
            });
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeyboard(event);
        });

        // Handle visibility change (for auto-refresh when tab becomes visible)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.refreshWidgets();
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            this.services.accessibility.announce('Connection restored');
            this.refreshWidgets();
        });

        window.addEventListener('offline', () => {
            this.services.accessibility.announce('Connection lost - working offline');
        });

        console.log('✅ Event listeners set up');
    }

    /**
     * Show settings panel
     */
    showSettingsPanel() {
        const panel = this.services.customization.createCustomizationPanel();
        document.body.appendChild(panel);
        
        // Focus management
        const closeButton = panel.querySelector('.customization-panel__close');
        if (closeButton) {
            closeButton.focus();
            this.services.accessibility.trapFocus(panel);
        }
    }

    /**
     * Handle widget refresh requests from real-time service
     */
    setupRealtimeHandlers() {
        this.services.eventBus.on('widget:refresh-requested', (widgetName) => {
            const widget = this.widgets.get(widgetName);
            if (widget && typeof widget.refresh === 'function') {
                widget.refresh().catch(error => {
                    console.error(`Failed to refresh ${widgetName}:`, error);
                });
            }
        });

        this.services.eventBus.on('network:offline', () => {
            this.services.accessibility.announce('Connection lost - working offline');
        });

        this.services.eventBus.on('network:online', () => {
            this.services.accessibility.announce('Connection restored');
            this.refreshWidgets();
        });
    }
    handleGlobalKeyboard(event) {
        // Alt + T: Toggle theme
        if (event.altKey && event.key === 't') {
            event.preventDefault();
            this.services.theme.toggle();
            return;
        }

        // Alt + R: Refresh all widgets
        if (event.altKey && event.key === 'r') {
            event.preventDefault();
            this.refreshWidgets();
            return;
        }

        // Escape: Close any open modals/dropdowns
        if (event.key === 'Escape') {
            this.services.eventBus.emit('escape-pressed');
            return;
        }
    }

    /**
     * Refresh all widgets
     */
    async refreshWidgets() {
        console.log('🔄 Refreshing widgets...');
        
        const refreshPromises = Array.from(this.widgets.values()).map(widget => {
            if (typeof widget.refresh === 'function') {
                return widget.refresh().catch(error => {
                    console.error(`Failed to refresh ${widget.constructor.name}:`, error);
                });
            }
            return Promise.resolve();
        });

        await Promise.all(refreshPromises);
        console.log('✅ Widgets refreshed');
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        this.services.loading.hide();
        
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <h2>Dashboard Loading Error</h2>
            <p>Sorry, there was a problem loading the dashboard. Please refresh the page to try again.</p>
            <button onclick="window.location.reload()">Refresh Page</button>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Announce error to screen readers
        this.services.accessibility.announce('Dashboard failed to load. Please refresh the page.');
    }

    /**
     * Cleanup method for when the app is destroyed
     */
    destroy() {
        console.log('🧹 Cleaning up dashboard...');
        
        // Destroy all widgets
        this.widgets.forEach(widget => {
            if (typeof widget.destroy === 'function') {
                widget.destroy();
            }
        });
        
        this.widgets.clear();
        this.isInitialized = false;
        
        console.log('✅ Dashboard cleaned up');
    }
}

/**
 * Initialize the dashboard when DOM is ready
 */
function initializeDashboard() {
    // Create global dashboard instance
    window.dashboard = new DashboardApp();
    
    // Initialize the dashboard
    window.dashboard.init();
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.dashboard) {
        window.dashboard.destroy();
    }
});

// Export for testing purposes
export { DashboardApp };

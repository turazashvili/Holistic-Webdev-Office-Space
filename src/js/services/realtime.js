/**
 * Real-time Updates Service - Handles periodic data refresh and live updates
 */

export class RealtimeService {
    constructor(eventBus, storage) {
        this.eventBus = eventBus;
        this.storage = storage;
        this.intervals = new Map();
        this.isOnline = navigator.onLine;
        this.refreshRates = {
            announcements: 600000,  // 10 minutes
            tasks: 300000,          // 5 minutes
            calendar: 600000,       // 10 minutes
            tickets: 300000,        // 5 minutes
            shortcuts: 0            // No auto-refresh
        };
        
        this.setupNetworkListeners();
    }

    /**
     * Initialize real-time service
     */
    init() {
        console.log('🔄 Initializing Real-time Service...');
        
        // Start auto-refresh for all widgets
        this.startAutoRefresh();
        
        // Listen for visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handleVisibilityChange();
            }
        });

        console.log('✅ Real-time Service initialized');
    }

    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.eventBus.emit('network:online');
            this.resumeAutoRefresh();
            console.log('🌐 Network connection restored');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.eventBus.emit('network:offline');
            this.pauseAutoRefresh();
            console.log('📡 Network connection lost');
        });
    }

    /**
     * Start auto-refresh for all widgets
     */
    startAutoRefresh() {
        Object.entries(this.refreshRates).forEach(([widget, interval]) => {
            if (interval > 0) {
                this.startWidgetRefresh(widget, interval);
            }
        });
    }

    /**
     * Start auto-refresh for a specific widget
     */
    startWidgetRefresh(widgetName, interval) {
        // Clear existing interval if any
        this.stopWidgetRefresh(widgetName);

        if (!this.isOnline || interval <= 0) {
            return;
        }

        const intervalId = setInterval(() => {
            if (this.isOnline && !document.hidden) {
                this.eventBus.emit('widget:refresh-requested', widgetName);
                console.log(`🔄 Auto-refresh triggered for ${widgetName}`);
            }
        }, interval);

        this.intervals.set(widgetName, intervalId);
        console.log(`⏰ Auto-refresh started for ${widgetName} (${interval}ms)`);
    }

    /**
     * Stop auto-refresh for a specific widget
     */
    stopWidgetRefresh(widgetName) {
        const intervalId = this.intervals.get(widgetName);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(widgetName);
            console.log(`⏹️ Auto-refresh stopped for ${widgetName}`);
        }
    }

    /**
     * Pause all auto-refresh (e.g., when offline)
     */
    pauseAutoRefresh() {
        this.intervals.forEach((intervalId, widgetName) => {
            clearInterval(intervalId);
            console.log(`⏸️ Auto-refresh paused for ${widgetName}`);
        });
    }

    /**
     * Resume all auto-refresh (e.g., when back online)
     */
    resumeAutoRefresh() {
        this.intervals.clear();
        this.startAutoRefresh();
        console.log('▶️ Auto-refresh resumed for all widgets');
    }

    /**
     * Handle visibility change (tab becomes visible)
     */
    handleVisibilityChange() {
        if (this.isOnline) {
            // Trigger immediate refresh for all widgets when tab becomes visible
            Object.keys(this.refreshRates).forEach(widgetName => {
                this.eventBus.emit('widget:refresh-requested', widgetName);
            });
            console.log('👁️ Tab visible - refreshing all widgets');
        }
    }

    /**
     * Set custom refresh rate for a widget
     */
    setRefreshRate(widgetName, interval) {
        this.refreshRates[widgetName] = interval;
        
        if (interval > 0) {
            this.startWidgetRefresh(widgetName, interval);
        } else {
            this.stopWidgetRefresh(widgetName);
        }
        
        // Save to storage
        const preferences = this.storage.getUserPreferences();
        preferences.refreshRates = this.refreshRates;
        this.storage.setUserPreferences(preferences);
    }

    /**
     * Get current refresh rate for a widget
     */
    getRefreshRate(widgetName) {
        return this.refreshRates[widgetName] || 0;
    }

    /**
     * Enable/disable auto-refresh globally
     */
    setAutoRefreshEnabled(enabled) {
        if (enabled) {
            this.startAutoRefresh();
        } else {
            this.pauseAutoRefresh();
        }

        // Save preference
        const preferences = this.storage.getUserPreferences();
        preferences.autoRefresh = enabled;
        this.storage.setUserPreferences(preferences);
    }

    /**
     * Check if auto-refresh is enabled
     */
    isAutoRefreshEnabled() {
        const preferences = this.storage.getUserPreferences();
        return preferences.autoRefresh !== false;
    }

    /**
     * Get network status
     */
    getNetworkStatus() {
        return {
            online: this.isOnline,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
    }

    /**
     * Simulate real-time data updates (for demo purposes)
     */
    simulateDataUpdates() {
        // Simulate new announcements
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every interval
                this.eventBus.emit('data:simulated-update', 'announcements', {
                    type: 'new',
                    data: {
                        id: `sim_${Date.now()}`,
                        title: 'Simulated Announcement',
                        message: 'This is a simulated real-time update',
                        type: 'info',
                        priority: 'medium',
                        createdAt: new Date().toISOString()
                    }
                });
            }
        }, 30000); // Every 30 seconds

        // Simulate ticket updates
        setInterval(() => {
            if (Math.random() < 0.15) { // 15% chance
                this.eventBus.emit('data:simulated-update', 'tickets', {
                    type: 'status_change',
                    ticketId: 'TKT-001',
                    newStatus: 'in_progress'
                });
            }
        }, 45000); // Every 45 seconds
    }

    /**
     * Destroy real-time service
     */
    destroy() {
        console.log('🧹 Destroying Real-time Service...');
        
        // Clear all intervals
        this.intervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.intervals.clear();
        
        // Remove event listeners
        window.removeEventListener('online', this.handleOnline);
        window.removeEventListener('offline', this.handleOffline);
        
        console.log('✅ Real-time Service destroyed');
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            isOnline: this.isOnline,
            activeIntervals: this.intervals.size,
            refreshRates: this.refreshRates,
            autoRefreshEnabled: this.isAutoRefreshEnabled(),
            networkStatus: this.getNetworkStatus()
        };
    }
}

/**
 * Storage Service - Handles LocalStorage operations with fallback
 */

export class StorageService {
    constructor() {
        this.isLocalStorageAvailable = this.checkLocalStorageAvailability();
        this.memoryStorage = new Map(); // Fallback for when localStorage is not available
        this.prefix = 'dashboard_';
    }

    /**
     * Check if localStorage is available
     */
    checkLocalStorageAvailability() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Check if storage is available
     */
    isAvailable() {
        return this.isLocalStorageAvailable;
    }

    /**
     * Get item from storage
     */
    getItem(key) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.isLocalStorageAvailable) {
                const item = localStorage.getItem(fullKey);
                return item ? JSON.parse(item) : null;
            } else {
                return this.memoryStorage.get(fullKey) || null;
            }
        } catch (error) {
            console.error('Error getting item from storage:', error);
            return null;
        }
    }

    /**
     * Set item in storage
     */
    setItem(key, value) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.isLocalStorageAvailable) {
                localStorage.setItem(fullKey, JSON.stringify(value));
            } else {
                this.memoryStorage.set(fullKey, value);
            }
            return true;
        } catch (error) {
            console.error('Error setting item in storage:', error);
            return false;
        }
    }

    /**
     * Remove item from storage
     */
    removeItem(key) {
        const fullKey = this.prefix + key;
        
        try {
            if (this.isLocalStorageAvailable) {
                localStorage.removeItem(fullKey);
            } else {
                this.memoryStorage.delete(fullKey);
            }
            return true;
        } catch (error) {
            console.error('Error removing item from storage:', error);
            return false;
        }
    }

    /**
     * Clear all dashboard data from storage
     */
    clear() {
        try {
            if (this.isLocalStorageAvailable) {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(this.prefix)) {
                        localStorage.removeItem(key);
                    }
                });
            } else {
                this.memoryStorage.clear();
            }
            return true;
        } catch (error) {
            console.error('Error clearing storage:', error);
            return false;
        }
    }

    /**
     * Get all keys with the dashboard prefix
     */
    getAllKeys() {
        try {
            if (this.isLocalStorageAvailable) {
                const keys = Object.keys(localStorage);
                return keys
                    .filter(key => key.startsWith(this.prefix))
                    .map(key => key.replace(this.prefix, ''));
            } else {
                return Array.from(this.memoryStorage.keys())
                    .map(key => key.replace(this.prefix, ''));
            }
        } catch (error) {
            console.error('Error getting all keys:', error);
            return [];
        }
    }

    /**
     * Get storage usage information
     */
    getStorageInfo() {
        if (!this.isLocalStorageAvailable) {
            return {
                available: false,
                used: this.memoryStorage.size,
                total: 'unlimited',
                percentage: 0
            };
        }

        try {
            let used = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
                    used += localStorage[key].length + key.length;
                }
            }

            // Rough estimate of localStorage limit (usually 5-10MB)
            const estimatedTotal = 5 * 1024 * 1024; // 5MB
            const percentage = (used / estimatedTotal) * 100;

            return {
                available: true,
                used: used,
                total: estimatedTotal,
                percentage: Math.round(percentage * 100) / 100
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return {
                available: true,
                used: 0,
                total: 0,
                percentage: 0
            };
        }
    }

    // Convenience methods for common data types

    /**
     * Get user preferences
     */
    getUserPreferences() {
        return this.getItem('user_preferences') || {
            theme: 'light',
            widgetOrder: ['announcements', 'quickLaunch', 'tasks', 'calendar', 'tickets'],
            hiddenWidgets: [],
            autoRefresh: true,
            refreshInterval: 300000 // 5 minutes
        };
    }

    /**
     * Set user preferences
     */
    setUserPreferences(preferences) {
        return this.setItem('user_preferences', preferences);
    }

    /**
     * Get dismissed announcements
     */
    getDismissedAnnouncements() {
        return this.getItem('dismissed_announcements') || [];
    }

    /**
     * Add dismissed announcement
     */
    addDismissedAnnouncement(announcementId) {
        const dismissed = this.getDismissedAnnouncements();
        if (!dismissed.includes(announcementId)) {
            dismissed.push(announcementId);
            return this.setItem('dismissed_announcements', dismissed);
        }
        return true;
    }

    /**
     * Get custom shortcuts
     */
    getCustomShortcuts() {
        return this.getItem('custom_shortcuts') || [];
    }

    /**
     * Set custom shortcuts
     */
    setCustomShortcuts(shortcuts) {
        return this.setItem('custom_shortcuts', shortcuts);
    }

    /**
     * Get widget data with timestamp
     */
    getWidgetData(widgetName) {
        const data = this.getItem(`widget_${widgetName}`);
        if (data && data.timestamp) {
            // Check if data is stale (older than 1 hour)
            const oneHour = 60 * 60 * 1000;
            if (Date.now() - data.timestamp > oneHour) {
                return null; // Return null for stale data
            }
        }
        return data;
    }

    /**
     * Set widget data with timestamp
     */
    setWidgetData(widgetName, data) {
        const dataWithTimestamp = {
            ...data,
            timestamp: Date.now()
        };
        return this.setItem(`widget_${widgetName}`, dataWithTimestamp);
    }
}

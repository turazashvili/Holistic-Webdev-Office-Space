/**
 * Event Bus - Simple pub/sub system for widget communication
 */

export class EventBus {
    constructor() {
        this.events = new Map();
        this.maxListeners = 50; // Prevent memory leaks
    }

    /**
     * Subscribe to an event
     */
    on(eventName, callback) {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        const listeners = this.events.get(eventName);
        
        if (listeners.length >= this.maxListeners) {
            console.warn(`Maximum listeners (${this.maxListeners}) reached for event: ${eventName}`);
            return false;
        }

        listeners.push(callback);
        return true;
    }

    /**
     * Subscribe to an event only once
     */
    once(eventName, callback) {
        const onceWrapper = (...args) => {
            callback(...args);
            this.off(eventName, onceWrapper);
        };
        
        return this.on(eventName, onceWrapper);
    }

    /**
     * Unsubscribe from an event
     */
    off(eventName, callback) {
        if (!this.events.has(eventName)) {
            return false;
        }

        const listeners = this.events.get(eventName);
        const index = listeners.indexOf(callback);
        
        if (index > -1) {
            listeners.splice(index, 1);
            
            // Clean up empty event arrays
            if (listeners.length === 0) {
                this.events.delete(eventName);
            }
            
            return true;
        }
        
        return false;
    }

    /**
     * Emit an event
     */
    emit(eventName, ...args) {
        if (!this.events.has(eventName)) {
            return false;
        }

        const listeners = this.events.get(eventName);
        let successCount = 0;

        // Create a copy of listeners to avoid issues if listeners are modified during emission
        const listenersCopy = [...listeners];

        listenersCopy.forEach(callback => {
            try {
                callback(...args);
                successCount++;
            } catch (error) {
                console.error(`Error in event listener for '${eventName}':`, error);
            }
        });

        return successCount > 0;
    }

    /**
     * Remove all listeners for an event
     */
    removeAllListeners(eventName) {
        if (eventName) {
            return this.events.delete(eventName);
        } else {
            // Remove all listeners for all events
            this.events.clear();
            return true;
        }
    }

    /**
     * Get listener count for an event
     */
    listenerCount(eventName) {
        if (!this.events.has(eventName)) {
            return 0;
        }
        return this.events.get(eventName).length;
    }

    /**
     * Get all event names
     */
    eventNames() {
        return Array.from(this.events.keys());
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        const info = {};
        this.events.forEach((listeners, eventName) => {
            info[eventName] = listeners.length;
        });
        return {
            totalEvents: this.events.size,
            events: info,
            maxListeners: this.maxListeners
        };
    }

    /**
     * Set maximum listeners per event
     */
    setMaxListeners(max) {
        if (typeof max !== 'number' || max < 1) {
            throw new Error('Max listeners must be a positive number');
        }
        this.maxListeners = max;
    }

    // Convenience methods for common dashboard events

    /**
     * Emit widget refresh event
     */
    refreshWidget(widgetName) {
        return this.emit('widget:refresh', widgetName);
    }

    /**
     * Emit widget error event
     */
    widgetError(widgetName, error) {
        return this.emit('widget:error', widgetName, error);
    }

    /**
     * Emit data update event
     */
    dataUpdated(dataType, data) {
        return this.emit('data:updated', dataType, data);
    }

    /**
     * Emit user action event
     */
    userAction(action, data) {
        return this.emit('user:action', action, data);
    }

    /**
     * Emit theme change event
     */
    themeChanged(theme) {
        return this.emit('theme:changed', theme);
    }

    /**
     * Subscribe to widget events
     */
    onWidgetRefresh(callback) {
        return this.on('widget:refresh', callback);
    }

    /**
     * Subscribe to widget error events
     */
    onWidgetError(callback) {
        return this.on('widget:error', callback);
    }

    /**
     * Subscribe to data update events
     */
    onDataUpdated(callback) {
        return this.on('data:updated', callback);
    }

    /**
     * Subscribe to user action events
     */
    onUserAction(callback) {
        return this.on('user:action', callback);
    }

    /**
     * Subscribe to theme change events
     */
    onThemeChanged(callback) {
        return this.on('theme:changed', callback);
    }
}

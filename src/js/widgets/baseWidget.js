/**
 * Base Widget Class - Common functionality for all dashboard widgets
 */

export class BaseWidget {
    constructor(container, services) {
        this.container = container;
        this.services = services;
        this.isInitialized = false;
        this.isLoading = false;
        this.data = null;
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.refreshIntervalMs = 300000; // 5 minutes default
        
        // Bind methods to preserve context
        this.refresh = this.refresh.bind(this);
        this.handleError = this.handleError.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    /**
     * Initialize the widget - to be implemented by subclasses
     */
    async init() {
        throw new Error('init() method must be implemented by subclass');
    }

    /**
     * Load data for the widget - to be implemented by subclasses
     */
    async loadData() {
        throw new Error('loadData() method must be implemented by subclass');
    }

    /**
     * Render the widget - to be implemented by subclasses
     */
    render() {
        throw new Error('render() method must be implemented by subclass');
    }

    /**
     * Refresh widget data and re-render
     */
    async refresh() {
        if (this.isLoading) {
            console.log(`${this.constructor.name} is already loading, skipping refresh`);
            return;
        }

        try {
            this.setLoadingState(true);
            await this.loadData();
            this.render();
            this.services.eventBus.emit('widget:refreshed', this.constructor.name);
        } catch (error) {
            this.handleError(error);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        
        if (isLoading) {
            this.container.classList.add('widget--loading');
            this.services.loading.showElementLoading(this.container, 'Loading...');
        } else {
            this.container.classList.remove('widget--loading');
            this.services.loading.hideElementLoading(this.container);
        }
    }

    /**
     * Handle errors
     */
    handleError(error) {
        console.error(`Error in ${this.constructor.name}:`, error);
        
        this.services.eventBus.emit('widget:error', this.constructor.name, error);
        
        // Show error state in widget
        this.showErrorState(error.message || 'An error occurred while loading data');
    }

    /**
     * Show error state in widget
     */
    showErrorState(message) {
        const errorHTML = `
            <div class="widget__error">
                <div class="widget__error-icon">⚠️</div>
                <div class="widget__error-message">${message}</div>
                <button class="widget__error-retry" onclick="this.closest('.widget').dispatchEvent(new CustomEvent('retry'))">
                    Retry
                </button>
            </div>
        `;
        
        this.container.innerHTML = errorHTML;
        
        // Add retry event listener
        this.container.addEventListener('retry', () => {
            this.refresh();
        }, { once: true });
    }

    /**
     * Show empty state in widget
     */
    showEmptyState(message = 'No data available', actionText = null, actionCallback = null) {
        let actionHTML = '';
        if (actionText && actionCallback) {
            actionHTML = `
                <button class="widget__empty-action" onclick="this.dispatchEvent(new CustomEvent('action'))">
                    ${actionText}
                </button>
            `;
        }

        const emptyHTML = `
            <div class="widget__empty">
                <div class="widget__empty-icon">📭</div>
                <div class="widget__empty-message">${message}</div>
                ${actionHTML}
            </div>
        `;
        
        this.container.innerHTML = emptyHTML;
        
        if (actionCallback) {
            this.container.addEventListener('action', actionCallback, { once: true });
        }
    }

    /**
     * Create skeleton loading state
     */
    showSkeletonState(config = {}) {
        return this.services.loading.createSkeleton(this.container, config);
    }

    /**
     * Remove skeleton loading state
     */
    hideSkeletonState() {
        this.services.loading.removeSkeleton(this.container);
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            this.stopAutoRefresh();
        }

        if (this.autoRefreshEnabled && this.refreshIntervalMs > 0) {
            this.refreshInterval = setInterval(this.refresh, this.refreshIntervalMs);
            console.log(`Auto-refresh started for ${this.constructor.name} (${this.refreshIntervalMs}ms)`);
        }
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log(`Auto-refresh stopped for ${this.constructor.name}`);
        }
    }

    /**
     * Set auto-refresh interval
     */
    setAutoRefreshInterval(intervalMs) {
        this.refreshIntervalMs = intervalMs;
        
        if (this.refreshInterval) {
            this.stopAutoRefresh();
            this.startAutoRefresh();
        }
    }

    /**
     * Enable/disable auto-refresh
     */
    setAutoRefresh(enabled) {
        this.autoRefreshEnabled = enabled;
        
        if (enabled) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Override in subclasses if needed
        console.log(`${this.constructor.name} handling resize`);
    }

    /**
     * Get widget preferences from storage
     */
    getPreferences() {
        const key = `widget_${this.constructor.name.toLowerCase()}_preferences`;
        return this.services.storage.getItem(key) || {};
    }

    /**
     * Save widget preferences to storage
     */
    savePreferences(preferences) {
        const key = `widget_${this.constructor.name.toLowerCase()}_preferences`;
        return this.services.storage.setItem(key, preferences);
    }

    /**
     * Format date for display
     */
    formatDate(dateString, options = {}) {
        const date = new Date(dateString);
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    }

    /**
     * Format relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        
        return this.formatDate(dateString, { year: 'numeric', month: 'short', day: 'numeric' });
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * Create accessible button
     */
    createButton(text, onClick, options = {}) {
        const {
            className = 'widget__button',
            ariaLabel = text,
            disabled = false,
            icon = null
        } = options;

        const button = document.createElement('button');
        button.className = className;
        button.setAttribute('aria-label', ariaLabel);
        button.disabled = disabled;
        
        if (icon) {
            button.innerHTML = `<span class="button__icon">${icon}</span><span class="button__text">${text}</span>`;
        } else {
            button.textContent = text;
        }
        
        button.addEventListener('click', onClick);
        
        return button;
    }

    /**
     * Announce to screen readers
     */
    announce(message, priority = 'polite') {
        this.services.accessibility.announce(message, priority);
    }

    /**
     * Destroy widget and clean up
     */
    destroy() {
        console.log(`Destroying ${this.constructor.name}`);
        
        this.stopAutoRefresh();
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        // Clear container
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        this.isInitialized = false;
    }

    /**
     * Get debug information
     */
    getDebugInfo() {
        return {
            name: this.constructor.name,
            isInitialized: this.isInitialized,
            isLoading: this.isLoading,
            autoRefreshEnabled: this.autoRefreshEnabled,
            refreshIntervalMs: this.refreshIntervalMs,
            hasData: !!this.data,
            dataLength: Array.isArray(this.data) ? this.data.length : 0
        };
    }
}

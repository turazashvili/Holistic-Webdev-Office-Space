/**
 * Loading Manager - Handles loading states and indicators
 */

export class LoadingManager {
    constructor() {
        this.loadingElement = null;
        this.activeLoaders = new Set();
        this.init();
    }

    /**
     * Initialize loading manager
     */
    init() {
        this.loadingElement = document.getElementById('loading-indicator');
        if (!this.loadingElement) {
            console.warn('Loading indicator element not found');
        }
    }

    /**
     * Show global loading indicator
     */
    show(message = 'Loading...') {
        if (!this.loadingElement) return;

        const textElement = this.loadingElement.querySelector('.loading__text');
        if (textElement) {
            textElement.textContent = message;
        }

        this.loadingElement.setAttribute('aria-hidden', 'false');
        this.loadingElement.style.display = 'flex';
        
        // Announce to screen readers
        this.announceToScreenReader(message);
    }

    /**
     * Hide global loading indicator
     */
    hide() {
        if (!this.loadingElement) return;

        this.loadingElement.setAttribute('aria-hidden', 'true');
        this.loadingElement.style.display = 'none';
        
        // Announce completion to screen readers
        this.announceToScreenReader('Loading complete');
    }

    /**
     * Create a loading state for a specific element
     */
    showElementLoading(element, message = 'Loading...') {
        if (!element) return null;

        const loaderId = this.generateLoaderId();
        
        // Create loading overlay
        const overlay = document.createElement('div');
        overlay.className = 'element-loading';
        overlay.setAttribute('data-loader-id', loaderId);
        overlay.innerHTML = `
            <div class="element-loading__content">
                <div class="element-loading__spinner"></div>
                <span class="element-loading__text">${message}</span>
            </div>
        `;

        // Position overlay
        const rect = element.getBoundingClientRect();
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            border-radius: inherit;
        `;

        // Make parent relative if needed
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }

        element.appendChild(overlay);
        this.activeLoaders.add(loaderId);

        return loaderId;
    }

    /**
     * Hide element loading state
     */
    hideElementLoading(element, loaderId = null) {
        if (!element) return;

        if (loaderId) {
            const overlay = element.querySelector(`[data-loader-id="${loaderId}"]`);
            if (overlay) {
                overlay.remove();
                this.activeLoaders.delete(loaderId);
            }
        } else {
            // Remove all loading overlays from element
            const overlays = element.querySelectorAll('.element-loading');
            overlays.forEach(overlay => {
                const id = overlay.getAttribute('data-loader-id');
                if (id) {
                    this.activeLoaders.delete(id);
                }
                overlay.remove();
            });
        }
    }

    /**
     * Create skeleton loading for content
     */
    createSkeleton(element, config = {}) {
        if (!element) return;

        const {
            lines = 3,
            showAvatar = false,
            showButton = false,
            animate = true
        } = config;

        const skeleton = document.createElement('div');
        skeleton.className = `skeleton ${animate ? 'skeleton--animated' : ''}`;
        
        let skeletonHTML = '';

        if (showAvatar) {
            skeletonHTML += '<div class="skeleton__avatar"></div>';
        }

        for (let i = 0; i < lines; i++) {
            const width = i === lines - 1 ? '60%' : '100%';
            skeletonHTML += `<div class="skeleton__line" style="width: ${width}"></div>`;
        }

        if (showButton) {
            skeletonHTML += '<div class="skeleton__button"></div>';
        }

        skeleton.innerHTML = skeletonHTML;
        element.appendChild(skeleton);

        return skeleton;
    }

    /**
     * Remove skeleton loading
     */
    removeSkeleton(element) {
        if (!element) return;

        const skeletons = element.querySelectorAll('.skeleton');
        skeletons.forEach(skeleton => skeleton.remove());
    }

    /**
     * Show loading button state
     */
    showButtonLoading(button, loadingText = 'Loading...') {
        if (!button) return;

        // Store original content
        button.setAttribute('data-original-text', button.textContent);
        button.setAttribute('data-original-disabled', button.disabled);
        
        // Set loading state
        button.textContent = loadingText;
        button.disabled = true;
        button.classList.add('button--loading');
        
        // Add spinner if not present
        if (!button.querySelector('.button__spinner')) {
            const spinner = document.createElement('span');
            spinner.className = 'button__spinner';
            button.prepend(spinner);
        }
    }

    /**
     * Hide loading button state
     */
    hideButtonLoading(button) {
        if (!button) return;

        // Restore original content
        const originalText = button.getAttribute('data-original-text');
        const originalDisabled = button.getAttribute('data-original-disabled');
        
        if (originalText) {
            button.textContent = originalText;
            button.removeAttribute('data-original-text');
        }
        
        button.disabled = originalDisabled === 'true';
        button.removeAttribute('data-original-disabled');
        button.classList.remove('button--loading');
        
        // Remove spinner
        const spinner = button.querySelector('.button__spinner');
        if (spinner) {
            spinner.remove();
        }
    }

    /**
     * Generate unique loader ID
     */
    generateLoaderId() {
        return `loader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Announce to screen readers
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }

    /**
     * Get active loaders count
     */
    getActiveLoadersCount() {
        return this.activeLoaders.size;
    }

    /**
     * Clear all active loaders
     */
    clearAllLoaders() {
        this.hide();
        
        // Remove all element loaders
        document.querySelectorAll('.element-loading').forEach(overlay => {
            overlay.remove();
        });
        
        // Remove all skeletons
        document.querySelectorAll('.skeleton').forEach(skeleton => {
            skeleton.remove();
        });
        
        // Reset all loading buttons
        document.querySelectorAll('.button--loading').forEach(button => {
            this.hideButtonLoading(button);
        });
        
        this.activeLoaders.clear();
    }
}

/**
 * Announcements Widget - Displays company announcements and alerts
 */

import { BaseWidget } from './baseWidget.js';

export class AnnouncementsWidget extends BaseWidget {
    constructor(container, services) {
        super(container, services);
        this.dismissedAnnouncements = new Set();
        this.refreshIntervalMs = 600000; // 10 minutes for announcements
    }

    /**
     * Initialize the announcements widget
     */
    async init() {
        try {
            console.log('🔔 Initializing Announcements Widget...');
            
            // Load dismissed announcements from storage
            this.loadDismissedAnnouncements();
            
            // Load and render data
            await this.loadData();
            this.render();
            
            // Set up toggle functionality
            this.setupToggle();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            this.isInitialized = true;
            console.log('✅ Announcements Widget initialized');
            
        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Load announcements data
     */
    async loadData() {
        try {
            const response = await fetch('src/data/announcements.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const announcements = await response.json();
            
            // Filter out expired and dismissed announcements
            this.data = announcements.filter(announcement => {
                // Check if expired
                if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
                    return false;
                }
                
                // Check if dismissed
                if (this.dismissedAnnouncements.has(announcement.id)) {
                    return false;
                }
                
                return true;
            });
            
            // Sort by priority and creation date
            this.data.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
                
                if (priorityDiff !== 0) return priorityDiff;
                
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            
        } catch (error) {
            console.error('Failed to load announcements:', error);
            throw error;
        }
    }

    /**
     * Render the announcements
     */
    render() {
        // Update the count in the toggle button
        this.updateToggleCount();
        
        if (!this.data || this.data.length === 0) {
            this.showEmptyState('No announcements at this time', 'Refresh', () => this.refresh());
            return;
        }

        const announcementsHTML = this.data.map(announcement => 
            this.renderAnnouncement(announcement)
        ).join('');

        this.container.innerHTML = `
            <div class="announcements__list" role="list">
                ${announcementsHTML}
            </div>
        `;

        // Add event listeners for dismiss buttons
        this.addEventListeners();
        
        // Restore saved collapse state after rendering
        this.restoreToggleState();
        
        // Announce new announcements to screen readers
        const highPriorityCount = this.data.filter(a => a.priority === 'high').length;
        if (highPriorityCount > 0) {
            this.announce(`${highPriorityCount} high priority announcement${highPriorityCount !== 1 ? 's' : ''} available`, 'assertive');
        }
    }

    /**
     * Restore the saved toggle state
     */
    restoreToggleState() {
        const savedState = this.services.storage.getItem('announcements_collapsed');
        const isCollapsed = savedState === true || savedState === 'true';
        
        if (isCollapsed) {
            // Apply collapsed state
            this.setToggleState(false);
        }
    }

    /**
     * Set up toggle functionality
     */
    setupToggle() {
        const toggleButton = document.querySelector('.announcements__toggle');
        if (!toggleButton) return;

        // Load saved state from localStorage
        const savedState = this.services.storage.getItem('announcements_collapsed');
        const isCollapsed = savedState === true || savedState === 'true';
        
        // Set initial state (expanded by default if no saved state)
        this.setToggleState(!isCollapsed);
        
        console.log(`📋 Announcements initial state: ${isCollapsed ? 'collapsed' : 'expanded'}`);

        toggleButton.addEventListener('click', () => {
            const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
            const newCollapsedState = isExpanded;
            
            // Update UI
            this.setToggleState(!isExpanded);
            
            // Save state to localStorage
            this.services.storage.setItem('announcements_collapsed', newCollapsedState);
            
            // Announce state change
            this.announce(isExpanded ? 'Announcements collapsed' : 'Announcements expanded');
            
            console.log(`📋 Announcements state saved: ${newCollapsedState ? 'collapsed' : 'expanded'}`);
        });

        // Keyboard support
        toggleButton.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleButton.click();
            }
        });
    }

    /**
     * Set toggle state (expanded/collapsed)
     */
    setToggleState(isExpanded) {
        const toggleButton = document.querySelector('.announcements__toggle');
        const container = this.container;
        
        if (!toggleButton || !container) return;

        toggleButton.setAttribute('aria-expanded', isExpanded.toString());
        
        if (isExpanded) {
            container.classList.remove('announcements--collapsed');
            container.classList.add('announcements--expanded');
            toggleButton.setAttribute('aria-label', 'Collapse announcements');
        } else {
            container.classList.add('announcements--collapsed');
            container.classList.remove('announcements--expanded');
            toggleButton.setAttribute('aria-label', 'Expand announcements');
        }
    }

    /**
     * Update the count in the toggle button
     */
    updateToggleCount() {
        const countElement = document.querySelector('.announcements__count');
        if (countElement && this.data) {
            countElement.textContent = this.data.length.toString();
            
            // Update aria-label with count
            const toggleButton = document.querySelector('.announcements__toggle');
            if (toggleButton) {
                const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
                const action = isExpanded ? 'Collapse' : 'Expand';
                toggleButton.setAttribute('aria-label', `${action} ${this.data.length} announcement${this.data.length !== 1 ? 's' : ''}`);
            }
        }
    }

    /**
     * Render a single announcement
     */
    renderAnnouncement(announcement) {
        const typeClass = `announcement--${announcement.type}`;
        const priorityClass = `announcement--priority-${announcement.priority}`;
        const dismissibleClass = announcement.dismissible ? 'announcement--dismissible' : '';
        
        const dismissButton = announcement.dismissible ? `
            <button class="announcement__dismiss" 
                    aria-label="Dismiss announcement: ${this.sanitizeHTML(announcement.title)}"
                    data-announcement-id="${announcement.id}">
                <span aria-hidden="true">×</span>
            </button>
        ` : '';

        const timeAgo = this.formatRelativeTime(announcement.createdAt);
        const expiresText = announcement.expiresAt ? 
            `Expires ${this.formatDate(announcement.expiresAt)}` : '';

        return `
            <div class="announcement ${typeClass} ${priorityClass} ${dismissibleClass}" 
                 role="listitem"
                 data-announcement-id="${announcement.id}"
                 data-priority="${announcement.priority}">
                
                <div class="announcement__content">
                    <div class="announcement__header">
                        <div class="announcement__icon" aria-hidden="true">${announcement.icon}</div>
                        <div class="announcement__title-section">
                            <h3 class="announcement__title">${this.sanitizeHTML(announcement.title)}</h3>
                            <div class="announcement__meta">
                                <span class="announcement__author">${this.sanitizeHTML(announcement.author)}</span>
                                <span class="announcement__time" title="${this.formatDate(announcement.createdAt)}">${timeAgo}</span>
                                ${expiresText ? `<span class="announcement__expires">${expiresText}</span>` : ''}
                            </div>
                        </div>
                        ${dismissButton}
                    </div>
                    
                    <div class="announcement__message">
                        ${this.sanitizeHTML(announcement.message)}
                    </div>
                    
                    ${announcement.priority === 'high' ? '<div class="announcement__priority-indicator" aria-label="High priority"></div>' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        // Dismiss button listeners
        const dismissButtons = this.container.querySelectorAll('.announcement__dismiss');
        dismissButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const announcementId = button.getAttribute('data-announcement-id');
                this.dismissAnnouncement(announcementId);
            });
        });

        // Keyboard support for announcements
        const announcements = this.container.querySelectorAll('.announcement');
        announcements.forEach(announcement => {
            announcement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    // Could expand announcement or show more details
                    e.preventDefault();
                    this.expandAnnouncement(announcement);
                }
            });
        });
    }

    /**
     * Dismiss an announcement
     */
    dismissAnnouncement(announcementId) {
        const announcementElement = this.container.querySelector(`[data-announcement-id="${announcementId}"]`);
        if (!announcementElement) return;

        // Add dismissing animation class
        announcementElement.classList.add('announcement--dismissing');
        
        // Announce dismissal to screen readers
        const title = announcementElement.querySelector('.announcement__title').textContent;
        this.announce(`Announcement "${title}" dismissed`);

        // Remove after animation
        setTimeout(() => {
            // Add to dismissed set
            this.dismissedAnnouncements.add(announcementId);
            
            // Save to storage
            this.saveDismissedAnnouncements();
            
            // Remove from data and re-render
            this.data = this.data.filter(a => a.id !== announcementId);
            this.render();
            
            // Update toggle count
            this.updateToggleCount();
            
            // Emit event
            this.services.eventBus.emit('announcement:dismissed', announcementId);
            
        }, 300); // Match CSS animation duration
    }

    /**
     * Expand announcement (placeholder for future feature)
     */
    expandAnnouncement(announcementElement) {
        // Could show more details, related links, etc.
        console.log('Expanding announcement:', announcementElement);
    }

    /**
     * Load dismissed announcements from storage
     */
    loadDismissedAnnouncements() {
        const dismissed = this.services.storage.getDismissedAnnouncements();
        this.dismissedAnnouncements = new Set(dismissed);
    }

    /**
     * Save dismissed announcements to storage
     */
    saveDismissedAnnouncements() {
        const dismissed = Array.from(this.dismissedAnnouncements);
        this.services.storage.setItem('dismissed_announcements', dismissed);
    }

    /**
     * Clear all dismissed announcements (for testing/admin)
     */
    clearDismissedAnnouncements() {
        this.dismissedAnnouncements.clear();
        this.saveDismissedAnnouncements();
        this.refresh();
        this.announce('All dismissed announcements cleared');
    }

    /**
     * Get announcements by priority
     */
    getAnnouncementsByPriority(priority) {
        return this.data ? this.data.filter(a => a.priority === priority) : [];
    }

    /**
     * Get announcements by type
     */
    getAnnouncementsByType(type) {
        return this.data ? this.data.filter(a => a.type === type) : [];
    }

    /**
     * Check if there are critical announcements
     */
    hasCriticalAnnouncements() {
        return this.data && this.data.some(a => a.priority === 'high' && a.type === 'error');
    }

    /**
     * Get widget-specific debug info
     */
    getDebugInfo() {
        const baseInfo = super.getDebugInfo();
        const savedState = this.services.storage.getItem('announcements_collapsed');
        
        return {
            ...baseInfo,
            dismissedCount: this.dismissedAnnouncements.size,
            highPriorityCount: this.getAnnouncementsByPriority('high').length,
            criticalCount: this.data ? this.data.filter(a => a.priority === 'high' && a.type === 'error').length : 0,
            isCollapsed: savedState === true || savedState === 'true',
            savedCollapseState: savedState
        };
    }
}

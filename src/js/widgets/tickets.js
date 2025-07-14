/**
 * Support Tickets Widget - Displays support tickets dashboard
 */

import { BaseWidget } from './baseWidget.js';

export class TicketsWidget extends BaseWidget {
    constructor(container, services) {
        super(container, services);
        this.tickets = [];
        this.currentFilter = 'open';
        this.refreshIntervalMs = 300000; // 5 minutes
    }

    async init() {
        try {
            console.log('🎫 Initializing Support Tickets Widget...');
            
            await this.loadData();
            this.render();
            this.startAutoRefresh();
            
            this.isInitialized = true;
            console.log('✅ Support Tickets Widget initialized');
            
        } catch (error) {
            this.handleError(error);
        }
    }

    async loadData() {
        try {
            const response = await fetch('src/data/tickets.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.tickets = await response.json();
            
            // Sort tickets by priority and creation date
            this.sortTickets();
            
        } catch (error) {
            console.error('Failed to load support tickets:', error);
            throw error;
        }
    }

    render() {
        if (!this.tickets || this.tickets.length === 0) {
            this.showEmptyState('No support tickets found', 'Refresh', () => this.refresh());
            return;
        }

        const filteredTickets = this.getFilteredTickets();
        const stats = this.getTicketStats();

        this.container.innerHTML = `
            <div class="tickets__header">
                <div class="tickets__stats">
                    ${this.renderStats(stats)}
                </div>
                <div class="tickets__filters">
                    ${this.renderFilters()}
                </div>
            </div>
            
            <div class="tickets__list" role="list">
                ${filteredTickets.slice(0, 10).map(ticket => this.renderTicket(ticket)).join('')}
            </div>
            
            ${filteredTickets.length > 10 ? `
                <div class="tickets__footer">
                    <button class="tickets__view-all" aria-label="View all ${filteredTickets.length} tickets">
                        View All ${filteredTickets.length} Tickets
                    </button>
                </div>
            ` : ''}
        `;

        this.addEventListeners();
    }

    renderStats(stats) {
        return `
            <div class="tickets__stats-grid">
                <div class="ticket-stat ticket-stat--high">
                    <div class="ticket-stat__number">${stats.high}</div>
                    <div class="ticket-stat__label">High Priority</div>
                </div>
                <div class="ticket-stat ticket-stat--medium">
                    <div class="ticket-stat__number">${stats.medium}</div>
                    <div class="ticket-stat__label">Medium</div>
                </div>
                <div class="ticket-stat ticket-stat--low">
                    <div class="ticket-stat__number">${stats.low}</div>
                    <div class="ticket-stat__label">Low</div>
                </div>
                <div class="ticket-stat ticket-stat--overdue">
                    <div class="ticket-stat__number">${stats.overdue}</div>
                    <div class="ticket-stat__label">Overdue</div>
                </div>
            </div>
        `;
    }

    renderFilters() {
        const filters = [
            { key: 'open', label: 'Open', count: this.tickets.filter(t => ['open', 'in_progress'].includes(t.status)).length },
            { key: 'high', label: 'High Priority', count: this.tickets.filter(t => t.priority === 'high').length },
            { key: 'assigned', label: 'Assigned to Me', count: this.tickets.filter(t => t.assignee === 'IT Ingrid').length },
            { key: 'all', label: 'All', count: this.tickets.length }
        ];

        return `
            <div class="tickets__filter-buttons" role="tablist" aria-label="Ticket filters">
                ${filters.map(filter => `
                    <button class="tickets__filter ${this.currentFilter === filter.key ? 'tickets__filter--active' : ''}"
                            role="tab"
                            aria-selected="${this.currentFilter === filter.key}"
                            data-filter="${filter.key}">
                        ${filter.label} (${filter.count})
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderTicket(ticket) {
        const isOverdue = ticket.dueDate && new Date(ticket.dueDate) < new Date() && ticket.status !== 'resolved';
        const statusClass = `ticket--${ticket.status}`;
        const priorityClass = `ticket--priority-${ticket.priority}`;
        const overdueClass = isOverdue ? 'ticket--overdue' : '';

        return `
            <div class="ticket ${statusClass} ${priorityClass} ${overdueClass}" 
                 role="listitem"
                 data-ticket-id="${ticket.id}"
                 tabindex="0">
                
                <div class="ticket__content">
                    <div class="ticket__header">
                        <div class="ticket__id-section">
                            <div class="ticket__icon" aria-hidden="true">${ticket.icon}</div>
                            <div class="ticket__id">${ticket.id}</div>
                        </div>
                        
                        <div class="ticket__title-section">
                            <h4 class="ticket__title">${this.sanitizeHTML(ticket.title)}</h4>
                            <p class="ticket__description">${this.sanitizeHTML(ticket.description)}</p>
                        </div>
                        
                        <div class="ticket__badges">
                            <span class="ticket__priority-badge ticket__priority-badge--${ticket.priority}" 
                                  aria-label="Priority: ${ticket.priority}">
                                ${this.getPriorityIcon(ticket.priority)} ${ticket.priority.toUpperCase()}
                            </span>
                            <span class="ticket__status-badge ticket__status-badge--${ticket.status}" 
                                  aria-label="Status: ${ticket.status}">
                                ${this.getStatusIcon(ticket.status)} ${ticket.status.replace('_', ' ').toUpperCase()}
                            </span>
                        </div>
                    </div>
                    
                    <div class="ticket__meta">
                        <div class="ticket__details">
                            <span class="ticket__assignee">
                                <strong>Assigned:</strong> ${this.sanitizeHTML(ticket.assignee)}
                            </span>
                            <span class="ticket__reporter">
                                <strong>Reporter:</strong> ${this.sanitizeHTML(ticket.reporter)}
                            </span>
                            <span class="ticket__created">
                                <strong>Created:</strong> ${this.formatRelativeTime(ticket.createdAt)}
                            </span>
                            ${ticket.dueDate ? `
                                <span class="ticket__due ${isOverdue ? 'ticket__due--overdue' : ''}">
                                    <strong>Due:</strong> ${this.formatDate(ticket.dueDate)}
                                    ${isOverdue ? ' (Overdue)' : ''}
                                </span>
                            ` : ''}
                        </div>
                        
                        <div class="ticket__actions">
                            ${this.renderTicketActions(ticket)}
                        </div>
                    </div>
                    
                    ${ticket.affectedUsers ? `
                        <div class="ticket__impact">
                            <strong>Impact:</strong> ${ticket.affectedUsers} user${ticket.affectedUsers !== 1 ? 's' : ''} affected
                        </div>
                    ` : ''}
                    
                    ${ticket.progress !== undefined ? `
                        <div class="ticket__progress">
                            <div class="progress-bar">
                                <div class="progress-bar__fill" style="width: ${ticket.progress}%"></div>
                            </div>
                            <span class="progress-bar__text">${ticket.progress}% complete</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderTicketActions(ticket) {
        const actions = [];
        
        if (ticket.status === 'open' || ticket.status === 'pending') {
            actions.push(`
                <button class="ticket__action ticket__action--start" 
                        data-ticket-id="${ticket.id}" 
                        data-action="start"
                        aria-label="Start working on ${ticket.id}">
                    ▶️ Start
                </button>
            `);
        }
        
        if (ticket.status === 'in_progress') {
            actions.push(`
                <button class="ticket__action ticket__action--resolve" 
                        data-ticket-id="${ticket.id}" 
                        data-action="resolve"
                        aria-label="Resolve ${ticket.id}">
                    ✅ Resolve
                </button>
            `);
        }
        
        actions.push(`
            <button class="ticket__action ticket__action--view" 
                    data-ticket-id="${ticket.id}" 
                    data-action="view"
                    aria-label="View details for ${ticket.id}">
                👁️ View
            </button>
        `);

        return actions.join('');
    }

    getPriorityIcon(priority) {
        const icons = {
            high: '🔴',
            medium: '🟡',
            low: '🟢'
        };
        return icons[priority] || '⚪';
    }

    getStatusIcon(status) {
        const icons = {
            open: '🆕',
            in_progress: '🔄',
            pending: '⏳',
            resolved: '✅'
        };
        return icons[status] || '❓';
    }

    addEventListeners() {
        // Filter buttons
        const filterButtons = this.container.querySelectorAll('.tickets__filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentFilter = button.getAttribute('data-filter');
                this.render();
                this.announce(`Filtered tickets: ${button.textContent}`);
            });
        });

        // Ticket action buttons
        const actionButtons = this.container.querySelectorAll('.ticket__action');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const ticketId = button.getAttribute('data-ticket-id');
                const action = button.getAttribute('data-action');
                this.handleTicketAction(ticketId, action);
            });
        });

        // Ticket click for details
        const tickets = this.container.querySelectorAll('.ticket');
        tickets.forEach(ticket => {
            ticket.addEventListener('click', () => {
                const ticketId = ticket.getAttribute('data-ticket-id');
                this.handleTicketAction(ticketId, 'view');
            });
            
            ticket.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const ticketId = ticket.getAttribute('data-ticket-id');
                    this.handleTicketAction(ticketId, 'view');
                }
            });
        });

        // View all button
        const viewAllButton = this.container.querySelector('.tickets__view-all');
        if (viewAllButton) {
            viewAllButton.addEventListener('click', () => {
                this.showAllTickets();
            });
        }
    }

    handleTicketAction(ticketId, action) {
        const ticket = this.tickets.find(t => t.id === ticketId);
        if (!ticket) return;

        switch (action) {
            case 'start':
                this.startTicket(ticket);
                break;
            case 'resolve':
                this.resolveTicket(ticket);
                break;
            case 'view':
                this.viewTicketDetails(ticket);
                break;
        }
    }

    startTicket(ticket) {
        ticket.status = 'in_progress';
        ticket.updatedAt = new Date().toISOString();
        this.render();
        this.announce(`Started working on ticket ${ticket.id}`);
        this.services.eventBus.emit('ticket:started', ticket);
    }

    resolveTicket(ticket) {
        ticket.status = 'resolved';
        ticket.resolvedAt = new Date().toISOString();
        ticket.updatedAt = new Date().toISOString();
        this.render();
        this.announce(`Ticket ${ticket.id} resolved`);
        this.services.eventBus.emit('ticket:resolved', ticket);
    }

    viewTicketDetails(ticket) {
        const modal = document.createElement('div');
        modal.className = 'ticket-modal';
        modal.innerHTML = `
            <div class="ticket-modal__backdrop"></div>
            <div class="ticket-modal__content" role="dialog" aria-labelledby="ticket-modal-title" aria-modal="true">
                <div class="ticket-modal__header">
                    <h3 id="ticket-modal-title">${ticket.id}: ${this.sanitizeHTML(ticket.title)}</h3>
                    <button class="ticket-modal__close" aria-label="Close ticket details">×</button>
                </div>
                <div class="ticket-modal__body">
                    <div class="ticket-detail-grid">
                        <div class="ticket-detail">
                            <strong>Description:</strong>
                            <p>${this.sanitizeHTML(ticket.description)}</p>
                        </div>
                        <div class="ticket-detail">
                            <strong>Status:</strong> ${ticket.status.replace('_', ' ')}
                        </div>
                        <div class="ticket-detail">
                            <strong>Priority:</strong> ${ticket.priority}
                        </div>
                        <div class="ticket-detail">
                            <strong>Category:</strong> ${ticket.category}
                        </div>
                        <div class="ticket-detail">
                            <strong>Assignee:</strong> ${this.sanitizeHTML(ticket.assignee)}
                        </div>
                        <div class="ticket-detail">
                            <strong>Reporter:</strong> ${this.sanitizeHTML(ticket.reporter)}
                        </div>
                        <div class="ticket-detail">
                            <strong>Created:</strong> ${this.formatDate(ticket.createdAt)}
                        </div>
                        <div class="ticket-detail">
                            <strong>Last Updated:</strong> ${this.formatDate(ticket.updatedAt)}
                        </div>
                        ${ticket.dueDate ? `
                            <div class="ticket-detail">
                                <strong>Due Date:</strong> ${this.formatDate(ticket.dueDate)}
                            </div>
                        ` : ''}
                        ${ticket.affectedUsers ? `
                            <div class="ticket-detail">
                                <strong>Affected Users:</strong> ${ticket.affectedUsers}
                            </div>
                        ` : ''}
                        ${ticket.tags && ticket.tags.length > 0 ? `
                            <div class="ticket-detail">
                                <strong>Tags:</strong> ${ticket.tags.join(', ')}
                            </div>
                        ` : ''}
                        ${ticket.resolution ? `
                            <div class="ticket-detail">
                                <strong>Resolution:</strong>
                                <p>${this.sanitizeHTML(ticket.resolution)}</p>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Prevent body scroll
        document.body.classList.add('modal-open');
        
        // Focus management
        const closeButton = modal.querySelector('.ticket-modal__close');
        closeButton.focus();
        this.services.accessibility.trapFocus(modal.querySelector('.ticket-modal__content'));

        // Close handlers
        const closeModal = () => {
            this.services.accessibility.releaseFocusTrap();
            document.body.classList.remove('modal-open');
            document.body.removeChild(modal);
        };

        closeButton.addEventListener('click', closeModal);
        modal.querySelector('.ticket-modal__backdrop').addEventListener('click', closeModal);
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }

    showAllTickets() {
        // This would typically navigate to a full tickets page
        console.log('Show all tickets view');
        this.announce('Full tickets view would open here');
    }

    getFilteredTickets() {
        let filtered = this.tickets;

        switch (this.currentFilter) {
            case 'open':
                filtered = this.tickets.filter(t => ['open', 'in_progress'].includes(t.status));
                break;
            case 'high':
                filtered = this.tickets.filter(t => t.priority === 'high');
                break;
            case 'assigned':
                filtered = this.tickets.filter(t => t.assignee === 'IT Ingrid');
                break;
        }

        return filtered;
    }

    getTicketStats() {
        const openTickets = this.tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status));
        
        return {
            high: openTickets.filter(t => t.priority === 'high').length,
            medium: openTickets.filter(t => t.priority === 'medium').length,
            low: openTickets.filter(t => t.priority === 'low').length,
            overdue: openTickets.filter(t => 
                t.dueDate && new Date(t.dueDate) < new Date()
            ).length
        };
    }

    sortTickets() {
        this.tickets.sort((a, b) => {
            // First by status (open/in_progress first)
            const statusOrder = { open: 0, in_progress: 1, pending: 2, resolved: 3 };
            const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            if (statusDiff !== 0) return statusDiff;

            // Then by priority
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            const priorityDiff = (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
            if (priorityDiff !== 0) return priorityDiff;

            // Finally by creation date (newest first)
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
    }

    getDebugInfo() {
        const baseInfo = super.getDebugInfo();
        const stats = this.getTicketStats();
        
        return {
            ...baseInfo,
            totalTickets: this.tickets.length,
            openTickets: this.tickets.filter(t => ['open', 'in_progress', 'pending'].includes(t.status)).length,
            highPriorityTickets: stats.high,
            overdueTickets: stats.overdue,
            currentFilter: this.currentFilter
        };
    }
}

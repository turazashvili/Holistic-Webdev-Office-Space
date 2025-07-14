/**
 * Tasks Widget - Displays pending tasks and approvals
 */

import { BaseWidget } from './baseWidget.js';

export class TasksWidget extends BaseWidget {
    constructor(container, services) {
        super(container, services);
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentSort = 'dueDate';
        this.refreshIntervalMs = 300000; // 5 minutes
    }

    async init() {
        try {
            console.log('📋 Initializing Tasks Widget...');
            
            await this.loadData();
            this.render();
            this.startAutoRefresh();
            
            this.isInitialized = true;
            console.log('✅ Tasks Widget initialized');
            
        } catch (error) {
            this.handleError(error);
        }
    }

    async loadData() {
        try {
            const response = await fetch('src/data/tasks.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.tasks = await response.json();
            
            // Sort tasks by due date and priority
            this.sortTasks();
            
        } catch (error) {
            console.error('Failed to load tasks:', error);
            throw error;
        }
    }

    render() {
        if (!this.tasks || this.tasks.length === 0) {
            this.showEmptyState('No tasks available', 'Refresh', () => this.refresh());
            return;
        }

        const filteredTasks = this.getFilteredTasks();
        
        this.container.innerHTML = `
            <div class="tasks__header">
                <div class="tasks__filters">
                    ${this.renderFilters()}
                </div>
                <div class="tasks__summary">
                    ${this.renderSummary()}
                </div>
            </div>
            <div class="tasks__list" role="list">
                ${filteredTasks.map(task => this.renderTask(task)).join('')}
            </div>
        `;

        this.addEventListeners();
    }

    renderFilters() {
        const filters = [
            { key: 'all', label: 'All', count: this.tasks.length },
            { key: 'pending', label: 'Pending', count: this.tasks.filter(t => t.status === 'pending').length },
            { key: 'approvals', label: 'Approvals', count: this.tasks.filter(t => t.type === 'approval').length },
            { key: 'high', label: 'High Priority', count: this.tasks.filter(t => t.priority === 'high').length }
        ];

        return `
            <div class="tasks__filter-buttons" role="tablist" aria-label="Task filters">
                ${filters.map(filter => `
                    <button class="tasks__filter ${this.currentFilter === filter.key ? 'tasks__filter--active' : ''}"
                            role="tab"
                            aria-selected="${this.currentFilter === filter.key}"
                            data-filter="${filter.key}">
                        ${filter.label} (${filter.count})
                    </button>
                `).join('')}
            </div>
        `;
    }

    renderSummary() {
        const overdueTasks = this.tasks.filter(task => 
            new Date(task.dueDate) < new Date() && task.status !== 'completed'
        ).length;

        const dueTodayTasks = this.tasks.filter(task => {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            return dueDate.toDateString() === today.toDateString() && task.status !== 'completed';
        }).length;

        return `
            <div class="tasks__summary-stats">
                ${overdueTasks > 0 ? `<span class="tasks__stat tasks__stat--overdue">⚠️ ${overdueTasks} overdue</span>` : ''}
                ${dueTodayTasks > 0 ? `<span class="tasks__stat tasks__stat--today">📅 ${dueTodayTasks} due today</span>` : ''}
            </div>
        `;
    }

    renderTask(task) {
        const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
        const isDueToday = new Date(task.dueDate).toDateString() === new Date().toDateString();
        
        const statusClass = `task--${task.status}`;
        const priorityClass = `task--priority-${task.priority}`;
        const overdueClass = isOverdue ? 'task--overdue' : '';
        const dueTodayClass = isDueToday ? 'task--due-today' : '';

        return `
            <div class="task ${statusClass} ${priorityClass} ${overdueClass} ${dueTodayClass}" 
                 role="listitem"
                 data-task-id="${task.id}">
                
                <div class="task__content">
                    <div class="task__header">
                        <div class="task__icon" aria-hidden="true">${task.icon}</div>
                        <div class="task__title-section">
                            <h4 class="task__title">${this.sanitizeHTML(task.title)}</h4>
                            <p class="task__description">${this.sanitizeHTML(task.description)}</p>
                        </div>
                        <div class="task__status">
                            <span class="task__status-badge" aria-label="Status: ${task.status}">
                                ${this.getStatusIcon(task.status)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="task__meta">
                        <div class="task__details">
                            <span class="task__assignee">
                                <strong>Assignee:</strong> ${this.sanitizeHTML(task.assignee)}
                            </span>
                            <span class="task__requester">
                                <strong>From:</strong> ${this.sanitizeHTML(task.requester)}
                            </span>
                            <span class="task__due-date ${isOverdue ? 'task__due-date--overdue' : ''}">
                                <strong>Due:</strong> ${this.formatDate(task.dueDate)}
                                ${isOverdue ? ' (Overdue)' : ''}
                                ${isDueToday ? ' (Today)' : ''}
                            </span>
                        </div>
                        
                        <div class="task__actions">
                            ${this.renderTaskActions(task)}
                        </div>
                    </div>
                    
                    ${task.type === 'approval' && task.amount ? `
                        <div class="task__approval-amount">
                            Amount: <strong>${task.amount}</strong>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    renderTaskActions(task) {
        if (task.status === 'completed') {
            return `<span class="task__completed">✅ Completed ${this.formatRelativeTime(task.completedAt)}</span>`;
        }

        const actions = [];
        
        if (task.type === 'approval') {
            actions.push(`
                <button class="task__action task__action--approve" 
                        data-task-id="${task.id}" 
                        data-action="approve"
                        aria-label="Approve ${this.sanitizeHTML(task.title)}">
                    ✅ Approve
                </button>
            `);
            actions.push(`
                <button class="task__action task__action--reject" 
                        data-task-id="${task.id}" 
                        data-action="reject"
                        aria-label="Reject ${this.sanitizeHTML(task.title)}">
                    ❌ Reject
                </button>
            `);
        } else {
            actions.push(`
                <button class="task__action task__action--complete" 
                        data-task-id="${task.id}" 
                        data-action="complete"
                        aria-label="Mark ${this.sanitizeHTML(task.title)} as complete">
                    ✅ Complete
                </button>
            `);
        }

        actions.push(`
            <button class="task__action task__action--view" 
                    data-task-id="${task.id}" 
                    data-action="view"
                    aria-label="View details for ${this.sanitizeHTML(task.title)}">
                👁️ View
            </button>
        `);

        return actions.join('');
    }

    getStatusIcon(status) {
        const icons = {
            pending: '⏳',
            in_progress: '🔄',
            completed: '✅',
            rejected: '❌'
        };
        return icons[status] || '❓';
    }

    addEventListeners() {
        // Filter buttons
        const filterButtons = this.container.querySelectorAll('.tasks__filter');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentFilter = button.getAttribute('data-filter');
                this.render();
                this.announce(`Filtered tasks: ${button.textContent}`);
            });
        });

        // Task action buttons
        const actionButtons = this.container.querySelectorAll('.task__action');
        actionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const taskId = button.getAttribute('data-task-id');
                const action = button.getAttribute('data-action');
                this.handleTaskAction(taskId, action);
            });
        });

        // Keyboard navigation for tasks
        const tasks = this.container.querySelectorAll('.task');
        tasks.forEach(task => {
            task.setAttribute('tabindex', '0');
            task.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const taskId = task.getAttribute('data-task-id');
                    this.handleTaskAction(taskId, 'view');
                }
            });
        });
    }

    handleTaskAction(taskId, action) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        switch (action) {
            case 'approve':
                this.approveTask(task);
                break;
            case 'reject':
                this.rejectTask(task);
                break;
            case 'complete':
                this.completeTask(task);
                break;
            case 'view':
                this.viewTaskDetails(task);
                break;
        }
    }

    approveTask(task) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        this.render();
        this.announce(`Task "${task.title}" approved`);
        this.services.eventBus.emit('task:approved', task);
    }

    rejectTask(task) {
        task.status = 'rejected';
        task.completedAt = new Date().toISOString();
        this.render();
        this.announce(`Task "${task.title}" rejected`);
        this.services.eventBus.emit('task:rejected', task);
    }

    completeTask(task) {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
        this.render();
        this.announce(`Task "${task.title}" completed`);
        this.services.eventBus.emit('task:completed', task);
    }

    viewTaskDetails(task) {
        // Create modal with task details
        const modal = document.createElement('div');
        modal.className = 'task-modal';
        modal.innerHTML = `
            <div class="task-modal__backdrop"></div>
            <div class="task-modal__content" role="dialog" aria-labelledby="task-modal-title" aria-modal="true">
                <div class="task-modal__header">
                    <h3 id="task-modal-title">${this.sanitizeHTML(task.title)}</h3>
                    <button class="task-modal__close" aria-label="Close task details">×</button>
                </div>
                <div class="task-modal__body">
                    <p><strong>Description:</strong> ${this.sanitizeHTML(task.description)}</p>
                    <p><strong>Type:</strong> ${task.type}</p>
                    <p><strong>Status:</strong> ${task.status}</p>
                    <p><strong>Priority:</strong> ${task.priority}</p>
                    <p><strong>Assignee:</strong> ${this.sanitizeHTML(task.assignee)}</p>
                    <p><strong>Requester:</strong> ${this.sanitizeHTML(task.requester)}</p>
                    <p><strong>Due Date:</strong> ${this.formatDate(task.dueDate)}</p>
                    <p><strong>Created:</strong> ${this.formatDate(task.createdAt)}</p>
                    ${task.amount ? `<p><strong>Amount:</strong> ${task.amount}</p>` : ''}
                    ${task.category ? `<p><strong>Category:</strong> ${task.category}</p>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Focus management
        const closeButton = modal.querySelector('.task-modal__close');
        closeButton.focus();
        this.services.accessibility.trapFocus(modal.querySelector('.task-modal__content'));

        // Close handlers
        const closeModal = () => {
            this.services.accessibility.releaseFocusTrap();
            document.body.removeChild(modal);
        };

        closeButton.addEventListener('click', closeModal);
        modal.querySelector('.task-modal__backdrop').addEventListener('click', closeModal);
        
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                closeModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        });
    }

    getFilteredTasks() {
        let filtered = this.tasks;

        switch (this.currentFilter) {
            case 'pending':
                filtered = this.tasks.filter(t => t.status === 'pending');
                break;
            case 'approvals':
                filtered = this.tasks.filter(t => t.type === 'approval');
                break;
            case 'high':
                filtered = this.tasks.filter(t => t.priority === 'high');
                break;
        }

        return filtered;
    }

    sortTasks() {
        this.tasks.sort((a, b) => {
            // First by status (pending first)
            if (a.status !== b.status) {
                const statusOrder = { pending: 0, in_progress: 1, completed: 2, rejected: 3 };
                return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            }

            // Then by priority
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (a.priority !== b.priority) {
                return (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99);
            }

            // Finally by due date
            return new Date(a.dueDate) - new Date(b.dueDate);
        });
    }

    getDebugInfo() {
        const baseInfo = super.getDebugInfo();
        const overdueTasks = this.tasks.filter(t => 
            new Date(t.dueDate) < new Date() && t.status !== 'completed'
        ).length;
        
        return {
            ...baseInfo,
            totalTasks: this.tasks.length,
            pendingTasks: this.tasks.filter(t => t.status === 'pending').length,
            overdueTasks: overdueTasks,
            approvalTasks: this.tasks.filter(t => t.type === 'approval').length,
            currentFilter: this.currentFilter
        };
    }
}

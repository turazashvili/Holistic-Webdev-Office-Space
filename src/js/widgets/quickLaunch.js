/**
 * Quick Launch Widget - Customizable shortcuts to internal tools
 */

import { BaseWidget } from './baseWidget.js';

export class QuickLaunchWidget extends BaseWidget {
    constructor(container, services) {
        super(container, services);
        this.shortcuts = [];
        this.isDragging = false;
        this.draggedElement = null;
        this.refreshIntervalMs = 0; // No auto-refresh for shortcuts
    }

    async init() {
        try {
            console.log('🚀 Initializing Quick Launch Widget...');
            
            // Clean up any duplicates in storage first
            this.cleanupDuplicates();
            
            await this.loadData();
            this.render();
            this.setupDragAndDrop();
            
            this.isInitialized = true;
            console.log('✅ Quick Launch Widget initialized');
            
        } catch (error) {
            this.handleError(error);
        }
    }

    async loadData() {
        try {
            // Load default shortcuts
            const response = await fetch('src/data/shortcuts.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const defaultShortcuts = await response.json();
            
            // Load custom shortcuts from storage
            const customShortcuts = this.services.storage.getCustomShortcuts();
            
            // Combine all shortcuts
            const allShortcuts = [...defaultShortcuts, ...customShortcuts];
            
            // Remove duplicates based on ID (keep the last occurrence)
            const uniqueShortcuts = [];
            const seenIds = new Set();
            
            // Process in reverse to keep the last occurrence of each ID
            for (let i = allShortcuts.length - 1; i >= 0; i--) {
                const shortcut = allShortcuts[i];
                if (!seenIds.has(shortcut.id)) {
                    seenIds.add(shortcut.id);
                    uniqueShortcuts.unshift(shortcut);
                }
            }
            
            // Sort by order and assign to shortcuts
            this.shortcuts = uniqueShortcuts.sort((a, b) => a.order - b.order);
            
            console.log(`📊 Loaded ${this.shortcuts.length} unique shortcuts (removed ${allShortcuts.length - this.shortcuts.length} duplicates)`);
            
        } catch (error) {
            console.error('Failed to load shortcuts:', error);
            throw error;
        }
    }

    render() {
        if (!this.shortcuts || this.shortcuts.length === 0) {
            this.showEmptyState('No shortcuts available', 'Add Shortcut', () => this.showAddShortcutDialog());
            return;
        }

        const shortcutsHTML = this.shortcuts.map(shortcut => 
            this.renderShortcut(shortcut)
        ).join('');

        this.container.innerHTML = `
            <div class="quick-launch__grid" role="grid" aria-label="Quick launch shortcuts">
                ${shortcutsHTML}
                <div class="quick-launch__add-button" role="gridcell">
                    <button class="shortcut shortcut--add" 
                            aria-label="Add new shortcut"
                            title="Add new shortcut">
                        <span class="shortcut__icon">➕</span>
                        <span class="shortcut__title">Add More</span>
                    </button>
                </div>
            </div>
        `;

        this.addEventListeners();
    }

    renderShortcut(shortcut) {
        return `
            <div class="quick-launch__item" 
                 role="gridcell"
                 data-shortcut-id="${shortcut.id}"
                 draggable="true">
                <a href="${shortcut.url}" 
                   class="shortcut" 
                   style="--shortcut-color: ${shortcut.color}"
                   aria-label="${this.sanitizeHTML(shortcut.title)}: ${this.sanitizeHTML(shortcut.description)}"
                   title="${this.sanitizeHTML(shortcut.description)}">
                    <span class="shortcut__icon" aria-hidden="true">${shortcut.icon}</span>
                    <span class="shortcut__title">${this.sanitizeHTML(shortcut.title)}</span>
                </a>
                <div class="shortcut__actions">
                    <button class="shortcut__action shortcut__action--edit" 
                            aria-label="Edit ${this.sanitizeHTML(shortcut.title)} shortcut"
                            data-shortcut-id="${shortcut.id}"
                            title="Edit shortcut"
                            onclick="event.preventDefault(); event.stopPropagation();">
                        <span aria-hidden="true">✏️</span>
                    </button>
                    <button class="shortcut__action shortcut__action--delete" 
                            aria-label="Delete ${this.sanitizeHTML(shortcut.title)} shortcut"
                            data-shortcut-id="${shortcut.id}"
                            title="Delete shortcut"
                            onclick="event.preventDefault(); event.stopPropagation();">
                        <span aria-hidden="true">🗑️</span>
                    </button>
                </div>
            </div>
        `;
    }

    addEventListeners() {
        // Add shortcut button
        const addButton = this.container.querySelector('.shortcut--add');
        if (addButton) {
            addButton.addEventListener('click', () => this.showAddShortcutDialog());
        }

        // Edit shortcut buttons
        const editButtons = this.container.querySelectorAll('.shortcut__action--edit');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const shortcutId = button.getAttribute('data-shortcut-id');
                this.editShortcut(shortcutId);
            });
        });

        // Delete shortcut buttons
        const deleteButtons = this.container.querySelectorAll('.shortcut__action--delete');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const shortcutId = button.getAttribute('data-shortcut-id');
                this.deleteShortcut(shortcutId);
            });
        });

        // Shortcut click tracking
        const shortcuts = this.container.querySelectorAll('.shortcut:not(.shortcut--add)');
        shortcuts.forEach(shortcut => {
            shortcut.addEventListener('click', (e) => {
                const shortcutId = shortcut.closest('[data-shortcut-id]')?.getAttribute('data-shortcut-id');
                if (shortcutId) {
                    this.trackShortcutUsage(shortcutId);
                }
            });
        });

        // Drag and drop functionality
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const items = this.container.querySelectorAll('.quick-launch__item');
        
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });
    }

    handleDragStart(e) {
        this.isDragging = true;
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
        
        this.announce('Started dragging shortcut. Use arrow keys to reorder.');
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const afterElement = this.getDragAfterElement(this.container, e.clientY);
        const dragging = this.container.querySelector('.dragging');
        
        if (afterElement == null) {
            this.container.querySelector('.quick-launch__grid').appendChild(dragging);
        } else {
            this.container.querySelector('.quick-launch__grid').insertBefore(dragging, afterElement);
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.reorderShortcuts();
        this.announce('Shortcut reordered');
    }

    handleDragEnd(e) {
        this.isDragging = false;
        e.target.classList.remove('dragging');
        this.draggedElement = null;
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.quick-launch__item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    reorderShortcuts() {
        const items = this.container.querySelectorAll('.quick-launch__item[data-shortcut-id]');
        const newOrder = Array.from(items).map((item, index) => ({
            id: item.getAttribute('data-shortcut-id'),
            order: index + 1
        }));

        // Update shortcuts order
        this.shortcuts.forEach(shortcut => {
            const newOrderItem = newOrder.find(item => item.id === shortcut.id);
            if (newOrderItem) {
                shortcut.order = newOrderItem.order;
            }
        });

        // Save to storage
        this.saveShortcuts();
    }

    showAddShortcutDialog(existingShortcut = null) {
        const isEditing = !!existingShortcut;
        const dialogTitle = isEditing ? 'Edit Shortcut' : 'Add New Shortcut';
        
        // Create modal dialog
        const dialog = document.createElement('div');
        dialog.className = 'shortcut-dialog';
        dialog.innerHTML = `
            <div class="shortcut-dialog__backdrop"></div>
            <div class="shortcut-dialog__content" role="dialog" aria-labelledby="dialog-title" aria-modal="true">
                <h3 id="dialog-title">${dialogTitle}</h3>
                <form class="shortcut-form">
                    <div class="form-group">
                        <label for="shortcut-title">Title</label>
                        <input type="text" id="shortcut-title" required maxlength="50" 
                               value="${isEditing ? this.sanitizeHTML(existingShortcut.title) : ''}">
                    </div>
                    <div class="form-group">
                        <label for="shortcut-url">URL</label>
                        <input type="url" id="shortcut-url" required 
                               value="${isEditing ? existingShortcut.url : ''}">
                    </div>
                    <div class="form-group">
                        <label for="shortcut-description">Description</label>
                        <input type="text" id="shortcut-description" maxlength="100" 
                               value="${isEditing ? this.sanitizeHTML(existingShortcut.description) : ''}">
                    </div>
                    <div class="form-group">
                        <label for="shortcut-icon">Icon (emoji)</label>
                        <input type="text" id="shortcut-icon" maxlength="2" placeholder="🔗" 
                               value="${isEditing ? existingShortcut.icon : ''}">
                    </div>
                    <div class="form-group">
                        <label for="shortcut-color">Color</label>
                        <input type="color" id="shortcut-color" 
                               value="${isEditing ? existingShortcut.color : '#3b82f6'}">
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn--secondary" data-action="cancel">Cancel</button>
                        <button type="submit" class="btn btn--primary">
                            ${isEditing ? 'Update Shortcut' : 'Add Shortcut'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(dialog);
        
        // Focus management
        const titleInput = dialog.querySelector('#shortcut-title');
        titleInput.focus();
        
        // Trap focus in dialog
        this.services.accessibility.trapFocus(dialog.querySelector('.shortcut-dialog__content'));

        // Event listeners
        dialog.addEventListener('click', (e) => {
            if (e.target.classList.contains('shortcut-dialog__backdrop') || 
                e.target.getAttribute('data-action') === 'cancel') {
                this.closeDialog(dialog);
            }
        });

        dialog.querySelector('.shortcut-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addShortcut(dialog);
        });

        // Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeDialog(dialog);
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    closeDialog(dialog) {
        this.services.accessibility.releaseFocusTrap();
        document.body.removeChild(dialog);
    }

    addShortcut(dialog) {
        const form = dialog.querySelector('.shortcut-form');
        const formData = new FormData(form);
        
        const newShortcut = {
            id: `shortcut_${Date.now()}`,
            title: form.querySelector('#shortcut-title').value,
            url: form.querySelector('#shortcut-url').value,
            description: form.querySelector('#shortcut-description').value || '',
            icon: form.querySelector('#shortcut-icon').value || '🔗',
            color: form.querySelector('#shortcut-color').value,
            category: 'custom',
            isDefault: false,
            order: this.shortcuts.length + 1,
            usage: 0,
            lastUsed: null
        };

        this.shortcuts.push(newShortcut);
        this.saveShortcuts();
        this.render();
        this.setupDragAndDrop();
        
        this.closeDialog(dialog);
        this.announce(`Shortcut "${newShortcut.title}" added`);
    }

    removeShortcut(shortcutId) {
        const shortcut = this.shortcuts.find(s => s.id === shortcutId);
        if (!shortcut) return;

        if (confirm(`Remove "${shortcut.title}" shortcut?`)) {
            this.shortcuts = this.shortcuts.filter(s => s.id !== shortcutId);
            this.saveShortcuts();
            this.render();
            this.setupDragAndDrop();
            this.announce(`Shortcut "${shortcut.title}" removed`);
        }
    }

    trackShortcutUsage(shortcutId) {
        const shortcut = this.shortcuts.find(s => s.id === shortcutId);
        if (shortcut) {
            shortcut.usage = (shortcut.usage || 0) + 1;
            shortcut.lastUsed = new Date().toISOString();
            this.saveShortcuts();
        }
    }

    saveShortcuts() {
        const customShortcuts = this.shortcuts.filter(s => !s.isDefault);
        this.services.storage.setCustomShortcuts(customShortcuts);
    }

    /**
     * Clean up localStorage duplicates
     */
    cleanupDuplicates() {
        const customShortcuts = this.services.storage.getCustomShortcuts();
        if (!customShortcuts || customShortcuts.length === 0) return;
        
        // Remove duplicates from custom shortcuts
        const uniqueCustomShortcuts = [];
        const seenIds = new Set();
        
        // Process in reverse to keep the last occurrence
        for (let i = customShortcuts.length - 1; i >= 0; i--) {
            const shortcut = customShortcuts[i];
            if (!seenIds.has(shortcut.id)) {
                seenIds.add(shortcut.id);
                uniqueCustomShortcuts.unshift(shortcut);
            }
        }
        
        // Save cleaned up shortcuts back to storage
        if (uniqueCustomShortcuts.length !== customShortcuts.length) {
            this.services.storage.setCustomShortcuts(uniqueCustomShortcuts);
            console.log(`🧹 Cleaned up ${customShortcuts.length - uniqueCustomShortcuts.length} duplicate shortcuts from storage`);
        }
    }

    /**
     * Edit an existing shortcut
     */
    editShortcut(shortcutId) {
        const shortcut = this.shortcuts.find(s => s.id === shortcutId);
        if (!shortcut) return;

        this.showAddShortcutDialog(shortcut);
    }

    /**
     * Delete a shortcut with confirmation
     */
    deleteShortcut(shortcutId) {
        const shortcut = this.shortcuts.find(s => s.id === shortcutId);
        if (!shortcut) return;

        // Show confirmation dialog
        const confirmed = confirm(`Are you sure you want to delete "${shortcut.title}"?`);
        if (!confirmed) return;

        // Remove from shortcuts array
        this.shortcuts = this.shortcuts.filter(s => s.id !== shortcutId);
        
        // Save to storage
        this.saveShortcuts();
        
        // Re-render
        this.render();
        
        // Announce to screen readers
        this.announce(`Shortcut "${shortcut.title}" deleted`);
        
        console.log(`🗑️ Shortcut deleted: ${shortcut.title}`);
    }

    /**
     * Close dialog
     */
    closeDialog(dialog) {
        dialog.remove();
    }

    getDebugInfo() {
        const baseInfo = super.getDebugInfo();
        return {
            ...baseInfo,
            shortcutsCount: this.shortcuts.length,
            customShortcutsCount: this.shortcuts.filter(s => !s.isDefault).length,
            mostUsedShortcut: this.shortcuts.reduce((prev, current) => 
                (prev.usage || 0) > (current.usage || 0) ? prev : current, {}).title || 'None'
        };
    }
}

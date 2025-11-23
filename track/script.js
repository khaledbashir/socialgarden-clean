class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.currentEditingTask = null;
        this.draggedTask = null;
        this.quickNotes = '';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.renderAllTasks();
        this.updateColumnCounts();
        this.loadTheme();
        this.loadQuickNotes();
    }

    // Storage Management
    loadFromStorage() {
        const stored = localStorage.getItem('kanbanTasks');
        if (stored) {
            this.tasks = JSON.parse(stored);
        } else {
            // Load sample tasks from the document
            this.loadSampleTasks();
        }
    }

    saveToStorage() {
        localStorage.setItem('kanbanTasks', JSON.stringify(this.tasks));
    }

    loadSampleTasks() {
        this.tasks = [
            {
                id: this.generateId(),
                title: 'Maintain Session Document Integrity',
                description: 'Ensure all decisions, actions, and changes are documented in session documents.',
                type: 'maintenance',
                priority: 'high',
                assignee: 'AI Assistant',
                due: 'Ongoing',
                tags: ['documentation', 'tracking'],
                notes: 'This is an ongoing task that requires continuous attention.',
                column: 'inprogress',
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: 'Implement SOW Quality Validation',
                description: 'Implement programmatic validation based on Sam\'s Expected SOW Output Checklist.',
                type: 'feature',
                priority: 'medium',
                assignee: 'AI Assistant',
                due: 'TBD',
                tags: ['validation', 'quality', 'checklist'],
                notes: 'Need to review the checklist requirements first.',
                column: 'backlog',
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: 'Create Session Document',
                description: 'Created comprehensive session document as single source of truth for SOW system optimization.',
                type: 'documentation',
                priority: 'high',
                assignee: 'AI Assistant',
                due: '2025-11-14',
                tags: ['tracking', 'sso'],
                notes: '✨ Created comprehensive session document as single source of truth for SOW system optimization. The foundation is set!',
                column: 'done',
                createdAt: new Date().toISOString()
            },
            {
                id: this.generateId(),
                title: 'Local Build/Testing',
                description: 'Local building, testing, and compilation prohibited - all validation on Easypanel only.',
                type: 'constraint',
                priority: 'n/a',
                assignee: 'System',
                due: 'Permanent',
                tags: ['workflow', 'restriction'],
                notes: 'This is a permanent constraint that affects our development workflow.',
                column: 'blocked',
                createdAt: new Date().toISOString()
            }
        ];
        this.saveToStorage();
    }

    // Theme Management
    loadTheme() {
        const theme = localStorage.getItem('kanbanTheme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);
        this.updateThemeToggle(theme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('kanbanTheme', newTheme);
        this.updateThemeToggle(newTheme);
    }

    updateThemeToggle(theme) {
        const themeToggle = document.getElementById('themeToggle');
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Quick Notes Management
    loadQuickNotes() {
        const stored = localStorage.getItem('kanbanQuickNotes');
        if (stored) {
            this.quickNotes = stored;
        }
    }

    saveQuickNotes() {
        localStorage.setItem('kanbanQuickNotes', this.quickNotes);
    }

    // Event Listeners
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Add task button
        document.getElementById('addTaskBtn').addEventListener('click', () => this.openTaskModal());

        // Add task to column buttons
        document.querySelectorAll('.add-task-to-column').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = e.target.closest('.add-task-to-column').dataset.column;
                this.openTaskModal(column);
            });
        });

        // Modal controls
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        document.getElementById('cancelBtn').addEventListener('click', () => this.closeTaskModal());
        document.querySelector('#taskModal .modal-close').addEventListener('click', () => this.closeTaskModal());

        // Task details modal
        document.getElementById('closeDetailsBtn').addEventListener('click', () => this.closeDetailsModal());
        document.querySelector('#taskDetailsModal .modal-close').addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('editTaskBtn').addEventListener('click', () => this.editCurrentTask());
        document.getElementById('deleteTaskBtn').addEventListener('click', () => this.deleteCurrentTask());

        // Quick notes
        document.getElementById('notesFab').addEventListener('click', () => this.openQuickNotesModal());
        document.getElementById('saveQuickNotesBtn').addEventListener('click', () => this.saveQuickNotesModal());
        document.getElementById('cancelQuickNotesBtn').addEventListener('click', () => this.closeQuickNotesModal());
        document.querySelector('#quickNotesModal .modal-close').addEventListener('click', () => this.closeQuickNotesModal());

        // SOW Checklist
        document.getElementById('sowChecklistBtn').addEventListener('click', () => this.openSOWChecklistModal());
        document.querySelector('#sowChecklistModal .modal-close').addEventListener('click', () => this.closeSOWChecklistModal());
        document.getElementById('resetChecklistBtn').addEventListener('click', () => this.resetChecklist());
        document.getElementById('saveChecklistBtn').addEventListener('click', () => this.saveChecklistProgress());
        document.getElementById('exportChecklistBtn').addEventListener('click', () => this.exportChecklistResults());

        // Checklist checkbox change listeners
        document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateChecklistProgress());
        });

        // Search and filters
        document.getElementById('searchInput').addEventListener('input', (e) => this.filterTasks());
        document.getElementById('priorityFilter').addEventListener('change', () => this.filterTasks());
        document.getElementById('typeFilter').addEventListener('change', () => this.filterTasks());
        document.getElementById('assigneeFilter').addEventListener('change', () => this.filterTasks());

        // Column collapse/expand
        document.getElementById('collapseAllBtn').addEventListener('click', () => this.collapseAllColumns());
        document.getElementById('expandAllBtn').addEventListener('click', () => this.expandAllColumns());

        // Column individual collapse
        document.querySelectorAll('.column-collapse-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const column = e.target.closest('.kanban-column');
                column.classList.toggle('collapsed');
                const icon = btn.querySelector('i');
                icon.className = column.classList.contains('collapsed') ? 'fas fa-chevron-down' : 'fas fa-chevron-up';
            });
        });

        // Modal backdrop click to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeAllModals();
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.openTaskModal();
            }
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                document.getElementById('searchInput').focus();
            }
        });

        // Setup drag and drop
        this.setupDragAndDrop();
    }

    // Task Management
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    openTaskModal(column = 'backlog', task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');

        if (task) {
            this.currentEditingTask = task;
            title.textContent = 'Edit Task';
            form.title.value = task.title;
            form.type.value = task.type;
            form.priority.value = task.priority;
            form.assignee.value = task.assignee || '';
            form.due.value = task.due || '';
            form.tags.value = task.tags ? task.tags.join(', ') : '';
            form.description.value = task.description || '';
            form.notes.value = task.notes || '';
        } else {
            this.currentEditingTask = null;
            title.textContent = 'Add New Task';
            form.reset();
        }

        // Store target column for new tasks
        modal.dataset.targetColumn = column;
        modal.classList.add('show');
    }

    closeTaskModal() {
        document.getElementById('taskModal').classList.remove('show');
        this.currentEditingTask = null;
    }

    handleTaskSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const modal = document.getElementById('taskModal');
        const targetColumn = modal.dataset.targetColumn || 'backlog';

        const taskData = {
            title: form.title.value,
            type: form.type.value,
            priority: form.priority.value,
            assignee: form.assignee.value || 'TBD',
            due: form.due.value || 'TBD',
            tags: form.tags.value ? form.tags.value.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            description: form.description.value,
            notes: form.notes.value,
            column: this.currentEditingTask ? this.currentEditingTask.column : targetColumn,
            createdAt: this.currentEditingTask ? this.currentEditingTask.createdAt : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        if (this.currentEditingTask) {
            // Update existing task
            const index = this.tasks.findIndex(t => t.id === this.currentEditingTask.id);
            if (index !== -1) {
                this.tasks[index] = { ...this.currentEditingTask, ...taskData };
            }
        } else {
            // Create new task
            taskData.id = this.generateId();
            this.tasks.push(taskData);
        }

        this.saveToStorage();
        this.renderAllTasks();
        this.updateColumnCounts();
        this.closeTaskModal();
        this.showNotification(this.currentEditingTask ? 'Task updated successfully!' : 'Task created successfully!');
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveToStorage();
            this.renderAllTasks();
            this.updateColumnCounts();
            this.showNotification('Task deleted successfully!');
        }
    }

    moveTask(taskId, newColumn) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.column = newColumn;
            task.updatedAt = new Date().toISOString();
            this.saveToStorage();
            this.updateColumnCounts();
        }
    }

    // Task Rendering
    renderAllTasks() {
        const containers = document.querySelectorAll('.tasks-container');
        containers.forEach(container => {
            container.innerHTML = '';
        });

        this.tasks.forEach(task => {
            this.renderTask(task);
        });
    }

    renderTask(task) {
        const container = document.querySelector(`.tasks-container[data-column="${task.column}"]`);
        if (!container) return;

        const taskCard = document.createElement('div');
        taskCard.className = 'task-card fade-in';
        taskCard.draggable = true;
        taskCard.dataset.taskId = task.id;

        const typeEmoji = this.getTypeEmoji(task.type);
        const priorityColor = task.priority;
        const hasNotes = task.notes && task.notes.trim().length > 0;

        taskCard.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                <div class="task-actions">
                    <button class="task-action-btn" onclick="kanbanBoard.viewTaskDetails('${task.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="task-action-btn" onclick="kanbanBoard.openTaskModal('${task.column}', kanbanBoard.tasks.find(t => t.id === '${task.id}'))" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
            <div class="task-meta">
                <span class="task-type ${task.type}">${typeEmoji} ${task.type}</span>
                <span class="task-priority ${priorityColor}">${this.getPriorityEmoji(priorityColor)} ${priorityColor}</span>
                ${task.assignee ? `<span class="task-assignee">👤 ${task.assignee}</span>` : ''}
            </div>
            ${task.tags && task.tags.length > 0 ? `
                <div class="task-tags">
                    ${task.tags.map(tag => `<span class="task-tag">#${this.escapeHtml(tag)}</span>`).join('')}
                </div>
            ` : ''}
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-footer">
                ${task.due && task.due !== 'TBD' ? `<span class="task-due">📅 ${task.due}</span>` : ''}
                ${hasNotes ? `<span class="task-notes-indicator">📝 Has notes</span>` : ''}
            </div>
        `;

        container.appendChild(taskCard);
    }

    getTypeEmoji(type) {
        const emojis = {
            feature: '🎨',
            enhancement: '⚡',
            bug: '🐛',
            documentation: '📄',
            maintenance: '🔧',
            analysis: '📊',
            deployment: '🚀',
            constraint: '🔒'
        };
        return emojis[type] || '📋';
    }

    getPriorityEmoji(priority) {
        const emojis = {
            high: '🔴',
            medium: '🟡',
            low: '🟢',
            'n/a': '⚪'
        };
        return emojis[priority] || '⚪';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Task Details Modal
    viewTaskDetails(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('taskDetailsModal');
        const content = modal.querySelector('.task-details-content');
        
        content.innerHTML = `
            <div class="detail-row">
                <div class="detail-label">Title:</div>
                <div class="detail-value">${this.escapeHtml(task.title)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Type:</div>
                <div class="detail-value">${this.getTypeEmoji(task.type)} ${task.type}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Priority:</div>
                <div class="detail-value">${this.getPriorityEmoji(task.priority)} ${task.priority}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Assignee:</div>
                <div class="detail-value">${task.assignee}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Due Date:</div>
                <div class="detail-value">${task.due}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">${task.column}</div>
            </div>
            ${task.tags && task.tags.length > 0 ? `
                <div class="detail-row">
                    <div class="detail-label">Tags:</div>
                    <div class="detail-value">${task.tags.map(tag => `#${tag}`).join(', ')}</div>
                </div>
            ` : ''}
            ${task.description ? `
                <div class="detail-row">
                    <div class="detail-label">Description:</div>
                    <div class="detail-value">${this.escapeHtml(task.description)}</div>
                </div>
            ` : ''}
            ${task.notes ? `
                <div class="detail-row">
                    <div class="detail-label">Notes:</div>
                    <div class="detail-value">
                        <div class="detail-notes">${this.escapeHtml(task.notes)}</div>
                    </div>
                </div>
            ` : ''}
            <div class="detail-row">
                <div class="detail-label">Created:</div>
                <div class="detail-value">${new Date(task.createdAt).toLocaleString()}</div>
            </div>
            ${task.updatedAt ? `
                <div class="detail-row">
                    <div class="detail-label">Updated:</div>
                    <div class="detail-value">${new Date(task.updatedAt).toLocaleString()}</div>
                </div>
            ` : ''}
        `;

        modal.dataset.currentTaskId = taskId;
        modal.classList.add('show');
    }

    closeDetailsModal() {
        document.getElementById('taskDetailsModal').classList.remove('show');
    }

    editCurrentTask() {
        const modal = document.getElementById('taskDetailsModal');
        const taskId = modal.dataset.currentTaskId;
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.closeDetailsModal();
            this.openTaskModal(task.column, task);
        }
    }

    deleteCurrentTask() {
        const modal = document.getElementById('taskDetailsModal');
        const taskId = modal.dataset.currentTaskId;
        
        if (taskId) {
            this.deleteTask(taskId);
            this.closeDetailsModal();
        }
    }

    // Quick Notes
    openQuickNotesModal() {
        const modal = document.getElementById('quickNotesModal');
        const textarea = document.getElementById('quickNotesText');
        textarea.value = this.quickNotes;
        modal.classList.add('show');
    }

    closeQuickNotesModal() {
        document.getElementById('quickNotesModal').classList.remove('show');
    }

    saveQuickNotesModal() {
        const textarea = document.getElementById('quickNotesText');
        this.quickNotes = textarea.value;
        this.saveQuickNotes();
        this.closeQuickNotesModal();
        this.showNotification('Quick notes saved successfully!');
    }

    // Search and Filter
    filterTasks() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const priorityFilter = document.getElementById('priorityFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        const assigneeFilter = document.getElementById('assigneeFilter').value;

        const allTaskCards = document.querySelectorAll('.task-card');
        
        allTaskCards.forEach(card => {
            const taskId = card.dataset.taskId;
            const task = this.tasks.find(t => t.id === taskId);
            
            if (!task) return;

            let matchesSearch = true;
            let matchesPriority = true;
            let matchesType = true;
            let matchesAssignee = true;

            // Search filter
            if (searchTerm) {
                matchesSearch = task.title.toLowerCase().includes(searchTerm) ||
                               (task.description && task.description.toLowerCase().includes(searchTerm)) ||
                               (task.notes && task.notes.toLowerCase().includes(searchTerm)) ||
                               (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
            }

            // Priority filter
            if (priorityFilter) {
                matchesPriority = task.priority === priorityFilter;
            }

            // Type filter
            if (typeFilter) {
                matchesType = task.type === typeFilter;
            }

            // Assignee filter
            if (assigneeFilter) {
                matchesAssignee = task.assignee === assigneeFilter;
            }

            const shouldShow = matchesSearch && matchesPriority && matchesType && matchesAssignee;
            card.style.display = shouldShow ? 'block' : 'none';
        });
    }

    // Column Management
    updateColumnCounts() {
        document.querySelectorAll('.kanban-column').forEach(column => {
            const columnName = column.dataset.column;
            const count = this.tasks.filter(t => t.column === columnName).length;
            const countElement = column.querySelector('.task-count');
            if (countElement) {
                countElement.textContent = count;
            }
        });
    }

    collapseAllColumns() {
        document.querySelectorAll('.kanban-column').forEach(column => {
            column.classList.add('collapsed');
            const icon = column.querySelector('.column-collapse-btn i');
            if (icon) {
                icon.className = 'fas fa-chevron-down';
            }
        });
    }

    expandAllColumns() {
        document.querySelectorAll('.kanban-column').forEach(column => {
            column.classList.remove('collapsed');
            const icon = column.querySelector('.column-collapse-btn i');
            if (icon) {
                icon.className = 'fas fa-chevron-up';
            }
        });
    }

    // Drag and Drop
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                this.draggedTask = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.innerHTML);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.classList.remove('dragging');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const container = e.target.closest('.tasks-container');
            if (container && this.draggedTask) {
                const afterElement = this.getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(this.draggedTask);
                } else {
                    container.insertBefore(this.draggedTask, afterElement);
                }
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const container = e.target.closest('.tasks-container');
            
            if (container && this.draggedTask) {
                const newColumn = container.dataset.column;
                const taskId = this.draggedTask.dataset.taskId;
                
                this.moveTask(taskId, newColumn);
                this.draggedTask = null;
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
        
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

    // Modal Management
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // Notifications
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--type-feature);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: var(--shadow-lg);
            z-index: 2000;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
    }

    // SOW Checklist Methods
    openSOWChecklistModal() {
        const modal = document.getElementById('sowChecklistModal');
        this.loadChecklistProgress();
        this.updateChecklistProgress();
        modal.classList.add('show');
    }

    closeSOWChecklistModal() {
        document.getElementById('sowChecklistModal').classList.remove('show');
    }

    loadChecklistProgress() {
        const saved = localStorage.getItem('sowChecklistProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            Object.keys(progress).forEach(checkboxId => {
                const checkbox = document.getElementById(checkboxId);
                if (checkbox) {
                    checkbox.checked = progress[checkboxId];
                }
            });
        }
    }

    saveChecklistProgress() {
        const checkboxes = document.querySelectorAll('.checklist-checkbox');
        const progress = {};
        
        checkboxes.forEach(checkbox => {
            progress[checkbox.id] = checkbox.checked;
        });
        
        localStorage.setItem('sowChecklistProgress', JSON.stringify(progress));
        this.showNotification('Checklist progress saved successfully!');
    }

    resetChecklist() {
        if (confirm('Are you sure you want to reset the checklist? This will clear all your progress.')) {
            document.querySelectorAll('.checklist-checkbox').forEach(checkbox => {
                checkbox.checked = false;
            });
            localStorage.removeItem('sowChecklistProgress');
            this.updateChecklistProgress();
            this.showNotification('Checklist reset successfully!');
        }
    }

    updateChecklistProgress() {
        const checkboxes = document.querySelectorAll('.checklist-checkbox');
        const total = checkboxes.length;
        const checked = document.querySelectorAll('.checklist-checkbox:checked').length;
        const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;
        
        const progressFill = document.getElementById('checklistProgress');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${percentage}% Complete`;
        }
    }

    exportChecklistResults() {
        const checkboxes = document.querySelectorAll('.checklist-checkbox');
        const results = {
            timestamp: new Date().toISOString(),
            totalItems: checkboxes.length,
            completedItems: document.querySelectorAll('.checklist-checkbox:checked').length,
            percentage: Math.round((document.querySelectorAll('.checklist-checkbox:checked').length / checkboxes.length) * 100),
            items: []
        };
        
        checkboxes.forEach(checkbox => {
            const label = checkbox.nextElementSibling;
            results.items.push({
                id: checkbox.id,
                completed: checkbox.checked,
                text: label ? label.textContent.trim() : ''
            });
        });
        
        const exportText = `Sam's SOW Quality Checklist Results\n` +
            `Generated: ${new Date().toLocaleString()}\n` +
            `Progress: ${results.completedItems}/${results.totalItems} (${results.percentage}%)\n\n` +
            `Completed Items:\n` +
            results.items.filter(item => item.completed).map(item => `✅ ${item.text}`).join('\n') + '\n\n' +
            `Pending Items:\n` +
            results.items.filter(item => !item.completed).map(item => `⏳ ${item.text}`).join('\n');
        
        // Create download link
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sow-checklist-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Checklist results exported successfully!');
    }
}

// Initialize the application
let kanbanBoard;
document.addEventListener('DOMContentLoaded', () => {
    kanbanBoard = new KanbanBoard();
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(20px);
        }
    }
`;
document.head.appendChild(style);
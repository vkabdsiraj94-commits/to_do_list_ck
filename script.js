class TodoDashboard {
    constructor() {
        this.statusCategories = [];
        this.priorityCategories = [];
        this.isEditing = false;
        this.init();
    }

    init() {
        this.loadDataFromStorage();
        this.setupEventListeners();
        this.updateCurrentDate();
        this.renderTables();
    }

    setupEventListeners() {
        const hamburgerMenu = document.querySelector('.hamburger-menu');
        const sidebar = document.querySelector('.sidebar');
        
        hamburgerMenu?.addEventListener('click', () => {
            sidebar.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !hamburgerMenu.contains(e.target)) {
                    sidebar.classList.remove('show');
                }
            }
        });

        const addCategoryBtn = document.getElementById('addCategoryBtn');
        addCategoryBtn?.addEventListener('click', () => this.showAddCategoryModal());

        const closeModal = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const saveCategoryBtn = document.getElementById('saveCategoryBtn');
        const modal = document.getElementById('addCategoryModal');

        closeModal?.addEventListener('click', () => this.hideAddCategoryModal());
        cancelBtn?.addEventListener('click', () => this.hideAddCategoryModal());
        saveCategoryBtn?.addEventListener('click', () => this.saveNewCategory());

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) this.hideAddCategoryModal();
        });

        const searchInput = document.getElementById('searchInput');
        searchInput?.addEventListener('input', (e) => this.handleSearch(e.target.value));

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAddCategoryModal();
                this.cancelAllEditing();
            }
        });
    }

    loadDataFromStorage() {
        try {
            const storedStatus = localStorage.getItem('todoStatusCategories');
            const storedPriority = localStorage.getItem('todoPriorityCategories');

            this.statusCategories = storedStatus ? JSON.parse(storedStatus) : [
                { id: this.generateId(), name: 'Completed' },
                { id: this.generateId(), name: 'In Progress' },
                { id: this.generateId(), name: 'Not Started' }
            ];

            this.priorityCategories = storedPriority ? JSON.parse(storedPriority) : [
                { id: this.generateId(), name: 'Extreme' },
                { id: this.generateId(), name: 'Moderate' },
                { id: this.generateId(), name: 'Low' }
            ];
        } catch {
            this.initializeDefaultData();
        }
    }

    initializeDefaultData() {
        this.statusCategories = [
            { id: this.generateId(), name: 'Completed' },
            { id: this.generateId(), name: 'In Progress' },
            { id: this.generateId(), name: 'Not Started' }
        ];
        this.priorityCategories = [
            { id: this.generateId(), name: 'Extreme' },
            { id: this.generateId(), name: 'Moderate' },
            { id: this.generateId(), name: 'Low' }
        ];
    }

    saveDataToStorage() {
        localStorage.setItem('todoStatusCategories', JSON.stringify(this.statusCategories));
        localStorage.setItem('todoPriorityCategories', JSON.stringify(this.priorityCategories));
    }

    generateId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }

    updateCurrentDate() {
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            currentDateElement.textContent = now.toLocaleDateString('en-US', options);
        }
    }

    renderTables() {
        this.renderStatusTable();
        this.renderPriorityTable();
    }

    renderStatusTable() {
        const tbody = document.getElementById('statusTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        this.statusCategories.forEach(category => tbody.appendChild(this.createTableRow(category, 'status')));
    }

    renderPriorityTable() {
        const tbody = document.getElementById('priorityTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        this.priorityCategories.forEach(category => tbody.appendChild(this.createTableRow(category, 'priority')));
    }

    createTableRow(category, type) {
        const row = document.createElement('tr');
        row.setAttribute('data-id', category.id);
        row.setAttribute('data-type', type);
        row.innerHTML = `
            <td><span class="category-name" data-original="${category.name}">${category.name}</span></td>
            <td>
                <div class="actions">
                    <button class="edit-btn" onclick="dashboard.editCategory('${category.id}', '${type}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="dashboard.deleteCategory('${category.id}', '${type}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    editCategory(id, type) {
        if (this.isEditing) {
            this.showNotification('Please finish editing the current category first.', 'warning');
            return;
        }
        const row = document.querySelector(`tr[data-id="${id}"]`);
        const nameSpan = row.querySelector('.category-name');
        const actionsDiv = row.querySelector('.actions');
        const currentName = nameSpan.textContent;

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'category-name editing';
        input.setAttribute('data-original', currentName);

        nameSpan.parentNode.replaceChild(input, nameSpan);
        actionsDiv.innerHTML = `
            <button class="save-btn" onclick="dashboard.saveEdit('${id}', '${type}')">
                <i class="fas fa-check"></i> Save
            </button>
            <button class="cancel-btn" onclick="dashboard.cancelEdit('${id}', '${type}')">
                <i class="fas fa-times"></i> Cancel
            </button>
        `;
        input.focus();
        input.select();
        this.isEditing = true;
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.saveEdit(id, type);
            else if (e.key === 'Escape') this.cancelEdit(id, type);
        });
    }

    saveEdit(id, type) {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        const input = row.querySelector('.category-name.editing');
        const newName = input.value.trim();
        if (!newName) return this.showNotification('Category name cannot be empty.', 'error');

        const categories = type === 'status' ? this.statusCategories : this.priorityCategories;
        if (categories.some(cat => cat.id !== id && cat.name.toLowerCase() === newName.toLowerCase())) {
            return this.showNotification('A category with this name already exists.', 'error');
        }

        const category = categories.find(cat => cat.id === id);
        if (category) category.name = newName;
        this.saveDataToStorage();

        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.setAttribute('data-original', newName);
        nameSpan.textContent = newName;
        input.parentNode.replaceChild(nameSpan, input);

        const actionsDiv = row.querySelector('.actions');
        actionsDiv.innerHTML = `
            <button class="edit-btn" onclick="dashboard.editCategory('${id}', '${type}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn" onclick="dashboard.deleteCategory('${id}', '${type}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        this.isEditing = false;
        this.showNotification('Category updated successfully!', 'success');
    }

    cancelEdit(id, type) {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        const input = row.querySelector('.category-name.editing');
        const originalName = input.getAttribute('data-original');

        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.setAttribute('data-original', originalName);
        nameSpan.textContent = originalName;
        input.parentNode.replaceChild(nameSpan, input);

        const actionsDiv = row.querySelector('.actions');
        actionsDiv.innerHTML = `
            <button class="edit-btn" onclick="dashboard.editCategory('${id}', '${type}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="delete-btn" onclick="dashboard.deleteCategory('${id}', '${type}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        `;
        this.isEditing = false;
    }

    cancelAllEditing() {
        if (!this.isEditing) return;
        const editingInput = document.querySelector('.category-name.editing');
        if (editingInput) {
            const row = editingInput.closest('tr');
            const id = row.getAttribute('data-id');
            const type = row.getAttribute('data-type');
            this.cancelEdit(id, type);
        }
    }

    deleteCategory(id, type) {
        if (this.isEditing) return this.showNotification('Please finish editing before deleting.', 'warning');

        const categories = type === 'status' ? this.statusCategories : this.priorityCategories;
        const index = categories.findIndex(cat => cat.id === id);
        if (index === -1) return;

        if (confirm(`Are you sure you want to delete the category "${categories[index].name}"?`)) {
            categories.splice(index, 1);
            this.saveDataToStorage();
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) row.remove();
            this.showNotification('Category deleted successfully!', 'success');
        }
    }

    showAddCategoryModal() {
        const modal = document.getElementById('addCategoryModal');
        const categoryName = document.getElementById('categoryName');
        modal.classList.add('show');
        categoryName.value = '';
        categoryName.focus();
    }

    hideAddCategoryModal() {
        const modal = document.getElementById('add

class AdminPanel {
    constructor() {
        this.currentSection = 'overview';
        this.selectedUsers = new Set();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadDashboardData();
        this.setupCharts();
    }

    setupNavigation() {
        // Handle sidebar navigation
        document.querySelectorAll('.admin-nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                this.switchSection(sectionId);
                
                // Update active state
                document.querySelectorAll('.admin-nav a').forEach(l => {
                    l.classList.remove('active');
                });
                link.classList.add('active');
            });
        });

        // Mobile menu toggle
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => {
                document.querySelector('.admin-nav').classList.toggle('active');
            });
        }
    }

    setupEventListeners() {
        // Select all users checkbox
        const selectAll = document.getElementById('selectAll');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                const checkboxes = document.querySelectorAll('.admin-table input[type="checkbox"]');
                checkboxes.forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                    if (checkbox.checked) {
                        this.selectedUsers.add(checkbox.closest('tr').dataset.userId);
                    } else {
                        this.selectedUsers.delete(checkbox.closest('tr').dataset.userId);
                    }
                });
                this.updateSelectionCount();
            });
        }

        // Individual user checkboxes
        document.querySelectorAll('.admin-table input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const userId = e.target.closest('tr').dataset.userId;
                if (e.target.checked) {
                    this.selectedUsers.add(userId);
                } else {
                    this.selectedUsers.delete(userId);
                    document.getElementById('selectAll').checked = false;
                }
                this.updateSelectionCount();
            });
        });

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('.quick-action-btn').dataset.action;
                this.handleQuickAction(action);
            });
        });

        // Action buttons in user table
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('.action-btn').classList[1];
                const userId = e.target.closest('tr').dataset.userId;
                this.handleUserAction(action, userId);
            });
        });
    }

    switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Load section data if needed
            this.loadSectionData(sectionId);
        }
    }

    async loadDashboardData() {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Update dashboard stats
            this.updateDashboardStats();
            
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    updateDashboardStats() {
        // This would be populated from actual API data
        const stats = {
            totalUsers: 1847,
            activeAlerts: 156,
            weatherEvents: 89,
            revenue: 8450
        };

        // Update UI elements
        document.querySelectorAll('.stat-value').forEach((element, index) => {
            const values = Object.values(stats);
            element.textContent = index === 3 ? `RM ${values[index].toLocaleString()}` : values[index].toLocaleString();
        });
    }

    setupCharts() {
        // User Growth Chart
        const userGrowthCtx = document.getElementById('userGrowthChart')?.getContext('2d');
        if (userGrowthCtx) {
            new Chart(userGrowthCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'New Users',
                        data: [65, 78, 90, 110, 130, 150],
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // User Distribution Chart
        const userDistributionCtx = document.getElementById('userDistributionChart')?.getContext('2d');
        if (userDistributionCtx) {
            new Chart(userDistributionCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Drivers', 'School Admins', 'Parents', 'System Admins'],
                    datasets: [{
                        data: [65, 20, 10, 5],
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#8b5cf6'
                        ],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'all-users':
                this.loadUsersData();
                break;
            case 'alerts-config':
                this.loadAlertsConfig();
                break;
            case 'payments':
                this.loadPaymentsData();
                break;
            case 'system-config':
                this.loadSystemConfig();
                break;
        }
    }

    async loadUsersData() {
        // Simulate loading users data
        const loadingRow = document.createElement('tr');
        loadingRow.innerHTML = `
            <td colspan="9" style="text-align: center; padding: 3rem;">
                <div class="admin-loader"></div>
                <p>Loading users...</p>
            </td>
        `;
        
        const tableBody = document.querySelector('.admin-table tbody');
        tableBody.innerHTML = '';
        tableBody.appendChild(loadingRow);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Replace with actual data
            tableBody.innerHTML = `
                <tr data-user-id="1">
                    <td>
                        <label class="checkbox-label">
                            <input type="checkbox">
                            <span></span>
                        </label>
                    </td>
                    <td>
                        <div class="user-cell">
                            <div class="user-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="user-info">
                                <strong>John Driver</strong>
                                <small>ID: USR-001</small>
                            </div>
                        </div>
                    </td>
                    <td>john.driver@school.edu.my</td>
                    <td>
                        <span class="badge badge-driver">
                            <i class="fas fa-bus"></i> Driver
                        </span>
                    </td>
                    <td>SK Batu Pahat</td>
                    <td>
                        <span class="badge badge-free">Free</span>
                    </td>
                    <td>
                        <span class="status-badge active">Active</span>
                    </td>
                    <td>Today, 08:30</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn view" title="View Profile">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" title="Edit User">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn message" title="Send Message">
                                <i class="fas fa-envelope"></i>
                            </button>
                            <button class="action-btn delete" title="Delete User">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
                <!-- More user rows would be added here -->
            `;
            
            this.setupEventListeners(); // Re-bind event listeners
            
        } catch (error) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load users. Please try again.</p>
                    </td>
                </tr>
            `;
        }
    }

    updateSelectionCount() {
        const count = this.selectedUsers.size;
        const selectionInfo = document.querySelector('.selection-info');
        
        if (!selectionInfo && count > 0) {
            const infoDiv = document.createElement('div');
            infoDiv.className = 'selection-info alert alert-info';
            infoDiv.innerHTML = `
                <i class="fas fa-info-circle"></i>
                <span>${count} user${count !== 1 ? 's' : ''} selected</span>
                <div class="selection-actions">
                    <button onclick="admin.bulkAction('export')">Export</button>
                    <button onclick="admin.bulkAction('deactivate')">Deactivate</button>
                    <button onclick="admin.bulkAction('delete')">Delete</button>
                </div>
            `;
            document.querySelector('.table-section').prepend(infoDiv);
        } else if (selectionInfo && count === 0) {
            selectionInfo.remove();
        } else if (selectionInfo) {
            selectionInfo.querySelector('span').textContent = 
                `${count} user${count !== 1 ? 's' : ''} selected`;
        }
    }

    handleUserAction(action, userId) {
        switch(action) {
            case 'view':
                this.viewUserProfile(userId);
                break;
            case 'edit':
                this.editUser(userId);
                break;
            case 'message':
                this.sendMessageToUser(userId);
                break;
            case 'delete':
                this.deleteUser(userId);
                break;
        }
    }

    handleQuickAction(action) {
        switch(action) {
            case 'add-user':
                this.addNewUser();
                break;
            case 'send-alert':
                this.sendBulkAlert();
                break;
            case 'generate-report':
                this.generateReport();
                break;
            case 'system-settings':
                this.openSystemConfig();
                break;
            case 'backup':
                this.backupDatabase();
                break;
            case 'view-logs':
                this.viewLogs();
                break;
        }
    }

    addNewUser() {
        this.showModal('Add New User', `
            <form id="addUserForm" class="admin-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>First Name</label>
                        <input type="text" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Last Name</label>
                        <input type="text" class="form-control" required>
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Email Address</label>
                    <input type="email" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>User Type</label>
                    <select class="form-control" required>
                        <option value="">Select Type</option>
                        <option value="driver">Driver</option>
                        <option value="admin">School Admin</option>
                        <option value="parent">Parent/Guardian</option>
                        <option value="system_admin">System Admin</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>School/Organization</label>
                    <input type="text" class="form-control">
                </div>
                
                <div class="form-group">
                    <label>Password</label>
                    <input type="password" class="form-control" required>
                    <small class="text-muted">Minimum 8 characters with letters and numbers</small>
                </div>
                
                <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" class="form-control" required>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox">
                        <span>Send welcome email with login instructions</span>
                    </label>
                </div>
            </form>
        `, [
            { text: 'Cancel', action: 'close' },
            { text: 'Create User', action: 'submit', primary: true }
        ]);
    }

    showModal(title, content, buttons = []) {
        const modal = document.createElement('div');
        modal.className = 'admin-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${buttons.length ? `
                    <div class="modal-footer">
                        ${buttons.map(btn => `
                            <button class="${btn.primary ? 'btn-primary' : 'btn-secondary'}"
                                    data-action="${btn.action}">
                                ${btn.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal on X click
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Close modal on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Handle button actions
        modal.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action === 'close') {
                    modal.remove();
                } else if (action === 'submit') {
                    this.submitModalForm(modal);
                }
            });
        });

        return modal;
    }

    submitModalForm(modal) {
        const form = modal.querySelector('form');
        if (form && form.checkValidity()) {
            // Show loading state
            const submitBtn = modal.querySelector('button[data-action="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<div class="admin-loader"></div>';
            submitBtn.disabled = true;

            // Simulate API call
            setTimeout(() => {
                this.showNotification('User created successfully!', 'success');
                modal.remove();
                this.loadUsersData(); // Refresh user list
            }, 1500);
        } else {
            form.reportValidity();
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                               type === 'error' ? 'exclamation-circle' : 
                               type === 'warning' ? 'exclamation-triangle' : 
                               'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles if not already added
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .admin-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideIn 0.3s ease;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        const container = document.createElement('div');
        container.className = 'admin-notification';
        container.appendChild(notification);
        document.body.appendChild(container);

        // Auto remove after 5 seconds
        setTimeout(() => {
            container.remove();
        }, 5000);
    }

    // Additional admin methods would be implemented here
    refreshData() {
        this.showNotification('Refreshing data...', 'info');
        this.loadSectionData(this.currentSection);
    }

    exportData() {
        this.showNotification('Exporting data...', 'info');
        // Implement export functionality
    }

    systemReboot() {
        if (confirm('Are you sure you want to reboot the system? This may cause temporary service interruption.')) {
            this.showNotification('System reboot initiated...', 'warning');
            // Implement system reboot
        }
    }
}

// Initialize admin panel
const admin = new AdminPanel();
window.admin = admin;
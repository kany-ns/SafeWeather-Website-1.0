class AlertSystem {
    constructor() {
        this.alerts = [];
        this.filters = {
            type: 'all',
            severities: ['critical', 'warning', 'info'],
            statuses: ['active']
        };
        this.notificationSettings = {
            email: true,
            sms: true,
            push: true,
            phone: false,
            realtime: true,
            dailyDigest: false,
            weeklyReport: false
        };
        this.thresholds = {
            temperatureHigh: 35,
            temperatureLow: 20,
            rainfallHeavy: 50,
            rainfallFlood: 100,
            windSpeed: 40
        };
        this.init();
    }

    init() {
        this.loadAlerts();
        this.setupEventListeners();
        this.setupWebSocket();
        this.checkPermissions();
    }

    loadAlerts() {
        // Load sample alerts (in production, this would come from API)
        this.alerts = [
            {
                id: 1,
                type: 'weather',
                severity: 'critical',
                status: 'unread',
                title: 'Severe Thunderstorm Warning',
                description: 'Severe thunderstorm detected with heavy rainfall (50mm/hour) and strong winds (60km/h). Expected to affect school routes between 14:00 - 16:00.',
                location: 'Batu Pahat',
                timestamp: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
                route: 'BP-101',
                actions: ['details', 'acknowledge', 'share']
            },
            {
                id: 2,
                type: 'hazard',
                severity: 'warning',
                status: 'read',
                title: 'Flood Risk Alert',
                description: 'High flood risk in low-lying areas due to continuous rainfall. Avoid Jalan Kluang and use alternative routes.',
                location: 'Jalan Kluang',
                timestamp: new Date(Date.now() - 60 * 60000).toISOString(), // 1 hour ago
                route: 'BP-102',
                actions: ['details', 'route']
            },
            {
                id: 3,
                type: 'weather',
                severity: 'info',
                status: 'read',
                title: 'High Temperature Advisory',
                description: 'Temperature expected to reach 35°C this afternoon. Ensure proper ventilation and hydration for students.',
                location: 'All Routes',
                timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
                actions: ['details']
            },
            {
                id: 4,
                type: 'system',
                severity: 'info',
                status: 'read',
                title: 'System Maintenance',
                description: 'Scheduled maintenance will occur tonight from 02:00 to 04:00. Service may be temporarily unavailable.',
                timestamp: new Date(Date.now() - 24 * 60 * 60000).toISOString(), // Yesterday
                actions: []
            }
        ];

        this.renderAlerts();
        this.updateAlertStats();
    }

    setupEventListeners() {
        // Filter event listeners
        document.getElementById('alertTypeFilter').addEventListener('change', (e) => {
            this.filters.type = e.target.value;
            this.renderAlerts();
        });

        // Severity filters
        document.querySelectorAll('.severity-filters input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const severity = e.target.value;
                if (e.target.checked) {
                    this.filters.severities.push(severity);
                } else {
                    this.filters.severities = this.filters.severities.filter(s => s !== severity);
                }
                this.renderAlerts();
            });
        });

        // Status filters
        document.querySelectorAll('.status-filters input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const status = e.target.value;
                if (e.target.checked) {
                    this.filters.statuses.push(status);
                } else {
                    this.filters.statuses = this.filters.statuses.filter(s => s !== status);
                }
                this.renderAlerts();
            });
        });

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Threshold sliders
        document.querySelectorAll('.threshold-input input[type="range"]').forEach(slider => {
            slider.addEventListener('input', (e) => {
                const value = e.target.value;
                const valueSpan = e.target.parentElement.querySelector('.threshold-value');
                valueSpan.textContent = value + (e.target.id.includes('temperature') ? '°C' : 
                                                e.target.id.includes('rainfall') ? 'mm' : 'km/h');
                
                // Update thresholds object
                const key = this.getThresholdKey(e.target);
                if (key) {
                    this.thresholds[key] = parseInt(value);
                }
            });
        });

        // Notification toggles
        document.querySelectorAll('.notification-options input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const key = this.getNotificationKey(e.target);
                if (key) {
                    this.notificationSettings[key] = e.target.checked;
                }
            });
        });

        // Alert action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.action-btn')) {
                const btn = e.target.closest('.action-btn');
                const action = btn.textContent.trim().toLowerCase();
                const alertId = btn.closest('.alert-item').dataset.alertId;
                
                if (alertId) {
                    this.handleAlertAction(parseInt(alertId), action);
                }
            }
        });
    }

    setupWebSocket() {
        // In production, this would connect to a real WebSocket server
        // For demo, simulate real-time alerts
        this.simulateRealTimeAlerts();
    }

    simulateRealTimeAlerts() {
        // Simulate receiving new alerts
        setInterval(() => {
            if (Math.random() > 0.7) { // 30% chance of new alert
                const severities = ['info', 'warning', 'critical'];
                const types = ['weather', 'hazard', 'traffic'];
                const severity = severities[Math.floor(Math.random() * severities.length)];
                const type = types[Math.floor(Math.random() * types.length)];
                
                const newAlert = {
                    id: Date.now(),
                    type: type,
                    severity: severity,
                    status: 'unread',
                    title: this.generateAlertTitle(type, severity),
                    description: this.generateAlertDescription(type, severity),
                    location: 'Batu Pahat',
                    timestamp: new Date().toISOString(),
                    route: 'BP-' + (101 + Math.floor(Math.random() * 3)),
                    actions: ['details', 'acknowledge']
                };

                this.alerts.unshift(newAlert);
                this.renderAlerts();
                this.updateAlertStats();
                this.showNotification(`New ${severity} alert: ${newAlert.title}`, severity);
                
                // Trigger browser notification if enabled
                if (this.notificationSettings.push && this.checkNotificationPermission()) {
                    this.showBrowserNotification(newAlert);
                }
            }
        }, 30000); // Check every 30 seconds
    }

    generateAlertTitle(type, severity) {
        const titles = {
            weather: {
                critical: 'Severe Storm Warning',
                warning: 'Heavy Rain Alert',
                info: 'Weather Update'
            },
            hazard: {
                critical: 'Major Hazard Detected',
                warning: 'Hazard Zone Alert',
                info: 'Safety Advisory'
            },
            traffic: {
                critical: 'Major Traffic Disruption',
                warning: 'Traffic Congestion',
                info: 'Road Condition Update'
            }
        };
        return titles[type]?.[severity] || 'New Alert';
    }

    generateAlertDescription(type, severity) {
        const descriptions = {
            weather: 'Weather conditions may affect your routes. Please exercise caution.',
            hazard: 'Potential hazard detected in your area. Consider alternative routes.',
            traffic: 'Traffic conditions may cause delays on your usual routes.'
        };
        return descriptions[type] || 'New alert notification.';
    }

    renderAlerts() {
        const alertList = document.querySelector('.alert-list');
        if (!alertList) return;

        // Filter alerts
        const filteredAlerts = this.alerts.filter(alert => {
            // Type filter
            if (this.filters.type !== 'all' && alert.type !== this.filters.type) {
                return false;
            }
            
            // Severity filter
            if (!this.filters.severities.includes(alert.severity)) {
                return false;
            }
            
            // Status filter
            if (!this.filters.statuses.includes(alert.status)) {
                return false;
            }
            
            return true;
        });

        // Render alerts
        alertList.innerHTML = filteredAlerts.map(alert => `
            <div class="alert-item ${alert.severity} ${alert.status}" data-alert-id="${alert.id}">
                <div class="alert-icon">
                    <i class="fas ${this.getAlertIcon(alert.type, alert.severity)}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-header">
                        <h4>${alert.title}</h4>
                        <div class="alert-meta">
                            <span class="alert-time">${this.formatTime(alert.timestamp)}</span>
                            ${alert.location ? `<span class="alert-location"><i class="fas fa-map-marker-alt"></i> ${alert.location}</span>` : ''}
                        </div>
                    </div>
                    <p class="alert-description">${alert.description}</p>
                    <div class="alert-actions">
                        ${alert.actions.includes('details') ? `
                            <button class="action-btn">
                                <i class="fas fa-eye"></i> Details
                            </button>
                        ` : ''}
                        ${alert.actions.includes('acknowledge') ? `
                            <button class="action-btn">
                                <i class="fas fa-check"></i> Acknowledge
                            </button>
                        ` : ''}
                        ${alert.actions.includes('share') ? `
                            <button class="action-btn">
                                <i class="fas fa-share-alt"></i> Share
                            </button>
                        ` : ''}
                        ${alert.actions.includes('route') ? `
                            <button class="action-btn">
                                <i class="fas fa-route"></i> Alt. Route
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="alert-status">
                    <span class="status-badge ${alert.status}">${alert.status.toUpperCase()}</span>
                </div>
            </div>
        `).join('');

        // Update unread count in navbar
        const unreadCount = this.alerts.filter(a => a.status === 'unread').length;
        this.updateNavbarBadge(unreadCount);
    }

    getAlertIcon(type, severity) {
        const icons = {
            weather: {
                critical: 'fa-exclamation-circle',
                warning: 'fa-exclamation-triangle',
                info: 'fa-cloud-sun-rain'
            },
            hazard: {
                critical: 'fa-radiation',
                warning: 'fa-exclamation-triangle',
                info: 'fa-info-circle'
            },
            traffic: {
                critical: 'fa-car-crash',
                warning: 'fa-traffic-light',
                info: 'fa-car'
            },
            system: 'fa-cogs'
        };
        
        return icons[type]?.[severity] || icons.system || 'fa-bell';
    }

    formatTime(timestamp) {
        const now = new Date();
        const alertTime = new Date(timestamp);
        const diffMs = now - alertTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return alertTime.toLocaleDateString();
    }

    updateAlertStats() {
        const stats = {
            active: this.alerts.filter(a => a.status === 'unread').length,
            unread: this.alerts.filter(a => a.status === 'unread').length,
            critical: this.alerts.filter(a => a.severity === 'critical').length,
            totalToday: this.alerts.filter(a => {
                const alertDate = new Date(a.timestamp);
                const today = new Date();
                return alertDate.toDateString() === today.toDateString();
            }).length
        };

        // Update stat values
        document.querySelectorAll('.stat-item').forEach((item, index) => {
            const values = Object.values(stats);
            if (values[index] !== undefined) {
                item.querySelector('.stat-value').textContent = values[index];
            }
        });
    }

    updateNavbarBadge(count) {
        const badge = document.querySelector('.alert-badge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.getElementById(tab)?.classList.add('active');
    }

    getThresholdKey(input) {
        const map = {
            'temperature-high': 'temperatureHigh',
            'temperature-low': 'temperatureLow',
            'rainfall-heavy': 'rainfallHeavy',
            'rainfall-flood': 'rainfallFlood',
            'wind-speed': 'windSpeed'
        };
        return map[input.id] || null;
    }

    getNotificationKey(checkbox) {
        const map = {
            'email': 'email',
            'sms': 'sms',
            'push': 'push',
            'phone': 'phone',
            'realtime': 'realtime',
            'daily-digest': 'dailyDigest',
            'weekly-report': 'weeklyReport'
        };
        return map[checkbox.id] || null;
    }

    async handleAlertAction(alertId, action) {
        const alert = this.alerts.find(a => a.id === alertId);
        if (!alert) return;

        switch(action) {
            case 'details':
                await this.showAlertDetails(alert);
                break;
            case 'acknowledge':
                await this.acknowledgeAlert(alertId);
                break;
            case 'share':
                await this.shareAlert(alert);
                break;
            case 'route':
                await this.showAlternativeRoute(alert);
                break;
        }
    }

    async showAlertDetails(alert) {
        console.log('showAlertDetails called with alert:', alert);
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas ${this.getAlertIcon(alert.type, alert.severity)}"></i> ${alert.title}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert-details">
                        <div class="detail-row">
                            <span class="detail-label">Severity:</span>
                            <span class="detail-value ${alert.severity}">${alert.severity.toUpperCase()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value">${new Date(alert.timestamp).toLocaleString()}</span>
                        </div>
                        ${alert.location ? `
                        <div class="detail-row">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${alert.location}</span>
                        </div>
                        ` : ''}
                        ${alert.route ? `
                        <div class="detail-row">
                            <span class="detail-label">Affected Route:</span>
                            <span class="detail-value">${alert.route}</span>
                        </div>
                        ` : ''}
                        <div class="detail-row full">
                            <span class="detail-label">Description:</span>
                            <p class="detail-value">${alert.description}</p>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Recommended Actions:</span>
                            <ul class="detail-value">
                                ${this.getRecommendedActions(alert).map(action => `<li>${action}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn-primary" onclick="alertSystem.acknowledgeAlert(${alert.id})">
                        <i class="fas fa-check"></i> Mark as Read
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    getRecommendedActions(alert) {
        const actions = {
            critical: [
                'Avoid the affected area immediately',
                'Follow emergency evacuation routes if necessary',
                'Contact emergency services if in danger'
            ],
            warning: [
                'Exercise extreme caution',
                'Consider alternative routes',
                'Monitor weather updates closely'
            ],
            info: [
                'Stay informed about developing conditions',
                'Prepare contingency plans',
                'Check vehicle conditions'
            ]
        };
        return actions[alert.severity] || ['Stay alert and follow safety guidelines'];
    }

    async acknowledgeAlert(alertId) {
        console.log('acknowledgeAlert called with alertId:', alertId);
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.status = 'read';
            this.renderAlerts();
            this.updateAlertStats();
            this.showNotification('Alert acknowledged', 'success');
        }
    }

    async shareAlert(alert) {
        const shareData = {
            title: `SafeWeather Alert: ${alert.title}`,
            text: `${alert.description}\n\nLocation: ${alert.location || 'Various areas'}\nTime: ${new Date(alert.timestamp).toLocaleTimeString()}`,
            url: window.location.href
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                this.showNotification('Alert shared successfully', 'success');
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            // Fallback: copy to clipboard
            const text = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
            await navigator.clipboard.writeText(text);
            this.showNotification('Alert details copied to clipboard', 'success');
        }
    }

    async showAlternativeRoute(alert) {
        // In production, this would integrate with maps
        this.showNotification('Alternative route suggestions loading...', 'info');
        
        // Simulate API call
        setTimeout(() => {
            window.open(`hazard-map.html?avoid=${alert.location}`, '_blank');
        }, 1000);
    }

    async markAllAsRead() {
        if (confirm('Mark all alerts as read?')) {
            this.alerts.forEach(alert => {
                alert.status = 'read';
            });
            this.renderAlerts();
            this.updateAlertStats();
            this.showNotification('All alerts marked as read', 'success');
        }
    }

    async deleteAllAlerts() {
        if (confirm('Delete all alerts? This action cannot be undone.')) {
            this.alerts = [];
            this.renderAlerts();
            this.updateAlertStats();
            this.showNotification('All alerts deleted', 'success');
        }
    }

    async saveConfiguration() {
        try {
            // Save to localStorage (in production, this would be an API call)
            localStorage.setItem('safeweather_alert_config', JSON.stringify({
                notificationSettings: this.notificationSettings,
                thresholds: this.thresholds,
                filters: this.filters
            }));
            
            this.showNotification('Configuration saved successfully', 'success');
        } catch (error) {
            this.showNotification('Failed to save configuration', 'error');
        }
    }

    checkPermissions() {
        // Check notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            this.requestNotificationPermission();
        }
    }

    async requestNotificationPermission() {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                this.showNotification('Browser notifications enabled', 'success');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
        }
    }

    checkNotificationPermission() {
        return 'Notification' in window && Notification.permission === 'granted';
    }

    showBrowserNotification(alert) {
        if (!this.checkNotificationPermission()) return;

        const notification = new Notification(`SafeWeather Alert: ${alert.title}`, {
            body: alert.description,
            icon: '/images/logo.png',
            badge: '/images/logo.png',
            tag: alert.id,
            requireInteraction: alert.severity === 'critical',
            silent: alert.severity === 'info'
        });

        notification.onclick = () => {
            window.focus();
            this.showAlertDetails(alert);
            notification.close();
        };
    }

    showNotification(message, type) {
        console.log('showNotification called with message:', message, 'type:', type);
        // Use existing notification system
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Global functions for HTML onclick handlers
function createNewAlert() {
    alertSystem.showNotification('Create new alert feature coming soon!', 'info');
}

function configureNotifications() {
    alertSystem.switchTab('notifications');
}

function clearFilters() {
    // Reset all filters
    document.getElementById('alertTypeFilter').value = 'all';
    document.querySelectorAll('.severity-filters input, .status-filters input').forEach(checkbox => {
        checkbox.checked = true;
    });
    
    alertSystem.filters = {
        type: 'all',
        severities: ['critical', 'warning', 'info'],
        statuses: ['active', 'read', 'archived']
    };
    
    alertSystem.renderAlerts();
}

function applyFilters() {
    alertSystem.renderAlerts();
}

function viewAlertDetails(alertId) {
    console.log('viewAlertDetails called with alertId:', alertId);
    const alert = alertSystem.alerts.find(a => a.id === alertId);
    if (alert) {
        console.log('Found alert:', alert);
        alertSystem.showAlertDetails(alert);
    } else {
        console.log('Alert not found for id:', alertId);
    }
}

function acknowledgeAlert(alertId) {
    alertSystem.acknowledgeAlert(alertId);
}

function shareAlert(alertId) {
    const alert = alertSystem.alerts.find(a => a.id === alertId);
    if (alert) {
        alertSystem.shareAlert(alert);
    }
}

function showAlternativeRoute() {
    alertSystem.showNotification('Alternative route feature loading...', 'info');
}

function markAllAsRead() {
    alertSystem.markAllAsRead();
}

function deleteAllAlerts() {
    alertSystem.deleteAllAlerts();
}

function saveConfiguration() {
    alertSystem.saveConfiguration();
}

// Initialize alert system
const alertSystem = new AlertSystem();
window.alertSystem = alertSystem;
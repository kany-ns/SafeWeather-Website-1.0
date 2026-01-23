/**
 * dashboard.js
 * Dashboard functionality for SafeWeather
 */

class Dashboard {
    constructor() {
        this.weatherData = null;
        this.alertsData = null;
        this.scheduleData = null;
        this.init();
    }

    init() {
        console.log('Loading dashboard data...');
        this.loadDashboardData();
        this.setupEventListeners();
        this.initializeCharts();
        this.updateWeatherDisplay();
    }

    async loadDashboardData() {
        try {
            // Simulate API calls for dashboard data
            // In a real app, replace with actual API endpoints
            const [weatherResponse, alertsResponse, scheduleResponse] = await Promise.all([
                this.fetchWeatherData(),
                this.fetchAlertsData(),
                this.fetchScheduleData()
            ]);

            this.weatherData = weatherResponse;
            this.alertsData = alertsResponse;
            this.scheduleData = scheduleResponse;

            this.updateDashboardUI();
            console.log('Dashboard data loaded successfully');
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showErrorMessage('Failed to load dashboard data. Please refresh the page.');
        }
    }

    async fetchWeatherData() {
        // Mock weather data - replace with actual API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    temperature: 32,
                    condition: 'Sunny',
                    humidity: 65,
                    windSpeed: 12,
                    visibility: 10,
                    pressure: 1013,
                    alerts: 2
                });
            }, 1000);
        });
    }

    async fetchAlertsData() {
        // Mock alerts data
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        type: 'critical',
                        title: 'Thunderstorm Warning',
                        message: 'Expected near Parit Raja at 14:00',
                        time: '10 minutes ago'
                    },
                    {
                        type: 'warning',
                        title: 'Heavy Rain Alert',
                        message: 'Route BP-101 may experience flooding',
                        time: '1 hour ago'
                    }
                ]);
            }, 800);
        });
    }

    async fetchScheduleData() {
        // Mock schedule data
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    {
                        time: '06:30 AM',
                        route: 'BP-101 (Morning Pickup)',
                        students: 24,
                        status: 'safe'
                    },
                    {
                        time: '01:30 PM',
                        route: 'BP-102 (Afternoon Drop-off)',
                        students: 22,
                        status: 'warning'
                    }
                ]);
            }, 600);
        });
    }

    updateDashboardUI() {
        // Update weather stats
        if (this.weatherData) {
            document.querySelector('.temp-large').textContent = `${this.weatherData.temperature}°C`;
            document.querySelector('.stat-info h3').textContent = `${this.weatherData.temperature}°C`;
            // Update other weather elements...
        }

        // Update alerts
        if (this.alertsData) {
            const alertsContainer = document.querySelector('.alerts-list');
            alertsContainer.innerHTML = '';
            this.alertsData.forEach(alert => {
                const alertElement = this.createAlertElement(alert);
                alertsContainer.appendChild(alertElement);
            });
        }

        // Update schedule
        if (this.scheduleData) {
            const scheduleBody = document.querySelector('.schedule-table tbody');
            scheduleBody.innerHTML = '';
            this.scheduleData.forEach(item => {
                const row = this.createScheduleRow(item);
                scheduleBody.appendChild(row);
            });
        }
    }

    createAlertElement(alert) {
        const div = document.createElement('div');
        div.className = `alert-item ${alert.type}`;
        div.innerHTML = `
            <div class="alert-icon">
                <i class="fas fa-exclamation-${alert.type === 'critical' ? 'circle' : 'triangle'}"></i>
            </div>
            <div class="alert-content">
                <h4>${alert.title}</h4>
                <p>${alert.message}</p>
                <span class="alert-time">${alert.time}</span>
            </div>
            <button class="alert-action">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        return div;
    }

    createScheduleRow(item) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.time}</td>
            <td>${item.route}</td>
            <td>${item.students} students</td>
            <td>
                <span class="status-badge ${item.status}">
                    <i class="fas fa-${item.status === 'safe' ? 'check-circle' : 'exclamation-triangle'}"></i> 
                    ${item.status === 'safe' ? 'Safe' : 'Watch'}
                </span>
            </td>
            <td>
                <button class="action-icon" title="View Details">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-icon" title="Get Directions">
                    <i class="fas fa-directions"></i>
                </button>
            </td>
        `;
        return tr;
    }

    setupEventListeners() {
        // Language toggle
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) {
            langToggle.addEventListener('click', () => {
                // Implement language switching logic
                console.log('Language toggle clicked');
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.querySelector('span').textContent;
                console.log(`Quick action: ${action}`);
                // Implement specific actions
            });
        });
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        
        const themeBtn = document.querySelector('.theme-btn span');
        if (themeBtn) {
            themeBtn.textContent = newTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
        }
        
        localStorage.setItem('theme', newTheme);
    }

    initializeCharts() {
        // Initialize any charts if needed
        // Currently no charts in dashboard.html, but ready for future use
        console.log('Charts initialized (if any)');
    }

    updateWeatherDisplay() {
        // Update weather display periodically
        setInterval(() => {
            // Refresh weather data every 5 minutes
            this.loadDashboardData();
        }, 300000);
    }

    showErrorMessage(message) {
        // Simple error display - could be enhanced with toast notifications
        alert(message);
    }
}

// Global functions for HTML onclick handlers
function generateReport() {
    console.log('Generating report...');
    // Implement report generation
}

function checkRouteSafety() {
    console.log('Checking route safety...');
    // Implement route safety check
}

function setNotification() {
    console.log('Setting notification...');
    // Implement notification setup
}

function shareReport() {
    console.log('Sharing report...');
    // Implement report sharing
}

function printRoute() {
    console.log('Printing route...');
    window.print();
}

function printSchedule() {
    console.log('Printing schedule...');
    window.print();
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});
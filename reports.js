/**
 * reports.js
 * Weather report functionality
 */

class WeatherReportsManager {
    constructor() {
        this.currentReport = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.loadWeatherData();
        this.setupEventListeners();
        this.initializeCharts();
    }

    loadWeatherData() {
        // Simulate loading weather data
        console.log('Loading weather report data...');
        // In production, this would fetch from weather API
    }

    setupEventListeners() {
        // Add any report-specific event listeners here
    }

    initializeCharts() {
        // Initialize charts if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.createTemperatureChart();
            this.createPrecipitationChart();
            this.createWindChart();
        }
    }

    createTemperatureChart() {
        const ctx = document.getElementById('temperatureChart');
        if (ctx) {
            this.charts.temperature = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['00:00', '06:00', '12:00', '18:00', '24:00'],
                    datasets: [{
                        label: 'Temperature (°C)',
                        data: [25, 28, 32, 30, 26],
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    createPrecipitationChart() {
        const ctx = document.getElementById('precipitationChart');
        if (ctx) {
            this.charts.precipitation = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    datasets: [{
                        label: 'Precipitation (mm)',
                        data: [0, 5, 15, 2, 8],
                        backgroundColor: '#4ecdc4'
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    createWindChart() {
        const ctx = document.getElementById('windChart');
        if (ctx) {
            this.charts.wind = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['North', 'South', 'East', 'West'],
                    datasets: [{
                        data: [25, 35, 20, 20],
                        backgroundColor: ['#45b7d1', '#96ceb4', '#feca57', '#ff9ff3']
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }
    }
}

// Global functions for HTML onclick handlers
function generateNewReport() {
    console.log('Generating new weather report...');
    showNotification('Generating new report...', 'info');

    // Simulate report generation
    setTimeout(() => {
        showNotification('New weather report generated!', 'success');
        // In production, this would refresh the data
        location.reload();
    }, 2000);
}

function previewReport() {
    console.log('Previewing report...');
    // Open report in new window or modal
    window.open('weather-report.html', '_blank');
}

function downloadReport() {
    console.log('Downloading report...');
    showNotification('Downloading report...', 'info');

    // Simulate download
    setTimeout(() => {
        showNotification('Report downloaded successfully!', 'success');
        // In production, this would trigger actual download
    }, 1500);
}

function shareReport() {
    console.log('Sharing report...');

    const shareData = {
        title: 'SafeWeather Report',
        text: 'Check out this weather report from SafeWeather',
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(console.error);
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        showNotification('Report link copied to clipboard!', 'success');
    }
}

function saveReport() {
    console.log('Saving report...');
    showNotification('Saving report...', 'info');

    // Simulate saving
    setTimeout(() => {
        showNotification('Report saved to dashboard!', 'success');
        // In production, this would save to user account
    }, 1000);
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideInRight 0.3s ease-out;
    `;

    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span style="margin-left: 8px;">${message}</span>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 3000);
}

// Add notification animations to CSS if not present
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOutRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}

// Initialize reports manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherReportsManager();
});
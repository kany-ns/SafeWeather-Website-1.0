// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const langToggle = document.getElementById('lang-toggle');
const currentLang = document.getElementById('current-lang');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navMenu = document.querySelector('.nav-menu');
const languageDropdown = document.querySelector('.language-dropdown');

// Current Year for Footer
const currentYearElement = document.getElementById('current-year');
if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}

// Theme Toggle Functionality
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update button text and icon
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('span');
    
    if (newTheme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
        themeToggle.setAttribute('title', 'Switch to light mode');
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
        themeToggle.setAttribute('title', 'Switch to dark mode');
    }
    
    // Save preference to localStorage
    localStorage.setItem('theme', newTheme);
});
}

// Language Toggle
langToggle.addEventListener('click', () => {
    languageDropdown.style.display = 
        languageDropdown.style.display === 'block' ? 'none' : 'block';
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!langToggle.contains(e.target) && !languageDropdown.contains(e.target)) {
        languageDropdown.style.display = 'none';
    }
});

// Language selection
document.querySelectorAll('.language-dropdown button').forEach(button => {
    button.addEventListener('click', (e) => {
        const lang = e.target.dataset.lang;
        currentLang.textContent = lang.toUpperCase();
        languageDropdown.style.display = 'none';
        
        // Save language preference
        localStorage.setItem('language', lang);
        
        // Show notification
        showNotification(`Language changed to ${lang === 'en' ? 'English' : 'Malay'}`);
    });
});

// Mobile Menu Toggle
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const icon = mobileMenuBtn.querySelector('i');
        icon.className = navMenu.classList.contains('active') 
            ? 'fas fa-times' 
            : 'fas fa-bars';
    });
}

// Close mobile menu when clicking on a link
if (navMenu) {
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            if (mobileMenuBtn) {
                mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
            }
        });
    });
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="close-notification"><i class="fas fa-times"></i></button>
    `;
    
    // Add styles for notification
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 10px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        }
        .notification.success {
            border-left: 4px solid #10b981;
        }
        .notification.error {
            border-left: 4px solid #ef4444;
        }
        .notification.info {
            border-left: 4px solid #3b82f6;
        }
        .close-notification {
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
        }
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Close notification
    notification.querySelector('.close-notification').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);

// Update theme button based on saved preference
if (savedTheme === 'dark') {
    const icon = themeToggle.querySelector('i');
    const text = themeToggle.querySelector('span');
    icon.className = 'fas fa-sun';
    text.textContent = 'Light Mode';
}

// Initialize language from localStorage
const savedLang = localStorage.getItem('language') || 'en';
currentLang.textContent = savedLang.toUpperCase();

// Print functionality
document.querySelectorAll('.print-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        window.print();
    });
});

// Alert badge update (example - would connect to real data)
function updateAlertBadge(count) {
    const badge = document.querySelector('.alert-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline' : 'none';
    }
}

// Simulate alert count update
setTimeout(() => {
    updateAlertBadge(3);
}, 1000);
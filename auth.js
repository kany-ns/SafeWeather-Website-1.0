class Authentication {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check for saved user session
        this.checkSession();
        
        // Initialize login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            this.initLoginForm(loginForm);
        }

        // Initialize registration form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            this.initRegisterForm(registerForm);
        }

        // Initialize password toggles
        this.initPasswordToggles();
    }

    checkSession() {
        const savedUser = localStorage.getItem('safeweather_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUIForLoggedInUser();
        }
    }

    initLoginForm(form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin(form);
        });

        // Initialize social login buttons
        document.querySelectorAll('.social-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const provider = e.target.classList.contains('google') ? 'google' : 'microsoft';
                this.handleSocialLogin(provider);
            });
        });
    }

    initRegisterForm(form) {
        // User type selection
        const userTypeOptions = document.querySelectorAll('input[name="userType"]');
        userTypeOptions.forEach(option => {
            option.addEventListener('change', (e) => {
                this.updateFormForUserType(e.target.value);
            });
        });

        // Password strength checker
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                this.checkPasswordStrength(e.target.value);
            });
        }

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration(form);
        });
    }

    initPasswordToggles() {
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                const input = e.target.closest('.password-input').querySelector('input');
                const icon = e.target.tagName === 'I' ? e.target : e.target.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // For demo purposes - accept any email/password combination
            // In production, validate against backend
            const user = {
                id: Date.now().toString(),
                email: data.email,
                name: data.email.split('@')[0],
                role: 'driver',
                school: 'SK Batu Pahat',
                plan: 'free',
                registeredAt: new Date().toISOString()
            };

            // Save user to localStorage
            localStorage.setItem('safeweather_user', JSON.stringify(user));
            localStorage.setItem('safeweather_token', 'demo_token_' + Date.now());
            
            if (data.remember) {
                localStorage.setItem('safeweather_remember', 'true');
            }

            this.currentUser = user;

            // Show success message
            this.showNotification('Login successful! Redirecting...', 'success');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            this.showNotification('Invalid email or password. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleRegistration(form) {
        const formData = new FormData(form);
        
        // Validate passwords match
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match!', 'error');
            return;
        }

        // Validate terms acceptance
        if (!formData.get('terms')) {
            this.showNotification('Please accept the Terms of Service', 'error');
            return;
        }

        const userData = {
            id: Date.now().toString(),
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            userType: formData.get('userType'),
            schoolName: formData.get('schoolName'),
            routeNumber: formData.get('routeNumber'),
            plan: 'free',
            registeredAt: new Date().toISOString(),
            newsletter: formData.get('newsletter') === 'on'
        };

        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
        submitBtn.disabled = true;

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Save user to localStorage (simulate backend)
            localStorage.setItem('safeweather_user', JSON.stringify(userData));
            localStorage.setItem('safeweather_token', 'demo_token_' + Date.now());

            this.currentUser = userData;

            // Show success message
            this.showNotification('Account created successfully! Welcome to SafeWeather.', 'success');

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            this.showNotification('Registration failed. Please try again.', 'error');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async handleSocialLogin(provider) {
        this.showNotification(`Signing in with ${provider}...`, 'info');
        
        // Simulate social login
        await new Promise(resolve => setTimeout(resolve, 1500));

        const user = {
            id: Date.now().toString(),
            email: `user_${Date.now()}@${provider}.com`,
            name: `User ${Date.now().toString().slice(-4)}`,
            role: 'driver',
            school: 'Demo School',
            plan: 'free',
            provider: provider,
            registeredAt: new Date().toISOString()
        };

        localStorage.setItem('safeweather_user', JSON.stringify(user));
        localStorage.setItem('safeweather_token', 'social_token_' + provider);

        this.showNotification(`Signed in with ${provider}!`, 'success');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    checkPasswordStrength(password) {
        let strength = 0;
        const strengthBar = document.querySelector('.strength-bar');
        const strengthText = document.querySelector('.strength-text');

        if (!strengthBar || !strengthText) return;

        // Length check
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;

        // Complexity checks
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;

        // Update strength bar
        const width = (strength / 5) * 100;
        strengthBar.style.width = `${width}%`;

        // Update text and color
        let color, text;
        if (strength <= 2) {
            color = '#ef4444';
            text = 'Weak';
        } else if (strength === 3) {
            color = '#f59e0b';
            text = 'Medium';
        } else {
            color = '#10b981';
            text = 'Strong';
        }

        strengthBar.style.backgroundColor = color;
        strengthText.textContent = `Password strength: ${text}`;
        strengthText.style.color = color;
    }

    updateFormForUserType(userType) {
        const schoolInfo = document.getElementById('schoolInfo');
        const routeInfo = document.getElementById('routeInfo');

        if (userType === 'driver' || userType === 'van') {
            schoolInfo.style.display = 'block';
            routeInfo.style.display = 'block';
        } else if (userType === 'admin') {
            schoolInfo.style.display = 'block';
            routeInfo.style.display = 'none';
        } else {
            schoolInfo.style.display = 'none';
            routeInfo.style.display = 'none';
        }
    }

    updateUIForLoggedInUser() {
        // Update navigation
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu && this.currentUser) {
            const userLinks = `
                <li><a href="dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
                <li><a href="profile.html"><i class="fas fa-user"></i> ${this.currentUser.name}</a></li>
                <li><a href="logout.html" class="btn-logout"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
            `;
            navMenu.querySelector('ul').innerHTML = userLinks;
        }
    }

    logout() {
        localStorage.removeItem('safeweather_user');
        localStorage.removeItem('safeweather_token');
        this.currentUser = null;
        
        this.showNotification('Logged out successfully', 'info');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    showNotification(message, type) {
        // Use the notification system from main.js
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Check if user is logged in
    isLoggedIn() {
        return this.currentUser !== null;
    }

    // Get current user
    getUser() {
        return this.currentUser;
    }

    // Check user role
    hasRole(role) {
        return this.currentUser && this.currentUser.role === role;
    }

    // Check subscription plan
    hasPlan(plan) {
        return this.currentUser && this.currentUser.plan === plan;
    }
}

// Initialize authentication system
const auth = new Authentication();

// Export for use in other files
window.auth = auth;

// Auto-check session on page load
document.addEventListener('DOMContentLoaded', () => {
    if (auth.isLoggedIn() && !window.location.href.includes('dashboard')) {
        // Redirect to dashboard if logged in and not already there
        if (!window.location.href.includes('dashboard') && 
            !window.location.href.includes('profile')) {
            window.location.href = 'dashboard.html';
        }
    }
});
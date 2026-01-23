class PaymentSystem {
    constructor() {
        this.stripe = null;
        this.paypal = null;
        this.currentPlan = null;
        this.userSubscription = null;
        this.init();
    }

    init() {
        this.initializeStripe();
        this.initializePayPal();
        this.loadUserSubscription();
        this.setupEventListeners();
        this.setupBillingToggle();
    }

    initializeStripe() {
        // Initialize Stripe with public key
        if (typeof Stripe !== 'undefined') {
            this.stripe = Stripe('pk_test_YOUR_STRIPE_PUBLIC_KEY'); // Replace with your key
            
            // Initialize Stripe Elements
            const elements = this.stripe.elements();
            
            // Create card element
            const card = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#32325d',
                        fontFamily: 'Inter, sans-serif',
                        '::placeholder': {
                            color: '#aab7c4'
                        }
                    },
                    invalid: {
                        color: '#fa755a',
                        iconColor: '#fa755a'
                    }
                }
            });
            
            // Mount card element
            const cardElement = document.getElementById('card-element');
            if (cardElement) {
                card.mount(cardElement);
                
                // Handle real-time validation errors
                card.addEventListener('change', (event) => {
                    const displayError = document.getElementById('card-errors');
                    if (event.error) {
                        displayError.textContent = event.error.message;
                    } else {
                        displayError.textContent = '';
                    }
                });
            }
            
            window.stripeCard = card;
        }
    }

    initializePayPal() {
        // PayPal will be loaded via script tag
        // Check if PayPal is available
        if (typeof paypal !== 'undefined') {
            this.paypal = paypal;
        }
    }

    loadUserSubscription() {
        // Load user subscription from localStorage or API
        const savedSubscription = localStorage.getItem('safeweather_subscription');
        if (savedSubscription) {
            this.userSubscription = JSON.parse(savedSubscription);
            this.updateSubscriptionUI();
        }
    }

    setupEventListeners() {
        // Billing toggle
        const billingToggle = document.getElementById('billingToggle');
        if (billingToggle) {
            billingToggle.addEventListener('change', (e) => {
                this.updatePricing(e.target.checked);
            });
        }

        // Upgrade buttons
        document.querySelectorAll('[onclick*="openCheckout"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.closest('button').dataset.plan || 
                            e.target.closest('button').getAttribute('onclick').match(/'([^']+)'/)[1];
                this.openCheckout(plan);
            });
        });

        // Payment form submission
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }

        // PayPal button
        const paypalButton = document.querySelector('[onclick*="payWithPayPal"]');
        if (paypalButton) {
            paypalButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.payWithPayPal();
            });
        }
    }

    setupBillingToggle() {
        const toggle = document.getElementById('billingToggle');
        if (!toggle) return;

        toggle.addEventListener('change', () => {
            const isYearly = toggle.checked;
            const monthlyPrices = document.querySelectorAll('.amount.monthly');
            const yearlyPrices = document.querySelectorAll('.amount.yearly');
            const periodTexts = document.querySelectorAll('.period');

            if (isYearly) {
                monthlyPrices.forEach(price => price.style.display = 'none');
                yearlyPrices.forEach(price => price.style.display = 'inline');
                periodTexts.forEach(text => text.textContent = '/year');
            } else {
                monthlyPrices.forEach(price => price.style.display = 'inline');
                yearlyPrices.forEach(price => price.style.display = 'none');
                periodTexts.forEach(text => text.textContent = '/month');
            }
        });
    }

    updatePricing(isYearly) {
        const plans = document.querySelectorAll('.plan-card');
        plans.forEach(plan => {
            const monthlyPrice = plan.querySelector('.amount.monthly');
            const yearlyPrice = plan.querySelector('.amount.yearly');
            const period = plan.querySelector('.period');
            
            if (isYearly) {
                monthlyPrice.style.display = 'none';
                yearlyPrice.style.display = 'inline';
                period.textContent = '/year';
                
                // Calculate and show savings
                const monthlyValue = parseFloat(monthlyPrice.textContent);
                const yearlyValue = parseFloat(yearlyPrice.textContent);
                const savings = ((monthlyValue * 12) - yearlyValue).toFixed(2);
                
                let savingsBadge = plan.querySelector('.savings-badge');
                if (!savingsBadge) {
                    savingsBadge = document.createElement('div');
                    savingsBadge.className = 'savings-badge';
                    plan.querySelector('.plan-header').appendChild(savingsBadge);
                }
                savingsBadge.textContent = `Save RM${savings}`;
                
            } else {
                monthlyPrice.style.display = 'inline';
                yearlyPrice.style.display = 'none';
                period.textContent = '/month';
                
                // Remove savings badge
                const savingsBadge = plan.querySelector('.savings-badge');
                if (savingsBadge) {
                    savingsBadge.remove();
                }
            }
        });
    }

    openCheckout(plan) {
        this.currentPlan = plan;
        const checkoutModal = document.getElementById('checkoutModal');
        
        if (!checkoutModal) {
            this.createCheckoutModal(plan);
            return;
        }

        // Update modal content based on plan
        this.updateCheckoutModal(plan);
        checkoutModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    createCheckoutModal(plan) {
        const modal = document.createElement('div');
        modal.id = 'checkoutModal';
        modal.className = 'checkout-modal';
        modal.innerHTML = this.getCheckoutModalHTML(plan);
        
        document.body.appendChild(modal);
        
        // Add event listeners for the new modal
        this.setupCheckoutModalEvents();
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 10);
    }

    getCheckoutModalHTML(plan) {
        const planDetails = this.getPlanDetails(plan);
        const isYearly = document.getElementById('billingToggle')?.checked || false;
        const price = isYearly ? planDetails.yearlyPrice : planDetails.monthlyPrice;
        const period = isYearly ? 'year' : 'month';
        
        return `
            <div class="checkout-content">
                <div class="checkout-header">
                    <h3><i class="fas fa-lock"></i> Secure Checkout</h3>
                    <button class="close-checkout">&times;</button>
                </div>
                
                <div class="checkout-body">
                    <div class="order-summary">
                        <h4>Order Summary</h4>
                        <div class="summary-item">
                            <span>${planDetails.name} Plan</span>
                            <span id="planPrice">RM ${price}</span>
                        </div>
                        <div class="summary-item">
                            <span>Billing Cycle</span>
                            <span id="billingCycle">${isYearly ? 'Yearly' : 'Monthly'}</span>
                        </div>
                        ${isYearly ? `
                        <div class="summary-item">
                            <span>Yearly Savings</span>
                            <span class="savings">RM ${((planDetails.monthlyPrice * 12) - planDetails.yearlyPrice).toFixed(2)}</span>
                        </div>
                        ` : ''}
                        <div class="summary-total">
                            <span>Total Due Today</span>
                            <span id="totalAmount">RM ${price}</span>
                        </div>
                    </div>
                    
                    <div class="payment-form">
                        <h4>Payment Details</h4>
                        <form id="paymentForm">
                            <div class="form-group">
                                <label>Card Number</label>
                                <div class="card-input">
                                    <i class="fas fa-credit-card"></i>
                                    <div id="card-element"></div>
                                </div>
                                <div id="card-errors" class="error-message"></div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Expiry Date</label>
                                    <input type="text" id="expiryDate" placeholder="MM/YY" maxlength="5" required>
                                </div>
                                <div class="form-group">
                                    <label>CVC</label>
                                    <input type="text" id="cvc" placeholder="123" maxlength="4" required>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Name on Card</label>
                                <input type="text" id="cardName" placeholder="John Driver" required>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="saveCard" checked>
                                    <span>Save card for future payments</span>
                                </label>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="agreeTerms" required>
                                    <span>I agree to the <a href="terms.html" target="_blank">Terms of Service</a></span>
                                </label>
                            </div>
                            
                            <button type="submit" class="btn-primary btn-full" id="submitPayment">
                                <i class="fas fa-lock"></i> Pay RM ${price}
                            </button>
                            
                            <div class="alternative-payments">
                                <p class="divider">or pay with</p>
                                <button type="button" class="paypal-btn" onclick="paymentSystem.payWithPayPal('${plan}')">
                                    <i class="fab fa-paypal"></i> PayPal
                                </button>
                                <button type="button" class="bank-btn" onclick="paymentSystem.showBankDetails()">
                                    <i class="fas fa-university"></i> Bank Transfer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <div class="checkout-footer">
                    <p><i class="fas fa-shield-alt"></i> Your payment is secured with 256-bit SSL encryption</p>
                    <p class="guarantee"><i class="fas fa-check-circle"></i> 30-day money-back guarantee</p>
                </div>
            </div>
        `;
    }

    updateCheckoutModal(plan) {
        const planDetails = this.getPlanDetails(plan);
        const isYearly = document.getElementById('billingToggle')?.checked || false;
        const price = isYearly ? planDetails.yearlyPrice : planDetails.monthlyPrice;
        
        document.getElementById('planPrice').textContent = `RM ${price}`;
        document.getElementById('billingCycle').textContent = isYearly ? 'Yearly' : 'Monthly';
        document.getElementById('totalAmount').textContent = `RM ${price}`;
        
        // Update payment button
        const submitBtn = document.getElementById('submitPayment');
        if (submitBtn) {
            submitBtn.innerHTML = `<i class="fas fa-lock"></i> Pay RM ${price}`;
        }
        
        // Update PayPal button
        const paypalBtn = document.querySelector('.paypal-btn');
        if (paypalBtn) {
            paypalBtn.setAttribute('onclick', `paymentSystem.payWithPayPal('${plan}')`);
        }
    }

    setupCheckoutModalEvents() {
        const modal = document.getElementById('checkoutModal');
        if (!modal) return;

        // Close modal
        const closeBtn = modal.querySelector('.close-checkout');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.closeCheckout();
            });
        }

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCheckout();
            }
        });

        // Form submission
        const form = modal.querySelector('#paymentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }

        // Initialize Stripe Elements if needed
        if (this.stripe && !window.stripeCard) {
            this.initializeStripe();
        }
    }

    getPlanDetails(plan) {
        const plans = {
            pro: {
                name: 'Pro',
                monthlyPrice: 9.99,
                yearlyPrice: 95.88, // 9.99 * 12 * 0.8 (20% discount)
                features: [
                    'Advanced weather reports',
                    'Interactive hazard maps',
                    'SMS & email alerts',
                    'Route planning & optimization',
                    'PDF report exports',
                    '3 devices simultaneously',
                    'Priority email support',
                    'Historical weather data'
                ]
            },
            enterprise: {
                name: 'Enterprise',
                monthlyPrice: 29.99,
                yearlyPrice: 287.90, // 29.99 * 12 * 0.8
                features: [
                    'All Pro features',
                    'Unlimited driver accounts',
                    'School-wide dashboard',
                    'Custom API integration',
                    'White-label branding',
                    'Dedicated account manager',
                    '24/7 phone support',
                    'Custom alert thresholds'
                ]
            }
        };
        
        return plans[plan] || plans.pro;
    }

    async processPayment() {
        const form = document.getElementById('paymentForm');
        const submitBtn = form.querySelector('#submitPayment');
        const originalText = submitBtn.innerHTML;
        
        // Validate form
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        // Show loading state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;

        try {
            // Create payment method with Stripe
            const { paymentMethod, error } = await this.stripe.createPaymentMethod({
                type: 'card',
                card: window.stripeCard,
                billing_details: {
                    name: document.getElementById('cardName').value
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            // Simulate API call to backend
            const paymentResult = await this.processPaymentOnServer(paymentMethod);
            
            if (paymentResult.success) {
                // Update user subscription
                await this.updateSubscription(this.currentPlan);
                
                // Show success
                this.showPaymentSuccess(paymentResult);
                
                // Close modal after delay
                setTimeout(() => {
                    this.closeCheckout();
                    this.redirectToDashboard();
                }, 3000);
                
            } else {
                throw new Error(paymentResult.message || 'Payment failed');
            }
            
        } catch (error) {
            this.showPaymentError(error.message);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async processPaymentOnServer(paymentMethod) {
        // In production, this would call your backend
        // For demo, simulate API call
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Payment successful',
                    transactionId: 'txn_' + Date.now(),
                    amount: this.getPlanDetails(this.currentPlan).monthlyPrice,
                    plan: this.currentPlan,
                    timestamp: new Date().toISOString()
                });
            }, 2000);
        });
    }

    async updateSubscription(plan) {
        const planDetails = this.getPlanDetails(plan);
        const isYearly = document.getElementById('billingToggle')?.checked || false;
        
        this.userSubscription = {
            plan: plan,
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: this.calculateEndDate(isYearly),
            billingCycle: isYearly ? 'yearly' : 'monthly',
            price: isYearly ? planDetails.yearlyPrice : planDetails.monthlyPrice,
            features: planDetails.features
        };
        
        // Save to localStorage
        localStorage.setItem('safeweather_subscription', JSON.stringify(this.userSubscription));
        
        // Update UI
        this.updateSubscriptionUI();
        
        // Show notification
        this.showNotification(`Successfully upgraded to ${planDetails.name} plan!`, 'success');
    }

    calculateEndDate(isYearly) {
        const endDate = new Date();
        if (isYearly) {
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate.setMonth(endDate.getMonth() + 1);
        }
        return endDate.toISOString();
    }

    updateSubscriptionUI() {
        if (!this.userSubscription) return;

        // Update navbar
        const premiumLinks = document.querySelectorAll('.premium-link');
        premiumLinks.forEach(link => {
            link.innerHTML = `<i class="fas fa-crown"></i> ${this.userSubscription.plan.toUpperCase()}`;
        });

        // Update dashboard
        const planBadges = document.querySelectorAll('.user-plan');
        planBadges.forEach(badge => {
            badge.textContent = this.userSubscription.plan.charAt(0).toUpperCase() + this.userSubscription.plan.slice(1);
            badge.className = `user-plan ${this.userSubscription.plan}`;
        });

        // Update feature availability
        this.updateFeatureAvailability();
    }

    updateFeatureAvailability() {
        const premiumFeatures = document.querySelectorAll('.premium-feature');
        premiumFeatures.forEach(feature => {
            if (this.userSubscription && this.userSubscription.status === 'active') {
                feature.classList.remove('locked');
                feature.classList.add('unlocked');
                
                const lockIcon = feature.querySelector('.fa-lock');
                if (lockIcon) {
                    lockIcon.className = 'fas fa-unlock';
                }
            }
        });
    }

    async payWithPayPal(plan = null) {
        if (plan) {
            this.currentPlan = plan;
        }

        if (!this.currentPlan) {
            this.showNotification('Please select a plan first', 'error');
            return;
        }

        // Show loading
        this.showNotification('Redirecting to PayPal...', 'info');

        // In production, this would redirect to PayPal
        // For demo, simulate PayPal payment
        setTimeout(async () => {
            const paymentResult = await this.simulatePayPalPayment();
            
            if (paymentResult.success) {
                await this.updateSubscription(this.currentPlan);
                this.showPaymentSuccess(paymentResult);
                
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 2000);
            } else {
                this.showPaymentError(paymentResult.message);
            }
        }, 1500);
    }

    async simulatePayPalPayment() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'PayPal payment successful',
                    transactionId: 'paypal_' + Date.now(),
                    amount: this.getPlanDetails(this.currentPlan).monthlyPrice,
                    plan: this.currentPlan,
                    payerEmail: 'user@example.com',
                    timestamp: new Date().toISOString()
                });
            }, 2000);
        });
    }

    showBankDetails() {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-university"></i> Bank Transfer Details</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="bank-details">
                        <div class="detail-item">
                            <label>Bank Name:</label>
                            <span>Maybank Malaysia</span>
                        </div>
                        <div class="detail-item">
                            <label>Account Name:</label>
                            <span>SafeWeather Solutions Sdn Bhd</span>
                        </div>
                        <div class="detail-item">
                            <label>Account Number:</label>
                            <span>5648 1234 5678</span>
                        </div>
                        <div class="detail-item">
                            <label>SWIFT Code:</label>
                            <span>MBBEMYKL</span>
                        </div>
                        <div class="detail-item">
                            <label>Reference:</label>
                            <span>SW-${Date.now().toString().slice(-6)}</span>
                        </div>
                        <div class="qr-code">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SafeWeather+Payment+Ref%3A+SW-${Date.now().toString().slice(-6)}" alt="Payment QR Code">
                            <p>Scan to get bank details</p>
                        </div>
                        <div class="instructions">
                            <h4>Instructions:</h4>
                            <ol>
                                <li>Make transfer to the account above</li>
                                <li>Use the reference number in payment description</li>
                                <li>Email receipt to payments@safeweather.my</li>
                                <li>Allow 24-48 hours for manual verification</li>
                            </ol>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn-primary" onclick="navigator.clipboard.writeText('5648 1234 5678')">
                        <i class="fas fa-copy"></i> Copy Account Number
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showPaymentSuccess(paymentResult) {
        const successHTML = `
            <div class="payment-success">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h3>Payment Successful!</h3>
                <p>Thank you for upgrading to ${this.currentPlan.toUpperCase()} plan</p>
                <div class="payment-details">
                    <div class="detail">
                        <span>Transaction ID:</span>
                        <span>${paymentResult.transactionId}</span>
                    </div>
                    <div class="detail">
                        <span>Amount Paid:</span>
                        <span>RM ${paymentResult.amount}</span>
                    </div>
                    <div class="detail">
                        <span>Plan:</span>
                        <span>${this.currentPlan.charAt(0).toUpperCase() + this.currentPlan.slice(1)}</span>
                    </div>
                </div>
                <p class="redirect-message">Redirecting to dashboard...</p>
            </div>
        `;

        // Replace checkout content with success message
        const checkoutContent = document.querySelector('.checkout-content');
        if (checkoutContent) {
            checkoutContent.innerHTML = successHTML;
        } else {
            this.showNotification('Payment successful!', 'success');
        }
    }

    showPaymentError(errorMessage) {
        const errorHTML = `
            <div class="payment-error">
                <div class="error-icon">
                    <i class="fas fa-exclamation-circle"></i>
                </div>
                <h3>Payment Failed</h3>
                <p>${errorMessage}</p>
                <button class="btn-primary" onclick="paymentSystem.retryPayment()">
                    <i class="fas fa-redo"></i> Try Again
                </button>
                <button class="btn-secondary" onclick="paymentSystem.closeCheckout()">
                    Cancel
                </button>
            </div>
        `;

        // Replace checkout content with error message
        const checkoutContent = document.querySelector('.checkout-content');
        if (checkoutContent) {
            checkoutContent.innerHTML = errorHTML;
        } else {
            this.showNotification(`Payment failed: ${errorMessage}`, 'error');
        }
    }

    retryPayment() {
        this.closeCheckout();
        setTimeout(() => {
            this.openCheckout(this.currentPlan);
        }, 500);
    }

    closeCheckout() {
        const modal = document.getElementById('checkoutModal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
            
            // Remove modal after animation
            setTimeout(() => {
                if (!modal.classList.contains('active')) {
                    modal.remove();
                }
            }, 300);
        }
    }

    redirectToDashboard() {
        window.location.href = 'dashboard.html';
    }

    showNotification(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // Subscription management methods
    cancelSubscription() {
        if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
            this.userSubscription.status = 'cancelled';
            localStorage.setItem('safeweather_subscription', JSON.stringify(this.userSubscription));
            this.updateSubscriptionUI();
            this.showNotification('Subscription cancelled. You will retain access until the end of your billing period.', 'info');
        }
    }

    updatePaymentMethod() {
        this.showNotification('Payment method update feature coming soon!', 'info');
    }

    downloadInvoice(invoiceId) {
        // Generate and download invoice
        const invoiceContent = this.generateInvoice(invoiceId);
        const blob = new Blob([invoiceContent], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    generateInvoice(invoiceId) {
        // Generate invoice HTML/PDF content
        return `
            Invoice #: ${invoiceId}
            Date: ${new Date().toLocaleDateString()}
            Plan: ${this.userSubscription?.plan || 'Pro'}
            Amount: RM ${this.userSubscription?.price || '9.99'}
            Status: Paid
        `;
    }

    // Admin payment functions
    async processRefund(transactionId) {
        // In production, call backend API
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    message: 'Refund processed successfully',
                    refundId: 'ref_' + Date.now()
                });
            }, 1500);
        });
    }

    async generateRevenueReport(startDate, endDate) {
        // In production, call backend API
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    success: true,
                    data: {
                        totalRevenue: 8450,
                        activeSubscriptions: 156,
                        newSubscriptions: 23,
                        cancelledSubscriptions: 8,
                        revenueByPlan: {
                            pro: 6250,
                            enterprise: 2200
                        }
                    }
                });
            }, 2000);
        });
    }
}

// Global payment functions
function openCheckout(plan) {
    if (!paymentSystem) {
        paymentSystem = new PaymentSystem();
    }
    paymentSystem.openCheckout(plan);
}

function payWithPayPal() {
    if (!paymentSystem) {
        paymentSystem = new PaymentSystem();
    }
    paymentSystem.payWithPayPal();
}

function showBankDetails() {
    if (!paymentSystem) {
        paymentSystem = new PaymentSystem();
    }
    paymentSystem.showBankDetails();
}

function processPayment() {
    if (!paymentSystem) {
        paymentSystem = new PaymentSystem();
    }
    paymentSystem.processPayment();
}

// Initialize payment system
let paymentSystem;
document.addEventListener('DOMContentLoaded', () => {
    paymentSystem = new PaymentSystem();
    window.paymentSystem = paymentSystem;
});
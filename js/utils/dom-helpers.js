/**
 * DOM Helper Utilities
 * Common DOM manipulation and element selection utilities
 */

const DOMHelpers = {
    
    /**
     * Get element by ID with error handling
     */
    getElementById(id, required = true) {
        const element = document.getElementById(id);
        if (!element && required) {
            if (window.Logger) {
                Logger.warn('DOMHelpers', `Element with ID '${id}' not found`);
            } else {
                console.warn(`Element with ID '${id}' not found`);
            }
        }
        return element;
    },
    
    /**
     * Get multiple elements by IDs and return as object
     */
    getElementsByIds(ids) {
        const elements = {};
        ids.forEach(id => {
            elements[id] = this.getElementById(id);
        });
        return elements;
    },
    
    /**
     * Initialize DOM elements and cache them in AppState
     */
    initializeDOMElements() {
        console.log('🔍 Initializing DOM elements...');
        
        // Auth containers
        AppState.elements.authContainer = this.getElementById('auth-container');
        AppState.elements.appContainer = this.getElementById('app-container');
        
        // Authentication steps
        AppState.elements.emailStep = this.getElementById('email-step');
        AppState.elements.passwordStep = this.getElementById('password-step');
        AppState.elements.registerStep = this.getElementById('register-step');
        AppState.elements.passwordResetStep = this.getElementById('password-reset-step');
        AppState.elements.emailVerificationStep = this.getElementById('email-verification-step');
        
        // Forms and inputs
        AppState.elements.emailForm = this.getElementById('email-form');
        AppState.elements.emailInput = this.getElementById('email-input');
        AppState.elements.emailContinueBtn = this.getElementById('email-continue-btn');
        
        AppState.elements.passwordForm = this.getElementById('password-form');
        AppState.elements.passwordInput = this.getElementById('password-input');
        AppState.elements.passwordLoginBtn = this.getElementById('password-login-btn');
        AppState.elements.passwordEmailDisplay = this.getElementById('password-email-display');
        
        AppState.elements.registerForm = this.getElementById('register-form');
        AppState.elements.firstNameInput = this.getElementById('first-name-input');
        AppState.elements.lastNameInput = this.getElementById('last-name-input');
        AppState.elements.registerEmailInput = this.getElementById('register-email-input');
        AppState.elements.phoneInput = this.getElementById('phone-input');
        AppState.elements.registerPasswordInput = this.getElementById('register-password-input');
        AppState.elements.confirmPasswordInput = this.getElementById('confirm-password-input');
        
        AppState.elements.passwordResetForm = this.getElementById('password-reset-form');
        AppState.elements.resetEmailInput = this.getElementById('reset-email-input');
        
        // Navigation buttons
        AppState.elements.showRegisterBtn = this.getElementById('show-register-btn');
        AppState.elements.backToEmailBtn = this.getElementById('back-to-email-btn');
        AppState.elements.forgotPasswordBtn = this.getElementById('forgot-password-btn');
        AppState.elements.backToPasswordBtn = this.getElementById('back-to-password-btn');
        AppState.elements.backToLoginBtn = this.getElementById('back-to-login-btn');
        
        // Verification buttons (optional)
        AppState.elements.resendVerificationBtn = this.getElementById('resend-verification-btn', false);
        AppState.elements.refreshVerificationBtn = this.getElementById('refresh-verification-btn', false);
        AppState.elements.logoutFromVerificationBtn = this.getElementById('logout-from-verification-btn', false);
        
        // App elements
        AppState.elements.logoutBtn = this.getElementById('logout-btn');
        AppState.elements.authStatus = this.getElementById('auth-status');
        AppState.elements.userEmailDisplay = this.getElementById('user-email-display');

        // Logout modal elements
        AppState.elements.logoutModal = this.getElementById('logout-modal', false);
        AppState.elements.logoutSuccessPage = this.getElementById('logout-success-page', false);
        AppState.elements.closeLogoutModal = this.getElementById('close-logout-modal', false);
        AppState.elements.cancelLogoutBtn = this.getElementById('cancel-logout', false);
        AppState.elements.confirmLogoutBtn = this.getElementById('confirm-logout', false);
        AppState.elements.returnToLoginBtn = this.getElementById('return-to-login', false);
        AppState.elements.redirectCountdown = this.getElementById('redirect-countdown', false);

        // Map and location elements
        AppState.elements.addressSearch = this.getElementById('address-search');
        AppState.elements.searchBtn = this.getElementById('search-btn');
        AppState.elements.addLocationBtn = this.getElementById('add-location-btn');
        AppState.elements.locationModal = this.getElementById('location-modal');
        AppState.elements.locationForm = this.getElementById('location-form');
        AppState.elements.closeModal = this.getElementById('close-modal');
        AppState.elements.cancelLocation = this.getElementById('cancel-location');
        
        // Log results
        this.logDOMElementsStatus();
        
        console.log('✅ DOM elements initialized and cached');
        return AppState.elements;
    },
    
    /**
     * Log the status of critical DOM elements
     */
    logDOMElementsStatus() {
        console.log('🔍 DOM Elements Status:');
        console.log('- emailForm:', AppState.elements.emailForm ? '✅' : '❌');
        console.log('- emailInput:', AppState.elements.emailInput ? '✅' : '❌');
        console.log('- emailContinueBtn:', AppState.elements.emailContinueBtn ? '✅' : '❌');
        console.log('- addressSearch:', AppState.elements.addressSearch ? '✅' : '❌');
        console.log('- searchBtn:', AppState.elements.searchBtn ? '✅' : '❌');
        console.log('- addLocationBtn:', AppState.elements.addLocationBtn ? '✅' : '❌');
        console.log('- locationModal:', AppState.elements.locationModal ? '✅' : '❌');
    },
    
    /**
     * Show/hide elements with optional display style
     */
    show(element, displayStyle = 'block') {
        if (element) {
            element.style.display = displayStyle;
        }
    },
    
    hide(element) {
        if (element) {
            element.style.display = 'none';
        }
    },
    
    /**
     * Add event listener with error handling
     */
    addEventListener(element, event, handler, options = {}) {
        if (element) {
            element.addEventListener(event, handler, options);
            return true;
        } else {
            console.warn(`Cannot add ${event} listener: element is null`);
            return false;
        }
    },
    
    /**
     * Set text content safely
     */
    setText(element, text) {
        if (element) {
            element.textContent = text;
            return true;
        }
        return false;
    },
    
    /**
     * Set input value safely
     */
    setValue(element, value) {
        if (element) {
            element.value = value;
            return true;
        }
        return false;
    },
    
    /**
     * Focus element safely
     */
    focus(element) {
        if (element && typeof element.focus === 'function') {
            element.focus();
            return true;
        }
        return false;
    },
    
    /**
     * Reset form safely
     */
    resetForm(form) {
        if (form && typeof form.reset === 'function') {
            form.reset();
            return true;
        }
        return false;
    }
};

// Export to global scope
window.DOMHelpers = DOMHelpers;

console.log('✅ DOM helpers module loaded');

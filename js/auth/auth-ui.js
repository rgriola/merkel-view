/**
 * Authentication UI Manager
 * Handles all authentication-related UI interactions and state management
 */

class AuthUI {
    constructor() {
        this.authManager = null;
        this.domHelpers = null;
        this.validation = null;
        
        // UI element references
        this.authContainer = null;
        this.appContainer = null;
        
        // Auth steps
        this.emailStep = null;
        this.passwordStep = null;
        this.registerStep = null;
        this.passwordResetStep = null;
        this.emailVerificationStep = null;
        
        // Form elements
        this.emailForm = null;
        this.emailInput = null;
        this.passwordForm = null;
        this.passwordInput = null;
        this.passwordEmailDisplay = null;
        this.registerForm = null;
        this.firstNameInput = null;
        this.lastNameInput = null;
        this.registerEmailInput = null;
        this.phoneInput = null;
        this.registerPasswordInput = null;
        this.confirmPasswordInput = null;
        this.passwordResetForm = null;
        this.resetEmailInput = null;
        
        // Navigation buttons
        this.showRegisterBtn = null;
        this.backToEmailBtn = null;
        this.forgotPasswordBtn = null;
        this.backToPasswordBtn = null;
        this.backToLoginBtn = null;
        this.resendVerificationBtn = null;
        this.refreshVerificationBtn = null;
        this.logoutFromVerificationBtn = null;
        this.logoutBtn = null;
        
        // Status elements
        this.authStatus = null;
        this.userEmailDisplay = null;
        
        this.isInitialized = false;
    }

    /**
     * Initialize the auth UI with dependencies
     */
    initialize(authManager, domHelpers, validation) {
        this.authManager = authManager;
        this.domHelpers = domHelpers;
        this.validation = validation;
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupAuthStateListener();
        
        this.isInitialized = true;
        // AuthUI initialized successfully
        return this;
    }

    /**
     * Initialize DOM element references
     */
    initializeElements() {
        // Main containers
        this.authContainer = document.getElementById('auth-container');
        this.appContainer = document.getElementById('app-container');
        
        // Authentication steps
        this.emailStep = document.getElementById('email-step');
        this.passwordStep = document.getElementById('password-step');
        this.registerStep = document.getElementById('register-step');
        this.passwordResetStep = document.getElementById('password-reset-step');
        this.emailVerificationStep = document.getElementById('email-verification-step');
        
        // Email step
        this.emailForm = document.getElementById('email-form');
        this.emailInput = document.getElementById('email-input');
        
        // Password step
        this.passwordForm = document.getElementById('password-form');
        this.passwordInput = document.getElementById('password-input');
        this.passwordEmailDisplay = document.getElementById('password-email-display');
        
        // Registration step
        this.registerForm = document.getElementById('register-form');
        this.firstNameInput = document.getElementById('first-name-input');
        this.lastNameInput = document.getElementById('last-name-input');
        this.registerEmailInput = document.getElementById('register-email-input');
        this.phoneInput = document.getElementById('phone-input');
        this.registerPasswordInput = document.getElementById('register-password-input');
        this.confirmPasswordInput = document.getElementById('confirm-password-input');
        
        // Password reset step
        this.passwordResetForm = document.getElementById('password-reset-form');
        this.resetEmailInput = document.getElementById('reset-email-input');
        
        // Navigation buttons
        this.showRegisterBtn = document.getElementById('show-register-btn');
        this.backToEmailBtn = document.getElementById('back-to-email-btn');
        this.forgotPasswordBtn = document.getElementById('forgot-password-btn');
        this.backToPasswordBtn = document.getElementById('back-to-password-btn');
        this.backToLoginBtn = document.getElementById('back-to-login-btn');
        this.resendVerificationBtn = document.getElementById('resend-verification-btn');
        this.refreshVerificationBtn = document.getElementById('refresh-verification-btn');
        this.logoutFromVerificationBtn = document.getElementById('logout-from-verification-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        
        // Status elements
        this.authStatus = document.getElementById('auth-status');
        this.userEmailDisplay = document.getElementById('user-email-display');
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Form submissions
        if (this.emailForm) {
            this.emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailSubmit();
            });
        }

        if (this.passwordForm) {
            this.passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordSubmit();
            });
        }

        if (this.registerForm) {
            this.registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegistrationSubmit();
            });
        }

        if (this.passwordResetForm) {
            this.passwordResetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset();
            });
        }

        // Navigation buttons
        if (this.showRegisterBtn) {
            this.showRegisterBtn.addEventListener('click', () => this.showRegistrationStep());
        }

        if (this.backToEmailBtn) {
            this.backToEmailBtn.addEventListener('click', () => {
                this.authManager.setAuthFlowState(false);
                this.showEmailStep();
            });
        }

        if (this.forgotPasswordBtn) {
            this.forgotPasswordBtn.addEventListener('click', () => this.showPasswordResetStep());
        }

        if (this.backToPasswordBtn) {
            this.backToPasswordBtn.addEventListener('click', () => this.showPasswordStep());
        }

        if (this.backToLoginBtn) {
            this.backToLoginBtn.addEventListener('click', () => {
                this.authManager.setAuthFlowState(false);
                this.showEmailStep();
            });
        }

        // Verification buttons
        if (this.resendVerificationBtn) {
            this.resendVerificationBtn.addEventListener('click', () => this.resendVerificationEmail());
        }

        if (this.refreshVerificationBtn) {
            this.refreshVerificationBtn.addEventListener('click', () => this.checkEmailVerification());
        }

        if (this.logoutFromVerificationBtn) {
            this.logoutFromVerificationBtn.addEventListener('click', () => this.signOut());
        }

        // Main app logout button
        if (this.logoutBtn) {
            this.logoutBtn.addEventListener('click', () => this.signOut());
        }
    }

    /**
     * Set up auth state change listener
     */
    setupAuthStateListener() {
        this.authManager.onAuthStateChange((authState) => {
            this.handleAuthStateChange(authState);
        });
    }

    /**
     * Handle authentication state changes
     */
    handleAuthStateChange(authState) {
        switch (authState.type) {
            case 'authenticated':
                this.showApp();
                if (this.userEmailDisplay) {
                    this.userEmailDisplay.textContent = authState.user.email;
                }
                break;
            case 'emailVerificationRequired':
                this.showEmailVerificationStep(authState.email);
                break;
            case 'unauthenticated':
                this.showEmailStep();
                break;
        }
    }

    /**
     * Show email step
     */
    showEmailStep() {
        this.hideAllAuthSteps();
        this.domHelpers.show(this.emailStep);
        if (this.emailInput) {
            this.emailInput.focus();
        }
        this.authManager.setCurrentUserEmail('');
        this.authManager.setAuthFlowState(false);
    }

    /**
     * Show password step
     */
    showPasswordStep() {
        console.log('🔑 showPasswordStep called');
        
        this.hideAllAuthSteps();
        this.domHelpers.show(this.passwordStep);
        
        if (this.passwordEmailDisplay) {
            this.passwordEmailDisplay.textContent = this.authManager.getCurrentUserEmail();
        }
        
        // Set hidden email field for accessibility
        const hiddenEmailField = document.getElementById('password-email-hidden');
        if (hiddenEmailField) {
            hiddenEmailField.value = this.authManager.getCurrentUserEmail();
        }
        
        if (this.passwordInput) {
            this.passwordInput.focus();
            this.passwordInput.value = '';
        }
    }

    /**
     * Show registration step
     */
    showRegistrationStep() {
        this.hideAllAuthSteps();
        this.domHelpers.show(this.registerStep);
        
        if (this.registerEmailInput) {
            this.registerEmailInput.value = this.authManager.getCurrentUserEmail();
        }
        if (this.firstNameInput) {
            this.firstNameInput.focus();
        }
    }

    /**
     * Show password reset step
     */
    showPasswordResetStep() {
        this.hideAllAuthSteps();
        this.domHelpers.show(this.passwordResetStep);
        
        if (this.resetEmailInput) {
            this.resetEmailInput.value = this.authManager.getCurrentUserEmail();
            this.resetEmailInput.focus();
        }
    }

    /**
     * Show email verification step
     */
    showEmailVerificationStep(email) {
        this.hideAllAuthSteps();
        this.domHelpers.show(this.emailVerificationStep);
        
        const verificationEmailSpan = document.getElementById('verification-email-display');
        if (verificationEmailSpan) {
            verificationEmailSpan.textContent = email;
        }
    }

    /**
     * Hide all authentication steps
     */
    hideAllAuthSteps() {
        const steps = [
            this.emailStep,
            this.passwordStep,
            this.registerStep,
            this.passwordResetStep,
            this.emailVerificationStep
        ];
        
        steps.forEach(step => {
            this.domHelpers.hide(step);
        });
    }

    /**
     * Show authentication container
     */
    showAuth() {
        this.domHelpers.show(this.authContainer, 'flex');
        this.domHelpers.hide(this.appContainer);
        this.showEmailStep();
    }

    /**
     * Show main app container
     */
    showApp() {
        this.domHelpers.hide(this.authContainer);
        this.domHelpers.show(this.appContainer, 'block');
        
        // Notify app that user is authenticated
        if (window.AppCore && window.AppCore.handleUserAuthenticated) {
            window.AppCore.handleUserAuthenticated();
        }
    }

    /**
     * Handle email form submission
     */
    async handleEmailSubmit() {
        console.log('🔍 handleEmailSubmit called');
        
        const email = this.emailInput ? this.emailInput.value.trim() : '';
        
        if (!email) {
            this.showAuthStatus('Please enter your email address', 'error');
            return;
        }
        
        if (!this.validation.isValidEmail(email)) {
            this.showAuthStatus('Please enter a valid email address', 'error');
            return;
        }
        
        console.log('✅ Email validation passed, proceeding to password step');
        this.authManager.setCurrentUserEmail(email);
        this.authManager.setAuthFlowState(true);
        this.showPasswordStep();
    }

    /**
     * Handle password form submission
     */
    async handlePasswordSubmit() {
        const password = this.passwordInput ? this.passwordInput.value.trim() : '';
        
        if (!password) {
            this.showAuthStatus('Please enter your password', 'error');
            return;
        }
        
        const email = this.authManager.getCurrentUserEmail();
        if (!email) {
            this.showAuthStatus('Email not found. Please start over.', 'error');
            this.showEmailStep();
            return;
        }
        
        this.showAuthStatus('Signing in...', 'info');
        
        const result = await this.authManager.signIn(email, password);
        
        if (result.success) {
            this.showAuthStatus(result.message, 'success');
        } else {
            const messageType = result.error.code === 'demo/disabled' ? 'info' : 'error';
            this.showAuthStatus(result.message, messageType);
        }
    }

    /**
     * Handle registration form submission
     */
    async handleRegistrationSubmit() {
        const userData = {
            firstName: this.firstNameInput ? this.firstNameInput.value.trim() : '',
            lastName: this.lastNameInput ? this.lastNameInput.value.trim() : '',
            email: this.registerEmailInput ? this.registerEmailInput.value.trim() : '',
            phone: this.phoneInput ? this.phoneInput.value.trim() : '',
            password: this.registerPasswordInput ? this.registerPasswordInput.value.trim() : '',
            confirmPassword: this.confirmPasswordInput ? this.confirmPasswordInput.value.trim() : ''
        };
        
        // Validation
        const validationResult = this.validation.validateRegistrationForm(userData);
        if (!validationResult.isValid) {
            this.showAuthStatus(validationResult.message, 'error');
            return;
        }
        
        this.showAuthStatus('Creating account...', 'info');
        
        const result = await this.authManager.signUp(userData);
        
        if (result.success) {
            this.showAuthStatus(result.message, 'success');
            this.showEmailVerificationStep(userData.email);
        } else {
            this.showAuthStatus('Registration failed: ' + result.message, 'error');
        }
    }

    /**
     * Handle password reset
     */
    async handlePasswordReset() {
        const email = this.resetEmailInput ? this.resetEmailInput.value.trim() : '';
        
        if (!email) {
            this.showAuthStatus('Please enter your email address', 'error');
            return;
        }
        
        if (!this.validation.isValidEmail(email)) {
            this.showAuthStatus('Please enter a valid email address', 'error');
            return;
        }
        
        this.showAuthStatus('Sending password reset email...', 'info');
        
        const result = await this.authManager.resetPassword(email);
        
        if (result.success) {
            this.showAuthStatus(result.message, 'success');
            setTimeout(() => {
                this.showPasswordStep();
            }, 3000);
        } else {
            this.showAuthStatus(result.message, 'error');
        }
    }

    /**
     * Resend verification email
     */
    async resendVerificationEmail() {
        const result = await this.authManager.resendEmailVerification();
        
        if (result.success) {
            this.showAuthStatus(result.message, 'success');
        } else {
            this.showAuthStatus(result.message, 'error');
        }
    }

    /**
     * Check email verification status
     */
    async checkEmailVerification() {
        const result = await this.authManager.checkEmailVerification();
        
        if (result.success) {
            if (result.verified) {
                this.showAuthStatus(result.message, 'success');
                this.showApp();
            } else {
                this.showAuthStatus(result.message, 'error');
            }
        } else {
            this.showAuthStatus(result.message, 'error');
        }
    }

    /**
     * Sign out current user
     */
    async signOut() {
        await this.authManager.signOut();
    }

    /**
     * Show authentication status message
     */
    showAuthStatus(message, type) {
        if (this.authStatus) {
            this.authStatus.textContent = message;
            this.authStatus.className = 'auth-status ' + type;
            this.domHelpers.show(this.authStatus);
            
            // Clear message after 5 seconds
            setTimeout(() => {
                this.domHelpers.hide(this.authStatus);
            }, 5000);
        }
    }
}

// Export as global for now, will be converted to ES modules later
window.AuthUI = AuthUI;

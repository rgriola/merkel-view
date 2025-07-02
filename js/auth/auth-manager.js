/**
 * Authentication Manager
 * Handles Firebase authentication logic and user management
 */

class AuthManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.currentUser = null;
        this.currentUserEmail = '';
        this.isInAuthFlow = false;
        this.authStateCallbacks = [];
    }

    /**
     * Initialize the auth manager with Firebase instances
     */
    initialize(auth, db) {
        this.auth = auth;
        this.db = db;
        this.setupAuthListener();
        return this;
    }

    /**
     * Set up Firebase auth state listener
     */
    setupAuthListener() {
        if (!this.auth) {
            Logger.error('AuthManager', 'Auth not initialized');
            return;
        }

        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            
            if (user) {
                Logger.info('AuthManager', 'User signed in', { email: user.email });
                this.isInAuthFlow = false;
                
                // Check email verification
                if (!user.emailVerified) {
                    this.notifyAuthStateChange({
                        type: 'emailVerificationRequired',
                        user: user,
                        email: user.email
                    });
                    return;
                }

                // User is authenticated and verified
                this.notifyAuthStateChange({
                    type: 'authenticated',
                    user: user
                });
            } else {
                console.log('🔐 User signed out');
                this.currentUser = null;
                
                if (!this.isInAuthFlow) {
                    this.notifyAuthStateChange({
                        type: 'unauthenticated'
                    });
                }
            }
        });
    }

    /**
     * Add callback for auth state changes
     */
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
    }

    /**
     * Notify all listeners of auth state changes
     */
    notifyAuthStateChange(authState) {
        this.authStateCallbacks.forEach(callback => {
            try {
                callback(authState);
            } catch (error) {
                console.error('Auth state callback error:', error);
            }
        });
    }

    /**
     * Sign in with email and password
     */
    async signIn(email, password) {
        return await ErrorHandler.wrapAsync(async () => {
            if (!this.auth) {
                throw new Error('Auth not initialized');
            }

            // Sanitize input
            const sanitizedEmail = Sanitizer.sanitizeEmail(email);
            const sanitizedPassword = password; // Don't sanitize passwords
            
            // Basic validation
            if (!ValidationUtils.isValidEmail(sanitizedEmail)) {
                throw new Error('Please enter a valid email address');
            }
            
            if (!ValidationUtils.isValidPassword(sanitizedPassword)) {
                throw new Error('Password must be at least 6 characters');
            }

            Logger.info('AuthManager', 'Attempting user sign in', { email: sanitizedEmail });

            const userCredential = await ErrorHandler.withRetry(async () => {
                return await this.auth.signInWithEmailAndPassword(sanitizedEmail, sanitizedPassword);
            }, 2, 1000);
            
            Logger.success('AuthManager', 'User signed in', { email: userCredential.user.email });
            
            // Test Firestore connectivity
            await this.testFirestoreConnection(userCredential.user.email);
            
            return {
                success: true,
                user: userCredential.user,
                message: 'Login successful!'
            };
        }, 'User sign in');
    }

    /**
     * Create new user account
     */
    async signUp(userData) {
        return await ErrorHandler.wrapAsync(async () => {
            const { firstName, lastName, email, phone, password } = userData;
            
            if (!this.auth || !this.db) {
                throw new Error('Auth or DB not initialized');
            }

            // Validate user data
            const sanitizedData = Sanitizer.sanitizeUserData(userData);
            const validationResult = ValidationUtils.validateRegistrationForm(sanitizedData);
            
            if (!validationResult.isValid) {
                throw new Error(validationResult.message);
            }

            Logger.info('AuthManager', 'Creating new user account', { email: sanitizedData.email });

            // Create user account
            const userCredential = await ErrorHandler.withRetry(async () => {
                return await this.auth.createUserWithEmailAndPassword(sanitizedData.email, sanitizedData.password);
            }, 2, 1000);
            
            Logger.success('AuthManager', 'User registered', { email: userCredential.user.email });

            // Send email verification
            await userCredential.user.sendEmailVerification();
            Logger.info('AuthManager', 'Email verification sent');

            // Save user profile to Firestore
            await this.db.collection('users').doc(userCredential.user.uid).set({
                email: sanitizedData.email,
                firstName: sanitizedData.firstName,
                lastName: sanitizedData.lastName,
                phone: sanitizedData.phone,
                fullName: `${sanitizedData.firstName} ${sanitizedData.lastName}`,
                role: 'user',
                emailVerified: false,
                dateCreated: window.firebase.firestore.FieldValue.serverTimestamp(),
                dateUpdated: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            Logger.success('AuthManager', 'User profile saved to Firestore');

            return {
                success: true,
                user: userCredential.user,
                message: 'Merkel-Vision Approved. Check your email & verify account.'
            };
        }, 'User registration');
    }

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        return await ErrorHandler.wrapAsync(async () => {
            if (!this.auth) {
                throw new Error('Auth not initialized');
            }

            // Sanitize and validate email
            const sanitizedEmail = Sanitizer.sanitizeEmail(email);
            if (!ValidationUtils.isValidEmail(sanitizedEmail)) {
                throw new Error('Please enter a valid email address');
            }

            Logger.info('AuthManager', 'Sending password reset email', { email: sanitizedEmail });

            await ErrorHandler.withRetry(async () => {
                return await this.auth.sendPasswordResetEmail(sanitizedEmail);
            }, 2, 1000);

            return {
                success: true,
                message: 'Password reset email sent! Check your inbox for further instructions.'
            };
        }, 'Password reset');
    }

    /**
     * Resend email verification
     */
    async resendEmailVerification() {
        if (!this.currentUser) {
            throw new Error('No current user');
        }

        try {
            await this.currentUser.sendEmailVerification();
            return {
                success: true,
                message: 'Verification email sent! Check your inbox.'
            };
        } catch (error) {
            console.error('❌ Resend verification error:', error);
            return {
                success: false,
                error: error,
                message: 'Failed to send verification email. Please try again.'
            };
        }
    }

    /**
     * Check if email is verified
     */
    async checkEmailVerification() {
        if (!this.currentUser || !this.db) {
            throw new Error('No current user or DB not initialized');
        }

        try {
            await this.currentUser.reload();
            
            if (this.currentUser.emailVerified) {
                // Update user profile in Firestore
                await this.db.collection('users').doc(this.currentUser.uid).update({
                    emailVerified: true,
                    dateUpdated: window.firebase.firestore.FieldValue.serverTimestamp()
                });

                return {
                    success: true,
                    verified: true,
                    message: 'Email verified successfully!'
                };
            } else {
                return {
                    success: true,
                    verified: false,
                    message: 'Email not yet verified. Please check your inbox and click the verification link.'
                };
            }
        } catch (error) {
            console.error('❌ Check verification error:', error);
            return {
                success: false,
                error: error,
                message: 'Error checking verification status. Please try again.'
            };
        }
    }

    /**
     * Sign out current user with secure session cleanup
     */
    async signOut() {
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        try {
            Logger.info('AuthManager', 'Starting secure logout process...');
            
            // Clear current user data
            this.currentUser = null;
            this.currentUserEmail = '';
            this.isInAuthFlow = false;
            
            // Clear any cached auth state
            this.authStateCallbacks.forEach(callback => {
                try {
                    callback({
                        type: 'signedOut',
                        user: null
                    });
                } catch (error) {
                    Logger.error('AuthManager', 'Error in auth state callback during logout', error);
                }
            });
            
            // Sign out from Firebase
            await this.auth.signOut();
            
            // Clear any local storage data related to authentication
            try {
                localStorage.removeItem('merkel_view_user_session');
                localStorage.removeItem('merkel_view_last_login');
                sessionStorage.clear();
            } catch (error) {
                Logger.warn('AuthManager', 'Could not clear local storage', error);
            }
            
            Logger.info('AuthManager', '✅ User signed out securely');
            
            return { 
                success: true,
                message: 'Successfully signed out'
            };
        } catch (error) {
            Logger.error('AuthManager', 'Sign out error', error);
            return {
                success: false,
                error: error,
                message: 'Failed to sign out'
            };
        }
    }

    /**
     * Test Firestore connectivity
     */
    async testFirestoreConnection(userEmail) {
        if (!this.db || !this.currentUser) return;

        try {
            // Test read permission first
            await this.db.collection('locations').limit(1).get();
            Logger.info('AuthManager', 'Firestore read test successful');
            
            // Test write permission with a user document
            await this.db.collection('users').doc(this.currentUser.uid).set({
                email: userEmail,
                lastConnectionTest: window.firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            
            Logger.success('AuthManager', 'Firestore connection successful');
        } catch (error) {
            Logger.error('AuthManager', 'Firestore connection failed', error);
            throw new Error('Backend connection issue. Some features may not work properly.');
        }
    }

    /**
     * Get user-friendly error messages
     */
    getAuthErrorMessage(error) {
        const errorMessages = {
            'demo/disabled': 'Demo Mode: Authentication is disabled. This UI flow is working correctly!',
            'auth/user-not-found': 'No account found with this email. Would you like to register?',
            'auth/wrong-password': 'Incorrect password. Try again or reset your password.',
            'auth/invalid-login-credentials': 'Incorrect password. Try again or reset your password.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/api-key-not-valid': 'Firebase API key not configured. Please set up your Firebase credentials.',
            'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
            'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
            'auth/weak-password': 'Password should be at least 6 characters'
        };

        return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
    }

    /**
     * Validate email format
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate phone number format
     */
    isValidPhone(phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    /**
     * Set auth flow state
     */
    setAuthFlowState(inFlow) {
        this.isInAuthFlow = inFlow;
    }

    /**
     * Set current user email for multi-step auth
     */
    setCurrentUserEmail(email) {
        this.currentUserEmail = email;
    }

    /**
     * Get current user email
     */
    getCurrentUserEmail() {
        return this.currentUserEmail;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.currentUser;
    }
}

// Export as global for now, will be converted to ES modules later
window.AuthManager = AuthManager;

// Log module loading
if (window.Logger) {
    Logger.info('AuthManager module loaded');
} else {
    console.log('✅ Auth Manager module loaded');
}

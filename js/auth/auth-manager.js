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
            console.error('Auth not initialized');
            return;
        }

        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            
            if (user) {
                console.log('🔐 User signed in:', user.email);
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
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('✅ User signed in:', userCredential.user.email);
            
            // Test Firestore connectivity
            await this.testFirestoreConnection(userCredential.user.email);
            
            return {
                success: true,
                user: userCredential.user,
                message: 'Login successful!'
            };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return {
                success: false,
                error: error,
                message: this.getAuthErrorMessage(error)
            };
        }
    }

    /**
     * Create new user account
     */
    async signUp(userData) {
        const { firstName, lastName, email, phone, password } = userData;
        
        if (!this.auth || !this.db) {
            throw new Error('Auth or DB not initialized');
        }

        try {
            // Create user account
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            console.log('✅ User registered:', userCredential.user.email);

            // Send email verification
            await userCredential.user.sendEmailVerification();
            console.log('✅ Email verification sent');

            // Save user profile to Firestore
            await this.db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                firstName: firstName,
                lastName: lastName,
                phone: phone,
                fullName: `${firstName} ${lastName}`,
                role: 'user',
                emailVerified: false,
                dateCreated: window.firebase.firestore.FieldValue.serverTimestamp(),
                dateUpdated: window.firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ User profile saved to Firestore');

            return {
                success: true,
                user: userCredential.user,
                message: 'Merkel-Vision Approved. Check your email & verify account.'
            };
        } catch (error) {
            console.error('❌ Registration error:', error);
            return {
                success: false,
                error: error,
                message: this.getAuthErrorMessage(error)
            };
        }
    }

    /**
     * Send password reset email
     */
    async resetPassword(email) {
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        try {
            await this.auth.sendPasswordResetEmail(email);
            return {
                success: true,
                message: 'Password reset email sent! Check your inbox for further instructions.'
            };
        } catch (error) {
            console.error('❌ Password reset error:', error);
            return {
                success: false,
                error: error,
                message: this.getAuthErrorMessage(error)
            };
        }
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
     * Sign out current user
     */
    async signOut() {
        if (!this.auth) {
            throw new Error('Auth not initialized');
        }

        try {
            await this.auth.signOut();
            console.log('✅ User signed out');
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
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
        if (!this.db) return;

        try {
            await this.db.collection('test').doc('connection-test').set({
                timestamp: window.firebase.firestore.FieldValue.serverTimestamp(),
                user: userEmail,
                test: true
            });
            console.log('✅ Firestore connection successful');
        } catch (error) {
            console.error('❌ Firestore connection failed:', error);
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

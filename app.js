/**
 * Legacy App.js - Being Refactored
 * This file is being gradually refactored into modules.
 * New code is in /js/ directory modules.
 */

// Legacy global variables (will be moved to AppState)
let currentUser = null;
let map = null;
let geocoder = null;
let tempMarker = null;
let selectedLocation = null;
let auth, db, storage;
let currentUserEmail = ''; // Store email for multi-step auth
let isInAuthFlow = false; // Prevent auth state interference during multi-step flow

// Legacy DOM elements (now handled by DOMHelpers)
let authContainer, appContainer;
let emailStep, passwordStep, registerStep, passwordResetStep, emailVerificationStep;
let emailForm, emailInput, emailContinueBtn;
let passwordForm, passwordInput, passwordLoginBtn, passwordEmailDisplay;
let registerForm, firstNameInput, lastNameInput, registerEmailInput, phoneInput, registerPasswordInput, confirmPasswordInput;
let passwordResetForm, resetEmailInput;
let showRegisterBtn, backToEmailBtn, forgotPasswordBtn, backToPasswordBtn, backToLoginBtn;
let resendVerificationBtn, refreshVerificationBtn, logoutFromVerificationBtn;
let logoutBtn, authStatus, userEmailDisplay;
let addressSearch, searchBtn, addLocationBtn, locationModal, locationForm;
let closeModal, cancelLocation;

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the app when Firebase is ready
    
    // Wait for Firebase to be ready
    function initializeApp() {
        if (!window.auth || !window.db || !window.storage) {
            setTimeout(initializeApp, 100);
            return;
        }
        
        // Get Firebase services
        auth = window.auth;
        db = window.db;
        storage = window.storage;
        
        // Initialize app components
        initializeDOMElements();
        setupAuthListeners();
        setupLocationListeners();
    }
    
    // Listen for Firebase ready event
    window.addEventListener('firebaseReady', initializeApp);
    
    // Also try immediate initialization in case Firebase is already ready
    initializeApp();
});

// Initialize DOM elements
function initializeDOMElements() {
    // Main containers
    authContainer = document.getElementById('auth-container');
    appContainer = document.getElementById('app-container');
    
    // Authentication steps
    emailStep = document.getElementById('email-step');
    passwordStep = document.getElementById('password-step');
    registerStep = document.getElementById('register-step');
    passwordResetStep = document.getElementById('password-reset-step');
    emailVerificationStep = document.getElementById('email-verification-step');
    
    // Forms and inputs
    emailForm = document.getElementById('email-form');
    emailInput = document.getElementById('email-input');
    emailContinueBtn = document.getElementById('email-continue-btn');
    
    passwordForm = document.getElementById('password-form');
    passwordInput = document.getElementById('password-input');
    passwordLoginBtn = document.getElementById('password-login-btn');
    passwordEmailDisplay = document.getElementById('password-email-display');
    
    registerForm = document.getElementById('register-form');
    firstNameInput = document.getElementById('first-name');
    lastNameInput = document.getElementById('last-name');
    registerEmailInput = document.getElementById('register-email');
    phoneInput = document.getElementById('phone');
    registerPasswordInput = document.getElementById('register-password');
    confirmPasswordInput = document.getElementById('confirm-password');
    
    passwordResetForm = document.getElementById('password-reset-form');
    resetEmailInput = document.getElementById('reset-email');
    
    // Navigation buttons
    showRegisterBtn = document.getElementById('show-register-btn');
    backToEmailBtn = document.getElementById('back-to-email-btn');
    forgotPasswordBtn = document.getElementById('forgot-password-btn');
    backToPasswordBtn = document.getElementById('back-to-password-btn');
    backToLoginBtn = document.getElementById('back-to-login-btn');
    
    // Verification buttons
    resendVerificationBtn = document.getElementById('resend-verification-btn');
    refreshVerificationBtn = document.getElementById('refresh-verification-btn');
    logoutFromVerificationBtn = document.getElementById('logout-from-verification-btn');
    
    // App elements
    logoutBtn = document.getElementById('logout-btn');
    authStatus = document.getElementById('auth-status');
    userEmailDisplay = document.getElementById('user-email-display');

    // Map and location elements
    addressSearch = document.getElementById('address-search');
    searchBtn = document.getElementById('search-btn');
    addLocationBtn = document.getElementById('add-location-btn');
    locationModal = document.getElementById('location-modal');
    locationForm = document.getElementById('location-form');
    closeModal = document.getElementById('close-modal');
    cancelLocation = document.getElementById('cancel-location');
}

// Legacy setupLocationListeners function - now handled by LocationUI
// This function is kept for backward compatibility but functionality moved to LocationUI module

// Set up authentication event listeners
// Set up authentication event listeners
function setupAuthListeners() {
    // Listen for authentication state changes
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            currentUser = user;
            isInAuthFlow = false; // Reset auth flow flag
            
            // Check if email is verified
            if (!user.emailVerified) {
                showEmailVerificationStep(user.email);
                return;
            }
            
            showApp();
            if (userEmailDisplay) {
                userEmailDisplay.textContent = user.email;
            }
        } else {
            // User is signed out
            currentUser = null;
            
            // Only show email step if we're not in the middle of the auth flow
            if (!isInAuthFlow) {
                showEmailStep();
            }
        }
    });

    // Step 1: Email form
    if (emailForm) {
        emailForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleEmailSubmit();
        });
    }

    // Step 2: Password form
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePasswordSubmit();
        });
    }

    // Step 3: Registration form
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleRegistrationSubmit();
        });
    }

    // Password reset form
    if (passwordResetForm) {
        passwordResetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePasswordReset();
        });
    }

    // Navigation buttons
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', showRegistrationStep);
    }

    if (backToEmailBtn) {
        backToEmailBtn.addEventListener('click', function() {
            isInAuthFlow = false;
            showEmailStep();
        });
    }

    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', showPasswordResetStep);
    }

    if (backToPasswordBtn) {
        backToPasswordBtn.addEventListener('click', showPasswordStep);
    }

    if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', function() {
            isInAuthFlow = false;
            showEmailStep();
        });
    }

    // Verification buttons
    if (resendVerificationBtn) {
        resendVerificationBtn.addEventListener('click', resendVerificationEmail);
    }

    if (refreshVerificationBtn) {
        refreshVerificationBtn.addEventListener('click', checkEmailVerification);
    }

    if (logoutFromVerificationBtn) {
        logoutFromVerificationBtn.addEventListener('click', function() {
            auth.signOut();
        });
    }

    // Main app logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut();
        });
    }
}

// Authentication Step Navigation Functions
function showEmailStep() {
    hideAllAuthSteps();
    if (emailStep) {
        emailStep.style.display = 'block';
        if (emailInput) emailInput.focus();
    }
    currentUserEmail = '';
    isInAuthFlow = false;
}

function showPasswordStep() {
    console.log('🔑 showPasswordStep called');
    console.log('🔑 passwordStep element:', passwordStep);
    console.log('🔑 currentUserEmail:', currentUserEmail);
    
    hideAllAuthSteps();
    if (passwordStep) {
        passwordStep.style.display = 'block';
        console.log('✅ Password step displayed');
        
        if (passwordEmailDisplay) {
            passwordEmailDisplay.textContent = currentUserEmail;
            console.log('✅ Email display updated');
        }
        
        // Set hidden email field for accessibility
        const hiddenEmailField = document.getElementById('password-email-hidden');
        if (hiddenEmailField) {
            hiddenEmailField.value = currentUserEmail;
        }
        
        if (passwordInput) {
            passwordInput.focus();
            passwordInput.value = '';
            console.log('✅ Password input focused and cleared');
        }
    } else {
        console.log('❌ passwordStep element not found');
    }
}

function showRegistrationStep() {
    hideAllAuthSteps();
    if (registerStep) {
        registerStep.style.display = 'block';
        if (registerEmailInput) {
            registerEmailInput.value = currentUserEmail;
        }
        if (firstNameInput) firstNameInput.focus();
    }
}

function showPasswordResetStep() {
    hideAllAuthSteps();
    if (passwordResetStep) {
        passwordResetStep.style.display = 'block';
        if (resetEmailInput) {
            resetEmailInput.value = currentUserEmail;
            resetEmailInput.focus();
        }
    }
}

function showEmailVerificationStep(email) {
    hideAllAuthSteps();
    if (emailVerificationStep) {
        emailVerificationStep.style.display = 'block';
        const verificationEmailSpan = document.getElementById('verification-email-display');
        if (verificationEmailSpan) {
            verificationEmailSpan.textContent = email;
        }
    }
}

function hideAllAuthSteps() {
    const steps = [emailStep, passwordStep, registerStep, passwordResetStep, emailVerificationStep];
    steps.forEach(step => {
        if (step) step.style.display = 'none';
    });
}

// Show authentication container
function showAuth() {
    if (authContainer) authContainer.style.display = 'flex';
    if (appContainer) appContainer.style.display = 'none';
    showEmailStep();
}

// Show main app
function showApp() {
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    // Initialize map after showing app (if not already initialized)
    if (!map && typeof window.google !== 'undefined') {
        initMap();
    }
}

// Authentication Flow Handlers
function handleEmailSubmit() {
    console.log('🔍 handleEmailSubmit called');
    
    // Get the input value directly from DOM if emailInput isn't set
    const emailInputElement = emailInput || document.getElementById('email-input');
    const email = emailInputElement ? emailInputElement.value.trim() : '';
    
    console.log('📧 Email input element:', emailInputElement);
    console.log('📧 Email value:', email);
    
    if (!email) {
        console.log('❌ No email provided');
        showAuthStatus('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        console.log('❌ Invalid email format');
        showAuthStatus('Please enter a valid email address', 'error');
        return;
    }
    
    console.log('✅ Email validation passed, setting currentUserEmail and showing password step');
    currentUserEmail = email;
    isInAuthFlow = true; // Set flag to prevent auth state interference
    showPasswordStep();
}

function handlePasswordSubmit() {
    const password = passwordInput.value.trim();
    
    if (!password) {
        showAuthStatus('Please enter your password', 'error');
        return;
    }
    
    if (!currentUserEmail) {
        showAuthStatus('Email not found. Please start over.', 'error');
        showEmailStep();
        return;
    }
    
    showAuthStatus('Signing in...', 'info');
    
    auth.signInWithEmailAndPassword(currentUserEmail, password)
        .then((userCredential) => {
            console.log('User logged in:', userCredential.user.email);
            
            // Test Firestore connectivity
            console.log('Testing Firestore connectivity...');
            db.collection('test').doc('connection-test').set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                user: userCredential.user.email,
                test: true
            }).then(() => {
                console.log('✅ Firestore connection successful');
            }).catch((error) => {
                console.error('❌ Firestore connection failed:', error);
                showAuthStatus('Backend connection issue. Some features may not work properly.', 'warning');
            });
            
            showAuthStatus('Login successful!', 'success');
        })
        .catch((error) => {
            console.error('Login error:', error);
            
            let errorMessage = 'Login failed. Please check your credentials.';
            
            if (error.code === 'demo/disabled') {
                errorMessage = 'Demo Mode: Authentication is disabled. This UI flow is working correctly!';
            } else if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email. Would you like to register?';
            } else if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-login-credentials') {
                errorMessage = 'Incorrect password. Try again or reset your password.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled.';
            } else if (error.code === 'auth/api-key-not-valid') {
                errorMessage = 'Firebase API key not configured. Please set up your Firebase credentials.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Too many failed login attempts. Please try again later.';
            }
            
            showAuthStatus(errorMessage, error.code === 'demo/disabled' ? 'info' : 'error');
        });
}

function handleRegistrationSubmit() {
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const phone = phoneInput.value.trim();
    const password = registerPasswordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    
    // Validation
    if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
        showAuthStatus('All fields are required', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAuthStatus('Please enter a valid email address', 'error');
        return;
    }
    
    if (!isValidPhone(phone)) {
        showAuthStatus('Please enter a valid phone number', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthStatus('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAuthStatus('Passwords do not match', 'error');
        return;
    }
    
    showAuthStatus('Creating account...', 'info');
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User registered:', userCredential.user.email);
            
            // Send email verification
            console.log('Attempting to send email verification to:', userCredential.user.email);
            return userCredential.user.sendEmailVerification()
                .then(() => {
                    console.log('✅ Email verification sent successfully to:', userCredential.user.email);
                    // Save user profile to Firestore with expanded fields
                    return db.collection('users').doc(userCredential.user.uid).set({
                        email: email,
                        firstName: firstName,
                        lastName: lastName,
                        phone: phone,
                        fullName: `${firstName} ${lastName}`,
                        role: 'user',
                        emailVerified: false,
                        dateCreated: firebase.firestore.FieldValue.serverTimestamp(),
                        dateUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    console.log('✅ User profile saved to Firestore');
                    showAuthStatus('Merkel-Vision Approved. Check your email & verify account.', 'success');
                    showEmailVerificationStep(email);
                })
                .catch((emailError) => {
                    console.error('❌ Email verification failed:', emailError);
                    showAuthStatus('Account created but email verification failed. You can try resending it.', 'warning');
                    showEmailVerificationStep(email);
                });
        })
        .catch((error) => {
            console.error('Registration error:', error);
            let errorMessage = error.message;
            
            // Handle specific error codes
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists. Try signing in instead.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address';
            }
            
            showAuthStatus('Registration failed: ' + errorMessage, 'error');
        });
}

function handlePasswordReset() {
    const email = resetEmailInput.value.trim();
    
    if (!email) {
        showAuthStatus('Please enter your email address', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showAuthStatus('Please enter a valid email address', 'error');
        return;
    }
    
    showAuthStatus('Sending password reset email...', 'info');
    
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showAuthStatus('Password reset email sent! Check your inbox for further instructions.', 'success');
            setTimeout(() => {
                showPasswordStep();
            }, 3000);
        })
        .catch((error) => {
            console.error('Password reset error:', error);
            
            let errorMessage = 'Failed to send password reset email.';
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email address.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }
            
            showAuthStatus(errorMessage, 'error');
        });
}

function resendVerificationEmail() {
    if (currentUser) {
        currentUser.sendEmailVerification()
            .then(() => {
                showAuthStatus('Verification email sent! Check your inbox.', 'success');
            })
            .catch((error) => {
                console.error('Error sending verification email:', error);
                showAuthStatus('Failed to send verification email. Please try again.', 'error');
            });
    }
}

function checkEmailVerification() {
    if (currentUser) {
        currentUser.reload()
            .then(() => {
                if (currentUser.emailVerified) {
                    // Update user profile in Firestore
                    db.collection('users').doc(currentUser.uid).update({
                        emailVerified: true,
                        dateUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        showAuthStatus('Email verified successfully!', 'success');
                        showApp();
                    }).catch((error) => {
                        console.warn('Could not update verification status:', error);
                        showApp(); // Still show app even if Firestore update fails
                    });
                } else {
                    showAuthStatus('Email not yet verified. Please check your inbox and click the verification link.', 'error');
                }
            })
            .catch((error) => {
                console.error('Error checking verification status:', error);
                showAuthStatus('Error checking verification status. Please try again.', 'error');
            });
    }
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    // Basic US phone number validation (can be enhanced)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Show authentication status messages
function showAuthStatus(message, type) {
    if (authStatus) {
        authStatus.textContent = message;
        authStatus.className = 'auth-status ' + type;
        authStatus.style.display = 'block';
        
        // Clear message after 5 seconds
        setTimeout(() => {
            authStatus.style.display = 'none';
        }, 5000);
    }
}

// Check if Firebase is properly configured
function checkFirebaseConfig() {
    const config = window.AppConfig;
    if (!config) {
        showAuthStatus('Configuration not loaded. Please refresh the page.', 'error');
        return false;
    }
    
    // Allow demo mode
    if (config.demoMode) {
        showAuthStatus('Demo mode: Authentication is disabled for UI testing only.', 'info');
        return false;
    }
    
    if (!config.firebase) {
        showAuthStatus('Firebase configuration not loaded. Please check config.js', 'error');
        return false;
    }
    
    // Check for placeholder values
    const isPlaceholder = config.firebase.apiKey.includes('your-') || 
                         config.firebase.apiKey === 'demo-api-key' ||
                         config.firebase.projectId === 'demo-project';
    
    if (isPlaceholder) {
        showAuthStatus('Please configure Firebase credentials in config.js for full functionality', 'info');
        return false;
    }
    
    return true;
}

// Legacy initMap function - now handled by MapsManager
// This function is kept for Google Maps API callback compatibility
function initMap() {
    console.log('🗺️ Legacy initMap called - delegating to new modular system');
    // The actual map initialization is now handled by the new modular system
    // in js/core/app.js which uses MapsManager
}

// Legacy handleMapClick function - now handled by MapsManager
// This function is kept for backward compatibility but functionality moved to MapsManager

// Legacy performAddressSearch function - now handled by MapsManager
// This function is kept for backward compatibility but functionality moved to MapsManager

// Legacy setupAddressAutocomplete function - now handled by MapsManager
// This function is kept for backward compatibility but functionality moved to MapsManager

// Legacy parseAddressComponents function - now handled by MapsManager
// This function is kept for backward compatibility but functionality moved to MapsManager

// Legacy openLocationModal function - now handled by LocationUI
// This function is kept for backward compatibility but functionality moved to LocationUI module

// Legacy closeLocationModal function - now handled by LocationUI
// This function is kept for backward compatibility but functionality moved to LocationUI module

// Legacy setupPhotoPreview function - now handled by LocationUI
// This function is kept for backward compatibility but functionality moved to LocationUI module

// Legacy saveLocation function - now handled by LocationManager
// This function is kept for backward compatibility but functionality moved to LocationManager module

// Show temporary message
function showTemporaryMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `temp-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 1001;
        font-weight: 500;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Legacy loadLocations function - now handled by LocationManager
// This function is kept for backward compatibility but functionality moved to LocationManager module

// Legacy addTemporaryMarker function - now handled by MapsManager
// This function is kept for backward compatibility but functionality moved to MapsManager

// Global variables
let currentUser = null;
let map = null;
let geocoder = null;
let tempMarker = null;
let selectedLocation = null;
let auth, db, storage;
let currentUserEmail = ''; // Store email for multi-step auth
let isInAuthFlow = false; // Prevent auth state interference during multi-step flow

// DOM elements (will be queried when needed)
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

// Enhanced state management
const AppState = {
    markers: new Map(), // Track all location markers
    filters: {
        category: 'all',
        searchTerm: '',
        showOnlyMine: false
    },
    
    // Clear all markers from map
    clearMarkers() {
        this.markers.forEach(marker => {
            marker.map = null;
        });
        this.markers.clear();
    },
    
    // Add marker to tracking
    addMarker(id, marker) {
        this.markers.set(id, marker);
    },
    
    // Remove specific marker
    removeMarker(id) {
        const marker = this.markers.get(id);
        if (marker) {
            marker.map = null;
            this.markers.delete(id);
        }
    }
};

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App starting...');
    
    // Wait for Firebase to be ready
    function initializeApp() {
        if (!window.auth || !window.db || !window.storage) {
            console.log('⏳ Waiting for Firebase services...');
            setTimeout(initializeApp, 100);
            return;
        }
        
        // Get Firebase services
        auth = window.auth;
        db = window.db;
        storage = window.storage;
        
        // Get DOM elements
        initializeDOMElements();
        
        // Set up authentication listeners
        setupAuthListeners();
        
        // Set up map and location listeners
        setupLocationListeners();
        
        console.log('✅ App initialized successfully');
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
    
    console.log('DOM elements initialized:', {
        addressSearch: !!addressSearch,
        searchBtn: !!searchBtn,
        addLocationBtn: !!addLocationBtn,
        locationModal: !!locationModal
    });
}

// Set up location-related event listeners
function setupLocationListeners() {
    console.log('Setting up location listeners...');
    
    // Re-query elements in case they weren't available before
    if (!addressSearch) addressSearch = document.getElementById('address-search');
    if (!searchBtn) searchBtn = document.getElementById('search-btn');
    if (!addLocationBtn) addLocationBtn = document.getElementById('add-location-btn');
    if (!locationModal) locationModal = document.getElementById('location-modal');
    if (!locationForm) locationForm = document.getElementById('location-form');
    if (!closeModal) closeModal = document.getElementById('close-modal');
    if (!cancelLocation) cancelLocation = document.getElementById('cancel-location');
    
    console.log('Location elements found:', {
        addressSearch: !!addressSearch,
        searchBtn: !!searchBtn,
        addLocationBtn: !!addLocationBtn,
        locationModal: !!locationModal,
        locationForm: !!locationForm
    });
    
    // Address search
    if (searchBtn) {
        console.log('Adding click listener to search button');
        searchBtn.addEventListener('click', performAddressSearch);
    } else {
        console.warn('Search button not found!');
    }
    
    if (addressSearch) {
        console.log('Adding keypress listener to address search');
        addressSearch.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                console.log('Enter pressed in search box');
                performAddressSearch();
            }
        });
    } else {
        console.warn('Address search input not found!');
    }
    
    // Manual add location button
    if (addLocationBtn) {
        console.log('Adding click listener to add location button');
        addLocationBtn.addEventListener('click', function() {
            console.log('Add location button clicked');
            openLocationModal();
        });
    } else {
        console.warn('Add location button not found!');
    }
    
    // Modal controls
    if (closeModal) {
        closeModal.addEventListener('click', closeLocationModal);
    }
    
    if (cancelLocation) {
        cancelLocation.addEventListener('click', closeLocationModal);
    }
    
    // Location form submission
    if (locationForm) {
        locationForm.addEventListener('submit', saveLocation);
    }
    
    // Setup photo preview
    setupPhotoPreview();
    
    // Close modal when clicking outside
    if (locationModal) {
        locationModal.addEventListener('click', function(e) {
            if (e.target === locationModal) {
                closeLocationModal();
            }
        });
    }
}

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

// Initialize Google Maps
function initMap() {
    // Default location (center of US)
    const defaultLocation = { lat: 39.8283, lng: -98.5795 };
    
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }
    
    // Create map
    map = new google.maps.Map(mapElement, {
        zoom: 4,
        center: defaultLocation,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [{visibility: 'off'}]
            },
            {
                featureType: 'poi',
                stylers: [{visibility: 'off'}]
            }
        ]
    });
    
    // Initialize geocoder for address search
    geocoder = new google.maps.Geocoder();
    
    // Test geocoding availability with a simple request
    setTimeout(() => {
        geocoder.geocode({ address: 'New York, NY' }, function(results, status) {
            console.log('Geocoding test status:', status);
            
            if (status === 'REQUEST_DENIED' || status === 'ERROR') {
                console.warn('Geocoding API not available:', status);
                
                // Show warning and disable search
                const warning = document.getElementById('geocoding-warning');
                const searchBtn = document.getElementById('search-btn');
                const addressSearch = document.getElementById('address-search');
                
                if (warning) warning.style.display = 'block';
                if (searchBtn) {
                    searchBtn.disabled = true;
                    searchBtn.textContent = 'Search Disabled';
                    searchBtn.style.background = '#ccc';
                    searchBtn.style.cursor = 'not-allowed';
                }
                if (addressSearch) {
                    addressSearch.disabled = true;
                    addressSearch.placeholder = 'Address search unavailable - Click map to add locations';
                    addressSearch.style.background = '#f5f5f5';
                }
                
                // Set geocoder to null to prevent errors
                geocoder = null;
            } else if (status === 'OK' || status === 'ZERO_RESULTS') {
                console.log('Geocoding API is working properly');
                
                // Hide warning if it was shown
                const warning = document.getElementById('geocoding-warning');
                if (warning) warning.style.display = 'none';
            }
        });
    }, 1000); // Wait 1 second after map initialization
    
    // Add click listener to map for location picking
    map.addListener('click', function(event) {
        handleMapClick(event.latLng);
    });
    
    console.log('Google Maps initialized');
    
    // Setup address autocomplete
    setupAddressAutocomplete();
    
    // Load existing locations if user is authenticated
    if (currentUser) {
        loadLocations();
    }
}

// Handle map click for location picking
function handleMapClick(latLng) {
    console.log('Map clicked at:', latLng.lat(), latLng.lng());
    
    if (!currentUser) {
        console.warn('User not authenticated, ignoring map click');
        return;
    }
    
    console.log('Creating temporary marker...');
    
    // Remove previous temporary marker
    if (tempMarker) {
        tempMarker.map = null;
    }
    
    // Create custom pin element for temporary marker
    const tempPinElement = new google.maps.marker.PinElement({
        background: '#FF5722',
        borderColor: '#FFFFFF',
        glyph: '📍',
        scale: 1.2
    });
    
    // Add temporary marker using AdvancedMarkerElement
    tempMarker = new google.maps.marker.AdvancedMarkerElement({
        position: latLng,
        map: map,
        title: 'Click to add location here',
        content: tempPinElement.element
    });
    
    // Create location data without geocoding (temporary fix)
    selectedLocation = {
        lat: latLng.lat(),
        lng: latLng.lng(),
        address: `Coordinates: ${latLng.lat().toFixed(6)}, ${latLng.lng().toFixed(6)}`
    };
    
    // Try geocoding if API is available, otherwise use coordinates
    if (geocoder) {
        geocoder.geocode({ location: latLng }, function(results, status) {
            if (status === 'OK' && results[0]) {
                selectedLocation.address = results[0].formatted_address;
                
                // Parse address components
                const addressComponents = parseAddressComponents(results[0].address_components);
                selectedLocation = { ...selectedLocation, ...addressComponents };
                
                // Update modal if it's open
                if (locationModal && locationModal.style.display === 'flex') {
                    document.getElementById('location-address').value = selectedLocation.address;
                    if (selectedLocation.city) {
                        document.getElementById('location-city').value = selectedLocation.city;
                    }
                    if (selectedLocation.state) {
                        document.getElementById('location-state').value = selectedLocation.state;
                    }
                }
            } else {
                console.warn('Geocoding failed or not available:', status);
            }
        });
    }
    
    // Open location modal with current data
    openLocationModal(selectedLocation);
}

// Perform address search
function performAddressSearch() {
    console.log('performAddressSearch called');
    
    if (!addressSearch) {
        console.error('Address search input not found');
        return;
    }
    
    const address = addressSearch.value.trim();
    console.log('Search address:', address);
    
    if (!address) {
        console.warn('No address entered');
        return;
    }
    
    if (!geocoder) {
        console.error('Geocoder not available');
        alert('Address search is not available. Please enable the Geocoding API in Google Cloud Console.');
        return;
    }
    
    // Show loading state
    const originalText = searchBtn.textContent;
    searchBtn.textContent = 'Searching...';
    searchBtn.disabled = true;
    
    console.log('Starting geocoding request...');
    
    geocoder.geocode({ address: address }, function(results, status) {
        console.log('Geocoding result:', status, results);
        
        if (status === 'OK' && results[0]) {
            const location = results[0].geometry.location;
            console.log('Location found:', location.lat(), location.lng());
            
            // Center map on result
            map.setCenter(location);
            map.setZoom(15);
            
            // Set selected location data
            selectedLocation = {
                lat: location.lat(),
                lng: location.lng(),
                address: results[0].formatted_address
            };
            
            // Parse address components
            const addressComponents = parseAddressComponents(results[0].address_components);
            selectedLocation = { ...selectedLocation, ...addressComponents };
            
            // Add temporary marker
            if (tempMarker) {
                tempMarker.map = null;
            }
            
            const tempPinElement = new google.maps.marker.PinElement({
                background: '#FF5722',
                borderColor: '#FFFFFF',
                glyph: '📍',
                scale: 1.2
            });
            
            tempMarker = new google.maps.marker.AdvancedMarkerElement({
                position: location,
                map: map,
                title: 'Click to add location here',
                content: tempPinElement.element
            });
            
            // Open the modal with the location data
            console.log('Opening modal with searched location:', selectedLocation);
            openLocationModal(selectedLocation);
            
            // Clear search box
            addressSearch.value = '';
        } else {
            console.error('Geocoding failed:', status);
            alert('Address not found. Please try a different search term or click on the map to add a location manually.');
        }
        
        // Reset button state
        searchBtn.textContent = originalText;
        searchBtn.disabled = false;
    });
}

// Setup address autocomplete
function setupAddressAutocomplete() {
    console.log('Setting up address autocomplete');
    
    if (!addressSearch) {
        console.warn('Address search input not found, cannot setup autocomplete');
        return;
    }
    
    // Check if Google Maps Places library is available
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.warn('Google Maps Places API not available, skipping autocomplete setup');
        return;
    }
    
    try {
        // Create autocomplete instance
        const autocomplete = new google.maps.places.Autocomplete(addressSearch, {
            types: ['geocode'], // Restrict to addresses
            fields: ['geometry', 'formatted_address', 'address_components']
        });
        
        // Bias autocomplete to current map viewport if available
        if (map) {
            autocomplete.bindTo('bounds', map);
        }
        
        // Listen for place selection
        autocomplete.addListener('place_changed', function() {
            const place = autocomplete.getPlace();
            console.log('Autocomplete place selected:', place);
            
            if (!place.geometry) {
                console.warn('No geometry available for selected place');
                return;
            }
            
            // Center map on selected place
            if (map) {
                if (place.geometry.viewport) {
                    map.fitBounds(place.geometry.viewport);
                } else {
                    map.setCenter(place.geometry.location);
                    map.setZoom(15);
                }
            }
            
            // Set selected location data
            selectedLocation = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                address: place.formatted_address
            };
            
            // Parse address components if available
            if (place.address_components) {
                const addressComponents = parseAddressComponents(place.address_components);
                selectedLocation = { ...selectedLocation, ...addressComponents };
            }
            
            // Add temporary marker and open location modal
            addTemporaryMarker(place.geometry.location);
            openLocationModal();
        });
        
        console.log('Address autocomplete setup complete');
        
    } catch (error) {
        console.warn('Failed to setup address autocomplete:', error);
        console.log('Falling back to manual search only');
    }
}

// Parse address components from Google Maps API
function parseAddressComponents(components) {
    const parsed = {
        city: '',
        state: '',
        country: '',
        postalCode: ''
    };
    
    components.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality')) {
            parsed.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
            parsed.state = component.short_name;
        } else if (types.includes('country')) {
            parsed.country = component.long_name;
        } else if (types.includes('postal_code')) {
            parsed.postalCode = component.long_name;
        }
    });
    
    return parsed;
}

// Open location modal
function openLocationModal(locationData = null) {
    console.log('openLocationModal called with:', locationData);
    
    if (!locationModal) {
        console.error('Location modal not found!');
        return;
    }
    
    console.log('Opening modal...');
    
    // Pre-fill form if location data provided
    if (locationData) {
        document.getElementById('location-address').value = locationData.address || '';
        document.getElementById('location-coords').value = 
            `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`;
        
        if (locationData.city) {
            document.getElementById('location-city').value = locationData.city;
        }
        if (locationData.state) {
            document.getElementById('location-state').value = locationData.state;
        }
    } else {
        // Clear form for manual entry
        locationForm.reset();
        document.getElementById('location-address').value = '';
        document.getElementById('location-coords').value = '';
    }
    
    locationModal.style.display = 'flex';
    document.getElementById('location-name').focus();
}

// Close location modal
function closeLocationModal() {
    if (locationModal) {
        locationModal.style.display = 'none';
    }
    
    // Remove temporary marker
    if (tempMarker) {
        tempMarker.map = null;
        tempMarker = null;
    }
    
    // Reset selected location
    selectedLocation = null;
    
    // Remove photo preview if exists
    const preview = document.getElementById('photo-preview');
    if (preview) {
        preview.remove();
    }
    
    // Reset form
    if (locationForm) {
        locationForm.reset();
    }
}

// Setup photo preview functionality
function setupPhotoPreview() {
    const photoInput = document.getElementById('location-photo');
    if (photoInput) {
        photoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Remove existing preview
                const existingPreview = document.getElementById('photo-preview');
                if (existingPreview) {
                    existingPreview.remove();
                }
                
                // Create new preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewDiv = document.createElement('div');
                    previewDiv.id = 'photo-preview';
                    previewDiv.style.cssText = 'margin: 10px 0; text-align: center;';
                    
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.style.cssText = 'max-width: 200px; max-height: 150px; border-radius: 6px; border: 2px solid #ddd;';
                    
                    const fileName = document.createElement('p');
                    fileName.textContent = file.name;
                    fileName.style.cssText = 'font-size: 12px; color: #666; margin: 5px 0 0 0;';
                    
                    previewDiv.appendChild(img);
                    previewDiv.appendChild(fileName);
                    
                    // Insert preview after the photo input
                    photoInput.parentNode.insertBefore(previewDiv, photoInput.nextSibling);
                };
                
                reader.readAsDataURL(file);
            }
        });
    }
}

// Save location to Firestore (with photo upload)
async function saveLocation(e) {
    e.preventDefault();
    
    if (!currentUser || !selectedLocation) {
        alert('Please select a location on the map first');
        return;
    }
    
    // Get form data
    const locationData = {
        name: document.getElementById('location-name').value.trim(),
        address: document.getElementById('location-address').value,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        state: document.getElementById('location-state').value,
        city: document.getElementById('location-city').value.trim(),
        category: document.getElementById('location-category').value,
        notes: document.getElementById('location-notes').value.trim(),
        addedBy: currentUser.email,
        userId: currentUser.uid,
        dateAdded: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validate required fields
    if (!locationData.name || !locationData.state || !locationData.city || !locationData.category) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Get photo file if selected
    const photoFile = document.getElementById('location-photo').files[0];
    
    // Show loading state
    const submitBtn = document.querySelector('#location-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    try {
        // Upload photo if selected
        if (photoFile) {
            console.log('Uploading photo:', photoFile.name);
            submitBtn.textContent = 'Uploading photo...';
            
            // Create unique filename
            const fileExtension = photoFile.name.split('.').pop();
            const fileName = `locations/${currentUser.uid}/${Date.now()}_${locationData.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
            
            // Upload to Firebase Storage
            const storage = firebase.storage();
            const storageRef = storage.ref(fileName);
            const uploadTask = await storageRef.put(photoFile);
            
            // Get download URL
            const photoURL = await uploadTask.ref.getDownloadURL();
            locationData.photoURL = photoURL;
            locationData.photoFileName = fileName;
            
            console.log('Photo uploaded successfully:', photoURL);
        }
        
        // Save location to Firestore
        submitBtn.textContent = 'Saving location...';
        const docRef = await db.collection('locations').add(locationData);
        
        console.log('Location saved with ID:', docRef.id);
        
        // Close modal and reset form
        closeLocationModal();
        document.getElementById('location-form').reset();
        
        // Show success message
        showTemporaryMessage(
            photoFile ? 'Location and photo saved successfully!' : 'Location saved successfully!', 
            'success'
        );
        
        // Reload locations to show the new one
        loadLocations();
        
    } catch (error) {
        console.error('Error saving location:', error);
        alert('Error saving location: ' + error.message);
    } finally {
        // Reset button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

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

// Load locations from Firestore
function loadLocations() {
    if (!db || !currentUser) {
        console.log('Cannot load locations: db or currentUser not available');
        return;
    }
    
    console.log('Loading locations for user:', currentUser.email);
    
    db.collection('locations')
        .orderBy('dateAdded', 'desc')
        .onSnapshot((snapshot) => {
            console.log('✅ Locations snapshot received, count:', snapshot.size);
            const locationList = document.getElementById('location-list');
            if (locationList) {
                // Clear existing content
                AppState.clearMarkers();
                locationList.innerHTML = '';
                
                // Create filters if they don't exist
                if (!document.getElementById('location-search-filter')) {
                    createLocationFilters();
                }
                
                snapshot.forEach((doc) => {
                    const location = { ...doc.data(), id: doc.id };
                    addLocationToList(location, doc.id);
                    const marker = addLocationToMap(location);
                    if (marker) {
                        AppState.addMarker(doc.id, marker);
                    }
                });
            }
        }, (error) => {
            console.error('❌ Error loading locations:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            // Show user-friendly error message
            if (error.code === 'permission-denied') {
                showTemporaryMessage('Permission denied. Please check Firestore security rules.', 'error');
            } else if (error.code === 'unavailable') {
                showTemporaryMessage('Backend temporarily unavailable. Please try again later.', 'error');
            } else {
                showTemporaryMessage('Cannot load locations: ' + error.message, 'error');
            }
        });
}

// Add temporary marker for location selection
function addTemporaryMarker(latLng) {
    console.log('Adding temporary marker at:', latLng);
    
    // Remove previous temporary marker
    if (tempMarker) {
        tempMarker.map = null;
    }
    
    // Create custom pin element for temporary marker
    const tempPinElement = new google.maps.marker.PinElement({
        background: '#FF5722',
        borderColor: '#FFFFFF',
        glyph: '📍',
        scale: 1.2
    });
    
    // Add temporary marker using AdvancedMarkerElement
    tempMarker = new google.maps.marker.AdvancedMarkerElement({
        position: latLng,
        map: map,
        title: 'Click to add location here',
        content: tempPinElement.element
    });
    
    console.log('Temporary marker added');
}

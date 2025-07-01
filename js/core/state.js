/**
 * Application State Management
 * Handles global app state including markers, filters, and user data
 */

// Global state object for the Merkel-View application
const AppState = {
    // User state
    currentUser: null,
    currentUserEmail: '',
    isInAuthFlow: false,
    
    // Firebase services
    auth: null,
    db: null,
    storage: null,
    
    // Map state (now managed by MapsManager, kept for backward compatibility)
    map: null,
    geocoder: null,
    tempMarker: null,
    selectedLocation: null,
    markers: new Map(), // Track all location markers (legacy, use MapsManager instead)
    
    // Filter state
    filters: {
        category: 'all',
        searchTerm: '',
        showOnlyMine: false
    },
    
    // DOM elements cache
    elements: {
        // Auth containers
        authContainer: null,
        appContainer: null,
        
        // Auth steps
        emailStep: null,
        passwordStep: null,
        registerStep: null,
        passwordResetStep: null,
        emailVerificationStep: null,
        
        // Forms and inputs
        emailForm: null,
        emailInput: null,
        emailContinueBtn: null,
        passwordForm: null,
        passwordInput: null,
        passwordLoginBtn: null,
        passwordEmailDisplay: null,
        registerForm: null,
        firstNameInput: null,
        lastNameInput: null,
        registerEmailInput: null,
        phoneInput: null,
        registerPasswordInput: null,
        confirmPasswordInput: null,
        passwordResetForm: null,
        resetEmailInput: null,
        
        // Navigation buttons
        showRegisterBtn: null,
        backToEmailBtn: null,
        forgotPasswordBtn: null,
        backToPasswordBtn: null,
        backToLoginBtn: null,
        resendVerificationBtn: null,
        refreshVerificationBtn: null,
        logoutFromVerificationBtn: null,
        
        // App elements
        logoutBtn: null,
        authStatus: null,
        userEmailDisplay: null,
        
        // Map and location elements
        addressSearch: null,
        searchBtn: null,
        addLocationBtn: null,
        locationModal: null,
        locationForm: null,
        closeModal: null,
        cancelLocation: null
    },
    
    // Clear all markers from map
    clearMarkers() {
        this.markers.forEach(marker => {
            if (marker && marker.map) {
                marker.map = null;
            }
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
            if (marker.map) {
                marker.map = null;
            }
            this.markers.delete(id);
        }
    },
    
    // Initialize Firebase services from global window
    initializeFirebaseServices() {
        this.auth = window.auth;
        this.db = window.db;
        this.storage = window.storage;
        
        console.log('🔥 Firebase services initialized:', {
            auth: !!this.auth,
            db: !!this.db,
            storage: !!this.storage
        });
    },
    
    // Set current user
    setCurrentUser(user) {
        this.currentUser = user;
        this.isInAuthFlow = false;
        console.log('👤 Current user set:', user ? user.email : 'null');
    },
    
    // Set authentication flow state
    setAuthFlow(inFlow) {
        this.isInAuthFlow = inFlow;
        console.log('🔐 Auth flow state:', inFlow ? 'active' : 'inactive');
    },
    
    // Update filters
    updateFilters(newFilters) {
        this.filters = { ...this.filters, ...newFilters };
        console.log('🔍 Filters updated:', this.filters);
    },
    
    // Reset state (for cleanup)
    reset() {
        this.clearMarkers();
        this.currentUser = null;
        this.currentUserEmail = '';
        this.isInAuthFlow = false;
        this.selectedLocation = null;
        this.tempMarker = null;
        
        console.log('🔄 App state reset');
    }
};

// Export for use in other modules
window.AppState = AppState;

console.log('✅ State management module loaded');

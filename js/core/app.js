/**
 * Main Application Entry Point
 * Coordinates initialization and module loading
 */

// Main application controller
const MerkelApp = {
    
    // Module instances
    authManager: null,
    authUI: null,
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('🚀 Merkel-View App starting...');
        console.log('🔍 DOM loaded, checking Firebase...');
        console.log('🔍 window.firebase:', typeof window.firebase);
        console.log('🔍 firebase apps:', window.firebase ? window.firebase.apps : 'no firebase');
        
        // Wait for Firebase to be ready
        await this.waitForFirebase();
        
        // Initialize Firebase services in state
        AppState.initializeFirebaseServices();
        
        // Initialize DOM elements
        DOMHelpers.initializeDOMElements();
        
        // Initialize authentication modules
        this.initializeAuthModules();
        
        // Set up module listeners (will be implemented in later phases)
        this.setupModuleListeners();
        
        console.log('✅ App initialized successfully');
    },
    
    /**
     * Wait for Firebase services to be available
     */
    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                console.log('🚀 Checking Firebase services...');
                console.log('🔍 window.auth:', window.auth ? 'present' : 'missing');
                console.log('🔍 window.db:', window.db ? 'present' : 'missing');
                console.log('🔍 window.storage:', window.storage ? 'present' : 'missing');
                
                if (!window.auth || !window.db || !window.storage) {
                    console.log('⏳ Waiting for Firebase services...');
                    setTimeout(checkFirebase, 100);
                    return;
                }
                
                console.log('✅ Firebase services ready');
                resolve();
            };
            
            // Listen for Firebase ready event
            window.addEventListener('firebaseReady', () => {
                console.log('🔥 Firebase ready event received');
                resolve();
            });
            
            // Also try immediate check in case Firebase is already ready
            checkFirebase();
        });
    },
    
    /**
     * Setup listeners for other modules (placeholder for now)
     */
    setupModuleListeners() {
        console.log('🔧 Setting up module listeners...');
        
        // Authentication is now handled by auth modules
        // Locations and maps will be implemented in later phases
        
        // For now, keep location listeners from original code
        if (typeof setupLocationListeners === 'function') {
            setupLocationListeners();
        }
        
        console.log('✅ Module listeners setup complete');
    },
    
    /**
     * Show authentication container
     */
    showAuth() {
        if (this.authUI) {
            this.authUI.showAuth();
        } else {
            // Fallback to original method
            DOMHelpers.show(AppState.elements.authContainer, 'flex');
            DOMHelpers.hide(AppState.elements.appContainer);
            if (typeof showEmailStep === 'function') {
                showEmailStep();
            }
        }
    },
    
    /**
     * Show main app container
     */
    showApp() {
        if (this.authUI) {
            this.authUI.showApp();
        } else {
            // Fallback to original method
            DOMHelpers.hide(AppState.elements.authContainer);
            DOMHelpers.show(AppState.elements.appContainer, 'block');
        }
        
        // Initialize map after showing app (if not already initialized)
        if (!AppState.map && typeof window.google !== 'undefined') {
            if (typeof initMap === 'function') {
                initMap(); // Will be moved to maps module in Phase 3
            }
        }
    },
    
    /**
     * Handle user authentication (called by auth UI)
     */
    handleUserAuthenticated() {
        console.log('✅ User authenticated, initializing app features...');
        
        // Initialize map if not already done
        if (!AppState.map && typeof window.google !== 'undefined') {
            if (typeof initMap === 'function') {
                initMap();
            }
        }
        
        // Load locations if available
        if (typeof loadLocations === 'function') {
            loadLocations();
        }
    },
    
    /**
     * Initialize authentication modules
     */
    initializeAuthModules() {
        console.log('🔐 Initializing authentication modules...');
        
        // Initialize auth manager
        this.authManager = new AuthManager();
        this.authManager.initialize(AppState.auth, AppState.db);
        
        // Initialize auth UI
        this.authUI = new AuthUI();
        this.authUI.initialize(this.authManager, DOMHelpers, ValidationUtils);
        
        console.log('✅ Authentication modules initialized');
    },
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    MerkelApp.init();
});

// Export to global scope
window.MerkelApp = MerkelApp;
window.AppCore = MerkelApp; // Additional reference for modules

console.log('✅ Main app module loaded');

/**
 * Main Application Entry Point
 * Coordinates initialization and module loading
 */

// Main application controller
const MerkelApp = {
    
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
        
        // These will be implemented in later phases:
        // - setupAuthListeners() -> auth module
        // - setupLocationListeners() -> location module
        // - setupMapListeners() -> maps module
        
        // For now, we'll call the original functions temporarily
        if (typeof setupAuthListeners === 'function') {
            setupAuthListeners();
        }
        
        if (typeof setupLocationListeners === 'function') {
            setupLocationListeners();
        }
        
        console.log('✅ Module listeners setup complete');
    },
    
    /**
     * Show authentication container
     */
    showAuth() {
        DOMHelpers.show(AppState.elements.authContainer, 'flex');
        DOMHelpers.hide(AppState.elements.appContainer);
        
        // Call auth module function (will be implemented in Phase 2)
        if (typeof AuthUI !== 'undefined' && AuthUI.showEmailStep) {
            AuthUI.showEmailStep();
        } else if (typeof showEmailStep === 'function') {
            showEmailStep(); // Fallback to original function
        }
    },
    
    /**
     * Show main app container
     */
    showApp() {
        DOMHelpers.hide(AppState.elements.authContainer);
        DOMHelpers.show(AppState.elements.appContainer, 'block');
        
        // Initialize map after showing app (if not already initialized)
        if (!AppState.map && typeof window.google !== 'undefined') {
            if (typeof initMap === 'function') {
                initMap(); // Will be moved to maps module in Phase 3
            }
        }
    },
    
    /**
     * Handle authentication state changes
     */
    onAuthStateChange(user) {
        if (user) {
            // User is signed in
            AppState.setCurrentUser(user);
            
            // Check if email is verified
            if (!user.emailVerified) {
                // Will be handled by auth module in Phase 2
                if (typeof showEmailVerificationStep === 'function') {
                    showEmailVerificationStep(user.email);
                }
                return;
            }
            
            this.showApp();
            DOMHelpers.setText(AppState.elements.userEmailDisplay, user.email);
        } else {
            // User is signed out
            AppState.setCurrentUser(null);
            
            // Only show email step if we're not in the middle of the auth flow
            if (!AppState.isInAuthFlow) {
                this.showAuth();
            }
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    MerkelApp.init();
});

// Export to global scope
window.MerkelApp = MerkelApp;

console.log('✅ Main app module loaded');

/**
 * Main Application Entry Point
 * Coordinates initialization and module loading
 */

// Main application controller
const MerkelApp = {
    
    // Module instances
    authManager: null,
    authUI: null,
    mapsManager: null,
    
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
        
        // Initialize maps module
        this.initializeMapsModule();
        
        // Initialize location modules
        this.initializeLocationModules();
        
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
        // Maps functionality is now handled by maps module
        // Location functionality is now handled by location modules
        this.setupAddressSearchListeners();
        
        console.log('✅ Module listeners setup complete');
    },
    
    /**
     * Setup address search functionality using maps module
     */
    setupAddressSearchListeners() {
        const searchBtn = document.getElementById('search-btn');
        const addressSearch = document.getElementById('address-search');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.handleAddressSearch());
        }
        
        if (addressSearch) {
            addressSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleAddressSearch();
                }
            });
        }
    },
    
    /**
     * Handle address search using maps module
     */
    async handleAddressSearch() {
        const addressSearch = document.getElementById('address-search');
        const searchBtn = document.getElementById('search-btn');
        
        if (!addressSearch || !this.mapsManager) {
            console.error('❌ Address search not available');
            return;
        }
        
        const address = addressSearch.value.trim();
        if (!address) {
            console.warn('⚠️ No address entered');
            return;
        }
        
        // Show loading state
        const originalText = searchBtn ? searchBtn.textContent : '';
        if (searchBtn) {
            searchBtn.textContent = 'Searching...';
            searchBtn.disabled = true;
        }
        
        try {
            const location = await this.mapsManager.performAddressSearch(address);
            console.log('✅ Address search successful:', location);
            
            // Clear search box
            addressSearch.value = '';
            
        } catch (error) {
            console.error('❌ Address search failed:', error);
            alert(error);
        } finally {
            // Reset button state
            if (searchBtn) {
                searchBtn.textContent = originalText;
                searchBtn.disabled = false;
            }
        }
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
        
        // Map initialization is now handled by handleUserAuthenticated when user logs in
    },
    
    /**
     * Handle user authentication (called by auth UI)
     */
    handleUserAuthenticated() {
        console.log('✅ User authenticated, initializing app features...');
        
        const currentUser = this.authManager.getCurrentUser();
        
        // Update maps manager with current user
        if (this.mapsManager) {
            this.mapsManager.setCurrentUser(currentUser);
        }
        
        // Update location manager with current user
        if (this.locationManager) {
            this.locationManager.setCurrentUser(currentUser);
        }
        
        // Initialize map if Google Maps is available and not already initialized
        if (typeof window.google !== 'undefined' && this.mapsManager && !this.mapsManager.isInitialized()) {
            this.mapsManager.initMap();
        }
        
        // Load locations using new location modules
        if (this.locationUI) {
            this.locationUI.loadLocations();
        } else {
            // Fallback to legacy function
            if (typeof loadLocations === 'function') {
                loadLocations();
            }
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
    
    /**
     * Initialize location modules
     */
    initializeLocationModules() {
        console.log('📍 Initializing location modules...');
        
        // Initialize location manager
        this.locationManager = new LocationManager();
        this.locationManager.initialize({
            db: AppState.db,
            storage: AppState.storage,
            auth: AppState.auth
        }, this.mapsManager);
        
        // Initialize location UI
        this.locationUI = new LocationUI();
        this.locationUI.initialize(this.locationManager, this.mapsManager, DOMHelpers);
        
        // Export location UI globally for action button access
        window.locationUI = this.locationUI;
        
        console.log('✅ Location modules initialized');
    },

    /**
     * Initialize maps module
     */
    initializeMapsModule() {
        console.log('🗺️ Initializing maps module...');
        
        // Initialize maps manager
        this.mapsManager = new MapsManager();
        this.mapsManager.initialize(window.AppConfig);
        
        // Set up callbacks
        this.mapsManager.setLocationSelectedCallback((location) => {
            this.handleLocationSelected(location);
        });
        
        this.mapsManager.setLocationClickedCallback((location, locationId) => {
            this.handleLocationClicked(location, locationId);
        });
        
        console.log('✅ Maps module initialized');
    },
    
    /**
     * Handle location selection from maps
     */
    handleLocationSelected(location) {
        console.log('📍 Location selected:', location);
        
        // Use the new location UI to handle location selection
        if (this.locationUI) {
            this.locationUI.updateFormWithMapSelection(location);
            this.locationUI.openLocationModal(location);
        } else {
            // Fallback to legacy function
            if (typeof openLocationModal === 'function') {
                openLocationModal(location);
            }
        }
    },
    
    /**
     * Handle location marker clicks
     */
    handleLocationClicked(location, locationId) {
        console.log('📍 Location clicked:', location.name, locationId);
        
        // Could show location details, edit modal, etc.
        // For now, just center the map on the location
        if (this.mapsManager) {
            this.mapsManager.centerMap(location.lat, location.lng, 15);
        }
    },
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    MerkelApp.init();
});

// Export to global scope
window.MerkelApp = MerkelApp;
window.AppCore = MerkelApp; // Additional reference for modules
window.app = MerkelApp; // Reference for legacy code compatibility

console.log('✅ Main app module loaded');

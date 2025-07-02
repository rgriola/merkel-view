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
        Logger.info('MerkelApp', 'Starting application...');
        Logger.debug('MerkelApp', 'DOM loaded, checking Firebase', {
            firebase: typeof window.firebase,
            apps: window.firebase ? window.firebase.apps.length : 0
        });
        
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
        
        // Set up module listeners
        this.setupModuleListeners();
        
        Logger.success('MerkelApp', 'Application initialized successfully');
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
        Logger.info('MerkelApp', 'Setting up module listeners');
        
        // Authentication is now handled by auth modules
        // Maps functionality is now handled by maps module
        // Location functionality is now handled by location modules
        this.setupAddressSearchListeners();
        this.setupTestButtonListener();
        
        Logger.success('MerkelApp', 'Module listeners setup complete');
    },

    /**
     * Setup test database button listener
     */
    setupTestButtonListener() {
        const testDbBtn = document.getElementById('test-db-btn');
        
        if (testDbBtn) {
            testDbBtn.addEventListener('click', ErrorHandler.safeEventHandler(async () => {
                if (!this.locationManager) {
                    alert('Location manager not initialized');
                    return;
                }
                
                testDbBtn.textContent = 'Testing...';
                testDbBtn.disabled = true;
                
                try {
                    const result = await this.locationManager.testFirestoreConnection();
                    if (result.success) {
                        alert('✅ Database test successful!\n\n' + result.message);
                        Logger.success('MerkelApp', 'Database test passed');
                    } else {
                        alert('❌ Database test failed!\n\n' + result.message);
                        Logger.error('MerkelApp', 'Database test failed', result.message);
                    }
                } catch (error) {
                    alert('❌ Database test error!\n\n' + error.message);
                    Logger.error('MerkelApp', 'Database test error', error);
                } finally {
                    testDbBtn.textContent = 'Test DB';
                    testDbBtn.disabled = false;
                }
            }, 'Database test'));
        }
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
        
        // Enhanced error checking for maps manager
        if (!this.mapsManager) {
            console.error('❌ Maps Manager not available for address search');
            console.log('🔍 MapsManager Diagnosis:');
            console.log('- this.mapsManager exists:', this.mapsManager ? 'Yes' : 'No');
            console.log('- MapsManager initialized:', this.mapsManager?.isInitialized ? 'Yes' : 'No');
            console.log('- Map available:', this.mapsManager?.map ? 'Yes' : 'No');
            
            this.showTemporaryMessage('Search not available. Check console for details.', 'error');
            return;
        }
        
        // Ensure address input exists
        if (!addressSearch) {
            console.error('❌ Address search input not found');
            return;
        }
        
        const address = addressSearch.value.trim();
        if (!address) {
            console.warn('⚠️ No address entered');
            this.showTemporaryMessage('Please enter an address to search', 'warning');
            return;
        }
        
        // Show loading state
        const originalText = searchBtn ? searchBtn.textContent : '';
        if (searchBtn) {
            searchBtn.textContent = 'Searching...';
            searchBtn.disabled = true;
        }
        
        try {
            // Check if maps is initialized before performing search
            if (!this.mapsManager.isInitialized()) {
                throw new Error('Maps not yet initialized. Please try again in a moment.');
            }
            
            const location = await this.mapsManager.performAddressSearch(address);
            console.log('✅ Address search successful:', location);
            
            // Clear search box
            addressSearch.value = '';
            
            // Show success message
            this.showTemporaryMessage(`Found: ${location.address || address}`, 'success');
            
        } catch (error) {
            console.error('❌ Address search failed:', error);
            this.showTemporaryMessage(error.message || error, 'error');
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
        console.log('🔍 Current user:', currentUser ? currentUser.email : 'null');
        
        // Update maps manager with current user
        if (this.mapsManager) {
            this.mapsManager.setCurrentUser(currentUser);
        }
        
        // Update location manager with current user
        if (this.locationManager) {
            console.log('🔍 Setting current user in location manager...');
            this.locationManager.setCurrentUser(currentUser);
        }
        
        // Update location UI with current user
        if (this.locationUI) {
            console.log('🔍 Setting current user in location UI...');
            this.locationUI.setCurrentUser(currentUser);
        }
        
        // Initialize map if Google Maps is available and not already initialized
        if (this.mapsManager && !this.mapsManager.isInitialized()) {
            if (typeof window.google !== 'undefined' && window.google.maps) {
                Logger.info('MerkelApp', 'Initializing map after authentication');
                this.mapsManager.initMap();
            } else {
                Logger.info('MerkelApp', 'Google Maps API not ready, map will initialize when loaded');
            }
        }
        
        // Load locations using new location modules (wait a bit for map to initialize)
        if (this.locationUI) {
            Logger.info('MerkelApp', 'Loading locations via location UI...');
            // Small delay to ensure map is ready
            setTimeout(() => {
                this.locationUI.loadLocations().catch(error => {
                    Logger.error('MerkelApp', 'Failed to load locations', error);
                    alert('Failed to load locations: ' + error.message);
                });
            }, 1000);
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
    
    /**
     * Show a temporary message to the user
     * @param {string} message - The message to show
     * @param {string} type - Message type: 'success', 'error', 'warning', or 'info'
     * @param {number} duration - How long to show the message in ms (default: 3000)
     */
    showTemporaryMessage(message, type = 'info', duration = 3000) {
        if (!message) return;
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message ${type}`;
        messageDiv.textContent = message;
        
        // Style based on type
        const bgColor = type === 'success' ? '#4CAF50' : 
                        type === 'error' ? '#f44336' : 
                        type === 'warning' ? '#ff9800' : '#2196F3';
        
        // Style the message
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1001;
            font-weight: 500;
            max-width: 80%;
            word-wrap: break-word;
        `;
        
        // Add to body
        document.body.appendChild(messageDiv);
        
        // Remove after duration
        setTimeout(() => {
            // Add fade-out animation
            messageDiv.style.transition = 'opacity 0.5s ease';
            messageDiv.style.opacity = '0';
            
            // Remove from DOM after animation
            setTimeout(() => messageDiv.remove(), 500);
        }, duration);
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

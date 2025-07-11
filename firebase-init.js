// firebase-init.js - Dynamic Firebase Initialization
(function() {
    'use strict';
    
    // Wait for config to load
    function initializeFirebase() {
        if (!window.AppConfig) {
            console.warn('App configuration not loaded, retrying...');
            setTimeout(initializeFirebase, 100);
            return;
        }
        
        const config = window.AppConfig;
        
        // Check if demo mode - skip Firebase initialization
        if (config.demoMode) {
            console.log('🎭 Demo mode enabled - Firebase disabled for UI testing');
            
            // Create mock Firebase objects for UI testing
            window.auth = createMockAuth();
            window.db = createMockFirestore();
            window.storage = createMockStorage();
            
            // Dispatch ready event
            const event = new CustomEvent('firebaseReady');
            window.dispatchEvent(event);
            console.log('🎭 Mock Firebase services ready for UI testing');
            return;
        }
        
        const firebaseConfig = config.firebase;
        
        // Validate configuration
        if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-') || firebaseConfig.apiKey.includes('demo-')) {
            console.warn('⚠️ Firebase configuration appears to be using placeholder values');
            console.warn('Please update config.js with your actual Firebase credentials');
            
            // Show user-friendly message
            const warning = document.createElement('div');
            warning.id = 'config-warning';
            warning.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff9800; color: white; padding: 12px; text-align: center; z-index: 9999; font-family: Arial, sans-serif;">
                    ⚠️ <strong>Configuration Required:</strong> Please update config.js with your Firebase credentials. 
                    <a href="#" onclick="window.location.reload()" style="color: white; text-decoration: underline;">Reload</a> or switch to demo mode
                    <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
                </div>
            `;
            document.body.appendChild(warning);
        }
        
        try {
            // Initialize Firebase
            console.log('🔥 Initializing Firebase with config:', firebaseConfig);
            firebase.initializeApp(firebaseConfig);
            
            // Initialize Firebase services
            console.log('🔥 Creating Firebase services...');
            window.auth = firebase.auth();
            window.db = firebase.firestore();
            window.storage = firebase.storage();
            
            console.log('🔥 Firebase services created:');
            console.log('- auth:', window.auth ? '✅' : '❌');
            console.log('- db:', window.db ? '✅' : '❌');
            console.log('- storage:', window.storage ? '✅' : '❌');
            
            // Note: Persistence is handled automatically in Firebase v9+
            // The deprecation warning is harmless and can be ignored
            
            console.log('🔥 Firebase initialized successfully');
            
            // Dispatch custom event to notify app
            window.dispatchEvent(new CustomEvent('firebaseReady'));
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            
            // Show error message to user
            const errorDiv = document.createElement('div');
            errorDiv.innerHTML = `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #f44336; color: white; padding: 20px; border-radius: 8px; z-index: 10000; text-align: center; font-family: Arial, sans-serif;">
                    <h3>❌ Firebase Connection Failed</h3>
                    <p>Please check your configuration and try again.</p>
                    <p><small>Error: ${error.message}</small></p>
                    <button onclick="location.reload()" style="background: white; color: #f44336; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Retry</button>
                </div>
            `;
            document.body.appendChild(errorDiv);
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeFirebase);
    } else {
        initializeFirebase();
    }
    
    // Global initialization function for backwards compatibility
    window.initializeFirebase = initializeFirebase;
    
    // Mock Firebase functions for demo mode
    function createMockAuth() {
        return {
            onAuthStateChanged: function(callback) {
                // Simulate no user logged in initially
                setTimeout(() => callback(null), 100);
                return () => {}; // unsubscribe function
            },
            signInWithEmailAndPassword: function(email, password) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject({
                            code: 'demo/disabled',
                            message: '🎭 Demo Mode: Authentication UI flow completed successfully! To enable real authentication, configure Firebase credentials in config.js'
                        });
                    }, 1000); // Simulate network delay
                });
            },
            createUserWithEmailAndPassword: function(email, password) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject({
                            code: 'demo/disabled',
                            message: '🎭 Demo Mode: Registration UI flow completed successfully! To enable real registration, configure Firebase credentials in config.js'
                        });
                    }, 1500); // Simulate network delay
                });
            },
            sendPasswordResetEmail: function(email) {
                return new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject({
                            code: 'demo/disabled',
                            message: '🎭 Demo Mode: Password reset UI flow completed successfully! To enable real password reset, configure Firebase credentials in config.js'
                        });
                    }, 1200); // Simulate network delay
                });
            },
            signOut: function() {
                return Promise.resolve();
            }
        };
    }
    
    function createMockFirestore() {
        return {
            collection: function(path) {
                return {
                    add: function(data) {
                        return Promise.reject({
                            message: 'Database disabled in demo mode. This is for UI testing only.'
                        });
                    },
                    doc: function(id) {
                        return {
                            set: function(data) {
                                return Promise.resolve();
                            },
                            update: function(data) {
                                return Promise.resolve();
                            },
                            get: function() {
                                return Promise.resolve({
                                    exists: false,
                                    data: () => null
                                });
                            },
                            delete: function() {
                                return Promise.resolve();
                            }
                        };
                    },
                    onSnapshot: function(callback) {
                        // Return empty snapshot
                        setTimeout(() => callback({ forEach: () => {} }), 100);
                        return () => {}; // unsubscribe function
                    },
                    orderBy: function() { return this; },
                    where: function() { return this; },
                    limit: function() { return this; }
                };
            }
        };
    }
    
    function createMockStorage() {
        return {
            ref: function(path) {
                return {
                    put: function(file) {
                        return Promise.reject({
                            message: 'Storage disabled in demo mode. This is for UI testing only.'
                        });
                    },
                    getDownloadURL: function() {
                        return Promise.reject({
                            message: 'Storage disabled in demo mode.'
                        });
                    },
                    delete: function() {
                        return Promise.resolve();
                    }
                };
            }
        };
    }
    
    // Start initialization
    initializeFirebase();
})();

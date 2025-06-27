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
        
        const firebaseConfig = window.AppConfig.firebase;
        
        // Validate configuration
        if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes('your-') || firebaseConfig.apiKey.includes('demo-')) {
            console.warn('⚠️ Firebase configuration appears to be using placeholder values');
            console.warn('Please update config.js with your actual Firebase credentials');
            
            // Show user-friendly message
            const warning = document.createElement('div');
            warning.id = 'config-warning';
            warning.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; right: 0; background: #ff9800; color: white; padding: 12px; text-align: center; z-index: 9999; font-family: Arial, sans-serif;">
                    ⚠️ <strong>Configuration Required:</strong> Please update config.js with your Firebase credentials. 
                    <a href="https://github.com/rgriola/merkel-view#setup" target="_blank" style="color: white; text-decoration: underline;">See Setup Guide</a>
                    <button onclick="this.parentElement.parentElement.remove()" style="float: right; background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
                </div>
            `;
            document.body.appendChild(warning);
        }
        
        try {
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            
            // Initialize Firebase services
            window.auth = firebase.auth();
            window.db = firebase.firestore();
            window.storage = firebase.storage();
            
            // Set up persistence
            window.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .catch((error) => {
                    console.warn('Could not enable auth persistence:', error);
                });
            
            // Enable Firestore offline persistence
            window.db.enablePersistence({ synchronizeTabs: true })
                .catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                    } else if (err.code === 'unimplemented') {
                        console.warn('The current browser does not support persistence.');
                    }
                });
            
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
    
})();

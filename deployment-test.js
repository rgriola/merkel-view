// Test script to verify Merkel View deployment
// Run this in the browser console on https://rgriola.github.io/Merkel-View/

console.log('🧪 Starting Merkel View Deployment Test...');

// Test 1: Check if CONFIG is loaded
console.log('1. Checking CONFIG loading...');
if (typeof window.CONFIG !== 'undefined') {
    console.log('✅ CONFIG loaded successfully');
    console.log('📋 Environment:', window.CONFIG.environment);
    console.log('🔥 Firebase config:', window.CONFIG.firebase ? 'Present' : 'Missing');
    console.log('🗺️  Google Maps config:', window.CONFIG.googleMaps ? 'Present' : 'Missing');
} else if (typeof window.AppConfig !== 'undefined') {
    console.log('✅ AppConfig loaded successfully');
    console.log('📋 Environment:', window.Environment);
    console.log('🔥 Firebase config:', window.AppConfig.firebase ? 'Present' : 'Missing');
    console.log('🗺️  Google Maps config:', window.AppConfig.googleMaps ? 'Present' : 'Missing');
} else {
    console.log('❌ Neither CONFIG nor AppConfig found');
}

// Test 2: Check Firebase initialization
console.log('\n2. Checking Firebase initialization...');
if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
    console.log('✅ Firebase initialized successfully');
    console.log('🏗️  Firebase app:', firebase.app().name);
    
    // Test Firebase Auth
    if (firebase.auth) {
        console.log('✅ Firebase Auth available');
    } else {
        console.log('❌ Firebase Auth not available');
    }
    
    // Test Firestore
    if (firebase.firestore) {
        console.log('✅ Firestore available');
    } else {
        console.log('❌ Firestore not available');
    }
} else {
    console.log('❌ Firebase not initialized');
}

// Test 3: Check Google Maps
console.log('\n3. Checking Google Maps...');
if (typeof google !== 'undefined' && google.maps) {
    console.log('✅ Google Maps API loaded');
} else {
    console.log('⏳ Google Maps API not yet loaded (this is normal on initial load)');
}

// Test 4: Check UI elements
console.log('\n4. Checking UI elements...');
const authContainer = document.getElementById('auth-container');
const mapContainer = document.getElementById('map-container');
const emailInput = document.getElementById('email-input');

if (authContainer) {
    console.log('✅ Auth container found');
    console.log('👁️  Auth container visible:', authContainer.style.display !== 'none');
} else {
    console.log('❌ Auth container not found');
}

if (mapContainer) {
    console.log('✅ Map container found');
    console.log('👁️  Map container visible:', mapContainer.style.display !== 'none');
} else {
    console.log('❌ Map container not found');
}

if (emailInput) {
    console.log('✅ Email input found');
} else {
    console.log('❌ Email input not found');
}

// Test 5: Check for JavaScript errors
console.log('\n5. JavaScript error check...');
const originalError = console.error;
let errorCount = 0;
console.error = function(...args) {
    errorCount++;
    originalError.apply(console, args);
};

setTimeout(() => {
    console.error = originalError;
    if (errorCount === 0) {
        console.log('✅ No JavaScript errors detected');
    } else {
        console.log(`⚠️  ${errorCount} JavaScript errors detected`);
    }
}, 1000);

console.log('\n🏁 Test complete! Check the logs above for any issues.');
console.log('\n🔗 To test features manually:');
console.log('   1. Try registering a new account');
console.log('   2. Try logging in with existing credentials');
console.log('   3. Test password reset');
console.log('   4. Once logged in, test map interaction and location creation');

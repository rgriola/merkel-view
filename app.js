// Global variables
let currentUser = null;
let map = null;
let geocoder = null;
let tempMarker = null;
let selectedLocation = null;
let auth, db, storage;

// DOM elements (will be queried when needed)
let authContainer, appContainer, loginForm, emailInput, passwordInput;
let registerBtn, logoutBtn, authStatus, userEmailDisplay;
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
    // Initialize Firebase first
    initializeFirebase();
    
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
    
    console.log('App initialized');
});

// Initialize DOM elements
function initializeDOMElements() {
    // Auth elements
    authContainer = document.getElementById('auth-container');
    appContainer = document.getElementById('app-container');
    loginForm = document.getElementById('login-form');
    emailInput = document.getElementById('email');
    passwordInput = document.getElementById('password');
    registerBtn = document.getElementById('register-btn');
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
function setupAuthListeners() {
    // Listen for authentication state changes
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in
            currentUser = user;
            showApp();
            if (userEmailDisplay) {
                userEmailDisplay.textContent = user.email;
            }
        } else {
            // User is signed out
            currentUser = null;
            showAuth();
        }
    });

    // Login form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });

    // Register button
    registerBtn.addEventListener('click', function(e) {
        e.preventDefault();
        register();
    });

    // Logout button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            auth.signOut();
        });
    }
}

// Show authentication form
function showAuth() {
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
}

// Show main app
function showApp() {
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    // Initialize map after showing app (if not already initialized)
    if (!map && typeof window.google !== 'undefined') {
        initMap();
    }
}

// Login function
function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showAuthStatus('Please enter both email and password', 'error');
        return;
    }
    
    showAuthStatus('Logging in...', 'info');
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User logged in:', userCredential.user.email);
            showAuthStatus('Login successful!', 'success');
        })
        .catch((error) => {
            console.error('Login error:', error);
            showAuthStatus('Login failed: ' + error.message, 'error');
        });
}

// Register function
function register() {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showAuthStatus('Please enter both email and password', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAuthStatus('Password must be at least 6 characters', 'error');
        return;
    }
    
    showAuthStatus('Creating account...', 'info');
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('User registered:', userCredential.user.email);
            showAuthStatus('Account created successfully!', 'success');
            
            // Save user profile to Firestore (optional, comment out if causing issues)
            return db.collection('users').doc(userCredential.user.uid).set({
                email: userCredential.user.email,
                name: userCredential.user.email.split('@')[0],
                role: 'user',
                dateCreated: firebase.firestore.FieldValue.serverTimestamp()
            }).catch((profileError) => {
                // Don't fail registration if profile creation fails
                console.warn('Could not create user profile:', profileError);
                return Promise.resolve();
            });
        })
        .then(() => {
            console.log('Registration complete');
        })
        .catch((error) => {
            console.error('Registration error:', error);
            let errorMessage = error.message;
            
            // Handle specific error codes
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'An account with this email already exists';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address';
            }
            
            showAuthStatus('Registration failed: ' + errorMessage, 'error');
        });
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
    if (!db || !currentUser) return;
    
    db.collection('locations')
        .orderBy('dateAdded', 'desc')
        .onSnapshot((snapshot) => {
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
                
                // Apply current filters
                applyLocationFilters();
            }
        }, (error) => {
            console.error('Error loading locations:', error);
        });
}

// Add location to the sidebar list
function addLocationToList(location, id) {
    const locationList = document.getElementById('location-list');
    if (!locationList) return;
    
    const categoryEmojis = {
        restaurant: '🍽️',
        hotel: '🏨',
        attraction: '🎢',
        business: '🏢',
        landmark: '🏛️',
        other: '📍'
    };
    
    const emoji = categoryEmojis[location.category] || '📍';
    
    const locationElement = document.createElement('div');
    locationElement.className = 'location-item';
    locationElement.innerHTML = `
        <div class="location-header">
            <h4>${emoji} ${location.name}</h4>
            <span class="category-badge" style="background: ${getCategoryColor(location.category)}">
                ${location.category}
            </span>
        </div>
        ${location.photoURL ? `
            <div class="location-photo" style="margin: 10px 0;">
                <img src="${location.photoURL}" alt="${location.name}" 
                     style="width: 100%; max-height: 150px; object-fit: cover; border-radius: 6px; cursor: pointer;"
                     onclick="openPhotoModal('${location.photoURL}', '${location.name}')">
            </div>
        ` : ''}
        <p class="location-address">📍 ${location.address || `${location.city}, ${location.state}`}</p>
        ${location.notes ? `<p class="location-notes">💭 ${location.notes}</p>` : ''}
        <div class="location-meta">
            <small>Added by: ${location.addedBy}</small>
            <button class="view-on-map-btn" onclick="focusLocationOnMap(${location.lat}, ${location.lng})">
                View on Map
            </button>
        </div>
    `;
    
    // Enhanced location management
    addEditDeleteButtons(locationElement, location, id);
    
    locationList.appendChild(locationElement);
}

// Enhanced location management
function addEditDeleteButtons(locationElement, location, id) {
    if (!currentUser || location.userId !== currentUser.uid) return;
    
    const metaDiv = locationElement.querySelector('.location-meta');
    if (metaDiv) {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'location-actions';
        actionsDiv.style.cssText = 'margin-top: 8px; display: flex; gap: 5px;';
        
        actionsDiv.innerHTML = `
            <button class="edit-location-btn" onclick="editLocation('${id}')" 
                    style="background: #2196F3; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                ✏️ Edit
            </button>
            <button class="delete-location-btn" onclick="deleteLocation('${id}')" 
                    style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                🗑️ Delete
            </button>
        `;
        
        metaDiv.appendChild(actionsDiv);
    }
}

// Edit location function
window.editLocation = function(locationId) {
    db.collection('locations').doc(locationId).get()
        .then((doc) => {
            if (doc.exists) {
                const location = doc.data();
                
                // Set up for editing
                selectedLocation = {
                    lat: location.lat,
                    lng: location.lng,
                    address: location.address,
                    city: location.city,
                    state: location.state
                };
                
                // Open modal with existing data
                openLocationModal(selectedLocation);
                
                // Pre-fill all form fields
                document.getElementById('location-name').value = location.name;
                document.getElementById('location-category').value = location.category;
                document.getElementById('location-notes').value = location.notes || '';
                
                // Change form to edit mode
                const submitBtn = document.querySelector('#location-form button[type="submit"]');
                submitBtn.textContent = 'Update Location';
                submitBtn.dataset.editing = locationId;
                
                // Update modal title
                document.querySelector('#location-modal h2').textContent = 'Edit Location';
            }
        })
        .catch((error) => {
            console.error('Error fetching location:', error);
            alert('Error loading location for editing');
        });
};

// Delete location function
window.deleteLocation = function(locationId) {
    if (!confirm('Are you sure you want to delete this location? This action cannot be undone.')) {
        return;
    }
    
    db.collection('locations').doc(locationId).get()
        .then((doc) => {
            if (doc.exists) {
                const location = doc.data();
                
                // Delete photo from storage if exists
                if (location.photoFileName) {
                    const storage = firebase.storage();
                    storage.ref(location.photoFileName).delete()
                        .catch((error) => console.warn('Error deleting photo:', error));
                }
                
                // Delete location document
                return db.collection('locations').doc(locationId).delete();
            }
        })
        .then(() => {
            showTemporaryMessage('Location deleted successfully', 'success');
            
            // Remove marker from map
            AppState.removeMarker(locationId);
        })
        .catch((error) => {
            console.error('Error deleting location:', error);
            alert('Error deleting location: ' + error.message);
        });
};

//# sourceMappingURL=app.js.map

/**
 * Maps Manager
 * Handles all Google Maps functionality including map initialization, 
 * geocoding, markers, and address search
 */

class MapsManager {
    constructor() {
        this.map = null;
        this.geocoder = null;
        this.tempMarker = null;
        this.locationMarkers = new Map(); // Track location markers
        this.selectedLocation = null;
        this.currentUser = null;
        
        // Configuration
        this.defaultLocation = { lat: 39.8283, lng: -98.5795 }; // Center of US
        this.defaultZoom = 4;
        this.searchZoom = 15;
        
        // Callbacks
        this.onLocationSelected = null;
        this.onLocationClicked = null;
    }

    /**
     * Initialize the maps manager
     */
    initialize(appConfig) {
        this.appConfig = appConfig;
        console.log('🗺️ MapsManager initialized');
        return this;
    }

    /**
     * Initialize Google Maps
     */
    initMap() {
        console.log('🗺️ Initializing Google Maps...');
        
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            console.error('❌ Map element not found');
            return false;
        }
        
        // Create map with custom styling
        this.map = new google.maps.Map(mapElement, {
            zoom: this.defaultZoom,
            center: this.defaultLocation,
            mapTypeId: 'roadmap',
            styles: this.getMapStyles()
        });
        
        // Initialize geocoder
        this.geocoder = new google.maps.Geocoder();
        
        // Test geocoding availability
        this.testGeocodingAPI();
        
        // Add map click listener
        this.map.addListener('click', (event) => {
            this.handleMapClick(event.latLng);
        });
        
        // Setup address autocomplete
        this.setupAddressAutocomplete();
        
        console.log('✅ Google Maps initialized successfully');
        return true;
    }

    /**
     * Get custom map styles
     */
    getMapStyles() {
        return [
            {
                featureType: 'administrative',
                elementType: 'geometry',
                stylers: [{ visibility: 'off' }]
            },
            {
                featureType: 'poi',
                stylers: [{ visibility: 'off' }]
            }
        ];
    }

    /**
     * Test geocoding API availability
     */
    testGeocodingAPI() {
        setTimeout(() => {
            if (!this.geocoder) return;
            
            this.geocoder.geocode({ address: 'New York, NY' }, (results, status) => {
                console.log('🔍 Geocoding test status:', status);
                
                if (status === 'REQUEST_DENIED' || status === 'ERROR') {
                    console.warn('⚠️ Geocoding API not available:', status);
                    this.disableAddressSearch();
                    this.geocoder = null;
                } else if (status === 'OK' || status === 'ZERO_RESULTS') {
                    console.log('✅ Geocoding API is working properly');
                    this.enableAddressSearch();
                }
            });
        }, 1000);
    }

    /**
     * Disable address search functionality
     */
    disableAddressSearch() {
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
    }

    /**
     * Enable address search functionality
     */
    enableAddressSearch() {
        const warning = document.getElementById('geocoding-warning');
        if (warning) warning.style.display = 'none';
    }

    /**
     * Handle map click events
     */
    handleMapClick(latLng) {
        console.log('🗺️ Map clicked at:', latLng.lat(), latLng.lng());
        
        if (!this.currentUser) {
            console.warn('⚠️ User not authenticated, ignoring map click');
            return;
        }
        
        console.log('📍 Creating temporary marker...');
        
        // Create temporary marker
        this.addTemporaryMarker(latLng);
        
        // Create location data
        this.selectedLocation = {
            lat: latLng.lat(),
            lng: latLng.lng(),
            address: `Coordinates: ${latLng.lat().toFixed(6)}, ${latLng.lng().toFixed(6)}`
        };
        
        // Try reverse geocoding if available
        if (this.geocoder) {
            this.reverseGeocode(latLng);
        }
        
        // Notify callback
        if (this.onLocationSelected) {
            this.onLocationSelected(this.selectedLocation);
        }
    }

    /**
     * Perform reverse geocoding
     */
    reverseGeocode(latLng) {
        this.geocoder.geocode({ location: latLng }, (results, status) => {
            if (status === 'OK' && results[0]) {
                this.selectedLocation.address = results[0].formatted_address;
                
                // Parse address components
                const addressComponents = this.parseAddressComponents(results[0].address_components);
                this.selectedLocation = { ...this.selectedLocation, ...addressComponents };
                
                // Update UI if location modal is open
                this.updateLocationModal();
                
                console.log('✅ Reverse geocoding successful:', this.selectedLocation.address);
            } else {
                console.warn('⚠️ Reverse geocoding failed or not available:', status);
            }
        });
    }

    /**
     * Update location modal with geocoded data
     */
    updateLocationModal() {
        const locationModal = document.getElementById('location-modal');
        if (locationModal && locationModal.style.display === 'flex') {
            const addressField = document.getElementById('location-address');
            const cityField = document.getElementById('location-city');
            const stateField = document.getElementById('location-state');
            
            if (addressField) addressField.value = this.selectedLocation.address || '';
            if (cityField && this.selectedLocation.city) cityField.value = this.selectedLocation.city;
            if (stateField && this.selectedLocation.state) stateField.value = this.selectedLocation.state;
        }
    }

    /**
     * Perform address search
     */
    performAddressSearch(address) {
        console.log('🔍 Performing address search:', address);
        
        if (!address || !address.trim()) {
            console.warn('⚠️ No address provided for search');
            return Promise.reject('No address provided');
        }
        
        if (!this.geocoder) {
            console.error('❌ Geocoder not available');
            return Promise.reject('Address search is not available. Please enable the Geocoding API in Google Cloud Console.');
        }
        
        return new Promise((resolve, reject) => {
            this.geocoder.geocode({ address: address }, (results, status) => {
                console.log('🔍 Geocoding result:', status, results);
                
                if (status === 'OK' && results[0]) {
                    const location = results[0].geometry.location;
                    console.log('✅ Location found:', location.lat(), location.lng());
                    
                    // Center map on result
                    this.map.setCenter(location);
                    this.map.setZoom(this.searchZoom);
                    
                    // Set selected location data
                    this.selectedLocation = {
                        lat: location.lat(),
                        lng: location.lng(),
                        address: results[0].formatted_address
                    };
                    
                    // Parse address components
                    const addressComponents = this.parseAddressComponents(results[0].address_components);
                    this.selectedLocation = { ...this.selectedLocation, ...addressComponents };
                    
                    // Add temporary marker
                    this.addTemporaryMarker(location);
                    
                    console.log('✅ Address search successful:', this.selectedLocation);
                    resolve(this.selectedLocation);
                    
                    // Notify callback
                    if (this.onLocationSelected) {
                        this.onLocationSelected(this.selectedLocation);
                    }
                } else {
                    console.error('❌ Address search failed:', status);
                    reject('Address not found. Please try a different search term or click on the map to add a location manually.');
                }
            });
        });
    }

    /**
     * Setup address autocomplete
     */
    setupAddressAutocomplete() {
        console.log('🔍 Setting up address autocomplete');
        
        const addressSearch = document.getElementById('address-search');
        if (!addressSearch) {
            console.warn('⚠️ Address search input not found, cannot setup autocomplete');
            return;
        }
        
        // Check if Google Maps Places library is available
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.warn('⚠️ Google Maps Places API not available, skipping autocomplete setup');
            return;
        }
        
        try {
            // Create autocomplete instance
            const autocomplete = new google.maps.places.Autocomplete(addressSearch, {
                types: ['geocode'], // Restrict to addresses
                fields: ['geometry', 'formatted_address', 'address_components']
            });
            
            // Bias autocomplete to current map viewport
            if (this.map) {
                autocomplete.bindTo('bounds', this.map);
            }
            
            // Listen for place selection
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                console.log('🔍 Autocomplete place selected:', place);
                
                if (!place.geometry) {
                    console.warn('⚠️ No geometry available for selected place');
                    return;
                }
                
                // Center map on selected place
                if (place.geometry.viewport) {
                    this.map.fitBounds(place.geometry.viewport);
                } else {
                    this.map.setCenter(place.geometry.location);
                    this.map.setZoom(this.searchZoom);
                }
                
                // Set selected location data
                this.selectedLocation = {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng(),
                    address: place.formatted_address
                };
                
                // Parse address components if available
                if (place.address_components) {
                    const addressComponents = this.parseAddressComponents(place.address_components);
                    this.selectedLocation = { ...this.selectedLocation, ...addressComponents };
                }
                
                // Add temporary marker
                this.addTemporaryMarker(place.geometry.location);
                
                // Notify callback
                if (this.onLocationSelected) {
                    this.onLocationSelected(this.selectedLocation);
                }
            });
            
            console.log('✅ Address autocomplete setup complete');
            
        } catch (error) {
            console.warn('⚠️ Failed to setup address autocomplete:', error);
            console.log('Falling back to manual search only');
        }
    }

    /**
     * Parse address components from Google Maps API
     */
    parseAddressComponents(components) {
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

    /**
     * Add temporary marker for location selection
     */
    addTemporaryMarker(latLng) {
        console.log('📍 Adding temporary marker at:', latLng);
        
        // Remove previous temporary marker
        this.clearTemporaryMarker();
        
        // Create custom pin element
        const tempPinElement = new google.maps.marker.PinElement({
            background: '#FF5722',
            borderColor: '#FFFFFF',
            glyph: '📍',
            scale: 1.2
        });
        
        // Add temporary marker using AdvancedMarkerElement
        this.tempMarker = new google.maps.marker.AdvancedMarkerElement({
            position: latLng,
            map: this.map,
            title: 'Click to add location here',
            content: tempPinElement.element
        });
        
        console.log('✅ Temporary marker added');
    }

    /**
     * Clear temporary marker
     */
    clearTemporaryMarker() {
        if (this.tempMarker) {
            this.tempMarker.map = null;
            this.tempMarker = null;
        }
    }

    /**
     * Add location marker to map
     */
    addLocationMarker(location, locationId) {
        if (!this.map || !location.lat || !location.lng) {
            console.warn('⚠️ Cannot add location marker: invalid data');
            return null;
        }
        
        try {
            // Create custom pin element for location
            const pinElement = new google.maps.marker.PinElement({
                background: '#4CAF50',
                borderColor: '#FFFFFF',
                glyph: '📍',
                scale: 1.0
            });
            
            // Create marker
            const marker = new google.maps.marker.AdvancedMarkerElement({
                position: { lat: location.lat, lng: location.lng },
                map: this.map,
                title: location.name || 'Location',
                content: pinElement.element
            });
            
            // Add click listener
            marker.addListener('click', () => {
                if (this.onLocationClicked) {
                    this.onLocationClicked(location, locationId);
                }
            });
            
            // Store marker reference
            if (locationId) {
                this.locationMarkers.set(locationId, marker);
            }
            
            console.log('✅ Location marker added:', location.name);
            return marker;
            
        } catch (error) {
            console.error('❌ Error adding location marker:', error);
            return null;
        }
    }

    /**
     * Add location to map (legacy compatibility method)
     * This is a wrapper for addLocationMarker to maintain compatibility with existing code
     */
    addLocationToMap(location) {
        return this.addLocationMarker(location);
    }

    /**
     * Remove location marker from map
     */
    removeLocationMarker(locationId) {
        const marker = this.locationMarkers.get(locationId);
        if (marker) {
            marker.map = null;
            this.locationMarkers.delete(locationId);
            console.log('✅ Location marker removed:', locationId);
        }
    }

    /**
     * Clear all location markers
     */
    clearLocationMarkers() {
        this.locationMarkers.forEach(marker => {
            marker.map = null;
        });
        this.locationMarkers.clear();
        console.log('✅ All location markers cleared');
    }

    /**
     * Set current user for authentication checks
     */
    setCurrentUser(user) {
        this.currentUser = user;
        console.log('👤 Maps manager user updated:', user ? user.email : 'none');
    }

    /**
     * Set callback for location selection
     */
    setLocationSelectedCallback(callback) {
        this.onLocationSelected = callback;
    }

    /**
     * Set callback for location marker clicks
     */
    setLocationClickedCallback(callback) {
        this.onLocationClicked = callback;
    }

    /**
     * Get current selected location
     */
    getSelectedLocation() {
        return this.selectedLocation;
    }

    /**
     * Clear selected location
     */
    clearSelectedLocation() {
        this.selectedLocation = null;
        this.clearTemporaryMarker();
    }

    /**
     * Center map on coordinates
     */
    centerMap(lat, lng, zoom = this.defaultZoom) {
        if (this.map) {
            this.map.setCenter({ lat, lng });
            this.map.setZoom(zoom);
        }
    }

    /**
     * Check if maps is initialized
     */
    isInitialized() {
        return this.map !== null;
    }

    /**
     * Get map instance (for advanced usage)
     */
    getMap() {
        return this.map;
    }
}

// Export as global for now, will be converted to ES modules later
window.MapsManager = MapsManager;

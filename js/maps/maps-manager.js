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
        Logger.info('MapsManager', 'Maps manager initialized');
        return this;
    }

    /**
     * Initialize Google Maps
     */
    initMap() {
        // Check if Google Maps API is available
        if (typeof google === 'undefined' || !google.maps) {
            Logger.warn('MapsManager', 'Google Maps API not yet available, retrying...');
            // Retry after a short delay
            setTimeout(() => this.initMap(), 500);
            return false;
        }

        Logger.info('MapsManager', 'Initializing Google Maps');
        
        const mapElement = document.getElementById('map');
        if (!mapElement) {
            Logger.error('MapsManager', 'Map element not found');
            return false;
        }

        try {
            // Create map with custom styling
            this.map = new google.maps.Map(mapElement, {
                zoom: this.defaultZoom,
                center: this.defaultLocation,
                mapTypeId: 'roadmap',
                styles: this.getMapStyles(),
                gestureHandling: 'greedy',
                zoomControl: true,
                mapTypeControl: false,
                scaleControl: true,
                streetViewControl: false,
                rotateControl: false,
                fullscreenControl: true
            });
            
            // Initialize geocoder with error handling
            try {
                this.geocoder = new google.maps.Geocoder();
                console.log('✅ Geocoder initialized successfully');
                
                // Test geocoding availability
                this.testGeocodingAPI();
            } catch (geocoderError) {
                console.error('❌ Failed to initialize Geocoder:', geocoderError);
                this.geocoder = null;
                
                // Show warning
                const geocodingWarning = document.getElementById('geocoding-warning');
                if (geocodingWarning) {
                    geocodingWarning.style.display = 'block';
                }
            }
            
            // Add map click listener
            this.map.addListener('click', (event) => {
                this.handleMapClick(event.latLng);
            });
            
            // Setup address autocomplete
            this.setupAddressAutocomplete();
            
            Logger.success('MapsManager', 'Google Maps initialized successfully');
            
            // Load locations after map is ready
            this.loadExistingLocations();
            
            return true;
        } catch (error) {
            Logger.error('MapsManager', 'Failed to initialize Google Maps', error);
            
            // Show error in map container
            mapElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #ffebee; color: #c62828; text-align: center; padding: 20px; border-radius: 8px; border: 2px solid #ef5350;">
                    <div>
                        <h3>❌ Google Maps Error</h3>
                        <p>Unable to load Google Maps</p>
                        <p><small>Error: ${error.message}</small></p>
                        <button onclick="location.reload()" style="background: #c62828; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Retry</button>
                    </div>
                </div>
            `;
            
            return false;
        }
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
            if (!this.geocoder) {
                console.error('❌ Cannot test geocoding: Geocoder not initialized');
                this.disableAddressSearch();
                return;
            }
            
            console.log('🔍 Testing Geocoding API availability...');
            
            // Use try/catch to handle potential errors
            try {
                this.geocoder.geocode({ address: 'New York, NY' }, (results, status) => {
                    console.log('🔍 Geocoding test status:', status);
                    
                    if (status === 'REQUEST_DENIED' || status === 'ERROR' || status === 'UNKNOWN_ERROR') {
                        console.warn('⚠️ Geocoding API not available:', status);
                        this.disableAddressSearch();
                        this.geocoder = null;
                        
                        // Show diagnostic information in console
                        console.error('📌 Geocoding API Troubleshooting Guide:');
                        console.error('1. Ensure Geocoding API is enabled in Google Cloud Console');
                        console.error('2. Check if your API key has any restrictions');
                        console.error('3. Make sure billing is enabled for your Google Cloud project');
                        
                    } else if (status === 'OK' || status === 'ZERO_RESULTS') {
                        console.log('✅ Geocoding API is working properly');
                        this.enableAddressSearch();
                    } else {
                        console.warn('⚠️ Unexpected geocoding status:', status);
                        this.enableAddressSearch(); // Try to enable anyway
                    }
                });
            } catch (error) {
                console.error('❌ Error testing geocoding API:', error);
                this.disableAddressSearch();
                this.geocoder = null;
            }
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
            return Promise.reject(new Error('Please enter an address to search'));
        }
        
        if (!this.map) {
            console.error('❌ Map not initialized');
            return Promise.reject(new Error('Map not yet initialized. Please try again in a moment.'));
        }
        
        if (!this.geocoder) {
            console.error('❌ Geocoder not available');
            return Promise.reject(new Error('Address search is not available. Please enable the Geocoding API in Google Cloud Console.'));
        }
        
        return new Promise((resolve, reject) => {
            try {
                this.geocoder.geocode({ address: address }, (results, status) => {
                    console.log('🔍 Geocoding result:', status, results);
                    
                    if (status === 'OK' && results && results.length > 0 && results[0].geometry) {
                        try {
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
                            const addressComponents = this.parseAddressComponents(results[0].address_components || []);
                            this.selectedLocation = { ...this.selectedLocation, ...addressComponents };
                            
                            // Add temporary marker
                            this.addTemporaryMarker(location);
                            
                            console.log('✅ Address search successful:', this.selectedLocation);
                            resolve(this.selectedLocation);
                            
                            // Notify callback
                            if (this.onLocationSelected) {
                                this.onLocationSelected(this.selectedLocation);
                            }
                        } catch (processingError) {
                            console.error('❌ Error processing geocoding results:', processingError);
                            reject(new Error('Error processing location data. Please try again.'));
                        }
                    } else {
                        let errorMessage = 'Address not found. Please try a different search term or click on the map to add a location manually.';
                        
                        if (status === 'ZERO_RESULTS') {
                            errorMessage = 'No results found for this address. Try a less specific search.';
                        } else if (status === 'REQUEST_DENIED') {
                            errorMessage = 'Address search is not available. Please ensure the Geocoding API is enabled.';
                        } else if (status === 'OVER_QUERY_LIMIT') {
                            errorMessage = 'Search limit exceeded. Please try again later.';
                        }
                        
                        console.error('❌ Address search failed:', status);
                        reject(new Error(errorMessage));
                    }
                });
            } catch (error) {
                console.error('❌ Geocoding API error:', error);
                reject(new Error('Error connecting to geocoding service. Please try again later.'));
            }
        });
    }

    /**
     * Setup address autocomplete
     */
    setupAddressAutocomplete() {
        console.log('🔍 Setting up address autocomplete with new PlaceAutocompleteElement');
        
        const addressSearchContainer = document.getElementById('address-search').parentElement;
        const originalInput = document.getElementById('address-search');
        
        if (!originalInput) {
            console.warn('⚠️ Address search input not found, cannot setup autocomplete');
            return;
        }
        
        // Check if Google Maps Places library is available
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.warn('⚠️ Google Maps Places API not available, skipping autocomplete setup');
            
            // Add diagnostic info
            console.error('🔍 Places API Diagnosis:');
            console.error('- google object:', typeof google !== 'undefined' ? '✅ Available' : '❌ Missing');
            console.error('- google.maps:', typeof google !== 'undefined' && typeof google.maps !== 'undefined' ? '✅ Available' : '❌ Missing');
            console.error('- google.maps.places:', typeof google !== 'undefined' && typeof google.maps !== 'undefined' && 
                typeof google.maps.places !== 'undefined' ? '✅ Available' : '❌ Missing');
            console.error('Please enable the Places API in the Google Cloud Console');
            
            // Show a warning on the input
            originalInput.setAttribute('placeholder', 'Places API unavailable - manual entry only');
            originalInput.style.backgroundColor = '#fff3e0';
            originalInput.style.borderColor = '#ff9800';
            
            // Add a simple manual geocoding capability
            originalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.geocodeManualAddress(originalInput.value);
                }
            });
            
            return;
        }
        
        try {
            // Check specifically for PlaceAutocompleteElement support (new Places API)
            if (!google.maps.places.PlaceAutocompleteElement) {
                console.warn('⚠️ New Places API (PlaceAutocompleteElement) not available, falling back to legacy');
                throw new Error('PlaceAutocompleteElement not available - you may need to enable the new Places API');
            }
            
            // Use new PlaceAutocompleteElement (stable, production-ready)
            this.setupNewPlaceAutocomplete(addressSearchContainer, originalInput);
            console.log('✅ Address autocomplete setup complete with new PlaceAutocompleteElement');
            
        } catch (error) {
            console.warn('⚠️ Failed to setup new PlaceAutocompleteElement, falling back to legacy:', error);
            this.setupLegacyAutocomplete(originalInput);
        }
    }

    /**
     * Setup using new PlaceAutocompleteElement (stable production API)
     */
    setupNewPlaceAutocomplete(container, originalInput) {
        try {
            // Create the new PlaceAutocompleteElement
            const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
                locationBias: this.map ? this.map.getBounds() : null,
                componentRestrictions: { country: 'us' }, // Adjust as needed
                types: ['geocode'] // Restrict to addresses
            });
            
            // Copy styling and attributes from original input
            placeAutocomplete.id = 'place-autocomplete-element';
            placeAutocomplete.placeholder = originalInput.placeholder || 'Enter address...';
            placeAutocomplete.className = originalInput.className;
            
            // Copy relevant styles
            if (originalInput.style.cssText) {
                const styles = originalInput.style;
                placeAutocomplete.style.width = styles.width || '100%';
                placeAutocomplete.style.padding = styles.padding;
                placeAutocomplete.style.border = styles.border;
                placeAutocomplete.style.borderRadius = styles.borderRadius;
                placeAutocomplete.style.fontSize = styles.fontSize;
            }
            
            // Replace the original input with the new element
            container.replaceChild(placeAutocomplete, originalInput);
            
            // Listen for place selection with new event
            placeAutocomplete.addEventListener('gmp-placeselect', async (event) => {
                console.log('🔍 New PlaceAutocompleteElement place selected:', event);
                
                const place = event.place;
                
                if (!place) {
                    console.warn('⚠️ No place data available from selection');
                    return;
                }
                
                // Fetch the fields we need
                await place.fetchFields({
                    fields: ['displayName', 'formattedAddress', 'location', 'viewport', 'addressComponents']
                });
                
                this.handleNewPlaceSelection(place);
            });
            
            this.autocompleteElement = placeAutocomplete;
            console.log('✅ Using new PlaceAutocompleteElement API (stable)');
            
        } catch (error) {
            console.error('❌ Failed to setup new PlaceAutocompleteElement:', error);
            throw error; // Re-throw to trigger fallback
        }
    }

    /**
     * Handle place selection from new PlaceAutocompleteElement
     */
    handleNewPlaceSelection(place) {
        console.log('🗺️ Handling new place selection:', place);
        
        // Center map on selected place
        if (place.viewport) {
            this.map.fitBounds(place.viewport);
        } else if (place.location) {
            this.map.setCenter(place.location);
            this.map.setZoom(this.searchZoom);
        }
        
        // Set selected location data (convert to our format)
        this.selectedLocation = {
            lat: place.location.lat(),
            lng: place.location.lng(),
            address: place.formattedAddress
        };
        
        // Parse address components if available
        if (place.addressComponents) {
            const addressComponents = this.parseNewAddressComponents(place.addressComponents);
            this.selectedLocation = { ...this.selectedLocation, ...addressComponents };
        }
        
        // Add temporary marker
        this.addTemporaryMarker(place.location);
        
        // Notify callback
        if (this.onLocationSelected) {
            this.onLocationSelected(this.selectedLocation);
        }
    }

    /**
     * Parse address components from new API format
     */
    parseNewAddressComponents(components) {
        const parsed = {
            city: '',
            state: '',
            country: '',
            postalCode: ''
        };
        
        components.forEach(component => {
            const types = component.types;
            
            if (types.includes('locality')) {
                parsed.city = component.longText;
            } else if (types.includes('administrative_area_level_1')) {
                parsed.state = component.shortText;
            } else if (types.includes('country')) {
                parsed.country = component.longText;
            } else if (types.includes('postal_code')) {
                parsed.postalCode = component.longText;
            }
        });
        
        return parsed;
    }

    /**
     * Fallback: Setup using legacy Autocomplete (deprecated)
     */
    setupLegacyAutocomplete(addressSearch) {
        try {
            console.warn('⚠️ Using deprecated google.maps.places.Autocomplete as fallback');
            
            // Create autocomplete instance (deprecated API)
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
                console.log('🔍 Legacy autocomplete place selected:', place);
                
                if (!place.geometry) {
                    console.warn('⚠️ No geometry available for selected place');
                    return;
                }
                
                this.handleLegacyPlaceSelection(place);
            });
            
            this.autocomplete = autocomplete;
            console.log('✅ Using legacy Autocomplete API (deprecated) as fallback');
            
        } catch (error) {
            console.error('❌ Failed to setup legacy autocomplete:', error);
        }
    }

    /**
     * Handle place selection from legacy API
     */
    handleLegacyPlaceSelection(place) {
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
            let marker = null;
            
            // Try new AdvancedMarkerElement API first
            if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
                try {
                    // Create custom pin element for location
                    const pinElement = new google.maps.marker.PinElement({
                        background: '#4CAF50',
                        borderColor: '#FFFFFF',
                        glyph: '📍',
                        scale: 1.0
                    });
                    
                    // Create advanced marker
                    marker = new google.maps.marker.AdvancedMarkerElement({
                        position: { lat: location.lat, lng: location.lng },
                        map: this.map,
                        title: location.name || 'Location',
                        content: pinElement.element
                    });
                    
                    console.log('✅ Advanced marker created for:', location.name);
                } catch (advancedError) {
                    console.warn('⚠️ Advanced marker failed, falling back to classic marker:', advancedError);
                    marker = null;
                }
            }
            
            // Fallback to classic marker if advanced marker failed or not available
            if (!marker) {
                marker = new google.maps.Marker({
                    position: { lat: location.lat, lng: location.lng },
                    map: this.map,
                    title: location.name || 'Location',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#4CAF50">
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 32)
                    }
                });
                
                console.log('✅ Classic marker created for:', location.name);
            }
            
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
    clearAllLocationMarkers() {
        if (this.locationMarkers && this.locationMarkers.size > 0) {
            console.log('🧹 Clearing all location markers from map:', this.locationMarkers.size);
            
            this.locationMarkers.forEach((marker, locationId) => {
                if (marker.setMap) {
                    marker.setMap(null);
                }
            });
            
            this.locationMarkers.clear();
            console.log('✅ All location markers cleared');
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

    /**
     * Load existing locations and add them to the map
     */
    loadExistingLocations() {
        if (!this.currentUser) {
            Logger.info('MapsManager', 'No user authenticated, skipping location load');
            return;
        }

        // Trigger location loading through the app
        if (window.MerkelApp && window.MerkelApp.locationUI) {
            Logger.info('MapsManager', 'Triggering location load through LocationUI');
            window.MerkelApp.locationUI.loadLocations().catch(error => {
                Logger.error('MapsManager', 'Failed to load locations', error);
            });
        }
    }

    /**
     * Geocode manually entered address (fallback when Places API unavailable)
     */
    geocodeManualAddress(address) {
        if (!this.geocoder) {
            console.warn('⚠️ Geocoder not available for manual address lookup');
            return;
        }
        
        console.log('🔍 Geocoding manual address:', address);
        
        // Show loading indicator
        const addressInput = document.getElementById('address-search');
        if (addressInput) {
            addressInput.setAttribute('disabled', 'disabled');
            addressInput.value = 'Searching...';
        }
        
        this.geocoder.geocode({ address: address }, (results, status) => {
            // Re-enable input
            if (addressInput) {
                addressInput.removeAttribute('disabled');
                addressInput.value = address;
            }
            
            if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                const location = results[0];
                console.log('✅ Geocoded manual address:', location);
                
                // Create a place-like object from geocoder results
                const place = {
                    geometry: location.geometry,
                    formatted_address: location.formatted_address,
                    name: address
                };
                
                // Handle like a regular place selection
                this.handlePlaceSelection(place);
            } else {
                console.error('❌ Geocoding failed:', status);
                
                // Show error message
                const errorMessage = document.createElement('div');
                errorMessage.className = 'temp-message error';
                errorMessage.textContent = `Geocoding failed: ${status}`;
                errorMessage.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #f44336;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                    z-index: 1001;
                    font-weight: 500;
                `;
                
                document.body.appendChild(errorMessage);
                
                setTimeout(() => {
                    errorMessage.remove();
                }, 3000);
            }
        });
    }
}

// Export as global for now, will be converted to ES modules later
window.MapsManager = MapsManager;

// Global initMap function for Google Maps API callback
window.initMap = function() {
    Logger.info('MapsManager', 'Google Maps API callback received');
    
    // Verify Google Maps is actually loaded
    if (typeof google === 'undefined' || !google.maps) {
        Logger.error('MapsManager', 'Google Maps API callback received but API not available');
        return;
    }
    
    // Try to initialize map if MerkelApp and mapsManager are available
    if (window.MerkelApp && window.MerkelApp.mapsManager) {
        Logger.info('MapsManager', 'Initializing map via MerkelApp.mapsManager');
        const success = window.MerkelApp.mapsManager.initMap();
        if (!success) {
            Logger.error('MapsManager', 'Failed to initialize map');
        }
    } else {
        Logger.info('MapsManager', 'MerkelApp not ready, map will initialize when user authenticates');
        // The map will be initialized when user authenticates in handleUserAuthenticated
    }
};

// Log module loading
if (window.Logger) {
    Logger.info('MapsManager module loaded');
} else {
    console.log('✅ Maps Manager module loaded');
}

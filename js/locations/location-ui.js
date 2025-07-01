/**
 * Location UI Manager
 * Handles location UI operations including modals, forms, lists, and photo previews
 */

class LocationUI {
    constructor() {
        this.locationManager = null;
        this.mapsManager = null;
        this.domHelpers = null;
        
        // DOM elements
        this.locationModal = null;
        this.locationForm = null;
        this.locationList = null;
        this.addLocationBtn = null;
        this.closeModal = null;
        this.cancelLocation = null;
        
        // State
        this.isModalOpen = false;
        this.editingLocationId = null;
        this.locations = [];
        this.filters = {
            category: 'all',
            searchTerm: '',
            showOnlyMine: false
        };
    }

    /**
     * Initialize the location UI manager
     */
    initialize(locationManager, mapsManager, domHelpers) {
        this.locationManager = locationManager;
        this.mapsManager = mapsManager;
        this.domHelpers = domHelpers;
        
        // Get DOM elements
        this.initializeDOMElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up location manager callbacks
        this.setupLocationManagerCallbacks();
        
        console.log('🎨 LocationUI initialized');
        return this;
    }

    /**
     * Initialize DOM elements
     */
    initializeDOMElements() {
        this.locationModal = document.getElementById('location-modal');
        this.locationForm = document.getElementById('location-form');
        this.locationList = document.getElementById('location-list');
        this.addLocationBtn = document.getElementById('add-location-btn');
        this.closeModal = document.getElementById('close-modal');
        this.cancelLocation = document.getElementById('cancel-location');
        
        console.log('🎨 LocationUI DOM elements initialized:', {
            locationModal: !!this.locationModal,
            locationForm: !!this.locationForm,
            locationList: !!this.locationList,
            addLocationBtn: !!this.addLocationBtn
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Add location button
        if (this.addLocationBtn) {
            this.addLocationBtn.addEventListener('click', () => {
                this.openLocationModal();
            });
        }

        // Modal close buttons
        if (this.closeModal) {
            this.closeModal.addEventListener('click', () => {
                this.closeLocationModal();
            });
        }

        if (this.cancelLocation) {
            this.cancelLocation.addEventListener('click', () => {
                this.closeLocationModal();
            });
        }

        // Form submission
        if (this.locationForm) {
            this.locationForm.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }

        // Close modal when clicking outside
        if (this.locationModal) {
            this.locationModal.addEventListener('click', (e) => {
                if (e.target === this.locationModal) {
                    this.closeLocationModal();
                }
            });
        }

        // Setup photo preview
        this.setupPhotoPreview();
    }

    /**
     * Setup callbacks for location manager
     */
    setupLocationManagerCallbacks() {
        if (this.locationManager) {
            this.locationManager.setLocationSavedCallback((location, hasPhoto) => {
                this.handleLocationSaved(location, hasPhoto);
            });

            this.locationManager.setLocationLoadedCallback((locations) => {
                this.handleLocationsLoaded(locations);
            });

            this.locationManager.setLocationErrorCallback((operation, error) => {
                this.handleLocationError(operation, error);
            });
        }
    }

    /**
     * Open location modal
     */
    openLocationModal(locationData = null, editMode = false) {
        console.log('🎨 Opening location modal:', locationData, editMode);
        
        if (!this.locationModal) {
            console.error('❌ Location modal not found');
            return;
        }

        this.isModalOpen = true;
        this.editingLocationId = editMode && locationData ? locationData.id : null;

        // Pre-fill form if location data provided
        if (locationData) {
            this.populateForm(locationData);
        } else {
            // Clear form for new entry
            this.clearForm();
        }

        // Update modal title and button text
        const modalTitle = this.locationModal.querySelector('h2');
        const submitBtn = this.locationModal.querySelector('button[type="submit"]');
        
        if (modalTitle) {
            modalTitle.textContent = editMode ? 'Edit Location' : 'Add New Location';
        }
        
        if (submitBtn) {
            submitBtn.textContent = editMode ? 'Update Location' : 'Save Location';
        }

        this.locationModal.style.display = 'flex';
        
        // Focus on name field
        const nameField = document.getElementById('location-name');
        if (nameField) {
            nameField.focus();
        }
    }

    /**
     * Close location modal
     */
    closeLocationModal() {
        console.log('🎨 Closing location modal');
        
        if (this.locationModal) {
            this.locationModal.style.display = 'none';
        }

        this.isModalOpen = false;
        this.editingLocationId = null;

        // Clear form
        this.clearForm();

        // Clear selected location in maps manager
        if (this.mapsManager) {
            this.mapsManager.clearSelectedLocation();
        }

        // Remove photo preview
        this.removePhotoPreview();
    }

    /**
     * Populate form with location data
     */
    populateForm(locationData) {
        const fields = {
            'location-name': locationData.name || '',
            'location-address': locationData.address || '',
            'location-coords': locationData.lat && locationData.lng ? 
                `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}` : '',
            'location-city': locationData.city || '',
            'location-state': locationData.state || '',
            'location-category': locationData.category || '',
            'location-notes': locationData.notes || ''
        };

        Object.entries(fields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = value;
            }
        });
    }

    /**
     * Clear form
     */
    clearForm() {
        if (this.locationForm) {
            this.locationForm.reset();
        }

        // Clear readonly fields
        const addressField = document.getElementById('location-address');
        const coordsField = document.getElementById('location-coords');
        
        if (addressField) addressField.value = '';
        if (coordsField) coordsField.value = '';
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        console.log('🎨 Handling form submit');

        if (!this.locationManager) {
            console.error('❌ Location manager not available');
            return;
        }

        // Get form data
        const formData = this.getFormData();
        const photoFile = document.getElementById('location-photo')?.files[0] || null;

        // Validate form data
        const validation = this.locationManager.validateLocationData(formData);
        if (!validation.isValid) {
            alert(validation.errors.join('\n'));
            return;
        }

        // Show loading state
        this.setFormLoadingState(true);

        try {
            if (this.editingLocationId) {
                // Update existing location
                await this.locationManager.updateLocation(this.editingLocationId, formData, photoFile);
            } else {
                // Create new location
                await this.locationManager.saveLocation(formData, photoFile);
            }
            
        } catch (error) {
            console.error('❌ Form submission error:', error);
            alert(error.message);
        } finally {
            this.setFormLoadingState(false);
        }
    }

    /**
     * Get form data
     */
    getFormData() {
        // Get selected location from maps manager
        const selectedLocation = this.mapsManager ? this.mapsManager.getSelectedLocation() : null;
        
        return {
            name: document.getElementById('location-name')?.value?.trim() || '',
            address: document.getElementById('location-address')?.value || '',
            lat: selectedLocation?.lat || null,
            lng: selectedLocation?.lng || null,
            city: document.getElementById('location-city')?.value?.trim() || '',
            state: document.getElementById('location-state')?.value || '',
            category: document.getElementById('location-category')?.value || '',
            notes: document.getElementById('location-notes')?.value?.trim() || ''
        };
    }

    /**
     * Set form loading state
     */
    setFormLoadingState(isLoading) {
        const submitBtn = this.locationModal?.querySelector('button[type="submit"]');
        
        if (submitBtn) {
            if (isLoading) {
                submitBtn.dataset.originalText = submitBtn.textContent;
                submitBtn.textContent = this.editingLocationId ? 'Updating...' : 'Saving...';
                submitBtn.disabled = true;
            } else {
                submitBtn.textContent = submitBtn.dataset.originalText || 'Save Location';
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Setup photo preview functionality
     */
    setupPhotoPreview() {
        const photoInput = document.getElementById('location-photo');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.showPhotoPreview(file);
                } else {
                    this.removePhotoPreview();
                }
            });
        }
    }

    /**
     * Show photo preview
     */
    showPhotoPreview(file) {
        // Remove existing preview
        this.removePhotoPreview();

        const reader = new FileReader();
        reader.onload = (e) => {
            const previewDiv = document.createElement('div');
            previewDiv.id = 'photo-preview';
            previewDiv.style.cssText = 'margin: 10px 0; text-align: center;';

            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.cssText = 'max-width: 200px; max-height: 150px; border-radius: 6px; border: 2px solid #ddd;';

            const fileName = document.createElement('p');
            fileName.textContent = file.name;
            fileName.style.cssText = 'font-size: 12px; color: #666; margin: 5px 0 0 0;';

            previewDiv.appendChild(img);
            previewDiv.appendChild(fileName);

            // Insert preview after the photo input
            const photoInput = document.getElementById('location-photo');
            if (photoInput) {
                photoInput.parentNode.insertBefore(previewDiv, photoInput.nextSibling);
            }
        };

        reader.readAsDataURL(file);
    }

    /**
     * Remove photo preview
     */
    removePhotoPreview() {
        const preview = document.getElementById('photo-preview');
        if (preview) {
            preview.remove();
        }
    }

    /**
     * Handle location saved callback
     */
    handleLocationSaved(location, hasPhoto) {
        console.log('✅ Location saved:', location);
        
        // Close modal
        this.closeLocationModal();
        
        // Show success message
        this.showTemporaryMessage(
            hasPhoto ? 'Location and photo saved successfully!' : 'Location saved successfully!',
            'success'
        );
        
        // Refresh the location list will happen automatically via the real-time listener
    }

    /**
     * Handle locations loaded callback
     */
    handleLocationsLoaded(locations) {
        console.log('📊 Locations loaded:', locations.length);
        
        this.locations = locations;
        
        // Clear existing markers
        if (window.AppState && window.AppState.clearMarkers) {
            window.AppState.clearMarkers();
        }
        
        // Clear and rebuild location list
        this.buildLocationList();
        
        // Add markers to map
        this.addMarkersToMap(locations);
        
        // Create/update filters
        this.createLocationFilters();
    }

    /**
     * Handle location error callback
     */
    handleLocationError(operation, error) {
        console.error(`❌ Location ${operation} error:`, error);
        
        let message = `Error during ${operation}: ${error.message}`;
        
        // Customize message based on error type
        if (error.code === 'permission-denied') {
            message = 'Permission denied. Please check Firestore security rules.';
        } else if (error.code === 'unavailable') {
            message = 'Backend temporarily unavailable. Please try again later.';
        }
        
        this.showTemporaryMessage(message, 'error');
    }

    /**
     * Build location list UI
     */
    buildLocationList() {
        if (!this.locationList) {
            console.warn('⚠️ Location list element not found');
            return;
        }

        // Clear existing content
        this.locationList.innerHTML = '';

        // Filter locations
        const filteredLocations = this.filterLocations(this.locations);

        if (filteredLocations.length === 0) {
            this.locationList.innerHTML = '<p class="no-locations">No locations found. Click on the map to add your first location!</p>';
            return;
        }

        // Create location items
        filteredLocations.forEach(location => {
            const locationItem = this.createLocationItem(location);
            this.locationList.appendChild(locationItem);
        });
    }

    /**
     * Create location list item
     */
    createLocationItem(location) {
        const item = document.createElement('div');
        item.className = 'location-item';
        item.dataset.locationId = location.id;

        item.innerHTML = `
            <div class="location-header">
                <h4>${this.escapeHtml(location.name)}</h4>
                <span class="location-category">${this.escapeHtml(location.category)}</span>
            </div>
            <div class="location-details">
                <p class="location-address">${this.escapeHtml(location.address || 'No address')}</p>
                <p class="location-city-state">${this.escapeHtml(location.city)}, ${this.escapeHtml(location.state)}</p>
                ${location.notes ? `<p class="location-notes">${this.escapeHtml(location.notes)}</p>` : ''}
            </div>
            <div class="location-actions">
                <button class="btn-view" onclick="window.locationUI.viewLocation('${location.id}')">View</button>
                <button class="btn-edit" onclick="window.locationUI.editLocation('${location.id}')">Edit</button>
                <button class="btn-delete" onclick="window.locationUI.deleteLocation('${location.id}')">Delete</button>
            </div>
            ${location.photoURL ? `<img src="${location.photoURL}" class="location-photo" alt="${this.escapeHtml(location.name)}">` : ''}
        `;

        return item;
    }

    /**
     * Add markers to map for all locations
     */
    addMarkersToMap(locations) {
        if (!this.mapsManager) return;

        locations.forEach(location => {
            const marker = this.mapsManager.addLocationToMap(location);
            if (marker && window.AppState && window.AppState.addMarker) {
                window.AppState.addMarker(location.id, marker);
            }
        });
    }

    /**
     * Create location filters UI
     */
    createLocationFilters() {
        if (!this.locationList) return;

        // Check if filters already exist
        if (document.getElementById('location-search-filter')) return;

        // Create filters container
        const filtersContainer = document.createElement('div');
        filtersContainer.className = 'location-filters';
        filtersContainer.innerHTML = `
            <div class="filter-group">
                <input type="text" id="location-search-filter" placeholder="Search locations..." value="${this.filters.searchTerm}">
                <select id="location-category-filter">
                    <option value="all">All Categories</option>
                    ${this.locationManager.getLocationCategories().map(cat => 
                        `<option value="${cat.value}" ${this.filters.category === cat.value ? 'selected' : ''}>${cat.label}</option>`
                    ).join('')}
                </select>
            </div>
        `;

        // Insert before location list
        this.locationList.parentNode.insertBefore(filtersContainer, this.locationList);

        // Setup filter event listeners
        this.setupFilterEventListeners();
    }

    /**
     * Setup filter event listeners
     */
    setupFilterEventListeners() {
        const searchFilter = document.getElementById('location-search-filter');
        const categoryFilter = document.getElementById('location-category-filter');

        if (searchFilter) {
            searchFilter.addEventListener('input', (e) => {
                this.filters.searchTerm = e.target.value;
                this.buildLocationList();
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.buildLocationList();
            });
        }
    }

    /**
     * Filter locations based on current filters
     */
    filterLocations(locations) {
        return locations.filter(location => {
            // Category filter
            if (this.filters.category !== 'all' && location.category !== this.filters.category) {
                return false;
            }

            // Search filter
            if (this.filters.searchTerm) {
                const searchText = this.filters.searchTerm.toLowerCase();
                const locationText = [
                    location.name,
                    location.city,
                    location.state,
                    location.notes || ''
                ].join(' ').toLowerCase();

                if (!locationText.includes(searchText)) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * View location (center map on it)
     */
    viewLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location && this.mapsManager) {
            this.mapsManager.centerMap(location.lat, location.lng, 15);
        }
    }

    /**
     * Edit location
     */
    editLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (location) {
            // Set the selected location in maps manager for editing
            if (this.mapsManager) {
                this.mapsManager.selectedLocation = {
                    lat: location.lat,
                    lng: location.lng,
                    address: location.address,
                    city: location.city,
                    state: location.state
                };
            }
            
            this.openLocationModal(location, true);
        }
    }

    /**
     * Delete location
     */
    async deleteLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (!location) return;

        const confirmed = confirm(`Are you sure you want to delete "${location.name}"?`);
        if (!confirmed) return;

        try {
            await this.locationManager.deleteLocation(locationId);
            this.showTemporaryMessage('Location deleted successfully', 'success');
            
            // Remove marker from map
            if (this.mapsManager) {
                this.mapsManager.removeLocationMarker(locationId);
            }
            
        } catch (error) {
            console.error('❌ Delete error:', error);
            alert(error.message);
        }
    }

    /**
     * Show temporary message
     */
    showTemporaryMessage(message, type) {
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

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Update form with selected location from map
     */
    updateFormWithMapSelection(location) {
        if (!this.isModalOpen || !location) return;

        const addressField = document.getElementById('location-address');
        const coordsField = document.getElementById('location-coords');
        const cityField = document.getElementById('location-city');
        const stateField = document.getElementById('location-state');

        if (addressField) addressField.value = location.address || '';
        if (coordsField) coordsField.value = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
        if (cityField && location.city) cityField.value = location.city;
        if (stateField && location.state) stateField.value = location.state;
    }

    /**
     * Initialize location loading
     */
    loadLocations() {
        if (this.locationManager) {
            this.locationManager.loadLocations();
        }
    }
}

// Export as global for now, will be converted to ES modules later
window.LocationUI = LocationUI;

console.log('✅ Location UI module loaded');

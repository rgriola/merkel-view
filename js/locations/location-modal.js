/**
 * Location Modal Manager
 * Handles location modal, forms, and photo previews
 */

class LocationModal {
    constructor() {
        // DOM elements
        this.locationModal = null;
        this.locationForm = null;
        this.addLocationBtn = null;
        this.closeModal = null;
        this.cancelLocation = null;
        
        // State
        this.isModalOpen = false;
        this.editingLocationId = null;
        
        // Dependencies
        this.locationManager = null;
        this.mapsManager = null;
        this.domHelpers = null;
    }

    /**
     * Initialize the location modal manager
     */
    initialize(locationManager, mapsManager, domHelpers) {
        this.locationManager = locationManager;
        this.mapsManager = mapsManager;
        this.domHelpers = domHelpers;
        
        // Get DOM elements
        this.initializeDOMElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('📝 LocationModal initialized');
        return this;
    }

    /**
     * Initialize DOM elements
     */
    initializeDOMElements() {
        this.locationModal = document.getElementById('location-modal');
        this.locationForm = document.getElementById('location-form');
        this.addLocationBtn = document.getElementById('add-location-btn');
        this.closeModal = document.getElementById('close-modal');
        this.cancelLocation = document.getElementById('cancel-location');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Add location button
        if (this.addLocationBtn) {
            this.addLocationBtn.addEventListener('click', () => this.openModal());
        }

        // Close modal events
        if (this.closeModal) {
            this.closeModal.addEventListener('click', () => this.closeModal());
        }
        
        if (this.cancelLocation) {
            this.cancelLocation.addEventListener('click', () => this.closeModal());
        }

        // Close modal when clicking outside
        if (this.locationModal) {
            this.locationModal.addEventListener('click', (e) => {
                if (e.target === this.locationModal) {
                    this.closeModal();
                }
            });
        }

        // Form submission
        if (this.locationForm) {
            this.locationForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Photo upload preview
        const photoInput = document.getElementById('location-photos');
        if (photoInput) {
            photoInput.addEventListener('change', (e) => this.handlePhotoSelection(e));
        }
    }

    /**
     * Open location modal
     */
    openModal(locationData = null) {
        if (!this.locationModal) return;

        this.editingLocationId = locationData ? locationData.id : null;
        
        // Update modal title based on mode
        const modalHeader = this.locationModal.querySelector('.modal-header h2');
        if (modalHeader) {
            modalHeader.textContent = locationData ? 'Edit Location' : 'Add New Location';
        }

        // Update submit button text
        const submitButton = this.locationModal.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = locationData ? 'Update Location' : 'Save Location';
        }
        
        // Reset form
        if (this.locationForm) {
            this.locationForm.reset();
        }

        // Clear photo preview
        this.clearPhotoPreview();

        // If editing, populate form
        if (locationData) {
            this.populateForm(locationData);
        }

        // Show modal
        this.locationModal.style.display = 'flex';
        this.isModalOpen = true;

        // Focus first input
        const firstInput = this.locationModal.querySelector('input:not([type="hidden"]), textarea, select');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    /**
     * Close location modal
     */
    closeModal() {
        if (!this.locationModal) return;

        this.locationModal.style.display = 'none';
        this.isModalOpen = false;
        this.editingLocationId = null;

        // Clear form
        if (this.locationForm) {
            this.locationForm.reset();
        }

        // Clear photo preview
        this.clearPhotoPreview();

        // Remove temporary marker if exists
        if (this.mapsManager && this.mapsManager.removeTemporaryMarker) {
            this.mapsManager.removeTemporaryMarker();
        }
    }

    /**
     * Populate form with location data
     */
    populateForm(locationData) {
        if (!this.locationForm || !locationData) return;

        console.log('📝 Populating form with location data:', locationData);

        // Populate form fields using actual IDs
        const locationNameInput = document.getElementById('location-name');
        const locationAddressInput = document.getElementById('location-address');
        const locationCoordsInput = document.getElementById('location-coords');
        const locationStateSelect = document.getElementById('location-state');
        const locationCityInput = document.getElementById('location-city');
        const locationCategorySelect = document.getElementById('location-category');
        const locationNotesTextarea = document.getElementById('location-notes');

        // Set form values
        if (locationNameInput && locationData.name) {
            locationNameInput.value = locationData.name;
        }

        if (locationAddressInput && locationData.address) {
            locationAddressInput.value = locationData.address;
        }

        if (locationCoordsInput && locationData.lat && locationData.lng) {
            locationCoordsInput.value = `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`;
        }

        if (locationStateSelect && locationData.state) {
            locationStateSelect.value = locationData.state;
        }

        if (locationCityInput && locationData.city) {
            locationCityInput.value = locationData.city;
        }

        if (locationCategorySelect && locationData.category) {
            locationCategorySelect.value = locationData.category;
        }

        if (locationNotesTextarea && locationData.notes) {
            locationNotesTextarea.value = locationData.notes;
        }

        // Store coordinates for form submission
        if (this.locationForm) {
            this.locationForm.dataset.lat = locationData.lat;
            this.locationForm.dataset.lng = locationData.lng;
        }

        console.log('✅ Form populated successfully');
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.locationManager) return;

        try {
            // Get form data using actual IDs
            const locationName = document.getElementById('location-name').value.trim();
            const locationAddress = document.getElementById('location-address').value.trim();
            const locationState = document.getElementById('location-state').value;
            const locationCity = document.getElementById('location-city').value.trim();
            const locationCategory = document.getElementById('location-category').value;
            const locationNotes = document.getElementById('location-notes').value.trim();

            // Get coordinates from form dataset or parse from coords input
            let lat = parseFloat(this.locationForm.dataset.lat) || 0;
            let lng = parseFloat(this.locationForm.dataset.lng) || 0;

            // If no coordinates in dataset, try to get from mapsManager selection
            if (!lat && !lng && this.mapsManager && this.mapsManager.getSelectedLocation) {
                const selectedLocation = this.mapsManager.getSelectedLocation();
                if (selectedLocation) {
                    lat = selectedLocation.lat;
                    lng = selectedLocation.lng;
                }
            }

            const locationData = {
                name: locationName,
                address: locationAddress,
                state: locationState,
                city: locationCity,
                category: locationCategory,
                notes: locationNotes,
                lat: lat,
                lng: lng
            };

            // Handle photos
            const photoInput = document.getElementById('location-photo');
            const photo = photoInput && photoInput.files.length > 0 ? photoInput.files[0] : null;

            if (this.editingLocationId) {
                // Update existing location
                await this.locationManager.updateLocation(this.editingLocationId, locationData, photo);
                this.showMessage('Location updated successfully!', 'success');
            } else {
                // Create new location
                await this.locationManager.saveLocation(locationData, photo);
                this.showMessage('Location added successfully!', 'success');
            }

            this.closeModal();
        } catch (error) {
            console.error('Error saving location:', error);
            this.showMessage('Failed to save location. Please try again.', 'error');
        }
    }

    /**
     * Handle photo selection
     */
    handlePhotoSelection(e) {
        const files = Array.from(e.target.files);
        this.updatePhotoPreview(files);
    }

    /**
     * Update photo preview
     */
    updatePhotoPreview(files) {
        const previewContainer = document.getElementById('photo-preview');
        if (!previewContainer) return;

        // Clear existing previews
        previewContainer.innerHTML = '';

        files.forEach((file, index) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const previewDiv = document.createElement('div');
                    previewDiv.className = 'photo-preview-item';
                    previewDiv.innerHTML = `
                        <img src="${e.target.result}" alt="Preview ${index + 1}">
                        <button type="button" onclick="this.parentElement.remove()">Remove</button>
                    `;
                    previewContainer.appendChild(previewDiv);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /**
     * Clear photo preview
     */
    clearPhotoPreview() {
        const previewContainer = document.getElementById('photo-preview');
        if (previewContainer) {
            previewContainer.innerHTML = '';
        }
    }

    /**
     * Show temporary message
     */
    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1001;
            font-weight: 500;
        `;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    /**
     * Update form with map selection data
     */
    updateFormWithMapSelection(locationData) {
        if (!this.isModalOpen) {
            this.openModal();
        }

        // Update form fields with location data
        const locationNameInput = document.getElementById('location-name');
        const locationAddressInput = document.getElementById('location-address');
        const locationCoordsInput = document.getElementById('location-coords');
        const locationCityInput = document.getElementById('location-city');
        const locationStateSelect = document.getElementById('location-state');

        if (locationData.name && locationNameInput) {
            locationNameInput.value = locationData.name;
        }

        if (locationData.address && locationAddressInput) {
            locationAddressInput.value = locationData.address;
        }

        if (locationData.lat && locationData.lng && locationCoordsInput) {
            locationCoordsInput.value = `${locationData.lat.toFixed(6)}, ${locationData.lng.toFixed(6)}`;
        }

        if (locationData.city && locationCityInput) {
            locationCityInput.value = locationData.city;
        }

        if (locationData.state && locationStateSelect) {
            locationStateSelect.value = locationData.state;
        }

        // Store coordinates for form submission
        if (this.locationForm) {
            this.locationForm.dataset.lat = locationData.lat;
            this.locationForm.dataset.lng = locationData.lng;
        }

        console.log('📝 Updated form with map selection:', locationData);
    }
}

// Export for global access
window.LocationModal = LocationModal;

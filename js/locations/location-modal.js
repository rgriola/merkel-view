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
        this.locationModal.style.display = 'block';
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
        if (!this.locationForm) return;

        // Populate form fields
        const fields = ['name', 'category', 'notes', 'address', 'city', 'state'];
        fields.forEach(field => {
            const input = this.locationForm.querySelector(`[name="${field}"]`);
            if (input && locationData[field]) {
                input.value = locationData[field];
            }
        });

        // Set coordinates
        const latInput = this.locationForm.querySelector('[name="latitude"]');
        const lngInput = this.locationForm.querySelector('[name="longitude"]');
        if (latInput && locationData.lat) latInput.value = locationData.lat;
        if (lngInput && locationData.lng) lngInput.value = locationData.lng;
    }

    /**
     * Handle form submission
     */
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.locationManager) return;

        try {
            const formData = new FormData(this.locationForm);
            const locationData = Object.fromEntries(formData.entries());

            // Add coordinates
            const latInput = this.locationForm.querySelector('[name="latitude"]');
            const lngInput = this.locationForm.querySelector('[name="longitude"]');
            
            if (latInput && lngInput) {
                locationData.lat = parseFloat(latInput.value) || 0;
                locationData.lng = parseFloat(lngInput.value) || 0;
            }

            // Handle photos
            const photoInput = this.locationForm.querySelector('#location-photos');
            const photos = photoInput ? Array.from(photoInput.files) : [];

            if (this.editingLocationId) {
                // Update existing location
                await this.locationManager.updateLocation(this.editingLocationId, locationData, photos);
                this.showMessage('Location updated successfully!', 'success');
            } else {
                // Create new location
                await this.locationManager.addLocation(locationData, photos);
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
}

// Export for global access
window.LocationModal = LocationModal;

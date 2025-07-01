/**
 * Location List Manager
 * Handles location list display, filtering, and interactions
 */

class LocationList {
    constructor() {
        // DOM elements
        this.locationList = null;
        this.filterContainer = null;
        this.searchInput = null;
        this.categoryFilter = null;
        this.myLocationsToggle = null;
        
        // State
        this.locations = [];
        this.filters = {
            category: 'all',
            searchTerm: '',
            showOnlyMine: false
        };
        
        // Dependencies
        this.locationManager = null;
        this.mapsManager = null;
        this.locationModal = null;
        this.currentUser = null;
    }

    /**
     * Initialize the location list manager
     */
    initialize(locationManager, mapsManager, locationModal) {
        this.locationManager = locationManager;
        this.mapsManager = mapsManager;
        this.locationModal = locationModal;
        
        // Get DOM elements
        this.initializeDOMElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Set up location manager callbacks
        this.setupLocationManagerCallbacks();
        
        console.log('📋 LocationList initialized');
        return this;
    }

    /**
     * Initialize DOM elements
     */
    initializeDOMElements() {
        this.locationList = document.getElementById('location-list');
        this.filterContainer = document.getElementById('location-filters');
        this.searchInput = document.getElementById('location-search');
        this.categoryFilter = document.getElementById('category-filter');
        this.myLocationsToggle = document.getElementById('my-locations-toggle');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Search input
        if (this.searchInput) {
            let searchTimeout;
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filters.searchTerm = e.target.value.toLowerCase().trim();
                    this.filterAndDisplayLocations();
                }, 300);
            });
        }

        // Category filter
        if (this.categoryFilter) {
            this.categoryFilter.addEventListener('change', (e) => {
                this.filters.category = e.target.value;
                this.filterAndDisplayLocations();
            });
        }

        // My locations toggle
        if (this.myLocationsToggle) {
            this.myLocationsToggle.addEventListener('change', (e) => {
                this.filters.showOnlyMine = e.target.checked;
                this.filterAndDisplayLocations();
            });
        }
    }

    /**
     * Set up location manager callbacks
     */
    setupLocationManagerCallbacks() {
        if (!this.locationManager) return;

        // Listen for location changes
        this.locationManager.onLocationsChanged = (locations) => {
            this.locations = locations;
            this.filterAndDisplayLocations();
        };

        this.locationManager.onLocationAdded = (location) => {
            this.locations.push(location);
            this.filterAndDisplayLocations();
        };

        this.locationManager.onLocationUpdated = (locationId, updatedData) => {
            const index = this.locations.findIndex(loc => loc.id === locationId);
            if (index !== -1) {
                this.locations[index] = { ...this.locations[index], ...updatedData };
                this.filterAndDisplayLocations();
            }
        };

        this.locationManager.onLocationDeleted = (locationId) => {
            this.locations = this.locations.filter(loc => loc.id !== locationId);
            this.filterAndDisplayLocations();
        };
    }

    /**
     * Update current user for filtering
     */
    setCurrentUser(user) {
        this.currentUser = user;
        this.filterAndDisplayLocations();
    }

    /**
     * Load and display locations
     */
    async loadLocations() {
        if (!this.locationManager) return;

        try {
            this.locations = await this.locationManager.getLocations();
            this.filterAndDisplayLocations();
        } catch (error) {
            console.error('Error loading locations:', error);
            this.showError('Failed to load locations');
        }
    }

    /**
     * Filter and display locations
     */
    filterAndDisplayLocations() {
        if (!this.locationList) return;

        const filteredLocations = this.locations.filter(location => {
            // Category filter
            if (this.filters.category !== 'all' && location.category !== this.filters.category) {
                return false;
            }

            // Search filter
            if (this.filters.searchTerm) {
                const searchTerm = this.filters.searchTerm;
                const searchableText = [
                    location.name,
                    location.city,
                    location.state,
                    location.notes,
                    location.category
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // My locations filter
            if (this.filters.showOnlyMine && this.currentUser) {
                if (location.addedBy !== this.currentUser.email) {
                    return false;
                }
            }

            return true;
        });

        this.renderLocationList(filteredLocations);
    }

    /**
     * Render location list
     */
    renderLocationList(locations) {
        if (!this.locationList) return;

        if (locations.length === 0) {
            this.locationList.innerHTML = `
                <div class="no-locations">
                    <p>No locations found.</p>
                    ${this.filters.searchTerm || this.filters.category !== 'all' || this.filters.showOnlyMine 
                        ? '<p>Try adjusting your filters.</p>' 
                        : '<p>Add your first location to get started!</p>'}
                </div>
            `;
            return;
        }

        const locationItems = locations.map(location => this.createLocationItem(location));
        this.locationList.innerHTML = locationItems.join('');

        // Add event listeners to location items
        this.setupLocationItemListeners();
    }

    /**
     * Create location item HTML
     */
    createLocationItem(location) {
        const isOwner = this.currentUser && location.addedBy === this.currentUser.email;
        const photoUrl = location.photos && location.photos.length > 0 ? location.photos[0] : null;
        
        return `
            <div class="location-item" data-id="${location.id}">
                <div class="location-item-content">
                    ${photoUrl ? `<div class="location-photo"><img src="${photoUrl}" alt="${location.name}"></div>` : ''}
                    <div class="location-details">
                        <h3 class="location-name">${this.escapeHtml(location.name)}</h3>
                        <p class="location-address">${this.escapeHtml(location.city)}, ${this.escapeHtml(location.state)}</p>
                        <p class="location-category">${this.escapeHtml(location.category)}</p>
                        ${location.notes ? `<p class="location-notes">${this.escapeHtml(location.notes)}</p>` : ''}
                        <p class="location-meta">Added by ${this.escapeHtml(location.addedBy)} on ${this.formatDate(location.dateAdded)}</p>
                    </div>
                </div>
                <div class="location-actions">
                    <button class="view-on-map-btn" data-id="${location.id}">View on Map</button>
                    ${isOwner ? `
                        <button class="edit-location-btn" data-id="${location.id}">Edit</button>
                        <button class="delete-location-btn" data-id="${location.id}">Delete</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Set up location item event listeners
     */
    setupLocationItemListeners() {
        // View on map buttons
        document.querySelectorAll('.view-on-map-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const locationId = e.target.dataset.id;
                this.viewLocationOnMap(locationId);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-location-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const locationId = e.target.dataset.id;
                this.editLocation(locationId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-location-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const locationId = e.target.dataset.id;
                this.deleteLocation(locationId);
            });
        });
    }

    /**
     * View location on map
     */
    viewLocationOnMap(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (!location || !this.mapsManager) return;

        this.mapsManager.centerOnLocation(location.lat, location.lng);
        this.mapsManager.addMarker(location.lat, location.lng, location.name);
    }

    /**
     * Edit location
     */
    editLocation(locationId) {
        const location = this.locations.find(loc => loc.id === locationId);
        if (!location || !this.locationModal) return;

        this.locationModal.openModal(location);
    }

    /**
     * Delete location
     */
    async deleteLocation(locationId) {
        if (!confirm('Are you sure you want to delete this location?')) return;

        try {
            await this.locationManager.deleteLocation(locationId);
            this.showMessage('Location deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting location:', error);
            this.showMessage('Failed to delete location', 'error');
        }
    }

    /**
     * Utility functions
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(timestamp) {
        if (!timestamp) return 'Unknown';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    }

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

    showError(message) {
        this.showMessage(message, 'error');
    }
}

// Export for global access
window.LocationList = LocationList;

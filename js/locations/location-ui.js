/**
 * Location UI Manager
 * Coordinates location modal and list components
 */

class LocationUI {
    constructor() {
        this.locationModal = new LocationModal();
        this.locationList = new LocationList();
        
        // Dependencies
        this.locationManager = null;
        this.mapsManager = null;
        this.domHelpers = null;
    }

    /**
     * Initialize the location UI manager
     */
    initialize(locationManager, mapsManager, domHelpers) {
        this.locationManager = locationManager;
        this.mapsManager = mapsManager;
        this.domHelpers = domHelpers;
        
        // Initialize components
        this.locationModal.initialize(locationManager, mapsManager, domHelpers);
        this.locationList.initialize(locationManager, mapsManager, this.locationModal);
        
        console.log('🎨 LocationUI initialized');
        return this;
    }

    /**
     * Set current user for filtering
     */
    setCurrentUser(user) {
        this.locationList.setCurrentUser(user);
    }

    /**
     * Load locations
     */
    async loadLocations() {
        await this.locationList.loadLocations();
    }

    /**
     * Open modal for adding new location
     */
    openLocationModal() {
        this.locationModal.openModal();
    }

    /**
     * Open modal for editing location
     */
    openEditLocationModal(locationData) {
        this.locationModal.openModal(locationData);
    }

    /**
     * Close modal
     */
    closeLocationModal() {
        this.locationModal.closeModal();
    }

    /**
     * Get modal state
     */
    get isModalOpen() {
        return this.locationModal.isModalOpen;
    }
}

// Export for global access
window.LocationUI = LocationUI;

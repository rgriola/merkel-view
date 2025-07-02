/**
 * Location Manager
 * Handles location CRUD operations, Firestore integration, and photo uploads
 */

class LocationManager {
    constructor() {
        this.db = null;
        this.storage = null;
        this.auth = null;
        this.currentUser = null;
        this.mapsManager = null;
        
        // Callbacks
        this.onLocationSaved = null;
        this.onLocationLoaded = null;
        this.onLocationError = null;
    }

    /**
     * Initialize the location manager
     */
    initialize(firebase, mapsManager) {
        this.db = firebase.db;
        this.storage = firebase.storage;
        this.auth = firebase.auth;
        this.mapsManager = mapsManager;
        
        console.log('📍 LocationManager initialized');
        return this;
    }

    /**
     * Set current user for authentication
     */
    setCurrentUser(user) {
        this.currentUser = user;
        console.log('👤 Location manager user updated:', user ? user.email : 'none');
    }

    /**
     * Save location to Firestore with optional photo upload
     */
    async saveLocation(locationData, photoFile = null) {
        return await ErrorHandler.wrapAsync(async () => {
            Logger.info('LocationManager', 'Saving location', { name: locationData.name });
            
            if (!this.currentUser) {
                throw new Error('User not authenticated');
            }

            if (!this.db || !this.storage) {
                throw new Error('Firebase services not initialized');
            }

            // Sanitize and validate input data
            const sanitizedData = Sanitizer.sanitizeLocationData(locationData);
            
            // Enhanced validation using ValidationUtils
            const validationResult = this.validateLocationData(sanitizedData);
            if (!validationResult.valid) {
                throw new Error(validationResult.message);
            }
            
            // Validate required fields
            ErrorHandler.validateRequired(sanitizedData, 
                ['name', 'state', 'city', 'category'], 
                'Location data validation'
            );

            // Validate photo if provided
            if (photoFile) {
                Sanitizer.validateFile(photoFile, ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
            }

            // Prepare location data for Firestore
            const firestoreData = {
                name: sanitizedData.name,
                address: sanitizedData.address || '',
                lat: sanitizedData.lat || 0,
                lng: sanitizedData.lng || 0,
                state: sanitizedData.state,
                city: sanitizedData.city,
                category: sanitizedData.category,
                notes: sanitizedData.notes || '',
                addedBy: this.currentUser.email,
                userId: this.currentUser.uid,
                dateAdded: window.firebase.firestore.FieldValue.serverTimestamp()
            };

            Logger.debug('LocationManager', 'Firestore data prepared', firestoreData);

            // Upload photo if provided
            if (photoFile) {
                Logger.info('LocationManager', 'Uploading photo', { size: photoFile.size, type: photoFile.type });
                
                const sanitizedName = Sanitizer.sanitizeFilename(sanitizedData.name);
                const fileExtension = photoFile.name.split('.').pop();
                const fileName = `locations/${this.currentUser.uid}/${Date.now()}_${sanitizedName}.${fileExtension}`;
                
                const storage = window.firebase.storage();
                const storageRef = storage.ref(fileName);
                
                const uploadTask = await ErrorHandler.withRetry(async () => {
                    return await storageRef.put(photoFile);
                }, 2, 2000);
                
                const photoURL = await uploadTask.ref.getDownloadURL();
                firestoreData.photoURL = photoURL;
                firestoreData.photoFileName = fileName;
                
                Logger.success('LocationManager', 'Photo uploaded successfully', { url: photoURL });
            }
            
            // Save location to Firestore with retry
            const docRef = await ErrorHandler.withRetry(async () => {
                return await this.db.collection('locations').add(firestoreData);
            }, 3, 1000);
            
            Logger.success('LocationManager', 'Location saved successfully', { id: docRef.id });
            
            // Notify callback
            if (this.onLocationSaved) {
                this.onLocationSaved({ ...firestoreData, id: docRef.id }, photoFile !== null);
            }
            
            return { 
                success: true, 
                id: docRef.id, 
                message: photoFile ? 'Location and photo saved successfully!' : 'Location saved successfully!' 
            };
            
        }, 'Save location', false);
    }

    /**
     * Get all locations (one-time fetch)
     */
    async getLocations() {
        console.log('📊 Getting locations...');
        
        if (!this.db) {
            throw new Error('Database not available');
        }

        try {
            const snapshot = await this.db.collection('locations')
                .orderBy('dateAdded', 'desc')
                .get();
                
            console.log('✅ Locations fetched, count:', snapshot.size);
            
            const locations = [];
            snapshot.forEach((doc) => {
                const location = { ...doc.data(), id: doc.id };
                locations.push(location);
            });
            
            return locations;
            
        } catch (error) {
            console.error('❌ Error getting locations:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            
            // Show user-friendly error message based on error type
            let errorMessage = 'Cannot load locations: ' + error.message;
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please check Firestore security rules or sign in again.';
            } else if (error.code === 'unavailable') {
                errorMessage = 'Backend temporarily unavailable. Please try again later.';
            } else if (error.code === 'failed-precondition') {
                errorMessage = 'Database not properly configured. Please check Firestore setup.';
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Load locations from Firestore with real-time updates
     */
    loadLocations() {
        console.log('📊 Loading locations...');
        
        if (!this.db || !this.currentUser) {
            console.warn('⚠️ Cannot load locations: db or currentUser not available');
            return;
        }

        console.log('📊 Loading locations for user:', this.currentUser.email);
        
        return this.db.collection('locations')
            .orderBy('dateAdded', 'desc')
            .onSnapshot((snapshot) => {
                console.log('✅ Locations snapshot received, count:', snapshot.size);
                
                const locations = [];
                snapshot.forEach((doc) => {
                    const location = { ...doc.data(), id: doc.id };
                    locations.push(location);
                });
                
                // Notify callback with all locations
                if (this.onLocationLoaded) {
                    this.onLocationLoaded(locations);
                }
                
            }, (error) => {
                console.error('❌ Error loading locations:', error);
                console.error('Error code:', error.code);
                console.error('Error message:', error.message);
                
                // Notify error callback
                if (this.onLocationError) {
                    this.onLocationError('load', error);
                }
                
                // Show user-friendly error message based on error type
                let errorMessage = 'Cannot load locations: ' + error.message;
                if (error.code === 'permission-denied') {
                    errorMessage = 'Permission denied. Please check Firestore security rules.';
                } else if (error.code === 'unavailable') {
                    errorMessage = 'Backend temporarily unavailable. Please try again later.';
                }
                
                throw new Error(errorMessage);
            });
    }

    /**
     * Delete location from Firestore
     */
    async deleteLocation(locationId) {
        console.log('🗑️ Deleting location:', locationId);
        
        if (!this.currentUser || !this.db) {
            throw new Error('User not authenticated or database not available');
        }

        try {
            await this.db.collection('locations').doc(locationId).delete();
            console.log('✅ Location deleted:', locationId);
            
            return { success: true, message: 'Location deleted successfully' };
            
        } catch (error) {
            console.error('❌ Error deleting location:', error);
            
            if (this.onLocationError) {
                this.onLocationError('delete', error);
            }
            
            throw new Error('Error deleting location: ' + error.message);
        }
    }

    /**
     * Update location in Firestore
     */
    async updateLocation(locationId, locationData, photoFile = null) {
        console.log('📝 Updating location:', locationId, locationData);
        
        if (!this.currentUser || !this.db) {
            throw new Error('User not authenticated or database not available');
        }

        try {
            const updateData = {
                ...locationData,
                dateUpdated: window.firebase.firestore.FieldValue.serverTimestamp()
            };

            // Handle photo upload if provided
            if (photoFile) {
                const fileExtension = photoFile.name.split('.').pop();
                const fileName = `locations/${this.currentUser.uid}/${Date.now()}_${locationData.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
                
                const storage = window.firebase.storage();
                const storageRef = storage.ref(fileName);
                const uploadTask = await storageRef.put(photoFile);
                
                const photoURL = await uploadTask.ref.getDownloadURL();
                updateData.photoURL = photoURL;
                updateData.photoFileName = fileName;
            }

            await this.db.collection('locations').doc(locationId).update(updateData);
            console.log('✅ Location updated:', locationId);
            
            return { success: true, message: 'Location updated successfully' };
            
        } catch (error) {
            console.error('❌ Error updating location:', error);
            
            if (this.onLocationError) {
                this.onLocationError('update', error);
            }
            
            throw new Error('Error updating location: ' + error.message);
        }
    }

    /**
     * Get single location by ID
     */
    async getLocation(locationId) {
        console.log('📍 Getting location:', locationId);
        
        if (!this.db) {
            throw new Error('Database not available');
        }

        try {
            const doc = await this.db.collection('locations').doc(locationId).get();
            
            if (doc.exists) {
                return { ...doc.data(), id: doc.id };
            } else {
                throw new Error('Location not found');
            }
            
        } catch (error) {
            console.error('❌ Error getting location:', error);
            throw new Error('Error getting location: ' + error.message);
        }
    }

    /**
     * Set callbacks for location operations
     */
    setLocationSavedCallback(callback) {
        this.onLocationSaved = callback;
    }

    setLocationLoadedCallback(callback) {
        this.onLocationLoaded = callback;
    }

    setLocationErrorCallback(callback) {
        this.onLocationError = callback;
    }

    /**
     * Validate location data
     */
    validateLocationData(locationData) {
        try {
            const { name, state, city, category, address, notes } = locationData;
            
            // Check required fields
            if (!ValidationUtils.isNotEmpty(name)) {
                return { valid: false, message: 'Location name is required' };
            }
            
            if (!ValidationUtils.isNotEmpty(state)) {
                return { valid: false, message: 'State is required' };
            }
            
            if (!ValidationUtils.isNotEmpty(city)) {
                return { valid: false, message: 'City is required' };
            }
            
            if (!ValidationUtils.isNotEmpty(category)) {
                return { valid: false, message: 'Category is required' };
            }
            
            // Validate name length
            if (name && name.length > 100) {
                return { valid: false, message: 'Location name must be less than 100 characters' };
            }
            
            // Validate address length if provided
            if (address && address.length > 200) {
                return { valid: false, message: 'Address must be less than 200 characters' };
            }
            
            // Validate notes length if provided
            if (notes && notes.length > 500) {
                return { valid: false, message: 'Notes must be less than 500 characters' };
            }
            
            // Validate category is from allowed list
            const allowedCategories = ['restaurant', 'cafe', 'bar', 'shopping', 'entertainment', 'outdoors', 'hotel', 'other'];
            if (category && !allowedCategories.includes(category)) {
                return { valid: false, message: 'Invalid category selected' };
            }
            
            // Validate coordinates if provided
            if (locationData.lat !== undefined && (isNaN(locationData.lat) || locationData.lat < -90 || locationData.lat > 90)) {
                return { valid: false, message: 'Invalid latitude coordinate' };
            }
            
            if (locationData.lng !== undefined && (isNaN(locationData.lng) || locationData.lng < -180 || locationData.lng > 180)) {
                return { valid: false, message: 'Invalid longitude coordinate' };
            }
            
            return { valid: true };
            
        } catch (error) {
            Logger.error('LocationManager', 'Location validation error', error);
            return { valid: false, message: 'Validation error occurred' };
        }
    }

    /**
     * Search locations by name or category
     */
    searchLocations(query, category = 'all') {
        if (!this.db) {
            throw new Error('Database not available');
        }

        let baseQuery = this.db.collection('locations');

        // Filter by category if specified
        if (category !== 'all') {
            baseQuery = baseQuery.where('category', '==', category);
        }

        // For now, we'll do client-side text search since Firestore doesn't have full-text search
        // In production, you might want to use Algolia or similar service
        return baseQuery.get().then(snapshot => {
            const locations = [];
            snapshot.forEach(doc => {
                const location = { ...doc.data(), id: doc.id };
                
                // Simple text search in name, city, state, and notes
                if (query) {
                    const searchText = query.toLowerCase();
                    const locationText = [
                        location.name,
                        location.city,
                        location.state,
                        location.notes || ''
                    ].join(' ').toLowerCase();
                    
                    if (locationText.includes(searchText)) {
                        locations.push(location);
                    }
                } else {
                    locations.push(location);
                }
            });
            
            return locations;
        });
    }

    /**
     * Test Firestore connectivity and permissions
     */
    async testFirestoreConnection() {
        console.log('🔍 Testing Firestore connection...');
        
        if (!this.db || !this.currentUser) {
            throw new Error('Database or user not available for testing');
        }

        try {
            // Test read permissions
            console.log('🔍 Testing read permissions...');
            const testRead = await this.db.collection('locations').limit(1).get();
            console.log('✅ Read test successful, docs:', testRead.size);
            
            // Test write permissions with a test document
            console.log('🔍 Testing write permissions...');
            const testData = {
                name: 'Connection Test',
                lat: 0,
                lng: 0,
                state: 'Test',
                city: 'Test',
                category: 'other',
                addedBy: this.currentUser.email,
                userId: this.currentUser.uid,
                dateAdded: window.firebase.firestore.FieldValue.serverTimestamp(),
                isTestDocument: true
            };
            
            const testDoc = await this.db.collection('locations').add(testData);
            console.log('✅ Write test successful, doc ID:', testDoc.id);
            
            // Clean up test document
            await testDoc.delete();
            console.log('✅ Test document cleaned up');
            
            console.log('✅ Firestore connection test passed!');
            return { success: true, message: 'Firestore connection is working properly' };
            
        } catch (error) {
            console.error('❌ Firestore connection test failed:', error);
            
            let errorMessage = 'Firestore connection failed: ' + error.message;
            if (error.code === 'permission-denied') {
                errorMessage = 'Permission denied. Please check Firestore security rules.';
            } else if (error.code === 'failed-precondition') {
                errorMessage = 'Firestore not properly configured. Check Firebase setup.';
            }
            
            return { success: false, message: errorMessage };
        }
    }

    /**
     * Validate location data using ValidationUtils
     */
    validateLocationData(locationData) {
        try {
            const { name, state, city, category, address, notes } = locationData;
            
            // Check required fields
            if (!ValidationUtils.isNotEmpty(name)) {
                return { valid: false, message: 'Location name is required' };
            }
            
            if (!ValidationUtils.isNotEmpty(state)) {
                return { valid: false, message: 'State is required' };
            }
            
            if (!ValidationUtils.isNotEmpty(city)) {
                return { valid: false, message: 'City is required' };
            }
            
            if (!ValidationUtils.isNotEmpty(category)) {
                return { valid: false, message: 'Category is required' };
            }
            
            // Validate name length
            if (name && name.length > 100) {
                return { valid: false, message: 'Location name must be less than 100 characters' };
            }
            
            // Validate address length if provided
            if (address && address.length > 200) {
                return { valid: false, message: 'Address must be less than 200 characters' };
            }
            
            // Validate notes length if provided
            if (notes && notes.length > 500) {
                return { valid: false, message: 'Notes must be less than 500 characters' };
            }
            
            // Validate category is from allowed list
            const allowedCategories = ['restaurant', 'cafe', 'bar', 'shopping', 'entertainment', 'outdoors', 'hotel', 'other'];
            if (category && !allowedCategories.includes(category)) {
                return { valid: false, message: 'Invalid category selected' };
            }
            
            // Validate coordinates if provided
            if (locationData.lat !== undefined && (isNaN(locationData.lat) || locationData.lat < -90 || locationData.lat > 90)) {
                return { valid: false, message: 'Invalid latitude coordinate' };
            }
            
            if (locationData.lng !== undefined && (isNaN(locationData.lng) || locationData.lng < -180 || locationData.lng > 180)) {
                return { valid: false, message: 'Invalid longitude coordinate' };
            }
            
            return { valid: true };
            
        } catch (error) {
            Logger.error('LocationManager', 'Location validation error', error);
            return { valid: false, message: 'Validation error occurred' };
        }
    }
}

// Export as global for now, will be converted to ES modules later
window.LocationManager = LocationManager;

// Log module loading
if (window.Logger) {
    Logger.info('LocationManager module loaded');
} else {
    console.log('✅ Location Manager module loaded');
}

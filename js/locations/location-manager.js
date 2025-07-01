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
        console.log('💾 Saving location:', locationData);
        
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        if (!this.db || !this.storage) {
            throw new Error('Firebase services not initialized');
        }

        // Validate required fields
        if (!locationData.name || !locationData.state || !locationData.city || !locationData.category) {
            throw new Error('Please fill in all required fields');
        }

        // Prepare location data for Firestore
        const firestoreData = {
            name: locationData.name.trim(),
            address: locationData.address || '',
            lat: locationData.lat,
            lng: locationData.lng,
            state: locationData.state,
            city: locationData.city.trim(),
            category: locationData.category,
            notes: locationData.notes ? locationData.notes.trim() : '',
            addedBy: this.currentUser.email,
            userId: this.currentUser.uid,
            dateAdded: window.firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Upload photo if provided
            if (photoFile) {
                console.log('📸 Uploading photo:', photoFile.name);
                
                // Create unique filename
                const fileExtension = photoFile.name.split('.').pop();
                const fileName = `locations/${this.currentUser.uid}/${Date.now()}_${locationData.name.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
                
                // Upload to Firebase Storage
                const storage = window.firebase.storage();
                const storageRef = storage.ref(fileName);
                const uploadTask = await storageRef.put(photoFile);
                
                // Get download URL
                const photoURL = await uploadTask.ref.getDownloadURL();
                firestoreData.photoURL = photoURL;
                firestoreData.photoFileName = fileName;
                
                console.log('✅ Photo uploaded successfully:', photoURL);
            }
            
            // Save location to Firestore
            console.log('💾 Saving to Firestore...');
            const docRef = await this.db.collection('locations').add(firestoreData);
            
            console.log('✅ Location saved with ID:', docRef.id);
            
            // Notify callback
            if (this.onLocationSaved) {
                this.onLocationSaved({ ...firestoreData, id: docRef.id }, photoFile !== null);
            }
            
            return { 
                success: true, 
                id: docRef.id, 
                message: photoFile ? 'Location and photo saved successfully!' : 'Location saved successfully!' 
            };
            
        } catch (error) {
            console.error('❌ Error saving location:', error);
            
            // Notify error callback
            if (this.onLocationError) {
                this.onLocationError('save', error);
            }
            
            throw new Error('Error saving location: ' + error.message);
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
        const errors = [];

        if (!locationData.name || !locationData.name.trim()) {
            errors.push('Location name is required');
        }

        if (!locationData.state) {
            errors.push('State is required');
        }

        if (!locationData.city || !locationData.city.trim()) {
            errors.push('City is required');
        }

        if (!locationData.category) {
            errors.push('Category is required');
        }

        if (!locationData.lat || !locationData.lng) {
            errors.push('Location coordinates are required (click on map to select)');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get location categories
     */
    getLocationCategories() {
        return [
            { value: 'business', label: 'Business' },
            { value: 'restaurant', label: 'Restaurant' },
            { value: 'landmark', label: 'Landmark' },
            { value: 'park', label: 'Park' },
            { value: 'shopping', label: 'Shopping' },
            { value: 'entertainment', label: 'Entertainment' },
            { value: 'healthcare', label: 'Healthcare' },
            { value: 'education', label: 'Education' },
            { value: 'other', label: 'Other' }
        ];
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
}

// Export as global for now, will be converted to ES modules later
window.LocationManager = LocationManager;

console.log('✅ Location Manager module loaded');

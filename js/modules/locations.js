// js/modules/locations.js
export class LocationManager {
    constructor(firestore, storage, authManager) {
        this.db = firestore;
        this.storage = storage;
        this.auth = authManager;
        this.locations = new Map();
        this.filters = {
            category: 'all',
            searchTerm: '',
            showOnlyMine: false,
            dateRange: null
        };
    }

    async saveLocation(locationData, photoFile = null) {
        try {
            // Validate required fields
            this.validateLocationData(locationData);

            // Upload photo if provided
            if (photoFile) {
                const photoResult = await this.uploadPhoto(photoFile, locationData.name);
                locationData.photoURL = photoResult.url;
                locationData.photoFileName = photoResult.fileName;
            }

            // Add metadata
            locationData.addedBy = this.auth.currentUser.email;
            locationData.userId = this.auth.currentUser.uid;
            locationData.dateAdded = firebase.firestore.FieldValue.serverTimestamp();
            locationData.lastModified = firebase.firestore.FieldValue.serverTimestamp();

            // Save to Firestore
            const docRef = await this.db.collection('locations').add(locationData);
            locationData.id = docRef.id;
            
            this.locations.set(docRef.id, locationData);
            return { success: true, id: docRef.id, location: locationData };

        } catch (error) {
            console.error('Error saving location:', error);
            return { success: false, error: error.message };
        }
    }

    async updateLocation(locationId, updateData, newPhotoFile = null) {
        try {
            const existingLocation = this.locations.get(locationId);
            if (!existingLocation) throw new Error('Location not found');

            // Check permissions
            if (existingLocation.userId !== this.auth.currentUser.uid) {
                throw new Error('Permission denied');
            }

            // Handle photo update
            if (newPhotoFile) {
                // Delete old photo if exists
                if (existingLocation.photoFileName) {
                    await this.deletePhoto(existingLocation.photoFileName);
                }
                
                // Upload new photo
                const photoResult = await this.uploadPhoto(newPhotoFile, updateData.name || existingLocation.name);
                updateData.photoURL = photoResult.url;
                updateData.photoFileName = photoResult.fileName;
            }

            updateData.lastModified = firebase.firestore.FieldValue.serverTimestamp();

            // Update in Firestore
            await this.db.collection('locations').doc(locationId).update(updateData);
            
            // Update local cache
            const updatedLocation = { ...existingLocation, ...updateData };
            this.locations.set(locationId, updatedLocation);

            return { success: true, location: updatedLocation };

        } catch (error) {
            console.error('Error updating location:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteLocation(locationId) {
        try {
            const location = this.locations.get(locationId);
            if (!location) throw new Error('Location not found');

            // Check permissions
            if (location.userId !== this.auth.currentUser.uid) {
                throw new Error('Permission denied');
            }

            // Delete photo if exists
            if (location.photoFileName) {
                await this.deletePhoto(location.photoFileName);
            }

            // Delete from Firestore
            await this.db.collection('locations').doc(locationId).delete();
            
            // Remove from local cache
            this.locations.delete(locationId);

            return { success: true };

        } catch (error) {
            console.error('Error deleting location:', error);
            return { success: false, error: error.message };
        }
    }

    async uploadPhoto(file, locationName) {
        // Validate file
        if (!file.type.startsWith('image/')) {
            throw new Error('Please select an image file');
        }
        
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Photo size must be less than 5MB');
        }

        // Create unique filename
        const fileExtension = file.name.split('.').pop();
        const fileName = `locations/${this.auth.currentUser.uid}/${Date.now()}_${locationName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;
        
        // Upload to Firebase Storage
        const storageRef = this.storage.ref(fileName);
        const uploadTask = await storageRef.put(file);
        const url = await uploadTask.ref.getDownloadURL();

        return { url, fileName };
    }

    async deletePhoto(fileName) {
        try {
            await this.storage.ref(fileName).delete();
        } catch (error) {
            console.warn('Error deleting photo:', error);
        }
    }

    validateLocationData(data) {
        const required = ['name', 'lat', 'lng', 'state', 'city', 'category'];
        const missing = required.filter(field => !data[field]);
        
        if (missing.length > 0) {
            throw new Error(`Missing required fields: ${missing.join(', ')}`);
        }
    }

    // Enhanced filtering with debouncing
    applyFilters(locations = null) {
        const allLocations = locations || Array.from(this.locations.values());
        
        return allLocations.filter(location => {
            // Category filter
            if (this.filters.category !== 'all' && location.category !== this.filters.category) {
                return false;
            }

            // Search term filter
            if (this.filters.searchTerm) {
                const searchLower = this.filters.searchTerm.toLowerCase();
                const searchFields = [
                    location.name,
                    location.address,
                    location.city,
                    location.state,
                    location.notes
                ].filter(Boolean);
                
                const matches = searchFields.some(field => 
                    field.toLowerCase().includes(searchLower)
                );
                
                if (!matches) return false;
            }

            // Show only mine filter
            if (this.filters.showOnlyMine && location.userId !== this.auth.currentUser?.uid) {
                return false;
            }

            // Date range filter
            if (this.filters.dateRange) {
                const locationDate = location.dateAdded?.toDate?.() || new Date(location.dateAdded);
                if (locationDate < this.filters.dateRange.start || locationDate > this.filters.dateRange.end) {
                    return false;
                }
            }

            return true;
        });
    }

    setFilter(filterType, value) {
        this.filters[filterType] = value;
    }

    // Real-time location listener
    onLocationsChanged(callback) {
        return this.db.collection('locations')
            .orderBy('dateAdded', 'desc')
            .onSnapshot((snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    const location = { id: change.doc.id, ...change.doc.data() };
                    
                    if (change.type === 'added' || change.type === 'modified') {
                        this.locations.set(change.doc.id, location);
                    } else if (change.type === 'removed') {
                        this.locations.delete(change.doc.id);
                    }
                });
                
                callback(Array.from(this.locations.values()));
            });
    }
}

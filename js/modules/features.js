// js/modules/features.js
export class AdvancedFeatures {
    constructor(locationManager, mapManager) {
        this.locationManager = locationManager;
        this.mapManager = mapManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Bulk operations
        this.setupBulkOperations();
        
        // Export/Import functionality
        this.setupDataManagement();
        
        // Analytics dashboard
        this.setupAnalytics();
        
        // Location sharing
        this.setupSharing();
    }

    // Bulk Operations
    setupBulkOperations() {
        const bulkActions = document.getElementById('bulk-actions');
        if (!bulkActions) return;

        bulkActions.innerHTML = `
            <div class="bulk-actions-panel" style="display: none;">
                <div class="bulk-actions-header">
                    <span id="selected-count">0 locations selected</span>
                    <div class="bulk-actions-buttons">
                        <button class="btn btn-secondary" onclick="this.clearSelection()">Clear</button>
                        <button class="btn btn-primary" onclick="this.bulkEdit()">Bulk Edit</button>
                        <button class="btn btn-danger" onclick="this.bulkDelete()">Delete Selected</button>
                    </div>
                </div>
            </div>
        `;
    }

    // Data Export/Import
    setupDataManagement() {
        const dataManager = document.getElementById('data-manager');
        if (!dataManager) return;

        dataManager.innerHTML = `
            <div class="data-management-panel">
                <h3>Data Management</h3>
                <div class="data-actions">
                    <button class="btn btn-primary" onclick="this.exportData()">
                        📤 Export Locations
                    </button>
                    <button class="btn btn-secondary" onclick="this.importData()">
                        📥 Import Locations
                    </button>
                    <input type="file" id="import-file" accept=".json" style="display: none;">
                </div>
            </div>
        `;
    }

    async exportData() {
        try {
            const locations = Array.from(this.locationManager.locations.values());
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                locations: locations.map(loc => ({
                    ...loc,
                    // Remove sensitive data
                    userId: undefined,
                    photoFileName: undefined
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merkel-view-locations-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showToast('Locations exported successfully!', 'success');
        } catch (error) {
            this.showToast('Export failed: ' + error.message, 'error');
        }
    }

    async importData() {
        const fileInput = document.getElementById('import-file');
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                if (!data.locations || !Array.isArray(data.locations)) {
                    throw new Error('Invalid file format');
                }

                let imported = 0;
                for (const location of data.locations) {
                    // Validate and clean location data
                    const cleanLocation = {
                        name: location.name,
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lng),
                        address: location.address,
                        city: location.city,
                        state: location.state,
                        category: location.category,
                        notes: location.notes || ''
                    };

                    const result = await this.locationManager.saveLocation(cleanLocation);
                    if (result.success) imported++;
                }

                this.showToast(`Successfully imported ${imported} locations!`, 'success');
            } catch (error) {
                this.showToast('Import failed: ' + error.message, 'error');
            }
        };
        
        fileInput.click();
    }

    // Analytics Dashboard
    setupAnalytics() {
        const analytics = document.getElementById('analytics-panel');
        if (!analytics) return;

        this.updateAnalytics();
        
        // Update analytics every 30 seconds
        setInterval(() => this.updateAnalytics(), 30000);
    }

    updateAnalytics() {
        const locations = Array.from(this.locationManager.locations.values());
        const analytics = this.calculateAnalytics(locations);
        
        const analyticsPanel = document.getElementById('analytics-panel');
        if (!analyticsPanel) return;

        analyticsPanel.innerHTML = `
            <div class="analytics-dashboard">
                <h3>📊 Dashboard</h3>
                <div class="analytics-grid">
                    <div class="stat-card">
                        <div class="stat-value">${analytics.total}</div>
                        <div class="stat-label">Total Locations</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${analytics.categories.length}</div>
                        <div class="stat-label">Categories</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${analytics.states.length}</div>
                        <div class="stat-label">States/Regions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${analytics.withPhotos}</div>
                        <div class="stat-label">With Photos</div>
                    </div>
                </div>
                <div class="category-breakdown">
                    <h4>Category Breakdown</h4>
                    ${Object.entries(analytics.categoryCount)
                        .map(([cat, count]) => `
                            <div class="category-stat">
                                <span>${cat}</span>
                                <span class="count">${count}</span>
                            </div>
                        `).join('')}
                </div>
            </div>
        `;
    }

    calculateAnalytics(locations) {
        const categories = [...new Set(locations.map(l => l.category))];
        const states = [...new Set(locations.map(l => l.state))];
        const withPhotos = locations.filter(l => l.photoURL).length;
        
        const categoryCount = locations.reduce((acc, loc) => {
            acc[loc.category] = (acc[loc.category] || 0) + 1;
            return acc;
        }, {});

        return {
            total: locations.length,
            categories,
            states,
            withPhotos,
            categoryCount
        };
    }

    // Location Sharing
    setupSharing() {
        // Add share buttons to location cards
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-location-btn')) {
                const locationId = e.target.dataset.locationId;
                this.shareLocation(locationId);
            }
        });
    }

    async shareLocation(locationId) {
        const location = this.locationManager.locations.get(locationId);
        if (!location) return;

        const shareData = {
            title: `Check out ${location.name}`,
            text: `${location.name} in ${location.city}, ${location.state}`,
            url: `${window.location.origin}?location=${locationId}`
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(shareData.url);
                this.showToast('Location link copied to clipboard!', 'success');
            }
        } catch (error) {
            console.warn('Sharing failed:', error);
        }
    }

    // Enhanced Toast Notifications
    showToast(message, type = 'info', duration = 3000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <div class="toast-message">${message}</div>
                <button class="toast-close">&times;</button>
            </div>
        `;

        container.appendChild(toast);

        // Auto-remove
        setTimeout(() => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        }, duration);

        // Manual close
        toast.querySelector('.toast-close').onclick = () => {
            toast.remove();
            if (container.children.length === 0) {
                container.remove();
            }
        };
    }
}

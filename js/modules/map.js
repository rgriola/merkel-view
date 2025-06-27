// js/modules/map.js
export class MapManager {
    constructor(googleMaps, containerId) {
        this.google = googleMaps;
        this.map = null;
        this.geocoder = null;
        this.markers = new Map();
        this.clusterer = null;
        this.containerId = containerId;
    }

    async initialize() {
        const mapElement = document.getElementById(this.containerId);
        if (!mapElement) throw new Error('Map container not found');

        // Initialize map with better defaults
        this.map = new this.google.maps.Map(mapElement, {
            zoom: 4,
            center: { lat: 39.8283, lng: -98.5795 },
            mapTypeId: 'roadmap',
            gestureHandling: 'cooperative',
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            styles: this.getMapStyles()
        });

        this.geocoder = new this.google.maps.Geocoder();
        
        // Add marker clusterer for better performance
        if (this.google.maps.marker && this.google.maps.marker.AdvancedMarkerElement) {
            this.initializeClusterer();
        }

        return this.map;
    }

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

    initializeClusterer() {
        // Initialize marker clusterer for better performance with many markers
        import('https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js')
            .then(({ MarkerClusterer }) => {
                this.clusterer = new MarkerClusterer({ map: this.map });
            })
            .catch(console.warn);
    }

    addMarker(location, options = {}) {
        const pinElement = new this.google.maps.marker.PinElement({
            background: options.color || '#607D8B',
            borderColor: '#FFFFFF',
            glyph: options.emoji || '📍',
            scale: options.scale || 1.0
        });

        const marker = new this.google.maps.marker.AdvancedMarkerElement({
            position: { lat: location.lat, lng: location.lng },
            map: this.map,
            title: location.name,
            content: pinElement.element
        });

        if (location.id) {
            this.markers.set(location.id, marker);
        }

        return marker;
    }

    removeMarker(id) {
        const marker = this.markers.get(id);
        if (marker) {
            marker.map = null;
            this.markers.delete(id);
        }
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.map = null);
        this.markers.clear();
    }

    fitToMarkers() {
        if (this.markers.size === 0) return;

        const bounds = new this.google.maps.LatLngBounds();
        this.markers.forEach(marker => {
            bounds.extend(marker.position);
        });
        
        this.map.fitBounds(bounds);
    }
}

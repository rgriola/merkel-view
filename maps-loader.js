// maps-loader.js - Dynamic Google Maps API Loading
(function() {
    'use strict';
    
    let mapsLoaded = false;
    let mapsLoading = false;
    
    function loadGoogleMaps() {
        if (mapsLoaded || mapsLoading) return;
        
        if (!window.AppConfig) {
            console.warn('App configuration not loaded, retrying Maps API load...');
            setTimeout(loadGoogleMaps, 100);
            return;
        }
        
        mapsLoading = true;
        const apiKey = window.AppConfig.googleMaps.apiKey;
        
        // Check if API key is configured
        if (!apiKey || apiKey.includes('your-') || apiKey.includes('demo-')) {
            console.warn('⚠️ Google Maps API key not configured');
            
            // Show fallback message
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f0f0f0; color: #666; text-align: center; padding: 20px; border-radius: 8px;">
                        <div>
                            <h3>🗺️ Google Maps Unavailable</h3>
                            <p>Please configure your Google Maps API key in config.js</p>
                            <p><small>The app will work without maps, but you won't be able to see locations visually.</small></p>
                        </div>
                    </div>
                `;
            }
            
            // Disable map-related functions
            window.initMap = function() {
                console.warn('Google Maps API not available');
            };
            
            return;
        }
        
        // Create script element for Maps JavaScript API
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&loading=async&libraries=places`;
        script.async = true;
        script.defer = true;
        
        // Handle loading success
        script.onload = function() {
            mapsLoaded = true;
            mapsLoading = false;
            console.log('🗺️ Google Maps API loaded successfully');
            console.log('✅ Places API ready for new PlaceAutocompleteElement usage');
        };
        
        // Handle loading error
        script.onerror = function() {
            mapsLoading = false;
            console.error('❌ Failed to load Google Maps API');
            
            // Show error in map container
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #ffebee; color: #c62828; text-align: center; padding: 20px; border-radius: 8px; border: 2px solid #ef5350;">
                        <div>
                            <h3>❌ Google Maps Failed to Load</h3>
                            <p>Please check your API key and internet connection</p>
                            <button onclick="location.reload()" style="background: #c62828; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Retry</button>
                        </div>
                    </div>
                `;
            }
        };
        
        // Add to document
        document.head.appendChild(script);
    }
    
    // Load maps when config is ready
    window.addEventListener('load', loadGoogleMaps);
    
    // Also try to load immediately if everything is ready
    if (document.readyState === 'complete') {
        loadGoogleMaps();
    }
})();

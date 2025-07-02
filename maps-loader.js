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
        
        // Create script element for Maps JavaScript API with Places API v2
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&loading=async&libraries=places&v=beta`;
        script.async = true;
        script.defer = true;
        
        // Handle loading success
        script.onload = function() {
            mapsLoaded = true;
            mapsLoading = false;
            console.log('🗺️ Google Maps API loaded successfully');
            console.log('✅ Places API ready for new PlaceAutocompleteElement usage');
            
            // Add detailed API availability check
            setTimeout(() => {
                console.log('🔍 Checking Google APIs availability:');
                console.log('- Maps JavaScript API:', typeof google !== 'undefined' && typeof google.maps !== 'undefined' ? '✅ Available' : '❌ Missing');
                console.log('- Places API:', typeof google !== 'undefined' && typeof google.maps !== 'undefined' && typeof google.maps.places !== 'undefined' ? '✅ Available' : '❌ Missing');
                console.log('- Places AutocompletePlaces:', typeof google !== 'undefined' && typeof google.maps !== 'undefined' && 
                    typeof google.maps.places !== 'undefined' && typeof google.maps.places.PlaceAutocompleteElement !== 'undefined' ? '✅ Available' : '❌ Missing');
                console.log('- Geocoding API:', typeof google !== 'undefined' && typeof google.maps !== 'undefined' && 
                    typeof google.maps.Geocoder !== 'undefined' ? '✅ Available' : '❌ Missing');
            }, 1000);
        };
        
        // Handle loading error
        script.onerror = function() {
            mapsLoading = false;
            console.error('❌ Failed to load Google Maps API');
            
            // Log detailed troubleshooting info
            console.log('📌 Maps API Troubleshooting Guide:');
            console.log('1. Check if your API key is correct');
            console.log('2. Ensure the following APIs are enabled in Google Cloud Console:');
            console.log('   - Maps JavaScript API');
            console.log('   - Places API (New)');
            console.log('   - Geocoding API');
            console.log('3. Verify API key restrictions (allowed referrers/domains)');
            console.log('4. Check browser console for specific API error messages');
            
            // Show error in map container
            const mapElement = document.getElementById('map');
            if (mapElement) {
                mapElement.innerHTML = `
                    <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #ffebee; color: #c62828; text-align: center; padding: 20px; border-radius: 8px; border: 2px solid #ef5350;">
                        <div>
                            <h3>❌ Google Maps Failed to Load</h3>
                            <p>Please check:</p>
                            <ul style="text-align: left; margin: 10px auto; max-width: 400px;">
                                <li>API key configuration</li>
                                <li>Maps JavaScript API is enabled</li>
                                <li>Places API (New) is enabled</li>
                                <li>API key restrictions (if any)</li>
                                <li>Check browser console (F12) for details</li>
                            </ul>
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

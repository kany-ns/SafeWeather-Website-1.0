// Suppress known Google Maps deprecation warnings
// These APIs are deprecated but still functional and will be updated in future versions
const originalWarn = console.warn;
console.warn = function(...args) {
    // Suppress specific Google Maps deprecation warnings
    const message = args.join(' ');
    if (message.includes('google.maps.places.SearchBox is not available to new customers') ||
        message.includes('google.maps.Marker is deprecated') ||
        message.includes('Google Maps JavaScript API has been loaded directly without loading=async')) {
        return; // Suppress these warnings
    }
    originalWarn.apply(console, args);
};

// Global initMap function for Google Maps API callback
// Note: Using callback parameter with async defer may cause loading warnings,
// but this is the recommended approach for Google Maps API
window.initMap = function() {
    // Prevent multiple initializations
    if (window.hazardMapInstance) {
        console.log('Map already initialized, skipping...');
        return;
    }

    // Initialize map when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.hazardMapInstance = new HazardMap();
        });
    } else {
        window.hazardMapInstance = new HazardMap();
    }
};

class HazardMap {
    constructor() {
        // Prevent multiple instances
        if (window.hazardMapInstance && window.hazardMapInstance !== this) {
            console.log('HazardMap instance already exists, skipping initialization');
            return window.hazardMapInstance;
        }

        this.map = null;
        this.markers = [];
        this.layers = {};
        this.currentLocation = null;
        this.userRoute = null;
        this.init();
    }

    init() {
        // Check if Google Maps API is loaded
        if (typeof google === 'undefined') {
            console.warn('Google Maps API not loaded. Please check your API key.');
            this.showMapError('Google Maps API key is required. Please get a key from https://developers.google.com/maps/documentation/javascript/get-api-key');
            return;
        }

        // Initialize map components
        try {
            this.initializeMap();
            this.setupMapControls();
            this.loadHazardData();
            this.setupEventListeners();
            console.log('✅ Hazard Map initialized successfully');
        } catch (error) {
            console.error('Error initializing map:', error);
            this.showMapError('Failed to initialize map. Please check your API key and ensure it allows requests from this domain.');
        }
    }

    initializeMap() {
        // Default center: Batu Pahat, Johor
        const defaultCenter = { lat: 1.8494, lng: 102.9288 };
        
        this.map = new google.maps.Map(document.getElementById('map'), {
            center: defaultCenter,
            zoom: 12,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: this.getMapStyles(),
            mapTypeControl: true,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.RIGHT_CENTER
            },
            streetViewControl: false,
            fullscreenControl: true,
            fullscreenControlOptions: {
                position: google.maps.ControlPosition.RIGHT_BOTTOM
            }
        });

        // Add custom controls
        this.addCustomControls();
    }

    getMapStyles() {
        return [
            {
                "featureType": "poi.school",
                "stylers": [{ "visibility": "on" }]
            },
            {
                "featureType": "poi.business",
                "stylers": [{ "visibility": "off" }]
            },
            {
                "featureType": "transit",
                "stylers": [{ "visibility": "simplified" }]
            },
            {
                "elementType": "labels",
                "stylers": [{ "visibility": "on" }]
            },
            {
                "featureType": "road",
                "elementType": "geometry.stroke",
                "stylers": [{ "visibility": "on" }]
            }
        ];
    }

    addCustomControls() {
        // Custom control for location tracking
        const locationControl = document.createElement('div');
        locationControl.className = 'map-control';
        locationControl.innerHTML = '<i class="fas fa-location-arrow"></i>';
        locationControl.title = 'Find My Location';
        locationControl.addEventListener('click', () => {
            this.getUserLocation();
        });

        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(locationControl);

        // Custom control for hazard layer toggle
        const layerControl = document.createElement('div');
        layerControl.className = 'map-control';
        layerControl.innerHTML = '<i class="fas fa-layer-group"></i>';
        layerControl.title = 'Toggle Layers';
        layerControl.addEventListener('click', () => {
            this.toggleLayersPanel();
        });

        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(layerControl);
    }

    setupMapControls() {
        // Overlay type selector
        document.getElementById('overlayType').addEventListener('change', (e) => {
            this.changeOverlay(e.target.value);
        });

        // Severity filters
        document.querySelectorAll('.severity-filters input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const severity = e.target.dataset.severity;
                this.filterMarkersBySeverity(severity, e.target.checked);
            });
        });

        // Search location
        const searchInput = document.getElementById('searchLocation');
        // Note: SearchBox is deprecated but still functional. Consider upgrading to Autocomplete in future
        const searchBox = new google.maps.places.SearchBox(searchInput);
        
        searchBox.addListener('places_changed', () => {
            const places = searchBox.getPlaces();
            if (places.length === 0) return;
            
            const place = places[0];
            if (!place.geometry) return;
            
            this.map.setCenter(place.geometry.location);
            this.map.setZoom(15);
            
            // Add marker for searched location
            this.addSearchMarker(place);
        });

        // Route selection
        document.getElementById('routeSelect').addEventListener('change', (e) => {
            if (e.target.value) {
                this.showRoute(e.target.value);
            }
        });

        // Alert radius slider
        const radiusSlider = document.getElementById('alertRadius');
        const radiusValue = document.getElementById('radiusValue');
        
        radiusSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            radiusValue.textContent = `${value} km`;
            this.updateAlertRadius(parseInt(value));
        });

        // Overlay buttons
        document.querySelectorAll('.overlay-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const layer = e.target.closest('.overlay-btn').dataset.layer;
                this.toggleLayer(layer);
                
                // Update active state
                document.querySelectorAll('.overlay-btn').forEach(b => {
                    b.classList.remove('active');
                });
                e.target.closest('.overlay-btn').classList.add('active');
            });
        });
    }

    setupEventListeners() {
        // Get my location button
        document.querySelector('.btn-primary.btn-full')?.addEventListener('click', () => {
            this.getUserLocation();
        });

        // Show route button
        document.querySelector('button[onclick="showRoute()"]')?.addEventListener('click', () => {
            const routeSelect = document.getElementById('routeSelect');
            if (routeSelect.value) {
                this.showRoute(routeSelect.value);
            }
        });

        // Print map button
        document.querySelector('button[onclick="printMap()"]')?.addEventListener('click', () => {
            this.printMap();
        });

        // Share map button
        document.querySelector('button[onclick="shareMap()"]')?.addEventListener('click', () => {
            this.shareMap();
        });
    }

    async loadHazardData() {
        try {
            // Sample hazard data (in production, this would come from API)
            const hazards = [
                {
                    id: 1,
                    type: 'flood',
                    severity: 'critical',
                    location: { lat: 1.8520, lng: 102.9320 },
                    title: 'Flood Warning',
                    description: 'High water level detected. Avoid this area.',
                    radius: 500,
                    timestamp: new Date().toISOString()
                },
                {
                    id: 2,
                    type: 'storm',
                    severity: 'warning',
                    location: { lat: 1.8470, lng: 102.9250 },
                    title: 'Thunderstorm Alert',
                    description: 'Heavy rain and lightning expected.',
                    radius: 1000,
                    timestamp: new Date().toISOString()
                },
                {
                    id: 3,
                    type: 'accident',
                    severity: 'info',
                    location: { lat: 1.8450, lng: 102.9350 },
                    title: 'Road Accident',
                    description: 'Minor accident reported. Expect delays.',
                    radius: 300,
                    timestamp: new Date().toISOString()
                },
                {
                    id: 4,
                    type: 'road_work',
                    severity: 'info',
                    location: { lat: 1.8500, lng: 102.9300 },
                    title: 'Road Works',
                    description: 'Road maintenance in progress.',
                    radius: 200,
                    timestamp: new Date().toISOString()
                }
            ];

            // School locations
            const schools = [
                {
                    id: 1,
                    name: 'SK Batu Pahat',
                    location: { lat: 1.8485, lng: 102.9310 },
                    type: 'primary'
                },
                {
                    id: 2,
                    name: 'SMK Tunku Ismail',
                    location: { lat: 1.8460, lng: 102.9280 },
                    type: 'secondary'
                }
            ];

            // Bus stops
            const busStops = [
                { lat: 1.8490, lng: 102.9330 },
                { lat: 1.8475, lng: 102.9295 },
                { lat: 1.8455, lng: 102.9345 }
            ];

            // Add hazards to map
            hazards.forEach(hazard => {
                this.addHazardMarker(hazard);
            });

            // Add schools to map
            schools.forEach(school => {
                this.addSchoolMarker(school);
            });

            // Add bus stops to map
            busStops.forEach(stop => {
                this.addBusStopMarker(stop);
            });

            // Create sample routes
            this.createSampleRoutes();

        } catch (error) {
            console.error('Failed to load hazard data:', error);
            this.showNotification('Failed to load hazard data. Please try again.', 'error');
        }
    }

    addHazardMarker(hazard) {
        const icon = this.getHazardIcon(hazard);
        
        // Note: google.maps.Marker is deprecated but still functional. Consider upgrading to AdvancedMarkerElement in future
        const marker = new google.maps.Marker({
            position: hazard.location,
            map: this.map,
            title: hazard.title,
            icon: icon,
            animation: google.maps.Animation.DROP
        });

        const infoWindow = new google.maps.InfoWindow({
            content: this.getHazardInfoContent(hazard)
        });

        marker.addListener('click', () => {
            infoWindow.open(this.map, marker);
        });

        // Add circle for radius
        if (hazard.radius) {
            const circle = new google.maps.Circle({
                map: this.map,
                center: hazard.location,
                radius: hazard.radius,
                fillColor: this.getSeverityColor(hazard.severity),
                fillOpacity: 0.2,
                strokeColor: this.getSeverityColor(hazard.severity),
                strokeOpacity: 0.8,
                strokeWeight: 2
            });
        }

        this.markers.push({
            type: 'hazard',
            severity: hazard.severity,
            marker: marker,
            data: hazard
        });
    }

    addSchoolMarker(school) {
        const marker = new google.maps.Marker({
            position: school.location,
            map: this.map,
            title: school.name,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#4f46e5',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10
            },
            label: {
                text: 'S',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold'
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <h4><i class="fas fa-school"></i> ${school.name}</h4>
                    <p>${school.type === 'primary' ? 'Primary School' : 'Secondary School'}</p>
                    <button onclick="navigateToSchool(${school.location.lat}, ${school.location.lng})">
                        <i class="fas fa-directions"></i> Get Directions
                    </button>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(this.map, marker);
        });

        this.markers.push({
            type: 'school',
            marker: marker,
            data: school
        });
    }

    addBusStopMarker(location) {
        const marker = new google.maps.Marker({
            position: location,
            map: this.map,
            title: 'Bus Stop',
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: '#f59e0b',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 8
            },
            label: {
                text: 'B',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 'bold'
            }
        });

        this.markers.push({
            type: 'bus_stop',
            marker: marker
        });
    }

    addSearchMarker(place) {
        // Clear previous search marker
        if (this.searchMarker) {
            this.searchMarker.setMap(null);
        }

        this.searchMarker = new google.maps.Marker({
            map: this.map,
            position: place.geometry.location,
            title: place.name,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="info-window">
                    <h4><i class="fas fa-map-marker-alt"></i> ${place.name}</h4>
                    <p>${place.formatted_address || ''}</p>
                    <div class="info-actions">
                        <button onclick="addToSavedLocations('${place.name}', ${place.geometry.location.lat()}, ${place.geometry.location.lng()})">
                            <i class="fas fa-bookmark"></i> Save
                        </button>
                        <button onclick="getWeatherForLocation(${place.geometry.location.lat()}, ${place.geometry.location.lng()})">
                            <i class="fas fa-cloud-sun-rain"></i> Weather
                        </button>
                    </div>
                </div>
            `
        });

        infoWindow.open(this.map, this.searchMarker);
    }

    getHazardIcon(hazard) {
        const icons = {
            flood: {
                critical: '🚨',
                warning: '⚠️',
                info: 'ℹ️'
            },
            storm: {
                critical: '⛈️',
                warning: '🌩️',
                info: '🌧️'
            },
            accident: {
                critical: '🚑',
                warning: '🚧',
                info: '🚦'
            },
            road_work: {
                info: '🛠️'
            }
        };

        const icon = icons[hazard.type]?.[hazard.severity] || '📍';
        
        return {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="18" fill="${this.getSeverityColor(hazard.severity)}" stroke="#ffffff" stroke-width="2"/>
                    <text x="20" y="25" text-anchor="middle" fill="#ffffff" font-size="20" font-family="Arial">${icon}</text>
                </svg>
            `)}`
        };
    }

    getSeverityColor(severity) {
        const colors = {
            critical: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
            safe: '#10b981'
        };
        return colors[severity] || '#6b7280';
    }

    getHazardInfoContent(hazard) {
        return `
            <div class="hazard-info">
                <div class="hazard-header ${hazard.severity}">
                    <h4><i class="fas fa-exclamation-triangle"></i> ${hazard.title}</h4>
                    <span class="severity-badge">${hazard.severity.toUpperCase()}</span>
                </div>
                <div class="hazard-body">
                    <p>${hazard.description}</p>
                    <div class="hazard-details">
                        <p><i class="fas fa-clock"></i> ${new Date(hazard.timestamp).toLocaleTimeString()}</p>
                        <p><i class="fas fa-location-dot"></i> ${hazard.radius}m radius</p>
                    </div>
                </div>
                <div class="hazard-actions">
                    <button onclick="avoidThisArea(${hazard.location.lat}, ${hazard.location.lng})">
                        <i class="fas fa-route"></i> Avoid Area
                    </button>
                    <button onclick="reportHazard(${hazard.id})">
                        <i class="fas fa-flag"></i> Report
                    </button>
                </div>
            </div>
        `;
    }

    createSampleRoutes() {
        const routes = {
            bp101: [
                { lat: 1.8480, lng: 102.9270 },
                { lat: 1.8475, lng: 102.9290 },
                { lat: 1.8460, lng: 102.9310 },
                { lat: 1.8485, lng: 102.9310 } // SK Batu Pahat
            ],
            bp102: [
                { lat: 1.8500, lng: 102.9250 },
                { lat: 1.8490, lng: 102.9280 },
                { lat: 1.8480, lng: 102.9300 },
                { lat: 1.8460, lng: 102.9280 } // SMK Tunku Ismail
            ]
        };

        this.routes = routes;
    }

    showRoute(routeId) {
        // Clear previous route
        if (this.userRoute) {
            this.userRoute.setMap(null);
        }

        const route = this.routes[routeId];
        if (!route) return;

        this.userRoute = new google.maps.Polyline({
            path: route,
            geodesic: true,
            strokeColor: '#10b981',
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: this.map
        });

        // Fit map to route bounds
        const bounds = new google.maps.LatLngBounds();
        route.forEach(point => bounds.extend(point));
        this.map.fitBounds(bounds);
    }

    changeOverlay(type) {
        // Implement overlay changes
        switch(type) {
            case 'weather':
                this.showWeatherOverlay();
                break;
            case 'flood':
                this.showFloodOverlay();
                break;
            case 'storm':
                this.showStormOverlay();
                break;
            case 'traffic':
                this.showTrafficOverlay();
                break;
            case 'satellite':
                this.map.setMapTypeId(google.maps.MapTypeId.SATELLITE);
                break;
        }
    }

    showWeatherOverlay() {
        // This would integrate with weather API
        // For demo, show a heatmap of temperature
        const heatmapData = [
            new google.maps.LatLng(1.8484, 102.9288),
            new google.maps.LatLng(1.8470, 102.9270),
            new google.maps.LatLng(1.8490, 102.9300),
            new google.maps.LatLng(1.8460, 102.9320),
            new google.maps.LatLng(1.8500, 102.9260)
        ];

        if (this.weatherHeatmap) {
            this.weatherHeatmap.setMap(null);
        }

        this.weatherHeatmap = new google.maps.visualization.HeatmapLayer({
            data: heatmapData,
            map: this.map,
            radius: 50,
            opacity: 0.6
        });
    }

    filterMarkersBySeverity(severity, show) {
        this.markers.forEach(markerData => {
            if (markerData.severity === severity) {
                markerData.marker.setVisible(show);
            }
        });
    }

    updateAlertRadius(radiusKm) {
        // Update visibility of markers based on distance from center
        if (!this.currentLocation) return;

        const center = this.currentLocation;
        const radiusMeters = radiusKm * 1000;

        this.markers.forEach(markerData => {
            const markerPos = markerData.marker.getPosition();
            const distance = google.maps.geometry.spherical.computeDistanceBetween(
                center,
                markerPos
            );
            
            markerData.marker.setVisible(distance <= radiusMeters);
        });
    }

    toggleLayer(layer) {
        // Toggle visibility of specific layer markers
        this.markers.forEach(markerData => {
            if (markerData.type === layer) {
                const isVisible = markerData.marker.getVisible();
                markerData.marker.setVisible(!isVisible);
            }
        });
    }

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const pos = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    this.currentLocation = new google.maps.LatLng(pos.lat, pos.lng);
                    
                    // Center map on user location
                    this.map.setCenter(this.currentLocation);
                    this.map.setZoom(15);
                    
                    // Add user location marker
                    this.addUserLocationMarker(pos);
                    
                    this.showNotification('Location found!', 'success');
                },
                (error) => {
                    console.error('Error getting location:', error);
                    this.showNotification('Unable to get your location. Please enable location services.', 'error');
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        } else {
            this.showNotification('Geolocation is not supported by your browser.', 'error');
        }
    }

    addUserLocationMarker(position) {
        // Clear previous user marker
        if (this.userMarker) {
            this.userMarker.setMap(null);
        }

        this.userMarker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: 'Your Location',
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            animation: google.maps.Animation.BOUNCE
        });
    }

    toggleLayersPanel() {
        const sidebar = document.querySelector('.map-sidebar');
        sidebar.classList.toggle('collapsed');
    }

    printMap() {
        window.print();
    }

    shareMap() {
        if (navigator.share) {
            navigator.share({
                title: 'SafeWeather Hazard Map',
                text: 'Check out this hazard map for school transport safety',
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(window.location.href);
            this.showNotification('Link copied to clipboard!', 'success');
        }
    }

    showNotification(message, type) {
        // Use existing notification system
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }

    showMapError(message) {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 20px; text-align: center; background: var(--light-bg); border-radius: 12px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: var(--danger-color); margin-bottom: 20px;"></i>
                    <h3 style="color: var(--dark-color); margin-bottom: 10px;">Map Loading Error</h3>
                    <p style="color: var(--gray-color); margin-bottom: 20px; max-width: 400px;">${message}</p>
                    <div style="background: var(--warning-bg); padding: 15px; border-radius: 8px; border-left: 4px solid var(--warning-color); max-width: 400px;">
                        <strong>Troubleshooting Steps:</strong>
                        <ol style="text-align: left; margin-top: 10px;">
                            <li>Verify your Google Maps API key is correct</li>
                            <li>Ensure the API key allows requests from this domain</li>
                            <li>Check that Maps JavaScript API is enabled in Google Cloud Console</li>
                            <li>Try refreshing the page</li>
                        </ol>
                    </div>
                </div>
            `;
        }
        console.error('Map Error:', message);
    }
}

// Global functions for HTML onclick handlers
function initMap() {
    window.hazardMap = new HazardMap();
}

function refreshMap() {
    if (window.hazardMap) {
        window.hazardMap.loadHazardData();
        showNotification('Map refreshed!', 'success');
    }
}

function printMap() {
    if (window.hazardMap) {
        window.hazardMap.printMap();
    }
}

function shareMap() {
    if (window.hazardMap) {
        window.hazardMap.shareMap();
    }
}

function showRoute() {
    const routeSelect = document.getElementById('routeSelect');
    if (window.hazardMap && routeSelect.value) {
        window.hazardMap.showRoute(routeSelect.value);
    }
}

function searchLocation() {
    // Trigger search box
    const searchInput = document.getElementById('searchLocation');
    searchInput.focus();
}

function getMyLocation() {
    if (window.hazardMap) {
        window.hazardMap.getUserLocation();
    }
}

// Additional utility functions
function navigateToSchool(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    window.open(url, '_blank');
}

function addToSavedLocations(name, lat, lng) {
    const savedLocations = JSON.parse(localStorage.getItem('safeweather_saved_locations') || '[]');
    savedLocations.push({ name, lat, lng, timestamp: new Date().toISOString() });
    localStorage.setItem('safeweather_saved_locations', JSON.stringify(savedLocations));
    showNotification('Location saved!', 'success');
}

function avoidThisArea(lat, lng) {
    if (confirm('Would you like to avoid this area in your route planning?')) {
        const avoidedAreas = JSON.parse(localStorage.getItem('safeweather_avoided_areas') || '[]');
        avoidedAreas.push({ lat, lng, timestamp: new Date().toISOString() });
        localStorage.setItem('safeweather_avoided_areas', JSON.stringify(avoidedAreas));
        showNotification('Area added to avoidance list.', 'success');
    }
}

// Initialize map when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (window.google && window.google.maps) {
        initMap();
    }
});
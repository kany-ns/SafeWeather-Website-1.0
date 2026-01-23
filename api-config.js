/**
 * API Configuration File
 * Store your API keys here
 * IMPORTANT: Never commit this file with real keys to version control
 */

const API_CONFIG = {
    // WeatherAPI.com configuration
    WEATHER_API: {
        KEY: 'YOUR_WEATHERAPI_KEY_HERE', // <-- Gantikan dengan kunci API awak
        BASE_URL: 'https://api.weatherapi.com/v1',
        TIMEOUT: 10000 // 10 seconds
    },

    // Optional: Google Maps API (for map features)
    GOOGLE_MAPS: {
        KEY: 'AIzaSyBEFLZfkZ51rJdd3CZNNK65Fzv2uu9aSFE',
        BASE_URL: 'https://maps.googleapis.com/maps/api'
    },

    // Optional: OpenWeatherMap API (as backup)
    OPEN_WEATHER_MAP: {
        KEY: '366289029a482870e390151d7218e6ab',
        BASE_URL: 'https://api.openweathermap.org/data/2.5'
    },

    // Cache settings
    CACHE: {
        DURATION: 5 * 60 * 1000, // 5 minutes
        ENABLED: true
    },

    // Retry settings
    RETRY: {
        MAX_ATTEMPTS: 3,
        DELAY: 1000 // milliseconds
    }
};

/**
 * Get API Key by service name
 * @param {string} serviceName - Name of the API service
 * @returns {string} API key
 */
function getAPIKey(serviceName) {
    if (API_CONFIG[serviceName]) {
        return API_CONFIG[serviceName].KEY;
    }
    console.warn(`API config not found for: ${serviceName}`);
    return null;
}

/**
 * Validate API Keys
 * @returns {object} Validation result
 */
function validateAPIKeys() {
    const status = {
        weatherAPI: API_CONFIG.WEATHER_API.KEY !== '6fce8c2fea044b72803200517262201' && API_CONFIG.WEATHER_API.KEY !== '6fce8c2fea044b72803200517262201',
        googleMaps: !API_CONFIG.GOOGLE_MAPS.KEY.includes('AIzaSyBEFLZfkZ51rJdd3CZNNK65Fzv2uu9aSFE'),
        openWeatherMap: !API_CONFIG.OPEN_WEATHER_MAP.KEY.includes('366289029a482870e390151d7218e6ab')
    };

    const configured = Object.values(status).filter(v => v).length;
    console.log(`[API Config] ${configured} API(s) properly configured`);

    if (!status.weatherAPI) {
        console.warn('[API Config] ⚠️  WeatherAPI key belum ditetapkan!');
        console.log('[API Config] 📝 Cara dapatkan kunci API percuma:');
        console.log('[API Config] 1. Pergi ke: https://www.weatherapi.com/my/');
        console.log('[API Config] 2. Daftar akaun percuma');
        console.log('[API Config] 3. Salin kunci API dan gantikan "YOUR_WEATHERAPI_KEY_HERE" dalam fail ini');
        console.log('[API Config] 4. Refresh halaman untuk uji');
    }

    return status;
}

// Validate on load (only once)
let apiValidationDone = false;
window.addEventListener('DOMContentLoaded', () => {
    if (!apiValidationDone) {
        validateAPIKeys();
        apiValidationDone = true;
    }
});

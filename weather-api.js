class WeatherAPI {
    constructor() {
        this.apiKey = API_CONFIG.WEATHER_API.KEY; // Use API key from config
        this.baseUrl = 'https://api.weatherapi.com/v1';
        this.units = 'metric'; // WeatherAPI supports 'metric', 'imperial', or 'scientific'
        this.language = 'en';
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
        this.cache = new Map();
        this.init();
    }

    init() {
        // Check for API key
        if (this.apiKey === '6fce8c2fea044b72803200517262201' || this.apiKey === '6fce8c2fea044b72803200517262201') {
            console.warn('Please set your WeatherAPI.com API key in weather-api.js');
            console.log('Get your free API key at: https://www.weatherapi.com/my/');
            showNotification('Weather API not configured. Using demo data.', 'warning');
        }
    }

    async getCurrentWeather(lat, lon) {
        const cacheKey = `current_${lat}_${lon}`;

        // Check cache
        if (this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        try {
            const url = `${this.baseUrl}/alerts.json?key=${this.apiKey}&q=${lat},${lon}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const processedData = this.processCurrentWeather(data);

            // Cache the result
            this.cache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });

            return processedData;

        } catch (error) {
            console.error('Failed to fetch current weather:', error);
            return this.getDemoCurrentWeather();
        }
    }

    async getWeatherForecast(lat, lon) {
        const cacheKey = `forecast_${lat}_${lon}`;

        // Check cache
        if (this.isCacheValid(cacheKey)) {
            return this.cache.get(cacheKey).data;
        }

        try {
            const url = `${this.baseUrl}/forecast.json?key=${this.apiKey}&q=${lat},${lon}&days=7`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const processedData = this.processForecast(data);

            // Cache the result
            this.cache.set(cacheKey, {
                data: processedData,
                timestamp: Date.now()
            });

            return processedData;

        } catch (error) {
            console.error('Failed to fetch weather forecast:', error);
            return this.getDemoForecast();
        }
    }

    async getWeatherAlerts(lat, lon) {
        try {
            // WeatherAPI alerts endpoint
            const url = `${this.baseUrl}/alerts.json?key=${this.apiKey}&q=${lat},${lon}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            return this.processAlerts(data);

        } catch (error) {
            console.error('Failed to fetch weather alerts:', error);
            return this.getDemoAlerts();
        }
    }

    async getAirQuality(lat, lon) {
        // WeatherAPI.com includes air quality in current weather response
        // Get current weather and extract air quality data
        try {
            const weatherData = await this.getCurrentWeather(lat, lon);
            if (weatherData && weatherData.airQuality) {
                return weatherData.airQuality;
            } else {
                return this.getDemoAirQuality();
            }
        } catch (error) {
            console.error('Failed to fetch air quality:', error);
            return this.getDemoAirQuality();
        }
    }

    processCurrentWeather(data) {
        // Process air quality if available
        let airQuality = null;
        if (data.current.air_quality) {
            const aq = data.current.air_quality;
            airQuality = {
                aqi: this.calculateAQI(aq),
                pm25: aq.pm2_5,
                pm10: aq.pm10,
                co: aq.co,
                no2: aq.no2,
                o3: aq.o3,
                so2: aq.so2
            };
        }

        return {
            temperature: Math.round(data.current.temp_c),
            feelsLike: Math.round(data.current.feelslike_c),
            humidity: data.current.humidity,
            pressure: data.current.pressure_mb,
            windSpeed: data.current.wind_kph / 3.6, // Convert kph to m/s for consistency
            windDirection: this.getWindDirection(data.current.wind_degree),
            visibility: data.current.vis_km,
            clouds: data.current.cloud,
            weather: {
                main: data.current.condition.text,
                description: data.current.condition.text,
                icon: this.getWeatherIcon(data.current.condition.code),
                code: data.current.condition.code
            },
            sunrise: data.forecast?.forecastday?.[0]?.astro?.sunrise ?
                      new Date(data.location.localtime.split(' ')[0] + ' ' + data.forecast.forecastday[0].astro.sunrise) :
                      calculateSunriseSunset(data.location.lat, data.location.lon, 'sunrise'),
            sunset: data.forecast?.forecastday?.[0]?.astro?.sunset ?
                     new Date(data.location.localtime.split(' ')[0] + ' ' + data.forecast.forecastday[0].astro.sunset) :
                     calculateSunriseSunset(data.location.lat, data.location.lon, 'sunset'),
            location: data.location.name,
            coordinates: {
                lat: data.location.lat,
                lon: data.location.lon
            },
            timestamp: new Date(data.current.last_updated),
            airQuality: airQuality
        };
    }

    processForecast(data) {
        const dailyForecasts = [];
        const hourlyForecasts = [];

        // Process daily forecasts from WeatherAPI.com
        data.forecast.forecastday.forEach(day => {
            dailyForecasts.push({
                date: new Date(day.date),
                minTemp: Math.round(day.day.mintemp_c),
                maxTemp: Math.round(day.day.maxtemp_c),
                avgTemp: Math.round(day.day.avgtemp_c),
                weather: day.day.condition.text,
                icon: this.getWeatherIcon(day.day.condition.code),
                humidity: day.day.avghumidity,
                windSpeed: day.day.maxwind_kph / 3.6, // Convert to m/s
                precipitation: day.day.totalprecip_mm
            });
        });

        // Get hourly forecasts for the first day (next 24 hours)
        if (data.forecast.forecastday.length > 0) {
            const todayHours = data.forecast.forecastday[0].hour;
            // Get next 24 hours starting from current time
            const currentHour = new Date().getHours();
            const next24Hours = todayHours.slice(currentHour, currentHour + 24);

            next24Hours.forEach(hour => {
                hourlyForecasts.push({
                    time: new Date(hour.time),
                    temperature: Math.round(hour.temp_c),
                    weather: hour.condition.text,
                    icon: this.getWeatherIcon(hour.condition.code),
                    precipitation: hour.precip_mm,
                    humidity: hour.humidity,
                    windSpeed: hour.wind_kph / 3.6 // Convert to m/s
                });
            });
        }

        return {
            location: data.location.name,
            country: data.location.country,
            coordinates: {
                lat: data.location.lat,
                lon: data.location.lon
            },
            daily: dailyForecasts,
            hourly: hourlyForecasts
        };
    }

    processAlerts(data) {
        const alerts = [];
        
        if (data.alerts && data.alerts.length > 0) {
            data.alerts.forEach(alert => {
                alerts.push({
                    event: alert.event,
                    description: alert.description,
                    start: new Date(alert.start * 1000),
                    end: new Date(alert.end * 1000),
                    sender: alert.sender_name,
                    severity: this.determineAlertSeverity(alert.event),
                    tags: alert.tags || []
                });
            });
        }
        
        return alerts;
    }

    processAirQuality(data) {
        const aqi = data.list[0].main.aqi;
        const components = data.list[0].components;
        
        return {
            aqi: aqi,
            aqiLevel: this.getAQILevel(aqi),
            components: {
                co: components.co,
                no: components.no,
                no2: components.no2,
                o3: components.o3,
                so2: components.so2,
                pm2_5: components.pm2_5,
                pm10: components.pm10,
                nh3: components.nh3
            },
            timestamp: new Date(data.list[0].dt * 1000)
        };
    }

    getWeatherIcon(conditionCode) {
        const iconMap = {
            // Sunny/Clear
            1000: 'fas fa-sun',

            // Partly cloudy
            1003: 'fas fa-cloud-sun',

            // Cloudy/Overcast
            1006: 'fas fa-cloud',
            1009: 'fas fa-cloud',

            // Mist/Fog
            1030: 'fas fa-smog',
            1135: 'fas fa-smog',
            1147: 'fas fa-smog',

            // Rain
            1063: 'fas fa-cloud-rain',
            1072: 'fas fa-cloud-rain',
            1150: 'fas fa-cloud-rain',
            1153: 'fas fa-cloud-rain',
            1168: 'fas fa-cloud-rain',
            1171: 'fas fa-cloud-rain',
            1180: 'fas fa-cloud-rain',
            1183: 'fas fa-cloud-rain',
            1186: 'fas fa-cloud-rain',
            1189: 'fas fa-cloud-rain',
            1192: 'fas fa-cloud-rain',
            1195: 'fas fa-cloud-rain',
            1198: 'fas fa-cloud-rain',
            1201: 'fas fa-cloud-rain',

            // Snow/Ice
            1066: 'fas fa-snowflake',
            1069: 'fas fa-snowflake',
            1114: 'fas fa-snowflake',
            1117: 'fas fa-snowflake',
            1210: 'fas fa-snowflake',
            1213: 'fas fa-snowflake',
            1216: 'fas fa-snowflake',
            1219: 'fas fa-snowflake',
            1222: 'fas fa-snowflake',
            1225: 'fas fa-snowflake',
            1237: 'fas fa-snowflake',
            1249: 'fas fa-snowflake',
            1252: 'fas fa-snowflake',
            1255: 'fas fa-snowflake',
            1258: 'fas fa-snowflake',
            1261: 'fas fa-snowflake',
            1264: 'fas fa-snowflake',

            // Thunderstorm
            1087: 'fas fa-bolt',
            1273: 'fas fa-bolt',
            1276: 'fas fa-bolt',
            1279: 'fas fa-bolt',
            1282: 'fas fa-bolt'
        };

        return iconMap[conditionCode] || 'fas fa-question';
    }

    getWindDirection(degrees) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(degrees / 45) % 8;
        return directions[index];
    }

    determineAlertSeverity(event) {
        const eventLower = event.toLowerCase();
        
        if (eventLower.includes('warning') || eventLower.includes('extreme')) {
            return 'critical';
        } else if (eventLower.includes('watch') || eventLower.includes('advisory')) {
            return 'warning';
        } else {
            return 'info';
        }
    }

    calculateAQI(airQuality) {
        // Calculate AQI based on PM2.5 (simplified version)
        const pm25 = airQuality.pm2_5;
        if (pm25 <= 12) return 1; // Good
        if (pm25 <= 35) return 2; // Fair
        if (pm25 <= 55) return 3; // Moderate
        if (pm25 <= 150) return 4; // Poor
        return 5; // Very Poor
    }

    isCacheValid(key) {
        if (!this.cache.has(key)) return false;
        
        const cached = this.cache.get(key);
        return (Date.now() - cached.timestamp) < this.cacheDuration;
    }

    // Demo data for when API is unavailable
    getDemoCurrentWeather() {
        return {
            temperature: 32,
            feelsLike: 34,
            humidity: 65,
            pressure: 1013,
            windSpeed: 12,
            windDirection: 'NE',
            visibility: 10,
            clouds: 20,
            weather: {
                main: 'Clear',
                description: 'clear sky',
                icon: 'fas fa-sun',
                code: 800
            },
            sunrise: new Date().setHours(7, 0, 0),
            sunset: new Date().setHours(19, 0, 0),
            location: 'Batu Pahat',
            coordinates: {
                lat: 1.8494,
                lon: 102.9288
            },
            timestamp: new Date(),
            isDemo: true
        };
    }

    getDemoForecast() {
        const now = new Date();
        const daily = [];
        const hourly = [];
        
        // Generate 5 days of forecast
        for (let i = 0; i < 5; i++) {
            const date = new Date(now);
            date.setDate(now.getDate() + i);
            
            daily.push({
                date: date,
                minTemp: 25 + i,
                maxTemp: 32 + i,
                avgTemp: 28 + i,
                weather: i % 2 === 0 ? 'Clear' : 'Clouds',
                icon: i % 2 === 0 ? 'fas fa-sun' : 'fas fa-cloud',
                humidity: 60 + (i * 5),
                windSpeed: 10 + i,
                precipitation: i === 2 ? 5 : 0
            });
        }
        
        // Generate 24 hours of hourly forecast
        for (let i = 0; i < 8; i++) {
            const time = new Date(now);
            time.setHours(now.getHours() + (i * 3));
            
            hourly.push({
                time: time,
                temperature: 28 + Math.sin(i) * 4,
                weather: i < 4 ? 'Clear' : 'Clouds',
                icon: i < 4 ? 'fas fa-sun' : 'fas fa-cloud',
                precipitation: i === 6 ? 2 : 0,
                humidity: 60 + (i * 3),
                windSpeed: 8 + i
            });
        }
        
        return {
            location: 'Batu Pahat',
            country: 'MY',
            coordinates: {
                lat: 1.8494,
                lon: 102.9288
            },
            daily: daily,
            hourly: hourly,
            isDemo: true
        };
    }

    getDemoAlerts() {
        return [
            {
                event: 'Thunderstorm Warning',
                description: 'Thunderstorms with heavy rain expected in the area. Exercise caution.',
                start: new Date(),
                end: new Date(Date.now() + 3 * 60 * 60 * 1000),
                sender: 'MET Malaysia',
                severity: 'warning',
                tags: ['thunderstorm', 'rain']
            }
        ];
    }

    getDemoAirQuality() {
        return {
            aqi: 2,
            aqiLevel: {
                level: 'Fair',
                color: '#f59e0b'
            },
            components: {
                co: 250.5,
                no: 0.5,
                no2: 15.2,
                o3: 60.8,
                so2: 2.1,
                pm2_5: 12.3,
                pm10: 25.6,
                nh3: 1.2
            },
            timestamp: new Date(),
            isDemo: true
        };
    }

    async updateWeatherOnPage(lat, lon) {
        try {
            const [current, forecast, alerts, airQuality] = await Promise.all([
                this.getCurrentWeather(lat, lon),
                this.getWeatherForecast(lat, lon),
                this.getWeatherAlerts(lat, lon),
                this.getAirQuality(lat, lon)
            ]);
            
            this.updateDashboard(current, forecast, alerts, airQuality);
            this.updateWeatherWidgets(current, forecast);
            this.checkForAlerts(alerts);
            
            return { current, forecast, alerts, airQuality };
            
        } catch (error) {
            console.error('Failed to update weather:', error);
            return this.getDemoWeatherData();
        }
    }

    updateDashboard(current, forecast, alerts, airQuality) {
        // Update temperature display
        const tempElements = document.querySelectorAll('.temp, .temp-large, .current-temp');
        tempElements.forEach(el => {
            if (el.classList.contains('temp-large')) {
                el.textContent = `${current.temperature}°C`;
            } else {
                el.textContent = `${current.temperature}°C`;
            }
        });
        
        // Update condition
        const conditionElements = document.querySelectorAll('.condition, .weather-condition');
        conditionElements.forEach(el => {
            const icon = el.querySelector('i');
            const text = el.querySelector('span, p');
            
            if (icon) {
                icon.className = current.weather.icon;
            }
            if (text) {
                text.textContent = current.weather.description;
            }
        });
        
        // Update humidity
        const humidityElements = document.querySelectorAll('.humidity-value, [data-humidity]');
        humidityElements.forEach(el => {
            el.textContent = `${current.humidity}%`;
        });
        
        // Update wind
        const windElements = document.querySelectorAll('.wind-value, [data-wind]');
        windElements.forEach(el => {
            el.textContent = `${current.windSpeed} km/h ${current.windDirection}`;
        });
        
        // Update forecast
        this.updateForecastDisplay(forecast);
        
        // Update alerts
        this.updateAlertsDisplay(alerts);
        
        // Update air quality
        this.updateAirQualityDisplay(airQuality);
    }

    updateWeatherWidgets(current, forecast) {
        // Update mini weather widgets throughout the site
        document.querySelectorAll('.weather-widget').forEach(widget => {
            const temp = widget.querySelector('.widget-temp');
            const condition = widget.querySelector('.widget-condition');
            const icon = widget.querySelector('.widget-icon');
            
            if (temp) temp.textContent = `${current.temperature}°C`;
            if (condition) condition.textContent = current.weather.main;
            if (icon) icon.className = `widget-icon ${current.weather.icon}`;
        });
    }

    updateForecastDisplay(forecast) {
        const forecastContainer = document.querySelector('.forecast-container');
        if (!forecastContainer) return;
        
        forecastContainer.innerHTML = forecast.daily.slice(0, 5).map(day => `
            <div class="forecast-day">
                <div class="forecast-date">${this.formatDay(day.date)}</div>
                <div class="forecast-icon">
                    <i class="${day.icon}"></i>
                </div>
                <div class="forecast-temp">
                    <span class="high">${day.maxTemp}°</span>
                    <span class="low">${day.minTemp}°</span>
                </div>
                <div class="forecast-precipitation">
                    <i class="fas fa-tint"></i>
                    <span>${day.precipitation}mm</span>
                </div>
            </div>
        `).join('');
    }

    updateAlertsDisplay(alerts) {
        const alertsContainer = document.querySelector('.alerts-container');
        if (!alertsContainer) return;
        
        if (alerts.length === 0) {
            alertsContainer.innerHTML = `
                <div class="no-alerts">
                    <i class="fas fa-check-circle"></i>
                    <p>No active weather alerts</p>
                </div>
            `;
            return;
        }
        
        alertsContainer.innerHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <h4>${alert.event}</h4>
                    <p>${alert.description}</p>
                    <div class="alert-meta">
                        <span><i class="fas fa-clock"></i> Until ${this.formatTime(alert.end)}</span>
                        <span><i class="fas fa-broadcast-tower"></i> ${alert.sender}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateAirQualityDisplay(airQuality) {
        const aqiContainer = document.querySelector('.aqi-container');
        if (!aqiContainer) return;
        
        aqiContainer.innerHTML = `
            <div class="aqi-display" style="background: ${airQuality.aqiLevel.color}">
                <div class="aqi-value">${airQuality.aqi}</div>
                <div class="aqi-label">${airQuality.aqiLevel.level}</div>
            </div>
            <div class="aqi-details">
                <div class="detail">
                    <span>PM2.5</span>
                    <span class="value">${airQuality.components.pm2_5} μg/m³</span>
                </div>
                <div class="detail">
                    <span>PM10</span>
                    <span class="value">${airQuality.components.pm10} μg/m³</span>
                </div>
            </div>
        `;
    }

    checkForAlerts(alerts) {
        if (alerts.length > 0) {
            // Show notification for new alerts
            alerts.forEach(alert => {
                if (alert.severity === 'critical') {
                    this.showAlertNotification(alert);
                }
            });
            
            // Update alert badge
            const alertCount = alerts.length;
            this.updateAlertBadge(alertCount);
        }
    }

    showAlertNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Weather Alert: ${alert.event}`, {
                body: alert.description,
                icon: '/images/logo.png',
                requireInteraction: true
            });
        }
        
        // Also show in-app notification
        if (typeof showNotification === 'function') {
            showNotification(`ALERT: ${alert.event}`, 'critical');
        }
    }

    updateAlertBadge(count) {
        const badges = document.querySelectorAll('.alert-badge');
        badges.forEach(badge => {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        });
    }

    formatDay(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
    }

    formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    getDemoWeatherData() {
        return {
            current: this.getDemoCurrentWeather(),
            forecast: this.getDemoForecast(),
            alerts: this.getDemoAlerts(),
            airQuality: this.getDemoAirQuality()
        };
    }

    showNotification(message, type) {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            alert(message);
        }
    }
}
// Weather utility functions
class WeatherUtils {
    static calculateHeatIndex(temp, humidity) {
        // Simplified heat index calculation
        if (temp < 27) return temp;
        
        const c1 = -8.78469475556;
        const c2 = 1.61139411;
        const c3 = 2.33854883889;
        const c4 = -0.14611605;
        const c5 = -0.012308094;
        const c6 = -0.0164248277778;
        const c7 = 0.002211732;
        const c8 = 0.00072546;
        const c9 = -0.000003582;
        
        const T = temp;
        const R = humidity;
        
        return c1 + c2*T + c3*R + c4*T*R + c5*T*T + c6*R*R + c7*T*T*R + c8*T*R*R + c9*T*T*R*R;
    }

    static calculateWindChill(temp, windSpeed) {
        // Wind chill calculation in °C
        if (temp > 10 || windSpeed < 4.8) return temp;
        
        return 13.12 + 0.6215*temp - 11.37*Math.pow(windSpeed, 0.16) + 0.3965*temp*Math.pow(windSpeed, 0.16);
    }

    static getUVIndexLevel(uvIndex) {
        if (uvIndex <= 2) return { level: 'Low', color: '#10b981' };
        if (uvIndex <= 5) return { level: 'Moderate', color: '#f59e0b' };
        if (uvIndex <= 7) return { level: 'High', color: '#ef4444' };
        if (uvIndex <= 10) return { level: 'Very High', color: '#7c3aed' };
        return { level: 'Extreme', color: '#991b1b' };
    }

    static getPrecipitationType(temp) {
        if (temp <= 0) return 'Snow';
        if (temp <= 3) return 'Sleet';
        return 'Rain';
    }

    static getWeatherRiskLevel(weatherData) {
        let riskScore = 0;
        
        // Temperature risk
        if (weatherData.temperature > 35 || weatherData.temperature < 10) {
            riskScore += 2;
        }
        
        // Precipitation risk
        if (weatherData.weather.main.includes('Rain') || weatherData.weather.main.includes('Snow')) {
            riskScore += 2;
        }
        
        // Wind risk
        if (weatherData.windSpeed > 30) {
            riskScore += 3;
        } else if (weatherData.windSpeed > 20) {
            riskScore += 1;
        }
        
        // Visibility risk
        if (weatherData.visibility < 1) {
            riskScore += 3;
        } else if (weatherData.visibility < 5) {
            riskScore += 1;
        }
        
        // Determine risk level
        if (riskScore >= 6) return { level: 'High', color: '#ef4444' };
        if (riskScore >= 3) return { level: 'Medium', color: '#f59e0b' };
        return { level: 'Low', color: '#10b981' };
    }
}

// Global weather functions
let weatherAPIInstance = null;
let weatherUpdateInProgress = false;

async function getWeatherForLocation(lat, lon) {
    if (weatherUpdateInProgress) {
        console.log('Weather update already in progress, skipping...');
        return;
    }

    weatherUpdateInProgress = true;
    console.log(`🌤️ Updating weather for location: ${lat}, ${lon}`);

    try {
        if (!weatherAPIInstance) {
            weatherAPIInstance = new WeatherAPI();
        }
        const result = await weatherAPIInstance.updateWeatherOnPage(lat, lon);
        console.log('✅ Weather update completed');
        return result;
    } finally {
        weatherUpdateInProgress = false;
    }
}

function updateUserLocationWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await getWeatherForLocation(latitude, longitude);
            },
            (error) => {
                console.error('Geolocation error:', error);
                // Use default location (Batu Pahat)
                getWeatherForLocation(1.8494, 102.9288);
            }
        );
    } else {
        // Use default location
        getWeatherForLocation(1.8494, 102.9288);
    }
}

function refreshWeather() {
    updateUserLocationWeather();
    showNotification('Weather data refreshed', 'info');
}

// Initialize weather on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a page that needs weather data
    const hasWeatherElements = document.querySelector('.temp, .weather-condition, .forecast-container');
    
    if (hasWeatherElements) {
        updateUserLocationWeather();
        
        // Auto-refresh every 5 minutes
        setInterval(() => {
            updateUserLocationWeather();
        }, 5 * 60 * 1000);
    }
});

// Simple sunrise/sunset calculation (approximation)
function calculateSunriseSunset(lat, lon, type) {
    const now = new Date();
    const hour = type === 'sunrise' ? 6 : 18; // Approximate sunrise at 6 AM, sunset at 6 PM
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);
}

// Export for use in other modules
window.WeatherAPI = WeatherAPI;
window.WeatherUtils = WeatherUtils;
window.getWeatherForLocation = getWeatherForLocation;
window.refreshWeather = refreshWeather;
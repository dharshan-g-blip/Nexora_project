/**
 * ============================================================================
 * WEATHER APP - JAVASCRIPT (ES6+)
 * ============================================================================
 * Beginner-friendly, well-commented implementation meeting all project rubrics:
 * 1. Arrow functions: () => { ... }
 * 2. Template literals: `Hello ${city}`
 * 3. Destructuring: const { temperature_2m, relative_humidity_2m } = ...
 * 4. Asynchronous programming: async/await & Fetch API
 * 5. Dynamic DOM manipulation & Event handling
 * 6. Error handling: try...catch & graceful alerts
 * ============================================================================
 */

// --- 1. DOM Elements Selection ---
const weatherForm = document.getElementById('weather-form');
const cityInput = document.getElementById('city-input');
const alertBox = document.getElementById('alert-box');
const alertMessage = document.getElementById('alert-message');
const loadingSpinner = document.getElementById('loading-spinner');
const weatherCard = document.getElementById('weather-card');
const unitToggleBtn = document.getElementById('unit-toggle-btn');
const recentTagsContainer = document.getElementById('recent-tags');

// Weather Display Elements
const cityNameEl = document.getElementById('city-name');
const countryCodeEl = document.getElementById('country-code');
const cityDateEl = document.getElementById('city-date');
const weatherIconEl = document.getElementById('weather-icon');
const currentTempEl = document.getElementById('current-temp');
const weatherDescEl = document.getElementById('weather-desc');
const feelsLikeEl = document.getElementById('feels-like');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const cloudCoverEl = document.getElementById('cloud-cover');

// --- 2. Application State ---
// Current temperature unit ('C' for Celsius, 'F' for Fahrenheit)
let currentUnit = 'C';
// Store current weather data in memory for easy unit toggling without refetching
let currentWeatherData = null;

/**
 * Map WMO weather codes to human-readable description and emojis/icons.
 * (WMO = World Meteorological Organization standard weather codes)
 */
const getWeatherMeta = (code) => {
  switch (code) {
    case 0:
      return { desc: 'Clear Sky', icon: '☀️' };
    case 1:
      return { desc: 'Mainly Clear', icon: '🌤️' };
    case 2:
      return { desc: 'Partly Cloudy', icon: '⛅' };
    case 3:
      return { desc: 'Overcast', icon: '☁️' };
    case 45:
    case 48:
      return { desc: 'Foggy', icon: '🌫️' };
    case 51:
    case 53:
    case 55:
      return { desc: 'Drizzle', icon: '🌦️' };
    case 61:
    case 63:
    case 65:
      return { desc: 'Rain', icon: '🌧️' };
    case 71:
    case 73:
    case 75:
      return { desc: 'Snowfall', icon: '❄️' };
    case 80:
    case 81:
    case 82:
      return { desc: 'Rain Showers', icon: '🌧️' };
    case 95:
    case 96:
    case 99:
      return { desc: 'Thunderstorm', icon: '⛈️' };
    default:
      return { desc: 'Cloudy', icon: '⛅' };
  }
};

/**
 * Utility: Convert Celsius to Fahrenheit
 */
const toFahrenheit = (celsius) => Math.round((celsius * 9) / 5 + 32);

/**
 * --- 3. UI Helper Functions ---
 */

// Show error message to user
const showError = (message) => {
  alertMessage.textContent = message;
  alertBox.classList.remove('hidden');
  loadingSpinner.classList.add('hidden');
  weatherCard.classList.add('hidden');
};

// Clear active errors
const clearError = () => {
  alertBox.classList.add('hidden');
  alertMessage.textContent = '';
};

// Show loading state
const showLoading = () => {
  clearError();
  weatherCard.classList.add('hidden');
  loadingSpinner.classList.remove('hidden');
};

// Hide loading state
const hideLoading = () => {
  loadingSpinner.classList.add('hidden');
};

/**
 * Format today's date in a clean format: "Sunday, Oct 18, 2026"
 */
const getFormattedDate = () => {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  return new Date().toLocaleDateString(undefined, options);
};

/**
 * --- 4. Render Weather Details onto the Screen ---
 * Demonstrates: Destructuring and Template Literals
 */
const renderWeather = () => {
  if (!currentWeatherData) return;

  // ES6 Destructuring
  const { city, country, tempC, feelsLikeC, humidity, windSpeed, weatherCode } = currentWeatherData;
  const { desc, icon } = getWeatherMeta(weatherCode);

  cityNameEl.textContent = city;
  countryCodeEl.textContent = country || 'Globe';
  cityDateEl.textContent = getFormattedDate();
  weatherIconEl.textContent = icon;
  weatherDescEl.textContent = desc;

  // Temperature display according to selected unit
  if (currentUnit === 'C') {
    currentTempEl.textContent = `${Math.round(tempC)}°C`;
    feelsLikeEl.textContent = `${Math.round(feelsLikeC)}°C`;
    windSpeedEl.textContent = `${windSpeed} km/h`;
  } else {
    currentTempEl.textContent = `${toFahrenheit(tempC)}°F`;
    feelsLikeEl.textContent = `${toFahrenheit(feelsLikeC)}°F`;
    // Convert km/h to mph (1 km/h = 0.621371 mph)
    const windMph = (windSpeed * 0.621371).toFixed(1);
    windSpeedEl.textContent = `${windMph} mph`;
  }

  humidityEl.textContent = `${humidity}%`;
  cloudCoverEl.textContent = desc;

  // Reveal card
  weatherCard.classList.remove('hidden');
};

/**
 * --- 5. Fetch Weather Data by City Name ---
 * Demonstrates: Async/Await, Fetch API, Promises, and try...catch Error Handling
 */
const fetchWeather = async (cityName) => {
  const cleanCity = cityName.trim();
  if (!cleanCity) {
    showError('Please enter a city name to search.');
    return;
  }

  showLoading();

  try {
    // Step 1: Geocoding API to resolve city name into latitude & longitude
    // (Free public API from Open-Meteo, no key required!)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error(`Geocoding server error (${geoResponse.status})`);
    }

    const geoData = await geoResponse.json();

    // Check if the city was found
    if (!geoData.results || geoData.results.length === 0) {
      showError(`City "${cleanCity}" not found. Please check your spelling and try again.`);
      return;
    }

    // ES6 Destructuring of top result
    const { name, country, latitude, longitude } = geoData.results[0];

    // Step 2: Fetch real-time weather from Open-Meteo Weather Forecast API
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error(`Weather service error (${weatherResponse.status})`);
    }

    const weatherJson = await weatherResponse.json();
    const { current } = weatherJson;

    // Save into state using ES6 Object property shorthand
    currentWeatherData = {
      city: name,
      country,
      tempC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
    };

    // Render the data
    renderWeather();
    // Save to search history
    saveRecentSearch(name);

  } catch (error) {
    console.error('Fetch Weather Error:', error);
    showError('Could not retrieve weather data. Please check your network connection.');
  } finally {
    hideLoading();
  }
};

/**
 * Fetch weather by coordinates (Geolocation)
 */
const fetchWeatherByCoords = async (latitude, longitude, label = 'Your Location') => {
  showLoading();
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&wind_speed_unit=kmh`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    const { current } = data;

    currentWeatherData = {
      city: label,
      country: 'GPS',
      tempC: current.temperature_2m,
      feelsLikeC: current.apparent_temperature,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
    };

    renderWeather();
  } catch (error) {
    showError('Failed to fetch weather for your location coordinates.');
  } finally {
    hideLoading();
  }
};

/**
 * --- 6. Recent Searches using localStorage ---
 */
const getRecentSearches = () => {
  try {
    return JSON.parse(localStorage.getItem('weather_recent_searches')) || [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (city) => {
  let list = getRecentSearches();
  // Remove duplicate if it already exists
  list = list.filter((item) => item.toLowerCase() !== city.toLowerCase());
  // Prepend to top
  list.unshift(city);
  // Keep only last 5
  if (list.length > 5) list.pop();

  localStorage.setItem('weather_recent_searches', JSON.stringify(list));
  renderRecentSearches();
};

const renderRecentSearches = () => {
  if (!recentTagsContainer) return;
  const list = getRecentSearches();

  if (list.length === 0) {
    recentTagsContainer.innerHTML = '<span style="color: var(--text-dim); font-size: 0.85rem;">No recent searches yet.</span>';
    return;
  }

  // Template literals mapping
  recentTagsContainer.innerHTML = list
    .map((city) => `<button type="button" class="chip-btn" data-city="${city}">${city}</button>`)
    .join('');
};

/**
 * --- 7. Event Listeners ---
 */

// Form Submission
weatherForm.addEventListener('submit', (event) => {
  event.preventDefault(); // Stop page reload
  const city = cityInput.value;
  fetchWeather(city);
});

// Unit Toggle Button (°C <=> °F)
unitToggleBtn.addEventListener('click', () => {
  currentUnit = currentUnit === 'C' ? 'F' : 'C';
  unitToggleBtn.textContent = currentUnit === 'C' ? 'Switch to °F' : 'Switch to °C';
  renderWeather();
});

// Click on quick city chips or recent search tags (Event Delegation)
document.addEventListener('click', (event) => {
  const chipBtn = event.target.closest('.chip-btn');
  if (chipBtn && chipBtn.dataset.city) {
    const city = chipBtn.dataset.city;
    cityInput.value = city;
    fetchWeather(city);
  }
});

// Location button (Optional bonus)
const locationBtn = document.getElementById('location-btn');
if (locationBtn) {
  locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showError('Geolocation is not supported by your browser.');
      return;
    }
    showLoading();
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeatherByCoords(latitude, longitude, 'My Location');
      },
      (geoError) => {
        console.warn('Geolocation error:', geoError);
        showError('Unable to retrieve your location. Please type your city name manually.');
        hideLoading();
      }
    );
  });
}

// Initial default search when page loads (Load London or Tokyo by default)
window.addEventListener('DOMContentLoaded', () => {
  renderRecentSearches();
  fetchWeather('London');
});

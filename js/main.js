// Function to fetch weather data from OpenWeatherMap API
async function fetchWeather() {
  const appID = '';
  const cityID = 5881792;

  const url = `http://api.openweathermap.org/data/2.5/weather?id=${cityID}&units=metric&appid=${appID}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null; // Return null to indicate error or no data
  }
}

// Function to update the clock display every second
function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const hourElement = document.getElementById('hour');
  const minuteElement = document.getElementById('minute');
  const secondElement = document.querySelector('.second'); // Use querySelector for class

  // Update the clock display with current time
  hourElement.textContent = `${hours}:`;
  minuteElement.textContent = `${minutes}:`;
  secondElement.textContent = `${seconds}`;

  // Toggle the 'gone' class to start the opacity animation for seconds
  secondElement.classList.remove('gone');
  void secondElement.offsetWidth; // Trigger reflow to restart animation
  secondElement.classList.add('gone');

  // Set font size (optional, can be in your CSS)
  clock.style.fontSize = '20vw';

  // Schedule the next update after 1 second
  setTimeout(updateClock, 1000);
}

// Function to update weather display based on stored or fetched data
function updateWeatherDisplay() {
  const weatherElement = document.getElementById('weather');
  const additionalInfo = document.getElementById('additional-info');
  const sunContainer = document.getElementById('sun-container');

  // Retrieve stored weather data from localStorage
  const storedData = JSON.parse(localStorage.getItem('weatherData'));
  const currentTime = new Date().getTime();

  // Check if stored data exists and is less than 5 minutes old
  if (storedData && (currentTime - storedData.timestamp) < 5 * 60 * 1000) {
    // Use stored data to update weather display
    const temp = storedData.temp;
    const description = storedData.description;
    const humidity = storedData.humidity;
    const windSpeed = storedData.windSpeed;
    const sunrise = new Date(storedData.sunrise).getTime();
    const sunset = new Date(storedData.sunset).getTime();

    weatherElement.textContent = `Temp: ${temp.toFixed(1)}°C, ${description}`;
    additionalInfo.innerHTML = `
      <ul>
        <li>Humidity: <span id="humidity">${humidity}%</span></li>
        <li>Wind Speed: <span id="wind-speed">${windSpeed} m/s</span></li>
      </ul>`;

    // Show the sun container
    sunContainer.style.display = 'block';

    // Update sun position and weather icon based on stored data
    updateSunPosition(storedData.sunrise, storedData.sunset);
    updateWeatherIconPosition(storedData.weatherCode);

    // Update sun position every minute
    setInterval(() => {
      updateSunPosition(storedData.sunrise, storedData.sunset);
    }, 60000);
  } else {
    // Fetch new data if stored data is unavailable or outdated
    fetchWeather()
      .then(data => {
        if (data) {
          // Update display with new data and store it in localStorage
          updateWeather(data);
          localStorage.setItem('weatherData', JSON.stringify(data));

          // Show the sun container
          sunContainer.style.display = 'block';

          // Update sun position and weather icon based on fetched data
          updateSunPosition(data.sys.sunrise * 1000, data.sys.sunset * 1000);
          updateWeatherIconPosition(data.weather[0].icon);

          // Update sun position and weather icon every minute
          setInterval(() => {
            updateSunPosition(data.sys.sunrise * 1000, data.sys.sunset * 1000);
            updateWeatherIconPosition(data.weather[0].icon);
          }, 60000);
        } else {
          console.error('Failed to fetch weather data');
        }
      });
  }
}

// Function to update weather icon position based on weather code
function updateWeatherIconPosition(weatherCode) {
  const weatherIcon = document.getElementById('weather-icon');
  const iconPath = `img/weather/icon/${weatherCode}.svg`;

  // Ensure weather icon element is found and set its xlink:href attribute
  if (weatherIcon) {
    weatherIcon.setAttribute('xlink:href', iconPath);
  } else {
    console.error('Weather icon element not found');
  }
}

// Function to update weather information based on fetched data
function updateWeather(data) {
  const temp = data.main.temp;
  const description = data.weather[0].description;
  const humidity = data.main.humidity;
  const windSpeed = data.wind.speed;
  const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  // Update weather information elements with fetched data
  const weatherElement = document.getElementById('weather');
  const additionalInfo = document.getElementById('additional-info');
  const sunriseTimeElement = document.getElementById('sunrise-time');
  const sunsetTimeElement = document.getElementById('sunset-time');

  weatherElement.textContent = `Temp: ${temp.toFixed(1)}°C, ${description}`;
  additionalInfo.innerHTML = `
    <ul>
      <li>Humidity: <span id="humidity">${humidity}%</span></li>
      <li>Wind Speed: <span id="wind-speed">${windSpeed} m/s</span></li>
    </ul>`;

  sunriseTimeElement.textContent = sunrise;
  sunsetTimeElement.textContent = sunset;

  // Update sun position based on fetched sunrise and sunset times
  updateSunPosition(data.sys.sunrise * 1000, data.sys.sunset * 1000);
}

// Function to calculate and update the position of the sun SVG element
function updateSunPosition(sunrise, sunset) {
  const sun = document.getElementById('sun');
  const now = new Date().getTime();
  const sunriseTime = new Date(sunrise).getTime();
  const sunsetTime = new Date(sunset).getTime();
  const dayDuration = sunsetTime - sunriseTime;
  const elapsedTime = now - sunriseTime;

  let x, y, z;

  // Calculation of the sun position based on current time
  if (now >= sunriseTime && now <= sunsetTime) {
    // Daytime calculation
    z = (elapsedTime / dayDuration) * 100;
    x = 250 - 150 * Math.cos(Math.PI * z / 100);
    y = 200 - 150 * Math.sin(Math.PI * z / 100);
  } else if (now > sunsetTime && now <= new Date().setHours(23, 59, 59, 999)) {
    // Between sunset and midnight calculation
    const totalTime = (new Date().setHours(23, 59, 59, 999) - sunsetTime) / (1000 * 60); // Minutes
    const currentTime = (now - sunsetTime) / (1000 * 60); // Minutes
    z = (currentTime / totalTime) * 100;
    x = 250 - 150 * Math.cos(Math.PI * (150 + (z / 2)) / 100);
    y = 200 - 150 * Math.sin(Math.PI * (150 + (z / 2)) / 100);
  } else {
    // Between midnight and sunrise calculation
    const totalTime = (sunriseTime - new Date().setHours(0, 0, 0, 0)) / (1000 * 60); // Minutes
    const currentTime = (now - new Date().setHours(0, 0, 0, 0)) / (1000 * 60); // Minutes
    z = (currentTime / totalTime) * 100;
    x = 250 - 150 * Math.cos(Math.PI * (150 + (z / 2)) / 100);
    y = 200 - 150 * Math.sin(Math.PI * (150 + (z / 2)) / 100);
  }

  // Set the new position of the sun SVG element
  sun.setAttribute('cx', x);
  sun.setAttribute('cy', y);
}

// Run script after the DOM content is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize clock and weather display updates
  updateClock();
  updateWeatherDisplay();

  // Update clock every second
  setInterval(updateClock, 1000);
});

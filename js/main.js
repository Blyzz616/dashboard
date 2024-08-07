// Function to display alert div for 1 minute every hour
function displayAlert(message) {
  const alertContainer = document.getElementById('alert-container');
  alertContainer.innerHTML = message;
  alertContainer.style.display = 'block';

  setTimeout(() => {
    alertContainer.style.display = 'none';
  }, 60000); // Hide after 60 seconds
}

function updateForecastImage() {
  const forecastImage = document.getElementById('forecast-image');
  const newData = `../img/forecast.svg?${new Date().getTime()}`; // Cache-busting by appending the current timestamp
  forecastImage.setAttribute('data', newData);
}

// Function to fetch alerts from server
function fetchAlerts() {
  fetch('../current/alerts.txt')
    .then(response => {
      if (!response.ok) {
        if (response.status !== 404) { // Check if it's not a "Not Found" error
          throw new Error('Network response was not ok');
        }
        // If it's a 404 error (Not Found), just return an empty string
        return '';
      }
      return response.text();
    })
    .then(alertMessage => {
      if (alertMessage.trim().length > 0) {
        displayAlert(alertMessage.trim());
      }
    })
    .catch(error => {
      // Only log the error if it's not a 404 error
      if (error.message !== 'Network response was not ok') {
        console.error('Error fetching alerts:', error);
      }
    });
}

// Initial alert check
fetchAlerts();

// Set interval to check for alert message every hour
setInterval(fetchAlerts, 3600000); // Check every hour (3600000 milliseconds)

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  document.getElementById('hour').textContent = `${hours}:`;
  document.getElementById('minute').textContent = `${minutes}:`;
  const secondElement = document.querySelector('.second');
  secondElement.textContent = `${seconds}`;

  // Toggle the 'gone' class to start the opacity animation
  secondElement.classList.remove('gone');
  void secondElement.offsetWidth; // Trigger reflow to restart animation
  secondElement.classList.add('gone');
}

function updateSunPosition(sunrise, sunset) {
  const sun = document.getElementById('sun');
  const now = new Date().getTime();
  const sunriseTime = new Date(sunrise).getTime();
  const sunsetTime = new Date(sunset).getTime();
  const dayDuration = sunsetTime - sunriseTime;
  const elapsedTime = now - sunriseTime;

  let x, y;

  if (now >= sunriseTime && now <= sunsetTime) {
    const z = (elapsedTime / dayDuration) * 100;
    x = 250 - 150 * Math.cos(Math.PI * z / 100);
    y = 200 - 150 * Math.sin(Math.PI * z / 100);
  } else if (now > sunsetTime) {
    const totalTime = (new Date().setHours(23, 59, 59, 999) - sunsetTime) / (1000 * 60); // Minutes
    const currentTime = (now - sunsetTime) / (1000 * 60); // Minutes
    const z = (currentTime / totalTime) * 100;
    x = 250 - 150 * Math.cos(Math.PI * (100 + (z / 2)) / 100);
    y = 200 - 150 * Math.sin(Math.PI * (100 + (z / 2)) / 100);
  } else {
    const totalTime = (sunriseTime - new Date().setHours(0, 0, 0, 0)) / (1000 * 60); // Minutes
    const currentTime = (now - new Date().setHours(0, 0, 0, 0)) / (1000 * 60); // Minutes
    const z = (currentTime / totalTime) * 100;
    x = 250 - 150 * Math.cos(Math.PI * (150 + (z / 2)) / 100);
    y = 200 - 150 * Math.sin(Math.PI * (150 + (z / 2)) / 100);
  }
  sun.setAttribute('cx', x);
  sun.setAttribute('cy', y);
}

function updateMoonPosition(moonrise, moonset) {
  const moon = document.getElementById('moon');
  const now = new Date().getTime();
  const moonriseTime = new Date(moonrise).getTime();
  const moonsetTime = new Date(moonset).getTime();
  const nightDuration = moonsetTime - moonriseTime;
  const elapsedTime = now - moonriseTime;

  let x, y;

  if (now >= moonriseTime && now <= moonsetTime) {
    const z = (elapsedTime / nightDuration) * 100;
    x = 250 - 110 * Math.cos(Math.PI * z / 100);
    y = 200 - 110 * Math.sin(Math.PI * z / 100);
  } else if (now > moonsetTime) {
    const totalTime = (new Date().setHours(23, 59, 59, 999) - moonsetTime) / (1000 * 60); // Minutes
    const currentTime = (now - moonsetTime) / (1000 * 60); // Minutes
    const z = (currentTime / totalTime) * 100;
    x = 250 - 110 * Math.cos(Math.PI * (100 + (z / 2)) / 100);
    y = 200 - 110 * Math.sin(Math.PI * (100 + (z / 2)) / 100);
  } else {
    const totalTime = (moonriseTime - new Date().setHours(0, 0, 0, 0)) / (1000 * 60); // Minutes
    const currentTime = (now - new Date().setHours(0, 0, 0, 0)) / (1000 * 60); // Minutes
    const z = (currentTime / totalTime) * 100;
    x = 250 - 110 * Math.cos(Math.PI * (150 + (z / 2)) / 100);
    y = 200 - 110 * Math.sin(Math.PI * (150 + (z / 2)) / 100);
  }
  moon.setAttribute('cx', x);
  moon.setAttribute('cy', y);
}

function fetchTemperatureAndUpdate() {
  fetch('../current/temp.txt')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(temp => {
      const formattedTemp = parseFloat(temp).toFixed(1);
      document.getElementById('temp').textContent = `${formattedTemp}°`;
    })
    .catch(error => {
      console.error('Error fetching temperature:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);

  // Initial sunrise and sunset times from PHP-rendered HTML
  const sunriseTimestamp = parseInt(document.getElementById('sunrise-time').getAttribute('data-timestamp'), 10) * 1000;
  const sunsetTimestamp = parseInt(document.getElementById('sunset-time').getAttribute('data-timestamp'), 10) * 1000;

  // Convert timestamps to local time and update the SVG elements
  const sunriseDate = new Date(sunriseTimestamp);
  const sunsetDate = new Date(sunsetTimestamp);

  // These are the time labels for sunrise and sunset
  const sunriseLocalTime = sunriseDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Vancouver' });
  const sunsetLocalTime = sunsetDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Vancouver' });

  document.getElementById('sunrise-time').textContent = sunriseLocalTime;
  document.getElementById('sunset-time').textContent = sunsetLocalTime;

  // Fetch moonrise and moonset times from files
  fetch('../current/moonup.txt')
    .then(response => response.text())
    .then(moonriseTimestamp => {
      const moonriseDate = new Date(parseInt(moonriseTimestamp, 10) * 1000);

      fetch('../current/moondn.txt')
        .then(response => response.text())
        .then(moonsetTimestamp => {
          const moonsetDate = new Date(parseInt(moonsetTimestamp, 10) * 1000);

          // Update sun position initially and every minute
          updateSunPosition(sunriseTimestamp, sunsetTimestamp);
          setInterval(() => {
            updateSunPosition(sunriseTimestamp, sunsetTimestamp);
          }, 60000); // Update sun position every minute

          // Update moon position initially and every minute
          updateMoonPosition(moonriseDate, moonsetDate);
          setInterval(() => {
            updateMoonPosition(moonriseDate, moonsetDate);
          }, 60000); // Update moon position every minute
        });
    });

  // Fetch temperature initially and every 5 minutes
  fetchTemperatureAndUpdate();
  setInterval(fetchTemperatureAndUpdate, 300000); // Fetch temperature every 5 minutes (300000 milliseconds)

  // Update the forecast image every 5 minutes
  setInterval(updateForecastImage, 300000); // 300000 milliseconds = 5 minutes

});

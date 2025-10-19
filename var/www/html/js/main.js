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
  const newData = `../img/forecast.svg`; // Cache-busting by appending the current timestamp
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

// Function to update weather description with "split-flap" effect
function splitFlapEffect(newDescription) {
  const weatherElement = document.getElementById('weather');
  const totalTime = 2600; // Total effect duration in milliseconds
  const characterUpdateInterval = 50; // Time in milliseconds to update characters
  const stepInterval = 200; // Time in milliseconds to update each character

  let currentIndex = 0;
  const descriptionLength = newDescription.length;

  function getRandomChar() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  function updateDescription() {
    let displayText = '';

    // Generate random characters, but keep spaces as is
    for (let i = 0; i < descriptionLength; i++) {
      if (newDescription[i] === ' ') {
        displayText += ' '; // Maintain spaces
      } else if (i < currentIndex) {
        displayText += newDescription[i]; // Use correct character once its time has passed
      } else {
        displayText += getRandomChar(); // Randomize character
      }
    }

    weatherElement.textContent = displayText;

    if (currentIndex < descriptionLength) {
      setTimeout(updateDescription, characterUpdateInterval);
    }
  }

  function finalizeDescription() {
    weatherElement.textContent = newDescription;
  }

  // Start the effect
  updateDescription();

  // Set intervals to update each character to the correct one
  const effectIntervals = [];
  for (let i = 0; i < descriptionLength; i++) {
    if (newDescription[i] !== ' ') {
      effectIntervals.push(setTimeout(() => {
        currentIndex = i + 1;
        if (currentIndex === descriptionLength) {
          finalizeDescription();
        }
      }, (i + 1) * stepInterval));
    }
  }

  // Clear intervals after total effect duration
  setTimeout(() => {
    effectIntervals.forEach(clearTimeout);
    finalizeDescription();
  }, totalTime + descriptionLength * stepInterval); // Adjusted to account for longer texts
}

// Function to update weather description
function updateWeatherDescription() {
  fetch('../current/weather.txt') // Replace with the correct URL or endpoint
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then(description => {
      splitFlapEffect(description.trim());
    })
    .catch(error => {
      console.error('Error fetching weather description:', error);
    });
}

// Initial alert check
fetchAlerts();

// Set interval to check for alert message every hour
setInterval(fetchAlerts, 3600000); // Check every hour (3600000 milliseconds)

// Initial weather description update
updateWeatherDescription();

// Set interval to update weather description every 15 minutes
setInterval(updateWeatherDescription, 900000); // 900000 milliseconds = 15 minutes

function updateWindDirection() {
  Promise.all([
    fetch('../current/winddeg.txt').then(response => response.text()),
    fetch('../current/windspd.txt').then(response => response.text())
  ])
    .then(([directionText, speedText]) => {
      const windDirection = parseFloat(directionText.trim());
      const windSpeed = parseFloat(speedText.trim());

      // Check if windDirection and windSpeed are valid
      if (isNaN(windDirection)) {
        console.error('Invalid wind direction value:', windDirection);
        return;
      }

      if (isNaN(windSpeed)) {
        console.error('Invalid wind speed value:', windSpeed);
        return;
      }

      // Calculate the rotation angle (wind direction)
      const rotation = windDirection % 360; // Ensure the rotation is within 0 to 359 degrees

      // Calculate the oscillation duration based on wind speed
      // Lower duration means faster oscillation
      const minDuration = 0.5; // Minimum duration for the fastest oscillation
      const maxDuration = 2;   // Maximum duration for the slowest oscillation
      const oscillationDuration = Math.max(minDuration, maxDuration - windSpeed * 0.1); // Cap duration to avoid too fast

      // Log the values for debugging
      //console.log('Wind direction:', windDirection);
      //console.log('Calculated rotation:', rotation);
      //console.log('Wind speed:', windSpeed);
      //console.log('Oscillation duration:', oscillationDuration);

      const weathervane = document.querySelector('.weathervane');
      if (weathervane) {

	// Step 0: Stop any oscillation before changing direction
	weathervane.classList.remove('oscillating');
	weathervane.style.transition = 'none';

        // Step 1: Initial movement to the wind direction
        weathervane.style.transition = 'transform 1s cubic-bezier(0.7, 0, 0.8, 1)';
        weathervane.style.transform = `rotate(${rotation}deg)`;

        // Step 2: Transition to start oscillation position
        setTimeout(() => {
          const oscillationStart = rotation - 2; // Adjust the start point of oscillation
          weathervane.style.transition = 'transform 1s ease';
          weathervane.style.transform = `rotate(${oscillationStart}deg)`;

          // Step 3: Apply oscillation
          setTimeout(() => {
            weathervane.style.transition = 'none'; // Disable transition for smooth oscillation
	    weathervane.style.setProperty('--rotation-angle', `${rotation}deg`); // define the base angle
            weathervane.style.setProperty('--oscillation-duration', `${oscillationDuration}s`);

	  // Restart the animation cleanly (if it was already oscillating)
	  weathervane.classList.remove('oscillating');
	  void weathervane.offsetWidth; // Force reflow
	  weathervane.classList.add('oscillating');
          }, 1000); // Delay for the transition to the start of oscillation
        }, 1000); // Delay for the initial wind direction transition
      } else {
        console.error('No element with class .weathervane found.');
      }
    })
    .catch(error => {
      console.error('Error fetching wind data:', error);
    });
}

// Call the function to update wind direction and speed
updateWindDirection();

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

function updateNightShade() {
  const shade = document.querySelector('.shade');
  if (!shade) return;

  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 6; // 10 PM to 6 AM

  if (isNight) {
    shade.style.display = 'block';
    shade.style.opacity = '1';
  } else {
    shade.style.opacity = '0';
    setTimeout(() => shade.style.display = 'none', 1000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);

  // Apply night shade immediately
  updateNightShade();

  // Recheck every 5 minutes in case of time change
  setInterval(updateNightShade, 300000);

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

  // Set an interval to update the wind direction every 15 minutes (900000 milliseconds)
  setInterval(updateWindDirection, 900000); // 900000 ms = 15 minutes

  updateWindDirection();
});

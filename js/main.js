function updateClock() {
  const clock = document.getElementById('clock');
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const hourElement = document.getElementById('hour');
  const minuteElement = document.getElementById('minute');
  const secondElement = document.querySelector('.second');

  if (!hourElement || !minuteElement || !secondElement) {
    console.error('Clock elements not found');
    return;
  }

  hourElement.innerHTML = `${hours}:`;
  minuteElement.innerHTML = `${minutes}:`;
  secondElement.innerHTML = `${seconds}`;

  secondElement.classList.remove('gone');
  void secondElement.offsetWidth; // Trigger reflow to restart animation
  secondElement.classList.add('gone');

  clock.style.fontSize = '20vw';

  setTimeout(updateClock, 1000);
}

function updateSunPosition(sunrise, sunset) {
  const sun = document.getElementById('sun');
  const now = new Date().getTime();
  const sunriseTime = new Date(sunrise * 1000).getTime();
  const sunsetTime = new Date(sunset * 1000).getTime();
  const dayDuration = sunsetTime - sunriseTime;
  const elapsedTime = now - sunriseTime;

  let x, y, z;

  // Calculation of the sun position
  if (now >= sunriseTime && now <= sunsetTime) {
    z = (elapsedTime / dayDuration) * 100;
    x = 250 - 150 * Math.cos(Math.PI * z / 100);
    y = 200 - 150 * Math.sin(Math.PI * z / 100);
  } else if (now > sunsetTime && now <= new Date().setHours(23, 59, 59, 999)) {
    const totalTime = (new Date().setHours(23, 59, 59, 999) - sunsetTime) / (1000 * 60);
    const currentTime = (now - sunsetTime) / (1000 * 60);
    z = (currentTime / totalTime) * 100;
    x = 250 - 150 * Math.cos(Math.PI * (100 + (z / 2)) / 100);
    y = 200 - 150 * Math.sin(Math.PI * (100 + (z / 2)) / 100);
  } else {
    const totalTime = (sunriseTime - new Date().setHours(0, 0, 0, 0)) / (1000 * 60);
    const currentTime = (now - new Date().setHours(0, 0, 0, 0)) / (1000 * 60);
    z = (currentTime / totalTime) * 100;
    x = 250 - 150 * Math.cos(Math.PI * (150 + (z / 2)) / 100);
    y = 200 - 150 * Math.sin(Math.PI * (150 + (z / 2)) / 100);
  }
  sun.setAttribute('cx', x);
  sun.setAttribute('cy', y);
}

document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);

  // Initial update of the sun position and weather icon
  const sunrise = parseInt(document.getElementById('sunrise-time').getAttribute('data-timestamp'), 10);
  const sunset = parseInt(document.getElementById('sunset-time').getAttribute('data-timestamp'), 10);
  updateSunPosition(sunrise, sunset);

  setInterval(() => {
    updateSunPosition(sunrise, sunset);
  }, 60000); // Update sun position every minute
});

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const username = localStorage.getItem('username');

    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }


    const currentPage = window.location.pathname;

    if (currentPage.includes('buyer-dashboard.html') && role !== 'buyer') {
        window.location.href = 'login.html';
        return;
    }

    if (currentPage.includes('manager-dashboard.html') && role !== 'manager') {
        window.location.href = 'login.html';
        return;
    }

    
    const userInfoSection = document.getElementById('user-info');
    if (userInfoSection) {
        userInfoSection.textContent = `Logged in as: ${username} (${role})`;
    }
});
// Show live clock in Israel timezone
function loadClock() {
    const clockElement = document.getElementById("israel-clock");
  
    function updateClock() {
      const now = new Date();
      const time = now.toLocaleTimeString("en-IL", {
        timeZone: "Asia/Jerusalem",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      clockElement.textContent = `Israel Time: ${time}`;
    }
  
    updateClock();
    setInterval(updateClock, 1000);
  }
  
  // Load weather for Tel Aviv using Open-Meteo API
  async function loadWeatherTelAviv() {
    const weatherElement = document.getElementById("weather-info");
  
    try {
      const lat = 32.0853;
      const lon = 34.7818;
  
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
      const response = await fetch(url);
      const data = await response.json();
  
      const temp = data.current_weather.temperature;
      const wind = data.current_weather.windspeed;
  
      weatherElement.textContent = `Tel Aviv: ${temp}°C, Wind: ${wind} km/h`;
    } catch (error) {
      weatherElement.textContent = "Could not load weather.";
      console.error("Weather error:", error);
    }
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    loadClock();
    loadWeatherTelAviv();
  });
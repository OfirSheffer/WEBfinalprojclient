const btn = document.getElementById("btn-recipe");
const recipeCard = document.getElementById("recipe-card");

btn.addEventListener("click", async () => {
  try {
    // שלב 1 – שליפת קינוחים כלליים
    const res = await fetch("https://www.themealdb.com/api/json/v1/1/filter.php?c=Dessert");
    const data = await res.json();
    const desserts = data.meals;

    // בחירת קינוח אקראי
    const randomDessert = desserts[Math.floor(Math.random() * desserts.length)];
    const id = randomDessert.idMeal;

    // שלב 2 – שליפת פרטי קינוח לפי ID
    const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    const detailData = await detailRes.json();
    const recipe = detailData.meals[0];

    // הצגת המתכון
    recipeCard.innerHTML = `
      <h3>${recipe.strMeal}</h3>
      <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}">
      <p>${recipe.strInstructions}</p>
    `;
  } catch (error) {
    console.error("שגיאה:", error);
    recipeCard.innerHTML = `<p>Please try again later</p>`;
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
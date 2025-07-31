
let pieChartInstance = null;
let barChartInstance = null;
let revenueChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  loadAnalytics();
  document.getElementById('refresh-data').addEventListener('click', loadAnalytics);
  document.getElementById('export-excel').addEventListener('click', exportToExcel);
});

async function loadAnalytics() {
  try {
    const ordersRes = await fetch('https://webfinalprojserver-production.up.railway.app/api/orders');
    const orders = await ordersRes.json();

    const summaryRes = await fetch('https://webfinalprojserver-production.up.railway.app/api/orders/summary-by-day');
    const revenueSummary = await summaryRes.json();

    buildPieChart(orders);
    buildCombinedChart(revenueSummary); 
    calculateSummary(orders);
  } catch (err) {
    console.error("❌ Failed to load analytics:", err);
  }
}

function buildPieChart(orders) {
  const categoryTotals = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      if (!categoryTotals[item.name]) categoryTotals[item.name] = 0;
      categoryTotals[item.name] += item.quantity;
    });
  });

  const ctx = document.getElementById('categoryPieChart').getContext('2d');
  if (pieChartInstance) pieChartInstance.destroy();

  pieChartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        label: 'Items Sold',
        data: Object.values(categoryTotals),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#8AFFC1', '#FFA500']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'right' }
      }
    }
  });
}

function buildCombinedChart(summaryData) {
  const labels = summaryData.map(entry => entry._id);
  const revenueData = summaryData.map(entry => entry.totalRevenue);
  const orderCountData = summaryData.map(entry => entry.totalOrders);

  const ctx = document.getElementById('dailyBarChart').getContext('2d');
  if (barChartInstance) barChartInstance.destroy();

  barChartInstance = new Chart(ctx, {
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: '₪ Revenue',
          data: revenueData,
          backgroundColor: '#007bff',
          yAxisID: 'y',
        },
        {
          type: 'line',
          label: 'Orders Count',
          data: orderCountData,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.2)',
          fill: true,
          tension: 0.3,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: { display: true, text: '₪ Revenue' }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Order Count' }
        }
      }
    }
  });
}

function calculateSummary(orders) {
  const totalOrders = orders.length;
  let totalRevenue = 0;
  let totalItems = 0;

  orders.forEach(order => {
    order.items.forEach(item => {
      totalRevenue += item.price * item.quantity;
      totalItems += item.quantity;
    });
  });

  const averageOrderValue = (totalRevenue / totalOrders).toFixed(2);

  document.getElementById('total-sales').textContent = `₪${totalRevenue.toFixed(2)}`;
  document.getElementById('total-orders').textContent = totalOrders;
  document.getElementById('average-cart').textContent = `₪${averageOrderValue}`;
}

async function exportToExcel() {
  try {
    const res = await fetch('https://webfinalprojserver-production.up.railway.app/api/orders/summary-by-day');
    const data = await res.json();

    const sheetData = [
      ["Date", "Total Revenue", "Total Items Sold", "Total Orders"],
      ...data.map(entry => [
        entry._id,
        entry.totalRevenue,
        entry.totalItemsSold,
        entry.totalOrders
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daily Summary");

    XLSX.writeFile(workbook, "daily_revenue_summary.xlsx");
  } catch (error) {
    console.error("❌ Failed to export to Excel:", error);
  }
}

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
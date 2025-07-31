document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    document.getElementById('send-chat').addEventListener('click', sendChatMessage);
    document.getElementById('chat-input').addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendChatMessage();
      }
    });
  });
  
  let currentOrderId = null;
  
  async function loadOrders() {
    const userId = localStorage.getItem('userId');
    const ordersBody = document.getElementById('orders-body');
  
    if (!userId) {
      Swal.fire({
        icon: 'warning',
        title: 'Login Required',
        text: 'Please log in to view your orders.',
      }).then(() => {
        window.location.href = 'login.html';
      });
      return;
    }
  
    try {
      const response = await fetch(`https://webfinalprojserver-production.up.railway.app/api/orders/user/${userId}`);
      const orders = await response.json();
      ordersBody.innerHTML = '';
  
      if (!Array.isArray(orders) || orders.length === 0) {
        ordersBody.innerHTML = `<tr><td colspan="5">You have no orders yet.</td></tr>`;
        return;
      }
  
      orders.forEach(order => {
        const itemsText = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
        const dateTimeText = (order.pickup === "Prepare Now")
          ? new Date(order.createdAt).toLocaleString('he-IL')
          : order.pickup;
  
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${order.orderNumber}</td>
          <td>${dateTimeText}</td>
          <td>${itemsText}</td>
          <td>${order.status}</td>
          <td><button onclick="openChat('${order._id}')">Chat</button></td>
        `;
        ordersBody.appendChild(row);
      });
    } catch (err) {
      console.error('❌ Error loading orders:', err);
      Swal.fire({
        icon: 'error',
        title: 'Load Error',
        text: 'Could not load orders. Please try again later.',
      });
    }
  }
  
  async function openChat(orderId) {
    currentOrderId = orderId;
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '<p>Loading chat...</p>';
    document.getElementById('chat-input').value = '';
  
    try {
      const response = await fetch(`https://webfinalprojserver-production.up.railway.app/api/messages/${orderId}`);
      const messages = await response.json();
      chatBox.innerHTML = '';
  
      messages.forEach(msg => {
        const p = document.createElement('p');
        const who = msg.sender === 'buyer' ? 'You' : 'Manager';
        p.innerHTML = `<strong>${who}:</strong> ${msg.content}`;
        chatBox.appendChild(p);
      });
  
      chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
      chatBox.innerHTML = '';
      Swal.fire({
        icon: 'error',
        title: 'Chat Error',
        text: 'Could not load messages. Please try again.',
      });
    }
  }
  
  async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message || !currentOrderId) return;
  
    try {
      await fetch(`https://webfinalprojserver-production.up.railway.app/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentOrderId,
          sender: "buyer",
          content: message
        })
      });
  
      input.value = '';
      openChat(currentOrderId);
    } catch (err) {
      console.error("❌ Error sending message:", err);
      Swal.fire({
        icon: 'error',
        title: 'Message Failed',
        text: 'Could not send message. Please try again.',
      });
    }
  }
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
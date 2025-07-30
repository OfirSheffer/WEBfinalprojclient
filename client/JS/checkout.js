document.addEventListener('DOMContentLoaded', () => {
  const userId = localStorage.getItem('userId');
  const username = localStorage.getItem('username');
  if (!userId) {
    Swal.fire({
      icon: 'warning',
      title: 'Login Required',
      text: 'Please log in before placing an order.'
    }).then(() => {
      window.location.href = 'login.html';
    });
    return;
  }

  document.getElementById('checkout-username').textContent = username;
  loadCartItems();

  document.getElementById('now').addEventListener('change', () => {
    document.getElementById('pickup-label').hidden = true;
    document.getElementById('pickup-text').hidden = true;
  });

  document.getElementById('later').addEventListener('change', () => {
    document.getElementById('pickup-label').hidden = false;
    document.getElementById('pickup-text').hidden = false;
  });

  document.getElementById('checkout-form').addEventListener('submit', handlePlaceOrder);
  document.getElementById('confirm-payment').addEventListener('click', handlePayment);
  document.getElementById('card-number').addEventListener('input', formatCardNumber);
});

function loadCartItems() {
  const items = JSON.parse(localStorage.getItem('cart')) || [];
  const list = document.getElementById('checkout-items');
  const total = document.getElementById('checkout-total');
  let sum = 0;

  list.innerHTML = '';

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} - ₪${item.price} x 
      <input type="number" value="${item.quantity}" min="1" data-index="${index}" class="qty-input"> 
      <button data-index="${index}" class="remove-item">Remove</button>
    `;
    list.appendChild(li);
    sum += item.price * item.quantity;
  });

  total.textContent = `Total: ₪${sum.toFixed(2)}`;

  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', updateQuantity);
  });

  document.querySelectorAll('.remove-item').forEach(btn => {
    btn.addEventListener('click', removeItem);
  });
}

function updateQuantity(e) {
  const index = e.target.dataset.index;
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const newQuantity = parseInt(e.target.value);

  if (newQuantity < 1 || isNaN(newQuantity)) return;

  cart[index].quantity = newQuantity;
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCartItems();

  showCartMessage('Product updated successfully!', 'green');
}

function removeItem(e) {
  const index = e.target.dataset.index;
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  loadCartItems();

  showCartMessage('Product removed successfully!', 'red');
}

function showCartMessage(text, color) {
  const msg = document.getElementById('cart-message');
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = color;

  clearTimeout(msg.timer);
  msg.timer = setTimeout(() => {
    msg.textContent = '';
  }, 3000);
}

function handlePlaceOrder(e) {
  e.preventDefault();

  const firstName = document.getElementById('first-name').value.trim();
  const lastName = document.getElementById('last-name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  const pickup = document.getElementById('now').checked
    ? 'Prepare Now'
    : document.getElementById('pickup-text').value.trim();

  if (!firstName || !lastName || !phone || (!pickup && !document.getElementById('now').checked)) {
    Swal.fire({
      icon: 'error',
      title: 'Missing Fields',
      text: 'Please fill in all required fields.'
    });
    return;
  }

  localStorage.setItem('order-details', JSON.stringify({
    firstName, lastName, phone, pickup
  }));

  document.getElementById('payment-popup').classList.remove('hidden');
}

function formatCardNumber(e) {
  let value = e.target.value.replace(/\D/g, '').slice(0, 16);
  e.target.value = value.replace(/(.{4})/g, '$1 ').trim();
}

async function handlePayment() {
  const userId = localStorage.getItem('userId');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const order = JSON.parse(localStorage.getItem('order-details') || '{}');

  const card = document.getElementById('card-number').value.replace(/\s/g, '');
  const expiry = document.getElementById('card-expiry').value.trim();
  const cvc = document.getElementById('card-cvc').value.trim();

  if (!/^\d{16}$/.test(card) || !/^\d{2}\/\d{2}$/.test(expiry) || !/^\d{3}$/.test(cvc)) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid Card',
      text: 'Please check your credit card details.'
    });
    return;
  }

  const body = {
    items: cart,
    userId,
    phone: order.phone,
    pickup: order.pickup,
    fullName: `${order.firstName} ${order.lastName}`
  };

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (res.ok) {
      await Swal.fire({
        icon: 'success',
        title: 'Order Placed!',
        text: `Order Number: ${data.orderNumber}`
      });

      localStorage.removeItem('cart');
      localStorage.removeItem('order-details');
      document.getElementById('payment-popup').classList.add('hidden');
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: data.message || 'Server error. Please try again.'
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Failed',
      text: 'Could not submit the order. Please try again later.'
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
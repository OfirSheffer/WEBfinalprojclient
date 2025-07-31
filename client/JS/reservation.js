document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  renderCart();

  const cartButton = document.getElementById('cart-button');
  const cartPanel = document.getElementById('cart-panel');
  if (cartButton) {
    cartButton.addEventListener('click', () => {
      cartPanel.classList.toggle('hidden');
      renderCart();
    });
  }

  const checkoutButton = document.getElementById('checkout-button');
  if (checkoutButton) {
    checkoutButton.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  }
});

let cart = JSON.parse(localStorage.getItem('cart')) || [];

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
  const cartItemsContainer = document.getElementById('cart-items');
  if (!cartItemsContainer) return;

  cartItemsContainer.innerHTML = '';
  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${item.name} - ₪${item.price} x 
      <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="quantity-input"> 
      <button data-index="${index}" class="remove-button">Remove</button>
    `;
    cartItemsContainer.appendChild(li);
  });

  document.querySelectorAll('.quantity-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = e.target.getAttribute('data-index');
      const newQuantity = parseInt(e.target.value);
      if (!isNaN(newQuantity) && newQuantity > 0) {
        const item = cart[index];
        const card = document.querySelector(`.card[data-name="${item.name}"]`);
        const maxAvailable = parseInt(card?.getAttribute('data-stock') || "0");

        if (newQuantity <= maxAvailable) {
          cart[index].quantity = newQuantity;
          saveCart();
        } else {
          Swal.fire({
            icon: 'warning',
            title: 'Stock Limit',
            text: `Only ${maxAvailable} available in stock.`
          });
          e.target.value = cart[index].quantity;
        }
        renderCart();
      }
    });
  });

  document.querySelectorAll('.remove-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      const removedItem = cart[index];
      cart.splice(index, 1);
      saveCart();
      renderCart();

      Swal.fire({
        icon: 'success',
        title: 'Product Removed',
        text: `${removedItem.name} was removed from your cart.`
      });
    });
  });
}

async function loadProducts() {
  try {
    const res = await fetch('https://webfinalprojserver-production.up.railway.app/api/products');
    const products = await res.json();

    const productImages = {
      "Chocolate Cake": "images/chocolatecake.png",
      "Croissant": "images/croissant.png",
      "Cinnabon": "images/cinnabon.png",
      "Coffee": "images/coffee.png",
      "Iced Coffee": "images/icedcoffee.png",
      "Tart": "images/tart.png",
      "Bread": "images/bread.png",
      "Hot Chocolate": "images/hotchocolate.png"
    };

    const container = document.querySelector('.cards');
    container.innerHTML = '';

    products.forEach(product => {
      if (product.quantity <= 0) return;

      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('data-name', product.name);
      card.setAttribute('data-price', product.price);
      card.setAttribute('data-stock', product.quantity);

      const imageUrl = productImages[product.name] || "images/default.jpg";

      card.innerHTML = `
        <figure class="img-container">
          <img src="${imageUrl}" alt="${product.name}">
        </figure>
        <section class="card-content">
          <h3>${product.name}</h3>
          <p>${product.description || ''}</p>
          <p>₪${product.price}</p>
          <section class="add-to-cart-section">
            <label>Quantity:</label>
            <input type="number" class="product-quantity" value="1" min="1">
            <button class="add-to-cart">Add to Cart</button>
          </section>
        </section>
      `;

      container.appendChild(card);
    });

    setupAddToCartButtons();
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function setupAddToCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', (e) => {
      const card = e.target.closest('.card');
      const name = card.dataset.name;
      const price = parseFloat(card.dataset.price);
      const quantityInput = card.querySelector('.product-quantity');
      const quantity = parseInt(quantityInput.value);

      if (isNaN(quantity) || quantity <= 0) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Quantity',
          text: 'Please enter a valid quantity.'
        });
        return;
      }

      const availableQty = parseInt(card.getAttribute('data-stock'));
      const currentInCart = cart.find(item => item.name === name)?.quantity || 0;

      if (quantity + currentInCart > availableQty) {
        Swal.fire({
          icon: 'warning',
          title: 'Stock Limit',
          text: `Only ${availableQty - currentInCart} more in stock.`
        });
        return;
      }

      const existingItem = cart.find(item => item.name === name);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({ name, price, quantity });
      }

      saveCart();
      renderCart();

      Swal.fire({
        icon: 'success',
        title: 'Added to Cart',
        text: `${name} x${quantity} was added.`
      });

      const cartPanel = document.getElementById('cart-panel');
      cartPanel.classList.remove('hidden');
      quantityInput.value = 1;
    });
  });
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
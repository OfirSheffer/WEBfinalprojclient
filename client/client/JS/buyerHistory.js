document.addEventListener('DOMContentLoaded', () => {
    loadOrderHistory();
});

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

async function loadOrderHistory() {
    const historyBody = document.getElementById('history-body');
    const userId = localStorage.getItem('userId');

    if (!userId) {
        Swal.fire({
            icon: 'warning',
            title: 'Login Required',
            text: 'Please log in to view your order history.'
        }).then(() => {
            window.location.href = 'login.html';
        });
        return;
    }

    try {
        const response = await fetch(`https://webfinalprojserver-production.up.railway.app/api/orders/user/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch orders.');

        const orders = await response.json();

        if (!orders.length) {
            historyBody.innerHTML = '<tr><td colspan="4">No orders found.</td></tr>';
            return;
        }

        historyBody.innerHTML = '';
        orders.forEach(order => {
            const row = document.createElement('tr');

            const itemList = document.createElement('section');
            itemList.classList.add('item-list');

            order.items.forEach(item => {
                const img = document.createElement('img');
                const imageUrl = item.imageUrl || productImages[item.name] || "images/default.jpg";
                img.src = imageUrl;
                img.alt = item.name;
                img.title = `${item.name} x${item.quantity}`;
                itemList.appendChild(img);
            });

            const reorderButton = document.createElement('button');
            reorderButton.textContent = 'Reorder';
            reorderButton.classList.add('reorder-button');
            reorderButton.addEventListener('click', () => openReorderPopup(order));

            row.innerHTML = `
                <td>${order.orderNumber}</td>
                <td>${new Date(order.createdAt).toLocaleString()}</td>
                <td></td>
                <td></td>
            `;
            row.children[2].appendChild(itemList);
            row.children[3].appendChild(reorderButton);
            historyBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading order history:", error);
        Swal.fire({
            icon: 'error',
            title: 'Load Failed',
            text: 'Unable to load your order history.'
        });
    }
}

const reorderPopup = document.getElementById('reorder-popup');
const reorderItemsContainer = document.getElementById('reorder-items');
const proceedReorderButton = document.getElementById('proceed-reorder');

function openReorderPopup(order) {
    reorderItemsContainer.innerHTML = '';

    order.items.forEach(item => {
        const itemSection = document.createElement('section');
        itemSection.classList.add('popup-item');

        const img = document.createElement('img');
        const imageUrl = item.imageUrl || productImages[item.name] || "images/default.jpg";
        img.src = imageUrl;
        img.alt = item.name;

        const name = document.createElement('span');
        name.textContent = item.name;

        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.min = 1;
        quantityInput.value = item.quantity;

        itemSection.appendChild(img);
        itemSection.appendChild(name);
        itemSection.appendChild(quantityInput);
        reorderItemsContainer.appendChild(itemSection);
    });

    reorderPopup.classList.remove('hidden');
}

async function fetchProducts() {
    try {
        const response = await fetch('https://webfinalprojserver-production.up.railway.app/api/products');
        return await response.json();
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

proceedReorderButton.addEventListener('click', async () => {
    const reorderedItems = [];
    const itemSections = reorderItemsContainer.querySelectorAll('section');
    const products = await fetchProducts();
    let stockOk = true;
    let outOfStockItem = '';

    itemSections.forEach(section => {
        const name = section.querySelector('span').textContent;
        const quantity = parseInt(section.querySelector('input').value);
        const imgSrc = section.querySelector('img').src;
        const product = products.find(p => p.name.toLowerCase() === name.toLowerCase());

        if (!product || product.quantity < quantity) {
            stockOk = false;
            outOfStockItem = name;
        } else {
            reorderedItems.push({ name, quantity, image: imgSrc, price: product.price });
        }
    });

    if (!stockOk) {
        Swal.fire({
            icon: 'warning',
            title: 'Stock Issue',
            text: `The item "${outOfStockItem}" is out of stock or doesn't have enough quantity.`
        });
        return;
    }

    localStorage.setItem('reorderData', JSON.stringify({ items: reorderedItems, reorder: true }));
    localStorage.setItem('cart', JSON.stringify(reorderedItems));
    reorderPopup.classList.add('hidden');
    window.location.href = 'checkout.html';
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
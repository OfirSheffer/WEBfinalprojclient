document.addEventListener('DOMContentLoaded', () => {
    loadInventory();
    fetchExistingProducts();

    document.getElementById('add-product-button').addEventListener('click', () => {
        document.getElementById('add-product-popup').classList.remove('hidden');
    });

    document.getElementById('cancel-new-product').addEventListener('click', () => {
        document.getElementById('add-product-popup').classList.add('hidden');
    });

    document.getElementById('save-new-product').addEventListener('click', addNewProduct);
});

let existingProducts = [];

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

function showPopup(title, text, icon = 'info') {
    Swal.fire({
        title,
        text,
        icon,
        confirmButtonColor: '#612999'
    });
}

async function fetchExistingProducts() {
    try {
        const response = await fetch('https://webfinalprojserver-production.up.railway.app/api/products');
        const products = await response.json();
        existingProducts = products;
    } catch (error) {
        console.error("Error fetching existing products:", error);
        showPopup('Error', 'Failed to load products.', 'error');
    }
}

async function loadInventory() {
    const inventoryBody = document.getElementById('inventory-body');
    inventoryBody.innerHTML = 'Loading...';

    try {
        const response = await fetch('https://webfinalprojserver-production.up.railway.app/api/products');
        const products = await response.json();
        inventoryBody.innerHTML = '';

        products.forEach(product => {
            const row = document.createElement('tr');

            const img = document.createElement('img');
            img.src = productImages[product.name] || 'images/default.jpg';
            img.alt = product.name;
            img.classList.add('product-image');

            const actions = document.createElement('section');

            const updateStockBtn = document.createElement('button');
            updateStockBtn.textContent = "Update Stock";
            updateStockBtn.classList.add('action-button');
            updateStockBtn.onclick = async () => {
                const { value: newStock } = await Swal.fire({
                    title: `Enter new stock for ${product.name}`,
                    input: 'number',
                    inputValue: product.quantity,
                    inputAttributes: { min: 0 },
                    showCancelButton: true,
                    confirmButtonColor: '#612999'
                });
                if (newStock !== undefined) {
                    await updateProduct(product._id, { quantity: parseInt(newStock) });
                    showPopup('Success', `Stock updated for ${product.name}.`, 'success');
                    loadInventory();
                }
            };

            const updatePriceBtn = document.createElement('button');
            updatePriceBtn.textContent = "Update Price";
            updatePriceBtn.classList.add('action-button');
            updatePriceBtn.onclick = async () => {
                const { value: newPrice } = await Swal.fire({
                    title: `Enter new price for ${product.name}`,
                    input: 'number',
                    inputValue: product.price,
                    inputAttributes: { min: 0 },
                    showCancelButton: true,
                    confirmButtonColor: '#612999'
                });
                if (newPrice !== undefined) {
                    await updateProduct(product._id, { price: parseFloat(newPrice) });
                    showPopup('Success', `Price updated for ${product.name}.`, 'success');
                    loadInventory();
                }
            };

            const outOfStockBtn = document.createElement('button');
            outOfStockBtn.textContent = "Mark Out of Stock";
            outOfStockBtn.classList.add('action-button');
            outOfStockBtn.onclick = async () => {
                await updateProduct(product._id, { quantity: 0 });
                showPopup('Marked Out of Stock', `${product.name} is now unavailable.`, 'warning');
                loadInventory();
            };

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = "Delete";
            deleteBtn.classList.add('action-button');
            deleteBtn.onclick = async () => {
                const confirm = await Swal.fire({
                    title: `Delete ${product.name}?`,
                    text: "This action cannot be undone.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#612999',
                    cancelButtonColor: '#aaa',
                    confirmButtonText: 'Yes, delete it!'
                });
                if (confirm.isConfirmed) {
                    await deleteProduct(product._id);
                    showPopup('Deleted', `${product.name} was deleted.`, 'success');
                    loadInventory();
                }
            };

            actions.append(updateStockBtn, updatePriceBtn, outOfStockBtn, deleteBtn);

            row.innerHTML = `
                <td></td>
                <td>${product.name}</td>
                <td>${product.description || '-'}</td>
                <td>₪${product.price}</td>
                <td>${product.quantity > 0 ? product.quantity : 'Out of Stock'}</td>
                <td></td>
            `;

            row.children[0].appendChild(img);
            row.children[5].appendChild(actions);
            inventoryBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading inventory:", error);
        showPopup('Error', 'Failed to load inventory.', 'error');
    }
}

async function addNewProduct() {
    const name = document.getElementById('new-product-name').value.trim();
    const description = document.getElementById('new-product-category').value.trim();
    const price = parseFloat(document.getElementById('new-product-price').value);
    const quantity = parseInt(document.getElementById('new-product-stock').value);

    if (!name || isNaN(price) || isNaN(quantity)) {
        showPopup("Missing Information", "Please fill in all fields correctly.", 'warning');
        return;
    }

    let imageUrl = productImages[name] || 'images/default.jpg';

    try {
        const response = await fetch('https://webfinalprojserver-production.up.railway.app/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, price, quantity, imageUrl })
        });

        if (response.ok) {
            showPopup('Product Added', `${name} was successfully added.`, 'success');
            document.getElementById('add-product-popup').classList.add('hidden');
            document.getElementById('new-product-name').value = '';
            document.getElementById('new-product-category').value = '';
            document.getElementById('new-product-price').value = '';
            document.getElementById('new-product-stock').value = '';
            loadInventory();
            fetchExistingProducts();
        } else {
            const data = await response.json();
            showPopup('Error', data.message || 'Failed to add product.', 'error');
        }
    } catch (error) {
        console.error("Error adding product:", error);
        showPopup('Error', 'An error occurred while adding the product.', 'error');
    }
}

async function updateProduct(id, updates) {
    try {
        const response = await fetch(`https://webfinalprojserver-production.up.railway.app/api/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const data = await response.json();
            showPopup('Error', data.message || 'Failed to update product.', 'error');
        }
    } catch (error) {
        console.error("Error updating product:", error);
        showPopup('Error', 'An error occurred while updating the product.', 'error');
    }
}

async function deleteProduct(id) {
    try {
        const response = await fetch(`https://webfinalprojserver-production.up.railway.app/api/products/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const data = await response.json();
            showPopup('Error', data.message || 'Failed to delete product.', 'error');
        }
    } catch (error) {
        console.error("Error deleting product:", error);
        showPopup('Error', 'An error occurred while deleting the product.', 'error');
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
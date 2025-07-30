document.addEventListener('DOMContentLoaded', () => loadOrders());

async function loadOrders() {
  const body = document.getElementById('orders-body');
  body.innerHTML = '<tr><td colspan="10">Loading...</td></tr>';

  try {
    const res = await fetch('https://webfinalprojserver-production.up.railway.app/api/orders');
    const orders = await res.json();
    body.innerHTML = '';

    for (const order of orders) {
      const row = document.createElement('tr');
      row.dataset.orderId = order._id;

      const dateTime = order.pickup === 'Prepare Now'
        ? new Date(order.createdAt).toLocaleString('he-IL')
        : order.pickup;

      const itemsHTML = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');
      const totalPrice = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

      const lastMsg = await fetchLastMessage(order._id) || '';

      row.innerHTML = `
        <td>${dateTime}</td>
        <td>${order.fullName}</td>
        <td>${order.phone}</td>
        <td>${order.orderNumber}</td>
        <td>${itemsHTML}</td>
        <td class="order-total">₪${totalPrice.toFixed(2)}</td>
        <td class="order-message">${lastMsg}</td>
        <td></td>
        <td><button class="chat-btn">Send Chat</button></td>
        <td><button class="delete-btn">Delete</button></td>
      `;

      const statusSelect = document.createElement('select');
      ["Preparing","Ready for Pickup","Delivered"].forEach(st => {
        const opt = new Option(st, st, order.status === st);
        statusSelect.add(opt);
      });
      statusSelect.addEventListener('change', () => updateStatus(order._id, statusSelect.value));
      row.children[7].appendChild(statusSelect);

      row.querySelector('.chat-btn').addEventListener('click', () => handleChat(order));
      row.querySelector('.delete-btn').addEventListener('click', () => deleteOrder(order._id));

      body.appendChild(row);
    }
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="10">Error loading orders</td></tr>`;
  }
}

async function fetchLastMessage(orderId) {
  const res = await fetch(`https://webfinalprojserver-production.up.railway.app/api/messages/${orderId}`);
  const msgs = await res.json();
  return msgs.length ? msgs[msgs.length - 1].content : '';
}

async function updateStatus(orderId, newStatus) {
  try {
    await fetch(`https://webfinalprojserver-production.up.railway.app/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({status: newStatus})
    });
    Swal.fire({
      icon: 'success',
      title: 'Status updated!',
      text: `New status: "${newStatus}"`,
      confirmButtonColor: '#612999'
    });
  } catch {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Failed to update status',
      confirmButtonColor: '#612999'
    });
  }
}

async function deleteOrder(orderId) {
  const confirm = await Swal.fire({
    title: 'Are you sure?',
    text: "Do you want to delete this order?",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#aaa'
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`https://webfinalprojserver-production.up.railway.app/api/orders/${orderId}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      Swal.fire({
        icon: 'error',
        title: 'Server error',
        text: 'Could not delete order.',
        confirmButtonColor: '#612999'
      });
      return;
    }

    const row = document.querySelector(`tr[data-order-id="${orderId}"]`);
    if (row) row.remove();

    Swal.fire({
      icon: 'success',
      title: 'Deleted!',
      text: 'Order removed successfully.',
      confirmButtonColor: '#612999'
    });

  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Error deleting order',
      confirmButtonColor: '#612999'
    });
  }
}

async function handleChat(order) {
  const lastMsg = await fetchLastMessage(order._id) || '';

  const { value: message } = await Swal.fire({
    title: 'Message to buyer',
    input: 'text',
    inputValue: lastMsg,
    showCancelButton: true,
    confirmButtonText: 'Send',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#612999'
  });

  if (!message) return;

  const editConfirm = await Swal.fire({
    title: 'Edit order items?',
    text: 'Would you like to update item quantities or prices?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, edit',
    cancelButtonText: 'No',
    confirmButtonColor: '#612999'
  });

  let updatedItems = order.items;
  let newTotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (editConfirm.isConfirmed) {
    const currentStr = updatedItems.map(i => `${i.name}:${i.quantity}`).join(', ');
    const { value: newItemsStr } = await Swal.fire({
      title: 'Update items',
      input: 'text',
      inputLabel: 'Name:quantity',
      inputValue: currentStr,
      showCancelButton: true,
      confirmButtonColor: '#612999'
    });

    if (newItemsStr) {
      updatedItems = newItemsStr.split(',').map(pair => {
        const [name, qty] = pair.split(':').map(s => s.trim());
        const orig = order.items.find(i => i.name === name);
        return { name, price: orig?.price || 0, quantity: parseInt(qty) };
      });

      newTotal = updatedItems.reduce((s, i) => s + i.price * i.quantity, 0);

      await fetch(`https://webfinalprojserver-production.up.railway.app/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems })
      });
    }
  }

  await fetch(`https://webfinalprojserver-production.up.railway.app/api/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId: order._id, sender: 'manager', content: message })
  });

  const row = document.querySelector(`tr[data-order-id="${order._id}"]`);
  if (row) {
    row.querySelector('.order-message').textContent = message;
    row.querySelector('.order-total').textContent = `₪${newTotal.toFixed(2)}`;
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
// public/js/main.js
// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  // Page-specific logic
  if (document.querySelector('#plant-container')) fetchPlants(); // For index.html, shop.html
  if (document.querySelector('#cart-items')) displayCart(); // For cart.html
  if (document.querySelector('#checkout-form')) initCheckout(); // For checkout.html
  if (document.querySelector('#contact-form')) initContactForm(); // For contact.html
  if (document.querySelector('#admin-orders')) fetchAdminData(); // For admin.html
});

// Fetch plants (for index.html, shop.html)
async function fetchPlants(category = 'all', search = '') {
  const container = document.querySelector('#plant-container');
  container.innerHTML = '<p>Loading...</p>';
  try {
    const response = await fetch(`${API_URL}/plants?category=${category}&search=${search}&featured=${window.location.pathname.includes('index')}`);
    if (!response.ok) throw new Error('Failed to fetch plants');
    const { data } = await response.json();
    displayPlants(data.plants);
  } catch (error) {
    container.innerHTML = '<p>Error loading plants. Please try again.</p>';
    console.error('Error fetching plants:', error);
  }
}

// Display plants
function displayPlants(plants) {
  const container = document.querySelector('#plant-container');
  container.innerHTML = '';
  plants.forEach(plant => {
    const plantCard = `
      <div class="plant-card">
        <img src="${plant.image || 'https://via.placeholder.com/150'}" alt="${plant.name}">
        <h3>${plant.name}</h3>
        <p>${plant.description}</p>
        <p>₹${plant.price}</p>
        <button onclick="addToCart('${plant.id}')">Add to Cart</button>
      </div>
    `;
    container.innerHTML += plantCard;
  });
}

// Cart logic
function addToCart(plantId) {
  fetch(`${API_URL}/plants/${plantId}`)
    .then(res => res.json())
    .then(({ data }) => {
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      cart.push(data.plant);
      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      alert('Item added to cart!');
    })
    .catch(error => {
      console.error('Error adding to cart:', error);
      alert('Error adding to cart.');
    });
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartCount = document.querySelector('.cart-count');
  if (cartCount) cartCount.textContent = cart.length;
}

// Display cart (for cart.html)
function displayCart() {
  const cartItems = document.querySelector('#cart-items');
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  cartItems.innerHTML = cart.length ? '' : '<p>Your cart is empty</p>';
  let subtotal = 0;
  cart.forEach(item => {
    subtotal += item.price;
    cartItems.innerHTML += `
      <div class="cart-item">
        <p>${item.name}</p>
        <p>₹${item.price}</p>
        <button onclick="removeFromCart('${item.id}')">Remove</button>
      </div>
    `;
  });
  const shipping = subtotal > 500 ? 0 : 50;
  document.querySelector('#subtotal').textContent = `₹${subtotal}`;
  document.querySelector('#shipping').textContent = `₹${shipping}`;
  document.querySelector('#total').textContent = `₹${subtotal + shipping}`;
}

function removeFromCart(plantId) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  cart = cart.filter(item => item.id !== plantId);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCart();
  updateCartCount();
}

// Checkout form (for checkout.html)
function initCheckout() {
  const form = document.querySelector('#checkout-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderData = {
      customerName: formData.get('firstName') + ' ' + formData.get('lastName'),
      items: cart,
      total: parseFloat(document.querySelector('#total').textContent.replace('₹', '')),
    };
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      const result = await response.json();
      if (result.success) {
        localStorage.removeItem('cart');
        document.querySelector('#order-success').style.display = 'block';
        form.reset();
        updateCartCount();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order.');
    }
  });
}

// Contact form (for contact.html)
function initContactForm() {
  const form = document.querySelector('#contact-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const messageData = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };
    try {
      const response = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      const result = await response.json();
      if (result.success) {
        alert('Message sent successfully!');
        form.reset();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message.');
    }
  });
}

// Admin dashboard data (for admin.html)
async function fetchAdminData() {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in to access admin dashboard');
    window.location.href = '/login.html'; // Create login.html if needed
    return;
  }
  try {
    const [ordersRes, plantsRes] = await Promise.all([
      fetch(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/admin/plants`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const ordersData = await ordersRes.json();
    const plantsData = await plantsRes.json();
    displayAdminOrders(ordersData.orders);
    displayAdminPlants(plantsData.plants);
  } catch (error) {
    console.error('Error fetching admin data:', error);
    alert('Error loading admin data.');
  }
}

function displayAdminOrders(orders) {
  const ordersTable = document.querySelector('#admin-orders');
  ordersTable.innerHTML = `
    <tr>
      <th>Order ID</th>
      <th>Customer</th>
      <th>Items</th>
      <th>Total</th>
      <th>Status</th>
      <th>Date</th>
      <th>Actions</th>
    </tr>
  `;
  orders.forEach(order => {
    ordersTable.innerHTML += `
      <tr>
        <td>${order.id}</td>
        <td>${order.customerName}</td>
        <td>${order.items.map(item => item.name).join(', ')}</td>
        <td>₹${order.total}</td>
        <td>${order.status}</td>
        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
        <td>
          <button onclick="updateOrderStatus('${order.id}', 'Completed')">Complete</button>
          <button onclick="updateOrderStatus('${order.id}', 'Cancelled')">Cancel</button>
        </td>
      </tr>
    `;
  });
}

function displayAdminPlants(plants) {
  const plantsTable = document.querySelector('#admin-plants');
  plantsTable.innerHTML = `
    <tr>
      <th>Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>Stock</th>
    </tr>
  `;
  plants.forEach(plant => {
    plantsTable.innerHTML += `
      <tr>
        <td>${plant.name}</td>
        <td>${plant.category}</td>
        <td>₹${plant.price}</td>
        <td>${plant.stock}</td>
      </tr>
    `;
  });
}

const ctx = document.getElementById('sales-chart').getContext('2d');
new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Aloe Vera', 'Tulsi', 'Money Plant', 'Snake Plant', 'Jasmine'],
    datasets: [{
      label: 'Sales',
      data: [45, 38, 32, 28, 25],
      backgroundColor: '#4caf50',
    }],
  },
});

async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ status }),
    });
    if (response.ok) fetchAdminData();
  } catch (error) {
    console.error('Error updating order:', error);
  }
}
// Base URL for API
const API_URL = 'http://localhost:5000/api';

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('main.js loaded on', window.location.pathname);
    updateCartCount(); // This will now use 'plantNurseryCart'

    // Page-specific logic
    if (document.querySelector('#plant-container')) {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category') || 'all';
        const search = urlParams.get('search') || '';
        fetchPlants(category, search);
    }
    if (document.querySelector('#checkout-form')) initCheckout();
    if (document.querySelector('#contact-form')) initContactForm();
    if (document.querySelector('#admin-orders')) fetchAdminData();
    if (document.querySelector('#order-history')) fetchUserHistory();

    // The cart display logic in main.js is redundant and conflicts with cart.html's dedicated script.
    // It's better to let cart.html handle its own display.
    // if (window.location.pathname.includes('cart.html')) {
    //     console.log('Skipping main.js cart logic on cart.html');
    // } else if (document.querySelector('#cart-items')) {
    //     displayCart();
    // }
});

// Fetch plants (for index.html, shop.html)
async function fetchPlants(category = 'all', search = '') {
    const container = document.querySelector('#plant-container');
    if (!container) return;
    container.innerHTML = '<p>Loading...</p>';
    try {
        const response = await fetch(`${API_URL}/plants?category=${category}&search=${search}&featured=${window.location.pathname.includes('index')}`);
        if (!response.ok) throw new Error('Failed to fetch plants');
        const { data } = await response.json();
        displayPlants(data);
    } catch (error) {
        container.innerHTML = '<p>Error loading plants. Please try again.</p>';
        console.error('Error fetching plants:', error);
    }
}

// Display plants
function displayPlants(plants) {
    const container = document.querySelector('#plant-container');
    if (!container) return;
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

// Cart logic (This addToCart is for pages that fetch from API, like index.html if it uses #plant-container)
// For shop.html, the inline script's addToCart will be used.
function addToCart(plantId) {
    fetch(`${API_URL}/plants/${plantId}`)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch plant');
            return res.json();
        })
        .then(({ data }) => {
            let cart = JSON.parse(localStorage.getItem('plantNurseryCart')) || []; // Use consistent key
            const existingItem = cart.find(item => item.id === data.id);
            if (existingItem) {
                existingItem.quantity = (existingItem.quantity || 1) + 1;
            } else {
                cart.push({ ...data, quantity: 1 });
            }
            localStorage.setItem('plantNurseryCart', JSON.stringify(cart)); // Use consistent key
            updateCartCount();
            alert('Item added to cart!');
        })
        .catch(error => {
            console.error('Error adding to cart:', error);
            alert('Error adding to cart.');
        });
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('plantNurseryCart')) || []; // Use consistent key
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
        console.log('Cart count updated:', totalItems);
    }
}

// Removed displayCart from main.js to avoid conflict with cart.html

function removeFromCart(plantId) {
    let cart = JSON.parse(localStorage.getItem('plantNurseryCart')) || []; // Use consistent key
    cart = cart.filter(item => item.id !== plantId);
    localStorage.setItem('plantNurseryCart', JSON.stringify(cart)); // Use consistent key
    // displayCart(); // This function is now only in cart.html
    updateCartCount();
}

// User history
async function fetchUserHistory() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    const container = document.getElementById('order-history');
    if (!container) return;
    container.innerHTML = '<p>Loading...</p>';
    try {
        const response = await fetch(`${API_URL}/user/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch orders');
        const { orders } = await response.json();
        container.innerHTML = '';
        if (orders.length === 0) {
            container.innerHTML = '<p>No orders yet</p>';
            return;
        }
        orders.forEach(order => {
            container.innerHTML += `
                <div class="order-item">
                    <p>Order ID: ${order.id}</p>
                    <p>Total: ₹${order.total}</p>
                    <p>Status: ${order.status}</p>
                    <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
            `;
        });
    } catch (error) {
        container.innerHTML = '<p>Error loading orders. Please try again.</p>';
        console.error('Error fetching user orders:', error);
    }
}

// Init checkout (for checkout.html)
function initCheckout() {
    const form = document.querySelector('#checkout-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const orderData = Object.fromEntries(formData);
        orderData.items = JSON.parse(localStorage.getItem('plantNurseryCart')) || []; // Use consistent key
        orderData.total = orderData.items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) + (orderData.total > 500 ? 0 : 50);
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const result = await response.json();
            if (result.success) {
                localStorage.removeItem('plantNurseryCart'); // Use consistent key
                alert('Order placed successfully!');
                window.location.href = 'index.html';
            } else {
                alert('Error placing order: ' + result.message);
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
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            message: document.getElementById('message').value,
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
            } else {
                alert('Error sending message: ' + result.message);
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
        window.location.href = 'admin-login.html';
        return;
    }
    try {
        const [ordersRes, plantsRes, usersRes] = await Promise.all([
            fetch(`${API_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/admin/plants`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const ordersData = await ordersRes.json();
        const plantsData = await plantsRes.json();
        const usersData = await usersRes.json();
        displayAdminOrders(ordersData.orders || ordersData.data);
        displayAdminPlants(plantsData.data || plantsData.plants);
        displayAdminUsers(usersData.users || usersData.data);
    } catch (error) {
        console.error('Error fetching admin data:', error);
        alert('Error loading admin data.');
    }
}

function displayAdminOrders(orders) {
    const ordersTable = document.querySelector('#admin-orders');
    if (!ordersTable) return;
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
                <td>${order.items.map(item => item.name || 'Unknown').join(', ')}</td>
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
    if (!plantsTable) return;
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

function displayAdminUsers(users) {
    const usersTable = document.querySelector('#admin-users');
    if (!usersTable) return;
    usersTable.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Is Admin</th>
        </tr>
    `;
    users.forEach(user => {
        usersTable.innerHTML += `
            <tr>
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.isAdmin ? 'Yes' : 'No'}</td>
            </tr>
        `;
    });
}

async function updateOrderStatus(orderId, status) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`${API_URL}/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        const result = await response.json();
        if (result.success) {
            fetchAdminData();
        } else {
            alert(result.message || 'Error updating status');
        }
    } catch (error) {
        console.error('Error updating order:', error);
        alert('Error updating status');
    }
}

const ctx = document.getElementById('sales-chart');
if (ctx) {
    new Chart(ctx.getContext('2d'), {
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
}
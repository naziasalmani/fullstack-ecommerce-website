// data/orders.js - Proper module with functions
let orders = [];

const ordersModule = {
  // Get all orders
  getAll: () => [...orders], // Return copy to prevent mutation
  
  // Add a new order
  add: (order) => {
    orders.push(order);
    return order;
  },
  
  // Find order by ID
  findById: (id) => orders.find(order => order.id === id),
  
  // Update order status
  updateStatus: (id, status) => {
    const order = orders.find(order => order.id === id);
    if (order) {
      order.status = status;
      order.updatedAt = new Date().toISOString();
      return order;
    }
    return null;
  },
  
  // Get orders count
  getCount: () => orders.length,
  
  // Clear all orders (for testing)
  clear: () => {
    orders = [];
  }
};

module.exports = ordersModule;
// utils/helpers.js
// Common helper functions for the plant nursery application

// Generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MNPN-2025-${timestamp}${random}`;
};

// Calculate shipping charges
const calculateShipping = (subtotal) => {
  return subtotal >= 500 ? 0 : 50;
};

// Format price with ₹ symbol
const formatPrice = (price) => {
  return `₹${price}`;
};

// Validate email address
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number
const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d\s-()]{8,15}$/;
  return phoneRegex.test(phone);
};

// Sanitize input (remove scripts)
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Generate random string
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Format date in Indian locale
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Create pagination object
const createPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

module.exports = {
  generateOrderId,
  calculateShipping,
  formatPrice,
  validateEmail,
  validatePhone,
  sanitizeInput,
  generateRandomString,
  formatDate,
  createPagination
};

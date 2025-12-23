// services/database.js
// Database service layer for the plant nursery application

const { Plant, User, Order, Contact, Category, InventoryTransaction } = require('../models');
const { createPagination } = require('../utils/helpers');

class PlantService {
  // Get all plants with filtering and pagination
  static async getPlants(filters = {}, options = {}) {
    try {
      const {
        category,
        search,
        featured,
        inStock,
        minPrice,
        maxPrice,
        page = 1,
        limit = 20,
        sortBy = 'name'
      } = { ...filters, ...options };

      // Build query
      const query = { isActive: true };

      if (category && category !== 'all') {
        query.category = category;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      if (featured === 'true') {
        query.featured = true;
      }

      if (inStock === 'true') {
        query.stock = { $gt: 0 };
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseInt(minPrice);
        if (maxPrice) query.price.$lte = parseInt(maxPrice);
      }

      // Build sort object
      const sortObj = {};
      switch (sortBy) {
        case 'price_asc':
          sortObj.price = 1;
          break;
        case 'price_desc':
          sortObj.price = -1;
          break;
        case 'name':
          sortObj.name = 1;
          break;
        case 'stock':
          sortObj.stock = -1;
          break;
        default:
          sortObj.name = 1;
      }

      // Get total count
      const total = await Plant.countDocuments(query);

      // Get plants with pagination
      const plants = await Plant.find(query)
        .sort(sortObj)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

      return {
        plants,
        pagination: createPagination(total, page, limit)
      };
    } catch (error) {
      throw new Error(`Error fetching plants: ${error.message}`);
    }
  }

  // Get single plant by ID
  static async getPlantById(id) {
    try {
      const plant = await Plant.findById(id).lean();
      if (!plant || !plant.isActive) {
        return null;
      }
      return plant;
    } catch (error) {
      throw new Error(`Error fetching plant: ${error.message}`);
    }
  }

  // Update plant stock
  static async updateStock(plantId, quantity, type = 'adjustment', orderId = null, userId = null) {
    try {
      const plant = await Plant.findById(plantId);
      if (!plant) {
        throw new Error('Plant not found');
      }

      const previousStock = plant.stock;
      const newStock = type === 'sale' ? previousStock - quantity : previousStock + quantity;

      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }

      // Update plant stock
      plant.stock = newStock;
      await plant.save();

      // Create inventory transaction
      await InventoryTransaction.create({
        plant: plantId,
        type,
        quantity,
        previousStock,
        newStock,
        order: orderId,
        user: userId
      });

      return plant;
    } catch (error) {
      throw new Error(`Error updating stock: ${error.message}`);
    }
  }

  // Get low stock plants
  static async getLowStockPlants(threshold = 10) {
    try {
      const plants = await Plant.find({
        isActive: true,
        stock: { $lt: threshold }
      }).sort({ stock: 1 });

      return plants;
    } catch (error) {
      throw new Error(`Error fetching low stock plants: ${error.message}`);
    }
  }
}

class UserService {
  // Create new user
  static async createUser(userData) {
    try {
      const user = new User(userData);
      await user.save();
      
      // Remove password from response
      const userObject = user.toObject();
      delete userObject.password;
      
      return userObject;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('User with this email already exists');
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  // Find user by email
  static async findUserByEmail(email, includePassword = false) {
    try {
      const query = User.findOne({ email: email.toLowerCase(), isActive: true });
      if (includePassword) {
        query.select('+password');
      }
      return await query.exec();
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Find user by ID
  static async findUserById(id) {
    try {
      return await User.findById(id).where({ isActive: true });
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  // Update user profile
  static async updateUser(id, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');

      return user;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }
}

class OrderService {
  // Create new order
  static async createOrder(orderData) {
    try {
      // Validate stock availability
      for (const item of orderData.items) {
        const plant = await Plant.findById(item.plant);
        if (!plant) {
          throw new Error(`Plant with ID ${item.plant} not found`);
        }
        if (plant.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${plant.name}. Available: ${plant.stock}`);
        }
      }

      // Create order
      const order = new Order(orderData);
      order.calculateTotal();
      await order.save();

      // Update plant stock
      for (const item of orderData.items) {
        await PlantService.updateStock(
          item.plant,
          item.quantity,
          'sale',
          order._id
        );
      }

      return order;
    } catch (error) {
      throw new Error(`Error creating order: ${error.message}`);
    }
  }

  // Get order by ID
  static async getOrderById(id) {
    try {
      return await Order.findById(id).populate('items.plant', 'name category');
    } catch (error) {
      throw new Error(`Error fetching order: ${error.message}`);
    }
  }

  // Get orders by user email
  static async getOrdersByUser(email, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      const query = { 'customerInfo.email': email.toLowerCase() };
      
      const total = await Order.countDocuments(query);
      
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('items.plant', 'name category');

      return {
        orders,
        pagination: createPagination(total, page, limit)
      };
    } catch (error) {
      throw new Error(`Error fetching user orders: ${error.message}`);
    }
  }

  // Update order status
  static async updateOrderStatus(id, status, notes = null) {
    try {
      const order = await Order.findById(id);
      if (!order) {
        throw new Error('Order not found');
      }

      order.status = status;
      if (notes) order.notes = notes;
      order.updatedAt = new Date();

      if (status === 'delivered') {
        order.actualDelivery = new Date();
      }

      await order.save();
      return order;
    } catch (error) {
      throw new Error(`Error updating order status: ${error.message}`);
    }
  }

  // Get order statistics
  static async getOrderStats() {
    try {
      const stats = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$total' }
          }
        }
      ]);

      const totalOrders = await Order.countDocuments();
      const totalRevenue = await Order.aggregate([
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]);

      return {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats
      };
    } catch (error) {
      throw new Error(`Error fetching order stats: ${error.message}`);
    }
  }
}

class ContactService {
  // Create contact message
  static async createMessage(messageData) {
    try {
      const contact = new Contact(messageData);
      await contact.save();
      return contact;
    } catch (error) {
      throw new Error(`Error creating contact message: ${error.message}`);
    }
  }

  // Get all messages with pagination
  static async getMessages(options = {}) {
    try {
      const { page = 1, limit = 20, status } = options;
      
      const query = {};
      if (status) query.status = status;
      
      const total = await Contact.countDocuments(query);
      
      const messages = await Contact.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return {
        messages,
        pagination: createPagination(total, page, limit)
      };
    } catch (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }
  }

  // Update message status
  static async updateMessageStatus(id, status, adminId = null) {
    try {
      const contact = await Contact.findById(id);
      if (!contact) {
        throw new Error('Message not found');
      }

      if (status === 'replied') {
        await contact.markAsReplied(adminId);
      } else {
        contact.status = status;
        await contact.save();
      }

      return contact;
    } catch (error) {
      throw new Error(`Error updating message status: ${error.message}`);
    }
  }
}

class CategoryService {
  // Get all categories
  static async getCategories() {
    try {
      const categories = await Category.find({ isActive: true })
        .sort({ sortOrder: 1, name: 1 });

      // Add plant count for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const plantCount = await Plant.countDocuments({
            category: category.name,
            isActive: true
          });
          
          return {
            ...category.toObject(),
            plantCount
          };
        })
      );

      return categoriesWithCount;
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }
}

module.exports = {
  PlantService,
  UserService,
  OrderService,
  ContactService,
  CategoryService
};
// Controller/AdminOrderController.js
import Order from '../Model/OrderModel.js';
import User from '../Model/UserModel.js';
import Product from '../Model/ProductModel.js';
import { sendOrderUpdateEmail } from '../utils/emailService.js';

// Get all orders for admin
export const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    let filter = {};
    
    if (status) {
      filter.orderStatus = status;
    }
    
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } }
      ];
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get orders with user details
    const orders = await Order.find(filter)
      .populate('user', 'Fullname Email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);
    const totalPages = Math.ceil(totalOrders / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalOrders,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Get stats
    const totalOrders = await Order.countDocuments();
    const todayOrders = await Order.countDocuments({ createdAt: { $gte: today } });
    const yesterdayOrders = await Order.countDocuments({ 
      createdAt: { $gte: yesterday, $lt: today } 
    });
    const lastWeekOrders = await Order.countDocuments({ createdAt: { $gte: lastWeek } });
    const lastMonthOrders = await Order.countDocuments({ createdAt: { $gte: lastMonth } });
    
    // Status counts
    const statusCounts = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // Revenue stats
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          minOrderValue: { $min: '$totalAmount' },
          maxOrderValue: { $max: '$totalAmount' }
        }
      }
    ]);

    // Monthly revenue
    const monthlyRevenue = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.status(200).json({
      success: true,
      message: 'Order statistics retrieved',
      data: {
        totalOrders,
        todayOrders,
        yesterdayOrders,
        lastWeekOrders,
        lastMonthOrders,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        revenue: revenueStats[0] || {},
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get order details for admin
export const getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate('user', 'Fullname Email')
      .populate('items.product', 'name brand category images');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order details retrieved',
      data: order
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, notes, trackingNumber } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    // Validate status
    const validStatuses = ['Processing', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(orderId).populate('user', 'Email Fullname');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = status;
    
    // Update tracking number if provided
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    // Update notes
    if (notes) {
      order.orderNotes = order.orderNotes ? 
        `${order.orderNotes}\n[Admin Update - ${new Date().toLocaleString()}]: ${notes}` :
        `[Admin Update - ${new Date().toLocaleString()}]: ${notes}`;
    }

    // Handle status-specific updates
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
      order.paymentStatus = 'Paid'; // Auto-mark as paid when delivered
    } else if (status === 'Cancelled') {
      order.cancelledAt = new Date();
      
      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
      
      // Add cancellation reason if provided
      if (notes) {
        order.cancellationReason = notes;
      }
    }

    await order.save();

    // Send email notification to user about status update
    try {
      await sendOrderUpdateEmail(order, oldStatus, status);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the update if email fails
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete order (soft delete or hard delete based on status)
export const deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { hardDelete = false } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // For delivered or shipped orders, don't allow hard delete
    if (hardDelete && (order.orderStatus === 'Delivered' || order.orderStatus === 'Shipped')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot permanently delete delivered or shipped orders'
      });
    }

    if (hardDelete) {
      // Hard delete - permanently remove
      
      // Restore product stock if order wasn't cancelled
      if (order.orderStatus !== 'Cancelled') {
        for (const item of order.items) {
          await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: item.quantity } }
          );
        }
      }
      
      await Order.findByIdAndDelete(orderId);
      
      res.status(200).json({
        success: true,
        message: 'Order permanently deleted'
      });
    } else {
      // Soft delete - mark as cancelled
      order.orderStatus = 'Cancelled';
      order.cancelledAt = new Date();
      order.cancellationReason = 'Deleted by admin';
      
      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } }
        );
      }
      
      await order.save();
      
      res.status(200).json({
        success: true,
        message: 'Order marked as cancelled',
        data: order
      });
    }
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
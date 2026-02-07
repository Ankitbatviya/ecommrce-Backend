// Controller/AdminProductController.js
import Product from '../Model/ProductModel.js';

// Get all products for admin
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      gender,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    let filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (gender) {
      filter.gender = gender;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get products
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    // Category counts
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
          avgPrice: { $avg: '$price' },
          totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
        }
      }
    ]);

    // Gender distribution
    const genderStats = await Product.aggregate([
      {
        $group: {
          _id: '$gender',
          count: { $sum: 1 }
        }
      }
    ]);

    // Top rated products
    const topRated = await Product.find()
      .sort({ rating: -1, reviewsCount: -1 })
      .limit(10)
      .select('name rating reviewsCount price');

    // Low stock products (< 10 items)
    const lowStock = await Product.find({ stock: { $lt: 10 } })
      .sort({ stock: 1 })
      .select('name stock price');

    res.status(200).json({
      success: true,
      message: 'Product statistics retrieved',
      data: {
        categoryStats,
        genderStats,
        topRated,
        lowStock,
        totalProducts: await Product.countDocuments(),
        totalStockValue: await Product.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: { $multiply: ['$price', '$stock'] } }
            }
          }
        ])
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create product (Admin only)
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      brand,
      category,
      gender,
      price,
      discount,
      sizes,
      colors,
      stock,
      images,
      author
    } = req.body;

    // Validation
    if (!name || !description || !brand || !category || !gender || !price || !stock || !images || !author) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }

    // Validate category
    const validCategories = ["Apparel", "Electronics", "Footwear", "Accessories"];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }

    const product = new Product({
      name,
      description,
      brand,
      category,
      gender,
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : 0,
      sizes: sizes || [],
      colors: colors || [],
      stock: parseInt(stock),
      images,
      author,
      isActive: true
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update product (Admin only)
export const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;

    // Find product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product
    Object.keys(updateData).forEach(key => {
      if (key in product) {
        product[key] = updateData[key];
      }
    });

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { permanent = false } = req.body;

    if (permanent) {
      // Hard delete
      await Product.findByIdAndDelete(productId);
      
      res.status(200).json({
        success: true,
        message: 'Product permanently deleted'
      });
    } else {
      // Soft delete - deactivate
      await Product.findByIdAndUpdate(productId, { isActive: false });
      
      res.status(200).json({
        success: true,
        message: 'Product deactivated'
      });
    }
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
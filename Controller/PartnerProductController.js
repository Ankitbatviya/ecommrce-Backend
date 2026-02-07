// Controller/PartnerProductController.js
import Product from '../Model/ProductModel.js';

// Get all products for partner (only their products)
export const getPartnerProducts = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const products = await Product.find({ author: userId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Partner products retrieved successfully',
      data: products
    });
  } catch (error) {
    console.error('Get partner products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create product (Partner only)
export const createPartnerProduct = async (req, res) => {
  try {
    const userId = req.user.userId;
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
      images
    } = req.body;

    // Validation
    if (!name || !description || !brand || !category || !gender || !price || !stock || !images) {
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

    // Create product with partner as author
    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      brand: brand.trim(),
      category,
      gender,
      price: parseFloat(price),
      discount: discount ? parseFloat(discount) : 0,
      sizes: Array.isArray(sizes) ? sizes : [],
      colors: Array.isArray(colors) ? colors : [],
      stock: parseInt(stock),
      images: Array.isArray(images) ? images : [images],
      author: userId,
      isActive: true
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create partner product error:', error);
    
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

// Update product (Partner only - only their products)
export const updatePartnerProduct = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.id;
    const updateData = req.body;

    // Find product and check if it belongs to the partner
    const product = await Product.findOne({ _id: productId, author: userId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to edit it'
      });
    }

    // Update product
    Object.keys(updateData).forEach(key => {
      if (key in product && updateData[key] !== undefined) {
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
    console.error('Update partner product error:', error);
    
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

// Delete product (Partner only - only their products)
export const deletePartnerProduct = async (req, res) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.id;

    // Find product and check if it belongs to the partner
    const product = await Product.findOne({ _id: productId, author: userId });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found or you do not have permission to delete it'
      });
    }

    // Delete product
    await Product.findByIdAndDelete(productId);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete partner product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
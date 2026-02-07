import Product from '../Model/ProductModel.js';

export const showProduct = async (req, res) => {
    try {
        const allProducts = await Product.find({ isActive: true });

        res.status(200).json({
            success: true,
            message: 'All products found',
            data: allProducts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

export const ShowOneProduct = async (req, res) => {
    try {
        const Id = req.params.id;
        const product = await Product.findById(Id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product found',
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Add Product Controller
export const addProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const userEmail = req.user.email;

        // Extract product data from request body
        const { 
            name, 
            description, 
            brand, 
            category, 
            gender, 
            price, 
            discount = 0, 
            sizes = [], 
            colors = [], 
            stock, 
            images 
        } = req.body;

        // Validate required fields
        if (!name || !description || !brand || !category || !gender || !price || !stock || !images || images.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be filled'
            });
        }

        // Validate description length
        if (description.length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Description must be at least 20 characters long'
            });
        }

        // Validate price
        if (price < 0) {
            return res.status(400).json({
                success: false,
                message: 'Price cannot be negative'
            });
        }

        // Validate stock
        if (stock < 0) {
            return res.status(400).json({
                success: false,
                message: 'Stock cannot be negative'
            });
        }

        // Validate discount
        if (discount < 0 || discount > 90) {
            return res.status(400).json({
                success: false,
                message: 'Discount must be between 0 and 90 percent'
            });
        }

        // Validate category
        const validCategories = ["Apparel", "Electronics", "Footwear", "Accessories"];
        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Validate gender
        const validGenders = ["Male", "Female", "Unisex"];
        if (!validGenders.includes(gender)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid gender'
            });
        }

        // Validate sizes based on category
        const CATEGORY_SIZES = {
            Apparel: ["XS", "S", "M", "L", "XL", "XXL"],
            Footwear: ["6", "7", "8", "9", "10", "11", "12"],
            Accessories: ["S", "M", "L"],
            Electronics: []
        };

        const allowedSizes = CATEGORY_SIZES[category] || [];
        if (sizes && sizes.length > 0) {
            const invalidSizes = sizes.filter(size => !allowedSizes.includes(size));
            if (invalidSizes.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid sizes for ${category} category: ${invalidSizes.join(', ')}. Allowed sizes: ${allowedSizes.join(', ')}`
                });
            }
        }

        // Create new product
        const newProduct = new Product({
            name: name.trim(),
            description: description.trim(),
            brand: brand.trim(),
            category,
            gender,
            price: parseFloat(price),
            discount: parseFloat(discount),
            sizes: sizes.map(s => s.trim()).filter(s => s),
            colors: colors.map(c => c.trim()).filter(c => c),
            stock: parseInt(stock, 10),
            images: images.map(img => img.trim()).filter(img => img),
            author: userEmail // Using email as author identifier
        });

        // Save product to database
        await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Product added successfully',
            data: newProduct
        });
    } catch (error) {
        console.error('Add product error:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Product with this name already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// Get partner products
export const getPartnerProducts = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        const products = await Product.find({ author: userEmail }).sort({ createdAt: -1 });

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
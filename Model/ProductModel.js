import mongoose from "mongoose";

/**
 * Category → Allowed Sizes Mapping
 * This avoids stupid cases like Electronics having size "M"
 */
const CATEGORY_SIZES = {
  Apparel: ["XS", "S", "M", "L", "XL", "XXL"],
  Footwear: ["6", "7", "8", "9", "10", "11", "12"],
  Accessories: ["S", "M", "L"],
  Electronics: [] // No sizes for electronics
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      minlength: 20
    },

    brand: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      required: true,
      enum: ["Apparel", "Electronics", "Footwear", "Accessories"]
    },

    gender: {
      type: String,
      required: true,
      enum: ["Male", "Female", "Unisex"]
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 90
    },

    sizes: {
      type: [String],
      validate: {
        validator: function (value) {
          const allowedSizes = CATEGORY_SIZES[this.category] || [];
          return value.every(size => allowedSizes.includes(size));
        },
        message: function (props) {
          return `Invalid size(s) ${props.value} for category ${this.category}`;
        }
      }
    },

    colors: {
      type: [String],
      default: []
    },

    stock: {
      type: Number,
      required: true,
      min: 0
    },

    images: {
      type: [String],
      required: true,
      validate: {
        validator: v => v.length > 0,
        message: "At least one product image is required"
      }
    },

    author: {
      type: String,
      required: true
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },

    reviewsCount: {
      type: Number,
      default: 0
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;

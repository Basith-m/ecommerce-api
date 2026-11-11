const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    salePrice: {
      type: Number,
      default: null,
      validate: {
        validator: function (value) {
          return value === null || value === undefined || value <= this.price;
        },
        message: 'Sale price must be less than or equal to regular price',
      },
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Archived'],
      default: 'Active',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound index for search and category filtering performance
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1, status: 1 });

module.exports = mongoose.model('Product', productSchema);
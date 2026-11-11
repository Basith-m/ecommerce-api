const Product = require('../models/Product.model');
const Category = require('../models/Category.model');
const ApiError = require('../utils/apiError');
const ApiResponse = require('../utils/apiResponse');
const { getAllDescendantCategoryIds } = require('../utils/category.util');

// 1. Create Product (Admin)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, sku, description, price, salePrice, stock, category, status } = req.body;

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return next(new ApiError(404, 'Category not found.'));
    }

    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      return next(new ApiError(409, `Product with SKU '${sku}' already exists.`));
    }

    const product = await Product.create({
      name,
      sku,
      description,
      price,
      salePrice,
      stock,
      category,
      status: status || 'Active',
    });

    return ApiResponse.success(res, 201, 'Product created successfully', { product });
  } catch (error) {
    next(error);
  }
};

// 2. Get Products (Public / Customer listing with search, filters, subcategories, sort, pagination)
exports.getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      status,
      sortBy = 'createdAt',
      order = 'desc',
      page = 1,
      limit = 10,
    } = req.query;

    const query = {};

    // Customer can only see Active products by default, unless requested otherwise
    query.status = status || 'Active';

    // 1. Full-text search on name & description
    if (search) {
      query.$text = { $search: search };
    }

    // 2. Deep Category Filtering (Parent Category includes all its children)
    if (category) {
      const descendantCategoryIds = await getAllDescendantCategoryIds(category);
      query.category = { $in: [category, ...descendantCategoryIds] };
    }

    // 3. Price filtering
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
    const sortOptions = { [sortBy]: sortOrder };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query),
    ]);

    return ApiResponse.success(
      res,
      200,
      'Products retrieved successfully',
      { products },
      {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      }
    );
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Product by ID (Public)
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate('category', 'name slug');
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    return ApiResponse.success(res, 200, 'Product details retrieved successfully', { product });
  } catch (error) {
    next(error);
  }
};

// 4. Update Product (Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.body.category) {
      const categoryExists = await Category.findById(req.body.category);
      if (!categoryExists) {
        return next(new ApiError(404, 'Category not found.'));
      }
    }

    if (req.body.sku) {
      const existingSku = await Product.findOne({ sku: req.body.sku, _id: { $ne: id } });
      if (existingSku) {
        return next(new ApiError(409, `Product with SKU '${req.body.sku}' already exists.`));
      }
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    }).populate('category', 'name slug');

    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    return ApiResponse.success(res, 200, 'Product updated successfully', { product });
  } catch (error) {
    next(error);
  }
};

// 5. Delete Product (Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return next(new ApiError(404, 'Product not found.'));
    }

    return ApiResponse.success(res, 200, 'Product deleted successfully');
  } catch (error) {
    next(error);
  }
};
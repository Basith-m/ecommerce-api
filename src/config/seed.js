require('dotenv').config();
const connectDB = require('./db');
const User = require('../models/User.model');
const Category = require('../models/Category.model');
const Product = require('../models/Product.model');
const Order = require('../models/Order.model');
const ROLES = require('../constants/roles');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for seeding...');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('Cleared existing data.');

    // 1. Create Default Users (1 Admin, 1 Customer)
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: 'Password123!',
      role: ROLES.ADMIN,
    });

    const customer = await User.create({
      name: 'Jane Customer',
      email: 'customer@example.com',
      password: 'Password123!',
      role: ROLES.CUSTOMER,
    });

    console.log('Users created:');
    console.log('  Admin:    admin@example.com / Password123!');
    console.log('  Customer: customer@example.com / Password123!');

    // 2. Create Multi-level Category Tree from prompt
    // Electronics -> Mobiles -> Android Phones -> Samsung, OnePlus
    // Electronics -> Computers -> Laptops
    const electronics = await Category.create({ name: 'Electronics', slug: 'electronics' });

    const mobiles = await Category.create({
      name: 'Mobiles',
      slug: 'mobiles',
      parentId: electronics._id,
    });

    const computers = await Category.create({
      name: 'Computers',
      slug: 'computers',
      parentId: electronics._id,
    });

    const android = await Category.create({
      name: 'Android Phones',
      slug: 'android-phones',
      parentId: mobiles._id,
    });

    const iphones = await Category.create({
      name: 'iPhones',
      slug: 'iphones',
      parentId: mobiles._id,
    });

    const laptops = await Category.create({
      name: 'Laptops',
      slug: 'laptops',
      parentId: computers._id,
    });

    const samsung = await Category.create({
      name: 'Samsung',
      slug: 'samsung',
      parentId: android._id,
    });

    const oneplus = await Category.create({
      name: 'OnePlus',
      slug: 'oneplus',
      parentId: android._id,
    });

    console.log('Categories created with multi-level nesting.');

    // 3. Create Sample Products
    await Product.create([
      {
        name: 'Samsung Galaxy S24 Ultra',
        sku: 'SAM-S24-U',
        description: 'Flagship AI smartphone from Samsung',
        price: 1299.99,
        salePrice: 1199.99,
        stock: 25,
        category: samsung._id,
        status: 'Active',
      },
      {
        name: 'OnePlus 12 5G',
        sku: '1P-12-5G',
        description: 'Smooth beyond belief flagship phone',
        price: 799.99,
        stock: 40,
        category: oneplus._id,
        status: 'Active',
      },
      {
        name: 'iPhone 15 Pro Max',
        sku: 'APL-IP15PM',
        description: 'Titanium design with A17 Pro chip',
        price: 1199.99,
        stock: 15,
        category: iphones._id,
        status: 'Active',
      },
      {
        name: 'MacBook Pro 16 M3 Max',
        sku: 'APL-MBP16',
        description: 'Powerhouse workstation laptop for pros',
        price: 3499.99,
        salePrice: 3299.99,
        stock: 10,
        category: laptops._id,
        status: 'Active',
      },
    ]);

    console.log('Sample products seeded successfully.');
    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
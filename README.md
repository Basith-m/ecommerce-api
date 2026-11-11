# E-Commerce REST API

A production-ready E-commerce REST API backend built with **Node.js, Express.js, MongoDB/Mongoose**, and **JWT authentication**.

---

## 🌟 Key Features

1. **User Management & RBAC:**
   - Role-Based Access Control (`Admin` and `Customer`).
   - Secure password hashing using `bcryptjs` (salt rounds: 10).
   - Admin user status toggling (`isActive: true/false`).
   - Token-based stateless authentication (`jsonwebtoken`).

2. **Multi-Level Category Hierarchy:**
   - Supports unlimited recursive nesting without depth limits.
   - **$O(N)$ Tree Builder API** returning complete nested parent-child trees.
   - **Circular Dependency Guard** prevents setting descendants as parents or self-referencing nodes.
   - Deep Subcategory traversal for product queries.

3. **Product Management:**
   - Complete Admin CRUD with unique SKU validation.
   - Customer product catalog with:
     - Full-text search (name & description).
     - **Parent category lookup** (automatically includes products in all descendant categories).
     - Price range filtering (`minPrice`, `maxPrice`).
     - Dynamic sorting and pagination.

4. **Order Management & ACID Concurrency:**
   - **MongoDB Multi-Document ACID Transactions** for checkout.
   - Stock reduction with race-condition prevention.
   - Automatic backend price calculation (never trusting client prices).
   - Stock restoration if order is cancelled.
   - Status workflow: `Pending` → `Confirmed` → `Processing` → `Shipped` → `Delivered` / `Cancelled`.

5. **Security & Production Best Practices:**
   - Centralized error handling with structured responses.
   - Request payload validation using `Joi`.
   - Security headers with `helmet`.
   - IP Rate Limiting via `express-rate-limit`.
   - Structured logging with `morgan` and `winston`.
   - Docker containerization.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+ or v20 LTS)
- MongoDB instance (ReplicaSet enabled for Transactions, such as MongoDB Atlas or local replica)

### 1. Installation
```bash
git clone <YOUR_REPO_URL>
cd ecommerce-api
npm install
const Joi = require('joi');

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  sku: Joi.string().trim().uppercase().min(3).max(30).required(),
  description: Joi.string().trim().required(),
  price: Joi.number().positive().precision(2).required(),
  salePrice: Joi.number().positive().precision(2).allow(null).optional(),
  stock: Joi.number().integer().min(0).required(),
  category: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({ 'string.pattern.base': 'Invalid category ID' }),
  status: Joi.string().valid('Draft', 'Active', 'Archived').optional(),
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  sku: Joi.string().trim().uppercase().min(3).max(30).optional(),
  description: Joi.string().trim().optional(),
  price: Joi.number().positive().precision(2).optional(),
  salePrice: Joi.number().positive().precision(2).allow(null).optional(),
  stock: Joi.number().integer().min(0).optional(),
  category: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .optional()
    .messages({ 'string.pattern.base': 'Invalid category ID' }),
  status: Joi.string().valid('Draft', 'Active', 'Archived').optional(),
}).min(1);

module.exports = {
  createProductSchema,
  updateProductSchema,
};
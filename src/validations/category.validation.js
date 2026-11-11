const Joi = require('joi');

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  parentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({ 'string.pattern.base': 'Invalid parentId format' })
    .optional(),
  isActive: Joi.boolean().optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  parentId: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .allow(null, '')
    .messages({ 'string.pattern.base': 'Invalid parentId format' })
    .optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

module.exports = {
  createCategorySchema,
  updateCategorySchema,
};
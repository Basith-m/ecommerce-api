const Joi = require('joi');
const ROLES = require('../constants/roles');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid(ROLES.ADMIN, ROLES.CUSTOMER).optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const userStatusSchema = Joi.object({
  isActive: Joi.boolean().required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  userStatusSchema,
};
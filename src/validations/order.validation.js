const Joi = require('joi');
const ORDER_STATUS = require('../constants/orderStatus');

const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.string()
          .regex(/^[0-9a-fA-F]{24}$/)
          .required()
          .messages({ 'string.pattern.base': 'Invalid productId format' }),
        quantity: Joi.number().integer().min(1).required(),
      })
    )
    .min(1)
    .required(),
  shippingAddress: Joi.object({
    street: Joi.string().trim().required(),
    city: Joi.string().trim().required(),
    state: Joi.string().trim().required(),
    zipCode: Joi.string().trim().required(),
    country: Joi.string().trim().required(),
  }).required(),
});

const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(ORDER_STATUS))
    .required(),
});

module.exports = {
  createOrderSchema,
  updateOrderStatusSchema,
};
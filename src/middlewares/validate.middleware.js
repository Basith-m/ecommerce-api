const ApiError = require('../utils/apiError');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message).join(', ');
    return next(new ApiError(400, errorMessages));
  }
  next();
};

module.exports = validate;
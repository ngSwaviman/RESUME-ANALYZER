const { validationResult } = require('express-validator');

/** Convert express-validator results into a single 422 JSON response. */
const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg,
  }));

  return res.status(422).json({
    success: false,
    message: errors[0]?.message || 'Validation failed',
    errors,
  });
};

module.exports = { validate };

const ApiError = require('../utils/ApiError');

/**
 * Role based access control.
 * Usage: router.post('/', protect, authorize('recruiter', 'admin'), handler)
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) {
    return next(
      ApiError.forbidden(`This action is restricted to: ${roles.join(', ')}. Your role is ${req.user.role}.`)
    );
  }
  return next();
};

module.exports = { authorize };

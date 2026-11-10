// middleware/validate.js
// ---------------------------------------------------------
// express-validator input validation rules and error formatter.
// ---------------------------------------------------------

const { validationResult, body } = require('express-validator');
const { sendError } = require('../utils/responseHelpers');

// Middleware to check validation results and respond if errors exist
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return sendError(res, 'Validation failed. Please check your inputs.', 400, formattedErrors);
  }
  next();
};

// Registration validation rules
const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 60 })
    .withMessage('Name cannot exceed 60 characters'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

// Login validation rules
const loginRules = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// Profile update validation rules
const profileRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 60 })
    .withMessage('Name cannot exceed 60 characters'),
  body('profile.age')
    .optional({ nullable: true })
    .isInt({ min: 10, max: 120 })
    .withMessage('Age must be between 10 and 120 years'),
  body('profile.sex')
    .optional({ nullable: true })
    .isIn(['male', 'female'])
    .withMessage('Sex must be either male or female'),
  body('profile.heightCm')
    .optional({ nullable: true })
    .isFloat({ min: 100, max: 250 })
    .withMessage('Height must be between 100 and 250 cm'),
  body('profile.weightKg')
    .optional({ nullable: true })
    .isFloat({ min: 20, max: 300 })
    .withMessage('Weight must be between 20 and 300 kg'),
  body('profile.activityLevel')
    .optional()
    .isIn(['sedentary', 'light', 'moderate', 'active', 'extra_active'])
    .withMessage('Invalid activity level'),
  body('profile.goal')
    .optional()
    .isIn(['lose', 'maintain', 'gain'])
    .withMessage('Goal must be lose, maintain, or gain'),
  body('calorieGoal')
    .optional({ nullable: true })
    .isInt({ min: 800, max: 6000 })
    .withMessage('Calorie goal must be between 800 and 6000 kcal'),
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  profileRules,
};


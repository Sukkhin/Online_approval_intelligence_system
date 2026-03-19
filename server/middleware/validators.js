const { body, validationResult } = require('express-validator');
const validRoles = ['user', 'admin', 'principal'];

// Middleware to check for validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: errors.array()[0].msg,
            errors: errors.array()
        });
    }
    next();
};

// Registration validation
const validateRegister = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Login validation
const validateLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address'),
    body('password')
        .notEmpty().withMessage('Password is required')
];

// Create request validation
const validateRequest = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required'),
    body('priority')
        .optional()
        .isIn(['Low', 'Medium', 'High', 'Urgent']).withMessage('Invalid priority value'),
    body('category')
        .optional()
        .isIn(['Leave', 'On Duty (OD)', 'Internship', 'Event Permission', 'Hackathon', 'Project Work', 'Medical Leave', 'Fee Concession', 'Sick Leave', 'Other'])
        .withMessage('Invalid category value')
];

// Create user validation (admin adding a user)
const validateCreateUser = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please enter a valid email address'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
        .optional()
        .isIn(validRoles).withMessage('Invalid role value')
];

// Role update validation
const validateRoleUpdate = [
    body('role')
        .notEmpty().withMessage('Role is required')
        .isIn(validRoles).withMessage('Invalid role. Must be user, admin, or principal')
];

// Comment validation
const validateComment = [
    body('text')
        .trim()
        .notEmpty().withMessage('Comment text is required')
        .isLength({ max: 2000 }).withMessage('Comment must be under 2000 characters')
];

// Review action validation
const validateReview = [
    body('action')
        .notEmpty().withMessage('Action is required')
        .isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
    body('comment')
        .optional()
        .trim()
];

module.exports = {
    validate,
    validateRegister,
    validateLogin,
    validateRequest,
    validateCreateUser,
    validateRoleUpdate,
    validateComment,
    validateReview
};

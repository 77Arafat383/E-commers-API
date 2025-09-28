const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Validation middleware
exports.validateRequest = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};

// ObjectId validation
exports.validateObjectId = (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid ID format' });
    }
    next();
};

// User registration validation
exports.validateRegistration = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('email')
        .isEmail()
        .withMessage('Please provide a valid email address'),
    body('address')
        .isLength({ min: 5 })
        .withMessage('Address must be at least 5 characters long'),
    body('phone')
        .matches(/^\+?[1-9]\d{1,14}$/)
        .withMessage('Please provide a valid phone number'),
    body('role')
        .optional()
        .isIn(['user', 'admin'])
        .withMessage('Role must be either user or admin')
];

// User login validation
exports.validateLogin = [
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    body().custom((value) => {
        if (!value.username && !value.email) {
            throw new Error('Either username or email is required');
        }
        return true;
    })
];

// Product creation validation
exports.validateProductCreation = [
    body('name')
        .isLength({ min: 1, max: 100 })
        .withMessage('Product name must be between 1 and 100 characters'),
    body('description')
        .isLength({ min: 10, max: 500 })
        .withMessage('Description must be between 10 and 500 characters'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('Price must be a positive number'),
    body('stock')
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),
    body('category')
        .isLength({ min: 1, max: 50 })
        .withMessage('Category must be between 1 and 50 characters'),
    body('imageUrl')
        .isURL()
        .withMessage('Please provide a valid image URL'),
    body('discount')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Discount must be between 0 and 100')
];

// Order creation validation
exports.validateOrderCreation = [
    body('products')
        .isArray({ min: 1 })
        .withMessage('At least one product is required'),
    body('products.*.product')
        .isMongoId()
        .withMessage('Invalid product ID'),
    body('products.*.quantity')
        .isInt({ min: 1 })
        .withMessage('Quantity must be at least 1'),
    body('shippingAddress')
        .isLength({ min: 5 })
        .withMessage('Shipping address must be at least 5 characters long'),
    body('paymentMethod')
        .isLength({ min: 1 })
        .withMessage('Payment method is required')
];

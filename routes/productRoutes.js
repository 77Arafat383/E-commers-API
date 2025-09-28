const express = require('express');
const router = express.Router();
const { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct, rateAndReviewProduct, getProductReviews, updateProductStock } = require('../controllers/productController');
const { authenticate, admin } = require('../middleware/authMiddleware');
const { validateProductCreation, validateObjectId, validateRequest } = require('../middleware/validationMiddleware');

// Create a new product (admin only)
router.post('/', authenticate, admin, validateProductCreation, validateRequest, createProduct);
// Get all products with advanced filtering, searching, and sorting
router.get('/', getAllProducts);
// Get a single product by ID
router.get('/:id', validateObjectId, getProductById);
// Update a product by ID (admin only)
router.put('/:id', authenticate, admin, validateObjectId, updateProduct);
// Delete a product by ID (admin only)
router.delete('/:id', authenticate, admin, validateObjectId, deleteProduct);
// Rate and review a product (combined functionality)
router.post('/:id/review', authenticate, validateObjectId, rateAndReviewProduct);
// Get all reviews for a product
router.get('/:id/reviews', validateObjectId, getProductReviews);
// Update product stock (admin only)
router.put('/:id/stock', authenticate, admin, validateObjectId, updateProductStock);
module.exports = router;

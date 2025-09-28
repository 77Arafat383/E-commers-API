const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrderById, updateOrderStatus, requestOrderDeletion, reviewDeletionRequest, getDeletionRequests } = require('../controllers/orderController');
const { authenticate, admin } = require('../middleware/authMiddleware');
const { validateOrderCreation, validateObjectId, validateRequest } = require('../middleware/validationMiddleware');

// Create a new order (authenticated users)
router.post('/', authenticate, validateOrderCreation, validateRequest, createOrder);
// Get all orders for the logged-in user
router.get('/my-orders', authenticate, getUserOrders);
// Get a single order by ID (authenticated users)
router.get('/:id', authenticate, validateObjectId, getOrderById);
// Update order status (admin only)
router.put('/:id/status', authenticate, admin, validateObjectId, updateOrderStatus);
// Request order deletion (users can request, admin decides)
router.post('/:id/request-deletion', authenticate, validateObjectId, requestOrderDeletion);
// Admin review deletion request (approve/reject)
router.put('/:id/review-deletion', authenticate, admin, validateObjectId, reviewDeletionRequest);
// Get all pending deletion requests (admin only)
router.get('/admin/deletion-requests', authenticate, admin, getDeletionRequests);
module.exports = router;

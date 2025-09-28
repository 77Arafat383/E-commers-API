const mongoose = require('mongoose');
const Order = require('../models/order');
const Product = require('../models/Product');


// Create a new order
exports.createOrder = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { products, shippingAddress, paymentMethod } = req.body;
        if (!products || products.length === 0) {
            await session.abortTransaction();
            return res.status(400).json({ message: 'No products in the order' });
        }
        
        let totalPrice = 0;
        const productUpdates = [];
        
        // First pass: validate all products and calculate total
        for (const item of products) {
            const product = await Product.findById(item.product).session(session);
            if (!product) {
                await session.abortTransaction();
                return res.status(404).json({ message: `Product not found: ${item.product}` });
            }
            if (product.stock < item.quantity) {
                await session.abortTransaction();
                return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
            }
            totalPrice += product.price * item.quantity;
            productUpdates.push({ product, quantity: item.quantity });
        }
        
        // Second pass: update stock within transaction
        for (const { product, quantity } of productUpdates) {
            product.stock -= quantity;
            await product.save({ session });
        }
        
        const order = new Order({
            user: req.user.userId,
            products,
            totalPrice,
            shippingAddress,
            paymentMethod
        });
        
        await order.save({ session });
        await session.commitTransaction();
        
        res.status(201).json({ message: 'Order created successfully', order });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Server error', error: error.message });
    } finally {
        session.endSession();
    }
};

// Get all orders for the logged-in user
exports.getUserOrders = async (req, res) => {
    try {
    const orders = await Order.find({ user: req.user.userId }).populate('products.product', 'name price');
    res.status(200).json(orders);
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
    try {
    const order = await Order.findById(req.params.id).populate('products.product', 'name price');
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    if (order.user.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    res.status(200).json(order);
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
    }
    const { status, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();
    res.status(200).json({ message: 'Order status updated successfully', order });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Request order deletion (user can request, admin decides)
exports.requestOrderDeletion = async (req, res) => {
    try {
        const { reason } = req.body;
        const orderId = req.params.id;
        const userId = req.user.userId;

        // Validation
        if (!reason || reason.trim().length < 10) {
            return res.status(400).json({ message: 'Reason must be at least 10 characters long' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns the order or is admin
        if (order.user.toString() !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Check if order can be deleted
        if (order.status === 'delivered') {
            return res.status(400).json({ message: 'Cannot delete delivered orders' });
        }

        if (order.status === 'deletion_requested') {
            return res.status(400).json({ message: 'Deletion already requested for this order' });
        }

        // Update order with deletion request
        order.status = 'deletion_requested';
        order.deletionRequest = {
            requestedBy: userId,
            reason: reason.trim(),
            requestedAt: new Date(),
            status: 'pending'
        };

        await order.save();

        res.status(200).json({ 
            message: 'Deletion request submitted successfully. Admin will review your request.',
            order: {
                _id: order._id,
                status: order.status,
                deletionRequest: order.deletionRequest
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Admin approve/reject deletion request
exports.reviewDeletionRequest = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied, admin only' });
        }

        const { action, adminNotes } = req.body; // action: 'approve' or 'reject'
        const orderId = req.params.id;
        const adminId = req.user.userId;

        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Action must be either approve or reject' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'deletion_requested') {
            return res.status(400).json({ message: 'No deletion request found for this order' });
        }

        if (action === 'approve') {
            // Restore stock before deleting
            for (const item of order.products) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            // Delete the order
            await Order.findByIdAndDelete(orderId);
            
            res.status(200).json({ 
                message: 'Order deletion approved and order has been deleted',
                deletedOrderId: orderId
            });
        } else {
            // Reject deletion request
            order.status = order.deletionRequest.requestedBy.toString() === order.user.toString() ? 'pending' : order.status;
            order.deletionRequest.status = 'rejected';
            order.deletionRequest.reviewedBy = adminId;
            order.deletionRequest.reviewedAt = new Date();
            order.deletionRequest.adminNotes = adminNotes || '';

            await order.save();

            res.status(200).json({ 
                message: 'Deletion request rejected',
                order: {
                    _id: order._id,
                    status: order.status,
                    deletionRequest: order.deletionRequest
                }
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all deletion requests (admin only)
exports.getDeletionRequests = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied, admin only' });
        }

        const orders = await Order.find({ 
            status: 'deletion_requested',
            'deletionRequest.status': 'pending'
        })
        .populate('user', 'username email')
        .populate('deletionRequest.requestedBy', 'username email')
        .populate('products.product', 'name price')
        .sort({ 'deletionRequest.requestedAt': -1 });

        res.status(200).json({
            message: 'Deletion requests retrieved successfully',
            requests: orders.map(order => ({
                _id: order._id,
                user: order.user,
                totalPrice: order.totalPrice,
                status: order.status,
                products: order.products,
                deletionRequest: order.deletionRequest,
                createdAt: order.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};







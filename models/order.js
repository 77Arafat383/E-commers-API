const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['pending', 'shipped', 'delivered', 'cancelled', 'deletion_requested'],
        default: 'pending'
    },
    shippingAddress: {
        type: String,
        required: true
    },  
    paymentMethod: {
        type: String,
        required: true
    },  
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    deletionRequest: {
        requestedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: {
            type: String,
            maxlength: 500
        },
        requestedAt: {
            type: Date
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: {
            type: Date
        },
        adminNotes: {
            type: String,
            maxlength: 500
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

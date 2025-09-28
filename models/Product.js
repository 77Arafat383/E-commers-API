const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
    },
    price: {
    type: Number,
    required: true,
    min: 0
    },
    description: {
    type: String,
    required: true
    },
    category: {
    type: String,
    required: true
    }, 
    stock: {
    type: Number,
    required: true,
    min: 0 
    },
    imageUrl: {
    type: String,
    required: true,
    match: [/^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/, 'Please fill a valid URL']
    },
    ratings: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
    },
    numOfReviews: {
    type: Number, 
    default: 0
    },
    discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
    },
    reviews: [
    {
        user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
        },
        name: {
        type: String,
        required: true
        },
        rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5
        },
        comment: {
        type: String,
        required: true
        }
    }
    ]

}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);  

const Product = require('../models/Product');

// Create a new product
exports.createProduct = async (req, res) => {
    try {
    const { name, description, price, stock, category, imageUrl, discount } = req.body;
    const product = new Product({ name, description, price, stock, category, imageUrl, discount });
    await product.save();
    res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all products with advanced filtering, searching, and sorting
exports.getAllProducts = async (req, res) => {
    try {
        const { 
            search,           // Search by name or category
            minPrice,         // Filter by minimum price
            maxPrice,         // Filter by maximum price
            category,         // Filter by category
            sortBy,           // Sort by: 'price', 'ratings', 'name', 'createdAt'
            sortOrder,        // Sort order: 'asc' or 'desc'
            limit,            // Limit number of results
            page,             // Page number for pagination
            topRated,         // Get only top-rated products (true/false)
            discounted,       // Get only discounted products (true/false)
            minRating         // Filter by minimum rating
        } = req.query;

        // Build the filter object
        let filter = {};

        // Search functionality (name or category)
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        // Price range filtering
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Category filtering
        if (category) {
            filter.category = category;
        }

        // Rating filtering
        if (minRating) {
            filter.ratings = { $gte: Number(minRating) };
        }

        // Top-rated products filter
        if (topRated === 'true') {
            filter.ratings = { $gte: 4.0 }; // Products with 4+ stars
        }

        // Discounted products filter
        if (discounted === 'true') {
            filter.discount = { $gt: 0 }; // Products with discount > 0
        }

        // Build sort object
        let sort = {};
        if (sortBy) {
            const order = sortOrder === 'desc' ? -1 : 1;
            sort[sortBy] = order;
        } else {
            sort = { createdAt: -1 }; // Default sort by newest first
        }

        // Pagination
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 10;
        const skip = (pageNum - 1) * limitNum;

        // Execute query with pagination
        const products = await Product.find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        // Get total count for pagination info
        const totalProducts = await Product.countDocuments(filter);
        const totalPages = Math.ceil(totalProducts / limitNum);

        // Response with pagination info
        res.status(200).json({
            products,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalProducts,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            },
            filters: {
                search,
                minPrice,
                maxPrice,
                category,
                sortBy,
                sortOrder,
                topRated,
                discounted,
                minRating
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get a single product by ID
exports.getProductById = async (req, res) => {
    try {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update a product by ID
exports.updateProduct = async (req, res) => {
    try {
    const updates = req.body;
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product updated successfully', product });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a product by ID
exports.deleteProduct = async (req, res) => {
    try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Rate and review a product (combined functionality)
exports.rateAndReviewProduct = async (req, res) => {
    try {
        const { rating, comment, name } = req.body;
        const productId = req.params.id;
        const userId = req.user.userId;

        // Validation
        if (!rating || rating < 0 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 0 and 5' });
        }

        if (!comment || comment.trim().length < 10) {
            return res.status(400).json({ message: 'Comment must be at least 10 characters long' });
        }

        // Find the product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if user has already reviewed this product
        const existingReviewIndex = product.reviews.findIndex(
            review => review.user.toString() === userId
        );

        if (existingReviewIndex !== -1) {
            // Update existing review
            const existingReview = product.reviews[existingReviewIndex];
            const oldRating = existingReview.rating;
            
            // Update the review
            product.reviews[existingReviewIndex] = {
                user: userId,
                name: name || req.user.username || 'Anonymous',
                rating: rating,
                comment: comment.trim()
            };

            // Recalculate average rating
            const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
            product.ratings = totalRating / product.reviews.length;

            await product.save();
            return res.status(200).json({ 
                message: 'Review updated successfully', 
                product,
                review: product.reviews[existingReviewIndex]
            });
        } else {
            // Add new review
            const newReview = {
                user: userId,
                name: name || req.user.username || 'Anonymous',
                rating: rating,
                comment: comment.trim()
            };

            product.reviews.push(newReview);

            // Recalculate average rating
            const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
            product.ratings = totalRating / product.reviews.length;
            product.numOfReviews = product.reviews.length;

            await product.save();
            return res.status(201).json({ 
                message: 'Review added successfully', 
                product,
                review: newReview
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all reviews for a product
exports.getProductReviews = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .select('reviews ratings numOfReviews')
            .populate('reviews.user', 'username email');
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({
            productId: req.params.id,
            averageRating: product.ratings,
            totalReviews: product.numOfReviews,
            reviews: product.reviews
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


// Update product stock (admin only) - API endpoint
exports.updateProductStock = async (req, res) => {
    try {
        const { stock } = req.body;
        const productId = req.params.id;

        // Validation
        if (stock === undefined || stock < 0) {
            return res.status(400).json({ message: 'Stock must be a non-negative number' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        product.stock = stock;
        await product.save();

        res.status(200).json({ 
            message: 'Stock updated successfully', 
            product: {
                _id: product._id,
                name: product.name,
                stock: product.stock
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update stock after an order (internal function)
exports.updateStock = async (productId, quantity) => {
    try {
    const product = await Product.findById(productId);
    if (product) {
        product.stock = Math.max(0, product.stock - quantity);
        await product.save();
    }
    } catch (error) {
    console.error('Failed to update stock:', error);
    }
};







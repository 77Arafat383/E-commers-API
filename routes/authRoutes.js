const express = require('express');

const router = express.Router();

const { register, login, getProfile, updateProfile, deleteAccount, } = require('../controllers/authController');
const { validateRegistration, validateLogin, validateRequest } = require('../middleware/validationMiddleware');
const { authenticate} = require('../middleware/authMiddleware');

// Register route
router.post('/register', validateRegistration, validateRequest, register);
// Login route
router.post('/login', validateLogin, validateRequest, login);
// Get user profile
router.get('/profile', authenticate, getProfile);
// Update user profile
router.put('/profile', authenticate, updateProfile);
// Delete user account
router.delete('/delete', authenticate, deleteAccount);

module.exports = router;

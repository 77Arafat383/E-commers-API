const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password, email, address, phone, role } = req.body;  
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword, email, address, phone, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login a user
exports.login = async (req, res) => {
    try {
    const { username,email, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        
        return res.status(400).json({ message: 'Invalid credentials' }); 
           
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });    
        
    }
};

// Get user profile
exports.getProfile = async (req, res) => {
    try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update user profile

exports.updateProfile = async (req, res) => {
    try {
    const updates = req.body;
    if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, 10);
    }
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true }).select('-password');    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
    }
    catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete user account
exports.deleteAccount = async (req, res) => {
    try {
    const user = await User.findByIdAndDelete(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User account deleted successfully' });
    } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
    }
};





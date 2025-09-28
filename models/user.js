const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username:{
    type: String,
    required: true,
    unique: true
  },
  password:{
    type: String,
    required: true
  },
    email:{
    type: String,
    required: true,
    unique: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  address:{
    type: String,
    required: true
    },
  phone:{
    type: String,
    required: true,
    match: [/^\+?[0-9]\d{1,13}$/, 'Please enter a valid international phone number (E.164 format, e.g., +1234567890)']
  },
  role:{  
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);    
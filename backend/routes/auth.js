const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'hostel_gatepass_secret_2026';

// POST /api/signup
router.post('/signup', async (req, res) => {
  try {
    const { registerNo, fullName, username, email, password } = req.body;

    if (!registerNo || !fullName || !username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ registerNo }, { username }, { email }] });
    if (existing) {
      if (existing.registerNo === registerNo) return res.status(400).json({ message: 'Register number already exists' });
      if (existing.username === username) return res.status(400).json({ message: 'Username already taken' });
      if (existing.email === email) return res.status(400).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = new User({ registerNo, fullName, username, email, password: hashed });
    await user.save();

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, fullName, username, email, registerNo } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { registerNo, username, password } = req.body;

    if (!password || (!registerNo && !username)) {
      return res.status(400).json({ message: 'Register No/Username and password are required' });
    }

    const user = await User.findOne(registerNo ? { registerNo } : { username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, fullName: user.fullName, username: user.username, email: user.email, registerNo: user.registerNo } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

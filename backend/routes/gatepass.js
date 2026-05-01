const express = require('express');
const router = express.Router();
const GatePass = require('../models/GatePass');
const authMiddleware = require('../middleware/auth');

const DEFAULT_APPROVERS = [
  { level: 'First Level Approver', name: 'PRIYANKA A', role: 'Employee', status: 'Approved', date: '', time: '', remark: '' },
  { level: 'Second Level Approver', name: 'NATARAJAN V', role: 'Employee', status: 'Approved', date: '', time: '', remark: '' },
  { level: 'Third Level Approver', name: 'RAJESHWAR R', role: 'Employee', status: 'Approved', date: '', time: '', remark: '' }
];

// GET /api/gatepass - get current user's latest gatepass
router.get('/gatepass', authMiddleware, async (req, res) => {
  try {
    const gatepass = await GatePass.findOne({ userId: req.user.userId }).sort({ updatedAt: -1 });
    res.json(gatepass || null);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/gatepass/all - get all gatepasses (recent list)
router.get('/gatepass/all', authMiddleware, async (req, res) => {
  try {
    const passes = await GatePass.find({}).sort({ updatedAt: -1 }).limit(10).populate('userId', 'fullName');
    res.json(passes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/gatepass - create new gatepass
router.post('/gatepass', authMiddleware, async (req, res) => {
  try {
    const { name, departure, departureTime, returnDate, returnTime, hostel, floor, roomNo, reason, remark, approvers } = req.body;

    const now = new Date();
    const approversData = (approvers || DEFAULT_APPROVERS).map(a => ({
      ...a,
      date: a.date || now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: a.time || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      status: 'Approved'
    }));

    const gp = new GatePass({
      userId: req.user.userId,
      name, departure, departureTime, returnDate, returnTime,
      hostel, floor, roomNo, reason, remark,
      status: 'Approved',
      approvers: approversData
    });

    await gp.save();
    res.status(201).json(gp);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/gatepass/:id - update gatepass
router.put('/gatepass/:id', authMiddleware, async (req, res) => {
  try {
    const { name, departure, departureTime, returnDate, returnTime, hostel, floor, roomNo, reason, remark, approvers } = req.body;

    const gp = await GatePass.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { name, departure, departureTime, returnDate, returnTime, hostel, floor, roomNo, reason, remark, approvers },
      { new: true }
    );

    if (!gp) return res.status(404).json({ message: 'Gate pass not found' });
    res.json(gp);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

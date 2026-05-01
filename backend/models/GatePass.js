const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  departure: { type: String },
  departureTime: { type: String },
  returnDate: { type: String },
  returnTime: { type: String },
  hostel: { type: String },
  floor: { type: String },
  roomNo: { type: String },
  reason: { type: String },
  remark: { type: String },
  status: { type: String, default: 'Approved' },
  approvers: [{
    level: String,
    name: String,
    role: String,
    status: { type: String, default: 'Approved' },
    date: String,
    time: String,
    remark: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('GatePass', gatePassSchema);
// server.js
// just add space or comment
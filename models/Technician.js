const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  specialization: String,
  experience: String,
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 },
  completedJobs: Number,
  cities: [String],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Technician', technicianSchema);


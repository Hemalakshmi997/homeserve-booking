const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  basePrice: Number,
  category: String,
  isActive: { type: Boolean, default: true },
  subServices: [
    {
      name: String,
      description: String,
      price: Number,
      duration: String,
      isActive: { type: Boolean, default: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);

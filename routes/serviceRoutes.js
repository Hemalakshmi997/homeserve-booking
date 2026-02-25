const express = require('express');
const router = express.Router();
const Service = require('../models/Service');


router.get('/', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch services' });
  }
 });

 module.exports = router;

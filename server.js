// ============================================
// COMPLETE BACKEND CODE - server.js
// Copy this ENTIRE file and replace your backend server.js
// ============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors({
  origin: '*', // Allow all origins for now - update after testing
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGODB_URI = process.env.MONGODB_URI || 'your-mongodb-connection-string';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((error) => {
  console.error('❌ MongoDB Connection Error:', error);
  process.exit(1);
});

// ============================================
// SCHEMAS
// ============================================

// Service Schema
const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  price: { type: String, required: true },
  category: { type: String, required: true },
  borderColor: { type: String, default: '#667eea' },
  subservices: [{
    name: { type: String, required: true },
    description: { type: String },
    price: { type: String },
    duration: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Service = mongoose.model('Service', serviceSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  service: { type: String, required: true },
  subservice: { type: String },
  date: { type: Date, required: true },
  address: { type: String, required: true },
  notes: { type: String },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// ============================================
// ROUTES
// ============================================

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: '🏠 Home Fix Smart Services API',
    status: 'running',
    endpoints: {
      health: '/health',
      services: '/api/services',
      bookings: '/api/bookings',
      seed: '/api/seed'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    mongooseState: mongoose.connection.readyState
  });
});

// ============================================
// SERVICES ROUTES
// ============================================

// GET all services
app.get('/api/services', async (req, res) => {
  try {
    console.log('📥 Fetching all services...');
    const services = await Service.find().sort({ createdAt: -1 });
    
    console.log(`✅ Found ${services.length} services`);
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('❌ Error fetching services:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching services',
      error: error.message 
    });
  }
});

// GET single service
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('❌ Error fetching service:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching service',
      error: error.message 
    });
  }
});

// CREATE service
app.post('/api/services', async (req, res) => {
  try {
    const service = new Service(req.body);
    await service.save();
    
    console.log('✅ Service created:', service.title);
    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('❌ Error creating service:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error creating service',
      error: error.message 
    });
  }
});

// UPDATE service
app.put('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('❌ Error updating service:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error updating service',
      error: error.message 
    });
  }
});

// DELETE service
app.delete('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting service:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error deleting service',
      error: error.message 
    });
  }
});

// ============================================
// BOOKINGS ROUTES
// ============================================

// GET all bookings
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    console.error('❌ Error fetching bookings:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching bookings',
      error: error.message 
    });
  }
});

// CREATE booking
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = new Booking(req.body);
    await booking.save();
    
    console.log('✅ Booking created:', booking._id);
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error creating booking',
      error: error.message 
    });
  }
});

// ============================================
// SEED DATABASE
// ============================================
app.post('/api/seed', async (req, res) => {
  try {
    // Clear existing services
    await Service.deleteMany({});
    
    // Sample services data
    const services = [
      {
        title: 'Plumbing Services',
        description: 'Professional leak detection, fixing, and pipe maintenance for your home',
        icon: '🔧',
        price: '₹499 onwards',
        category: 'plumbing',
        borderColor: '#3b82f6',
        subservices: [
          { name: 'Leak Detection & Repair', description: 'Identify and fix water leaks quickly', price: '₹499', duration: '1-2 hours' },
          { name: 'Pipe Installation', description: 'New pipe fitting and installation', price: '₹799', duration: '2-3 hours' },
          { name: 'Drain Cleaning', description: 'Clear blocked drains and pipes', price: '₹599', duration: '1 hour' },
          { name: 'Tap & Faucet Repair', description: 'Fix dripping taps and faucets', price: '₹399', duration: '30 mins' },
          { name: 'Toilet Repair', description: 'Fix toilet flush and tank issues', price: '₹699', duration: '1-2 hours' }
        ]
      },
      {
        title: 'Electrical Services',
        description: 'Complete electrical repairs and safety inspections by certified electricians',
        icon: '⚡',
        price: '₹599 onwards',
        category: 'electrical',
        borderColor: '#8b5cf6',
        subservices: [
          { name: 'Wiring Repair', description: 'Fix faulty electrical wiring safely', price: '₹699', duration: '2-3 hours' },
          { name: 'Switch & Socket Installation', description: 'Install new switches and outlets', price: '₹599', duration: '1 hour' },
          { name: 'Fan Installation', description: 'Install ceiling and wall fans', price: '₹799', duration: '1-2 hours' },
          { name: 'Light Fixture Installation', description: 'Install lights and chandeliers', price: '₹899', duration: '1-2 hours' },
          { name: 'Safety Inspection', description: 'Complete electrical safety check', price: '₹1299', duration: '2-3 hours' },
          { name: 'MCB & Fuse Box Repair', description: 'Fix circuit breakers and fuse boxes', price: '₹999', duration: '1-2 hours' }
        ]
      },
      {
        title: 'Cleaning Services',
        description: 'Deep cleaning solutions using eco-friendly products',
        icon: '🧹',
        price: '₹399 onwards',
        category: 'cleaning',
        borderColor: '#10b981',
        subservices: [
          { name: 'Deep Home Cleaning', description: 'Thorough cleaning of entire home', price: '₹1299', duration: '4-5 hours' },
          { name: 'Kitchen Deep Cleaning', description: 'Complete kitchen sanitization', price: '₹799', duration: '2-3 hours' },
          { name: 'Bathroom Cleaning', description: 'Deep bathroom cleaning & sanitization', price: '₹599', duration: '1-2 hours' },
          { name: 'Sofa Cleaning', description: 'Professional sofa and upholstery cleaning', price: '₹899', duration: '2 hours' },
          { name: 'Carpet Cleaning', description: 'Deep carpet cleaning service', price: '₹699', duration: '1-2 hours' }
        ]
      },
      {
        title: 'Painting Services',
        description: 'Interior and exterior painting with premium quality Asian Paints',
        icon: '🎨',
        price: '₹899 onwards',
        category: 'painting',
        borderColor: '#ef4444',
        subservices: [
          { name: 'Interior Wall Painting', description: 'Paint interior walls professionally', price: '₹899', duration: '1 day' },
          { name: 'Exterior Painting', description: 'Weather-resistant exterior painting', price: '₹1299', duration: '2 days' },
          { name: 'Texture Painting', description: 'Decorative texture painting', price: '₹1599', duration: '2 days' },
          { name: 'Wood Polishing', description: 'Polish doors and furniture', price: '₹799', duration: '1 day' },
          { name: 'Waterproofing', description: 'Wall waterproofing treatment', price: '₹1999', duration: '1-2 days' }
        ]
      },
      {
        title: 'Carpentry Services',
        description: 'Custom carpentry work, furniture assembly, and expert repairs',
        icon: '🔨',
        price: '₹699 onwards',
        category: 'carpentry',
        borderColor: '#f59e0b',
        subservices: [
          { name: 'Furniture Assembly', description: 'Assemble new furniture items', price: '₹699', duration: '1-2 hours' },
          { name: 'Door Repair', description: 'Fix door hinges and locks', price: '₹799', duration: '1-2 hours' },
          { name: 'Cabinet Installation', description: 'Install kitchen and storage cabinets', price: '₹1299', duration: '3-4 hours' },
          { name: 'Window Repair', description: 'Fix window frames and fittings', price: '₹899', duration: '1-2 hours' },
          { name: 'Custom Furniture', description: 'Build custom furniture pieces', price: '₹2999', duration: '3-5 days' }
        ]
      },
      {
        title: 'AC Repair & Maintenance',
        description: 'Air conditioning installation, repair, and regular maintenance service',
        icon: '❄️',
        price: '₹499 onwards',
        category: 'ac',
        borderColor: '#06b6d4',
        subservices: [
          { name: 'AC Service & Cleaning', description: 'Complete AC cleaning and gas check', price: '₹499', duration: '1 hour' },
          { name: 'AC Installation', description: 'Install new air conditioner', price: '₹1999', duration: '2-3 hours' },
          { name: 'AC Repair', description: 'Fix cooling and other AC issues', price: '₹799', duration: '1-2 hours' },
          { name: 'AC Gas Refilling', description: 'Refill refrigerant gas', price: '₹1299', duration: '1 hour' },
          { name: 'AC Uninstallation', description: 'Safely remove AC unit', price: '₹699', duration: '1 hour' }
        ]
      }
    ];
    
    // Insert services
    const insertedServices = await Service.insertMany(services);
    
    console.log('✅ Database seeded successfully');
    res.json({
      success: true,
      message: 'Database seeded successfully with 6 services',
      count: insertedServices.length,
      data: insertedServices
    });
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error seeding database',
      error: error.message 
    });
  }
});

// ============================================
// 404 HANDLER
// ============================================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api/services',
      'GET /api/services/:id',
      'POST /api/services',
      'PUT /api/services/:id',
      'DELETE /api/services/:id',
      'GET /api/bookings',
      'POST /api/bookings',
      'POST /api/seed'
    ]
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ==========================================
  🚀 Home Fix Smart Services API
  ==========================================
  🌍 Server running on port ${PORT}
  📊 Environment: ${process.env.NODE_ENV || 'development'}
  💾 Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}
  🔗 URL: http://localhost:${PORT}
  ==========================================
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

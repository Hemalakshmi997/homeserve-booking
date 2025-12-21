// ============================================
// COMPLETE BACKEND CODE - server.js
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
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// MONGODB CONNECTION
// ============================================
const MONGODB_URI = process.env.MONGODB_URI;

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

// ============================================
// ROOT ROUTE
// ============================================
app.get('/', (req, res) => {
  res.json({ 
    message: '🏠 Home Fix Smart Services API',
    status: 'running',
    endpoints: {
      health: '/health',
      services: '/api/services',
      seed: '/api/seed'
    }
  });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// ============================================
// GET ALL SERVICES
// ============================================
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

// ============================================
// SEED DATABASE - THIS IS THE IMPORTANT ONE!
// ============================================
app.post('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding database...');
    
    // Clear existing services
    await Service.deleteMany({});
    console.log('🗑️ Cleared old services');
    
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
          { name: 'Tap & Faucet Repair', description: 'Fix dripping taps and faucets', price: '₹399', duration: '30 mins' }
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
          { name: 'Switch Installation', description: 'Install new switches and outlets', price: '₹599', duration: '1 hour' },
          { name: 'Fan Installation', description: 'Install ceiling and wall fans', price: '₹799', duration: '1-2 hours' },
          { name: 'Safety Inspection', description: 'Complete electrical safety check', price: '₹1299', duration: '2-3 hours' }
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
          { name: 'Kitchen Cleaning', description: 'Complete kitchen sanitization', price: '₹799', duration: '2-3 hours' },
          { name: 'Bathroom Cleaning', description: 'Deep bathroom cleaning', price: '₹599', duration: '1-2 hours' }
        ]
      },
      {
        title: 'Painting Services',
        description: 'Interior and exterior painting with premium quality paints',
        icon: '🎨',
        price: '₹899 onwards',
        category: 'painting',
        borderColor: '#ef4444',
        subservices: [
          { name: 'Interior Painting', description: 'Paint interior walls professionally', price: '₹899', duration: '1 day' },
          { name: 'Exterior Painting', description: 'Weather-resistant exterior painting', price: '₹1299', duration: '2 days' },
          { name: 'Texture Painting', description: 'Decorative texture painting', price: '₹1599', duration: '2 days' }
        ]
      },
      {
        title: 'Carpentry Services',
        description: 'Custom carpentry work, furniture assembly, and repairs',
        icon: '🔨',
        price: '₹699 onwards',
        category: 'carpentry',
        borderColor: '#f59e0b',
        subservices: [
          { name: 'Furniture Assembly', description: 'Assemble new furniture items', price: '₹699', duration: '1-2 hours' },
          { name: 'Door Repair', description: 'Fix door hinges and locks', price: '₹799', duration: '1-2 hours' },
          { name: 'Custom Furniture', description: 'Build custom furniture pieces', price: '₹2999', duration: '3-5 days' }
        ]
      },
      {
        title: 'AC Repair & Maintenance',
        description: 'Air conditioning installation, repair, and maintenance',
        icon: '❄️',
        price: '₹499 onwards',
        category: 'ac',
        borderColor: '#06b6d4',
        subservices: [
          { name: 'AC Service', description: 'Complete AC cleaning and gas check', price: '₹499', duration: '1 hour' },
          { name: 'AC Installation', description: 'Install new air conditioner', price: '₹1999', duration: '2-3 hours' },
          { name: 'AC Repair', description: 'Fix cooling and other issues', price: '₹799', duration: '1-2 hours' }
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
  ==========================================
  `);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down gracefully');
  process.exit(0);
});

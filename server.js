// ==============================================
// HOME FIX SMART SERVICES - COMPLETE BACKEND
// One Call, Total Home Care
// ==============================================

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// ==============================================
// CORS CONFIGURATION - FIXED FOR BROWSER!
// ==============================================

const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Additional CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ==============================================
// MIDDLEWARE
// ==============================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================================
// MONGODB CONNECTION
// ==============================================

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

// ==============================================
// DATABASE MODELS
// ==============================================

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
    price: { type: String, required: true },
    duration: { type: String }
  }],
  createdAt: { type: Date, default: Date.now }
});

const Service = mongoose.model('Service', serviceSchema);

// Technician Schema
const technicianSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  specialization: { type: String, required: true },
  experience: { type: String },
  rating: { type: Number, default: 5 },
  photo: { type: String, default: '👨‍🔧' },
  available: { type: Boolean, default: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  createdAt: { type: Date, default: Date.now }
});

const Technician = mongoose.model('Technician', technicianSchema);

// Admin Schema
const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

// Booking Schema
const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String, required: true },
  address: { type: String, required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  subservice: { type: String },
  technicianId: { type: mongoose.Schema.Types.ObjectId, ref: 'Technician' },
  preferredDateTime: { type: Date },
  status: { type: String, default: 'pending' },
  price: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// ==============================================
// ROOT ROUTE
// ==============================================

app.get('/', (req, res) => {
  res.json({
    message: '🏠 Home Fix Smart Services API',
    tagline: 'One Call, Total Home Care',
    status: 'running',
    endpoints: {
      health: '/health',
      services: '/api/services',
      technicians: '/api/technicians',
      seed: '/api/seed',
      adminLogin: '/api/admin/login'
    }
  });
});

// ==============================================
// HEALTH CHECK
// ==============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'
  });
});

// ==============================================
// GET ALL SERVICES
// ==============================================

app.get('/api/services', async (req, res) => {
  try {
    console.log('📋 Fetching all services...');
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

// ==============================================
// GET SINGLE SERVICE
// ==============================================

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

// ==============================================
// GET ALL TECHNICIANS
// ==============================================

app.get('/api/technicians', async (req, res) => {
  try {
    console.log('👷 Fetching all technicians...');
    const technicians = await Technician.find().populate('serviceId');
    
    console.log(`✅ Found ${technicians.length} technicians`);
    
    res.json({
      success: true,
      count: technicians.length,
      data: technicians
    });
  } catch (error) {
    console.error('❌ Error fetching technicians:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching technicians',
      error: error.message
    });
  }
});

// ==============================================
// ADMIN LOGIN
// ==============================================

app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    let admin = await Admin.findOne({ email });
    
    // Create default admin if doesn't exist
    if (!admin) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      admin = await Admin.create({
        email: 'admin@hfix.in',
        password: hashedPassword,
        name: 'Admin'
      });
    }
    
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET || 'hfix_secret_key_2025',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      admin: {
        email: admin.email,
        name: admin.name
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login error',
      error: error.message
    });
  }
});

// ==============================================
// CREATE BOOKING
// ==============================================

app.post('/api/bookings', async (req, res) => {
  try {
    const bookingId = 'HF' + Date.now().toString().slice(-8);
    
    const booking = await Booking.create({
      ...req.body,
      bookingId
    });
    
    console.log('✅ Booking created:', bookingId);
    
    res.json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
    
  } catch (error) {
    console.error('❌ Booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating booking',
      error: error.message
    });
  }
});

// ==============================================
// SEED DATABASE
// ==============================================

app.get('/api/seed', async (req, res) => {
  try {
    console.log('🌱 Seeding database...');
    
    // Clear existing data
    await Service.deleteMany({});
    await Technician.deleteMany({});
    
    console.log('🗑️  Cleared old services and technicians');
    
    // Services data
    const servicesData = [
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
        borderColor: '#f59e0b',
        subservices: [
          { name: 'Wiring Repair', description: 'Fix faulty electrical wiring safely', price: '₹699', duration: '2-3 hours' },
          { name: 'Switch Installation', description: 'Install new switches and outlets', price: '₹599', duration: '1 hour' },
          { name: 'Fan Installation', description: 'Install ceiling and wall fans', price: '₹799', duration: '1-2 hours' },
          { name: 'Light Fixture Installation', description: 'Install lights and chandeliers', price: '₹899', duration: '1-2 hours' },
          { name: 'Safety Inspection', description: 'Complete electrical safety check', price: '₹1299', duration: '2-3 hours' },
          { name: 'MCB Repair', description: 'Fix circuit breakers and fuse boxes', price: '₹999', duration: '1-2 hours' }
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
          { name: 'Sofa Cleaning', description: 'Professional sofa cleaning', price: '₹899', duration: '2 hours' },
          { name: 'Carpet Cleaning', description: 'Deep carpet cleaning service', price: '₹699', duration: '1-2 hours' }
        ]
      }
    ];
    
    const createdServices = await Service.insertMany(servicesData);
    console.log(`✅ Created ${createdServices.length} services`);
    
    // Indian Technicians data
    const techniciansData = [
      {
        name: 'Rajesh Kumar Sharma',
        email: 'rajesh.sharma@hfix.in',
        phone: '+91 98765 43210',
        specialization: 'Senior Plumbing Expert',
        experience: '15 years experience in residential & commercial plumbing',
        rating: 5,
        photo: '👨‍🔧',
        available: true,
        serviceId: createdServices[0]._id
      },
      {
        name: 'Amit Singh Chauhan',
        email: 'amit.chauhan@hfix.in',
        phone: '+91 98765 43211',
        specialization: 'Licensed Electrician',
        experience: '12 years experience in electrical installations',
        rating: 5,
        photo: '⚡',
        available: true,
        serviceId: createdServices[1]._id
      },
      {
        name: 'Priya Patel',
        email: 'priya.patel@hfix.in',
        phone: '+91 98765 43212',
        specialization: 'Professional Painter',
        experience: '10 years experience in interior & exterior painting',
        rating: 5,
        photo: '👩‍🎨',
        available: true,
        serviceId: createdServices[2]._id
      },
      {
        name: 'Vikram Singh Rathore',
        email: 'vikram.rathore@hfix.in',
        phone: '+91 98765 43213',
        specialization: 'Master Carpenter',
        experience: '18 years experience in custom woodwork',
        rating: 5,
        photo: '🔨',
        available: true,
        serviceId: createdServices[3]._id
      },
      {
        name: 'Sunita Reddy',
        email: 'sunita.reddy@hfix.in',
        phone: '+91 98765 43214',
        specialization: 'AC Repair Specialist',
        experience: '11 years experience in AC installation & repair',
        rating: 5,
        photo: '❄️',
        available: true,
        serviceId: createdServices[4]._id
      },
      {
        name: 'Manish Gupta',
        email: 'manish.gupta@hfix.in',
        phone: '+91 98765 43215',
        specialization: 'Cleaning Professional',
        experience: '8 years experience in deep cleaning services',
        rating: 4,
        photo: '🧹',
        available: true,
        serviceId: createdServices[5]._id
      },
      {
        name: 'Deepak Verma',
        email: 'deepak.verma@hfix.in',
        phone: '+91 98765 43216',
        specialization: 'Plumbing Specialist',
        experience: '14 years experience in leak detection',
        rating: 5,
        photo: '🔧',
        available: true,
        serviceId: createdServices[0]._id
      },
      {
        name: 'Anita Deshmukh',
        email: 'anita.deshmukh@hfix.in',
        phone: '+91 98765 43217',
        specialization: 'Senior Electrician',
        experience: '13 years experience in electrical systems',
        rating: 5,
        photo: '⚡',
        available: false,
        serviceId: createdServices[1]._id
      },
      {
        name: 'Mohammed Arif Khan',
        email: 'arif.khan@hfix.in',
        phone: '+91 98765 43218',
        specialization: 'Painting Contractor',
        experience: '16 years experience in premium painting',
        rating: 5,
        photo: '🎨',
        available: true,
        serviceId: createdServices[2]._id
      },
      {
        name: 'Kavita Iyer',
        email: 'kavita.iyer@hfix.in',
        phone: '+91 98765 43219',
        specialization: 'Carpentry Expert',
        experience: '9 years experience in furniture making',
        rating: 4,
        photo: '🪚',
        available: true,
        serviceId: createdServices[3]._id
      }
    ];
    
    const createdTechnicians = await Technician.insertMany(techniciansData);
    console.log(`✅ Created ${createdTechnicians.length} technicians`);
    
    res.json({
      success: true,
      message: 'Database seeded successfully with Indian technicians',
      servicesCreated: createdServices.length,
      techniciansCreated: createdTechnicians.length,
      data: {
        services: createdServices,
        technicians: createdTechnicians
      }
    });
    
  } catch (error) {
    console.error('❌ Seed error:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding database',
      error: error.message
    });
  }
});

// ==============================================
// 404 HANDLER
// ==============================================

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
      'GET /api/technicians',
      'GET /api/seed',
      'POST /api/admin/login',
      'POST /api/bookings'
    ]
  });
});

// ==============================================
// START SERVER
// ==============================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
===========================================
🏠 Home Fix Smart Services API
One Call, Total Home Care
===========================================
🌐 Server running on port ${PORT}
📦 Environment: ${process.env.NODE_ENV || 'development'}
🗄️  Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⏳ Connecting...'}
===========================================
  `);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

process.on('SIGTERM', () => {
  console.log('🔥 Shutting down gracefully');
  process.exit(0);
});

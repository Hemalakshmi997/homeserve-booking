require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'homefix-secret-2025';
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ MongoDB Connected Successfully');
  initializeData();
}).catch(err => console.error('❌ MongoDB Error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  createdAt: { type: Date, default: Date.now }
});

const serviceSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  basePrice: Number,
  category: String,
  isActive: { type: Boolean, default: true },
  subServices: [{
    name: String,
    description: String,
    price: Number,
    duration: String,
    isActive: { type: Boolean, default: true }
  }],
  createdAt: { type: Date, default: Date.now }
});

const technicianSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  specialization: String,
  experience: String,
  completedJobs: Number,
  rating: { type: Number, default: 5 },
  isAvailable: { type: Boolean, default: true }
});

const bookingSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  serviceId: mongoose.Schema.Types.ObjectId,
  subServiceId: String,
  technicianId: mongoose.Schema.Types.ObjectId,
  date: String,
  time: String,
  address: String,
  notes: String,
  city: String,
  area: String,
  totalAmount: Number,
  price: Number,
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Service = mongoose.model('Service', serviceSchema);
const Technician = mongoose.model('Technician', technicianSchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Auth middleware
const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'HOME FIX SMART SERVICES API',
    tagline: 'ONE CALL TOTAL HOME CARE',
    status: 'running',
    endpoints: {
      auth: '/api/auth/register, /api/auth/login',
      services: '/api/services',
      technicians: '/api/technicians',
      bookings: '/api/bookings'
    }
  });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password || !phone || !address) {
      return res.status(400).json({ message: 'All fields required' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, address });
    await user.save();
    
    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Registration successful', token, user: { id: user._id, name, email, phone } });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email, phone: user.phone } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/services', async (req, res) => {
  try {
    const allServices = await Service.find({});
    console.log(`📊 Total services in DB: ${allServices.length}`);
    console.log(`📊 Services:`, allServices.map(s => s.name));
    const activeServices = await Service.find({ isActive: true });
    console.log(`✅ Active services: ${activeServices.length}`);
    res.json(activeServices);
  } catch (error) {
    console.error('❌ Services error:', error);
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
});

app.get('/api/technicians', async (req, res) => {
  try {
    const technicians = await Technician.find({ isAvailable: true });
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch technicians', error: error.message });
  }
});

app.post('/api/bookings', auth, async (req, res) => {
  try {
    const booking = new Booking({ userId: req.user.userId, ...req.body });
    await booking.save();
    res.json({ message: 'Booking created successfully', booking });
  } catch (error) {
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
});

app.get('/api/bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

async function initializeData() {
  try {
    const serviceCount = await Service.countDocuments();
    if (serviceCount === 0) {
      const services = [
        { name: 'AC Service & Repair', description: 'Professional AC services', icon: '❄️', basePrice: 399, category: 'Appliance', subServices: [
          { name: 'AC Installation', description: 'New AC installation', price: 1999, duration: '2-3 hours' },
          { name: 'AC Repair', description: 'Fix AC issues', price: 799, duration: '1-2 hours' }
        ]},
        { name: 'Plumbing', description: 'All plumbing solutions', icon: '🔧', basePrice: 299, category: 'Home Repair', subServices: [
          { name: 'Pipe Repair', description: 'Fix leaking pipes', price: 599, duration: '1-2 hours' }
        ]},
        { name: 'Electrical', description: 'Electrical services', icon: '⚡', basePrice: 249, category: 'Home Repair', subServices: [
          { name: 'Wiring', description: 'Electrical wiring', price: 999, duration: '2-4 hours' }
        ]},
        { name: 'Cleaning', description: 'Home cleaning services', icon: '🧹', basePrice: 499, category: 'Cleaning', subServices: [
          { name: 'Deep Cleaning', description: 'Complete house cleaning', price: 1999, duration: '4-6 hours' }
        ]},
        { name: 'Painting', description: 'Professional painting', icon: '🎨', basePrice: 599, category: 'Home Improvement', subServices: [
          { name: 'Interior Painting', description: 'Paint interior walls', price: 2999, duration: '1-2 days' }
        ]},
        { name: 'Carpentry', description: 'Furniture and woodwork', icon: '🪚', basePrice: 399, category: 'Home Repair', subServices: [
          { name: 'Furniture Assembly', description: 'Assemble furniture', price: 599, duration: '1-2 hours' }
        ]}
      ];
      await Service.insertMany(services);
      console.log('✅ Services initialized');
    }
    
    const techCount = await Technician.countDocuments();
    await Technician.deleteMany({});  // Delete any broken data
      if (true) {  // Always recreate
      const technicians = [
  { name: 'Rajesh Kumar', email: 'rajesh@homefix.com', phone: '+91 9876543210', specialization: 'AC Technician', experience: '5 years', completedJobs: 450 },
  { name: 'Suresh Reddy', email: 'suresh@homefix.com', phone: '+91 9876543211', specialization: 'Plumber', experience: '7 years', completedJobs: 620 },
  { name: 'Amit Sharma', email: 'amit@homefix.com', phone: '+91 9876543212', specialization: 'Electrician', experience: '4 years', completedJobs: 380 },
  { name: 'Vijay Singh', email: 'vijay@homefix.com', phone: '+91 9876543213', specialization: 'Cleaner', experience: '3 years', completedJobs: 290 },
  { name: 'Prakash Rao', email: 'prakash@homefix.com', phone: '+91 9876543214', specialization: 'Painter', experience: '6 years', completedJobs: 510 },
  { name: 'Anil Verma', email: 'anil@homefix.com', phone: '+91 9876543215', specialization: 'Carpenter', experience: '8 years', completedJobs: 750 }
  ];
      await Technician.insertMany(technicians);
      console.log('✅ Technicians initialized');
    }
    console.log('✅ Database ready');
  } catch (error) {
    console.error('❌ Init error:', error);
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📌 HOME FIX SMART SERVICES - ONE CALL TOTAL HOME CARE`);
});

module.exports = app;

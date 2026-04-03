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

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✅ MongoDB Connected Successfully');
  initializeData();
}).catch(err => console.error('❌ MongoDB Error:', err));

// ── SCHEMAS ──
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
  rating: { type: Number, default: 4.5 },
  reviews: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  city: String,
  cities: [String],
  createdAt: { type: Date, default: Date.now }
});

const bookingSchema = new mongoose.Schema({
  userId:       mongoose.Schema.Types.ObjectId,
  serviceId:    String,
  subServiceId: String,
  technicianId: String,
  date:         String,
  time:         String,
  address:      String,
  notes:        String,
  city:         String,
  cityTier:     String,
  area:         String,
  totalAmount:  Number,
  price:        Number,
  status:       { type: String, default: 'pending' },
  createdAt:    { type: Date, default: Date.now }
});

const User       = mongoose.model('User',       userSchema);
const Service    = mongoose.model('Service',    serviceSchema);
const Technician = mongoose.model('Technician', technicianSchema);
const Booking    = mongoose.model('Booking',    bookingSchema);

// ── AUTH MIDDLEWARE ──
const auth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

const techAuth = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.role !== 'technician')
      return res.status(403).json({ message: 'Invalid technician token' });
    req.technician = decoded;
    next();
  });
};

// ── ROUTES ──
app.get('/', (req, res) => {
  res.json({ message: 'HOME FIX SMART SERVICES API', status: 'running' });
});

// CUSTOMER AUTH
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    if (!name || !email || !password || !phone || !address)
      return res.status(400).json({ message: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone, address });
    await user.save();
    const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Registration successful', token, user: { id: user._id, name, email, phone } });
  } catch (error) {
    console.error('Register error:', error);
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
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// SERVICES
app.get('/api/services', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services', error: error.message });
  }
});

// TECHNICIANS
app.get('/api/technicians', async (req, res) => {
  try {
    const technicians = await Technician.find({ isAvailable: true });
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch technicians', error: error.message });
  }
});

// CUSTOMER BOOKINGS
app.post('/api/bookings', auth, async (req, res) => {
  try {
    console.log('📦 New booking:', JSON.stringify(req.body));
    const booking = new Booking({
      userId:       req.user.userId,
      serviceId:    String(req.body.serviceId   || ''),
      subServiceId: String(req.body.subServiceId || ''),
      date:         String(req.body.date         || ''),
      time:         String(req.body.time         || ''),
      address:      String(req.body.address      || ''),
      notes:        String(req.body.notes        || ''),
      city:         String(req.body.city         || ''),
      cityTier:     String(req.body.cityTier     || ''),
      area:         String(req.body.area         || ''),
      totalAmount:  Number(req.body.totalAmount) || 0,
      price:        Number(req.body.price)       || 0,
      status:       'pending'
    });
    await booking.save();
    console.log('✅ Booking saved:', booking._id);
    res.json({ message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('❌ Booking error:', error.message);
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

// ── TECHNICIAN ROUTES ──
app.post('/api/technician/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password)
      return res.status(400).json({ message: 'Phone and password required' });

    // Find technician - try exact match first, then partial
    let tech = await Technician.findOne({ phone: phone });
    if (!tech) {
      const cleaned = phone.replace(/\s/g, '').replace('+91', '');
      tech = await Technician.findOne({ phone: { $regex: cleaned } });
    }
    if (!tech) return res.status(401).json({ message: 'Technician not found. Check phone number.' });

    // Password = last 4 digits of phone
    const cleanPhone = tech.phone.replace(/\s/g, '');
    const defaultPass = cleanPhone.slice(-4);
    if (password !== defaultPass && password !== 'tech123')
      return res.status(401).json({ message: 'Invalid password. Use last 4 digits of your phone.' });

    const token = jwt.sign(
      { technicianId: tech._id, phone: tech.phone, role: 'technician' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('✅ Technician login:', tech.name);
    res.json({ message: 'Login successful', token, technician: tech });
  } catch (error) {
    console.error('Tech login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.get('/api/technician/profile', techAuth, async (req, res) => {
  try {
    const tech = await Technician.findById(req.technician.technicianId);
    if (!tech) return res.status(404).json({ message: 'Technician not found' });
    res.json(tech);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

app.get('/api/technician/bookings', techAuth, async (req, res) => {
  try {
    const tech = await Technician.findById(req.technician.technicianId);
    if (!tech) return res.status(404).json({ message: 'Technician not found' });
    const bookings = await Booking.find({ city: tech.city }).sort({ createdAt: -1 });
    console.log(`✅ Found ${bookings.length} bookings for ${tech.city}`);
    res.json({ technician: tech, bookings });
  } catch (error) {
    console.error('Tech bookings error:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

app.put('/api/technician/bookings/:id', techAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['confirmed', 'on_the_way', 'completed', 'cancelled'];
    if (!validStatuses.includes(status))
      return res.status(400).json({ message: 'Invalid status' });
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status, technicianId: String(req.technician.technicianId) },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    console.log(`✅ Booking ${req.params.id} → ${status}`);
    res.json({ message: 'Status updated', booking });
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ message: 'Failed to update', error: error.message });
  }
});

// ── INITIALIZE ──
async function initializeData() {
  try {
    const serviceCount = await Service.countDocuments();
    console.log(`✅ Found ${serviceCount} existing services`);

    const techCount = await Technician.countDocuments();
    if (techCount === 0) {
      await Technician.insertMany([
        { name:'Rajesh Kumar',  phone:'+91 9876543210', specialization:'AC Technician',   experience:'5 years', completedJobs:450, rating:4.9, city:'Chennai',         isAvailable:true },
        { name:'Suresh Reddy',  phone:'+91 9876543211', specialization:'Plumber',          experience:'7 years', completedJobs:620, rating:4.8, city:'Chennai',         isAvailable:true },
        { name:'Amit Sharma',   phone:'+91 9876543212', specialization:'Electrician',      experience:'4 years', completedJobs:380, rating:4.9, city:'Chennai',         isAvailable:true },
        { name:'Vijay Singh',   phone:'+91 9876543213', specialization:'Cleaning Expert',  experience:'3 years', completedJobs:290, rating:4.7, city:'Chennai',         isAvailable:true },
        { name:'Prakash Rao',   phone:'+91 9876543214', specialization:'Painter',          experience:'6 years', completedJobs:510, rating:4.8, city:'Chennai',         isAvailable:true },
        { name:'Anil Verma',    phone:'+91 9876543215', specialization:'Carpenter',        experience:'8 years', completedJobs:750, rating:4.9, city:'Chennai',         isAvailable:true },
        { name:'Murugan S',     phone:'+91 9876543216', specialization:'Appliance Repair', experience:'6 years', completedJobs:480, rating:4.8, city:'Madurai',         isAvailable:true },
        { name:'Karthik R',     phone:'+91 9876543217', specialization:'Water Purifier',   experience:'4 years', completedJobs:320, rating:4.9, city:'Madurai',         isAvailable:true },
        { name:'Senthil Kumar', phone:'+91 9876543218', specialization:'AC Technician',    experience:'5 years', completedJobs:410, rating:4.7, city:'Coimbatore',      isAvailable:true },
        { name:'Arjun Pandian', phone:'+91 9876543219', specialization:'Electrician',      experience:'3 years', completedJobs:260, rating:4.8, city:'Coimbatore',      isAvailable:true },
        { name:'Dinesh Babu',   phone:'+91 9876543220', specialization:'Plumber',          experience:'5 years', completedJobs:390, rating:4.9, city:'Sivagangai',      isAvailable:true },
        { name:'Venkatesh M',   phone:'+91 9876543221', specialization:'Appliance Repair', experience:'7 years', completedJobs:560, rating:4.8, city:'Tiruchirappalli', isAvailable:true },
      ]);
      console.log('✅ Technicians initialized');
    } else {
      console.log(`✅ Found ${techCount} existing technicians`);
    }
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Init error:', error);
  }
}

// ══════════════════════════════════════
// ADMIN ROUTES — paste before app.listen
// ══════════════════════════════════════

// GET ALL BOOKINGS (admin)
app.get('/api/admin/bookings', async (req, res) => {
  try {
    const bookings = await Booking.find({}).sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
});

// GET ALL CUSTOMERS (admin)
app.get('/api/admin/customers', async (req, res) => {
  try {
    const customers = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
});

// ASSIGN TECHNICIAN TO BOOKING (admin)
app.put('/api/admin/bookings/:id/assign', async (req, res) => {
  try {
    const { technicianId, status } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { technicianId: String(technicianId), status: status || 'confirmed' },
      { new: true }
    );
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    console.log('✅ Technician assigned to booking:', req.params.id);
    res.json({ message: 'Technician assigned successfully', booking });
  } catch (error) {
    console.error('Assign error:', error);
    res.status(500).json({ message: 'Failed to assign technician', error: error.message });
  }
});

// GET ADMIN STATS
app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalBookings  = await Booking.countDocuments();
    const totalCustomers = await User.countDocuments();
    const totalTechs     = await Technician.countDocuments();
    const completed      = await Booking.find({ status: 'completed' });
    const totalRevenue   = completed.reduce((s, b) => s + (b.totalAmount || 0), 0);
    res.json({ totalBookings, totalCustomers, totalTechs, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 HOME FIX SMART SERVICES - ONE CALL TOTAL HOME CARE`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
});


// ── ADMIN SCHEMA & LOGIN ──
const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String,
  email: String,
  role: { type: String, default: 'admin' }
});
const Admin = mongoose.model('Admin', adminSchema);

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'Username and password required' });
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'Invalid credentials' });
    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ adminId: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ message: 'Login successful', token });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

app.post('/api/admin/technicians', async (req, res) => {
  try {
    const { name, phone, city, specialization, experience } = req.body;
    if (!name || !phone || !city || !specialization)
      return res.status(400).json({ message: 'All fields required' });
    const exists = await Technician.findOne({ phone });
    if (exists) return res.status(400).json({ message: 'Phone already registered' });
    const tech = new Technician({
      name, phone, city, specialization,
      experience: experience || '1 year',
      rating: 5.0, completedJobs: 0, isAvailable: true
    });
    await tech.save();
    res.json({ message: 'Technician added successfully', technician: tech });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add technician', error: error.message });
  }
});

app.delete('/api/admin/technicians/:id', async (req, res) => {
  try {
    await Technician.findByIdAndDelete(req.params.id);
    res.json({ message: 'Technician deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete', error: error.message });
  }
});

module.exports = app;


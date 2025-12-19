const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// CORS Configuration - Allow requests from your domain
app.use(cors({
    origin: ['https://hfix.in', 'http://hfix.in', 'https://www.hfix.in', 'http://www.hfix.in'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add request logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// In-memory data storage
let users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@homefixsmart.in' },
    { id: 2, username: 'user', password: 'user123', role: 'customer', name: 'Test User', email: 'user@homefixsmart.in' }
];

let bookings = [];
let bookingIdCounter = 1;

let services = [
    { id: 1, name: 'Plumbing Service', description: 'Expert plumbing repairs, installations, leak fixing', price: 499, category: 'plumbing' },
    { id: 2, name: 'Electrical Service', description: 'Professional electrical work, repairs, wiring', price: 599, category: 'electrical' },
    { id: 3, name: 'Cleaning Service', description: 'Deep cleaning for homes and offices', price: 399, category: 'cleaning' },
    { id: 4, name: 'Painting Service', description: 'Interior and exterior painting', price: 899, category: 'painting' },
    { id: 5, name: 'Carpentry Service', description: 'Custom carpentry and furniture repair', price: 699, category: 'carpentry' },
    { id: 6, name: 'AC Repair', description: 'Air conditioning repair and maintenance', price: 399, category: 'ac' }
];

let technicians = [
    { id: 1, name: 'Rajesh Kumar', specialty: 'Plumbing', experience: 8, rating: 4.8, skills: ['Pipe Repair', 'Leak Fixing', 'Bathroom Fitting'], proficiency: { plumbing: 95, pipeFitting: 92, leakDetection: 90 } },
    { id: 2, name: 'Amit Sharma', specialty: 'Electrical', experience: 10, rating: 4.9, skills: ['Wiring', 'MCB Repair', 'Fan Installation'], proficiency: { electrical: 97, circuitRepair: 94, safety: 98 } },
    { id: 3, name: 'Pradeep Singh', specialty: 'AC Service', experience: 7, rating: 4.7, skills: ['AC Repair', 'Gas Filling', 'Installation'], proficiency: { acRepair: 96, installation: 93, pcbRepair: 88 } },
    { id: 4, name: 'Vikram Patel', specialty: 'Painting', experience: 9, rating: 4.8, skills: ['Interior Paint', 'Exterior Paint', 'Texture'], proficiency: { painting: 94, texture: 91, colorMixing: 96 } },
    { id: 5, name: 'Suresh Reddy', specialty: 'Carpentry', experience: 12, rating: 4.9, skills: ['Furniture', 'Door Fitting', 'Custom Work'], proficiency: { carpentry: 95, furniture: 97, customDesign: 92 } },
    { id: 6, name: 'Mohammed Aziz', specialty: 'Cleaning', experience: 6, rating: 4.8, skills: ['Deep Cleaning', 'Sanitization', 'Sofa Clean'], proficiency: { deepCleaning: 98, sanitization: 96, upholstery: 93 } }
];

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Home Fix Smart Services API',
        status: 'success',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            services: 'GET /api/services',
            technicians: 'GET /api/technicians',
            login: 'POST /api/login',
            booking: 'POST /api/booking',
            userBookings: 'GET /api/bookings/user/:userId',
            adminBookings: 'GET /api/admin/bookings',
            stats: 'GET /api/admin/stats'
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Get all services
app.get('/api/services', (req, res) => {
    console.log('Services requested');
    res.json({ success: true, services: services, count: services.length });
});

// Get all technicians
app.get('/api/technicians', (req, res) => {
    console.log('Technicians requested');
    res.json({ success: true, technicians: technicians, count: technicians.length });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', username);
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        const token = 'token_' + user.id + '_' + Date.now();
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token: token
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Register (optional)
app.post('/api/register', (req, res) => {
    const { username, password, name, email, phone } = req.body;
    
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    
    const newUser = {
        id: users.length + 1,
        username,
        password,
        name,
        email,
        phone,
        role: 'customer'
    };
    
    users.push(newUser);
    res.json({ success: true, message: 'Registration successful', user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

// Create booking
app.post('/api/booking', (req, res) => {
    const { userId, serviceId, serviceName, date, time, address, phone, amount, customerName, email } = req.body;
    console.log('New booking:', serviceName, 'by', customerName);
    
    const booking = {
        id: bookingIdCounter++,
        userId: userId || 1,
        customerName: customerName || 'Guest',
        email: email || 'guest@example.com',
        serviceId,
        serviceName,
        date,
        time,
        address,
        phone,
        amount,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    bookings.push(booking);
    res.json({ success: true, message: 'Booking created successfully', booking: booking });
});

// Get user bookings
app.get('/api/bookings/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    console.log('Fetching bookings for user:', userId);
    const userBookings = bookings.filter(b => b.userId === userId);
    res.json({ success: true, bookings: userBookings, count: userBookings.length });
});

// Get booking by ID
app.get('/api/booking/:bookingId', (req, res) => {
    const bookingId = parseInt(req.params.bookingId);
    const booking = bookings.find(b => b.id === bookingId);
    
    if (booking) {
        res.json({ success: true, booking: booking });
    } else {
        res.status(404).json({ success: false, message: 'Booking not found' });
    }
});

// Cancel booking
app.put('/api/booking/:bookingId/cancel', (req, res) => {
    const bookingId = parseInt(req.params.bookingId);
    const booking = bookings.find(b => b.id === bookingId);
    
    if (booking) {
        booking.status = 'cancelled';
        res.json({ success: true, message: 'Booking cancelled', booking: booking });
    } else {
        res.status(404).json({ success: false, message: 'Booking not found' });
    }
});

// Admin: Get all bookings
app.get('/api/admin/bookings', (req, res) => {
    console.log('Admin fetching all bookings');
    res.json({ success: true, bookings: bookings, count: bookings.length });
});

// Admin: Update booking
app.put('/api/admin/booking/:bookingId', (req, res) => {
    const bookingId = parseInt(req.params.bookingId);
    const { status } = req.body;
    const booking = bookings.find(b => b.id === bookingId);
    
    if (booking) {
        booking.status = status;
        res.json({ success: true, message: 'Booking updated', booking: booking });
    } else {
        res.status(404).json({ success: false, message: 'Booking not found' });
    }
});

// Admin: Get statistics
app.get('/api/admin/stats', (req, res) => {
    const stats = {
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        completedBookings: bookings.filter(b => b.status === 'completed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0),
        totalUsers: users.filter(u => u.role === 'customer').length
    };
    res.json({ success: true, stats: stats });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ success: false, message: 'Internal server error', error: err.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend API running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
```

5. **Scroll down and click "Commit changes"**

---

### **STEP 2: Wait for Render to Redeploy (3-5 minutes)**

1. **Go back to Render dashboard:** https://dashboard.render.com
2. **Click on your service:** homeserve-booking
3. **Wait for auto-deployment** (Render will detect the GitHub change)
4. **Watch the logs** - you'll see it rebuild
5. **Wait for "Your service is live"**

---

### **STEP 3: Test Backend Directly**

**Open these URLs in your browser to test:**

1. **Main endpoint:**
```
   https://homeserve-booking.onrender.com
```
   Should show API info ✅

2. **Services endpoint:**
```
   https://homeserve-booking.onrender.com/api/services
```
   Should show: `{"success":true,"services":[...],"count":6}` ✅

3. **Technicians endpoint:**
```
   https://homeserve-booking.onrender.com/api/technicians

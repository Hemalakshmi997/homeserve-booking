const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
    origin: ['https://hfix.in', 'http://hfix.in', 'https://sandybrown-crane-728391.hostingersite.com'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// In-memory data storage (replace with database later)
let users = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@hfix.in' },
    { id: 2, username: 'user', password: 'user123', role: 'customer', name: 'Test User', email: 'user@hfix.in' }
];

let bookings = [];
let bookingIdCounter = 1;

let services = [
    { id: 1, name: 'Plumbing Service', description: 'Professional plumbing repairs and installations', price: 499, image: 'plumbing.jpg', category: 'plumbing' },
    { id: 2, name: 'Electrical Service', description: 'Expert electrical work and repairs', price: 599, image: 'electrical.jpg', category: 'electrical' },
    { id: 3, name: 'Cleaning Service', description: 'Deep cleaning for homes and offices', price: 399, image: 'cleaning.jpg', category: 'cleaning' },
    { id: 4, name: 'Painting Service', description: 'Interior and exterior painting', price: 899, image: 'painting.jpg', category: 'painting' },
    { id: 5, name: 'Carpentry Service', description: 'Custom carpentry and furniture repair', price: 699, image: 'carpentry.jpg', category: 'carpentry' },
    { id: 6, name: 'AC Repair', description: 'Air conditioning repair and maintenance', price: 399, image: 'ac-repair.jpg', category: 'ac' }
];

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Home Service API is running!',
        status: 'success',
        endpoints: {
            login: 'POST /api/login',
            register: 'POST /api/register',
            services: 'GET /api/services',
            booking: 'POST /api/booking',
            userBookings: 'GET /api/bookings/user/:userId',
            adminBookings: 'GET /api/admin/bookings'
        }
    });
});

// API Routes

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        const token = 'token_' + user.id + '_' + Date.now();
        res.json({ 
            success: true, 
            message: 'Login successful',
            user: { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                role: user.role 
            },
            token: token
        });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Register
app.post('/api/register', (req, res) => {
    const { username, password, name, email, phone } = req.body;
    
    // Check if user exists
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
    
    res.json({ 
        success: true, 
        message: 'Registration successful',
        user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
});

// Get all services
app.get('/api/services', (req, res) => {
    res.json({ success: true, services: services });
});

// Create booking
app.post('/api/booking', (req, res) => {
    const { userId, serviceId, serviceName, date, time, address, phone, amount } = req.body;
    
    const user = users.find(u => u.id == userId);
    
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const booking = {
        id: bookingIdCounter++,
        userId,
        customerName: user.name,
        email: user.email,
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
    
    res.json({ 
        success: true, 
        message: 'Booking created successfully',
        booking: booking
    });
});

// Get user bookings
app.get('/api/bookings/user/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const userBookings = bookings.filter(b => b.userId === userId);
    
    res.json({ success: true, bookings: userBookings });
});

// Get single booking
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
    res.json({ success: true, bookings: bookings });
});

// Admin: Update booking status
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
        totalRevenue: bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + b.amount, 0),
        totalUsers: users.filter(u => u.role === 'customer').length
    };
    
    res.json({ success: true, stats: stats });
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
});

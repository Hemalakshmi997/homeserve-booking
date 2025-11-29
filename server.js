const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect('mongodb+srv://HEMALAKSHMI:Database%402005@homeservice.n0ibamt.mongodb.net/homeserve')
.then(() => console.log('✅ MONGODB CONNECTED'))
.catch(err => console.log('❌ ERROR:', err));

// ==================== SCHEMAS ====================

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,
    address: String,
    createdAt: { type: Date, default: Date.now }
});

const technicianSchema = new mongoose.Schema({
    name: String,
    specialty: String,
    experience: Number,
    rating: { type: Number, default: 4.5 },
    rate: Number,
    phone: String,
    email: String,
    avatar: String,
    totalBookings: { type: Number, default: 0 },
    reviews: [{
        userName: String,
        rating: Number,
        comment: String,
        date: { type: Date, default: Date.now }
    }],
    available: { type: Boolean, default: true }
});

const bookingSchema = new mongoose.Schema({
    userId: String,
    name: String,
    email: String,
    phone: String,
    service: String,
    technician: String,
    date: String,
    time: String,
    address: String,
    details: String,
    amount: Number,
    status: { type: String, default: 'pending' },
    paymentStatus: { type: String, default: 'pending' },
    paymentId: String,
    createdAt: { type: Date, default: Date.now }
});

const reviewSchema = new mongoose.Schema({
    bookingId: String,
    technicianName: String,
    userName: String,
    userEmail: String,
    rating: Number,
    comment: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Technician = mongoose.model('Technician', technicianSchema);
const Booking = mongoose.model('Booking', bookingSchema);
const Review = mongoose.model('Review', reviewSchema);

// ==================== SEED DATA ====================

async function seedData() {
    const techCount = await Technician.countDocuments();
    if (techCount === 0) {
        await Technician.insertMany([
            { 
                name: 'Rajesh Kumar', 
                specialty: 'Electrical', 
                experience: 8, 
                rating: 4.9, 
                rate: 500, 
                phone: '+91 9876543210',
                email: 'rajesh@homeserve.com',
                avatar: 'RK',
                reviews: [
                    { userName: 'Amit', rating: 5, comment: 'Excellent work! Very professional.' },
                    { userName: 'Priya', rating: 5, comment: 'Quick and efficient service.' }
                ]
            },
            { 
                name: 'Amit Sharma', 
                specialty: 'Plumbing', 
                experience: 6, 
                rating: 4.8, 
                rate: 450, 
                phone: '+91 9876543211',
                email: 'amit@homeserve.com',
                avatar: 'AS',
                reviews: [
                    { userName: 'Suresh', rating: 5, comment: 'Fixed my pipe leak perfectly!' }
                ]
            },
            { 
                name: 'Meena Patel', 
                specialty: 'AC Repair', 
                experience: 10, 
                rating: 5.0, 
                rate: 600, 
                phone: '+91 9876543212',
                email: 'meena@homeserve.com',
                avatar: 'MP',
                reviews: [
                    { userName: 'Rahul', rating: 5, comment: 'Best AC technician in town!' }
                ]
            },
            { 
                name: 'Suresh Reddy', 
                specialty: 'Painting', 
                experience: 7, 
                rating: 4.7, 
                rate: 400, 
                phone: '+91 9876543213',
                email: 'suresh@homeserve.com',
                avatar: 'SR'
            },
            { 
                name: 'Priya Singh', 
                specialty: 'Carpentry', 
                experience: 5, 
                rating: 4.8, 
                rate: 450, 
                phone: '+91 9876543214',
                email: 'priya@homeserve.com',
                avatar: 'PS'
            },
            { 
                name: 'Arjun Nair', 
                specialty: 'Cleaning', 
                experience: 4, 
                rating: 4.6, 
                rate: 350, 
                phone: '+91 9876543215',
                email: 'arjun@homeserve.com',
                avatar: 'AN'
            }
        ]);
        console.log('✅ Sample technicians added');
    }
}
seedData();

// ==================== ROUTES ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Services
app.get('/api/services', (req, res) => {
    res.json([
        { id: 1, name: 'Electrical', icon: '⚡', description: 'Wiring, repairs, installations', price: 500 },
        { id: 2, name: 'Plumbing', icon: '🔧', description: 'Pipe repairs, installations', price: 450 },
        { id: 3, name: 'AC Repair', icon: '❄️', description: 'Servicing, repairs, maintenance', price: 600 },
        { id: 4, name: 'Painting', icon: '🎨', description: 'Interior and exterior painting', price: 400 },
        { id: 5, name: 'Carpentry', icon: '🔨', description: 'Furniture assembly, woodwork', price: 450 },
        { id: 6, name: 'Cleaning', icon: '🧹', description: 'Deep cleaning, maintenance', price: 350 }
    ]);
});

// Technicians
app.get('/api/technicians', async (req, res) => {
    try {
        const technicians = await Technician.find({ available: true });
        res.json(technicians);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch technicians' });
    }
});

app.get('/api/technicians/:specialty', async (req, res) => {
    try {
        const technicians = await Technician.find({ 
            specialty: req.params.specialty,
            available: true 
        });
        res.json(technicians);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch technicians' });
    }
});

// User Registration & Login
app.post('/api/users/register', async (req, res) => {
    try {
        const existing = await User.findOne({ email: req.body.email });
        if (existing) {
            return res.json({ success: false, message: 'Email already registered' });
        }
        
        const user = new User(req.body);
        await user.save();
        res.json({ success: true, message: 'Registration successful!', userId: user._id });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const user = await User.findOne({ 
            email: req.body.email, 
            password: req.body.password 
        });
        
        if (user) {
            res.json({ success: true, user: { id: user._id, name: user.name, email: user.email } });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

// Bookings
app.post('/api/bookings', async (req, res) => {
    try {
        const pricing = {
            'Electrical': 500,
            'Plumbing': 450,
            'AC Repair': 600,
            'Painting': 400,
            'Carpentry': 450,
            'Cleaning': 350
        };
        
        const booking = new Booking({
            ...req.body,
            amount: pricing[req.body.service] || 500
        });
        
        await booking.save();
        
        if (req.body.technician) {
            await Technician.findOneAndUpdate(
                { name: req.body.technician },
                { $inc: { totalBookings: 1 } }
            );
        }
        
        // Simulate sending email notification
        console.log(`📧 Email notification sent to ${req.body.email}`);
        console.log(`📱 SMS sent to ${req.body.phone}`);
        
        res.json({ 
            success: true, 
            bookingId: booking._id,
            amount: booking.amount,
            message: 'Booking created! Confirmation sent to your email.'
        });
    } catch (error) {
        res.status(500).json({ error: 'Booking failed' });
    }
});

app.get('/api/bookings/user/:email', async (req, res) => {
    try {
        const bookings = await Booking.find({ email: req.params.email }).sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

app.get('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: 'Booking not found' });
    }
});

app.patch('/api/bookings/:id', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );
        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Update failed' });
    }
});

// Payment
app.post('/api/payment/create', async (req, res) => {
    try {
        // Simulate Razorpay order creation
        const orderId = 'order_' + Math.random().toString(36).substr(2, 9);
        res.json({ 
            success: true, 
            orderId: orderId,
            amount: req.body.amount,
            message: 'Payment order created'
        });
    } catch (error) {
        res.status(500).json({ error: 'Payment creation failed' });
    }
});

app.post('/api/payment/verify', async (req, res) => {
    try {
        const { bookingId, paymentId } = req.body;
        
        await Booking.findByIdAndUpdate(bookingId, {
            paymentStatus: 'paid',
            paymentId: paymentId,
            status: 'confirmed'
        });
        
        console.log(`✅ Payment verified for booking ${bookingId}`);
        
        res.json({ success: true, message: 'Payment successful!' });
    } catch (error) {
        res.status(500).json({ error: 'Payment verification failed' });
    }
});

// Reviews & Ratings
app.post('/api/reviews', async (req, res) => {
    try {
        const review = new Review(req.body);
        await review.save();
        
        // Update technician rating
        const allReviews = await Review.find({ technicianName: req.body.technicianName });
        const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
        
        await Technician.findOneAndUpdate(
            { name: req.body.technicianName },
            { 
                rating: avgRating,
                $push: { 
                    reviews: {
                        userName: req.body.userName,
                        rating: req.body.rating,
                        comment: req.body.comment
                    }
                }
            }
        );
        
        res.json({ success: true, message: 'Review submitted!' });
    } catch (error) {
        res.status(500).json({ error: 'Review submission failed' });
    }
});

app.get('/api/reviews/:technicianName', async (req, res) => {
    try {
        const reviews = await Review.find({ technicianName: req.params.technicianName }).sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// Admin Routes
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch bookings' });
    }
});

app.get('/api/admin/stats', async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const totalTechnicians = await Technician.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalRevenue = await Booking.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        res.json({
            totalBookings,
            totalTechnicians,
            totalUsers,
            totalRevenue: totalRevenue[0]?.total || 0,
            pendingBookings: await Booking.countDocuments({ status: 'pending' }),
            completedBookings: await Booking.countDocuments({ status: 'completed' })
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

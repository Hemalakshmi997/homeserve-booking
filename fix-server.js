/**
 * Run this in your backend folder:
 * node fix-server.js
 */
const fs = require('fs');
let c = fs.readFileSync('server.js', 'utf8');

// Show what we have
const idx = c.indexOf('bookingSchema');
console.log('📍 Found bookingSchema at index:', idx);
console.log('📄 Current schema:\n', c.substring(idx, idx+500));
console.log('\n---');

// Replace the entire bookingSchema
const oldSchema = /const bookingSchema = new mongoose\.Schema\(\{[\s\S]*?\}\);/;
const newSchema = `const bookingSchema = new mongoose.Schema({
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
});`;

if (oldSchema.test(c)) {
  c = c.replace(oldSchema, newSchema);
  console.log('✅ Schema replaced!');
} else {
  console.log('❌ Schema pattern not found - manual fix needed');
}

// Replace booking route to use explicit fields
const oldRoute = /app\.post\('\/api\/bookings', auth, async \(req, res\) => \{[\s\S]*?const bookingData[\s\S]*?booking\.save\(\);[\s\S]*?\}\);/;
const newRoute = `app.post('/api/bookings', auth, async (req, res) => {
  try {
    console.log('📦 Booking:', JSON.stringify(req.body));
    const booking = new Booking({
      userId:       req.user.userId,
      serviceId:    String(req.body.serviceId   || ''),
      subServiceId: String(req.body.subServiceId || ''),
      date:         req.body.date     || '',
      time:         req.body.time     || '',
      address:      req.body.address  || '',
      notes:        req.body.notes    || '',
      city:         req.body.city     || '',
      cityTier:     req.body.cityTier || '',
      area:         req.body.area     || '',
      totalAmount:  Number(req.body.totalAmount) || 0,
      price:        Number(req.body.price)       || 0,
      status:       'pending'
    });
    await booking.save();
    console.log('✅ Booking saved! ID:', booking._id);
    res.json({ message: 'Booking created successfully', booking });
  } catch (error) {
    console.error('❌ Booking error:', error.message);
    res.status(500).json({ message: 'Booking failed', error: error.message });
  }
});`;

if (oldRoute.test(c)) {
  c = c.replace(oldRoute, newRoute);
  console.log('✅ Booking route replaced!');
} else {
  console.log('⚠️  Route pattern not matched - schema fix only applied');
}

fs.writeFileSync('server.js', c);
console.log('\n✅ server.js updated! Now run: node server.js');

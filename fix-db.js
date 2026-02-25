/**
 * HomeFix Smart Services — Fix Duplicates + Update Technicians
 * Run: node fix-db.js
 * This removes duplicate services and updates all technicians
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

const serviceSchema = new mongoose.Schema({
  name: String, description: String, icon: String,
  basePrice: Number, category: String,
  isActive: { type: Boolean, default: true },
  subServices: [{ name: String, description: String, price: Number, duration: String, isActive: { type: Boolean, default: true } }],
  createdAt: { type: Date, default: Date.now }
});

const technicianSchema = new mongoose.Schema({
  name: String, email: String, phone: String,
  specialization: String, experience: String,
  completedJobs: Number, rating: { type: Number, default: 5 },
  isAvailable: { type: Boolean, default: true },
  city: String, photo: String
});

const Service = mongoose.model('Service', serviceSchema);
const Technician = mongoose.model('Technician', technicianSchema);

// ── All 8 services with full sub-services ──
const ALL_SERVICES = [
  {
    name: 'AC Service & Repair',
    description: 'Complete AC installation, repair, gas refilling and annual maintenance by certified technicians.',
    icon: '❄️', basePrice: 399, category: 'Appliance',
    subServices: [
      { name: 'AC Installation', description: 'New AC installation', price: 1500, duration: '2-3 hours' },
      { name: 'AC Gas Refill', description: 'AC gas refilling service', price: 2500, duration: '1-2 hours' },
      { name: 'AC Deep Cleaning', description: 'Complete AC cleaning', price: 599, duration: '1-2 hours' },
      { name: 'AC Repair', description: 'Fix all AC issues', price: 359, duration: '1-2 hours' },
      { name: 'AC Uninstallation', description: 'Safe AC removal', price: 499, duration: '1 hour' },
      { name: 'Annual Maintenance', description: 'Yearly AC service contract', price: 1999, duration: '2 hours' }
    ]
  },
  {
    name: 'Cleaning & Pest Control',
    description: 'Professional home cleaning, deep cleaning, sanitization and pest control services.',
    icon: '🧹', basePrice: 299, category: 'Cleaning',
    subServices: [
      { name: 'Deep Home Cleaning', description: 'Complete house deep cleaning', price: 2999, duration: '4-6 hours' },
      { name: 'Kitchen Cleaning', description: 'Professional kitchen cleaning', price: 899, duration: '2-3 hours' },
      { name: 'Bathroom Cleaning', description: 'Deep bathroom cleaning', price: 599, duration: '1-2 hours' },
      { name: 'Pest Control', description: 'Complete pest control treatment', price: 1299, duration: '2-3 hours' },
      { name: 'Sofa & Carpet Cleaning', description: 'Sofa and carpet shampooing', price: 1499, duration: '2-3 hours' },
      { name: 'Sanitization', description: 'Home sanitization spray', price: 799, duration: '1-2 hours' }
    ]
  },
  {
    name: 'Electrician',
    description: 'Certified electricians for wiring, fan installation, switchboard repair and all electrical work.',
    icon: '⚡', basePrice: 149, category: 'Home Repair',
    subServices: [
      { name: 'Switch Installation', description: 'Switch and socket fitting', price: 99, duration: '30 mins' },
      { name: 'Fan Installation', description: 'Ceiling/exhaust fan fitting', price: 299, duration: '1 hour' },
      { name: 'Light Installation', description: 'Light and LED fitting', price: 199, duration: '1 hour' },
      { name: 'Wiring', description: 'House wiring and rewiring', price: 499, duration: '2-4 hours' },
      { name: 'MCB & Fuse Repair', description: 'MCB and fuse box repair', price: 349, duration: '1 hour' },
      { name: 'Inverter Installation', description: 'Home inverter setup', price: 799, duration: '2 hours' }
    ]
  },
  {
    name: 'Plumbing',
    description: 'Expert plumbers for tap repair, pipe leakage, bathroom fittings and drainage solutions.',
    icon: '🔧', basePrice: 149, category: 'Home Repair',
    subServices: [
      { name: 'Tap Repair', description: 'Fix leaking taps', price: 149, duration: '30 mins' },
      { name: 'Toilet Repair', description: 'Toilet flush and seat repair', price: 299, duration: '1 hour' },
      { name: 'Pipe Repair', description: 'Fix leaking pipes', price: 399, duration: '1-2 hours' },
      { name: 'Bathroom Fitting', description: 'New bathroom fixtures', price: 599, duration: '2-3 hours' },
      { name: 'Drainage Cleaning', description: 'Blocked drain cleaning', price: 499, duration: '1-2 hours' },
      { name: 'Water Tank Cleaning', description: 'Overhead tank cleaning', price: 999, duration: '2-3 hours' }
    ]
  },
  {
    name: 'Painting',
    description: 'Professional interior and exterior painting, texture painting and waterproofing services.',
    icon: '🎨', basePrice: 599, category: 'Home Improvement',
    subServices: [
      { name: '1 BHK Painting', description: 'Complete 1 BHK interior painting', price: 8999, duration: '3-4 days' },
      { name: '2 BHK Painting', description: 'Complete 2 BHK interior painting', price: 14999, duration: '4-5 days' },
      { name: '3 BHK Painting', description: 'Complete 3 BHK interior painting', price: 21999, duration: '5-7 days' },
      { name: 'Exterior Painting', description: 'Exterior wall painting', price: 18999, duration: '5-7 days' },
      { name: 'Texture Painting', description: 'Decorative texture walls', price: 4999, duration: '2-3 days' },
      { name: 'Waterproofing', description: 'Terrace and wall waterproofing', price: 3999, duration: '2-3 days' }
    ]
  },
  {
    name: 'Carpenter',
    description: 'Skilled carpenters for furniture repair, door fixing, wardrobe installation and custom work.',
    icon: '🪚', basePrice: 399, category: 'Home Repair',
    subServices: [
      { name: 'Furniture Assembly', description: 'Assemble flat-pack furniture', price: 399, duration: '1-2 hours' },
      { name: 'Furniture Repair', description: 'Fix broken furniture', price: 499, duration: '1-2 hours' },
      { name: 'Door Installation', description: 'New door fitting', price: 799, duration: '2-3 hours' },
      { name: 'Wardrobe Installation', description: 'Wardrobe assembly and fitting', price: 1299, duration: '3-4 hours' },
      { name: 'Window Repair', description: 'Window frame and glass repair', price: 599, duration: '1-2 hours' },
      { name: 'False Ceiling', description: 'POP and gypsum ceiling work', price: 4999, duration: '2-3 days' }
    ]
  },
  {
    name: 'Appliance Repair',
    description: 'Expert repair for washing machines, refrigerators, microwaves, geysers and all home appliances.',
    icon: '🔌', basePrice: 299, category: 'Appliance',
    subServices: [
      { name: 'Washing Machine Repair', description: 'Fix all washing machine issues', price: 499, duration: '1-2 hours' },
      { name: 'Refrigerator Repair', description: 'Fridge cooling and compressor repair', price: 599, duration: '1-2 hours' },
      { name: 'Microwave Repair', description: 'Microwave oven repair', price: 399, duration: '1 hour' },
      { name: 'Geyser Repair', description: 'Water heater repair', price: 449, duration: '1-2 hours' },
      { name: 'Dishwasher Repair', description: 'Dishwasher service and repair', price: 549, duration: '1-2 hours' },
      { name: 'TV Repair', description: 'LED/LCD TV repair', price: 499, duration: '1-2 hours' }
    ]
  },
  {
    name: 'Water Purifier',
    description: 'RO installation, service, filter replacement and repair by certified water purifier technicians.',
    icon: '💧', basePrice: 299, category: 'Appliance',
    subServices: [
      { name: 'RO Installation', description: 'New RO water purifier installation', price: 599, duration: '1-2 hours' },
      { name: 'RO Service', description: 'Complete RO servicing', price: 399, duration: '1 hour' },
      { name: 'Filter Replacement', description: 'Replace RO filters and membrane', price: 799, duration: '1 hour' },
      { name: 'RO Repair', description: 'Fix leakage and pressure issues', price: 449, duration: '1-2 hours' },
      { name: 'UV Purifier Service', description: 'UV purifier service and repair', price: 349, duration: '45 mins' },
      { name: 'Annual Maintenance', description: 'Yearly AMC package', price: 1299, duration: '1 hour' }
    ]
  }
];

// ── All technicians (Tamil Nadu names) ──
const ALL_TECHNICIANS = [
  { name: 'Rajesh Kumar',    email: 'rajesh@homefix.com',    phone: '+91 9876543210', specialization: 'AC Technician',       experience: '5 years', completedJobs: 450, rating: 4.9, city: 'Chennai' },
  { name: 'Suresh Reddy',    email: 'suresh@homefix.com',    phone: '+91 9876543211', specialization: 'Plumber',              experience: '7 years', completedJobs: 620, rating: 4.8, city: 'Chennai' },
  { name: 'Amit Sharma',     email: 'amit@homefix.com',      phone: '+91 9876543212', specialization: 'Electrician',          experience: '4 years', completedJobs: 380, rating: 4.9, city: 'Chennai' },
  { name: 'Vijay Singh',     email: 'vijay@homefix.com',     phone: '+91 9876543213', specialization: 'Cleaning Expert',      experience: '3 years', completedJobs: 290, rating: 4.7, city: 'Chennai' },
  { name: 'Prakash Rao',     email: 'prakash@homefix.com',   phone: '+91 9876543214', specialization: 'Painter',              experience: '6 years', completedJobs: 510, rating: 4.8, city: 'Chennai' },
  { name: 'Anil Verma',      email: 'anil@homefix.com',      phone: '+91 9876543215', specialization: 'Carpenter',            experience: '8 years', completedJobs: 750, rating: 4.9, city: 'Chennai' },
  { name: 'Murugan S',       email: 'murugan@homefix.com',   phone: '+91 9876543216', specialization: 'Appliance Repair',     experience: '6 years', completedJobs: 480, rating: 4.8, city: 'Madurai' },
  { name: 'Karthik R',       email: 'karthik@homefix.com',   phone: '+91 9876543217', specialization: 'Water Purifier',       experience: '4 years', completedJobs: 320, rating: 4.9, city: 'Madurai' },
  { name: 'Senthil Kumar',   email: 'senthil@homefix.com',   phone: '+91 9876543218', specialization: 'AC Technician',        experience: '5 years', completedJobs: 410, rating: 4.7, city: 'Coimbatore' },
  { name: 'Arjun Pandian',   email: 'arjun@homefix.com',     phone: '+91 9876543219', specialization: 'Electrician',          experience: '3 years', completedJobs: 260, rating: 4.8, city: 'Coimbatore' },
  { name: 'Dinesh Babu',     email: 'dinesh@homefix.com',    phone: '+91 9876543220', specialization: 'Plumber',              experience: '5 years', completedJobs: 390, rating: 4.9, city: 'Sivagangai' },
  { name: 'Venkatesh M',     email: 'venkatesh@homefix.com', phone: '+91 9876543221', specialization: 'Appliance Repair',     experience: '7 years', completedJobs: 560, rating: 4.8, city: 'Tiruchirappalli' }
];

async function fixDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected!\n');

    // ── Step 1: Remove ALL existing services and re-insert clean ──
    console.log('🗑️  Clearing old/duplicate services...');
    await Service.deleteMany({});
    console.log('✅ Cleared\n');

    console.log('📦 Inserting 8 clean services...');
    for (const svc of ALL_SERVICES) {
      await Service.create(svc);
      console.log(`   ✅ ${svc.name} — ${svc.subServices.length} sub-services`);
    }

    // ── Step 2: Replace all technicians ──
    console.log('\n👷 Updating technicians...');
    await Technician.deleteMany({});
    await Technician.insertMany(ALL_TECHNICIANS);
    console.log(`   ✅ ${ALL_TECHNICIANS.length} technicians added`);

    // ── Summary ──
    const svcCount = await Service.countDocuments({ isActive: true });
    const techCount = await Technician.countDocuments({ isAvailable: true });

    console.log('\n╔══════════════════════════════════════╗');
    console.log('║         DATABASE UPDATED ✅           ║');
    console.log('╠══════════════════════════════════════╣');
    console.log(`║  Services:    ${svcCount} active                ║`);
    console.log(`║  Technicians: ${techCount} available             ║`);
    console.log('╚══════════════════════════════════════╝');
    console.log('\n🔄 Refresh your website to see all 8 services!\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

fixDatabase();

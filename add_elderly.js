require('dotenv').config();
const mongoose = require('mongoose');
const serviceSchema = new mongoose.Schema({
  name: String, description: String, icon: String,
  basePrice: Number, category: String, isActive: Boolean,
  subServices: [{ name: String, description: String, price: Number, duration: String, isActive: Boolean }]
});
const Service = mongoose.model('Service', serviceSchema);
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const exists = await Service.findOne({ name: 'Elderly Care' });
  if (exists) { console.log('Already exists!'); process.exit(0); }
  await Service.create({
    name: 'Elderly Care',
    description: 'Dedicated care and support for senior citizens - medical assistance, daily help and companionship.',
    icon: '👴',
    basePrice: 999,
    category: 'Care Services',
    isActive: true,
    subServices: [
      { name: 'Daily Assistance', description: 'Help with daily activities', price: 999, duration: '2-3 hours', isActive: true },
      { name: 'Medical Appointment', description: 'Accompany to hospital', price: 1299, duration: '3-4 hours', isActive: true },
      { name: 'Weekly Care Plan', description: 'Weekly visits and care', price: 2999, duration: '3 hours/visit', isActive: true },
      { name: 'Emergency Support', description: '24/7 emergency assistance', price: 1999, duration: 'As needed', isActive: true },
      { name: 'Medication Reminder', description: 'Daily medication tracking', price: 799, duration: '1 hour', isActive: true },
      { name: 'Monthly Care Package', description: 'Complete monthly care plan', price: 4999, duration: 'Monthly', isActive: true }
    ]
  });
  console.log('Elderly Care added!');
  process.exit(0);
});

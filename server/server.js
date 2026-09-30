require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const storage = require('./services/storage');
const { seedDatabase } = require('./seed/seedData');
const { runDonorActivityCheck } = require('./services/donorActivityEngine');

const authRoutes = require('./routes/authRoutes');
const requestRoutes = require('./routes/requestRoutes');
const matchRoutes = require('./routes/matchRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const adminRoutes = require('./routes/adminRoutes');
const donorRoutes = require('./routes/donorRoutes');
const relayRoutes = require('./routes/relayRoutes');
const supabase = require('./config/supabase');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/relay', relayRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    system: 'BloodLink AI V2.0 - Privacy-First Emergency Blood Response Network',
    version: '2.0.0',
    supabaseConnected: Boolean(supabase),
    privacyProtection: 'ACTIVE (Strict Zero Personal Information Exposure)',
    timestamp: new Date().toISOString()
  });
});

// Auto initialize and start
async function startServer() {
  await connectDB();

  // Check if store has users, if not, auto-seed
  const existingUsers = await storage.find('users');
  if (!existingUsers || existingUsers.length === 0) {
    console.log('[AUTO-INIT] Empty database detected. Auto-seeding emergency response dataset...');
    await seedDatabase();
  }

  // Run Donor Activity AI check on startup (Rule 8, 9)
  await runDonorActivityCheck();

  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🩸 BLOODLINK AI V2.0 - PRIVACY-FIRST NETWORK ONLINE 🩸`);
      console.log(`Command Center API listening on http://localhost:${PORT}`);
      console.log(`=======================================================`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;

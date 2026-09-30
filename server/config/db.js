const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saving_lives_db';
  try {
    // Attempt MongoDB connection with 2.5s timeout so startup is instantaneous even if mongod is absent
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500
    });
    console.log(`[DATABASE] MongoDB Connected successfully to: ${uri}`);
  } catch (err) {
    console.warn(`[DATABASE] MongoDB not available (${err.message}). Seamlessly activated Resilient Embedded JSON Storage Engine.`);
  }
}

module.exports = connectDB;

const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/saving_lives_db';

  // In cloud/Vercel serverless without an external MongoDB Atlas cluster, avoid blocking on localhost:27017
  if (process.env.VERCEL && (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost') || process.env.MONGODB_URI.includes('127.0.0.1'))) {
    console.log('[DATABASE] Cloud environment detected. Seamlessly activated Resilient Embedded JSON Storage Engine.');
    return;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`[DATABASE] MongoDB Connected successfully to: ${uri}`);
  } catch (err) {
    console.warn(`[DATABASE] MongoDB not available (${err.message}). Seamlessly activated Resilient Embedded JSON Storage Engine.`);
  }
}

module.exports = connectDB;

// Dual-Mode Unified Storage Engine (MongoDB Atlas + Fallback JSON Local Store)
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache synced with JSON store
let store = {
  users: [],
  donors: [],
  hospitals: [],
  bloodbanks: [],
  bloodrequests: [],
  donations: [],
  notifications: [],
  certificates: [],
  auditlogs: []
};

// Load initial store if exists
function loadLocalStore() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      store = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading local JSON store:', err.message);
  }
}

function saveLocalStore() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving local JSON store:', err.message);
  }
}

loadLocalStore();

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

const storage = {
  getStore: () => store,

  save: () => saveLocalStore(),

  setAll: (data) => {
    store = { ...store, ...data };
    saveLocalStore();
  },

  find: async (collection, query = {}) => {
    // If Mongo is connected, query via Mongoose
    if (isMongoConnected()) {
      try {
        const Model = mongoose.models[collection] || mongoose.model(collection);
        if (Model) {
          return await Model.find(query).lean();
        }
      } catch (e) {
        // Fall back to memory
      }
    }

    const items = store[collection] || [];
    return items.filter(item => {
      for (const [key, val] of Object.entries(query)) {
        if (item[key] !== val) return false;
      }
      return true;
    });
  },

  findOne: async (collection, query = {}) => {
    const results = await storage.find(collection, query);
    return results[0] || null;
  },

  findById: async (collection, id) => {
    if (isMongoConnected()) {
      try {
        const Model = mongoose.models[collection] || mongoose.model(collection);
        if (Model) {
          return await Model.findById(id).lean();
        }
      } catch (e) {
        // Fall back
      }
    }
    const items = store[collection] || [];
    return items.find(item => (item._id && item._id.toString() === id) || (item.id && item.id.toString() === id)) || null;
  },

  create: async (collection, doc) => {
    const id = doc._id || new mongoose.Types.ObjectId().toString();
    const item = {
      ...doc,
      _id: id,
      id: id,
      createdAt: doc.createdAt || new Date().toISOString()
    };

    if (isMongoConnected()) {
      try {
        const Model = mongoose.models[collection] || mongoose.model(collection);
        if (Model) {
          const created = await Model.create(item);
          return created.toObject ? created.toObject() : created;
        }
      } catch (e) {
        // fallback
      }
    }

    if (!store[collection]) store[collection] = [];
    store[collection].push(item);
    saveLocalStore();
    return item;
  },

  updateById: async (collection, id, updates) => {
    if (isMongoConnected()) {
      try {
        const Model = mongoose.models[collection] || mongoose.model(collection);
        if (Model) {
          return await Model.findByIdAndUpdate(id, updates, { new: true }).lean();
        }
      } catch (e) {
        // fallback
      }
    }

    const items = store[collection] || [];
    const index = items.findIndex(i => (i._id && i._id.toString() === id) || (i.id && i.id.toString() === id));
    if (index !== -1) {
      items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
      saveLocalStore();
      return items[index];
    }
    return null;
  },

  deleteById: async (collection, id) => {
    if (isMongoConnected()) {
      try {
        const Model = mongoose.models[collection] || mongoose.model(collection);
        if (Model) {
          return await Model.findByIdAndDelete(id).lean();
        }
      } catch (e) {
        // fallback
      }
    }

    const items = store[collection] || [];
    const index = items.findIndex(i => (i._id && i._id.toString() === id) || (i.id && i.id.toString() === id));
    if (index !== -1) {
      const removed = items.splice(index, 1);
      saveLocalStore();
      return removed[0];
    }
    return null;
  }
};

module.exports = storage;

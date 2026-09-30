const storage = require('../services/storage');

// Get all blood banks inventory with low-stock warnings and expiry alerts
async function getAllInventories(req, res) {
  try {
    const bloodbanks = await storage.find('bloodbanks');
    
    // Aggregation of total units by blood group across all banks
    const aggregate = {
      'A+': { available: 0, reserved: 0 },
      'A-': { available: 0, reserved: 0 },
      'B+': { available: 0, reserved: 0 },
      'B-': { available: 0, reserved: 0 },
      'AB+': { available: 0, reserved: 0 },
      'AB-': { available: 0, reserved: 0 },
      'O+': { available: 0, reserved: 0 },
      'O-': { available: 0, reserved: 0 }
    };

    let lowStockAlerts = [];
    let expiryAlerts = [];

    bloodbanks.forEach(bb => {
      (bb.inventory || []).forEach(item => {
        if (aggregate[item.bloodGroup]) {
          aggregate[item.bloodGroup].available += item.availableUnits || 0;
          aggregate[item.bloodGroup].reserved += item.reservedUnits || 0;
        }

        if (item.availableUnits <= (item.minThreshold || 5)) {
          lowStockAlerts.push({
            bloodBankId: bb._id || bb.id,
            bloodBankName: bb.name,
            bloodGroup: item.bloodGroup,
            availableUnits: item.availableUnits,
            threshold: item.minThreshold || 5,
            message: `CRITICAL LOW STOCK: Only ${item.availableUnits} units of ${item.bloodGroup} available at ${bb.name}.`
          });
        }

        if (item.nearestExpiryDate) {
          const diffDays = Math.ceil((new Date(item.nearestExpiryDate) - new Date()) / (1000 * 60 * 60 * 24));
          if (diffDays <= 7) {
            expiryAlerts.push({
              bloodBankId: bb._id || bb.id,
              bloodBankName: bb.name,
              bloodGroup: item.bloodGroup,
              daysRemaining: diffDays,
              message: `EXPIRY ALERT: ${item.bloodGroup} batch expires in ${diffDays} day(s) at ${bb.name}.`
            });
          }
        }
      });
    });

    res.json({
      success: true,
      aggregate,
      lowStockAlerts,
      expiryAlerts,
      bloodbanks
    });
  } catch (err) {
    console.error('Inventory list error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving inventory' });
  }
}

// Get inventory for a specific blood bank
async function getBloodBankInventory(req, res) {
  try {
    const { id } = req.params;
    const bb = await storage.findById('bloodbanks', id);
    if (!bb) return res.status(404).json({ success: false, message: 'Blood bank not found' });

    res.json({ success: true, bloodBank: bb, inventory: bb.inventory || [] });
  } catch (err) {
    console.error('Get blood bank inventory error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving blood bank inventory' });
  }
}

// Update inventory action: Add, Remove, Hold/Reserve, Release
async function updateInventoryAction(req, res) {
  try {
    const { id } = req.params; // bloodBankId
    const { bloodGroup, action, units } = req.body;
    // action: 'add', 'remove', 'hold', 'release'

    if (!bloodGroup || !action || !units) {
      return res.status(400).json({ success: false, message: 'bloodGroup, action (add/remove/hold/release), and units required.' });
    }

    const bb = await storage.findById('bloodbanks', id);
    if (!bb) return res.status(404).json({ success: false, message: 'Blood bank not found' });

    let inventory = bb.inventory || [];
    let item = inventory.find(i => i.bloodGroup === bloodGroup);

    if (!item) {
      item = {
        bloodGroup,
        availableUnits: 0,
        reservedUnits: 0,
        minThreshold: 5,
        lastUpdated: new Date()
      };
      inventory.push(item);
    }

    const count = Number(units);

    switch (action) {
      case 'add':
        item.availableUnits = (item.availableUnits || 0) + count;
        break;

      case 'remove':
        if ((item.availableUnits || 0) < count) {
          return res.status(400).json({ success: false, message: 'Cannot remove more units than currently available' });
        }
        item.availableUnits -= count;
        break;

      case 'hold':
      case 'reserve':
        if ((item.availableUnits || 0) < count) {
          return res.status(400).json({ success: false, message: 'Not enough available units to place on hold' });
        }
        item.availableUnits -= count;
        item.reservedUnits = (item.reservedUnits || 0) + count;
        break;

      case 'release':
        if ((item.reservedUnits || 0) < count) {
          return res.status(400).json({ success: false, message: 'Cannot release more units than reserved' });
        }
        item.reservedUnits -= count;
        item.availableUnits = (item.availableUnits || 0) + count;
        break;

      default:
        return res.status(400).json({ success: false, message: `Unknown action: ${action}` });
    }

    item.lastUpdated = new Date();

    const updated = await storage.updateById('bloodbanks', id, { inventory });

    // Create Audit Log
    await storage.create('auditlogs', {
      userId: req.user?.id || 'bb_user',
      userName: bb.name,
      userRole: 'bloodbank',
      action: `INVENTORY_${action.toUpperCase()}`,
      details: `${action.toUpperCase()} ${count} units of ${bloodGroup} at ${bb.name}. Available now: ${item.availableUnits}, Reserved: ${item.reservedUnits}`,
      status: action === 'remove' ? 'warning' : 'success'
    });

    res.json({
      success: true,
      message: `Successfully executed '${action}' for ${count} unit(s) of ${bloodGroup}`,
      inventory: updated.inventory,
      updatedItem: item
    });
  } catch (err) {
    console.error('Update inventory error:', err);
    res.status(500).json({ success: false, message: 'Server error updating blood bank inventory' });
  }
}

module.exports = {
  getAllInventories,
  getBloodBankInventory,
  updateInventoryAction
};

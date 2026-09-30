const storage = require('../services/storage');
const { calculateDistanceKm, getCompatibilityScore } = require('../services/matchingEngine');
const { 
  computeDonorAIForecast, 
  confirmDonorActive, 
  setDonorUnavailable 
} = require('../services/donorActivityEngine');

// Toggle donor availability
async function updateAvailability(req, res) {
  try {
    const { donorId } = req.params;
    const { availability } = req.body;

    const validStatuses = ['Available Now', 'Available Today', 'Busy', 'Unavailable'];
    if (!validStatuses.includes(availability)) {
      return res.status(400).json({ success: false, message: 'Invalid availability status' });
    }

    const updated = await storage.updateById('donors', donorId, {
      availability,
      lastActiveDate: new Date().toISOString()
    });
    if (!updated) return res.status(404).json({ success: false, message: 'Donor not found' });

    res.json({
      success: true,
      message: `Availability updated to '${availability}'`,
      donor: updated
    });
  } catch (err) {
    console.error('Update availability error:', err);
    res.status(500).json({ success: false, message: 'Error updating availability' });
  }
}

// Get categorized requests feed for a donor (Emergency, Volunteer, Scheduled)
async function getDonorFeed(req, res) {
  try {
    const { donorId } = req.params;
    const donor = await storage.findById('donors', donorId);
    if (!donor) return res.status(404).json({ success: false, message: 'Donor not found' });

    const allRequests = await storage.find('bloodrequests');
    const activeRequests = allRequests.filter(r => r.status === 'Matching' || r.status === 'Escalating' || r.status === 'Pending');

    const donorLat = donor.currentLocation?.lat || 11.025;
    const donorLng = donor.currentLocation?.lng || 77.000;

    const categorized = {
      emergency: [],
      volunteer: [],
      scheduled: []
    };

    activeRequests.forEach(r => {
      const distanceKm = calculateDistanceKm(r.location?.lat, r.location?.lng, donorLat, donorLng);
      const compatibility = getCompatibilityScore(r.bloodGroup, donor.bloodGroup);
      const isDirectMatch = compatibility > 0;

      const myResponse = (r.matchedDonors || []).find(m => m.donorId === donorId);
      const myDriveResponse = (r.driveDetails?.donorResponses || []).find(m => m.donorId === donorId);

      const item = {
        ...r,
        distanceKm,
        compatibility,
        isCompatible: isDirectMatch,
        myStatus: myResponse ? myResponse.status : 'New Request',
        myDriveStatus: myDriveResponse ? myDriveResponse.status : null
      };

      if (r.category === 'VOLUNTEER_DRIVE') {
        categorized.volunteer.push(item);
      } else if (r.category === 'SCHEDULED') {
        if (isDirectMatch) categorized.scheduled.push(item);
      } else {
        // EMERGENCY
        if (isDirectMatch) categorized.emergency.push(item);
      }
    });

    categorized.emergency.sort((a, b) => a.distanceKm - b.distanceKm);
    categorized.scheduled.sort((a, b) => a.distanceKm - b.distanceKm);

    // Compute live AI Donor Activity Forecast & Digital Twin Metrics
    const forecast = computeDonorAIForecast(donor);

    res.json({
      success: true,
      donor: {
        id: donor._id || donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        availability: donor.availability,
        trustScore: forecast.trustScore,
        readinessScore: forecast.readinessScore,
        engagementScore: forecast.trustScore,
        livesSaved: donor.livesSaved,
        donationsCount: donor.donationsCount,
        donationFrequency: forecast.donationFrequency,
        responseRate: forecast.responseRate,
        acceptanceRate: forecast.acceptanceRate,
        badges: donor.badges || ['First Donation'],
        activityStatus: donor.activityStatus || 'active',
        needsActivityConfirmation: donor.activityStatus === 'pending_confirmation' || (donor.remindersSent && donor.remindersSent > 0) || forecast.daysSinceActive >= 90,
        lastActiveDate: donor.lastActiveDate,
        lastVerificationDate: forecast.lastVerificationDate,
        nextVerificationDate: forecast.nextVerificationDate,
        aiForecast: forecast,
        digitalTwin: donor.digitalTwin || {
          activityLevel: forecast.activityLevel,
          responseRate: forecast.responseRate,
          acceptanceRate: forecast.acceptanceRate,
          donationFrequency: forecast.donationFrequency,
          lastVerificationDate: forecast.lastVerificationDate,
          nextVerificationDate: forecast.nextVerificationDate,
          forecast
        }
      },
      feed: categorized.emergency, // Default emergency feed
      categorized
    });
  } catch (err) {
    console.error('Donor feed error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving donor feed' });
  }
}

// Get donation history and certificates
async function getDonorHistory(req, res) {
  try {
    const { donorId } = req.params;
    const donations = await storage.find('donations', { donorId });
    const certificates = await storage.find('certificates', { donorId });

    res.json({
      success: true,
      donations,
      certificates
    });
  } catch (err) {
    console.error('Donor history error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving donation history' });
  }
}

// Get notifications for donor
async function getDonorNotifications(req, res) {
  try {
    const { donorId } = req.params;
    const notifs = await storage.find('notifications', { recipientId: donorId });
    notifs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, notifications: notifs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving notifications' });
  }
}

// Confirm Active Status from 90-day AI check (Yes, I Am Active)
async function confirmActive(req, res) {
  try {
    const { donorId } = req.params;
    const updated = await confirmDonorActive(donorId);
    if (!updated) return res.status(404).json({ success: false, message: 'Donor not found' });

    res.json({
      success: true,
      message: 'Active status confirmed! Profile kept active, digital twin & AI forecast updated.',
      donor: updated
    });
  } catch (err) {
    console.error('Confirm active error:', err);
    res.status(500).json({ success: false, message: 'Failed to confirm active status' });
  }
}

// Not Available Action from 90-day AI check (No, I Am Not Available)
async function setTemporarilyUnavailable(req, res) {
  try {
    const { donorId } = req.params;
    const updated = await setDonorUnavailable(donorId);
    if (!updated) return res.status(404).json({ success: false, message: 'Donor not found' });

    res.json({
      success: true,
      message: 'Status updated to Not Available. Paused from emergency matching until you re-activate.',
      donor: updated
    });
  } catch (err) {
    console.error('Set unavailable error:', err);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
}

// Get all donors with sanitized public view (Rule 5: Hides phone, email, Aadhaar, address)
async function getAllDonors(req, res) {
  try {
    const donors = await storage.find('donors');
    const activeDonors = donors.filter(d => d.activityStatus !== 'inactive' && d.searchVisibility !== false);

    const safeDonors = activeDonors.map(d => ({
      id: d._id || d.id,
      name: d.name,
      bloodGroup: d.bloodGroup,
      availability: d.availability,
      trustScore: d.trustScore,
      livesSaved: d.livesSaved,
      badges: d.badges,
      currentLocation: {
        lat: d.currentLocation?.lat,
        lng: d.currentLocation?.lng
      }
    }));
    res.json({ success: true, donors: safeDonors });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving donors' });
  }
}

module.exports = {
  updateAvailability,
  getDonorFeed,
  getDonorHistory,
  getDonorNotifications,
  confirmActive,
  setTemporarilyUnavailable,
  getAllDonors
};

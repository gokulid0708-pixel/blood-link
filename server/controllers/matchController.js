const storage = require('../services/storage');
const { rankDonorsForRequest, COMPATIBILITY_MATRIX } = require('../services/matchingEngine');

// Calculate match scores for a hospital and blood group
async function calculateMatches(req, res) {
  try {
    const { bloodGroup, lat, lng, maxDistanceKm } = req.body;

    if (!bloodGroup) {
      return res.status(400).json({ success: false, message: 'Blood group is required.' });
    }

    const hospitalCoords = {
      lat: Number(lat) || 11.0264,
      lng: Number(lng) || 77.0028
    };

    const allDonors = await storage.find('donors');
    const matches = rankDonorsForRequest(hospitalCoords, bloodGroup, allDonors);

    let filteredMatches = matches;
    if (maxDistanceKm) {
      filteredMatches = matches.filter(m => m.distanceKm <= Number(maxDistanceKm));
    }

    res.json({
      success: true,
      bloodGroup,
      hospitalLocation: hospitalCoords,
      compatibleBloodGroups: COMPATIBILITY_MATRIX[bloodGroup] || [],
      formula: 'Match Score = 40% Compatibility + 25% Distance + 20% Availability + 15% Trust Score',
      totalCompatibleDonors: filteredMatches.length,
      donors: filteredMatches
    });
  } catch (err) {
    console.error('Match calculation error:', err);
    res.status(500).json({ success: false, message: 'Error calculating donor matches' });
  }
}

module.exports = {
  calculateMatches
};

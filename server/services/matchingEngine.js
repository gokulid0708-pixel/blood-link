// Intelligent Donor Matching Engine (Privacy-First V2.0)
// Formula: Match Score = 40% Compatibility + 25% Distance + 20% Availability + 15% Trust Score
// STRICT PRIVACY PROTECTION (Rule 5 & Rule 12):
// - Hospital must NEVER see phone number, email, Aadhaar, or address.
// - Inactive donors (>12 months) are automatically excluded (Rule 9).

const COMPATIBILITY_MATRIX = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-']
};

function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 10.0;
  const R = 6371; // Radius of Earth in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(1));
}

function getCompatibilityScore(recipientGroup, donorGroup) {
  if (recipientGroup === donorGroup) return 100;
  const compatibleDonors = COMPATIBILITY_MATRIX[recipientGroup] || [];
  if (compatibleDonors.includes(donorGroup)) {
    return donorGroup === 'O-' ? 95 : 85;
  }
  return 0;
}

function getDistanceScore(distanceKm) {
  if (distanceKm <= 2) return 100;
  if (distanceKm <= 5) return 90;
  if (distanceKm <= 10) return 75;
  if (distanceKm <= 20) return 55;
  if (distanceKm <= 35) return 35;
  return Math.max(0, 100 - Math.round(distanceKm * 2.2));
}

function getAvailabilityScore(status) {
  switch (status) {
    case 'Available Now':
      return 100;
    case 'Available Today':
      return 80;
    case 'Busy':
      return 40;
    case 'Unavailable':
    default:
      return 0;
  }
}

/**
 * Matches and ranks all potential donors for an emergency blood request
 * STRICT PRIVACY: Omits phone, email, Aadhaar, and physical address completely!
 */
function rankDonorsForRequest(hospitalCoords, requiredBloodGroup, donorsList = []) {
  const ranked = [];

  for (const donor of donorsList) {
    // Rule 9: Exclude Inactive Donors
    if (donor.activityStatus === 'inactive' || donor.searchVisibility === false) {
      continue;
    }

    const donorLat = donor.currentLocation?.lat || donor.lat;
    const donorLng = donor.currentLocation?.lng || donor.lng;

    const distanceKm = calculateDistanceKm(
      hospitalCoords.lat,
      hospitalCoords.lng,
      donorLat,
      donorLng
    );

    const compatibility = getCompatibilityScore(requiredBloodGroup, donor.bloodGroup);
    if (compatibility === 0) continue;

    const distanceScore = getDistanceScore(distanceKm);
    const availabilityScore = getAvailabilityScore(donor.availability);
    const trustScore = donor.trustScore || 85;

    // Formula: 40% Compatibility + 25% Distance + 20% Availability + 15% Trust Score
    const matchScore = parseFloat(
      (
        0.40 * compatibility +
        0.25 * distanceScore +
        0.20 * availabilityScore +
        0.15 * trustScore
      ).toFixed(1)
    );

    // Rule 5: HIDE ALL PERSONAL INFORMATION (Phone, Email, Aadhaar, Home Address)
    ranked.push({
      donorId: donor.id || donor._id,
      donorName: donor.name,
      bloodGroup: donor.bloodGroup,
      distanceKm,
      compatibility,
      distanceScore,
      availabilityScore,
      trustScore,
      availability: donor.availability,
      livesSaved: donor.livesSaved || 0,
      matchPercentage: Math.min(100, Math.round(matchScore)),
      privacyShield: 'Encrypted Relay Protected',
      canSecureCall: true
    });
  }

  // Sort descending by match score
  ranked.sort((a, b) => b.matchPercentage - a.matchPercentage);

  return ranked;
}

module.exports = {
  COMPATIBILITY_MATRIX,
  calculateDistanceKm,
  getCompatibilityScore,
  getDistanceScore,
  getAvailabilityScore,
  rankDonorsForRequest
};

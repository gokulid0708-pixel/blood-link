// Donor Activity & Inactivity Cleanup AI Engine
// Rules 8, 9, 10 & AI Donor Activity Forecast & Digital Twin Engine:
// - Every 90 days: Check if donor is still active with "Are you still an active blood donor?"
// - Options: Yes, I Am Active / No, I Am Not Available
// - When confirmed:
//   - Keep profile active
//   - Update last verification date
//   - Recalculate Readiness Score
//   - Recalculate Trust Score
//   - Update Donor Digital Twin data
// - Forecast Metrics:
//   • Next 90-Day Activity Probability
//   • Expected Response Rate
//   • Reliability Prediction
//   • Readiness Trend
//   • 🟢 Highly Active | 🟡 Moderately Active | 🔴 Risk of Becoming Inactive

const storage = require('./storage');

function computeDonorAIForecast(donor) {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const lastActive = donor.lastActiveDate ? new Date(donor.lastActiveDate).getTime() : now;
  const daysSinceActive = Math.max(0, Math.floor((now - lastActive) / DAY_MS));

  const lastDonation = donor.lastDonationDate ? new Date(donor.lastDonationDate).getTime() : 0;
  const daysSinceDonation = lastDonation > 0 ? Math.floor((now - lastDonation) / DAY_MS) : 120;

  const donationsCount = Number(donor.donationsCount) || 0;
  const donationFrequency = donor.donationFrequency || (donationsCount > 0 ? (donationsCount >= 6 ? '3.5 times/yr' : '2.2 times/yr') : '1.0 times/yr');

  const responseRate = Number(donor.responseRate) || (donor.trustScore ? Math.min(99, donor.trustScore + 1) : 95);
  const acceptanceRate = Number(donor.acceptanceRate) || (donor.trustScore ? Math.min(98, donor.trustScore - 3) : 90);

  // Recalculate Readiness Score (0-100) based on biological cooldown (90 days interval)
  let readinessScore = 95;
  if (daysSinceDonation < 56) {
    readinessScore = 40; // Cooldown phase
  } else if (daysSinceDonation < 90) {
    readinessScore = 75; // Approaching optimal readiness
  } else {
    readinessScore = Math.min(100, 92 + Math.min(8, donationsCount));
  }

  if (donor.availability === 'Unavailable' || donor.activityStatus === 'temporarily_unavailable') {
    readinessScore = Math.min(readinessScore, 25);
  }

  // Recalculate Trust Score (0-100)
  let trustScore = Math.round(
    (responseRate * 0.40) +
    (acceptanceRate * 0.30) +
    (Math.min(100, donationsCount * 12) * 0.15) +
    (Math.max(0, 100 - daysSinceActive) * 0.15)
  );
  trustScore = Math.max(60, Math.min(99, trustScore));

  // Next 90-Day Activity Probability
  let probability90Day = 95;
  if (daysSinceActive > 90) {
    probability90Day = Math.max(30, 95 - (daysSinceActive - 90) * 0.8);
  } else {
    probability90Day = Math.min(99, Math.round((responseRate * 0.6) + (acceptanceRate * 0.4)));
  }
  if (donor.activityStatus === 'temporarily_unavailable' || donor.availability === 'Unavailable') {
    probability90Day = Math.min(probability90Day, 40);
  }

  // Expected Response Rate
  const expectedResponseRate = Math.round((responseRate * 0.8) + (probability90Day * 0.2));

  // Reliability Prediction, Readiness Trend, and Indicator Class
  let reliabilityPrediction = 'High';
  let readinessTrend = 'Upward';
  let activityClass = 'highly_active';
  let activityLabel = '🟢 Highly Active';
  let activityLevel = 'High';

  if (donor.activityStatus === 'inactive' || daysSinceActive > 120 || probability90Day < 60) {
    activityClass = 'risk_of_inactive';
    activityLabel = '🔴 Risk of Becoming Inactive';
    activityLevel = 'At Risk';
    reliabilityPrediction = 'Needs Re-engagement';
    readinessTrend = 'Declining';
  } else if (daysSinceActive > 60 || probability90Day < 80 || donor.availability === 'Unavailable' || donor.activityStatus === 'temporarily_unavailable') {
    activityClass = 'moderately_active';
    activityLabel = '🟡 Moderately Active';
    activityLevel = 'Moderate';
    reliabilityPrediction = 'Moderate';
    readinessTrend = 'Stable';
  } else {
    activityClass = 'highly_active';
    activityLabel = '🟢 Highly Active';
    activityLevel = 'High';
    reliabilityPrediction = 'High (Verified Reliable)';
    readinessTrend = 'Upward';
  }

  return {
    probability90Day: Math.round(probability90Day),
    expectedResponseRate: Math.round(expectedResponseRate),
    reliabilityPrediction,
    readinessTrend,
    activityClass,
    activityLabel,
    activityLevel,
    readinessScore,
    trustScore,
    donationFrequency,
    responseRate,
    acceptanceRate,
    daysSinceActive,
    daysSinceDonation,
    lastVerificationDate: donor.lastVerificationDate || donor.lastActiveDate || new Date().toISOString(),
    nextVerificationDate: new Date(Date.now() + 90 * DAY_MS).toISOString()
  };
}

async function runDonorActivityCheck() {
  const donors = await storage.find('donors');
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  for (const donor of donors) {
    const lastActive = donor.lastActiveDate ? new Date(donor.lastActiveDate).getTime() : (donor.createdAt ? new Date(donor.createdAt).getTime() : now);
    const daysSinceActive = Math.floor((now - lastActive) / DAY_MS);

    // Rule 9: 12 months (365 days) inactive -> Mark as Inactive Donor
    if (daysSinceActive >= 365) {
      if (donor.activityStatus !== 'inactive') {
        console.log(`[AI CLEANUP ENGINE] Marking donor ${donor.name} as Inactive (Inactive for ${daysSinceActive} days)`);
        await storage.updateById('donors', donor._id || donor.id, {
          activityStatus: 'inactive',
          searchVisibility: false,
          availability: 'Unavailable',
          archivedAt: new Date().toISOString()
        });

        // Audit log
        await storage.create('auditlogs', {
          userId: donor._id || donor.id,
          userName: donor.name,
          userRole: 'system_ai',
          action: 'DONOR_AUTO_INACTIVATED',
          details: `Donor auto-inactivated after 12 months inactivity (${daysSinceActive} days). Removed from matching grid.`,
          status: 'warning'
        });
      }
    } 
    // Rule 8: AI Activity Check every 90 days
    else if (daysSinceActive >= 90) {
      const remindersSent = donor.remindersSent || 0;
      let reminderType = '90_day_check';
      let message = 'Are you still an active blood donor?';

      if (daysSinceActive >= 150 && remindersSent < 3) {
        reminderType = 'final_reminder';
        message = 'Final Reminder: Are you still an active blood donor? Please confirm to remain in emergency matching.';
      } else if (daysSinceActive >= 120 && remindersSent < 2) {
        reminderType = 'reminder_2';
        message = 'Reminder: Are you still an active blood donor?';
      }

      // Record notification
      const existingNotif = await storage.findOne('notifications', {
        recipientId: donor._id || donor.id,
        type: 'activity_reminder'
      });

      if (!existingNotif) {
        await storage.create('notifications', {
          recipientId: donor._id || donor.id,
          recipientRole: 'donor',
          title: '🤖 BloodLink AI: Active Donor Status Verification',
          message,
          type: 'activity_reminder',
          priority: 'Urgent',
          metadata: { 
            daysSinceActive, 
            reminderType,
            options: ['Yes, I Am Active', 'No, I Am Not Available']
          },
          createdAt: new Date().toISOString()
        });

        await storage.updateById('donors', donor._id || donor.id, {
          remindersSent: remindersSent + 1
        });
      }
    }
  }
}

async function confirmDonorActive(donorId) {
  const donor = await storage.findById('donors', donorId);
  if (!donor) return null;

  const nowIso = new Date().toISOString();
  const forecast = computeDonorAIForecast({
    ...donor,
    lastActiveDate: nowIso,
    lastVerificationDate: nowIso,
    activityStatus: 'active',
    availability: 'Available Now'
  });

  const updated = await storage.updateById('donors', donorId, {
    lastActiveDate: nowIso,
    lastVerificationDate: nowIso,
    activityStatus: 'active',
    availability: 'Available Now',
    searchVisibility: true,
    remindersSent: 0,
    trustScore: forecast.trustScore,
    readinessScore: forecast.readinessScore,
    engagementScore: forecast.trustScore,
    digitalTwin: {
      activityLevel: forecast.activityLevel,
      responseRate: forecast.responseRate,
      acceptanceRate: forecast.acceptanceRate,
      donationFrequency: forecast.donationFrequency,
      lastVerificationDate: nowIso,
      nextVerificationDate: forecast.nextVerificationDate,
      forecast
    }
  });

  // Mark pending activity check notifications as read/resolved
  const notifs = await storage.find('notifications', { recipientId: donorId, type: 'activity_reminder' });
  for (const n of notifs) {
    await storage.updateById('notifications', n._id || n.id, { isRead: true, resolved: true });
  }

  await storage.create('auditlogs', {
    userId: donorId,
    userName: updated?.name || 'Donor',
    userRole: 'donor',
    action: 'DONOR_CONFIRMED_ACTIVE',
    details: `Donor verified active readiness. Readiness: ${forecast.readinessScore}%, Trust: ${forecast.trustScore}%, 90-Day Probability: ${forecast.probability90Day}%.`,
    status: 'success'
  });

  return { ...updated, aiForecast: forecast };
}

async function setDonorUnavailable(donorId) {
  const donor = await storage.findById('donors', donorId);
  if (!donor) return null;

  const nowIso = new Date().toISOString();
  const forecast = computeDonorAIForecast({
    ...donor,
    lastActiveDate: nowIso,
    lastVerificationDate: nowIso,
    activityStatus: 'temporarily_unavailable',
    availability: 'Unavailable'
  });

  const updated = await storage.updateById('donors', donorId, {
    lastActiveDate: nowIso,
    lastVerificationDate: nowIso,
    activityStatus: 'temporarily_unavailable',
    availability: 'Unavailable',
    remindersSent: 0,
    readinessScore: forecast.readinessScore,
    trustScore: forecast.trustScore,
    digitalTwin: {
      activityLevel: forecast.activityLevel,
      responseRate: forecast.responseRate,
      acceptanceRate: forecast.acceptanceRate,
      donationFrequency: forecast.donationFrequency,
      lastVerificationDate: nowIso,
      nextVerificationDate: forecast.nextVerificationDate,
      forecast
    }
  });

  const notifs = await storage.find('notifications', { recipientId: donorId, type: 'activity_reminder' });
  for (const n of notifs) {
    await storage.updateById('notifications', n._id || n.id, { isRead: true, resolved: true });
  }

  await storage.create('auditlogs', {
    userId: donorId,
    userName: updated?.name || 'Donor',
    userRole: 'donor',
    action: 'DONOR_SET_UNAVAILABLE',
    details: 'Donor responded "No, I Am Not Available" in 90-day verification check.',
    status: 'warning'
  });

  return { ...updated, aiForecast: forecast };
}

module.exports = {
  computeDonorAIForecast,
  runDonorActivityCheck,
  confirmDonorActive,
  setDonorUnavailable
};

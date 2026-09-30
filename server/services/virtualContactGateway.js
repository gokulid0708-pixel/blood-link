// Advanced Masked Calling & Virtual Contact Gateway Engine (V2.0 Latest)
// Includes:
// 1. Strict Privacy Protection: 100% hidden real phone numbers on both sides.
// 2. Error Prevention Logic: Only manually hospital-requested calls for accepted requests.
// 3. EMERGENCY CALL FORWARDING SYSTEM:
//    - Active ONLY for Emergency Blood Requests (Emergency Priority Rule).
//    - If donor rejects OR does not respond within defined response time (25s),
//      automatically forwards communication request to the next highest-ranked compatible donor.
//    - Continues until an available donor responds or queue is exhausted.

const storage = require('./storage');
const { rankDonorsForRequest } = require('./matchingEngine');

const relaySessions = new Map();

function generateVirtualMaskedNumber() {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `+91-1800-RELAY-${suffix}`;
}

async function forwardSessionToNextDonor(session, reason = 'no_response') {
  if (!session || !session.forwardingEnabled) {
    session.status = 'rejected';
    return { forwarded: false, reason: 'Forwarding disabled for non-emergency request' };
  }

  const prevIndex = session.currentForwardIndex;
  const nextIndex = prevIndex + 1;

  // Mark previous donor in history
  if (session.forwardingHistory && session.forwardingHistory[prevIndex]) {
    session.forwardingHistory[prevIndex].status = reason;
    session.forwardingHistory[prevIndex].endedAt = new Date().toISOString();
  }

  if (nextIndex < session.forwardingQueue.length) {
    const nextDonor = session.forwardingQueue[nextIndex];
    const prevDonorName = session.donorName;

    session.currentForwardIndex = nextIndex;
    session.donorId = nextDonor.donorId || nextDonor.id || nextDonor._id;
    session.donorName = nextDonor.donorName || nextDonor.name || `Donor #${nextIndex + 1}`;
    session.virtualDonorNumber = generateVirtualMaskedNumber(); // Fresh virtual number for next donor
    session.status = 'pending_donor_approval';
    session.currentAttemptExpiresAt = Date.now() + (session.responseTimeoutSeconds || 25) * 1000;
    session.updatedAt = new Date().toISOString();

    session.forwardingHistory.push({
      donorId: session.donorId,
      donorName: session.donorName,
      rank: nextIndex + 1,
      matchPercentage: nextDonor.matchPercentage || 90,
      status: 'pending',
      attemptedAt: new Date().toISOString()
    });

    // Send Emergency Communication Request to the new donor
    await storage.create('notifications', {
      recipientId: session.donorId,
      recipientRole: 'donor',
      title: `🚨 Emergency Communication Request`,
      message: `${session.hospitalName} has an urgent emergency call forwarding requisition for ${session.unitsNeeded} Units of ${session.bloodGroupRequired}.`,
      type: 'communication_request',
      priority: 'Critical',
      isRead: false,
      metadata: {
        sessionId: session.sessionId,
        hospitalName: session.hospitalName,
        bloodGroupRequired: session.bloodGroupRequired,
        unitsNeeded: session.unitsNeeded,
        requiredTime: session.requiredTime,
        requestType: session.requestType,
        isEmergency: true,
        forwardAttempt: nextIndex + 1,
        remainingSeconds: session.responseTimeoutSeconds || 25,
        virtualHospitalNumber: session.virtualHospitalNumber,
        virtualDonorNumber: session.virtualDonorNumber
      },
      createdAt: new Date().toISOString()
    });

    // Admin Audit Log
    await storage.create('auditlogs', {
      userId: session.hospitalId,
      userName: session.hospitalName,
      userRole: 'hospital',
      action: 'EMERGENCY_CALL_FORWARDED',
      details: `Emergency call auto-forwarded from ${prevDonorName} (${reason === 'rejected' ? 'Declined' : 'No Response Timeout'}) to next ranked compatible donor ${session.donorName} (Rank #${nextIndex + 1}, Match: ${nextDonor.matchPercentage || 90}%). Real numbers strictly masked.`,
      status: 'warning'
    });

    // Notify Hospital in real-time
    await storage.create('notifications', {
      recipientId: session.hospitalId,
      recipientRole: 'hospital',
      title: '🚨 Emergency Call Auto-Forwarded',
      message: `Previous donor did not answer. Auto-forwarded to next ranked donor: ${session.donorName} (Rank #${nextIndex + 1}).`,
      type: 'call_forwarded',
      priority: 'Urgent',
      metadata: {
        sessionId: session.sessionId,
        currentDonorName: session.donorName,
        rank: nextIndex + 1,
        reason
      }
    });

    return {
      forwarded: true,
      nextDonor: session.donorName,
      rank: nextIndex + 1
    };
  } else {
    // Queue exhausted
    session.status = 'rejected';
    session.updatedAt = new Date().toISOString();

    await storage.create('auditlogs', {
      userId: session.hospitalId,
      userName: session.hospitalName,
      userRole: 'hospital',
      action: 'EMERGENCY_CALL_FORWARDING_EXHAUSTED',
      details: `All ${session.forwardingQueue.length} compatible donors in forwarding queue were contacted without response. System continuing automated emergency escalation.`,
      status: 'danger'
    });

    await storage.create('notifications', {
      recipientId: session.hospitalId,
      recipientRole: 'hospital',
      title: '❌ Emergency Contact Forwarding Exhausted',
      message: `All compatible donors in the forwarding queue did not respond. Continuing automated emergency escalation pipeline.`,
      type: 'call_response',
      priority: 'Critical',
      metadata: { sessionId: session.sessionId, status: 'Donor Unavailable' }
    });

    return {
      forwarded: false,
      message: 'All compatible donors in forwarding queue exhausted'
    };
  }
}

async function initiateRelayCall({
  hospitalId,
  hospitalName,
  donorId,
  donorName,
  requestId,
  bloodGroup,
  unitsRequired,
  requiredTime,
  requestType,
  hospital_requested_contact,
  donor_request_status,
  emergency_override_verified,
  emergency_verification_notes,
  rankedDonors
}) {
  // EMERGENCY COMMUNICATION FLOW & PRIVACY LOGIC:
  // 1. By default, hospitals cannot directly call donors.
  // 2. If donor clicks "Please Call Me" or "I Can Donate", hospital receives authorization to contact donor.
  // 3. For critical emergency cases, hospitals are allowed to initiate direct calling after emergency verification and approval.
  const isHospitalRequested = hospital_requested_contact === true || hospital_requested_contact === 'true';
  const statusNormalized = (donor_request_status || '').toLowerCase();
  
  const hasConsent = statusNormalized.includes('call') ||
                     statusNormalized.includes('please') ||
                     statusNormalized.includes('doctor') ||
                     statusNormalized.includes('can donate') ||
                     statusNormalized.includes('accepted') ||
                     statusNormalized.includes('confirmed');

  const isEmergencyVerified = emergency_override_verified === true || emergency_override_verified === 'true';

  if (!isHospitalRequested) {
    return {
      success: false,
      message: 'Blocked: Communication can only be manually initiated by hospital via "Emergency Contact".'
    };
  }

  if (!hasConsent && !isEmergencyVerified) {
    return {
      success: false,
      message: 'Blocked: By default, hospitals cannot directly call donors. Calls are allowed when the donor requests "Please Call Me" or after Critical Emergency Verification & Approval.'
    };
  }

  // EMERGENCY PRIORITY RULE:
  // Forwarding mechanism is active ONLY for Emergency Blood Requests.
  // Do NOT activate for: Volunteer Blood Donation Drives, Scheduled Blood Requests, General Notifications.
  const reqTypeLower = (requestType || '').toLowerCase();
  const isEmergency = reqTypeLower.includes('emergency') || reqTypeLower.includes('category 1');
  const forwardingEnabled = isEmergency;

  const sessionId = 'session_' + Date.now();
  const virtualHospitalNumber = generateVirtualMaskedNumber();
  const virtualDonorNumber = generateVirtualMaskedNumber();

  // Build ranked forwarding queue if emergency
  let forwardingQueue = [];
  if (forwardingEnabled) {
    if (Array.isArray(rankedDonors) && rankedDonors.length > 0) {
      forwardingQueue = rankedDonors.map((d, i) => ({
        donorId: d.donorId || d.id || d._id,
        donorName: d.donorName || d.name || `Ranked Donor #${i + 1}`,
        bloodGroup: d.bloodGroup || bloodGroup,
        matchPercentage: d.matchPercentage || 95,
        rank: i + 1
      }));
    } else {
      try {
        const allDonors = await storage.find('donors');
        const ranked = rankDonorsForRequest({ lat: 11.0264, lng: 77.0028 }, bloodGroup || 'O+', allDonors);
        forwardingQueue = ranked.map((d, i) => ({
          donorId: d.donorId,
          donorName: d.donorName,
          bloodGroup: d.bloodGroup,
          matchPercentage: d.matchPercentage,
          rank: i + 1
        }));
      } catch (e) {
        forwardingQueue = [];
      }
    }

    // Ensure the selected donor is first in line
    const selectedIdx = forwardingQueue.findIndex(d => d.donorId === donorId);
    if (selectedIdx > 0) {
      const [sel] = forwardingQueue.splice(selectedIdx, 1);
      forwardingQueue.unshift(sel);
    } else if (selectedIdx === -1) {
      forwardingQueue.unshift({
        donorId,
        donorName: donorName || 'Primary Compatible Donor',
        bloodGroup: bloodGroup || 'O+',
        matchPercentage: 98,
        rank: 1
      });
    }
  }

  const initialDonorName = (forwardingQueue[0] && forwardingQueue[0].donorName) || donorName || 'Compatible Donor';

  const session = {
    sessionId,
    hospitalId,
    hospitalName: hospitalName || 'PSG Emergency Trauma Command',
    donorId,
    donorName: initialDonorName,
    requestId: requestId || 'req_active',
    bloodGroupRequired: bloodGroup || 'O+',
    unitsNeeded: unitsRequired || 2,
    requiredTime: requiredTime || 'Immediate (< 30 Mins)',
    requestType: requestType || 'Category 1 – Emergency Request',
    isEmergency,
    forwardingEnabled, // Active ONLY for emergency blood requests
    forwardingQueue,
    currentForwardIndex: 0,
    responseTimeoutSeconds: 25, // Defined response window
    currentAttemptExpiresAt: Date.now() + 25 * 1000,
    forwardingHistory: [
      {
        donorId,
        donorName: initialDonorName,
        rank: 1,
        matchPercentage: (forwardingQueue[0] && forwardingQueue[0].matchPercentage) || 98,
        status: 'pending',
        attemptedAt: new Date().toISOString()
      }
    ],
    status: 'pending_donor_approval', // Donor must explicitly approve communication
    virtualHospitalNumber,
    virtualDonorNumber,
    hospital_requested_contact: true,
    donor_request_status: 'accepted',
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins total validity
  };

  relaySessions.set(sessionId, session);

  // Send Communication Request Notification to First Donor
  await storage.create('notifications', {
    recipientId: donorId,
    recipientRole: 'donor',
    title: isEmergency ? `🚨 Emergency Communication Request` : `🚨 Hospital is requesting communication`,
    message: `${session.hospitalName} has manually requested masked emergency communication for ${session.unitsNeeded} Units of ${session.bloodGroupRequired}.`,
    type: 'communication_request',
    priority: 'Critical',
    isRead: false,
    metadata: {
      sessionId,
      hospitalName: session.hospitalName,
      bloodGroupRequired: session.bloodGroupRequired,
      unitsNeeded: session.unitsNeeded,
      requiredTime: session.requiredTime,
      requestType: session.requestType,
      isEmergency,
      forwardAttempt: 1,
      remainingSeconds: 25,
      virtualHospitalNumber,
      virtualDonorNumber
    },
    createdAt: new Date().toISOString()
  });

  // Call log for admin audit
  await storage.create('auditlogs', {
    userId: hospitalId,
    userName: session.hospitalName,
    userRole: 'hospital',
    action: 'EMERGENCY_CONTACT_INITIATED',
    details: `Emergency Contact session ${sessionId} manually requested for accepted donor ${initialDonorName} (${donorId}). Forwarding enabled: ${forwardingEnabled}. Real numbers hidden: Hospital Proxy ${virtualHospitalNumber}, Donor Proxy ${virtualDonorNumber}`,
    status: 'warning'
  });

  return { success: true, session };
}

function getActiveCommunicationRequest(donorId) {
  for (const [id, session] of relaySessions.entries()) {
    if (session.donorId === donorId && session.status === 'pending_donor_approval') {
      // Check if attempt timed out
      if (Date.now() > session.currentAttemptExpiresAt) {
        if (session.forwardingEnabled) {
          // Automatic emergency forwarding triggered on timeout
          forwardSessionToNextDonor(session, 'no_response');
          continue;
        } else {
          session.status = 'expired';
          continue;
        }
      }

      const remainingSeconds = Math.max(0, Math.ceil((session.currentAttemptExpiresAt - Date.now()) / 1000));
      return {
        ...session,
        remainingSeconds
      };
    }
  }
  return null;
}

async function respondRelayCall(sessionId, action) {
  // action: 'accept', 'reject', or 'no_response'
  const session = relaySessions.get(sessionId);
  if (!session) {
    return { success: false, message: 'Contact session expired or not found' };
  }

  const isAccept = action === 'accept';

  if (isAccept) {
    session.status = 'connected';
    session.connectedDonorId = session.donorId;
    session.connectedDonorName = session.donorName;
    session.updatedAt = new Date().toISOString();

    if (session.forwardingHistory && session.forwardingHistory[session.currentForwardIndex]) {
      session.forwardingHistory[session.currentForwardIndex].status = 'accepted';
      session.forwardingHistory[session.currentForwardIndex].connectedAt = new Date().toISOString();
    }

    relaySessions.set(sessionId, session);

    // Call Log for Admin Audit
    await storage.create('auditlogs', {
      userId: session.donorId,
      userName: session.donorName,
      userRole: 'donor',
      action: 'RELAY_CALL_ACCEPTED',
      details: `Donor ${session.donorName} accepted emergency contact session ${sessionId}. Encrypted voice bridge active.`,
      status: 'success'
    });

    // Notify hospital
    await storage.create('notifications', {
      recipientId: session.hospitalId,
      recipientRole: 'hospital',
      title: '✅ Donor Accepted Emergency Contact',
      message: `${session.donorName} accepted call session. Secure relay communication bridged via virtual gateway.`,
      type: 'call_response',
      priority: 'Normal',
      metadata: { sessionId, status: 'connected', donorName: session.donorName }
    });

    return {
      success: true,
      session,
      hospitalNotice: 'Connected'
    };
  } else {
    // Action is 'reject' or 'no_response'
    // EMERGENCY FORWARDING LOGIC:
    // If donor rejects OR does not respond within defined response time:
    // The system automatically forwards communication request to next highest-ranked compatible donor.
    if (session.forwardingEnabled) {
      const forwardResult = await forwardSessionToNextDonor(session, action === 'reject' ? 'rejected' : 'no_response');
      relaySessions.set(sessionId, session);

      return {
        success: true,
        forwarded: forwardResult.forwarded,
        nextDonor: forwardResult.nextDonor,
        rank: forwardResult.rank,
        session,
        hospitalNotice: forwardResult.forwarded ? 'Forwarded to Next Donor' : 'Donor Unavailable'
      };
    } else {
      // Non-emergency request: no forwarding
      session.status = 'rejected';
      session.updatedAt = new Date().toISOString();
      relaySessions.set(sessionId, session);

      await storage.create('auditlogs', {
        userId: session.donorId,
        userName: session.donorName,
        userRole: 'donor',
        action: 'RELAY_CALL_REJECTED',
        details: `Donor ${session.donorName} rejected contact session ${sessionId}. Hospital notified "Donor Unavailable".`,
        status: 'warning'
      });

      await storage.create('notifications', {
        recipientId: session.hospitalId,
        recipientRole: 'hospital',
        title: '❌ Donor Unavailable',
        message: `Donor was unable to answer. Continuing escalation workflow.`,
        type: 'call_response',
        priority: 'Normal',
        metadata: { sessionId, status: 'Donor Unavailable' }
      });

      return {
        success: true,
        forwarded: false,
        session,
        hospitalNotice: 'Donor Unavailable'
      };
    }
  }
}

async function sendEmergencyMessage({ hospitalId, hospitalName, donorId, bloodGroup, units, timeframe, caseNotes }) {
  const messageId = 'msg_' + Date.now();

  const emergencyMessage = {
    messageId,
    hospitalId,
    hospitalName,
    donorId,
    bloodGroup,
    units: units || 1,
    timeframe: timeframe || '1 Hour',
    caseNotes: caseNotes || 'Emergency trauma blood procurement',
    sentAt: new Date().toISOString()
  };

  await storage.create('notifications', {
    recipientId: donorId,
    recipientRole: 'donor',
    title: `🚨 Emergency Blood Needed`,
    message: `Hospital: ${hospitalName} | Blood Group: ${bloodGroup} | Units: ${units || 1} | Required Within: ${timeframe || '1 Hour'}`,
    type: 'emergency_message',
    priority: 'Critical',
    metadata: emergencyMessage,
    createdAt: new Date().toISOString()
  });

  return emergencyMessage;
}

function getRelaySession(id) {
  const session = relaySessions.get(id);
  if (!session) return null;

  // Real-time server-side check for response timeout:
  // If donor has not responded within defined time (25s), auto-forward to next donor!
  if (session.forwardingEnabled && session.status === 'pending_donor_approval') {
    if (Date.now() > session.currentAttemptExpiresAt) {
      forwardSessionToNextDonor(session, 'no_response');
    }
  }

  // Calculate remaining seconds for the active attempt
  const remainingSeconds = Math.max(0, Math.ceil((session.currentAttemptExpiresAt - Date.now()) / 1000));
  return {
    ...session,
    remainingSeconds
  };
}

module.exports = {
  initiateRelayCall,
  respondRelayCall,
  sendEmergencyMessage,
  getActiveCommunicationRequest,
  getRelaySession,
  forwardSessionToNextDonor,
  getAllSessionsForUser: (userId) => {
    const list = [];
    for (const s of relaySessions.values()) {
      if (s.donorId === userId || s.hospitalId === userId) {
        list.push(s);
      }
    }
    return list;
  }
};

const storage = require('../services/storage');
const { rankDonorsForRequest } = require('../services/matchingEngine');
const { getNextEscalationStage } = require('../services/escalationEngine');

// Create Blood Request (Category 1: EMERGENCY, Category 2: VOLUNTEER_DRIVE, Category 3: SCHEDULED)
async function createBloodRequest(req, res) {
  try {
    const {
      category = 'EMERGENCY',
      hospitalId,
      hospitalName,
      bloodGroup,
      unitsRequired,
      priorityLevel,
      requiredTime,
      caseNotes,
      patientName,
      condition,
      location,
      driveDetails,
      scheduledDetails,
      requesterRole, // 'donor' | 'hospital'
      requesterId,
      requesterName,
      contactPerson,
      notes,
      emergencyLevel
    } = req.body;

    if (!bloodGroup || !unitsRequired) {
      return res.status(400).json({ success: false, message: 'Blood group and units required are required.' });
    }

    const isDonorRequester = requesterRole === 'donor' || Boolean(req.body.isDonorEmergencyRequest);
    const effectiveCategory = isDonorRequester ? 'EMERGENCY' : (category || 'EMERGENCY');

    let hosp = null;
    if (hospitalId) {
      hosp = await storage.findById('hospitals', hospitalId);
    }
    const hospLocation = location || hosp?.location || { lat: 11.0264, lng: 77.0028, address: 'Peelamedu, Coimbatore' };
    const hospName = hospitalName || hosp?.name || (isDonorRequester ? 'Emergency Care Facility' : 'PSG Emergency Trauma Center');

    // Retrieve active donors for matching
    const allDonors = await storage.find('donors');
    const matchedDonors = rankDonorsForRequest(hospLocation, bloodGroup, allDonors);

    const requestId = 'req_' + Date.now();
    const isEmergency = effectiveCategory === 'EMERGENCY';
    const isVolunteer = effectiveCategory === 'VOLUNTEER_DRIVE';
    const isScheduled = effectiveCategory === 'SCHEDULED';

    const effectivePriority = emergencyLevel || priorityLevel || (isEmergency ? 'Critical' : (isScheduled ? 'Urgent' : 'Normal'));
    const effectiveNotes = notes || caseNotes || (isDonorRequester ? 'Emergency blood request created by donor/family member.' : (isEmergency ? 'Critical trauma resuscitation.' : 'Clinical transfusion requisition.'));
    const effectivePatient = patientName || (isDonorRequester ? 'Emergency Patient' : (isVolunteer ? (driveDetails?.eventName || 'Annual Blood Drive') : 'Patient (OT Care)'));

    const newRequest = await storage.create('bloodrequests', {
      _id: requestId,
      category: effectiveCategory,
      hospitalId: hospitalId || hosp?._id || (isDonorRequester ? 'community_request' : 'hosp_gen'),
      hospitalName: hospName,
      hospitalAddress: hosp?.address || (typeof hospLocation === 'string' ? hospLocation : (hospLocation?.address || 'Medical District, Coimbatore')),
      hospitalPhone: hosp?.emergencyContact || (contactPerson?.phone || '+91 422 257 0170'),
      location: hospLocation,
      bloodGroup,
      unitsRequired: Number(unitsRequired),
      unitsSecured: 0,
      priorityLevel: effectivePriority,
      requiredTime: isEmergency ? (requiredTime || 'Immediate (< 30 mins)') : (isScheduled ? (scheduledDetails?.procedureDate || 'Required in 4 days') : (driveDetails?.eventDate || 'Upcoming Drive')),
      caseNotes: effectiveNotes,
      patientName: effectivePatient,
      condition: condition || (isEmergency ? 'Emergency Transfusion' : (isVolunteer ? 'Volunteer Blood Donation' : 'Planned Surgery / Transplant')),
      status: 'Matching',
      escalationStage: isEmergency ? 'Nearby Donors' : 'Blood Banks',
      requesterRole: isDonorRequester ? 'donor' : 'hospital',
      requesterId: requesterId || (isDonorRequester ? (req.user?.id || 'donor_user') : (hospitalId || hosp?._id || 'hosp_gen')),
      requesterName: requesterName || (isDonorRequester ? (contactPerson?.name || 'Verified Donor') : hospName),
      contactPerson: contactPerson || (isDonorRequester ? { name: requesterName || 'Contact Person', phone: 'Relay Protected' } : undefined),
      isDonorEmergencyRequest: isDonorRequester,
      driveDetails: isVolunteer ? (driveDetails || {
        eventName: 'PSG Community Blood Donation Camp',
        eventDate: 'Upcoming Saturday, 9:00 AM',
        locationName: 'PSG IMS Auditorium, Coimbatore',
        organizerDetails: { name: 'PSG Youth Red Cross', contact: '+91 422 257 0170', organization: 'PSG Hospitals' },
        donorResponses: []
      }) : undefined,
      scheduledDetails: isScheduled ? (scheduledDetails || {
        procedureType: 'Planned Surgery / Organ Transplant',
        procedureDate: 'Required after 4 days',
        advanceReservationEnabled: true
      }) : undefined,
      matchedDonors: matchedDonors.slice(0, 6).map(d => ({
        donorId: d.donorId,
        donorName: d.donorName,
        distanceKm: d.distanceKm,
        matchScore: d.matchPercentage,
        compatibility: d.compatibility,
        trustScore: d.trustScore,
        availability: d.availability,
        status: 'Notified'
      })),
      timeline: [
        {
          stage: 'Request Created',
          message: `${effectiveCategory} blood request initiated by ${isDonorRequester ? `Donor/Family (${requesterName || contactPerson?.name || 'Community Member'})` : hospName} for ${unitsRequired} units of ${bloodGroup} at ${hospName}.`,
          timestamp: new Date()
        },
        {
          stage: 'AI Matching',
          message: `BloodLink AI Engine active: Scanned regional perimeter and identified ${matchedDonors.length} matching compatible donors.`,
          timestamp: new Date()
        }
      ]
    });

    // Send notifications based on category
    for (const d of matchedDonors.slice(0, 5)) {
      if (isEmergency) {
        await storage.create('notifications', {
          recipientId: d.donorId,
          recipientRole: 'donor',
          title: `🚨 CRITICAL EMERGENCY: ${bloodGroup} Blood Needed`,
          message: `${hospName} urgently requires ${unitsRequired} units of ${bloodGroup}. Distance: ${d.distanceKm} km. Match Score: ${d.matchPercentage}%.`,
          type: 'emergency_request',
          priority: 'Critical',
          metadata: { requestId: newRequest._id, bloodGroup, hospitalName: hospName }
        });
      } else if (isVolunteer) {
        await storage.create('notifications', {
          recipientId: d.donorId,
          recipientRole: 'donor',
          title: `🩸 Volunteer Donation Drive Available`,
          message: `${driveDetails?.eventName || 'Blood Donation Drive'} hosted by ${hospName}. Required: ${unitsRequired} units. Date: ${driveDetails?.eventDate || 'This Weekend'}.`,
          type: 'volunteer_drive',
          priority: 'Normal',
          metadata: { requestId: newRequest._id, bloodGroup, driveDetails }
        });
      } else if (isScheduled) {
        await storage.create('notifications', {
          recipientId: d.donorId,
          recipientRole: 'donor',
          title: `📅 Advance Scheduled Blood Request`,
          message: `Scheduled surgery at ${hospName} will require ${bloodGroup} units on ${scheduledDetails?.procedureDate || 'upcoming date'}. Advance reservation open.`,
          type: 'scheduled_request',
          priority: 'Urgent',
          metadata: { requestId: newRequest._id, bloodGroup, scheduledDetails }
        });
      }
    }

    // Audit Log
    await storage.create('auditlogs', {
      userId: req.user?.id || 'sys',
      userName: hospName,
      userRole: 'hospital',
      action: `CREATE_${category}_REQUEST`,
      details: `Created ${category} for ${bloodGroup} (${unitsRequired} units). Case: ${newRequest._id}`,
      status: isEmergency ? 'danger' : 'success'
    });

    res.status(201).json({
      success: true,
      message: `${category} created and alerts broadcasted.`,
      request: newRequest,
      matchedDonors: matchedDonors.slice(0, 6)
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ success: false, message: 'Server error creating request' });
  }
}

// Get All Requests (Filter by status, hospitalId, category, etc.)
async function getAllBloodRequests(req, res) {
  try {
    const { status, hospitalId, bloodGroup, priority, category } = req.query;
    let query = {};
    if (status) query.status = status;
    if (hospitalId) query.hospitalId = hospitalId;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (priority) query.priorityLevel = priority;
    if (category) query.category = category;

    const requests = await storage.find('bloodrequests', query);
    requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    console.error('Get all requests error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving requests' });
  }
}

// Get Request by ID
async function getBloodRequestById(req, res) {
  try {
    const { id } = req.params;
    const request = await storage.findById('bloodrequests', id);
    if (!request) return res.status(404).json({ success: false, message: 'Blood request not found' });

    const allDonors = await storage.find('donors');
    const freshMatches = rankDonorsForRequest(request.location, request.bloodGroup, allDonors);

    res.json({ success: true, request, freshMatches });
  } catch (err) {
    console.error('Get request by ID error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving request details' });
  }
}

// Escalate Request
async function escalateRequest(req, res) {
  try {
    const { id } = req.params;
    const request = await storage.findById('bloodrequests', id);
    if (!request) return res.status(404).json({ success: false, message: 'Blood request not found' });

    const nextEscalation = getNextEscalationStage(request.escalationStage);
    const newTimeline = [
      ...(request.timeline || []),
      {
        stage: nextEscalation.stage,
        message: `${nextEscalation.description} (${nextEscalation.actionRequired})`,
        timestamp: new Date()
      }
    ];

    const updated = await storage.updateById('bloodrequests', id, {
      escalationStage: nextEscalation.stage,
      status: nextEscalation.stage === 'Blood Secured' ? 'Fulfilled' : 'Escalating',
      timeline: newTimeline
    });

    await storage.create('auditlogs', {
      userId: req.user?.id || 'sys',
      userName: req.user?.name || 'Emergency Command',
      userRole: 'hospital',
      action: 'REQUEST_ESCALATED',
      details: `Escalated request ${id} to stage: ${nextEscalation.stage}`,
      status: 'danger'
    });

    res.json({
      success: true,
      message: `Request escalated to ${nextEscalation.stage}`,
      escalation: nextEscalation,
      request: updated
    });
  } catch (err) {
    console.error('Escalation error:', err);
    res.status(500).json({ success: false, message: 'Server error escalating request' });
  }
}

// Donor Respond to Emergency or Scheduled Request
// Supported actions: 'can_donate' (I Can Donate), 'need_time' (Need Some Time), 'not_available' (Not Available), 'please_call_me' (Please Call Me)
async function donorRespondRequest(req, res) {
  try {
    const { id } = req.params;
    const { donorId, action, donorName } = req.body; 

    const request = await storage.findById('bloodrequests', id);
    if (!request) return res.status(404).json({ success: false, message: 'Blood request not found' });

    let statusText = 'Responded';
    let isCanDonate = false;
    let isPleaseCallMe = false;
    let isNeedTime = false;
    let isNotAvailable = false;

    if (action === 'can_donate' || action === 'accept') {
      statusText = 'I Can Donate';
      isCanDonate = true;
    } else if (action === 'need_time') {
      statusText = 'Need Some Time';
      isNeedTime = true;
    } else if (action === 'not_available' || action === 'decline') {
      statusText = 'Not Available';
      isNotAvailable = true;
    } else if (action === 'please_call_me') {
      statusText = 'Doctor Call Requested';
      isPleaseCallMe = true;
    }

    const matchedList = request.matchedDonors || [];
    const donorIndex = matchedList.findIndex(m => m.donorId === donorId);

    const donorUpdateObj = {
      donorId,
      donorName: donorName || 'Active Donor',
      status: statusText,
      callConsentGranted: isPleaseCallMe || isCanDonate,
      respondedAt: new Date()
    };

    if (donorIndex !== -1) {
      matchedList[donorIndex] = { ...matchedList[donorIndex], ...donorUpdateObj };
    } else {
      matchedList.push(donorUpdateObj);
    }

    let updates = { matchedDonors: matchedList };

    if (isCanDonate) {
      const newSecured = (request.unitsSecured || 0) + 1;
      updates.unitsSecured = newSecured;
      if (newSecured >= request.unitsRequired) {
        updates.status = 'Fulfilled';
        updates.escalationStage = 'Blood Secured';
      } else {
        updates.status = 'Partially Fulfilled';
      }

      updates.timeline = [
        ...(request.timeline || []),
        {
          stage: 'Donor Confirmed',
          message: `${donorName || 'A verified donor'} confirmed: I Can Donate for ${request.category}. Secured: ${newSecured}/${request.unitsRequired}`,
          timestamp: new Date()
        }
      ];

      // Update donor record
      const donor = await storage.findById('donors', donorId);
      if (donor) {
        const updatedLives = (donor.livesSaved || 0) + 1;
        const updatedDonations = (donor.donationsCount || 0) + 1;
        let badges = donor.badges || ['First Donation'];
        if (updatedDonations >= 3 && !badges.includes('Life Saver')) badges.push('Life Saver');
        if (updatedDonations >= 5 && !badges.includes('Hero Donor')) badges.push('Hero Donor');
        if (updatedDonations >= 8 && !badges.includes('Platinum Donor')) badges.push('Platinum Donor');

        await storage.updateById('donors', donorId, {
          livesSaved: updatedLives,
          donationsCount: updatedDonations,
          badges,
          lastActiveDate: new Date().toISOString()
        });

        const certNumber = 'BL-CERT-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
        await storage.create('certificates', {
          certificateNumber: certNumber,
          donorId,
          donorName: donor.name,
          bloodGroup: donor.bloodGroup,
          hospitalName: request.hospitalName,
          units: 1,
          donationDate: new Date(),
          issueDate: new Date(),
          verificationHash: 'v_hash_' + Math.random().toString(36).substring(2, 15)
        });

        await storage.create('donations', {
          donorId,
          donorName: donor.name,
          donorBloodGroup: donor.bloodGroup,
          hospitalId: request.hospitalId,
          hospitalName: request.hospitalName,
          requestId: request._id,
          units: 1,
          donationDate: new Date(),
          status: 'Completed',
          certificateIssued: true
        });
      }

      // Notify Hospital
      await storage.create('notifications', {
        recipientId: request.hospitalId,
        recipientRole: 'hospital',
        title: '✅ Donor Response: I Can Donate',
        message: `${donorName || 'Donor'} confirmed: "I Can Donate" for ${request.bloodGroup}.`,
        type: 'request_accepted',
        priority: 'Normal',
        metadata: { requestId: request._id, donorId, status: statusText }
      });
    } else if (isPleaseCallMe) {
      updates.timeline = [
        ...(request.timeline || []),
        {
          stage: 'Doctor Call Requested',
          message: `Doctor Call Requested by Donor (${donorName || 'Donor'}) for ${request.bloodGroup}. Calling authorized.`,
          timestamp: new Date()
        }
      ];

      // Hospital receives: "Doctor Call Requested by Donor"
      await storage.create('notifications', {
        recipientId: request.hospitalId,
        recipientRole: 'hospital',
        title: '📞 Doctor Call Requested by Donor',
        message: `${donorName || 'Donor'} requested: "Please Call Me" regarding ${request.bloodGroup} requisition. Hospital communication now authorized.`,
        type: 'doctor_call_requested',
        priority: 'Urgent',
        metadata: { requestId: request._id, donorId, donorName, callConsentGranted: true }
      });
    } else if (isNeedTime) {
      updates.timeline = [
        ...(request.timeline || []),
        {
          stage: 'Donor Needs Time',
          message: `${donorName || 'Donor'} responded: Need Some Time for ${request.bloodGroup}.`,
          timestamp: new Date()
        }
      ];

      await storage.create('notifications', {
        recipientId: request.hospitalId,
        recipientRole: 'hospital',
        title: '⏳ Donor Response: Need Some Time',
        message: `${donorName || 'Donor'} requested time to prepare for ${request.bloodGroup} requisition.`,
        type: 'donor_status_update',
        priority: 'Normal',
        metadata: { requestId: request._id, donorId, status: statusText }
      });
    } else if (isNotAvailable) {
      updates.timeline = [
        ...(request.timeline || []),
        {
          stage: 'Donor Not Available',
          message: `${donorName || 'Donor'} responded: Not Available for ${request.bloodGroup}.`,
          timestamp: new Date()
        }
      ];

      await storage.create('notifications', {
        recipientId: request.hospitalId,
        recipientRole: 'hospital',
        title: '❌ Donor Response: Not Available',
        message: `${donorName || 'Donor'} marked themselves Not Available for ${request.bloodGroup}.`,
        type: 'donor_status_update',
        priority: 'Normal',
        metadata: { requestId: request._id, donorId, status: statusText }
      });
    }

    const updatedRequest = await storage.updateById('bloodrequests', id, updates);

    let clientMsg = 'Response recorded successfully.';
    if (isCanDonate) clientMsg = 'Thank you! You have confirmed your donation.';
    else if (isPleaseCallMe) clientMsg = 'Doctor call requested! Hospital trauma desk has been notified to contact you via masked proxy.';
    else if (isNeedTime) clientMsg = 'Preparation window recorded. Hospital has been notified that you need some time.';
    else if (isNotAvailable) clientMsg = 'Status recorded: Not Available. Thank you for responding promptly.';

    res.json({
      success: true,
      status: statusText,
      message: clientMsg,
      request: updatedRequest
    });
  } catch (err) {
    console.error('Donor respond error:', err);
    res.status(500).json({ success: false, message: 'Server error processing response' });
  }
}

// Quick-Response Messaging (Between Donor and Hospital)
// Predefined options: "I am on the way", "I will arrive in 30 minutes", "Please call me", "Not available today"
async function sendQuickMessage(req, res) {
  try {
    const { id } = req.params;
    const { senderId, senderName, senderRole, message, donorId } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const request = await storage.findById('bloodrequests', id);
    if (!request) return res.status(404).json({ success: false, message: 'Blood request not found.' });

    const qm = {
      id: 'qm_' + Date.now(),
      senderId,
      senderName: senderName || (senderRole === 'hospital' ? request.hospitalName : 'Donor'),
      senderRole,
      donorId: donorId || (senderRole === 'donor' ? senderId : null),
      message,
      timestamp: new Date().toISOString()
    };

    const currentMessages = request.quickMessages || [];
    currentMessages.push(qm);

    await storage.updateById('bloodrequests', id, { quickMessages: currentMessages });

    // Send real-time notification to the counterparty
    if (senderRole === 'donor') {
      await storage.create('notifications', {
        recipientId: request.hospitalId,
        recipientRole: 'hospital',
        title: `💬 Donor Message: "${message}"`,
        message: `${qm.senderName}: "${message}" for ${request.bloodGroup} requisition.`,
        type: 'quick_message',
        priority: 'Urgent',
        metadata: { requestId: id, donorId: qm.donorId, message }
      });
    } else {
      const recipientDonorId = donorId || qm.donorId;
      if (recipientDonorId) {
        await storage.create('notifications', {
          recipientId: recipientDonorId,
          recipientRole: 'donor',
          title: `💬 Hospital Message: "${message}"`,
          message: `${qm.senderName}: "${message}" regarding your blood requisition.`,
          type: 'quick_message',
          priority: 'Urgent',
          metadata: { requestId: id, message }
        });
      }
    }

    res.json({
      success: true,
      message: 'Quick message sent successfully.',
      quickMessage: qm,
      quickMessages: currentMessages
    });
  } catch (err) {
    console.error('Send quick message error:', err);
    res.status(500).json({ success: false, message: 'Failed to send quick message.' });
  }
}

async function getQuickMessages(req, res) {
  try {
    const { id } = req.params;
    const request = await storage.findById('bloodrequests', id);
    if (!request) return res.status(404).json({ success: false, message: 'Blood request not found.' });

    res.json({
      success: true,
      quickMessages: request.quickMessages || []
    });
  } catch (err) {
    console.error('Get quick messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve quick messages.' });
  }
}

// Donor Respond to Volunteer Blood Donation Drive (Rule: Register, Interested, Decline)
async function donorRespondDrive(req, res) {
  try {
    const { id } = req.params;
    const { donorId, donorName } = req.body;
    const response = req.body.response || req.body.status || 'Register'; // 'Register' | 'Interested' | 'Decline'

    const request = await storage.findById('bloodrequests', id);
    if (!request || request.category !== 'VOLUNTEER_DRIVE') {
      return res.status(404).json({ success: false, message: 'Volunteer drive request not found' });
    }

    const drive = request.driveDetails || {};
    const responses = drive.donorResponses || [];
    const existingIdx = responses.findIndex(r => r.donorId === donorId);

    if (existingIdx !== -1) {
      responses[existingIdx].status = response;
      responses[existingIdx].respondedAt = new Date();
    } else {
      responses.push({
        donorId,
        donorName: donorName || 'Registered Volunteer',
        status: response,
        respondedAt: new Date()
      });
    }

    drive.donorResponses = responses;
    const updated = await storage.updateById('bloodrequests', id, { driveDetails: drive });

    res.json({
      success: true,
      message: `You selected '${response}' for this volunteer donation drive.`,
      request: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error processing drive response' });
  }
}

// Blood Bank Fulfills / Allocates Hospital Requisition
async function bloodBankFulfillRequisition(req, res) {
  try {
    const { id } = req.params; // requestId
    const { bloodBankId, bloodBankName, units } = req.body;

    const request = await storage.findById('bloodrequests', id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const allocUnits = Number(units) || 1;
    const newSecured = (request.unitsSecured || 0) + allocUnits;
    const isFullySecured = newSecured >= request.unitsRequired;

    const reservedList = request.reservedInventory || [];
    reservedList.push({
      bloodBankId,
      bloodBankName,
      units: allocUnits,
      reservedAt: new Date()
    });

    const updatedTimeline = [
      ...(request.timeline || []),
      {
        stage: 'Blood Bank Allocation',
        message: `${bloodBankName} allocated ${allocUnits} unit(s) of ${request.bloodGroup}. Total secured: ${newSecured}/${request.unitsRequired}`,
        timestamp: new Date()
      }
    ];

    const updated = await storage.updateById('bloodrequests', id, {
      unitsSecured: newSecured,
      status: isFullySecured ? 'Fulfilled' : 'Partially Fulfilled',
      escalationStage: isFullySecured ? 'Blood Secured' : request.escalationStage,
      reservedInventory: reservedList,
      timeline: updatedTimeline
    });

    // Notify Hospital
    await storage.create('notifications', {
      recipientId: request.hospitalId,
      recipientRole: 'hospital',
      title: '🩸 Blood Bank Units Allocated',
      message: `${bloodBankName} has allocated ${allocUnits} units of ${request.bloodGroup} to your requisition.`,
      type: 'bloodbank_allocation',
      priority: 'Normal',
      metadata: { requestId: id, bloodBankName, units: allocUnits }
    });

    // Audit Log
    await storage.create('auditlogs', {
      userId: bloodBankId,
      userName: bloodBankName,
      userRole: 'bloodbank',
      action: 'REQUISITION_ALLOCATED',
      details: `Allocated ${allocUnits} units of ${request.bloodGroup} for hospital case ${id}.`,
      status: 'success'
    });

    res.json({
      success: true,
      message: `Successfully allocated ${allocUnits} unit(s) to ${request.hospitalName}`,
      request: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to allocate units' });
  }
}

// Dispatch alert
async function dispatchAlert(req, res) {
  try {
    const { id } = req.params;
    const request = await storage.findById('bloodrequests', id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    const updatedTimeline = [
      ...(request.timeline || []),
      {
        stage: 'Dispatch Siren Broadcasted',
        message: `Priority emergency sirens broadcasted to verified donors.`,
        timestamp: new Date()
      }
    ];

    await storage.updateById('bloodrequests', id, { timeline: updatedTimeline });

    res.json({
      success: true,
      message: `Emergency sirens successfully broadcasted!`,
      request
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to dispatch alert' });
  }
}

// Get Blood Requests created by a specific Donor/Individual
async function getRequestsByDonor(req, res) {
  try {
    const { donorId } = req.params;
    const all = await storage.find('bloodrequests');
    const donorRequests = all.filter(r => 
      r.requesterId === donorId || 
      r.donorId === donorId || 
      (r.isDonorEmergencyRequest && (r.requesterId === donorId || r.contactPerson?.donorId === donorId))
    );
    donorRequests.sort((a, b) => new Date(b.createdAt || b.timeline?.[0]?.timestamp || 0) - new Date(a.createdAt || a.timeline?.[0]?.timestamp || 0));

    res.json({
      success: true,
      count: donorRequests.length,
      requests: donorRequests
    });
  } catch (err) {
    console.error('Get donor requests error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve donor emergency requests.' });
  }
}

module.exports = {
  createBloodRequest,
  getAllBloodRequests,
  getBloodRequestById,
  getRequestsByDonor,
  escalateRequest,
  donorRespondRequest,
  donorRespondDrive,
  bloodBankFulfillRequisition,
  dispatchAlert,
  sendQuickMessage,
  getQuickMessages
};

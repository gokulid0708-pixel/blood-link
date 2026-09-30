const { 
  initiateRelayCall, 
  respondRelayCall, 
  sendEmergencyMessage, 
  getAllSessionsForUser,
  getActiveCommunicationRequest,
  getRelaySession 
} = require('../services/virtualContactGateway');

async function handleInitiateCall(req, res) {
  try {
    const { 
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
    } = req.body;

    if (!hospitalId || !donorId) {
      return res.status(400).json({ success: false, message: 'hospitalId and donorId are required' });
    }

    const sessionResult = await initiateRelayCall({
      hospitalId,
      hospitalName: hospitalName || 'Emergency Trauma Command',
      donorId,
      donorName,
      requestId,
      bloodGroup: bloodGroup || 'O+',
      unitsRequired: unitsRequired || 1,
      requiredTime: requiredTime || 'Immediate (< 30 Mins)',
      requestType: requestType || 'Category 1 – Emergency Request',
      hospital_requested_contact: hospital_requested_contact !== false,
      donor_request_status: donor_request_status || 'Accepted',
      emergency_override_verified,
      emergency_verification_notes,
      rankedDonors
    });

    if (!sessionResult.success) {
      return res.status(400).json(sessionResult);
    }

    res.json({
      success: true,
      message: 'Communication request generated. Awaiting donor explicit approval.',
      session: sessionResult.session
    });
  } catch (err) {
    console.error('Relay call error:', err);
    res.status(500).json({ success: false, message: 'Failed to initiate secure relay call' });
  }
}

async function handleGetActiveRequest(req, res) {
  try {
    const { donorId } = req.params;
    const activeRequest = getActiveCommunicationRequest(donorId);
    res.json({ success: true, activeRequest });
  } catch (err) {
    console.error('Get active request error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving active communication request' });
  }
}

async function handleRespondCall(req, res) {
  try {
    const { sessionId, action } = req.body;
    if (!sessionId || !action) {
      return res.status(400).json({ success: false, message: 'sessionId and action (accept/reject/no_response) required' });
    }

    const result = await respondRelayCall(sessionId, action);
    res.json(result);
  } catch (err) {
    console.error('Respond call error:', err);
    res.status(500).json({ success: false, message: 'Error processing call response' });
  }
}

async function handleSendMessage(req, res) {
  try {
    const { hospitalId, hospitalName, donorId, bloodGroup, units, timeframe, caseNotes } = req.body;
    if (!hospitalId || !donorId || !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Missing required message parameters' });
    }

    const message = await sendEmergencyMessage({
      hospitalId,
      hospitalName: hospitalName || 'Emergency Hospital',
      donorId,
      bloodGroup,
      units,
      timeframe,
      caseNotes
    });

    res.json({
      success: true,
      message: 'Priority emergency message dispatched to donor with instant popup alert.',
      emergencyMessage: message
    });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ success: false, message: 'Error dispatching emergency message' });
  }
}

async function handleGetSessions(req, res) {
  try {
    const { userId } = req.params;
    const sessions = getAllSessionsForUser(userId);
    res.json({ success: true, sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error retrieving sessions' });
  }
}

async function handleGetSessionById(req, res) {
  try {
    const { sessionId } = req.params;
    const session = getRelaySession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.json({ success: true, session });
  } catch (err) {
    console.error('Get session by ID error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving session' });
  }
}

module.exports = {
  handleInitiateCall,
  handleRespondCall,
  handleSendMessage,
  handleGetSessions,
  handleGetActiveRequest,
  handleGetSessionById
};

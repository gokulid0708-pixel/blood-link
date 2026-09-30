// Centralized API Client for BloodLink AI V2.0 (Privacy-First)

const API_BASE = '/api';

const headers = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  // Auth
  login: async (email, password, role) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    return res.json();
  },

  registerDonor: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register/donor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  registerHospital: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register/hospital`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  registerBloodBank: async (data) => {
    const res = await fetch(`${API_BASE}/auth/register/bloodbank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  requestOtp: async (email) => {
    const res = await fetch(`${API_BASE}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return res.json();
  },

  verifyOtp: async (email, otp) => {
    const res = await fetch(`${API_BASE}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    return res.json();
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, { headers: headers() });
    return res.json();
  },

  // Requests
  getRequests: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/requests?${query}`, { headers: headers() });
    return res.json();
  },

  getRequestById: async (id) => {
    const res = await fetch(`${API_BASE}/requests/${id}`, { headers: headers() });
    return res.json();
  },

  createRequest: async (data) => {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  escalateRequest: async (id) => {
    const res = await fetch(`${API_BASE}/requests/${id}/escalate`, {
      method: 'POST',
      headers: headers()
    });
    return res.json();
  },

  donorRespondRequest: async (requestId, donorId, action, donorName) => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/respond`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ donorId, action, donorName })
    });
    return res.json();
  },

  respondDrive: async (requestId, donorId, status, donorName) => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/respond-drive`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ donorId, status, donorName })
    });
    return res.json();
  },

  fulfillRequisition: async (requestId, bloodBankId, units) => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/fulfill-requisition`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ bloodBankId, units })
    });
    return res.json();
  },

  dispatchAlert: async (requestId, donorIds) => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/dispatch`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ donorIds })
    });
    return res.json();
  },

  sendQuickMessage: async (requestId, data) => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/quick-message`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getQuickMessages: async (requestId) => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/quick-messages`, { headers: headers() });
    return res.json();
  },

  // Smart Matching Engine (Privacy-First)
  calculateMatches: async (data) => {
    const res = await fetch(`${API_BASE}/match/calculate`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Virtual Contact Gateway & Relay (Rules 6, 7)
  initiateRelayCall: async (data) => {
    const res = await fetch(`${API_BASE}/relay/initiate-call`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  respondRelayCall: async (sessionId, action) => {
    const res = await fetch(`${API_BASE}/relay/respond-call`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ sessionId, action })
    });
    return res.json();
  },

  sendEmergencyMessage: async (data) => {
    const res = await fetch(`${API_BASE}/relay/send-message`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  getRelaySessions: async (userId) => {
    const res = await fetch(`${API_BASE}/relay/sessions/${userId}`, { headers: headers() });
    return res.json();
  },

  getActiveRelayRequest: async (donorId) => {
    const res = await fetch(`${API_BASE}/relay/active-request/${donorId}`, { headers: headers() });
    return res.json();
  },

  getRelaySession: async (sessionId) => {
    const res = await fetch(`${API_BASE}/relay/session/${sessionId}`, { headers: headers() });
    return res.json();
  },

  // Blood Bank Inventory
  getAllInventories: async () => {
    const res = await fetch(`${API_BASE}/inventory`, { headers: headers() });
    return res.json();
  },

  getBloodBankInventory: async (id) => {
    const res = await fetch(`${API_BASE}/inventory/${id}`, { headers: headers() });
    return res.json();
  },

  updateInventoryAction: async (bloodBankId, bloodGroup, action, units) => {
    const res = await fetch(`${API_BASE}/inventory/${bloodBankId}/action`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ bloodGroup, action, units })
    });
    return res.json();
  },

  // Donor Actions
  getAllDonors: async () => {
    const res = await fetch(`${API_BASE}/donors`, { headers: headers() });
    return res.json();
  },

  updateAvailability: async (donorId, availability) => {
    const res = await fetch(`${API_BASE}/donors/${donorId}/availability`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ availability })
    });
    return res.json();
  },

  getDonorFeed: async (donorId) => {
    const res = await fetch(`${API_BASE}/donors/${donorId}/feed`, { headers: headers() });
    return res.json();
  },

  getDonorHistory: async (donorId) => {
    const res = await fetch(`${API_BASE}/donors/${donorId}/history`, { headers: headers() });
    return res.json();
  },

  getDonorNotifications: async (donorId) => {
    const res = await fetch(`${API_BASE}/donors/${donorId}/notifications`, { headers: headers() });
    return res.json();
  },

  confirmDonorActive: async (donorId) => {
    const res = await fetch(`${API_BASE}/donors/${donorId}/confirm-active`, {
      method: 'POST',
      headers: headers()
    });
    return res.json();
  },

  setTemporarilyUnavailable: async (donorId) => {
    const res = await fetch(`${API_BASE}/donors/${donorId}/temporarily-unavailable`, {
      method: 'POST',
      headers: headers()
    });
    return res.json();
  },

  getDonorBloodRequests: async (donorId) => {
    const res = await fetch(`${API_BASE}/requests/donor/${donorId}`, { headers: headers() });
    return res.json();
  },

  // Admin Verification & Audit
  getAdminOverview: async () => {
    const res = await fetch(`${API_BASE}/admin/overview`, { headers: headers() });
    return res.json();
  },

  getVerificationQueue: async () => {
    const res = await fetch(`${API_BASE}/admin/verification-queue`, { headers: headers() });
    return res.json();
  },

  verifyEntity: async (entityType, entityId, status, action) => {
    const res = await fetch(`${API_BASE}/admin/verify`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ entityType, entityId, status, action })
    });
    return res.json();
  },

  getAuditLogs: async () => {
    const res = await fetch(`${API_BASE}/admin/auditlogs`, { headers: headers() });
    return res.json();
  }
};

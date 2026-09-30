const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const storage = require('../services/storage');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { generateOTP, sendOtpEmail, verifyOTP } = require('../services/otpService');

// Donor Registration
async function registerDonor(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone,
      dob,
      bloodGroup,
      currentLocation,
      workingLocation,
      aadhaarNumber,
      emergencyContact,
      lastDonationDate
    } = req.body;

    if (!email || !password || !name || !bloodGroup) {
      return res.status(400).json({ success: false, message: 'Please provide all mandatory fields (name, email, password, bloodGroup).' });
    }

    const existingUser = await storage.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_' + Date.now();
    const donorId = 'donor_' + Date.now();

    const newUser = await storage.create('users', {
      _id: userId,
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'donor',
      name,
      phone,
      isVerified: false,
      status: 'active'
    });

    // Default coords if not supplied (Peelamedu, Coimbatore area)
    const lat = currentLocation?.lat || 11.0250 + (Math.random() - 0.5) * 0.05;
    const lng = currentLocation?.lng || 77.0000 + (Math.random() - 0.5) * 0.05;

    const newDonor = await storage.create('donors', {
      _id: donorId,
      userId,
      name,
      email: email.toLowerCase(),
      phone,
      dob,
      bloodGroup,
      currentLocation: {
        lat,
        lng,
        address: currentLocation?.address || 'Coimbatore Central'
      },
      workingLocation: workingLocation || { lat, lng, address: 'Coimbatore Hub' },
      aadhaarNumber: aadhaarNumber || 'XXXX-XXXX-9999',
      aadhaarStatus: 'verified',
      emergencyContact: emergencyContact || { name: 'Emergency Contact', phone: phone, relation: 'Family' },
      lastDonationDate: lastDonationDate ? new Date(lastDonationDate) : new Date(Date.now() - 100 * 86400000),
      availability: 'Available Now',
      trustScore: 95,
      livesSaved: 0,
      donationsCount: 0,
      badges: ['First Donation'],
      isVerified: true
    });

    // Send initial verification OTP
    const otp = generateOTP();
    await sendOtpEmail(email, otp);

    const token = jwt.sign(
      { id: userId, email: newUser.email, role: 'donor', name: newUser.name, donorId: donorId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Donor account registered successfully. Verification code dispatched.',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: 'donor',
        donorId: donorId,
        profile: newDonor
      },
      otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, message: 'Server error registering donor' });
  }
}

// Hospital Registration
async function registerHospital(req, res) {
  try {
    const {
      name,
      email,
      password,
      licenseNumber,
      address,
      emergencyContact,
      location,
      type
    } = req.body;

    if (!email || !password || !name || !licenseNumber) {
      return res.status(400).json({ success: false, message: 'Please provide all mandatory hospital fields.' });
    }

    const existingUser = await storage.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_hosp_' + Date.now();
    const hospId = 'hosp_' + Date.now();

    const newUser = await storage.create('users', {
      _id: userId,
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'hospital',
      name,
      phone: emergencyContact,
      isVerified: true,
      status: 'active'
    });

    const lat = location?.lat || 11.0200 + (Math.random() - 0.5) * 0.04;
    const lng = location?.lng || 77.0000 + (Math.random() - 0.5) * 0.04;

    const newHospital = await storage.create('hospitals', {
      _id: hospId,
      userId,
      name,
      email: email.toLowerCase(),
      licenseNumber,
      address: address || 'Emergency Medical Avenue, Coimbatore',
      emergencyContact: emergencyContact || '+91 422 250 0000',
      type: type || 'Emergency & Trauma Center',
      location: { lat, lng, address: address || 'Coimbatore' },
      verificationStatus: 'verified'
    });

    const token = jwt.sign(
      { id: userId, email: newUser.email, role: 'hospital', name: newUser.name, hospitalId: hospId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Hospital registered and verified successfully.',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: 'hospital',
        hospitalId: hospId,
        profile: newHospital
      }
    });
  } catch (err) {
    console.error('Hospital registration error:', err);
    res.status(500).json({ success: false, message: 'Server error registering hospital' });
  }
}

// Blood Bank Registration
async function registerBloodBank(req, res) {
  try {
    const {
      name,
      email,
      password,
      licenseNumber,
      address,
      storageCapacity,
      location
    } = req.body;

    if (!email || !password || !name || !licenseNumber) {
      return res.status(400).json({ success: false, message: 'Please provide all mandatory blood bank fields.' });
    }

    const existingUser = await storage.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = 'usr_bb_' + Date.now();
    const bbId = 'bb_' + Date.now();

    const newUser = await storage.create('users', {
      _id: userId,
      email: email.toLowerCase(),
      password: passwordHash,
      role: 'bloodbank',
      name,
      isVerified: true,
      status: 'active'
    });

    const lat = location?.lat || 11.0100 + (Math.random() - 0.5) * 0.04;
    const lng = location?.lng || 76.9700 + (Math.random() - 0.5) * 0.04;

    const defaultInventory = [
      { bloodGroup: 'A+', availableUnits: 20, reservedUnits: 2, minThreshold: 10 },
      { bloodGroup: 'A-', availableUnits: 6, reservedUnits: 1, minThreshold: 5 },
      { bloodGroup: 'B+', availableUnits: 25, reservedUnits: 3, minThreshold: 10 },
      { bloodGroup: 'B-', availableUnits: 5, reservedUnits: 0, minThreshold: 5 },
      { bloodGroup: 'AB+', availableUnits: 12, reservedUnits: 1, minThreshold: 5 },
      { bloodGroup: 'AB-', availableUnits: 3, reservedUnits: 0, minThreshold: 4 },
      { bloodGroup: 'O+', availableUnits: 30, reservedUnits: 5, minThreshold: 12 },
      { bloodGroup: 'O-', availableUnits: 4, reservedUnits: 1, minThreshold: 6 }
    ];

    const newBloodBank = await storage.create('bloodbanks', {
      _id: bbId,
      userId,
      name,
      email: email.toLowerCase(),
      licenseNumber,
      address: address || 'Medical Enclave, Coimbatore',
      storageCapacity: Number(storageCapacity) || 1500,
      location: { lat, lng, address: address || 'Coimbatore' },
      inventory: defaultInventory,
      verificationStatus: 'verified'
    });

    const token = jwt.sign(
      { id: userId, email: newUser.email, role: 'bloodbank', name: newUser.name, bloodBankId: bbId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Blood Bank registered successfully.',
      token,
      user: {
        id: userId,
        name: newUser.name,
        email: newUser.email,
        role: 'bloodbank',
        bloodBankId: bbId,
        profile: newBloodBank
      }
    });
  } catch (err) {
    console.error('Blood Bank registration error:', err);
    res.status(500).json({ success: false, message: 'Server error registering blood bank' });
  }
}

// User Login (All Roles)
async function login(req, res) {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await storage.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Account exists as role '${user.role}', not '${role}'` });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    let profile = null;
    let extraIdField = {};

    if (user.role === 'donor') {
      profile = await storage.findOne('donors', { email: user.email }) ||
                await storage.findOne('donors', { userId: user._id || user.id });
      if (profile) extraIdField.donorId = profile._id || profile.id;
    } else if (user.role === 'hospital') {
      profile = await storage.findOne('hospitals', { email: user.email }) ||
                await storage.findOne('hospitals', { userId: user._id || user.id });
      if (profile) extraIdField.hospitalId = profile._id || profile.id;
    } else if (user.role === 'bloodbank') {
      profile = await storage.findOne('bloodbanks', { email: user.email }) ||
                await storage.findOne('bloodbanks', { userId: user._id || user.id });
      if (profile) extraIdField.bloodBankId = profile._id || profile.id;
    }

    const token = jwt.sign(
      { id: user._id || user.id, email: user.email, role: user.role, name: user.name, ...extraIdField },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: `Welcome back, ${user.name}`,
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        ...extraIdField,
        profile
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
}

// Request OTP endpoint
async function requestOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const otp = generateOTP();
    const result = await sendOtpEmail(email, otp);

    res.json({
      success: true,
      message: `Verification OTP dispatched to ${email}`,
      mode: result.mode,
      otpPreview: process.env.NODE_ENV !== 'production' ? otp : undefined
    });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ success: false, message: 'Could not send verification OTP' });
  }
}

// Verify OTP endpoint
async function verifyOtpCode(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
    }

    const result = verifyOTP(email, otp);
    if (!result.success) {
      return res.status(400).json(result);
    }

    // Mark user as verified if user exists
    const user = await storage.findOne('users', { email: email.toLowerCase() });
    if (user) {
      await storage.updateById('users', user._id || user.id, { isVerified: true });
    }

    res.json({
      success: true,
      message: 'OTP verified successfully! Account confirmed.'
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    res.status(500).json({ success: false, message: 'Server error verifying OTP' });
  }
}

// Get Current User Profile
async function getProfile(req, res) {
  try {
    let user = await storage.findById('users', req.user.id);
    if (!user && req.user.email) {
      user = await storage.findOne('users', { email: req.user.email.toLowerCase() });
    }

    if (!user && req.user) {
      user = {
        _id: req.user.id,
        id: req.user.id,
        name: req.user.name || req.user.email.split('@')[0],
        email: req.user.email,
        role: req.user.role || 'donor',
        isVerified: true,
        status: 'active'
      };
    }

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    let profile = null;
    if (user.role === 'donor') {
      profile = await storage.findOne('donors', { email: user.email }) ||
                await storage.findOne('donors', { userId: user._id || user.id });
    } else if (user.role === 'hospital') {
      profile = await storage.findOne('hospitals', { email: user.email }) ||
                await storage.findOne('hospitals', { userId: user._id || user.id });
    } else if (user.role === 'bloodbank') {
      profile = await storage.findOne('bloodbanks', { email: user.email }) ||
                await storage.findOne('bloodbanks', { userId: user._id || user.id });
    }

    res.json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        status: user.status,
        profile
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Error retrieving user profile' });
  }
}

module.exports = {
  registerDonor,
  registerHospital,
  registerBloodBank,
  login,
  requestOtp,
  verifyOtpCode,
  getProfile
};

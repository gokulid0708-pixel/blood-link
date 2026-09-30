const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_saving_lives_jwt_key_2026';

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  // 1. Verify with Supabase Auth if client is configured
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        req.user = {
          id: user.id,
          userId: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'donor',
          name: user.user_metadata?.name || user.email.split('@')[0],
          phone: user.user_metadata?.phone || '',
          ...user.user_metadata
        };
        return next();
      }
    } catch (sbErr) {
      // Continue to local JWT check fallback
    }
  }

  // 2. Fallback: Verify local / seeded demo JWT tokens
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Requires one of roles: ${roles.join(', ')}` 
      });
    }
    next();
  };
}

module.exports = {
  authMiddleware,
  requireRole,
  JWT_SECRET
};

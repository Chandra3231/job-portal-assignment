const { verifyToken } = require('../utils/jwt');
const db = require('../models/db');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).redirect('/login');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).redirect('/login');
    }

    const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
    if (users.length === 0) {
      return res.status(401).redirect('/login');
    }

    req.user = users[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).redirect('/login');
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        user: req.user
      });
    }
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const [users] = await db.execute('SELECT * FROM users WHERE id = ?', [decoded.userId]);
        if (users.length > 0) {
          req.user = users[0];
        }
      }
    }
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next();
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth
};
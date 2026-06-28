const jwt = require('jsonwebtoken');
const Account = require('../models/accountModel');
const Manager = require('../models/Manager');

const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Managers are stored in the DDS collection, not Account
    if (decoded.role === 'manager') {
      const manager = await Manager.findById(decoded.id);
      if (!manager) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      req.user = {
        _id: manager._id,
        id: manager._id,
        role: 'manager',
        managerType: decoded.managerType || manager.managerType,
      };
    } else {
      req.user = await Account.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user?.role}' is not authorized for this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };

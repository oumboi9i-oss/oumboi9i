const express = require('express');
const router  = express.Router();
const Account = require('../../models/accountModel');
const { protect, authorize } = require('../../middleware/authMiddleware');

// GET pending (unapproved) accounts
// Admin: sees all pending accounts
// Manager: sees only pending accounts matching their managerType
router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    let query = { isActive: false, role: { $ne: 'admin' } };

    if (req.user.role === 'manager') {
      if (!req.user.managerType) {
        return res.json({ success: true, accounts: [], warning: 'No managerType assigned. Contact admin.' });
      }
      query = { isActive: false, role: req.user.managerType };
    }

    const pending = await Account.find(query).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, accounts: pending });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

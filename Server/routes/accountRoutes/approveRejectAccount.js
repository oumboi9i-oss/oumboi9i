const express     = require('express');
const router      = express.Router();
const Account     = require('../../models/accountModel');
const Doctor      = require('../../models/DoctorModel');
const Nurse       = require('../../models/nurseModel');
const Pharmacist  = require('../../models/pharmacistModel');
const FireFighter = require('../../models/FireFighters');
const Manager     = require('../../models/Manager');
const { protect, authorize } = require('../../middleware/authMiddleware');

const canManage = (reqUser, accountRole) => {
  if (reqUser.role === 'admin') return true;
  if (reqUser.role === 'manager') return reqUser.managerType === accountRole;
  return false;
};

// PUT /api/account/:id/approve
router.put('/:id/approve', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const account = await Account.findById(req.params.id).select('-password');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    if (!canManage(req.user, account.role)) {
      return res.status(403).json({ success: false, message: `You can only approve ${req.user.managerType} accounts` });
    }

    account.isActive = true;
    await account.save();

    res.json({ success: true, message: '✅ Account approved', account });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/account/:id/reject
router.delete('/:id/reject', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    if (!canManage(req.user, account.role)) {
      return res.status(403).json({ success: false, message: `You can only reject ${req.user.managerType} accounts` });
    }

    const modelMap = {
      doctor:      { model: Doctor,      field: 'email' },
      nurse:       { model: Nurse,       field: 'gmail' },
      pharmacist:  { model: Pharmacist,  field: 'gmail' },
      firefighter: { model: FireFighter, field: 'gmail' },
      manager:     { model: Manager,     field: 'email' },
    };

    const entry = modelMap[account.role];
    if (entry) await entry.model.deleteOne({ [entry.field]: account.email });

    await Account.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '🗑️ Account rejected and removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

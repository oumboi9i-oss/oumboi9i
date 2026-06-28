// Server/routes/accountRoutes/getUserProfile.js
const express = require('express');
const router  = express.Router();
const Doctor     = require('../../models/DoctorModel');
const Nurse      = require('../../models/nurseModel');
const FireFighter = require('../../models/FireFighters');
const Pharmacist = require('../../models/pharmacistModel');

const VALID_ROLES = ['doctor', 'nurse', 'firefighter', 'pharmacist'];
const MODELS = { doctor: Doctor, nurse: Nurse, firefighter: FireFighter, pharmacist: Pharmacist };

// GET /api/user/profile/:id?role=doctor|nurse|firefighter|pharmacist
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.query;
  if (!VALID_ROLES.includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const Model = MODELS[role];
  try {
    let user = null;

    // Try by MongoDB _id first
    try {
      user = await Model.findById(id).select('-password');
    } catch (_castErr) {
      // id is not a valid ObjectId — fall through to name-based search
    }

    // Fallback: search by known identifier fields
    if (!user) {
      user = await Model.findOne({
        $or: [
          { userId: id },
          { matricule: id },
          { numOrdre: id },
          { numAgrement: id },
          { email: id },
          { gmail: id },
        ],
      }).select('-password');
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ ...user.toObject(), _role: role });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

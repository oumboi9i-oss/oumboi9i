const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Account     = require('../../models/accountModel');
const Doctor      = require('../../models/DoctorModel');
const Nurse       = require('../../models/nurseModel');
const Pharmacist  = require('../../models/pharmacistModel');
const FireFighter = require('../../models/FireFighters');

const ROLE_MODELS = {
  doctor:      { Model: Doctor,      emailField: 'email' },
  nurse:       { Model: Nurse,       emailField: 'gmail' },
  pharmacist:  { Model: Pharmacist,  emailField: 'gmail' },
  firefighter: { Model: FireFighter, emailField: 'gmail' },
};

router.patch('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token' });
    }
    const decoded = jwt.verify(
      authHeader.split(' ')[1],
      process.env.JWT_SECRET || 'your_secret_key'
    );
    const { id: profileId, role } = decoded;

    const config = ROLE_MODELS[role];
    if (!config) {
      return res.status(400).json({ success: false, message: 'Role not supported for location setup' });
    }

    const { wilaya, facilityName, lat, lng } = req.body;
    if (!wilaya || !facilityName || lat == null || lng == null) {
      return res.status(400).json({ success: false, message: 'wilaya, facilityName, lat, and lng are required' });
    }

    const profile = await config.Model.findByIdAndUpdate(
      profileId,
      { wilaya, location: facilityName, lat, lng },
      { new: true }
    );
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const userEmail = profile[config.emailField];
    await Account.findOneAndUpdate({ email: userEmail }, { locationSet: true });

    res.json({ success: true, message: 'Location saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

module.exports = router;

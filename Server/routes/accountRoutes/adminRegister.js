const express     = require('express');
const router      = express.Router();
const Account     = require('../../models/accountModel');
const Doctor      = require('../../models/DoctorModel');
const Nurse       = require('../../models/nurseModel');
const Pharmacist  = require('../../models/pharmacistModel');
const FireFighter = require('../../models/FireFighters');
const Manager     = require('../../models/Manager');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Admin-only — accounts are pre-approved (isActive: true)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { email, password, role, ...otherData } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: '⚠️ يرجى ملء جميع الحقول' });
    }

    if (role.toLowerCase() === 'manager' && !otherData.managerType) {
      return res.status(400).json({ success: false, message: '⚠️ managerType is required for managers (doctor/nurse/pharmacist/firefighter)' });
    }

    const existing = await Account.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: '⚠️ هذا الإيميل مستخدم بالفعل' });
    }

    const newAccount = new Account({ email: email.toLowerCase(), password, role, isActive: true });
    await newAccount.save();

    try {
      let newRecord;
      switch (role.toLowerCase()) {
        case 'doctor':
          newRecord = new Doctor({ userId: newAccount._id, email: email.toLowerCase(), fullName: otherData.fullName, specialty: otherData.specialty, numOrdre: otherData.numOrdre, location: otherData.location || '', lat: otherData.lat || null, lng: otherData.lng || null, isAvailable: true, password });
          break;
        case 'nurse':
          newRecord = new Nurse({ userId: newAccount._id, gmail: email.toLowerCase(), diplome: otherData.diplome, service: otherData.service, equipe: otherData.equipe, location: otherData.location || '', lat: otherData.lat || null, lng: otherData.lng || null, password });
          break;
        case 'pharmacist':
          newRecord = new Pharmacist({ userId: newAccount._id, gmail: email.toLowerCase(), nomPharmacie: otherData.nomPharmacie, adressePharmacie: otherData.adressePharmacie || otherData.location || '', numAgrement: otherData.numAgrement, location: otherData.location || '', lat: otherData.lat || null, lng: otherData.lng || null, password });
          break;
        case 'firefighter':
          newRecord = new FireFighter({ userId: newAccount._id, gmail: email.toLowerCase(), matricule: otherData.matricule, grade: otherData.grade, uniteIntervention: otherData.uniteIntervention, location: otherData.location || '', lat: otherData.lat || null, lng: otherData.lng || null, password });
          break;
        case 'manager':
          newRecord = new Manager({ userId: newAccount._id, email: email.toLowerCase(), fullName: otherData.fullName, managerType: otherData.managerType, position: otherData.position || 'Manager', location: otherData.location || '', lat: otherData.lat || null, lng: otherData.lng || null, password });
          break;
        default:
          await Account.findByIdAndDelete(newAccount._id);
          return res.status(400).json({ success: false, message: '⚠️ دور غير صالح' });
      }

      if (newRecord) await newRecord.save();

      res.status(201).json({ success: true, message: '✅ Account created and approved!', user: { id: newAccount._id, email: newAccount.email, role: newAccount.role } });

    } catch (modelError) {
      await Account.findByIdAndDelete(newAccount._id);
      throw modelError;
    }
  } catch (error) {
    console.error('❌ Admin registration error:', error);
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', error: error.message });
  }
});

module.exports = router;

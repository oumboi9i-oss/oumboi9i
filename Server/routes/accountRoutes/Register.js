const express     = require('express');
const router      = express.Router();
const Account     = require('../../models/accountModel');
const Doctor      = require('../../models/DoctorModel');
const Nurse       = require('../../models/nurseModel');
const Pharmacist  = require('../../models/pharmacistModel');
const FireFighter = require('../../models/FireFighters');
const Manager     = require('../../models/Manager');

router.post('/', async (req, res) => {
  try {
    const { email, password, role, ...otherData } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: '⚠️ يرجى ملء جميع الحقول' });
    }

    if (role.toLowerCase() === 'manager') {
      return res.status(403).json({ success: false, message: '⚠️ Manager accounts can only be created by an admin.' });
    }

    const existingAccount = await Account.findOne({ email: email.toLowerCase() });
    if (existingAccount) {
      return res.status(409).json({ success: false, message: '⚠️ هذا الإيميل مستخدم بالفعل' });
    }

    // isActive: false — pending admin/manager approval
    const newAccount = new Account({ email: email.toLowerCase(), password, role, isActive: false });
    await newAccount.save();

    try {
      let newRecord;

      switch (role.toLowerCase()) {
        case 'doctor':
          newRecord = new Doctor({
            userId:      newAccount._id,
            email:       email.toLowerCase(),
            fullName:    otherData.fullName,
            specialty:   otherData.specialty,
            numOrdre:    otherData.numOrdre,
            location:    otherData.location || '',
            lat:         otherData.lat  || null,
            lng:         otherData.lng  || null,
            isAvailable: true,
            password,
          });
          break;

        case 'nurse':
          newRecord = new Nurse({
            userId:   newAccount._id,
            fullName: otherData.fullName,
            gmail:    email.toLowerCase(),
            diplome:  otherData.diplome,
            service:  otherData.service,
            equipe:   otherData.equipe,
            password,
          });
          break;

        case 'pharmacist':
          newRecord = new Pharmacist({
            userId:       newAccount._id,
            fullName:     otherData.fullName,
            gmail:        email.toLowerCase(),
            nomPharmacie: otherData.nomPharmacie,
            numAgrement:  otherData.numAgrement,
            password,
          });
          break;

        case 'firefighter':
          newRecord = new FireFighter({
            userId:            newAccount._id,
            fullName:          otherData.fullName,
            gmail:             email.toLowerCase(),
            matricule:         otherData.matricule,
            grade:             otherData.grade,
            uniteIntervention: otherData.uniteIntervention,
            password,
          });
          break;

        case 'manager':
          newRecord = new Manager({
            userId:   newAccount._id,
            email:    email.toLowerCase(),
            fullName: otherData.fullName,
            position: otherData.position || 'Director',
            location: otherData.location || '',
            lat:      otherData.lat  || null,
            lng:      otherData.lng  || null,
            password,
          });
          break;

        default:
          await Account.findByIdAndDelete(newAccount._id);
          return res.status(400).json({ success: false, message: '⚠️ دور غير صالح' });
      }

      if (newRecord) await newRecord.save();

      try {
  const Notification = require('../../models/Notification');
 const adminAccounts = await Account.find({ role: { $in: ['admin', 'manager'] } }).select('_id');
  const roleEmoji = { doctor: '👨‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒' };
  const emoji = roleEmoji[role.toLowerCase()] || '👤';
  await Promise.all(
    adminAccounts.map(admin =>
      Notification.create({
        userId:  admin._id.toString(),
        type:    'account_request',
        message: `${emoji} طلب حساب جديد — ${role} : ${email.toLowerCase()}`,
        read:    false,
      })
    )
  );
} catch (notifError) {
  console.error('Notification error:', notifError.message);
}

      res.status(201).json({
        pending: true,
        message: '✅ Account created! Waiting for admin/manager approval before you can log in.'
      });

    } catch (modelError) {
      await Account.findByIdAndDelete(newAccount._id);
      throw modelError;
    }

  } catch (error) {
    console.error('❌ Registration error:', error); // ✅ Added logging
    res.status(500).json({ success: false, message: 'خطأ في السيرفر', error: error.message });
  }
});

module.exports = router;
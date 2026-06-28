const express = require('express');
const router = express.Router();
const Doctor = require('../../models/DoctorModel');

// ✅ المسار: POST /api/doctor/add
router.post('/', async (req, res) => {
    try {
        const { fullName, email, password, specialty, numOrdre, location, isAvailable } = req.body;

        console.log('📝 Received data:', { fullName, email, specialty, numOrdre, location });

        if (!fullName || !email || !password || !specialty || !numOrdre || !location) {
            return res.status(400).json({ 
                success: false, 
                message: '⚠️ Please fill in all required fields' 
            });
        }

        const existingDoctor = await Doctor.findOne({ email: email.toLowerCase() });
        if (existingDoctor) {
            return res.status(400).json({ 
                success: false, 
                message: 'هذا الإيميل مستخدم بالفعل' 
            });
        }

        const doctor = new Doctor({
            fullName,
            email: email.toLowerCase(),
            password,
            specialty,
            numOrdre,
            location,
            isAvailable: isAvailable || false
        });

        await doctor.save();
        
        console.log('✅ Doctor added successfully:', doctor.email);
        
        res.status(201).json({ 
            success: true, 
            message: 'Doctor added successfully',
            doctor: {
                id: doctor._id,
                fullName: doctor.fullName,
                email: doctor.email
            }
        });
        
    } catch (error) {
        console.error('❌ Error adding doctor:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Nurse = require('../../models/nurseModel');

// ✅ المسار: POST /api/nurse/add
router.post('/', async (req, res) => {
    try {
        const { gmail, password, diplome, service, equipe } = req.body;

        console.log('📝 Received nurse data:', { gmail, diplome, service });

        // ✅ ماعدناش userId هنا، حيت غادي يتولد وحدو
        if (!gmail || !password || !diplome || !service || !equipe) {
            return res.status(400).json({
                success: false,
                message: '⚠️ Please fill in all required fields'
            });
        }

        const existingNurse = await Nurse.findOne({ gmail: gmail.toLowerCase() });
        if (existingNurse) {
            return res.status(400).json({
                success: false,
                message: 'هذا الإيميل مستخدم بالفعل'
            });
        }

        // ✅ كنولدو userId أوتوماتيكيا (مثلا: NRS-7f3a9c2b)
        const generatedUserId = 'NRS-' + crypto.randomBytes(4).toString('hex');

        const nurse = new Nurse({
            userId: generatedUserId, // ✅ هنا كنستعملو الـ id المولود
            gmail: gmail.toLowerCase(),
            password,
            diplome,
            service,
            equipe
        });

        await nurse.save();

        console.log('✅ Nurse added successfully:', nurse.gmail, '| userId:', nurse.userId);

        res.status(201).json({
            success: true,
            message: 'Nurse added successfully',
            nurse: {
                id: nurse._id,
                userId: nurse.userId,
                gmail: nurse.gmail,
                diplome: nurse.diplome
            }
        });

    } catch (error) {
        console.error('❌ Error adding nurse:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

module.exports = router;
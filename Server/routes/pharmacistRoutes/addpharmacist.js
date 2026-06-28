const express = require('express');
const router = express.Router();
const Pharmacist = require('../../models/pharmacistModel');

// ✅ المسار: POST /api/pharmacist/add
router.post('/', async (req, res) => {
    try {
        const { userId, gmail, password, nomPharmacie, adressePharmacie, numAgrement, isNightShift } = req.body;

        console.log('📝 Received pharmacist data:', { gmail, nomPharmacie });

        if (!gmail || !password || !nomPharmacie || !adressePharmacie || !numAgrement) {
            return res.status(400).json({ 
                success: false, 
                message: '⚠️ Please fill in all required fields' 
            });
        }

        const existing = await Pharmacist.findOne({ gmail: gmail.toLowerCase() });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'هذا الإيميل مستخدم بالفعل' 
            });
        }

        const pharmacist = new Pharmacist({
            userId,
            gmail: gmail.toLowerCase(),
            password,
            nomPharmacie,
            adressePharmacie,
            numAgrement,
            isNightShift: isNightShift || false
        });

        await pharmacist.save();
        
        console.log('✅ Pharmacist added successfully:', pharmacist.gmail);
        
        res.status(201).json({ 
            success: true, 
            message: 'Pharmacist added successfully',
            pharmacist: { 
                id: pharmacist._id, 
                gmail: pharmacist.gmail,
                nomPharmacie: pharmacist.nomPharmacie
            }
        });

    } catch (error) {
        console.error('❌ Error adding pharmacist:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;
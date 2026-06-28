// 📁 Server/routes/FireFightersRoutes/addFireFighters.js
const express = require('express');
const router = express.Router();
const FireFighter = require('../../models/FireFighters');

router.post('/', async (req, res) => {
    try {
        const { userId, gmail, matricule, password, grade, uniteIntervention } = req.body;

        console.log('📝 Received firefighter data:', { gmail, matricule, grade });

        if (!gmail || !matricule || !password || !grade || !uniteIntervention) {
            return res.status(400).json({ 
                success: false, 
                message: '⚠️ Please fill in all required fields' 
            });
        }

        const existing = await FireFighter.findOne({ gmail: gmail.toLowerCase() });
        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: 'هذا الإيميل مستخدم بالفعل' 
            });
        }

        const firefighter = new FireFighter({
            userId,
            gmail: gmail.toLowerCase(),
            matricule,
            password,
            grade,
            uniteIntervention
        });

        await firefighter.save();
        
        console.log('✅ Firefighter added successfully:', firefighter.gmail);
        
        res.status(201).json({ 
            success: true, 
            message: 'Firefighter added successfully',
            firefighter: {
                id: firefighter._id,
                matricule: firefighter.matricule,
                grade: firefighter.grade
            }
        });

    } catch (error) {
        console.error('❌ Error adding firefighter:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;
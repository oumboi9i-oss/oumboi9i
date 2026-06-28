const express = require('express');
const router = express.Router();
const Transaction = require('../../models/Transaction');

// ✅ المسار: POST /api/transaction/add
router.post('/', async (req, res) => {
    try {
        const { gardeId, demanderId, status } = req.body;

        console.log('📝 Received transaction data:', { gardeId, demanderId });

        if (!gardeId || !demanderId) {
            return res.status(400).json({ 
                success: false, 
                message: '⚠️ Please fill in all required fields' 
            });
        }

        const transaction = new Transaction({
            gardeId,
            demanderId,
            status: status || 'en_attente'
        });

        await transaction.save();
        
        console.log('✅ Transaction added successfully');
        
        res.status(201).json({ 
            success: true, 
            message: 'Transaction added successfully',
            transaction: {
                id: transaction._id,
                gardeId: transaction.gardeId,
                demanderId: transaction.demanderId
            }
        });

    } catch (error) {
        console.error('❌ Error adding transaction:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const Transaction = require('../../models/Transaction');

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { gardeId, demanderId, status } = req.body;

        console.log('✏️ Updating transaction:', id);

        const updated = await Transaction.findByIdAndUpdate(
            id, 
            { gardeId, demanderId, status },
            { new: true, runValidators: true }
        );
        
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        res.json({ success: true, message: 'Transaction updated', transaction: updated });

    } catch (error) {
        console.error('❌ Update error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
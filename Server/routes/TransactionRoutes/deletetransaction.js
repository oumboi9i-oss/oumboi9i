const express = require('express');
const router = express.Router();
const Transaction = require('../../models/Transaction');

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting transaction:', id);

        const deleted = await Transaction.findByIdAndDelete(id);
        
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        res.json({ success: true, message: 'Transaction deleted successfully' });

    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
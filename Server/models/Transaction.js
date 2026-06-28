const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    gardeId:       { type: String, default: '' },
    gardeOwner:    { type: String, default: '' },
    demandeurId:   { type: String, default: '' },
    demandeurName: { type: String, default: '' },
    gardeDate:     { type: Date,   default: null },
    role:          { type: String, default: '' },
    amount:        { type: Number, default: 200 },
    status:        { type: String, default: 'completed' },
    type:          { type: String, default: 'shift_exchange' },
    note:          { type: String, default: '' },
}, {
    collection: 'Transaction',
    timestamps: true,
});

module.exports = mongoose.model('Transaction', transactionSchema);

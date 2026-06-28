const mongoose = require('mongoose');

const demandeSchema = new mongoose.Schema({
  gardeId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Garde', required: true },
  gardeDate:        { type: Date },
  gardeOwner:       { type: String },
  proprietaireId:   { type: String, required: true },
  demandeurId:      { type: String, required: true },
  demandeurName:    { type: String, default: '' },
  role:             { type: String, enum: ['doctor','nurse','firefighter','pharmacist','manager'], required: true },
  status:           { type: String, enum: ['pending','accepted','rejected','completed'], default: 'pending' },
  directorStatus:   { type: String, enum: ['pending','approved','rejected'], default: null },
  directorId:       { type: String, default: null },
  ownerProfile:     { type: Object, default: null },
  demandeurProfile: { type: Object, default: null },
  archived:         { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Demande', demandeSchema);
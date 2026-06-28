const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ManagerSchema = new mongoose.Schema({
  userId:      { type: String },
  email:       { type: String, required: true, lowercase: true, unique: true },
  password:    { type: String, required: true, select: false },
  fullName:    { type: String, required: true },
  managerType: { type: String, enum: ['doctor', 'nurse', 'pharmacist', 'firefighter'], default: null },
  position:    { type: String, default: 'Manager' },
  location:    { type: String },
  lat:         { type: Number },
  lng:         { type: Number },
}, { collection: "DDS", timestamps: true });

ManagerSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

ManagerSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.Manager || mongoose.model('Manager', ManagerSchema);

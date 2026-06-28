/**
 * Seed script: creates one pending shift exchange + manager notification per role.
 * Run with: node Server/seed.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');

const Garde        = require('./models/Garde');
const Demande      = require('./models/Demande');
const Notification = require('./models/Notification');
const Manager      = require('./models/Manager');
const Doctor       = require('./models/DoctorModel');
const Nurse        = require('./models/nurseModel');
const FireFighter  = require('./models/FireFighters');
const Pharmacist   = require('./models/pharmacistModel');

const ROLES = [
  { role: 'doctor',      Model: Doctor,      getName: u => u.fullName  || u.email },
  { role: 'nurse',       Model: Nurse,       getName: u => u.userId    || u.gmail },
  { role: 'firefighter', Model: FireFighter, getName: u => u.matricule || u.gmail },
  { role: 'pharmacist',  Model: Pharmacist,  getName: u => u.nomPharmacie || u.gmail },
];

async function seed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/User';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB\n');

  for (const { role, Model, getName } of ROLES) {
    const users = await Model.find().limit(2).lean();

    if (users.length < 2) {
      console.log(`⚠️  Skipping ${role}: need at least 2 users (found ${users.length})`);
      continue;
    }

    // Find managers for this role
    const managers = await Manager.find({ managerType: role }).lean();
    if (managers.length === 0) {
      console.log(`⚠️  No manager with managerType="${role}" found — shift will be created but no notification sent`);
    }

    const owner         = users[0];
    const requester     = users[1];
    const ownerName     = getName(owner);
    const requesterName = getName(requester);

    // Create the garde
    const garde = await Garde.create({
      owner:     ownerName,
      ownerId:   owner._id,
      role,
      dateGarde: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status:    'Active',
    });

    // Create the demande (already accepted, waiting for manager)
    const demande = await Demande.create({
      gardeId:        garde._id,
      gardeDate:      garde.dateGarde,
      gardeOwner:     ownerName,
      proprietaireId: owner._id.toString(),
      demandeurId:    requester._id.toString(),
      demandeurName:  requesterName,
      role,
      status:         'accepted',
      directorStatus: 'pending',
      type:           'echange',
    });

    // Create director_review notification for each matching manager
    for (const manager of managers) {
      await Notification.create({
        userId:    manager._id.toString(),
        type:      'director_review',
        message:   `📋 Demande d'échange en attente: ${ownerName} → ${requesterName} (garde du ${new Date(garde.dateGarde).toLocaleDateString()})`,
        demandeId: demande._id.toString(),
      });
      console.log(`   🔔 Notification created for manager: ${manager.fullName} (${manager.managerType})`);
    }

    console.log(`✅ ${role}: "${ownerName}" → "${requesterName}" — pending manager approval`);
  }

  // Summary: list all managers and their managerType so the user can verify
  console.log('\n── Managers in DB ─────────────────────────────');
  const allManagers = await Manager.find().lean();
  if (allManagers.length === 0) {
    console.log('  (none found — add managers via /api/manager/add)');
  } else {
    allManagers.forEach(m => console.log(`  ${m.fullName} — managerType: ${m.managerType || '⚠️ NULL (not set!)'}`));
  }
  console.log('────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('✅ Seed complete.');
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });

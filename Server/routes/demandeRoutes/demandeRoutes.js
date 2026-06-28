const express = require('express');
const router = express.Router();
const Demande = require('../../models/Demande');
const Garde = require('../../models/Garde');
const Notification = require('../../models/Notification');
const Manager = require('../../models/Manager');
const Message = require('../../models/Message');
const Transaction = require('../../models/Transaction');
const { protect, authorize } = require('../../middleware/authMiddleware');

// Create demande
router.post('/', async (req, res) => {
  try {
    const { gardeId, gardeDate, gardeOwner, proprietaireId, demandeurId, demandeurName, role, type } = req.body;

    const existingDemande = await Demande.findOne({ gardeId, demandeurId, status: 'pending' });
    if (existingDemande) {
      return res.status(400).json({ message: 'Vous avez déjà envoyé une demande pour cette garde' });
    }

    const newDemande = new Demande({
      gardeId,
      gardeDate,
      gardeOwner,
      proprietaireId,
      demandeurId,
      demandeurName,
      role,
      type: type || 'echange'
    });
    await newDemande.save();

    const notification = new Notification({
      userId: proprietaireId,
      type: 'demande_received',
      message: `📩 Vous avez une nouvelle demande de ${demandeurName}`,
      demandeId: newDemande._id.toString()
    });
    await notification.save();

    res.status(201).json(newDemande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Get all demandes
router.get('/', async (req, res) => {
  try {
    const demandes = await Demande.find().sort({ createdAt: -1 });
    res.json(demandes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Check if demande exists
router.get('/check', async (req, res) => {
  try {
    const { gardeId, demandeurId } = req.query;
    const demande = await Demande.findOne({ gardeId, demandeurId });
    res.json({ exists: !!demande });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Get a single demande by id (used by Notifications history page to hydrate
// role / proprietaireId / demandeurId / gardeId for each notification)
router.get('/:id', async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }
    res.json(demande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// ✅ Accepter la demande (User B accepts, notifies demandeur + manager)
router.put('/:id/accept', async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    demande.status = 'accepted';
    demande.directorStatus = 'pending';
    await demande.save();

    // Notify demandeur (User A) that the request was accepted
    const notificationDemandeur = new Notification({
      userId: demande.demandeurId,
      type: 'demande_accepted',
      message: `✅ ${demande.gardeOwner} a accepté votre demande`,
      demandeId: demande._id.toString(),
      otherUserId:   demande.proprietaireId,
      otherUserName: demande.gardeOwner,
    });
    await notificationDemandeur.save();

    if (global.io) {
      global.io.to(demande.demandeurId).emit('new_notification', notificationDemandeur);
    }

    // Notify all managers of the relevant role
    const managers = await Manager.find({ managerType: demande.role });
    console.log(`🔍 Looking for managers with managerType="${demande.role}" — found ${managers.length}`);
    for (const manager of managers) {
      const managerNotif = new Notification({
        userId: manager._id.toString(),
        type: 'director_review',
        message: `📋 Demande d'échange en attente: ${demande.gardeOwner} → ${demande.demandeurName} (garde du ${new Date(demande.gardeDate).toLocaleDateString()})`,
        demandeId: demande._id.toString()
      });
      await managerNotif.save();
      console.log(`🔔 Notification sent to manager ${manager.fullName} (id: ${manager._id})`);
      if (global.io) {
        global.io.to(manager._id.toString()).emit('new_notification', managerNotif);
      }
    }
    if (managers.length === 0) {
      console.warn(`⚠️  No managers found for role "${demande.role}" — check managerType field in DDS collection`);
    }

    res.json({ message: 'Demande acceptée', demande, notification: notificationDemandeur });

  } catch (error) {
    console.error('❌ Error accepting demande:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Reject demande
router.put('/:id/reject', async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });

    demande.status = 'rejected';
    await demande.save();

    const notification = new Notification({
      userId: demande.demandeurId,
      type: 'demande_rejected',
      message: `❌ ${demande.gardeOwner} a rejeté votre demande`,
      demandeId: demande._id.toString()
    });
    await notification.save();

    res.json(demande);
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Send to director
router.put('/:id/send-to-director', async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });

    demande.directorStatus = 'pending';
    await demande.save();

    res.json({ message: 'Demande envoyée au directeur', demande });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

// Manager/Admin approve shift exchange
router.put('/:id/director-approve', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });

    const garde = await Garde.findById(demande.gardeId);
    if (!garde) return res.status(404).json({ message: 'Garde non trouvée' });

    garde.ownerId      = demande.demandeurId;
    garde.owner        = demande.demandeurName;
    garde.status       = 'Transferred';
    garde.archived     = true;
    garde.archivedAt   = new Date();
    garde.transferredTo = demande.demandeurId;
    await garde.save();

    demande.directorStatus = 'approved';
    demande.status         = 'completed';
    demande.archived       = true;
    await demande.save();

    const notifOwner = new Notification({
      userId:        demande.proprietaireId,
      type:          'final_approved',
      message:       `✅ Demande approuvée! Garde transférée à ${demande.demandeurName}`,
      demandeId:     demande._id.toString(),
      otherUserId:   demande.demandeurId,
      otherUserName: demande.demandeurName,
    });
    await notifOwner.save();

    const notifDemandeur = new Notification({
      userId:        demande.demandeurId,
      type:          'final_approved',
      message:       `🎉 Félicitations! Vous êtes maintenant propriétaire de la garde`,
      demandeId:     demande._id.toString(),
      otherUserId:   demande.proprietaireId,
      otherUserName: demande.gardeOwner,
    });
    await notifDemandeur.save();

    if (global.io) {
      global.io.to(demande.proprietaireId).emit('new_notification', notifOwner);
      global.io.to(demande.demandeurId).emit('new_notification', notifDemandeur);
    }

    // Mark the original director_review notification(s) as resolved so the
    // manager's Notifications history page no longer lists them as pending.
    await Notification.updateMany(
      { demandeId: demande._id.toString(), type: 'director_review' },
      { status: 'approved', read: true }
    );

    // Auto-message now that the exchange is officially approved
    try {
      await Message.create({
        senderId:   demande.gardeOwner,
        receiverId: demande.demandeurName,
        content:    `🎉 Shift exchange approved! Your shift has been successfully transferred.`,
        isRead:     false,
      });
    } catch (msgErr) {
      console.warn('⚠️ Auto-message failed (non-fatal):', msgErr.message);
    }

    // Record 200 DZD commission
    try {
      await Transaction.create({
        gardeId:       demande.gardeId.toString(),
        gardeOwner:    demande.gardeOwner,
        demandeurId:   demande.demandeurId,
        demandeurName: demande.demandeurName,
        gardeDate:     demande.gardeDate,
        role:          demande.role,
        amount:        200,
        status:        'completed',
        type:          'shift_exchange',
        note:          `Shift exchange: ${demande.gardeOwner} → ${demande.demandeurName}`,
      });
    } catch (txErr) {
      console.warn('⚠️ Commission transaction failed (non-fatal):', txErr.message);
    }

    res.json({ success: true, message: 'Approuvé avec succès', demande, garde });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Manager/Admin reject shift exchange
router.put('/:id/director-reject', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const demande = await Demande.findById(req.params.id);
    if (!demande) return res.status(404).json({ message: 'Demande non trouvée' });

    demande.directorStatus = 'rejected';
    demande.status = 'rejected';
    await demande.save();

    // Notify demandeur (User A)
    const notifDemandeur = new Notification({
      userId: demande.demandeurId,
      type: 'final_rejected',
      message: `❌ Votre demande d'échange a été refusée par le directeur`,
      demandeId: demande._id.toString()
    });
    await notifDemandeur.save();

    // Notify proprietaire (User B)
    const notifOwner = new Notification({
      userId: demande.proprietaireId,
      type: 'final_rejected',
      message: `❌ L'échange avec ${demande.demandeurName} a été refusé par le directeur`,
      demandeId: demande._id.toString()
    });
    await notifOwner.save();

    if (global.io) {
      global.io.to(demande.demandeurId).emit('new_notification', notifDemandeur);
      global.io.to(demande.proprietaireId).emit('new_notification', notifOwner);
    }

    // Mark the original director_review notification(s) as resolved so the
    // manager's Notifications history page no longer lists them as pending.
    await Notification.updateMany(
      { demandeId: demande._id.toString(), type: 'director_review' },
      { status: 'rejected', read: true }
    );

    res.json({ success: true, message: 'Rejeté', demande });
  } catch (error) {
    res.status(500).json({ message: 'Erreur', error: error.message });
  }
});

module.exports = router;
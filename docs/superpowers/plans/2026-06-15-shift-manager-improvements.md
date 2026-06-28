# Shift Manager Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Three improvements: (1) clickable user profiles in the manager shift-exchange review table, (2) "Message other user" quick-action in the `final_approved` notification, (3) auto-message moved to manager-approval time with correct IDs.

**Architecture:** New `/api/user/profile/:id?role=` server route; `otherUserId`/`otherUserName` fields added to `Notification`; `UserProfileModal` component for DDSHome; `onNavigate` threaded through `PageHeader`→`NotificationBell`; `openUserId`/`openUserName` props on message components to pre-open conversations.

**Tech Stack:** Node.js/Express/Mongoose (server), React (client), axios

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `Server/routes/accountRoutes/getUserProfile.js` | Create | GET /api/user/profile/:id?role= |
| `Server/server.js` | Modify | Register new profile route |
| `Server/models/Notification.js` | Modify | Add otherUserId, otherUserName fields |
| `Server/routes/demandeRoutes/demandeRoutes.js` | Modify | Move auto-message to director-approve; add otherUser fields to final_approved notifs |
| `client/src/interfaces/DDS/UserProfileModal.jsx` | Create | Two-panel profile overlay for DDSHome |
| `client/src/interfaces/DDS/UserProfileModal.css` | Create | Styles for modal |
| `client/src/interfaces/DDS/DDSHome.jsx` | Modify | Clickable shift rows + open UserProfileModal |
| `client/src/components/PageHeader.jsx` | Modify | Add onNavigate prop, pass to NotificationBell |
| `client/src/App.js` | Modify | Pass onNavigate to PageHeader via RoleShell; handle openUser nav params; add 'messages' alias for DoctorView |
| `client/src/interfaces/components/NotificationBell.jsx` | Modify | Add onNavigate prop; "💬 Message" button for final_approved |
| `client/src/interfaces/DDS/DDSMessage.jsx` | Modify | Accept openUserId prop; pre-select contact on mount |
| `client/src/interfaces/components/Chatmessage.jsx` | Modify | Accept openUserName prop in ChatMessage export; Inbox auto-opens conversation |

---

## Task 1: New server route — User profile lookup by ID + role

**Files:**
- Create: `Server/routes/accountRoutes/getUserProfile.js`
- Modify: `Server/server.js` (line ~73 — after the getProfile route)

- [ ] **Step 1: Create the route file**

```js
// Server/routes/accountRoutes/getUserProfile.js
const express = require('express');
const router  = express.Router();
const Doctor     = require('../../models/DoctorModel');
const Nurse      = require('../../models/nurseModel');
const FireFighter = require('../../models/FireFighters');
const Pharmacist = require('../../models/pharmacistModel');

const MODELS = { doctor: Doctor, nurse: Nurse, firefighter: FireFighter, pharmacist: Pharmacist };

// GET /api/user/profile/:id?role=doctor|nurse|firefighter|pharmacist
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { role } = req.query;
  const Model = MODELS[role];
  if (!Model) return res.status(400).json({ message: 'Invalid role' });
  try {
    const user = await Model.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ ...user.toObject(), _role: role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
```

- [ ] **Step 2: Register the route in `Server/server.js`**

Add this line after the existing `getProfile` registration (around line 68):

```js
app.use("/api/user/profile", require("./routes/accountRoutes/getUserProfile"));
```

- [ ] **Step 3: Manually test the route**

Start the server and run:
```
curl "http://localhost:5000/api/user/profile/REPLACE_WITH_REAL_ID?role=doctor"
```
Expected: JSON object with doctor fields, no password field.

- [ ] **Step 4: Commit**

```bash
git add Server/routes/accountRoutes/getUserProfile.js Server/server.js
git commit -m "feat: add GET /api/user/profile/:id?role= endpoint"
```

---

## Task 2: Notification model — add otherUserId and otherUserName

**Files:**
- Modify: `Server/models/Notification.js`

- [ ] **Step 1: Add the two new fields to the schema**

Replace the existing schema body in `Server/models/Notification.js` so it reads:

```js
// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId:        { type: String, required: true },
  type: {
    type: String,
    enum: [
      'demande_received',
      'demande_accepted',
      'demande_rejected',
      'director_review',
      'final_approved',
      'final_rejected',
      'chat_message',
    ],
    required: true,
  },
  message:       { type: String, required: true },
  demandeId:     { type: String, default: null },
  read:          { type: Boolean, default: false },
  otherUserId:   { type: String, default: null },
  otherUserName: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
```

- [ ] **Step 2: Commit**

```bash
git add Server/models/Notification.js
git commit -m "feat: add otherUserId and otherUserName to Notification schema"
```

---

## Task 3: demandeRoutes — move auto-message + add otherUser to final_approved notifications

**Files:**
- Modify: `Server/routes/demandeRoutes/demandeRoutes.js`

Two changes in this file: (A) remove the `Message.create` block from the `accept` handler, (B) add it to `director-approve` and populate `otherUserId`/`otherUserName` on both `final_approved` notifications.

- [ ] **Step 1: Remove the auto-message from the `accept` handler**

In `Server/routes/demandeRoutes/demandeRoutes.js`, find the `PUT /:id/accept` route. Delete these lines (roughly lines 113–123):

```js
    // Auto-start a conversation between the two users
    try {
      await Message.create({
        senderId:   demande.gardeOwner,
        receiverId: demande.demandeurName,
        content: `🤝 Shift exchange accepted! Let's coordinate the details here.`,
        isRead: false,
      });
    } catch (msgErr) {
      console.warn('⚠️ Auto-message failed (non-fatal):', msgErr.message);
    }
```

- [ ] **Step 2: In the `director-approve` handler, add the auto-message and otherUser fields**

Find the `PUT /:id/director-approve` handler. Replace the two `Notification.create` calls and the block that follows `demande.archived = true` so the handler reads:

```js
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
```

- [ ] **Step 3: Commit**

```bash
git add Server/routes/demandeRoutes/demandeRoutes.js
git commit -m "fix: move auto-message to director-approve; add otherUser fields to final_approved notifications"
```

---

## Task 4: UserProfileModal component

**Files:**
- Create: `client/src/interfaces/DDS/UserProfileModal.jsx`
- Create: `client/src/interfaces/DDS/UserProfileModal.css`

- [ ] **Step 1: Create `UserProfileModal.jsx`**

```jsx
// client/src/interfaces/DDS/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import './UserProfileModal.css';

const API = 'http://localhost:5000/api';

const PROF_ID_LABEL = {
  doctor:      { field: 'numOrdre',     label: '🪪 N° Ordre' },
  nurse:       { field: 'userId',       label: '🪪 User ID' },
  firefighter: { field: 'matricule',    label: '🪪 Matricule' },
  pharmacist:  { field: 'numAgrement',  label: '🪪 N° Agrément' },
};

function UserPanel({ title, userId, role }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !role) return;
    fetch(`${API}/user/profile/${userId}?role=${role}`)
      .then(r => r.json())
      .then(data => { setProfile(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId, role]);

  const profId = PROF_ID_LABEL[role];

  return (
    <div className="upm-panel">
      <div className="upm-panel-title">{title}</div>
      {loading ? (
        <div className="upm-loading">⏳ Loading…</div>
      ) : !profile || profile.message ? (
        <div className="upm-unavailable">👤 Profile unavailable</div>
      ) : (
        <div className="upm-fields">
          <div className="upm-field"><span className="upm-icon">👤</span><div><div className="upm-label">Full Name</div><div className="upm-value">{profile.fullName || '—'}</div></div></div>
          <div className="upm-field"><span className="upm-icon">📧</span><div><div className="upm-label">Email</div><div className="upm-value">{profile.email || profile.gmail || '—'}</div></div></div>
          {profId && profile[profId.field] && (
            <div className="upm-field"><span className="upm-icon">🪪</span><div><div className="upm-label">{profId.label.replace('🪪 ', '')}</div><div className="upm-value upm-id">{profile[profId.field]}</div></div></div>
          )}
          {profile.specialty       && <div className="upm-field"><span className="upm-icon">🩺</span><div><div className="upm-label">Specialty</div><div className="upm-value">{profile.specialty}</div></div></div>}
          {profile.service         && <div className="upm-field"><span className="upm-icon">🏥</span><div><div className="upm-label">Service</div><div className="upm-value">{profile.service}</div></div></div>}
          {profile.grade           && <div className="upm-field"><span className="upm-icon">🎖️</span><div><div className="upm-label">Grade</div><div className="upm-value">{profile.grade}</div></div></div>}
          {profile.uniteIntervention && <div className="upm-field"><span className="upm-icon">🚒</span><div><div className="upm-label">Unit</div><div className="upm-value">{profile.uniteIntervention}</div></div></div>}
          {profile.nomPharmacie    && <div className="upm-field"><span className="upm-icon">💊</span><div><div className="upm-label">Pharmacy</div><div className="upm-value">{profile.nomPharmacie}</div></div></div>}
          {profile.location        && <div className="upm-field"><span className="upm-icon">📍</span><div><div className="upm-label">Location</div><div className="upm-value">{profile.location}</div></div></div>}
          <div className="upm-field"><span className="upm-icon">🏷️</span><div><div className="upm-label">Role</div><div className="upm-value upm-role-chip">{role}</div></div></div>
        </div>
      )}
    </div>
  );
}

export default function UserProfileModal({ demande, onApprove, onReject, onClose, processingId }) {
  return (
    <div className="upm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="upm-modal">
        <div className="upm-header">
          <h2 className="upm-title">👥 Shift Exchange — Review Profiles</h2>
          <button className="upm-close" onClick={onClose}>✕</button>
        </div>

        <div className="upm-date-row">
          <span>📅 {demande.gardeDate ? new Date(demande.gardeDate).toLocaleDateString() : '—'}</span>
          <span>🔄 {demande.type === 'vente' ? 'Sale' : 'Exchange'}</span>
          <span>{demande.role}</span>
        </div>

        <div className="upm-panels">
          <UserPanel title="👤 Current Owner (gives shift)" userId={demande.proprietaireId} role={demande.role} />
          <div className="upm-arrow">➡️</div>
          <UserPanel title="👤 New Owner (receives shift)" userId={demande.demandeurId} role={demande.role} />
        </div>

        <div className="upm-actions">
          <button
            className="upm-btn-approve"
            onClick={() => onApprove(demande._id)}
            disabled={processingId === demande._id}
          >
            {processingId === demande._id ? '⏳ Processing…' : '✅ Approve Exchange'}
          </button>
          <button
            className="upm-btn-reject"
            onClick={() => onReject(demande._id)}
            disabled={processingId === demande._id}
          >
            {processingId === demande._id ? '⏳ Processing…' : '❌ Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `UserProfileModal.css`**

```css
/* client/src/interfaces/DDS/UserProfileModal.css */
.upm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.upm-modal {
  background: #fff; border-radius: 16px; width: 100%;
  max-width: 720px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.upm-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 0; border-bottom: 1px solid #f1f5f9; margin-bottom: 12px;
}
.upm-title { font-size: 17px; font-weight: 700; margin: 0 0 16px; }
.upm-close {
  background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8;
}
.upm-date-row {
  display: flex; gap: 16px; padding: 0 24px 12px; font-size: 13px; color: #64748b;
}
.upm-panels {
  display: flex; gap: 12px; align-items: flex-start; padding: 0 16px 16px;
}
.upm-arrow { font-size: 24px; align-self: center; padding: 0 4px; }
.upm-panel {
  flex: 1; background: #f8fafc; border: 1px solid #e2e8f0;
  border-radius: 12px; padding: 16px;
}
.upm-panel-title { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 12px; }
.upm-loading, .upm-unavailable { font-size: 13px; color: #94a3b8; padding: 12px 0; }
.upm-fields { display: flex; flex-direction: column; gap: 10px; }
.upm-field { display: flex; gap: 10px; align-items: flex-start; }
.upm-icon { font-size: 16px; width: 22px; flex-shrink: 0; margin-top: 1px; }
.upm-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: .5px; }
.upm-value { font-size: 14px; color: #1e293b; font-weight: 500; }
.upm-id { font-family: monospace; color: #2563eb; }
.upm-role-chip {
  display: inline-block; padding: 2px 8px; background: #eff6ff;
  color: #2563eb; border-radius: 99px; font-size: 12px;
}
.upm-actions {
  display: flex; gap: 12px; justify-content: flex-end;
  padding: 16px 24px; border-top: 1px solid #f1f5f9;
}
.upm-btn-approve {
  padding: 10px 20px; background: #22c55e; color: #fff;
  border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
}
.upm-btn-approve:disabled { opacity: .6; cursor: not-allowed; }
.upm-btn-reject {
  padding: 10px 20px; background: #fee2e2; color: #dc2626;
  border: none; border-radius: 8px; font-weight: 600; cursor: pointer;
}
.upm-btn-reject:disabled { opacity: .6; cursor: not-allowed; }
@media (max-width: 580px) {
  .upm-panels { flex-direction: column; }
  .upm-arrow { align-self: center; transform: rotate(90deg); }
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/interfaces/DDS/UserProfileModal.jsx client/src/interfaces/DDS/UserProfileModal.css
git commit -m "feat: add UserProfileModal component for shift exchange review"
```

---

## Task 5: DDSHome — clickable shift rows + open UserProfileModal

**Files:**
- Modify: `client/src/interfaces/DDS/DDSHome.jsx`

- [ ] **Step 1: Import UserProfileModal and add selectedDemande state**

At the top of `DDSHome.jsx`, add the import:
```js
import UserProfileModal from './UserProfileModal';
```

Inside `DDSHome`, add state below the existing state declarations:
```js
const [selectedDemande, setSelectedDemande] = useState(null);
```

- [ ] **Step 2: Wire up the shift row click handler**

In the shift exchange table body, replace:
```jsx
<tr key={d._id}>
  <td className="dds-td">{d.gardeOwner || '—'}</td>
  <td className="dds-td">{d.demandeurName || '—'}</td>
  <td className="dds-td">{d.gardeDate ? new Date(d.gardeDate).toLocaleDateString() : '—'}</td>
  <td className="dds-td"><span className="dds-capitalize">{roleEmoji[d.role] || ''} {d.role}</span></td>
  <td className="dds-td">
    <button className="dds-btn-approve" onClick={() => approveShift(d._id)}>✅ Approve</button>
    <button className="dds-btn-reject"  onClick={() => rejectShift(d._id)}>❌ Reject</button>
  </td>
</tr>
```

With:
```jsx
<tr
  key={d._id}
  className="dds-tr-clickable"
  onClick={() => setSelectedDemande(d)}
  style={{ cursor: 'pointer' }}
>
  <td className="dds-td">{d.gardeOwner || '—'}</td>
  <td className="dds-td">{d.demandeurName || '—'}</td>
  <td className="dds-td">{d.gardeDate ? new Date(d.gardeDate).toLocaleDateString() : '—'}</td>
  <td className="dds-td"><span className="dds-capitalize">{roleEmoji[d.role] || ''} {d.role}</span></td>
  <td className="dds-td" onClick={e => e.stopPropagation()}>
    <button className="dds-btn-approve" onClick={() => approveShift(d._id)}>✅ Approve</button>
    <button className="dds-btn-reject"  onClick={() => rejectShift(d._id)}>❌ Reject</button>
  </td>
</tr>
```

- [ ] **Step 3: Render the modal at the bottom of the component's return**

Just before the closing `</div>` of `dds-container`, add:
```jsx
{selectedDemande && (
  <UserProfileModal
    demande={selectedDemande}
    processingId={null}
    onApprove={async (id) => {
      if (!window.confirm('Approve this shift exchange?')) return;
      try {
        await axios.put(`${API}/demande/${id}/director-approve`, {}, authHeader);
        setPendingShifts(prev => prev.filter(d => d._id !== id));
        setSelectedDemande(null);
        alert('✅ Shift exchange approved!');
      } catch (err) {
        alert('❌ ' + (err.response?.data?.message || err.message));
      }
    }}
    onReject={async (id) => {
      if (!window.confirm('Reject this shift exchange?')) return;
      try {
        await axios.put(`${API}/demande/${id}/director-reject`, {}, authHeader);
        setPendingShifts(prev => prev.filter(d => d._id !== id));
        setSelectedDemande(null);
      } catch (err) {
        alert('❌ ' + (err.response?.data?.message || err.message));
      }
    }}
    onClose={() => setSelectedDemande(null)}
  />
)}
```

- [ ] **Step 4: Commit**

```bash
git add client/src/interfaces/DDS/DDSHome.jsx
git commit -m "feat: make shift exchange rows clickable and open UserProfileModal"
```

---

## Task 6: PageHeader — add onNavigate prop

**Files:**
- Modify: `client/src/components/PageHeader.jsx`

- [ ] **Step 1: Update PageHeader to accept and pass onNavigate**

Replace the entire file content:

```jsx
// client/src/components/PageHeader.jsx
import React from 'react';
import './PageHeader.css';
import NotificationBell from '../interfaces/components/NotificationBell';

export default function PageHeader({ greeting, title, currentUser, onBack, rightExtra, onNavigate }) {
  return (
    <div className="pgh-bar">
      <div className="pgh-left">
        {onBack && (
          <button className="pgh-back-btn" onClick={onBack}>← Back</button>
        )}
        <div>
          {greeting && <div className="pgh-greeting">{greeting}</div>}
          <h1 className="pgh-title">{title}</h1>
        </div>
      </div>
      <div className="pgh-right">
        {rightExtra}
        {currentUser && (
          <NotificationBell currentUser={currentUser} onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add client/src/components/PageHeader.jsx
git commit -m "feat: add onNavigate prop to PageHeader and thread to NotificationBell"
```

---

## Task 7: App.js — wire onNavigate through RoleShell + handle openUser params

**Files:**
- Modify: `client/src/App.js`

- [ ] **Step 1: Update RoleShell to pass onNavigate to PageHeader**

In `App.js`, find `RoleShell`. Change the `PageHeader` line from:
```jsx
<PageHeader
  greeting={`Welcome`}
  title={currentUser?.fullName || currentUser?.userId || currentUser?.nomPharmacie || currentUser?.matricule || role}
  currentUser={currentUser}
/>
```
To:
```jsx
<PageHeader
  greeting={`Welcome`}
  title={currentUser?.fullName || currentUser?.userId || currentUser?.nomPharmacie || currentUser?.matricule || role}
  currentUser={currentUser}
  onNavigate={onNavigate}
/>
```

- [ ] **Step 2: Update each role view to pass openUser params to the message component**

In `DoctorView`, change the `nav` function and message rendering:

```jsx
function DoctorView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]           = useState("home");
  const [profileId, setProfileId] = useState(currentUser?.id || null);
  const [openUserName, setOpenUserName] = useState(null);

  const nav = (newView, param = null) => {
    if (typeof param === 'string') setProfileId(param);
    if (param?.openUserName) setOpenUserName(param.openUserName);
    setView(newView);
  };

  return (
    <RoleShell role="doctor" roleClass="role-doctor" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <DoctorHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <DoctorGard onNavigate={nav} currentUser={currentUser} />}
      {(view === "message" || view === "messages") && (
        <DoctorMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />
      )}
      {view === "profile"  && <DoctorProfile doctorId={profileId || currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="doctor" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="doctor" onNavigate={nav} />}
    </RoleShell>
  );
}
```

Apply the same pattern to `NurseView`, `PharmacistView`, `FirefighterView` (each uses `messages` as the key so no alias needed there — just add the `openUserName` state and param handling).

For `DDSView`, do the same but use `openUserId` instead:

```jsx
function DDSView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]   = useState("home");
  const [ddsId, setDdsId] = useState(currentUser?.id || null);
  const [openUserId, setOpenUserId] = useState(null);

  const nav = (v, param = null) => {
    if (typeof param === 'string') setDdsId(param);
    if (param?.openUserId) setOpenUserId(param.openUserId);
    setView(v);
  };

  return (
    <RoleShell role="manager" roleClass="role-manager" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <DDSHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <DDSGarde onNavigate={nav} currentUser={currentUser} />}
      {view === "messages" && <DDSMessage onNavigate={nav} currentUser={currentUser} openUserId={openUserId} />}
      {view === "profile"  && <DDSProfile ddsId={ddsId || currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="manager" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="manager" onNavigate={nav} />}
    </RoleShell>
  );
}
```

For `NurseView`:
```jsx
function NurseView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView]   = useState("home");
  const [nurseId, setNurseId] = useState(currentUser?.id || null);
  const [openUserName, setOpenUserName] = useState(null);
  const nav = (v, param = null) => {
    if (typeof param === 'string') setNurseId(param);
    if (param?.openUserName) setOpenUserName(param.openUserName);
    setView(v);
  };

  return (
    <RoleShell role="nurse" roleClass="role-nurse" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <NurseHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <NurseGarde onNavigate={nav} currentUser={currentUser} />}
      {view === "messages" && <NurseMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />}
      {view === "profile"  && <NurseProfile nurseId={nurseId || currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="nurse" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="nurse" onNavigate={nav} />}
    </RoleShell>
  );
}
```

For `PharmacistView`:
```jsx
function PharmacistView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView] = useState("home");
  const [openUserName, setOpenUserName] = useState(null);
  const nav = (v, param = null) => {
    if (param?.openUserName) setOpenUserName(param.openUserName);
    setView(v);
  };

  return (
    <RoleShell role="pharmacist" roleClass="role-pharmacist" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <PharmacistHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <PharmacistGarde onNavigate={nav} currentUser={currentUser} />}
      {view === "messages" && <PharmacistMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />}
      {view === "profile"  && <PharmacistProfile pharmacistId={currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="pharmacist" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="pharmacist" onNavigate={nav} />}
    </RoleShell>
  );
}
```

For `FirefighterView`:
```jsx
function FirefighterView({ currentUser, onLogout, onUpdateUser }) {
  const [view, setView] = useState("home");
  const [openUserName, setOpenUserName] = useState(null);
  const nav = (v, param = null) => {
    if (param?.openUserName) setOpenUserName(param.openUserName);
    setView(v);
  };

  return (
    <RoleShell role="firefighter" roleClass="role-firefighter" currentUser={currentUser} onLogout={onLogout} view={view} onNavigate={nav}>
      {view === "home"     && <FirefighterHome onNavigate={nav} currentUser={currentUser} />}
      {view === "garde"    && <FirefighterGarde onNavigate={nav} currentUser={currentUser} />}
      {view === "messages" && <FirefighterMessage onNavigate={nav} currentUser={currentUser} openUserName={openUserName} />}
      {view === "profile"  && <FireFighterProfile firefighterId={currentUser?.id} onNavigate={nav} onUpdateUser={onUpdateUser} />}
      {view === "demandes" && <DemandesPage currentUser={currentUser} role="firefighter" onNavigate={nav} />}
      {view === "director" && <DirectorApprovalPage currentUser={currentUser} role="firefighter" onNavigate={nav} />}
    </RoleShell>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add client/src/App.js
git commit -m "feat: thread onNavigate and openUser params through role views to message components"
```

---

## Task 8: NotificationBell — message quick-action for final_approved

**Files:**
- Modify: `client/src/interfaces/components/NotificationBell.jsx`

- [ ] **Step 1: Add onNavigate prop and the message button**

Replace the full file with:

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './NotificationBell.css';

const NotificationBell = ({ currentUser, onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (currentUser?._id || currentUser?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      const userId = currentUser._id || currentUser.id;
      const res = await axios.get(`http://localhost:5000/api/notification/user/${userId}`);
      setNotifications(res.data || []);
      setUnreadCount(res.data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notification/${id}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const userId = currentUser._id || currentUser.id;
      await axios.put(`http://localhost:5000/api/notification/user/${userId}/read-all`);
      fetchNotifications();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleAcceptDemande = async (demandeId, e) => {
    e.stopPropagation();
    if (!window.confirm('✅ Accepter cette demande?')) return;
    try {
      await axios.put(`http://localhost:5000/api/demande/${demandeId}/accept`);
      alert('✅ Demande acceptée! Vous pouvez maintenant discuter.');
      fetchNotifications();
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleRejectDemande = async (demandeId, e) => {
    e.stopPropagation();
    if (!window.confirm('❌ Rejeter cette demande?')) return;
    try {
      await axios.put(`http://localhost:5000/api/demande/${demandeId}/reject`);
      alert('❌ Demande rejetée');
      fetchNotifications();
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const handleMessageOtherUser = async (notif, e) => {
    e.stopPropagation();
    await handleMarkAsRead(notif._id);
    setShowDropdown(false);
    const role = currentUser?.role;
    if (role === 'manager') {
      onNavigate?.('messages', { openUserId: notif.otherUserId });
    } else {
      onNavigate?.('messages', { openUserName: notif.otherUserName });
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'demande_received': return '📩';
      case 'demande_accepted': return '✅';
      case 'demande_rejected': return '❌';
      case 'director_review':  return '📋';
      case 'final_approved':   return '🎉';
      case 'final_rejected':   return '😔';
      default: return '🔔';
    }
  };

  return (
    <div className="nb-notification-bell">
      <div className="nb-bell-icon" onClick={() => setShowDropdown(!showDropdown)}>
        🔔
        {unreadCount > 0 && <span className="nb-badge">{unreadCount}</span>}
      </div>

      {showDropdown && (
        <div className="nb-notification-dropdown">
          <div className="nb-dropdown-header">
            <h3>Notifications ({notifications.length})</h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="nb-mark-all-read">
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="nb-dropdown-body">
            {notifications.length === 0 ? (
              <p className="nb-no-notifications">Aucune notification</p>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`nb-notification-item ${!notif.read ? 'unread' : ''}`}
                  onClick={() => handleMarkAsRead(notif._id)}
                >
                  <span className="nb-notif-icon">{getIcon(notif.type)}</span>
                  <div className="nb-notif-content">
                    <p className="nb-notif-message">{notif.message}</p>
                    <span className="nb-notif-time">
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>

                    {notif.type === 'demande_received' && notif.demandeId && (
                      <div className="nb-notif-actions">
                        <button
                          className="nb-btn-accept-small"
                          onClick={(e) => handleAcceptDemande(notif.demandeId, e)}
                        >
                          ✅ Accepter
                        </button>
                        <button
                          className="nb-btn-reject-small"
                          onClick={(e) => handleRejectDemande(notif.demandeId, e)}
                        >
                          ❌ Rejeter
                        </button>
                      </div>
                    )}

                    {notif.type === 'final_approved' && notif.otherUserName && onNavigate && (
                      <div className="nb-notif-actions">
                        <button
                          className="nb-btn-message-small"
                          onClick={(e) => handleMessageOtherUser(notif, e)}
                        >
                          💬 Message {notif.otherUserName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
```

- [ ] **Step 2: Add the message button style to `NotificationBell.css`**

Open `client/src/interfaces/components/NotificationBell.css` and add at the bottom:

```css
.nb-btn-message-small {
  padding: 4px 10px;
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.nb-btn-message-small:hover { background: #dbeafe; }
```

- [ ] **Step 3: Commit**

```bash
git add client/src/interfaces/components/NotificationBell.jsx client/src/interfaces/components/NotificationBell.css
git commit -m "feat: add message quick-action button for final_approved notifications"
```

---

## Task 9: DDSMessage — pre-open conversation by openUserId

**Files:**
- Modify: `client/src/interfaces/DDS/DDSMessage.jsx`

- [ ] **Step 1: Accept openUserId prop and auto-select contact on mount**

Change the component signature and add a `useEffect`:

```jsx
export default function DDSMessage({ currentUser, openUserId }) {
```

Add this `useEffect` after the contacts-loading `useEffect` (after the Promise.all block):

```js
useEffect(() => {
  if (!openUserId || contacts.length === 0) return;
  const target = contacts.find(c => c._id === openUserId);
  if (target) setSelected(target);
}, [openUserId, contacts]);
```

- [ ] **Step 2: Commit**

```bash
git add client/src/interfaces/DDS/DDSMessage.jsx
git commit -m "feat: DDSMessage pre-opens conversation when openUserId prop is provided"
```

---

## Task 10: ChatMessage — pre-open conversation by openUserName

**Files:**
- Modify: `client/src/interfaces/components/Chatmessage.jsx`

The `ChatMessage` component (used by Doctor/Nurse/Pharmacist/Firefighter) needs to accept `openUserName` and auto-open the corresponding conversation in the `Inbox`.

- [ ] **Step 1: Thread openUserName from ChatMessage export to Inbox**

At the bottom of `Chatmessage.jsx`, the main export currently is:

```jsx
export default function ChatMessage({ role = "doctor", onNavigate, currentUser }) {
  const [activeConv, setActiveConv] = useState(null);
  ...
  return (
    ...
    {activeConv ? (
      <ChatWindow ... />
    ) : (
      <Inbox cfg={cfg} role={role} onSelect={setActiveConv}
        onNavigate={onNavigate} currentUser={currentUser}
        socket={socket} notifications={notifications} clearNotifs={clearNotifs} />
    )}
  );
}

export const DoctorMessage      = (p) => <ChatMessage {...p} role="doctor" />;
export const NurseMessage       = (p) => <ChatMessage {...p} role="nurse" />;
export const FirefighterMessage = (p) => <ChatMessage {...p} role="firefighter" />;
export const PharmacistMessage  = (p) => <ChatMessage {...p} role="pharmacist" />;
```

Replace the `ChatMessage` function signature and the `Inbox` render call:

```jsx
export default function ChatMessage({ role = "doctor", onNavigate, currentUser, openUserName }) {
  const [activeConv, setActiveConv] = useState(null);
  ...
  return (
    ...
    {activeConv ? (
      <ChatWindow ... />
    ) : (
      <Inbox cfg={cfg} role={role} onSelect={setActiveConv}
        onNavigate={onNavigate} currentUser={currentUser}
        socket={socket} notifications={notifications} clearNotifs={clearNotifs}
        openUserName={openUserName} />
    )}
  );
}
```

- [ ] **Step 2: In the `Inbox` function, auto-open conversation when openUserName is provided**

Find the `Inbox` function signature:
```jsx
function Inbox({ cfg, role, onSelect, onNavigate, currentUser, socket, notifications, clearNotifs }) {
```

Change to:
```jsx
function Inbox({ cfg, role, onSelect, onNavigate, currentUser, socket, notifications, clearNotifs, openUserName }) {
```

Add this `useEffect` inside `Inbox`, after the `loadConvs` call:

```js
useEffect(() => {
  if (!openUserName || convs.length === 0) return;
  const target = convs.find(c => c.name === openUserName);
  if (target) {
    handleSelect(target);
  } else {
    // Conversation doesn't exist yet — create it so the user can send the first reply
    const newConv = {
      id: `auto-${Date.now()}`,
      name: openUserName,
      avatar: '👤',
      lastMsg: '',
      time: 'maintenant',
      unread: 0,
      online: true,
    };
    setConvs(prev => [newConv, ...prev]);
    handleSelect(newConv);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [openUserName, convs.length]);
```

- [ ] **Step 3: Commit**

```bash
git add client/src/interfaces/components/Chatmessage.jsx
git commit -m "feat: ChatMessage auto-opens conversation when openUserName prop is provided"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Feature 1 (manager profile view): Tasks 1, 4, 5
- ✅ Feature 2 (message quick-action in notification): Tasks 2, 3 (otherUser fields), 6, 7, 8, 9, 10
- ✅ Feature 3 (auto-message timing + IDs): Task 3
- ✅ `otherUserName` stored in notification → used in NotificationBell button label (Task 8) → resolved at Task 9/10

**Type consistency check:**
- `openUserId` used in: Task 7 (App.js DDSView state), Task 8 (NotificationBell nav call), Task 9 (DDSMessage prop) ✅
- `openUserName` used in: Task 7 (App.js role views state), Task 8 (NotificationBell nav call), Task 10 (ChatMessage prop, Inbox prop) ✅
- `otherUserId` / `otherUserName`: added in Task 2 (schema), populated in Task 3 (routes), read in Task 8 (bell) ✅
- `UserProfileModal` props (`demande`, `onApprove`, `onReject`, `onClose`, `processingId`): defined in Task 4, consumed in Task 5 ✅

**No placeholders found.**

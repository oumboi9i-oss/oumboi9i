# Shift Manager Improvements Design

**Date:** 2026-06-15  
**Scope:** Three targeted improvements to the shift exchange workflow

---

## Problem Summary

1. **Manager can't view user profiles** before approving/rejecting a shift exchange in `DDSHome.jsx`
2. **`final_approved` notification has no quick action** to message the other party
3. **Auto-message sends at wrong time** (on user B accept, not on manager approval) and uses names instead of user IDs

---

## Feature 1 — Manager Profile View in Shift Exchange Table

### Current State
`DDSHome.jsx` shift exchanges tab shows a table: From | To | Date | Role | Actions.  
Rows are not clickable. No professional IDs visible. Manager must approve blind.

### Design

**New server route:**  
`GET /api/user/profile/:id?role=doctor|nurse|firefighter|pharmacist`  
- Looks up the user by MongoDB `_id` in the collection matching `role`
- Returns profile without password field
- Returns 404 if not found

**New `UserProfileModal` component** (`client/src/interfaces/DDS/UserProfileModal.jsx`):
- Opens as an overlay when a row is clicked in the shift exchanges table
- Renders two panels side by side: **Current Owner (User A)** and **New Owner (User B)**
- Each panel lazy-fetches `/api/user/profile/:id?role=...` using `proprietaireId`/`demandeurId` and `demande.role`
- Shows: full name, professional ID, specialty/service/grade, location, email
- Professional ID per role:
  - Doctor → `numOrdre`
  - Firefighter → `matricule`
  - Pharmacist → `numAgrement`
  - Nurse → `userId`
- Approve / Reject buttons in modal footer (replacing the inline table buttons — table buttons remain as fallback)
- Close button top-right

**`DDSHome.jsx` changes:**
- Each shift exchange row gets `cursor: pointer` and an `onClick` handler that opens `UserProfileModal` with the selected demande
- Pass `managerToken` to the modal for the authenticated fetch

---

## Feature 2 — "Message Other User" Quick Action in Final Approved Notification

### Current State
`final_approved` notifications in `NotificationBell.jsx` show text only. No action button.  
The `Notification` model has no field for the other party's ID.

### Design

**`Notification` schema change:**  
Add `otherUserId: { type: String, default: null }` and `otherUserName: { type: String, default: null }`

**Server: `director-approve` route change:**  
When creating the two `final_approved` notifications, populate both fields:
- Owner's notification → `otherUserId: demande.demandeurId`, `otherUserName: demande.demandeurName`
- Demandeur's notification → `otherUserId: demande.proprietaireId`, `otherUserName: demande.gardeOwner`

**`NotificationBell.jsx` changes:**
- Accept a new prop `onNavigate(page, params)` 
- For `final_approved` type, render a **"💬 Message [notif.otherUserName]"** button below the notification message
- On click: mark notification as read, call `onNavigate('message', { openUserId: notif.otherUserId })`

**`PageHeader.jsx` changes:**
- `NotificationBell` is rendered inside `PageHeader`. `PageHeader` already receives `currentUser`; add an `onNavigate` prop and pass it through to `NotificationBell`.
- All role home layouts already use `PageHeader` — they pass `onNavigate` to `PageHeader`.

**Role message components (DoctorMessage, NurseMessage, etc.):**
- Accept an optional `openUserId` prop
- If provided, auto-select and open the conversation thread with that user on mount

**Role message components (DoctorMessage, NurseMessage, etc.):**
- Accept an optional `openUserId` prop
- If provided, auto-open the conversation with that user on mount

---

## Feature 3 — Auto-Message Timing + ID Fix

### Current State
`demandeRoutes.js` `PUT /:id/accept` handler creates an auto-message:
```js
senderId:   demande.gardeOwner,      // BUG: name string, not ID
receiverId: demande.demandeurName,   // BUG: name string, not ID
```
This fires when User B accepts, before the manager has approved.

### Design

**Move** the `Message.create(...)` block from `PUT /:id/accept` to `PUT /:id/director-approve`.

**Fix the IDs:**
```js
senderId:   demande.proprietaireId,
receiverId: demande.demandeurId,
content:    `🎉 Shift exchange approved! Your shift has been successfully transferred.`,
```

The message now arrives after the manager's final approval, and is properly linked by user IDs so the chat threads display it correctly.

---

## Files Affected

| File | Change |
|------|--------|
| `Server/models/Notification.js` | Add `otherUserId` field |
| `Server/routes/demandeRoutes/demandeRoutes.js` | Move auto-message to director-approve; fix IDs; add `otherUserId` to final_approved notifications |
| `Server/server.js` | Register new `/api/user/profile/:id` route |
| `Server/routes/accountRoutes/getUserProfile.js` | New file — profile lookup by id + role |
| `client/src/interfaces/DDS/DDSHome.jsx` | Make shift rows clickable, open UserProfileModal |
| `client/src/interfaces/DDS/UserProfileModal.jsx` | New file — two-panel profile overlay |
| `client/src/interfaces/DDS/UserProfileModal.css` | New file — modal styles |
| `client/src/interfaces/components/NotificationBell.jsx` | Add `onNavigate` prop; add message button for `final_approved` |
| `client/src/components/PageHeader.jsx` | Add `onNavigate` prop; pass it to `NotificationBell` |
| Role message components (DoctorMessage, NurseMessage, etc.) | Accept `openUserId` prop to pre-open a conversation |
| Role home layouts (DDSHome, DoctorHome, etc.) | Pass `onNavigate` to `PageHeader` |

---

## Out of Scope

- Changing the shift exchange flow itself
- Modifying how demandes are created or accepted by users
- Notifications for other types beyond `final_approved`

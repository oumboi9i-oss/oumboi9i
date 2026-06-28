# UI Revamp Design Spec
**Date:** 2026-06-12  
**Approach:** Unified Design System (Approach A)  
**Status:** Approved

---

## Context

The app is a React healthcare/emergency management system with 6 user roles: Admin, Doctor, Nurse, Pharmacist, Firefighter, Manager (DDS). Each role has a Home, Garde (Shifts), Messages, Map, Profile, and Demandes view.

**Usage pattern:** Mixed — Admin is always on desktop; field roles (Doctor, Nurse, etc.) use both mobile and desktop.

**Pain points driving the revamp:**
1. Double navigation — App.js injects a top bar for every role, while each component also renders a fixed bottom nav. They conflict and waste screen real estate.
2. Admin panel built entirely with inline styles inside App.js (~300 lines), making it unmaintainable and visually inconsistent.
3. CSS class name conflicts — every component uses generic class names (`.container`, `.card`, `.list`, `.header`) that bleed into each other when loaded simultaneously.
4. CRUD forms (AddDoctor, ManageNurse, etc.) have independent, inconsistent CSS with no visual continuity with the role interfaces.

---

## Design Direction

**Clean & Professional** — Navy/blue primary, white cards, slate backgrounds. Clinical and trustworthy. Consistent across all roles with per-role accent colors for identity.

---

## 1. Design Tokens (`client/src/design-system.css`)

A single CSS file of custom properties imported once in `index.css`. All components reference these variables — no hardcoded color or spacing values anywhere else.

```css
:root {
  /* Colors */
  --color-primary:   #1e3a8a;   /* Navy — sidebar, headers */
  --color-accent:    #2563eb;   /* Blue — buttons, active states */
  --color-surface:   #f8fafc;   /* Slate 50 — page background */
  --color-card:      #ffffff;   /* White — cards, panels */
  --color-border:    #e2e8f0;   /* Slate 200 — borders */
  --color-text:      #0f172a;   /* Slate 900 — primary text */
  --color-muted:     #64748b;   /* Slate 500 — secondary text */
  --color-subtle:    #94a3b8;   /* Slate 400 — placeholders */
  --color-success:   #16a34a;   /* Green — available, confirmed */
  --color-danger:    #dc2626;   /* Red — errors, busy, logout */
  --color-warning:   #f59e0b;   /* Amber — pending, caution */

  /* Role accent colors (overridden per role wrapper) */
  --color-role:      #1e3a8a;   /* Default: navy */

  /* Spacing */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-6:  24px;
  --space-8:  32px;
  --space-12: 48px;

  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.07);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.12);

  /* Typography */
  --font-base: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Role accent overrides — applied to each role wrapper div */
.role-doctor      { --color-role: #1e3a8a; }
.role-nurse       { --color-role: #0d9488; }
.role-pharmacist  { --color-role: #059669; }
.role-firefighter { --color-role: #dc2626; }
.role-manager     { --color-role: #7c3aed; }
.role-admin       { --color-role: #1e3a8a; }
```

---

## 2. Navigation Architecture

### Problem
App.js currently renders a top bar for every role view (via `topBarStyle()`) AND each component renders a fixed `bottomNav`. This creates two overlapping navigation systems.

### Solution
Remove the App.js top bar for all field roles entirely. Replace with two shared components:

**`client/src/components/Sidebar.jsx`** — Desktop navigation (≥768px)
- Fixed left column, 64px wide
- Background: `var(--color-role)` (role accent)
- Logo at top, nav icons in middle, profile + logout at bottom
- Active icon gets `rgba(255,255,255,0.2)` background highlight
- Hidden on mobile via `@media (max-width: 767px) { display: none }`

**`client/src/components/BottomNav.jsx`** — Mobile navigation (<768px)
- Fixed bottom bar, full width
- White background, top border
- 5 icon tabs: Home, Messages, Shifts, Map, Profile
- Active tab: icon gets role-accent background tint, label gets `var(--color-role)` color
- Hidden on desktop via `@media (min-width: 768px) { display: none }`

**`client/src/components/PageHeader.jsx`** — Top content header (both breakpoints)
- Replaces the old App.js top bar
- White background, border-bottom
- Left: greeting + user name. Right: NotificationBell
- This is inside the content area, not a separate App.js overlay

Each role wrapper div gets the appropriate class: `<div className="role-doctor">`. The Sidebar and BottomNav read `--color-role` from CSS variables — no props needed for color.

**Admin navigation:** Admin gets a slightly different Sidebar with admin-specific icons (shield, map, pending-approvals). No BottomNav for admin (desktop-only).

---

## 3. CSS Namespacing

### Problem
Generic class names (`.container`, `.card`, `.list`, `.header`, `.mainContent`) used across all component CSS files collide when React loads them all simultaneously.

### Solution
Every component CSS file adopts a 2-3 letter prefix for all class names:

| Component | Prefix | Example |
|---|---|---|
| DoctorHome | `dh-` | `.dh-container`, `.dh-card` |
| NurseHome | `nh-` | `.nh-container`, `.nh-card` |
| PharmacistHome | `ph-` | `.ph-container`, `.ph-card` |
| FirefighterHome | `fh-` | `.fh-container`, `.fh-card` |
| DDSHome | `mh-` | `.mh-container`, `.mh-card` |
| DoctorGard | `dg-` | `.dg-container`, `.dg-card` |
| NurseGarde | `ng-` | `.ng-container` |
| DoctorMessage | `dm-` | `.dm-container` |
| DoctorProfile | `dp-` | `.dp-container` |
| AdminView | `av-` | `.av-container`, `.av-module-card` |
| Sidebar | `sb-` | `.sb-nav`, `.sb-icon` |
| BottomNav | `bn-` | `.bn-bar`, `.bn-tab` |
| PageHeader | `pgh-` | `.pgh-bar`, `.pgh-title` |
| DemandesPage | `dem-` | `.dem-container` |
| DirectorApprovalPage | `dir-` | `.dir-container` |
| NotificationBell | `nb-` | `.nb-bell`, `.nb-badge` |
| MapPage | `mp-` | `.mp-container` |
| CRUD forms (Add*, Manage*, GetSingle*) | `form-` | `.form-field`, `.form-btn` |

All values (colors, spacing, radius) in these files reference `var(--color-*)` and `var(--space-*)` tokens instead of hardcoded values.

---

## 4. Role Home Screens

All 5 role home screens (DoctorHome, NurseHome, PharmacistHome, FirefighterHome, DDSHome) get the same structural update:

**Layout (desktop):**
```
[Sidebar 64px] | [PageHeader] 
               | [Stats Row — 3 summary cards]
               | [Search bar]
               | [Category chips / filter row]
               | [List section title + count badge]
               | [Card grid — auto-fill minmax(320px, 1fr)]
```

**Layout (mobile):**
```
[PageHeader — role color background, compact]
[Search bar]
[Category chips]
[Card list — single column]
[BottomNav — fixed bottom]
```

**Stats row:** Three summary cards at the top of each home screen. Data sources:
- **Total count** — derived from the existing list fetch (e.g. `GET /api/doctor/getAll`)
- **On-shift count** — requires one additional `GET /api/garde/...` call filtered by role, same endpoint used by the Garde view
- **Pending requests** — requires one additional `GET /api/demandes/...` call filtered by role, same endpoint used by DemandesPage

All three calls are made in parallel via `Promise.all` on component mount.

**Card improvements:**
- Avatar area: role-tinted `background: var(--color-role)` at 10% opacity instead of raw emoji floating
- Namespaced classes (`dh-card`, `nh-card`, etc.)
- Hover uses `var(--color-accent)` border, no hardcoded `#2563eb`

**Removed:**
- The `shortcuts` section (quick-link buttons for Messages/Shifts/Demandes) — navigation is now handled by the Sidebar/BottomNav, so these shortcuts are redundant.
- Inline `style={{ position: "absolute" }}` for the NotificationBell — it moves into PageHeader.

---

## 5. Admin Panel

**AdminView extracted from App.js:**
- New file: `client/src/Admin/AdminView.jsx` — contains the full admin component (module grid + module content rendering)
- New file: `client/src/Admin/AdminView.css` — all styles with `.av-` prefix
- App.js `AdminView` inner function and all inline style objects deleted

**AdminView layout:**
```
[Sidebar — admin variant]
[PageHeader — "Admin Control Panel" / email]
[Stats row — 4 cards: Doctors, Nurses, Firefighters, Pending]
[Section: "Modules"]
[Module grid — 4 columns desktop, 2 columns tablet]
  - Doctors, Nurses, Pharmacists, Firefighters
  - Managers, Guards, Messages, Approvals
  - Transactions, Emails, Map
[Module content area — rendered below grid when a module is active]
[Back button — inside PageHeader left slot when module is active]
```

**Module cards:** White card, 1px border, `var(--radius-md)` radius, `var(--shadow-sm)`. On hover: `translateY(-3px)` + `var(--shadow-md)`. Color implemented via CSS `:hover` pseudo-class, not `onMouseOver` JS handlers.

**Pending approvals badge:** If pending count > 0, the Approvals module card shows a red count badge. Count fetched in AdminView via a lightweight API call on mount.

---

## 6. CRUD Forms (Add*, Manage*, GetSingle*)

All admin CRUD components share a single `client/src/styles/form.css` (`.form-` prefix). Individual per-component CSS files are deleted or reduced to layout-only overrides.

**Shared form styles:**
- `.form-field` — labeled input with consistent padding, border, radius, focus ring using `var(--color-accent)`
- `.form-btn` — primary action button using `var(--color-accent)` background
- `.form-btn-danger` — destructive action (delete) using `var(--color-danger)`
- `.form-table` — consistent table styles for Manage* list views
- `.form-card` — wrapper card using `var(--shadow-md)` and `var(--radius-lg)`
- `.form-section-title` — section heading style

---

## 7. App.js Cleanup

After the revamp, App.js responsibilities shrink to:
- Auth state management (`isLoggedIn`, `currentUser`)
- Route definitions (Routes + Route)
- `getDashboard()` role switch
- `handleLogin`, `handleLogout`, `handleUpdateUser`

**Deleted from App.js:**
- `topBarStyle()` function and all its inline style objects
- `AdminView` inner component (~300 lines)
- All `onMouseOver` / `onMouseOut` hover handlers
- All inline `style={{...}}` on nav bars

Target: App.js under 150 lines.

---

## 8. File Structure After Revamp

```
client/src/
  design-system.css           ← NEW: all CSS tokens
  index.css                   ← imports design-system.css
  App.js                      ← trimmed to ~150 lines
  components/
    Sidebar.jsx               ← NEW
    Sidebar.css               ← NEW
    BottomNav.jsx             ← NEW
    BottomNav.css             ← NEW
    PageHeader.jsx            ← NEW
    PageHeader.css            ← NEW
  styles/
    form.css                  ← NEW: shared CRUD form styles
  Admin/
    AdminView.jsx             ← NEW (extracted from App.js)
    AdminView.css             ← NEW
    AdminDashboard.jsx        ← keep (stats widget only)
    AdminDashboard.css        ← keep
    PendingAccounts.jsx       ← keep
  interfaces/
    Doctor/
      DoctorHome.jsx          ← updated: namespaced CSS, stats row, no shortcuts
      DoctorHome.css          ← updated: .dh-* prefix, CSS variables
      DoctorGard.jsx          ← updated: namespaced CSS
      DoctorGard.css          ← updated: .dg-* prefix
      DoctorMessage.jsx       ← updated
      DoctorMessage.css       ← updated: .dm-* prefix
      DoctorProfile.jsx       ← updated
      DoctorProfile.css       ← updated: .dp-* prefix
    Nurse/ ...                ← same pattern, .nh-* .ng-* .nm-* .np-*
    Pharmacist/ ...           ← .ph-* .pg-* .pm-* .pp-*
    FireFighter/ ...          ← .fh-* .fg-* .fm-* .fp-*
    DDS/ ...                  ← .mh-* .mg-* .mm-* .mp-*
    components/
      NotificationBell.jsx    ← updated: moved into PageHeader
      NotificationBell.css    ← updated: .nb-* prefix
      DemandesPage.css        ← updated: .dem-* prefix
      DirectorApprovalPage.css ← updated: .dir-* prefix
      MapPage.css             ← updated: .mp-* prefix
  Doctor/ Nurse/ ... (CRUD)   ← CSS replaced with shared form.css imports
```

---

## Success Criteria

- No duplicate class names across any two CSS files
- App.js under 150 lines
- Zero inline `style={{}}` attributes on navigation elements
- Sidebar visible on ≥768px, BottomNav visible on <768px (never both)
- All colors reference CSS custom properties — no hardcoded hex values in component CSS
- Admin panel renders from `AdminView.jsx`, not from App.js inline functions
- All CRUD forms use `form.css` shared styles

---

## Out of Scope

- React Router refactor (navigation stays `onNavigate` callback pattern)
- Backend / API changes
- Real-time chat UI (Chatmessage component)
- Map component internals
- Adding new features or screens

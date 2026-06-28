---
title: Localization Onboarding — Wilaya & Facility Selection
date: 2026-06-12
status: approved
---

## Overview

After a user's account is approved by an admin (`isActive: true`), their first login triggers a mandatory full-screen onboarding step. They must select their Algerian wilaya on an interactive SVG map, then pick their specific workplace facility (hospital, pharmacy, or fire station) from a Leaflet map populated with pre-seeded OpenStreetMap data. They cannot access the dashboard until this is complete. Managers and admins are exempt.

---

## User Flow

1. User logs in with an approved account.
2. App checks `currentUser.locationSet`. If `false` and role is `doctor | nurse | pharmacist | firefighter`, render `<LocationSetup>` instead of the dashboard.
3. **Step 1 — Wilaya selection:** Full-screen SVG map of Algeria with all 48 wilaya regions. Hovering highlights the region name. Clicking a wilaya advances to step 2.
4. **Step 2 — Facility selection:** Leaflet map centered on the selected wilaya (coordinates from existing `algerianCities.js`). Pins loaded from `GET /api/facilities?wilaya=X&type=Y`. Facility type is role-derived:
   - `doctor` / `nurse` → `hospital`
   - `pharmacist` → `pharmacy`
   - `firefighter` → `firestation`
5. User clicks a pin to select their facility. A confirm button appears.
6. On confirm, `PATCH /api/account/setLocation` is called. On success, `handleUpdateUser({ locationSet: true })` clears the gate and the user lands on their dashboard.
7. All subsequent logins go straight to the dashboard (`locationSet: true`).

---

## Backend

### New: `Facility` model (`Server/models/Facility.js`)

| Field     | Type   | Notes                                      |
|-----------|--------|--------------------------------------------|
| `name`    | String | Facility name from OSM                     |
| `type`    | String | Enum: `hospital`, `pharmacy`, `firestation`|
| `wilaya`  | String | Matches names in `algerianCities.js`       |
| `lat`     | Number |                                            |
| `lng`     | Number |                                            |
| `address` | String | OSM address string, may be empty           |
| `osmId`   | String | Unique OSM node/way ID — used for upsert deduplication |

### New: `facilityRoutes.js` (`Server/routes/facilityRoutes.js`)

- `GET /api/facilities` — query params: `wilaya`, `type`. Returns array of matching facilities. Auth-protected.
- `PATCH /api/account/setLocation` — body: `{ wilaya, facilityId, facilityName, lat, lng }`. Sets `locationSet: true` on the Account record. Writes to the matching role profile (Doctor / Nurse / Pharmacist / Firefighter model) using the fields that `MapPage.jsx` already reads: `wilaya` (string), `location` (set to `facilityName`), `lat` (number), `lng` (number). Auth-protected.

### Modified: `accountModel.js`

Add one field:
```js
locationSet: { type: Boolean, default: false }
```

Login response must include `locationSet` so the client can read it on the initial auth check.

### New: Seed script (`Server/scripts/seedFacilities.js`)

One-time script, run manually: `node Server/scripts/seedFacilities.js`

- Iterates all 48 wilayas from `algerianCities.js`.
- For each wilaya, runs three Overpass API queries (hospitals, pharmacies, fire stations) using `around:50000` (50 km radius) centred on the wilaya's coordinates from `algerianCities.js`. Overpass query format: `node["amenity"="hospital"](around:50000,{lat},{lng});` (and equivalent for pharmacy / fire_station).
- Upserts each result into the `Facility` collection keyed on `osmId`.
- Logs per-wilaya counts and any failures. Failures are skipped — the script is safe to re-run.
- Expected runtime: 2–3 minutes for all 48 wilayas.

---

## Frontend

### New files

**`client/src/interfaces/user/AlgeriaMap.jsx`**
- Renders Algeria's administrative SVG (sourced from Wikimedia Commons: `File:Algeria_location_map.svg` or the Natural Earth admin-1 GeoJSON converted to SVG paths) with 48 named wilaya `<path>` elements. The SVG is bundled as a static asset in `client/src/assets/algeria-map.svg`.
- Props: `onSelect(wilayaName)`, `selectedWilaya`, `themeColor`.
- Hover → highlight. Click → calls `onSelect`.

**`client/src/interfaces/user/LocationSetup.jsx`** + `LocationSetup.css`
- Full-screen overlay component (renders above everything, no sidebar/nav).
- State: `step` (`'wilaya' | 'facility'`), `selectedWilaya`, `selectedFacility`, `facilities[]`, `loading`, `error`.
- Step 1: renders `<AlgeriaMap>`. On wilaya select, fetches `/api/facilities`, sets `step = 'facility'`.
- Step 2: loads Leaflet (same CDN pattern as existing `MapPage.jsx`), centers on wilaya coords, places pins from `facilities[]`. Pin click sets `selectedFacility`. Confirm button calls `PATCH /api/account/setLocation`, then `props.onComplete()`.
- Back button on step 2 returns to step 1.
- Error state: if facilities query returns empty, shows "No [type] found in this wilaya — try a neighboring wilaya" with back button.

### Modified: `App.js`

In `getDashboard()`, before the `switch` on `currentUser.role`, add:

```js
if (!currentUser.locationSet && ['doctor','nurse','pharmacist','firefighter'].includes(currentUser.role)) {
  return <LocationSetup currentUser={currentUser} onComplete={() => handleUpdateUser({ locationSet: true })} />;
}
```

The `locationSet` field must be included in the user object stored in `localStorage` on login (Login.jsx passes it through already via `userData` spread).

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Seed script fails on a wilaya | Logs error, skips, continues. Re-run safe via `osmId` dedup. |
| `/api/facilities` returns empty array | "No [hospitals] found — try a neighboring wilaya" + back button |
| `PATCH /api/account/setLocation` fails | Inline error on confirm button, user can retry. Dashboard not shown. |
| User manually navigates to `/dashboard` before completing setup | App.js gate renders `<LocationSetup>` regardless of route. |
| Manager / admin role | `locationSet` check skipped entirely — go straight to dashboard. |

---

## Out of Scope

- Allowing users to change their facility later (profile page update — separate feature).
- Real-time OSM queries (pre-seeded DB is used).
- Google Maps API (OpenStreetMap / Overpass used throughout).
- Localization of facility names (OSM data in Arabic/French as-is).

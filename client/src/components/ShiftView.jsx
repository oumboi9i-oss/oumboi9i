import React, { useState, useEffect, useCallback } from 'react';
import './ShiftView.css';
import GardeDetailModal from '../interfaces/components/GardeDetailModal';

const API = `${process.env.REACT_APP_API_URL}/api`;

const ROLE_LABELS = {
  doctor:      'Doctor',
  nurse:       'Nurse',
  pharmacist:  'Pharmacist',
  firefighter: 'Firefighter',
  manager:     'Manager',
};

const ROLE_ORDER = ['doctor', 'nurse', 'pharmacist', 'firefighter'];
const ROLE_ICON  = { doctor: '👨‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒' };

function getTimePeriod(timeStr) {
  if (!timeStr) return null;
  const h = parseInt(timeStr.split(':')[0], 10);
  if (h >= 6 && h < 12)  return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'night';
}

function fmtDate(d) {
  try { return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return d; }
}

function fmtTime(t) {
  if (!t) return '';
  try {
    const [h, m] = t.split(':');
    const d = new Date();
    d.setHours(+h, +m);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch { return t; }
}

const STATUS_STYLE = {
  Active:    { bg: '#d1fae5', color: '#065f46' },
  Inactive:  { bg: '#fee2e2', color: '#991b1b' },
  Completed: { bg: '#dbeafe', color: '#1e40af' },
};

// Shared shift card, used by both the manager view and the default view.
function ShiftCard({ s, iconFallback, onSelect, onDelete }) {
  const sc = STATUS_STYLE[s.status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <div className="sv-card" onClick={() => onSelect(s)}>
      <div className="sv-card-icon">{iconFallback}</div>
      <div className="sv-card-body">
        <div className="sv-card-top">
          <span className="sv-card-owner">{s.owner || 'Unknown'}</span>
          {s.role && <span className="sv-role-chip">{ROLE_LABELS[s.role] || s.role}</span>}
        </div>
        <div className="sv-card-meta">
          <span>📅 {fmtDate(s.dateGarde)}</span>
          {s.time    && <span>🕐 {fmtTime(s.time)}</span>}
          {s.place   && <span>📍 {s.place}</span>}
          {s.service && <span>🩺 {s.service}</span>}
        </div>
      </div>
      <div className="sv-card-right">
        <span className="sv-badge" style={{ background: sc.bg, color: sc.color }}>
          {s.status || 'Active'}
        </span>
        <button className="sv-del-btn" onClick={e => onDelete(e, s._id)} title="Delete shift">
          🗑
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MANAGER VIEW — separate, simplified UI: no stat cards, no Active/
// My Shifts/Archived tabs, and no role tabs either. A manager is scoped
// to a single field role (currentUser.managedRole, set by the backend),
// and only ever sees shifts for that role.
// ─────────────────────────────────────────────────────────────────
function ManagerShiftView({ currentUser }) {
  const [shifts, setShifts]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [toast, setToast]         = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);

  const [filterDate,   setFilterDate]   = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  // Role this manager is responsible for — comes from backend (req.user.managerType,
  // the actual field name on the Manager mongoose schema). Falls back to 'doctor'
  // only if it's ever missing, so the view never breaks.
  const managedRole = currentUser?.managerType || 'doctor';

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchShifts = useCallback(() => {
    setLoading(true);
    // Scoped to managedRole — backend only returns shifts for this manager's role.
    fetch(`${API}/garde/getAll?role=${managedRole}`)
      .then(r => r.json())
      .then(data => { setShifts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [managedRole]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this shift?')) return;
    try {
      await fetch(`${API}/garde/${id}`, { method: 'DELETE' });
      setShifts(p => p.filter(s => s._id !== id));
      showToast('Shift deleted ✅');
    } catch {
      showToast('Delete failed ❌', 'error');
    }
  };

  const applyFilters = (list) => list.filter(s => {
    if (filterDate) {
      const sd = s.dateGarde ? s.dateGarde.split('T')[0] : '';
      if (sd !== filterDate) return false;
    }
    if (filterPeriod && getTimePeriod(s.time) !== filterPeriod) return false;
    return true;
  });

  const byDate = (a, b) => new Date(b.dateGarde) - new Date(a.dateGarde);

  const displayed = applyFilters(shifts).sort(byDate);

  const hasFilter = filterDate || filterPeriod;

  return (
    <div className="sv-container">
      {toast && <div className={`sv-toast sv-toast-${toast.type}`}>{toast.text}</div>}

      <div className="sv-header">
        <div>
          <h2 className="sv-title">🛡 Shift Management</h2>
          <p className="sv-subtitle">
            {ROLE_ICON[managedRole]} Browse {ROLE_LABELS[managedRole] || managedRole} shifts
          </p>
        </div>
      </div>

      {/* No role tabs here on purpose — this manager only ever sees their own role */}
      <div className="sv-filters">
        <input
          type="date"
          className="sv-filter-ctrl"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          title="Filter by date"
        />
        <select className="sv-filter-ctrl" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
          <option value="">Any Time</option>
          <option value="morning">🌅 Morning (6–12)</option>
          <option value="afternoon">☀️ Afternoon (12–18)</option>
          <option value="night">🌙 Night (18–6)</option>
        </select>
        {hasFilter && (
          <button className="sv-clear-btn" onClick={() => { setFilterDate(''); setFilterPeriod(''); }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="sv-empty">⏳ Loading shifts…</div>
      ) : displayed.length === 0 ? (
        <div className="sv-empty">
          <span>{ROLE_ICON[managedRole]}</span>
          <p>
            {hasFilter
              ? 'No shifts match your filters'
              : `No shifts found for ${ROLE_LABELS[managedRole] || managedRole}`}
          </p>
        </div>
      ) : (
        <div className="sv-list">
          {displayed.map(s => (
            <ShiftCard
              key={s._id}
              s={s}
              iconFallback={ROLE_ICON[managedRole]}
              onSelect={setSelectedShift}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="sv-count">
        {displayed.length} of {shifts.length} {ROLE_LABELS[managedRole] || managedRole} shifts shown
      </div>

      {selectedShift && (
        <GardeDetailModal
          garde={selectedShift}
          currentUser={currentUser}
          role={selectedShift.role || managedRole}
          onClose={() => setSelectedShift(null)}
          onDemande={() => {
            setSelectedShift(null);
            showToast('Request sent ✅');
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DEFAULT VIEW — original behavior, unchanged, used by doctor/nurse/
// pharmacist/firefighter.
// ─────────────────────────────────────────────────────────────────
function DefaultShiftView({ currentUser, role }) {
  const [shifts, setShifts]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);
  const [activeTab, setActiveTab]     = useState('active');
  const [selectedShift, setSelectedShift] = useState(null);

  const [filterDate,   setFilterDate]   = useState('');
  const [filterRole,   setFilterRole]   = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');

  const ownerName    = currentUser?.fullName || '';
  const ownerId      = currentUser?._id || currentUser?.userId || currentUser?.id;
  const placeDefault = currentUser?.hospital || currentUser?.location || currentUser?.nomPharmacie || '';
  const svcDefault   = currentUser?.specialty || currentUser?.service || '';

  const [form, setForm] = useState({
    dateGarde: '',
    time: '',
    place: placeDefault,
    service: svcDefault,
  });

  const showToast = useCallback((text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchShifts = useCallback(() => {
    setLoading(true);
    fetch(`${API}/garde/getAll?role=${role}`)
      .then(r => r.json())
      .then(data => { setShifts(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [role]);

  useEffect(() => { fetchShifts(); }, [fetchShifts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.dateGarde || !form.time) {
      showToast('Date and time are required ⚠️', 'error');
      return;
    }
    if (!ownerId) {
      showToast('Session error — please log in again ❌', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/garde/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: ownerName,
          ownerId,
          dateGarde: form.dateGarde,
          time: form.time,
          place: form.place,
          service: form.service,
          role: role || 'doctor',
          status: 'Active',
        }),
      });
      if (res.ok) {
        showToast('Shift added ✅');
        setForm({ dateGarde: '', time: '', place: placeDefault, service: svcDefault });
        setShowForm(false);
        fetchShifts();
      } else {
        const d = await res.json().catch(() => ({}));
        showToast(`Failed: ${d.message || 'Server error'} ❌`, 'error');
      }
    } catch (err) {
      showToast(`Error: ${err.message} ❌`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this shift?')) return;
    try {
      await fetch(`${API}/garde/${id}`, { method: 'DELETE' });
      setShifts(p => p.filter(s => s._id !== id));
      showToast('Shift deleted ✅');
    } catch {
      showToast('Delete failed ❌', 'error');
    }
  };

  const isOwned = (s) => s.ownerId === ownerId || s.owner === ownerName;

  const applyFilters = (list) => list.filter(s => {
    if (filterDate) {
      const sd = s.dateGarde ? s.dateGarde.split('T')[0] : '';
      if (sd !== filterDate) return false;
    }
    if (filterRole && s.role !== filterRole) return false;
    if (filterPeriod) {
      if (getTimePeriod(s.time) !== filterPeriod) return false;
    }
    return true;
  });

  const byDate = (a, b) => new Date(a.dateGarde) - new Date(b.dateGarde);

  const activeShifts   = applyFilters(shifts.filter(s => !s.archived && !isOwned(s))).sort(byDate);
  const myShifts       = applyFilters(shifts.filter(s => !s.archived && isOwned(s))).sort(byDate);
  const archivedShifts = applyFilters(shifts.filter(s => s.archived)).sort((a, b) => byDate(b, a));

  const displayed = activeTab === 'active' ? activeShifts
                  : activeTab === 'mine'   ? myShifts
                  :                          archivedShifts;

  const hasFilter = filterDate || filterRole || filterPeriod;

  return (
    <div className="sv-container">
      {toast && <div className={`sv-toast sv-toast-${toast.type}`}>{toast.text}</div>}

      <div className="sv-header">
        <div>
          <h2 className="sv-title">🛡 Shift Management</h2>
          <p className="sv-subtitle">View and manage available shifts</p>
        </div>
        <button className="sv-add-btn" onClick={() => setShowForm(v => !v)}>
          {showForm ? '✕ Cancel' : '➕ Add Shift'}
        </button>
      </div>

      <div className="sv-stats">
        <div className="sv-stat">
          <span className="sv-stat-val">{shifts.filter(s => !s.archived && !isOwned(s)).length}</span>
          <span className="sv-stat-label">Available</span>
        </div>
        <div className="sv-stat">
          <span className="sv-stat-val sv-stat-amber">{shifts.filter(s => !s.archived && isOwned(s)).length}</span>
          <span className="sv-stat-label">My Shifts</span>
        </div>
        <div className="sv-stat">
          <span className="sv-stat-val sv-stat-muted">{shifts.filter(s => s.archived).length}</span>
          <span className="sv-stat-label">Archived</span>
        </div>
      </div>

      {showForm && (
        <form className="sv-form" onSubmit={handleSubmit}>
          <h3 className="sv-form-title">➕ Add New Shift</h3>
          <div className="sv-form-grid">
            <div className="sv-field-group">
              <label className="sv-label">Date *</label>
              <input
                type="date"
                className="sv-input"
                value={form.dateGarde}
                onChange={e => setForm(f => ({ ...f, dateGarde: e.target.value }))}
                required
              />
            </div>
            <div className="sv-field-group">
              <label className="sv-label">Time *</label>
              <input
                type="time"
                className="sv-input"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                required
              />
            </div>
            <div className="sv-field-group sv-field-full">
              <label className="sv-label">Your Name</label>
              <input type="text" className="sv-input sv-input-ro" value={ownerName} readOnly />
            </div>
            <div className="sv-field-group">
              <label className="sv-label">Place</label>
              <input
                type="text"
                className="sv-input"
                placeholder="Hospital / Station / Pharmacy"
                value={form.place}
                onChange={e => setForm(f => ({ ...f, place: e.target.value }))}
              />
            </div>
            <div className="sv-field-group">
              <label className="sv-label">Service</label>
              <input
                type="text"
                className="sv-input"
                placeholder="Specialty / Department"
                value={form.service}
                onChange={e => setForm(f => ({ ...f, service: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="sv-submit-btn" disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Shift'}
          </button>
        </form>
      )}

      {/* Tab bar */}
      <div className="sv-tabs">
        <button
          className={`sv-tab ${activeTab === 'active' ? 'sv-tab-active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          🛡 Active
          <span className="sv-tab-count">{shifts.filter(s => !s.archived && !isOwned(s)).length}</span>
        </button>
        <button
          className={`sv-tab ${activeTab === 'mine' ? 'sv-tab-active' : ''}`}
          onClick={() => setActiveTab('mine')}
        >
          👤 My Shifts
          <span className="sv-tab-count">{shifts.filter(s => !s.archived && isOwned(s)).length}</span>
        </button>
        <button
          className={`sv-tab ${activeTab === 'archived' ? 'sv-tab-active' : ''}`}
          onClick={() => setActiveTab('archived')}
        >
          📦 Archived
          <span className="sv-tab-count">{shifts.filter(s => s.archived).length}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="sv-filters">
        <input
          type="date"
          className="sv-filter-ctrl"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          title="Filter by date"
        />
        <select className="sv-filter-ctrl" value={filterRole} onChange={e => setFilterRole(e.target.value)}>
          <option value="">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select className="sv-filter-ctrl" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}>
          <option value="">Any Time</option>
          <option value="morning">🌅 Morning (6–12)</option>
          <option value="afternoon">☀️ Afternoon (12–18)</option>
          <option value="night">🌙 Night (18–6)</option>
        </select>
        {hasFilter && (
          <button className="sv-clear-btn" onClick={() => { setFilterDate(''); setFilterRole(''); setFilterPeriod(''); }}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="sv-empty">⏳ Loading shifts…</div>
      ) : displayed.length === 0 ? (
        <div className="sv-empty">
          <span>{activeTab === 'archived' ? '📦' : '🛡'}</span>
          <p>
            {hasFilter
              ? 'No shifts match your filters'
              : activeTab === 'archived'
              ? 'No archived shifts'
              : activeTab === 'mine'
              ? 'You have no active shifts — add one above'
              : 'No available shifts from others'}
          </p>
        </div>
      ) : (
        <div className="sv-list">
          {displayed.map(s => (
            <ShiftCard
              key={s._id}
              s={s}
              iconFallback={activeTab === 'archived' ? '📦' : activeTab === 'mine' ? '👤' : '🛡'}
              onSelect={setSelectedShift}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <div className="sv-count">{displayed.length} of {shifts.length} shifts shown</div>

      {selectedShift && (
        <GardeDetailModal
          garde={selectedShift}
          currentUser={currentUser}
          role={selectedShift.role || role}
          onClose={() => setSelectedShift(null)}
          onDemande={() => {
            setSelectedShift(null);
            showToast('Request sent ✅');
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ENTRY POINT — picks the right view based on role. Nothing about how
// other roles call <ShiftView role=... /> needs to change.
// ─────────────────────────────────────────────────────────────────
export default function ShiftView({ currentUser, role }) {
  if (role === 'manager') {
    return <ManagerShiftView currentUser={currentUser} />;
  }
  return <DefaultShiftView currentUser={currentUser} role={role} />;
}
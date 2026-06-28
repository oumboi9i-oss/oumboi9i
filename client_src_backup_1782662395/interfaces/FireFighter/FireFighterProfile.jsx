import { useState, useEffect } from "react";
import "./FirefighterProfile.css";

export default function FirefighterProfile({ firefighterId, onNavigate, onUpdateUser }) {
  const [ff, setFf]           = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]     = useState(null);

  const showToast = (text, type = 'success') => { setToast({ text, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    if (!firefighterId) { setLoading(false); return; }
    fetch(`http://localhost:5000/api/firefighter/${firefighterId}`)
      .then(r => r.json())
      .then(data => {
        const f = data.firefighter || data;
        setFf(f);
        setForm({ fullName: f.fullName||'', gmail: f.gmail||'', matricule: f.matricule||'', grade: f.grade||'', uniteIntervention: f.uniteIntervention||'' });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [firefighterId]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await fetch(`http://localhost:5000/api/firefighter/${firefighterId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      showToast('Updated successfully ✅');
      setFf({ ...ff, ...form }); setEditing(false); onUpdateUser?.(form);
    } catch { showToast('Update failed ❌', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this firefighter?')) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:5000/api/firefighter/${firefighterId}`, { method: 'DELETE' });
      onNavigate?.('home');
    } catch { showToast('Delete failed ❌', 'error'); setDeleting(false); }
  };

  if (loading) return (
    <div className="fp-page">
      <div className="fp-skeleton-hero" />
      <div className="fp-main"><div className="fp-skeleton-card" /></div>
    </div>
  );

  if (!ff) return (
    <div className="fp-page">
      <div className="fp-main">
        <div className="fp-error-box"><span>⚠️</span><p>Firefighter not found</p>
          <button onClick={() => onNavigate?.('home')}>← Go Back</button></div>
      </div>
    </div>
  );

  const grades = ['Sapeur','Caporal','Sergent','Adjudant','Lieutenant','Capitaine','Commandant'];

  return (
    <div className="fp-page">
      {toast && <div className={`fp-toast ${toast.type}`}>{toast.text}</div>}

      <div className="fp-hero">
        <button className="fp-back-btn" onClick={() => onNavigate?.('home')}>← Back</button>
        <div className="fp-avatar">🚒</div>
        <div className="fp-hero-info">
          <h2 className="fp-hero-name">{ff.fullName || ff.matricule || 'Firefighter'}</h2>
          <span className="fp-hero-badge">{ff.grade || 'Firefighter'}</span>
        </div>
      </div>

      <div className="fp-main">
        {!editing ? (
          <>
            <div className="fp-info-card">
              {[
                { icon: '👤', label: 'Full Name', val: ff.fullName || 'Not specified' },
                { icon: '✉️', label: 'Email',     val: ff.gmail },
                { icon: '🔢', label: 'Matricule', val: ff.matricule },
                { icon: '⭐', label: 'Grade',     val: ff.grade || 'Not specified' },
                { icon: '🚒', label: 'Unit',      val: ff.uniteIntervention || 'Not specified' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="fp-info-row">
                  <span className="fp-info-icon">{icon}</span>
                  <div className="fp-info-text">
                    <span className="fp-info-label">{label}</span>
                    <span className="fp-info-val">{val}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="fp-actions">
              <button className="fp-btn edit" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              <button className="fp-btn delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </>
        ) : (
          <div className="fp-edit-card">
            <h3 className="fp-edit-title">Edit Firefighter</h3>
            {[
              { key: 'fullName',         label: 'Full Name', type: 'text'  },
              { key: 'gmail',            label: 'Email',     type: 'email' },
              { key: 'matricule',        label: 'Matricule', type: 'text'  },
              { key: 'uniteIntervention', label: 'Unit',     type: 'text'  },
            ].map(({ key, label, type }) => (
              <div key={key} className="fp-form-group">
                <label>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder={label} />
              </div>
            ))}
            <div className="fp-form-group">
              <label>Grade</label>
              <select value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                <option value="">-- Select Grade --</option>
                {grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="fp-edit-actions">
              <button className="fp-btn save" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button>
              <button className="fp-btn cancel" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

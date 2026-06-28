// DoctorProfile.jsx - Without Bottom Nav
import { useState, useEffect } from "react";
import "./DoctorProfile.css";

export default function DoctorProfile({ doctorId, onNavigate, onUpdateUser }) {
  const [doctor, setDoctor]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]     = useState(null);
  const [form, setForm]       = useState({});

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    fetch(`http://localhost:5000/api/doctor/${doctorId}`)
      .then(r => r.json())
      .then(data => {
        const d = data.doctor || data;
        setDoctor(d);
        setForm({ fullName: d.fullName||'', email: d.email||'', specialty: d.specialty||'', numOrdre: d.numOrdre||'', location: d.location||'', isAvailable: d.isAvailable??true });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [doctorId]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await fetch(`http://localhost:5000/api/doctor/${doctorId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
      });
      showToast('Doctor updated successfully ✅');
      setDoctor({ ...doctor, ...form }); setEditing(false);
      onUpdateUser?.(form);
    } catch { showToast('Update failed ❌', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this doctor?')) return;
    setDeleting(true);
    try {
      await fetch(`http://localhost:5000/api/doctor/${doctorId}`, { method: 'DELETE' });
      onNavigate?.('home');
    } catch { showToast('Delete failed ❌', 'error'); setDeleting(false); }
  };

  if (loading) return (
    <div className="dp-container">
      <div className="dp-skeletonHeader" />
      <div className="dp-skeletonCard" />
    </div>
  );

  if (!doctor) return (
    <div className="dp-container">
      <div className="dp-mainContent">
        <div className="dp-errorBox">
          <span>⚠️</span>
          <p>Doctor not found</p>
          <button className="dp-btnBack" onClick={() => onNavigate?.('home')}>← Go Back</button>
        </div>
      </div>
    </div>
  );

  const specialtyOptions = ['Cardiology','Pediatrics','Dermatology','Orthopedics','Neurology','General Practice','Surgery','Psychiatry'];

  return (
    <div className="dp-container">
      {toast && <div className={`dp-toast ${toast.type === 'success' ? 'dp-toastSuccess' : 'dp-toastError'}`}>{toast.text}</div>}

      {/* ── HERO ── */}
      <div className="dp-hero">
        <button className="dp-backBtn" onClick={() => onNavigate?.('home')}>← Back</button>
        <div className="dp-avatarWrap">
          <div className="dp-avatar">🧑‍⚕️</div>
          <span className={`dp-statusDot ${doctor.isAvailable ? 'dp-dotGreen' : 'dp-dotRed'}`} />
        </div>
        <div>
          <h1 className="dp-heroName">{doctor.fullName}</h1>
          <p className="dp-heroSpec">{doctor.specialty}</p>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="dp-mainContent">
        {!editing ? (
          <>
            <div className="dp-infoSection">
              {[
                { icon: '📧', label: 'Email',       val: doctor.email },
                { icon: '🩺', label: 'Specialty',   val: doctor.specialty },
                { icon: '📍', label: 'Location',    val: doctor.location || 'Not specified' },
                { icon: '✅', label: 'Availability', val: doctor.isAvailable ? 'Available' : 'Busy' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="dp-infoRow">
                  <div className="dp-infoIcon">{icon}</div>
                  <div className="dp-infoText">
                    <span className="dp-infoLabel">{label}</span>
                    <span className="dp-infoVal">{val}</span>
                  </div>
                </div>
              ))}
              <div className="dp-actions">
                <button className="dp-btnEdit" onClick={() => setEditing(true)}>✏️ Edit</button>
                <button className="dp-btnDelete" onClick={handleDelete} disabled={deleting}>
                  {deleting ? 'Deleting...' : '🗑️ Delete'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="dp-editForm">
            <h3 className="dp-editTitle">✏️ Edit Doctor</h3>
            <div className="dp-formGroup"><label>Full Name</label>
              <input type="text" value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Full Name" /></div>
            <div className="dp-formGroup"><label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" /></div>
            <div className="dp-formGroup"><label>Specialty</label>
              <select value={form.specialty} onChange={e => setForm({...form, specialty: e.target.value})}>
                <option value="">-- Select --</option>
                {specialtyOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select></div>
            <div className="dp-formGroup"><label>Num Ordre</label>
              <input type="text" value={form.numOrdre} onChange={e => setForm({...form, numOrdre: e.target.value})} placeholder="Num Ordre" /></div>
            <div className="dp-formGroup"><label>Location</label>
              <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} placeholder="Location" /></div>
            <div className="dp-editActions">
              <button className="dp-btnSave" onClick={handleUpdate} disabled={saving}>{saving ? 'Saving...' : '💾 Save'}</button>
              <button className="dp-btnCancel" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
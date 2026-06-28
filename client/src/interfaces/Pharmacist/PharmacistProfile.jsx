import { useState, useEffect } from "react";
import "./PharmacistProfile.css";

export default function PharmacistProfile({ pharmacistId, onNavigate, onUpdateUser }) {
  const [ph, setPh] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (text, type = 'success') => { 
    setToast({ text, type }); 
    setTimeout(() => setToast(null), 3000); 
  };

  const getDisplayName = (pharmacist) => {
    return pharmacist?.fullName || 
           pharmacist?.nomPharmacie || 
           pharmacist?.email || 
           pharmacist?.gmail || 
           "Pharmacist";
  };

  useEffect(() => {
    if (!pharmacistId) { 
      console.log("❌ No pharmacistId provided");
      setLoading(false); 
      return; 
    }
    
    console.log("🔍 Fetching pharmacist with ID:", pharmacistId);
    setLoading(true);
    
    fetch(`${process.env.REACT_APP_API_URL}/api/pharmacist/${pharmacistId}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
        return r.json();
      })
      .then(data => {
        const p = data.pharmacist || data;
        console.log("✅ Pharmacist data received:", p);
        setPh(p);
        setForm({ 
          fullName: p.fullName || '',
          gmail: p.gmail || '',
          nomPharmacie: p.nomPharmacie || '',
          numAgrement: p.numAgrement || '' 
        });
        setLoading(false);
      })
      .catch(err => {
        console.error("❌ Error fetching pharmacist:", err);
        setLoading(false);
      });
  }, [pharmacistId]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pharmacist/${pharmacistId}`, {
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(form),
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      showToast('Updated successfully ✅');
      setPh({ ...ph, ...form }); 
      setEditing(false); 
      onUpdateUser?.(form);
    } catch (err) { 
      console.error("❌ Update error:", err);
      showToast('Update failed ❌', 'error'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this pharmacist?')) return;
    setDeleting(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/pharmacist/${pharmacistId}`, { 
        method: 'DELETE' 
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      onNavigate?.('home');
    } catch (err) { 
      console.error("❌ Delete error:", err);
      showToast('Delete failed ❌', 'error'); 
      setDeleting(false); 
    }
  };

  if (loading) return (
    <div className="pp-page">
      <div className="pp-skeleton-hero" />
      <div className="pp-main"><div className="pp-skeleton-card" /></div>
    </div>
  );

  if (!ph) return (
    <div className="pp-page">
      <div className="pp-main">
        <div className="pp-error-box">
          <span>⚠️</span>
          <p>Pharmacist not found</p>
          <button onClick={() => onNavigate?.('home')}>← Go Back</button>
        </div>
      </div>
    </div>
  );

  const displayName = getDisplayName(ph);

  return (
    <div className="pp-page">
      {toast && <div className={`pp-toast ${toast.type}`}>{toast.text}</div>}

      <div className="pp-hero">
        <button className="pp-back-btn" onClick={() => onNavigate?.('home')}>← Back</button>
        <div className="pp-avatar">💊</div>
        <div className="pp-hero-info">
          <h2 className="pp-hero-name">{displayName}</h2>
          <span className="pp-hero-badge">{ph.nomPharmacie || ph.gmail || 'Pharmacist'}</span>
        </div>
      </div>

      <div className="pp-main">
        {!editing ? (
          <>
            <div className="pp-info-card">
              {[
                { icon: '👤', label: 'Full Name', val: ph.fullName || displayName },
                { icon: '✉️', label: 'Email', val: ph.gmail || ph.email || 'Not specified' },
                { icon: '🏪', label: 'Pharmacy Name', val: ph.nomPharmacie || 'Not specified' },
                { icon: '📋', label: 'Agrement Number', val: ph.numAgrement || 'Not specified' },
              ].map(({ icon, label, val }) => (
                <div key={label} className="pp-info-row">
                  <span className="pp-info-icon">{icon}</span>
                  <div className="pp-info-text">
                    <span className="pp-info-label">{label}</span>
                    <span className="pp-info-val">{val}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="pp-actions">
              <button className="pp-btn edit" onClick={() => setEditing(true)}>✏️ Edit Profile</button>
              <button className="pp-btn delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : '🗑️ Delete'}
              </button>
            </div>
          </>
        ) : (
          <div className="pp-edit-card">
            <h3 className="pp-edit-title">✏️ Edit Pharmacist</h3>
            {[
              { key: 'fullName', label: 'Full Name', type: 'text' },
              { key: 'gmail', label: 'Email', type: 'email' },
              { key: 'nomPharmacie', label: 'Pharmacy Name', type: 'text' },
              { key: 'numAgrement', label: 'Agrement Number', type: 'text' },
            ].map(({ key, label, type }) => (
              <div key={key} className="pp-form-group">
                <label>{label}</label>
                <input 
                  type={type} 
                  value={form[key] || ''} 
                  onChange={e => setForm({...form, [key]: e.target.value})} 
                  placeholder={label} 
                />
              </div>
            ))}
            <div className="pp-edit-actions">
              <button className="pp-btn save" onClick={handleUpdate} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
              <button className="pp-btn cancel" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
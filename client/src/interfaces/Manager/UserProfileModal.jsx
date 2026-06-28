// client/src/interfaces/Manager/UserProfileModal.jsx
import React, { useState, useEffect } from 'react';
import './UserProfileModal.css';

const PROF_ID = {
  doctor:      { field: 'numOrdre',    label: 'Ordre N°' },
  firefighter: { field: 'matricule',   label: 'Matricule' },
  pharmacist:  { field: 'numAgrement', label: 'N° Agrément' },
  nurse:       { field: 'userId',      label: 'ID' },
};

function useProfile(userId, role, token) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (!userId || !role) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch(`${process.env.REACT_APP_API_URL}/api/user/profile/${userId}?role=${role}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [userId, role, token]);

  return { data, loading, error };
}

function ProfilePanel({ title, userId, role, token, name, onMessage }) {
  const { data, loading, error } = useProfile(userId, role, token);

  const profId = PROF_ID[role] || { field: 'userId', label: 'ID' };

  const get = (...keys) => {
    if (!data) return '—';
    for (const k of keys) {
      if (data[k] !== undefined && data[k] !== null && data[k] !== '') return data[k];
    }
    return '—';
  };

  const fullName = get('fullName', 'nomPharmacie') !== '—' ? get('fullName', 'nomPharmacie') : (name || '—');
  const profIdValue = get(profId.field);
  const emailValue = get('gmail', 'email');
  const specValue = get('specialty', 'service', 'grade');
  const locationValue = get('location', 'wilaya');

  return (
    <div className="upm-panel">
      <div className="upm-panel-title">{title}</div>
      {loading && <div className="upm-loading">Loading…</div>}
      {error && <div className="upm-loading">Failed to load profile</div>}
      {!loading && !error && (
        <>
          <div className="upm-field">
            <span className="upm-label">Full Name</span>
            <span className="upm-value">{fullName}</span>
          </div>
          <div className="upm-field">
            <span className="upm-label">{profId.label}</span>
            <span className="upm-value">{profIdValue}</span>
          </div>
          <div className="upm-field">
            <span className="upm-label">Email</span>
            <span className="upm-value">{emailValue}</span>
          </div>
          <div className="upm-field">
            <span className="upm-label">Specialty / Service / Grade</span>
            <span className="upm-value">{specValue}</span>
          </div>
          <div className="upm-field">
            <span className="upm-label">Location</span>
            <span className="upm-value">{locationValue}</span>
          </div>
          {onMessage && (
            <button className="upm-btn-message" onClick={() => onMessage(userId, fullName !== '—' ? fullName : name)}>
              💬 Message {fullName !== '—' ? fullName : (name || '')}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Small status banner shown instead of action buttons when the demande has
// already been decided (used by the Notifications history page).
function StatusBanner({ demande }) {
  if (demande.directorStatus === 'approved' || demande.status === 'completed') {
    return <div className="upm-status-banner upm-status-approved">✅ Cette demande a été approuvée</div>;
  }
  if (demande.directorStatus === 'rejected' || demande.status === 'rejected') {
    return <div className="upm-status-banner upm-status-rejected">❌ Cette demande a été rejetée</div>;
  }
  return <div className="upm-status-banner upm-status-pending">📋 Cette demande est en attente</div>;
}

export default function UserProfileModal({ demande, onClose, onApprove, onReject, onMessage, token, readOnly = false }) {
  if (!demande) return null;

  const handleApprove = async () => {
    await onApprove(demande._id);
    onClose();
  };

  const handleReject = async () => {
    await onReject(demande._id);
    onClose();
  };

  const handleMessage = (userId, name) => {
    onClose();
    onMessage?.(userId, name);
  };

  return (
    <div className="upm-overlay" onClick={onClose}>
      <div className="upm-modal" onClick={e => e.stopPropagation()}>
        <div className="upm-header">
          <span className="upm-title">Shift Exchange Review</span>
          <button className="upm-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="upm-panels">
          <ProfilePanel
            title="Current Owner"
            userId={demande.proprietaireId}
            role={demande.role}
            token={token}
            name={demande.gardeOwner}
            onMessage={onMessage ? handleMessage : null}
          />
          <ProfilePanel
            title="New Owner"
            userId={demande.demandeurId}
            role={demande.role}
            token={token}
            name={demande.demandeurName}
            onMessage={onMessage ? handleMessage : null}
          />
        </div>

        {readOnly ? (
          <div className="upm-footer">
            <StatusBanner demande={demande} />
          </div>
        ) : (
          <div className="upm-footer">
            <button className="upm-btn-reject" onClick={handleReject}>
              ❌ Reject
            </button>
            <button className="upm-btn-approve" onClick={handleApprove}>
              ✅ Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
// client/src/interfaces/components/NotificationDetailModal.jsx
// Shared across Doctor, Nurse, Pharmacist, Firefighter.
//
// Given a notification (which carries a demandeId) and the current user,
// this fetches the underlying demande, figures out which side of the
// exchange is "the other person" relative to the notification's recipient,
// and shows that person's full profile — with a button to jump straight
// into a conversation with them.
import React, { useState, useEffect } from 'react';
import './NotificationDetailModal.css';

const API = 'http://localhost:5000/api';

const PROF_ID = {
  doctor:      { field: 'numOrdre',    label: 'Ordre N°' },
  firefighter: { field: 'matricule',   label: 'Matricule' },
  pharmacist:  { field: 'numAgrement', label: 'N° Agrément' },
  nurse:       { field: 'userId',      label: 'ID' },
};

const ROLE_EMOJI = { doctor: '🧑‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒' };

function useDemande(demandeId) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!demandeId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    fetch(`${API}/demande/${demandeId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [demandeId]);

  return { data, loading, error };
}

function useProfile(userId, role) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!userId || !role) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    fetch(`${API}/user/profile/${userId}?role=${role}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [userId, role]);

  return { data, loading, error };
}

export default function NotificationDetailModal({ notif, currentUser, onClose, onNavigate, onAccept, onReject }) {
  const { data: demande, loading: loadingDemande } = useDemande(notif?.demandeId);
  const [acting, setActing] = useState(false);

  const currentUserId = currentUser?._id || currentUser?.id;

  // Whichever side of the exchange isn't the person looking at the
  // notification is "the other user" we want to show.
  const otherUserId = demande
    ? (demande.proprietaireId === currentUserId ? demande.demandeurId : demande.proprietaireId)
    : null;

  const otherUserFallbackName = demande
    ? (demande.proprietaireId === currentUserId ? demande.demandeurName : demande.gardeOwner)
    : (notif?.otherUserName || null);

  const role = demande?.role || currentUser?.role;
  const { data: profile, loading: loadingProfile, error: profileError } = useProfile(otherUserId, role);

  const profId = PROF_ID[role] || { field: 'userId', label: 'ID' };

  const get = (...keys) => {
    if (!profile) return '—';
    for (const k of keys) {
      if (profile[k] !== undefined && profile[k] !== null && profile[k] !== '') return profile[k];
    }
    return '—';
  };

  const fullName    = get('fullName', 'nomPharmacie') !== '—' ? get('fullName', 'nomPharmacie') : (otherUserFallbackName || '—');
  const profIdValue = get(profId.field);
  const emailValue  = get('gmail', 'email');
  const specValue   = get('specialty', 'service', 'grade');
  const locationValue = get('location', 'wilaya');

  const handleMessage = () => {
    onClose();
    onNavigate?.('messages', { openUserName: otherUserFallbackName, openUserId: otherUserId });
  };

  const isPendingDecision = notif.type === 'demande_received' && demande?.status === 'pending';

  // Once the demande has moved past pending (proprietaire accepted it), both
  // sides should be able to jump straight into a conversation — no need to
  // wait for the manager's final approval. This covers:
  //  - the demandeur's own 'demande_accepted' notification
  //  - the proprietaire's original 'demande_received' notification, which
  //    they still have on file after clicking Accept on it
  //  - the eventual 'final_approved' notifications once a manager decides
  const canMessage = demande
    ? ['accepted', 'completed'].includes(demande.status)
    : notif.type === 'final_approved';

  const handleAccept = async () => {
    if (!window.confirm('✅ Accepter cette demande?')) return;
    setActing(true);
    try {
      await onAccept?.(notif.demandeId);
      onClose();
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('❌ Rejeter cette demande?')) return;
    setActing(true);
    try {
      await onReject?.(notif.demandeId);
      onClose();
    } finally {
      setActing(false);
    }
  };

  if (!notif) return null;

  return (
    <div className="ndm-overlay" onClick={onClose}>
      <div className="ndm-modal" onClick={e => e.stopPropagation()}>
        <div className="ndm-header">
          <span className="ndm-title">🔔 Notification</span>
          <button className="ndm-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="ndm-body">
          <p className="ndm-message">{notif.message}</p>

          {loadingDemande ? (
            <div className="ndm-loading">Chargement…</div>
          ) : !demande ? (
            <div className="ndm-empty">Détails indisponibles pour cette notification.</div>
          ) : (
            <div className="ndm-panel">
              <div className="ndm-panel-title">
                {ROLE_EMOJI[role] || '👤'} {role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Utilisateur'}
              </div>

              {loadingProfile ? (
                <div className="ndm-loading">Chargement du profil…</div>
              ) : profileError ? (
                <div className="ndm-empty">
                  Profil indisponible — <strong>{otherUserFallbackName || 'Utilisateur inconnu'}</strong>
                </div>
              ) : (
                <>
                  <div className="ndm-field">
                    <span className="ndm-label">Nom complet</span>
                    <span className="ndm-value">{fullName}</span>
                  </div>
                  <div className="ndm-field">
                    <span className="ndm-label">{profId.label}</span>
                    <span className="ndm-value">{profIdValue}</span>
                  </div>
                  <div className="ndm-field">
                    <span className="ndm-label">Email</span>
                    <span className="ndm-value">{emailValue}</span>
                  </div>
                  <div className="ndm-field">
                    <span className="ndm-label">Spécialité / Service / Grade</span>
                    <span className="ndm-value">{specValue}</span>
                  </div>
                  <div className="ndm-field">
                    <span className="ndm-label">Localisation</span>
                    <span className="ndm-value">{locationValue}</span>
                  </div>
                </>
              )}

              <div className="ndm-garde-meta">
                {demande.gardeDate && <span>📅 {new Date(demande.gardeDate).toLocaleDateString()}</span>}
                {demande.role && <span className="ndm-capitalize">{demande.role}</span>}
              </div>
            </div>
          )}
        </div>

        <div className="ndm-footer">
          {isPendingDecision && (
            <div className="ndm-decision-row">
              <button className="ndm-btn-reject" onClick={handleReject} disabled={acting}>
                ❌ Rejeter
              </button>
              <button className="ndm-btn-approve" onClick={handleAccept} disabled={acting}>
                ✅ Accepter
              </button>
            </div>
          )}
          {canMessage && (
            <button
              className="ndm-btn-message"
              onClick={handleMessage}
              disabled={!otherUserFallbackName && !otherUserId}
            >
              💬 Message {otherUserFallbackName || ''}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
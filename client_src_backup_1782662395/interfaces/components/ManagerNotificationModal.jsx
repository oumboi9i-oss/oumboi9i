// client/src/interfaces/components/ManagerNotificationModal.jsx
import React, { useState, useEffect } from 'react';
import UserProfileModal from '../Manager/UserProfileModal';

const API = 'http://localhost:5000/api';

function useDemande(demandeId) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!demandeId) { setLoading(false); return; }
    setLoading(true);
    fetch(`${API}/demande/${demandeId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => { setData(json); setLoading(false); })
      .catch(() => setLoading(false));
  }, [demandeId]);

  return { data, loading };
}

const STATUS_OF = (notif) => {
  if (notif.type === 'director_review') return notif.status || 'pending';
  if (notif.type === 'final_approved') return 'approved';
  if (notif.type === 'final_rejected' || notif.type === 'demande_rejected') return 'rejected';
  return 'pending';
};

export default function ManagerNotificationModal({ notif, currentUser, onClose, onNavigate, onDecided }) {
  const { data: demande, loading } = useDemande(notif?.demandeId);
  const token = localStorage.getItem('token');

  if (!notif) return null;
  if (loading) return null; // brief flash avoided; UserProfileModal itself shows internal loading once demande resolves
  if (!demande) return (
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1100}} onClick={onClose}>
    <div style={{background:'white',borderRadius:16,padding:24,maxWidth:400,width:'100%'}} onClick={e=>e.stopPropagation()}>
      <p style={{fontSize:16,marginBottom:16}}>{notif.message}</p>
      <button onClick={onClose} style={{background:'#64748b',color:'white',border:'none',padding:'10px 20px',borderRadius:8,cursor:'pointer'}}>Fermer</button>
    </div>
  </div>
);

  const approve = async (id) => {
    try {
      await fetch(`${API}/demande/${id}/director-approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      onDecided?.();
    } catch {}
  };

  const reject = async (id) => {
    try {
      await fetch(`${API}/demande/${id}/director-reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      onDecided?.();
    } catch {}
  };

  const handleMessage = (userId, name) => {
    onClose();
    onNavigate?.('messages', { openUserId: userId, openUserName: name });
  };

  return (
    <UserProfileModal
      demande={demande}
      token={token}
      onClose={onClose}
      onApprove={approve}
      onReject={reject}
      onMessage={handleMessage}
      readOnly={STATUS_OF(notif) !== 'pending'}
    />
  );
}
// client/src/interfaces/Manager/ManagerNotifications.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManagerNotifications.css';
import UserProfileModal from './UserProfileModal';

const API = `${process.env.REACT_APP_API_URL}/api`;

const ROLE_EMOJI = { doctor: '👨‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒', manager: '👔' };

const STATUS_OF = (notif) => {
  if (notif.type === 'account_request') return 'pending';
  if (notif.type === 'director_review') {
    return notif.status || 'pending';
  }
  if (notif.type === 'final_approved') return 'approved';
  if (notif.type === 'final_rejected' || notif.type === 'demande_rejected') return 'rejected';
  return 'pending';
};

const STATUS_META = {
  pending:  { label: 'En attente', icon: '📋', className: 'dn-chip-pending' },
  approved: { label: 'Acceptée',   icon: '✅', className: 'dn-chip-approved' },
  rejected: { label: 'Rejetée',    icon: '❌', className: 'dn-chip-rejected' },
};

const TABS = [
  { key: 'all',      label: 'Toutes' },
  { key: 'pending',  label: '📋 En attente' },
  { key: 'approved', label: '✅ Acceptées' },
  { key: 'rejected', label: '❌ Rejetées' },
];

const ManagerNotifications = ({ currentUser, onNavigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [demandeCache, setDemandeCache]   = useState({}); // demandeId -> demande
  const [loading, setLoading]             = useState(true);
  const [tab, setTab]                     = useState('all');
  const [selected, setSelected]           = useState(null); // { notif, demande }

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  const userId = currentUser?._id || currentUser?.id;

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await axios.get(`${API}/notification/user/${userId}`);
      const notifs = res.data || [];
      setNotifications(notifs);

      // Hydrate every unique demandeId so we can show role / owner / new-owner
      const ids = [...new Set(notifs.map(n => n.demandeId).filter(Boolean))];
      const entries = await Promise.all(
        ids.map(id =>
          axios.get(`${API}/demande/${id}`)
            .then(r => [id, r.data])
            .catch(() => [id, null])
        )
      );
      const cache = {};
      entries.forEach(([id, demande]) => { cache[id] = demande; });
      setDemandeCache(cache);
    } catch (err) {
      console.error('Error fetching notifications history:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openNotif = (notif) => {
    const demande = notif.demandeId ? demandeCache[notif.demandeId] : null;
    setSelected({ notif, demande });
  };

  const closeModal = () => setSelected(null);

  const approveFromModal = async (id) => {
    try {
      await axios.put(`${API}/demande/${id}/director-approve`, {}, authHeader);
      alert('✅ Shift exchange approved!');
      await fetchAll();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const rejectFromModal = async (id) => {
    try {
      await axios.put(`${API}/demande/${id}/director-reject`, {}, authHeader);
      await fetchAll();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMessage = (userId, name) => {
    onNavigate?.('messages', { openUserId: userId, openUserName: name });
  };

  const filtered = notifications.filter(n => tab === 'all' || STATUS_OF(n) === tab);

  const counts = {
    all:      notifications.length,
    pending:  notifications.filter(n => STATUS_OF(n) === 'pending').length,
    approved: notifications.filter(n => STATUS_OF(n) === 'approved').length,
    rejected: notifications.filter(n => STATUS_OF(n) === 'rejected').length,
  };

  return (
    <div className="dn-container">
      <div className="dn-header">
        <div>
          <h2 className="dn-title">🔔 Notifications</h2>
          <p className="dn-subtitle">Historique de toutes vos demandes d'échange</p>
        </div>
        <button className="dn-refresh-btn" onClick={fetchAll}>🔄 Refresh</button>
      </div>

      <div className="dn-tabs">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`dn-tab-btn ${tab === t.key ? 'dn-tab-active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label} <span className="dn-tab-count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dn-loading-wrap">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="dn-skeleton" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="dn-empty-state">
          <div className="dn-empty-icon">✅</div>
          <p>Aucune notification {tab !== 'all' ? `« ${TABS.find(t => t.key === tab)?.label} »` : ''}</p>
        </div>
      ) : (
        <div className="dn-list">
          {filtered.map(n => {
            const status = STATUS_OF(n);
            const meta = STATUS_META[status];
            const demande = n.demandeId ? demandeCache[n.demandeId] : null;
            const roleEmoji = demande ? (ROLE_EMOJI[demande.role] || '👤') : '🔔';

            return (
              <div
                key={n._id}
                className={`dn-card ${!n.read ? 'dn-card-unread' : ''}`}
                onClick={() => openNotif(n)}
              >
                <div className="dn-card-icon">{roleEmoji}</div>
                <div className="dn-card-body">
                  <p className="dn-card-message">{n.message}</p>
                  <div className="dn-card-meta">
                    {demande?.gardeDate && (
                      <span>📅 {new Date(demande.gardeDate).toLocaleDateString()}</span>
                    )}
                    {demande?.role && <span className="dn-capitalize">{demande.role}</span>}
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <span className={`dn-chip ${meta.className}`}>{meta.icon} {meta.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {selected && selected.demande && (
        <UserProfileModal
          demande={selected.demande}
          token={token}
          onClose={closeModal}
          onApprove={approveFromModal}
          onReject={rejectFromModal}
          onMessage={handleMessage}
          readOnly={STATUS_OF(selected.notif) !== 'pending'}
        />
      )}

      {selected && !selected.demande && (
        <div className="dn-overlay" onClick={closeModal}>
          <div className="dn-fallback-modal" onClick={e => e.stopPropagation()}>
            <p>{selected.notif.message}</p>
            <button className="dn-close-btn" onClick={closeModal}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerNotifications;
// client/src/interfaces/Manager/ManagerHome.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "./ManagerHome.css";
import UserProfileModal from './UserProfileModal';

const API = 'http://localhost:5000/api';

const roleLabel = { doctor: 'Doctors', nurse: 'Nurses', pharmacist: 'Pharmacists', firefighter: 'Firefighters' };
const roleEmoji = { doctor: '👨‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒' };

const ManagerHome = ({ currentUser, onNavigate }) => {
  const [tab, setTab]                   = useState('users');
  const [pendingUsers, setPendingUsers]  = useState([]);
  const [pendingShifts, setPendingShifts] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({ total: 0, onShift: 0, pending: 0 });
  const [selectedDemande, setSelectedDemande] = useState(null);

  const managerType = currentUser?.managerType;
  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [usersRes, shiftsRes, gardesRes, demandesRes] = await Promise.all([
        axios.get(`${API}/account/pending`, authHeader),
        axios.get(`${API}/demande`, authHeader),
        fetch("http://localhost:5000/api/garde/getAll").then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/demande").then(r => r.json()).catch(() => []),
      ]);

      const users = usersRes.data.accounts || [];
      setPendingUsers(users);

      const shifts = (shiftsRes.data || []).filter(d =>
        d.status === 'accepted' &&
        d.directorStatus === 'pending' &&
        d.role === managerType
      );
      setPendingShifts(shifts);

      const gardes   = Array.isArray(gardesRes)   ? gardesRes   : [];
      const demandes = Array.isArray(demandesRes) ? demandesRes : [];
      setStats({
        total:   users.length,
        onShift: gardes.filter(g => g.role === "manager").length,
        pending: demandes.filter(d => d.role === "manager" && d.status === "pending").length,
      });
    } catch (err) {
      console.error('Error fetching manager data:', err);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (id, email) => {
    if (!window.confirm(`Approve account for ${email}?`)) return;
    try {
      await axios.put(`${API}/account/${id}/approve`, {}, authHeader);
      setPendingUsers(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const rejectUser = async (id, email) => {
    if (!window.confirm(`Reject and delete account for ${email}?`)) return;
    try {
      await axios.delete(`${API}/account/${id}/reject`, authHeader);
      setPendingUsers(prev => prev.filter(a => a._id !== id));
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const approveShift = async (id) => {
    if (!window.confirm('Approve this shift exchange?')) return;
    try {
      await axios.put(`${API}/demande/${id}/director-approve`, {}, authHeader);
      setPendingShifts(prev => prev.filter(d => d._id !== id));
      setSelectedDemande(null);
      alert('✅ Shift exchange approved!');
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const rejectShift = async (id) => {
    if (!window.confirm('Reject this shift exchange?')) return;
    try {
      await axios.put(`${API}/demande/${id}/director-reject`, {}, authHeader);
      setPendingShifts(prev => prev.filter(d => d._id !== id));
      setSelectedDemande(null);
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const approveShiftFromModal = async (id) => {
    try {
      await axios.put(`${API}/demande/${id}/director-approve`, {}, authHeader);
      setPendingShifts(prev => prev.filter(d => d._id !== id));
      alert('✅ Shift exchange approved!');
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const rejectShiftFromModal = async (id) => {
    try {
      await axios.put(`${API}/demande/${id}/director-reject`, {}, authHeader);
      setPendingShifts(prev => prev.filter(d => d._id !== id));
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const typeLabel = managerType ? `${roleEmoji[managerType]} ${roleLabel[managerType]}` : 'All';

  return (
    <div className="dds-container">
      <div className="dds-search-box">
        <h1>Manager Dashboard</h1>
        <p>Managing: {typeLabel}</p>
      </div>

      <div className="dds-main-content">
        <div className="dds-stats">
          <div className="dds-stat-card">
            <div className="dds-stat-label">Total Managers</div>
            <div className="dds-stat-value">{stats.total}</div>
          </div>
          <div className="dds-stat-card">
            <div className="dds-stat-label">On Shift</div>
            <div className="dds-stat-value">{stats.onShift}</div>
          </div>
          <div className="dds-stat-card">
            <div className="dds-stat-label">Pending</div>
            <div className="dds-stat-value">{stats.pending}</div>
          </div>
        </div>

        <div className="dds-tabs">
          {[
            { key: 'users',  label: `👤 Pending Users (${pendingUsers.length})` },
            { key: 'shifts', label: `🔄 Shift Exchanges (${pendingShifts.length})` },
          ].map(t => (
            <button
              key={t.key}
              className={`dds-tab-btn ${tab === t.key ? 'dds-tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
          <button className="dds-refresh-btn" onClick={fetchAll}>
            🔄 Refresh
          </button>
          <button className="dds-refresh-btn" onClick={() => onNavigate?.('notifications')}>
            🔔 Notifications History
          </button>
        </div>

        {loading ? (
          <div className="dds-loading-wrap">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="dds-skeleton" />
            ))}
          </div>
        ) : tab === 'users' ? (
          pendingUsers.length === 0 ? (
            <DDSEmpty label="No pending user approvals" />
          ) : (
            <div className="dds-table-wrap">
              <table className="dds-table">
                <thead>
                  <tr>
                    {['Role', 'Email', 'Registered', 'Actions'].map(h => (
                      <th key={h} className="dds-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(acc => (
                    <tr key={acc._id}>
                      <td className="dds-td"><span className="dds-capitalize">{roleEmoji[acc.role] || '👤'} {acc.role}</span></td>
                      <td className="dds-td">{acc.email}</td>
                      <td className="dds-td">{new Date(acc.createdAt).toLocaleDateString()}</td>
                      <td className="dds-td">
                        <button className="dds-btn-approve" onClick={() => approveUser(acc._id, acc.email)}>✅ Approve</button>
                        <button className="dds-btn-reject"  onClick={() => rejectUser(acc._id, acc.email)}>❌ Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          pendingShifts.length === 0 ? (
            <DDSEmpty label="No pending shift exchange approvals" />
          ) : (
            <div className="dds-table-wrap">
              <table className="dds-table">
                <thead>
                  <tr>
                    {['From', 'To', 'Date', 'Role', 'Actions'].map(h => (
                      <th key={h} className="dds-th">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingShifts.map(d => (
                    <tr key={d._id} className="dds-row-clickable" onClick={() => setSelectedDemande(d)}>
                      <td className="dds-td">{d.gardeOwner || '—'}</td>
                      <td className="dds-td">{d.demandeurName || '—'}</td>
                      <td className="dds-td">{d.gardeDate ? new Date(d.gardeDate).toLocaleDateString() : '—'}</td>
                      <td className="dds-td"><span className="dds-capitalize">{roleEmoji[d.role] || ''} {d.role}</span></td>
                      <td className="dds-td" onClick={e => e.stopPropagation()}>
                        <button className="dds-btn-approve" onClick={() => approveShift(d._id)}>✅ Approve</button>
                        <button className="dds-btn-reject"  onClick={() => rejectShift(d._id)}>❌ Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
      {selectedDemande && (
        <UserProfileModal
          demande={selectedDemande}
          token={token}
          onClose={() => setSelectedDemande(null)}
          onApprove={approveShiftFromModal}
          onReject={rejectShiftFromModal}
        />
      )}
    </div>
  );
};

const DDSEmpty = ({ label }) => (
  <div className="dds-empty-state">
    <div className="dds-empty-state-icon">✅</div>
    <p>{label}</p>
  </div>
);

export default ManagerHome;
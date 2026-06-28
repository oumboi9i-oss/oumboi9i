import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api/account';

const roleEmoji = { doctor: '👨‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒', manager: '👔' };

const PendingAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/pending`, authHeader());
      setAccounts(res.data.accounts || []);
    } catch (err) {
      console.error('Error fetching pending accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleApprove = async (id, email) => {
    if (!window.confirm(`Approve account for ${email}?`)) return;
    try {
      await axios.put(`${API}/${id}/approve`, {}, authHeader());
      setAccounts(prev => prev.filter(a => a._id !== id));
      alert('✅ Account approved — user can now log in.');
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (id, email) => {
    if (!window.confirm(`Reject and permanently delete account for ${email}?`)) return;
    try {
      await axios.delete(`${API}/${id}/reject`, authHeader());
      setAccounts(prev => prev.filter(a => a._id !== id));
      alert('🗑️ Account rejected and removed.');
    } catch (err) {
      alert('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <p style={{ padding: 24 }}>⏳ Loading pending accounts...</p>;

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: '#64748b', margin: 0 }}>{accounts.length} account{accounts.length !== 1 ? 's' : ''} awaiting approval</p>
        <button onClick={fetchPending} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13 }}>🔄 Refresh</button>
      </div>

      {accounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
          <p style={{ fontSize: 16 }}>No pending accounts — you're all caught up.</p>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
              {['Role', 'Email', 'Registered', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map(acc => (
              <tr key={acc._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>
                  <span style={{ fontSize: 18, marginRight: 6 }}>{roleEmoji[acc.role] || '👤'}</span>
                  <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{acc.role}</span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{acc.email}</td>
                <td style={{ padding: '12px 16px', fontSize: 14 }}>{new Date(acc.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => handleApprove(acc._id, acc.email)} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13, marginRight: 8 }}>✅ Approve</button>
                  <button onClick={() => handleReject(acc._id, acc.email)} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>❌ Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default PendingAccounts;

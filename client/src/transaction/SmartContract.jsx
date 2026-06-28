import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './SmartContract.css';

const API = `${process.env.REACT_APP_API_URL}/api`;

const ROLE_LABEL = { doctor: 'Doctor', nurse: 'Nurse', pharmacist: 'Pharmacist', firefighter: 'Firefighter', manager: 'Manager' };
const ROLE_EMOJI = { doctor: '🧑‍⚕️', nurse: '👩‍⚕️', pharmacist: '💊', firefighter: '🚒', manager: '👔' };

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtFull(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function SmartContract() {
  const [txs, setTxs]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]     = useState('');

  const fetchTxs = useCallback(() => {
    setLoading(true);
    axios.get(`${API}/transaction/getAll`)
      .then(r => { setTxs(Array.isArray(r.data) ? r.data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchTxs(); }, [fetchTxs]);

  // Stats
  const total       = txs.length;
  const collected   = txs.reduce((s, t) => s + (t.amount || 0), 0);
  const now         = new Date();
  const monthTotal  = txs
    .filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((s, t) => s + (t.amount || 0), 0);
  const pending = txs.filter(t => t.status !== 'completed').length;

  const filtered = txs.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (t.gardeOwner || '').toLowerCase().includes(q) ||
           (t.demandeurName || '').toLowerCase().includes(q) ||
           (t.role || '').toLowerCase().includes(q) ||
           (t._id || '').toLowerCase().includes(q);
  });

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await axios.delete(`${API}/transaction/${id}`);
      if (selected?._id === id) setSelected(null);
      fetchTxs();
    } catch { alert('Delete failed'); }
  };

  return (
    <div className="sc-page">
      {/* Stats */}
      <div className="sc-stats">
        <div className="sc-stat">
          <span className="sc-stat-icon">💰</span>
          <div>
            <div className="sc-stat-val">{collected.toLocaleString()} DZD</div>
            <div className="sc-stat-label">Total Collected</div>
          </div>
        </div>
        <div className="sc-stat">
          <span className="sc-stat-icon">📋</span>
          <div>
            <div className="sc-stat-val">{total}</div>
            <div className="sc-stat-label">Transactions</div>
          </div>
        </div>
        <div className="sc-stat">
          <span className="sc-stat-icon">📅</span>
          <div>
            <div className="sc-stat-val">{monthTotal.toLocaleString()} DZD</div>
            <div className="sc-stat-label">This Month</div>
          </div>
        </div>
        <div className="sc-stat">
          <span className="sc-stat-icon">⚡</span>
          <div>
            <div className="sc-stat-val">200 DZD</div>
            <div className="sc-stat-label">Commission / Swap</div>
          </div>
        </div>
      </div>

      <div className="sc-body">
        {/* Transaction list */}
        <div className={`sc-list-panel ${selected ? 'sc-list-narrow' : ''}`}>
          <div className="sc-list-header">
            <h3 className="sc-list-title">⛓️ Smart Contract Ledger</h3>
            <div className="sc-search">
              <span>🔍</span>
              <input
                placeholder="Search by name or role…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && <button className="sc-clear" onClick={() => setSearch('')}>✕</button>}
            </div>
            <button className="sc-refresh" onClick={fetchTxs} title="Refresh">🔄</button>
          </div>

          {loading ? (
            <div className="sc-loading">⏳ Loading transactions…</div>
          ) : filtered.length === 0 ? (
            <div className="sc-empty">
              <span>📭</span>
              <p>{search ? 'No matches' : 'No transactions yet — they appear after approved shift swaps'}</p>
            </div>
          ) : (
            <div className="sc-table-wrap">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Role</th>
                    <th>Shift Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr
                      key={t._id}
                      className={`sc-row ${selected?._id === t._id ? 'sc-row-active' : ''}`}
                      onClick={() => setSelected(t)}
                    >
                      <td className="sc-cell-id">…{t._id?.slice(-5)}</td>
                      <td><span className="sc-name">{t.gardeOwner || '—'}</span></td>
                      <td><span className="sc-name">{t.demandeurName || '—'}</span></td>
                      <td>
                        <span className="sc-role-chip">
                          {ROLE_EMOJI[t.role] || '👤'} {ROLE_LABEL[t.role] || t.role || '—'}
                        </span>
                      </td>
                      <td>{fmt(t.gardeDate)}</td>
                      <td><strong className="sc-amount">{(t.amount || 200).toLocaleString()} DZD</strong></td>
                      <td>
                        <span className={`sc-badge sc-badge-${t.status}`}>
                          {t.status === 'completed' ? '✅ Completed' : t.status || 'Pending'}
                        </span>
                      </td>
                      <td>
                        <button className="sc-del" onClick={e => handleDelete(e, t._id)} title="Delete">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="sc-count">{filtered.length} of {total} transactions</div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="sc-detail">
            <div className="sc-detail-header">
              <h3>Transaction Detail</h3>
              <button className="sc-detail-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="sc-detail-hero">
              <div className="sc-detail-amount">{(selected.amount || 200).toLocaleString()} DZD</div>
              <span className={`sc-badge sc-badge-${selected.status}`}>
                {selected.status === 'completed' ? '✅ Completed' : selected.status || 'Pending'}
              </span>
            </div>

            <div className="sc-detail-rows">
              <div className="sc-detail-row">
                <span className="sc-detail-lbl">🆔 ID</span>
                <span className="sc-detail-val sc-mono">…{selected._id?.slice(-10)}</span>
              </div>
              <div className="sc-detail-row">
                <span className="sc-detail-lbl">📤 From</span>
                <span className="sc-detail-val">{selected.gardeOwner || '—'}</span>
              </div>
              <div className="sc-detail-row">
                <span className="sc-detail-lbl">📥 To</span>
                <span className="sc-detail-val">{selected.demandeurName || '—'}</span>
              </div>
              <div className="sc-detail-row">
                <span className="sc-detail-lbl">👥 Role</span>
                <span className="sc-detail-val">
                  {ROLE_EMOJI[selected.role] || '👤'} {ROLE_LABEL[selected.role] || selected.role || '—'}
                </span>
              </div>
              <div className="sc-detail-row">
                <span className="sc-detail-lbl">📅 Shift Date</span>
                <span className="sc-detail-val">{fmt(selected.gardeDate)}</span>
              </div>
              <div className="sc-detail-row">
                <span className="sc-detail-lbl">⚡ Type</span>
                <span className="sc-detail-val">{selected.type || 'shift_exchange'}</span>
              </div>
              <div className="sc-detail-row">
                <span className="sc-detail-lbl">🕐 Recorded</span>
                <span className="sc-detail-val">{fmtFull(selected.createdAt)}</span>
              </div>
              {selected.note && (
                <div className="sc-detail-row sc-detail-note">
                  <span className="sc-detail-lbl">📝 Note</span>
                  <span className="sc-detail-val">{selected.note}</span>
                </div>
              )}
            </div>

            <button className="sc-detail-del" onClick={e => handleDelete(e, selected._id)}>
              🗑️ Delete Transaction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

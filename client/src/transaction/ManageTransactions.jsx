import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManageTransactions.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const ManageTransactions = ({ onSelectTransaction }) => {
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [formData, setFormData] = useState({
        gardeId: '',
        demanderId: '',
        status: 'en_attente'
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [searchId, setSearchId] = useState('');
    const [modal, setModal] = useState({
        show: false, type: '', title: '', message: '', details: null, onConfirm: null
    });

    const showStatus = useCallback((type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }, []);

    const showModal = useCallback((config) => {
        setModal({ show: true, ...config });
    }, []);

    const closeModal = useCallback(() => {
        setModal(prev => ({ ...prev, show: false }));
    }, []);

    const handleCancel = useCallback(() => {
        setSelectedTransaction(null);
        setFormData({ gardeId: '', demanderId: '', status: 'en_attente' });
        setSearchId('');
    }, []);

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE}/transaction/getAll`);
            setTransactions(response.data);
            setLoading(false);
        } catch (error) {
            showStatus('error', 'Failed to load transactions');
            setLoading(false);
        }
    }, [showStatus]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const handleRowClick = useCallback((transaction) => {
        const id = transaction._id;
        setSearchId(id);
        setSelectedTransaction(transaction);
        setFormData({
            gardeId: transaction.gardeId || '',
            demanderId: transaction.demanderId || '',
            status: transaction.status || 'en_attente'
        });
    }, []);

    const handleViewDetails = useCallback((transaction) => {
        if (onSelectTransaction) onSelectTransaction(transaction._id);
    }, [onSelectTransaction]);

    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        if (!searchId.trim()) { showStatus('error', 'Please enter a transaction ID'); return; }
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/transaction/getAll`);
            const found = response.data.find(t => t._id === searchId.trim());
            if (found) { handleRowClick(found); showStatus('success', 'Transaction found!'); }
            else { setSelectedTransaction(null); showStatus('error', 'Transaction not found'); }
        } catch (error) {
            showStatus('error', 'Search error: ' + error.message);
        } finally { setLoading(false); }
    }, [searchId, showStatus, handleRowClick]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleDelete = useCallback((transaction) => {
        const id = transaction._id;
        showModal({
            type: 'confirmDelete',
            title: '🗑️ Confirm Delete',
            message: 'This action cannot be undone. Delete this transaction?',
            details: {
                'Transaction ID': id,
                'Demander ID': transaction.demanderId || 'N/A',
                'Status': transaction.status
            },
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_BASE}/transaction/${id}`);
                    showStatus('success', '✅ Transaction deleted!');
                    if (selectedTransaction?._id === id) handleCancel();
                    fetchTransactions();
                } catch (error) {
                    showStatus('error', '❌ Delete failed: ' + error.message);
                }
            }
        });
    }, [selectedTransaction, showModal, showStatus, fetchTransactions, handleCancel]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedTransaction) { showStatus('error', 'Please select a transaction first'); return; }
        showModal({
            type: 'confirmUpdate',
            title: '✏️ Confirm Update',
            message: 'Update this transaction?',
            details: {
                'Transaction ID': selectedTransaction._id,
                'New Status': formData.status,
                'Demander ID': formData.demanderId
            },
            onConfirm: async () => {
                setLoading(true);
                try {
                    await axios.put(`${API_BASE}/transaction/${selectedTransaction._id}`, formData, {
                        headers: { 'Content-Type': 'application/json' }
                    });
                    showStatus('success', '✅ Transaction updated!');
                    fetchTransactions();
                    handleCancel();
                } catch (error) {
                    showStatus('error', 'Update failed: ' + error.message);
                } finally { setLoading(false); }
            }
        });
    }, [selectedTransaction, formData, showModal, showStatus, fetchTransactions, handleCancel]);

    const getStatusClass = (status) => {
        const map = {
            'en_attente': 'pending', 'pending': 'pending',
            'accepté': 'approved', 'approved': 'approved',
            'refusé': 'rejected', 'rejected': 'rejected',
            'terminé': 'completed', 'completed': 'completed'
        };
        return map[status?.toLowerCase()] || 'pending';
    };

    const statusOptions = [
        { value: 'en_attente', label: '⏳ Pending' },
        { value: 'accepté', label: '✅ Approved' },
        { value: 'refusé', label: '❌ Rejected' },
        { value: 'terminé', label: '🎯 Completed' }
    ];

    return (
        <div className="manage-page">
            <div className="manage-card form-card">
                <h2 className="logo-text">💳 Manage<span>Transactions</span></h2>
                <p className="tagline">Hospital Management System</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSearch} className="search-box">
                    <input type="text" className="search-input"
                        placeholder="🔍 Search by Transaction ID..."
                        value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                    <button type="submit" className="search-btn" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                <div className="table-wrapper">
                    {loading && transactions.length === 0 ? (
                        <div className="loading">⏳ Loading...</div>
                    ) : transactions.length === 0 ? (
                        <div className="no-data">📭 No transactions found</div>
                    ) : (
                        <table className="transactions-table form-table">
                            <thead>
                                <tr>
                                    <th>ID</th><th>Garde ID</th><th>Demander ID</th>
                                    <th>Status</th><th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((transaction) => {
                                    const isSelected = selectedTransaction?._id === transaction._id;
                                    return (
                                        <tr key={transaction._id}
                                            className={isSelected ? 'selected' : ''}
                                            onClick={() => handleRowClick(transaction)}>
                                            <td>{transaction._id?.slice(-6)}</td>
                                            <td>{transaction.gardeId || 'N/A'}</td>
                                            <td>{transaction.demanderId || 'N/A'}</td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(transaction.status)}`}>
                                                    {transaction.status}
                                                </span>
                                            </td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <div className="action-buttons">
                                                    <button className="action-btn view"
                                                        onClick={() => handleViewDetails(transaction)}>
                                                        👁️ View
                                                    </button>
                                                    <button className="action-btn edit"
                                                        onClick={() => handleRowClick(transaction)}>
                                                        ✏️
                                                    </button>
                                                    <button className="action-btn delete"
                                                        onClick={() => handleDelete(transaction)}>
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {selectedTransaction && (
                    <>
                        <div className="divider"><span>✏️ Edit Mode</span></div>
                        <form onSubmit={handleSubmit} className="edit-form">
                            <h3>📋 Edit Transaction</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Transaction ID</label>
                                    <input type="text" value={selectedTransaction._id} disabled />
                                </div>
                                <div className="form-group">
                                    <label>Garde ID *</label>
                                    <input type="text" name="gardeId"
                                        value={formData.gardeId} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Demander ID *</label>
                                    <input type="text" name="demanderId"
                                        value={formData.demanderId} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange}>
                                        {statusOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn form-btn form-btn-danger" onClick={handleCancel}>❌ Cancel</button>
                                <button type="submit" className="main-btn form-btn" disabled={loading}>
                                    {loading ? '⏳ Updating...' : '💾 Update'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                <div className="warning-box">
                    <p>⚠️ Verify information before updating</p>
                    <p style={{fontSize:'12px',color:'#64748b'}}>📊 Total: <strong>{transactions.length}</strong></p>
                </div>
                <button className="refresh-btn" onClick={fetchTransactions}>🔄 Refresh List</button>
            </div>

            {modal.show && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-dialog" onClick={e => e.stopPropagation()}>
                        <h4>{modal.title}</h4>
                        <p>{modal.message}</p>
                        {modal.details && (
                            <div className="modal-details">
                                {Object.entries(modal.details).map(([k,v]) => (
                                    <div key={k}><strong>{k}:</strong> {String(v)}</div>
                                ))}
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={closeModal}>Cancel</button>
                            <button
                                className={`modal-btn confirm ${modal.type === 'confirmUpdate' ? 'edit' : ''}`}
                                onClick={() => { closeModal(); modal.onConfirm?.(); }}>
                                {modal.type === 'confirmDelete' ? '🗑️ Delete' : '✅ Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTransactions;
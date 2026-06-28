import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManageAccount.css';

const ManageAccount = () => {
    const [accounts, setAccounts] = useState([]);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user',
        phone: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [searchId, setSearchId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [modal, setModal] = useState({
        show: false,
        type: '',
        title: '',
        message: '',
        details: null,
        onConfirm: null
    });

    // ✅ Status message
    const showStatus = useCallback((type, message) => {
        setStatus({ type, message });
        setTimeout(() => setStatus({ type: '', message: '' }), 4000);
    }, []);

    // ✅ Modal handlers
    const showModal = useCallback((config) => {
        setModal({ show: true, ...config });
    }, []);

    const closeModal = useCallback(() => {
        setModal(prev => ({ ...prev, show: false }));
    }, []);

    // ✅ Cancel / Reset
    const handleCancel = useCallback(() => {
        setSelectedAccount(null);
        setFormData({ username: '', email: '', password: '', role: 'user', phone: '', isActive: true });
        setSearchId('');
    }, []);

    // ✅ Fetch all accounts
    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
           const res = await axios.get('/api/accounts');
            setAccounts(res.data.accounts || []);
            setLoading(false);
        } catch (err) {
            showStatus('error', 'Failed to load accounts');
            setLoading(false);
        }
    }, [showStatus]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    // ✅ Row click selection
    const handleRowClick = useCallback((account) => {
        const id = account.id || account._id;
        setSearchId(id);
        setSelectedAccount(account);
        setFormData({
            username: account.username || '',
            email: account.email || '',
            password: '',
            role: account.role || 'user',
            phone: account.phone || '',
            isActive: account.isActive ?? true
        });
    }, []);

    // ✅ Search by ID
    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        if (!searchId.trim()) {
            showStatus('error', 'Please enter an Account ID');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get('/api/accounts');
            const found = res.data.accounts.find(a => (a.id || a._id) === searchId.trim());
            if (found) {
                handleRowClick(found);
                showStatus('success', 'Account found!');
            } else {
                setSelectedAccount(null);
                showStatus('error', 'Account not found');
            }
        } catch (err) {
            showStatus('error', 'Search error: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [searchId, showStatus, handleRowClick]);

    // ✅ Input change
    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    }, []);

    // ✅ Delete with modal
    const handleDelete = useCallback((account) => {
        const id = account.id || account._id;
        showModal({
            type: 'confirmDelete',
            title: '🗑️ Confirm Delete',
            message: 'This action cannot be undone. Delete this account?',
            details: {
                'Account ID': id,
                'Username': account.username || 'N/A',
                'Email': account.email || 'N/A',
                'Role': account.role || 'N/A'
            },
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/account/delete/${id}`);
                    showStatus('success', `✅ Account ${id} deleted!`);
                    if (selectedAccount && (selectedAccount.id === id || selectedAccount._id === id)) {
                        handleCancel();
                    }
                    fetchAccounts();
                } catch (err) {
                    showStatus('error', '❌ Delete failed: ' + err.message);
                }
            }
        });
    }, [selectedAccount, showModal, showStatus, fetchAccounts, handleCancel]);

    // ✅ Update with modal
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedAccount) {
            showStatus('error', 'Please select an account first');
            return;
        }
        showModal({
            type: 'confirmUpdate',
            title: '✏️ Confirm Update',
            message: 'Update this account information?',
            details: {
                'Account ID': selectedAccount.id || selectedAccount._id,
                'Username': formData.username,
                'Email': formData.email,
                'Role': formData.role
            },
            onConfirm: async () => {
                setLoading(true);
                try {
                    const id = selectedAccount.id || selectedAccount._id;
                    const updateData = { ...formData };
                    if (!formData.password) delete updateData.password;
                    
                    await axios.put(`/api/account/update/${id}`, updateData);
                    showStatus('success', `✅ Account ${id} updated!`);
                    fetchAccounts();
                    handleCancel();
                } catch (err) {
                    showStatus('error', 'Update failed: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        });
    }, [selectedAccount, formData, showModal, showStatus, fetchAccounts, handleCancel]);

    // ✅ Filter for text search
    const filteredAccounts = accounts.filter(account => {
        const q = searchQuery.toLowerCase();
        return (account.username || '').toLowerCase().includes(q) ||
               (account.email || '').toLowerCase().includes(q) ||
               (account.role || '').toLowerCase().includes(q) ||
               (account.phone || '').toLowerCase().includes(q) ||
               ((account.id || account._id) || '').toLowerCase().includes(q);
    });

    // ✅ Role badge color
    const getRoleBadge = (role) => {
        const map = {
            'admin': { bg: '#fee2e2', color: '#dc2626', text: '👑 Admin' },
            'doctor': { bg: '#dbeafe', color: '#1e40af', text: '👨‍⚕️ Doctor' },
            'nurse': { bg: '#dcfce7', color: '#16a34a', text: '🩺 Nurse' },
            'pharmacist': { bg: '#f3e8ff', color: '#6b21a8', text: '💊 Pharmacist' },
            'user': { bg: '#f1f5f9', color: '#475569', text: '👤 User' }
        };
        return map[role?.toLowerCase()] || { bg: '#f1f5f9', color: '#64748b', text: role || 'N/A' };
    };

    // ✅ Role options for edit form
    const roleOptions = [
        { value: 'user', label: '👤 User' },
        { value: 'admin', label: '👑 Admin' },
        { value: 'doctor', label: '👨‍⚕️ Doctor' },
        { value: 'nurse', label: '🩺 Nurse' },
        { value: 'pharmacist', label: '💊 Pharmacist' }
    ];

    return (
        <div className="manage-page">
            <div className="manage-card">
                <div className="logo-text">👤 Manage<span>Account</span></div>
                <p className="tagline">Hospital Management System</p>

                {status.message && (
                    <div className={`status-message ${status.type}`}>{status.message}</div>
                )}

                {/* ID Search */}
                <form onSubmit={handleSearch} className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔍 Search by Account ID..."
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                    <button type="submit" className="search-btn" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {/* Text Filter */}
                <div className="search-box" style={{ marginBottom: '10px' }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔎 Filter by username, email, role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="button" className="search-btn" onClick={() => setSearchQuery('')}>
                        {searchQuery ? '🗑️ Clear' : '🔍 Filter'}
                    </button>
                </div>

                {/* Table */}
                <div className="table-wrapper">
                    {loading && accounts.length === 0 ? (
                        <div className="loading">⏳ Loading accounts...</div>
                    ) : filteredAccounts.length === 0 ? (
                        <div className="no-data">
                            {searchQuery ? 'No accounts match your search' : '📭 No accounts found'}
                        </div>
                    ) : (
                        <table className="accounts-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.map((account) => {
                                    const accountId = account.id || account._id;
                                    const isSelected = selectedAccount && (selectedAccount.id === accountId || selectedAccount._id === accountId);
                                    const badge = getRoleBadge(account.role);
                                    
                                    return (
                                        <tr 
                                            key={accountId}
                                            className={isSelected ? 'selected' : ''}
                                            onClick={() => handleRowClick(account)}
                                        >
                                            <td>{accountId}</td>
                                            <td>
                                                <strong>{account.username || 'N/A'}</strong>
                                                {account.phone && <br />}
                                                {account.phone && <small className="text-muted">📱 {account.phone}</small>}
                                            </td>
                                            <td><span className="email-cell">{account.email || 'N/A'}</span></td>
                                            <td>
                                                <span className="role-badge" style={{ background: badge.bg, color: badge.color }}>
                                                    {badge.text}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${account.isActive ? 'active' : 'inactive'}`}>
                                                    {account.isActive ? '🟢 Active' : '🔴 Inactive'}
                                                </span>
                                            </td>
                                            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                <button className="action-btn edit" onClick={() => handleRowClick(account)}>✏️ Edit</button>
                                                <button className="action-btn delete" onClick={() => handleDelete(account)}>🗑️ Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Edit Form */}
                {selectedAccount && (
                    <div className="divider"><span>✏️ Edit Mode</span></div>
                )}

                {selectedAccount && (
                    <form onSubmit={handleSubmit} className="edit-form">
                        <h3>📋 Edit Account Information</h3>
                        
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Username *</label>
                                <input 
                                    type="text" 
                                    name="username" 
                                    placeholder="Enter username" 
                                    value={formData.username} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Email *</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    placeholder="Enter email" 
                                    value={formData.email} 
                                    onChange={handleInputChange} 
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Password (leave blank to keep)</label>
                                <input 
                                    type="password" 
                                    name="password" 
                                    placeholder="New password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    placeholder="Enter phone" 
                                    value={formData.phone} 
                                    onChange={handleInputChange} 
                                />
                            </div>
                            <div className="form-group">
                                <label>Role</label>
                                <select 
                                    name="role" 
                                    value={formData.role} 
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    {roleOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group checkbox-group">
                                <label className="checkbox-label">
                                    <input 
                                        type="checkbox" 
                                        name="isActive" 
                                        checked={formData.isActive} 
                                        onChange={handleInputChange} 
                                    />
                                    <span>🟢 Account Active</span>
                                </label>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="button" className="cancel-btn" onClick={handleCancel}>❌ Cancel</button>
                            <button type="submit" className="main-btn" disabled={loading}>
                                {loading ? '⏳ Updating...' : '💾 Update'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="warning-box">
                    <p>⚠️ Verify information accuracy before updating</p>
                    <p style={{fontSize:'12px',color:'#64748b'}}>📊 Showing {filteredAccounts.length} of {accounts.length} accounts</p>
                </div>

                <button className="refresh-btn" onClick={fetchAccounts}>🔄 Refresh List</button>
            </div>

            {/* ============ MODAL DIALOG ============ */}
            {modal.show && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-dialog" onClick={e => e.stopPropagation()}>
                        <h4>{modal.title}</h4>
                        <p>{modal.message}</p>
                        {modal.details && (
                            <div className="modal-details">
                                {Object.entries(modal.details).map(([key, value]) => (
                                    <div key={key}><strong>{key}:</strong> {String(value)}</div>
                                ))}
                            </div>
                        )}
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={closeModal}>Cancel</button>
                            <button 
                                className={`modal-btn confirm ${modal.type === 'confirmUpdate' ? 'edit' : ''}`}
                                onClick={() => { closeModal(); modal.onConfirm?.(); }}
                            >
                                {modal.type === 'confirmDelete' ? '🗑️ Delete' : '✅ Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageAccount;
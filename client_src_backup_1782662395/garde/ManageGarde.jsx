import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManageGarde.css';
import '../styles/form.css';

const API_BASE = 'http://localhost:5000/api';

const ManageShift = ({ onSelectGarde }) => {
    const [shifts, setShifts] = useState([]);
    const [selectedShift, setSelectedShift] = useState(null);
    const [formData, setFormData] = useState({
        owner: '',
        dateGarde: '',
        status: ''
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
        setSelectedShift(null);
        setFormData({ owner: '', dateGarde: '', status: '' });
        setSearchId('');
    }, []);

    const fetchShifts = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/garde/getAll`);
            setShifts(res.data || []);
            setLoading(false);
        } catch (err) {
            showStatus('error', 'Failed to load shifts');
            setLoading(false);
        }
    }, [showStatus]);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    const handleRowClick = useCallback((shift) => {
        const id = shift._id;
        setSearchId(id);
        setSelectedShift(shift);
        setFormData({
            owner: shift.owner || '',
            dateGarde: shift.dateGarde ? shift.dateGarde.split('T')[0] : '',
            status: shift.status || ''
        });
    }, []);

    // ✅ دالة جديدة باش نبعثو الـ _id لـ GetSingleGarde (عبر AdminView)
    const handleViewDetails = useCallback((shift) => {
        const id = shift._id;
        console.log('👁️ Viewing shift _id:', id);
        if (onSelectGarde) {
            onSelectGarde(id);
        }
    }, [onSelectGarde]);

    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        if (!searchId.trim()) {
            showStatus('error', 'Please enter a Shift ID');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/garde/getAll`);
            const found = res.data.find(g => g._id === searchId.trim());
            if (found) {
                handleRowClick(found);
                showStatus('success', 'Shift found!');
            } else {
                setSelectedShift(null);
                showStatus('error', 'Shift not found');
            }
        } catch (err) {
            showStatus('error', 'Search error: ' + err.message);
        } finally {
            setLoading(false);
        }
    }, [searchId, showStatus, handleRowClick]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleDelete = useCallback((shift) => {
        const id = shift._id;
        showModal({
            type: 'confirmDelete',
            title: '🗑️ Confirm Delete',
            message: 'This action cannot be undone. Delete this shift?',
            details: {
                'Shift ID': id,
                'Owner': shift.owner || 'N/A',
                'Date': shift.dateGarde || 'N/A',
                'Status': shift.status || 'N/A'
            },
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_BASE}/garde/${id}`);
                    showStatus('success', `✅ Shift deleted!`);
                    if (selectedShift && selectedShift._id === id) handleCancel();
                    fetchShifts();
                } catch (err) {
                    showStatus('error', '❌ Delete failed: ' + err.message);
                }
            }
        });
    }, [selectedShift, showModal, showStatus, fetchShifts, handleCancel]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedShift) {
            showStatus('error', 'Please select a shift first');
            return;
        }
        showModal({
            type: 'confirmUpdate',
            title: '✏️ Confirm Update',
            message: 'Update this shift information?',
            details: {
                'Shift ID': selectedShift._id,
                'Owner': formData.owner,
                'Date': formData.dateGarde,
                'Status': formData.status
            },
            onConfirm: async () => {
                setLoading(true);
                try {
                    const id = selectedShift._id;
                    await axios.put(`${API_BASE}/garde/${id}`, formData);
                    showStatus('success', `✅ Shift updated!`);
                    fetchShifts();
                    handleCancel();
                } catch (err) {
                    showStatus('error', 'Update failed: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        });
    }, [selectedShift, formData, showModal, showStatus, fetchShifts, handleCancel]);

    const filteredShifts = shifts.filter(g => {
        const q = searchQuery.toLowerCase();
        return (g.owner || '').toLowerCase().includes(q) ||
               (g.status || '').toLowerCase().includes(q) ||
               (g.dateGarde || '').toLowerCase().includes(q) ||
               (g._id || '').toLowerCase().includes(q);
    });

    const statusOptions = [
        { value: '', label: '-- Select Status --' },
        { value: 'Active', label: '🟢 Active' },
        { value: 'Pending', label: '🟡 Pending' },
        { value: 'Completed', label: '✅ Completed' },
        { value: 'Cancelled', label: '❌ Cancelled' }
    ];

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const map = {
            'Active': { bg: '#dcfce7', color: '#16a34a', text: '🟢 Active' },
            'Pending': { bg: '#fef3c7', color: '#92400e', text: '🟡 Pending' },
            'Completed': { bg: '#dbeafe', color: '#1e40af', text: '✅ Completed' },
            'Cancelled': { bg: '#fee2e2', color: '#dc2626', text: '❌ Cancelled' }
        };
        return map[status] || { bg: '#f1f5f9', color: '#64748b', text: status || 'N/A' };
    };

    return (
        <div className="manage-page">
            <div className="manage-card form-card">
                <div className="logo-text">📅 Manage<span>Shifts</span></div>
                <p className="tagline">Shift & Schedule Management</p>

                {status.message && (
                    <div className={`status-message form-status ${status.type}`}>{status.message}</div>
                )}

                <form onSubmit={handleSearch} className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔍 Search by Shift ID..."
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                    />
                    <button type="submit" className="search-btn" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                <div className="search-box" style={{ marginBottom: '10px' }}>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔎 Filter by owner, status, date..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="button" className="search-btn" onClick={() => setSearchQuery('')}>
                        {searchQuery ? '🗑️ Clear' : '🔍 Filter'}
                    </button>
                </div>

                <div className="table-wrapper">
                    {loading && shifts.length === 0 ? (
                        <div className="loading">⏳ Loading shifts...</div>
                    ) : filteredShifts.length === 0 ? (
                        <div className="no-data">
                            {searchQuery ? 'No shifts match your search' : '📭 No shifts found'}
                        </div>
                    ) : (
                        <table className="shifts-table form-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Owner</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredShifts.map((shift) => {
                                    const shiftId = shift._id;
                                    const isSelected = selectedShift && selectedShift._id === shiftId;
                                    const badge = getStatusBadge(shift.status);
                                    
                                    return (
                                        <tr 
                                            key={shiftId}
                                            className={isSelected ? 'selected' : ''}
                                            onClick={() => handleRowClick(shift)}
                                        >
                                            <td><small className="text-muted">{shiftId?.slice(-6)}</small></td>
                                            <td><strong>{shift.owner || 'N/A'}</strong></td>
                                            <td>{formatDate(shift.dateGarde)}</td>
                                            <td>
                                                <span className="status-badge" style={{ background: badge.bg, color: badge.color }}>
                                                    {badge.text}
                                                </span>
                                            </td>
                                            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    className="action-btn view" 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewDetails(shift);
                                                    }}
                                                    title="View"
                                                >
                                                    👁️
                                                </button>
                                                <button className="action-btn edit" onClick={() => handleRowClick(shift)}>✏️</button>
                                                <button className="action-btn delete" onClick={() => handleDelete(shift)}>🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {selectedShift && (
                    <>
                        <div className="divider"><span>✏️ Edit Mode</span></div>
                        <form onSubmit={handleSubmit} className="edit-form">
                            <h3>📋 Edit Shift Information</h3>
                            
                            <input 
                                type="text" 
                                name="owner" 
                                placeholder="👤 Owner / Assigned To" 
                                value={formData.owner} 
                                onChange={handleInputChange} 
                                required 
                            />
                            <input 
                                type="date" 
                                name="dateGarde" 
                                value={formData.dateGarde} 
                                onChange={handleInputChange} 
                                required 
                            />
                            
                            <select 
                                name="status" 
                                value={formData.status} 
                                onChange={handleInputChange} 
                                required 
                                className="form-select"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

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
                    <p>⚠️ Verify information accuracy before updating</p>
                    <p style={{fontSize:'12px',color:'#64748b'}}>📊 Showing {filteredShifts.length} of {shifts.length} shifts</p>
                </div>

                <button className="refresh-btn" onClick={fetchShifts}>🔄 Refresh List</button>
            </div>

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

export default ManageShift;
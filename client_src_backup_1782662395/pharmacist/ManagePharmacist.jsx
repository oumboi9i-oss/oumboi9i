import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManagePharmacist.css';
import '../styles/form.css';

const ManagePharmacist = ({ onSelectPharmacist }) => {
    const [pharmacists, setPharmacists] = useState([]);
    const [selectedPharmacist, setSelectedPharmacist] = useState(null);
    const [formData, setFormData] = useState({
        userId: '',
        nomPharmacie: '',
        adressePharmacie: '',
        numAgrement: '',
        isNightShift: false
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
        setSelectedPharmacist(null);
        setFormData({ userId: '', nomPharmacie: '', adressePharmacie: '', numAgrement: '', isNightShift: false });
        setSearchId('');
    }, []);

    // ✅ Fetch all pharmacists
    const fetchPharmacists = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/pharmacist/getAll');
            setPharmacists(res.data || []);
            setLoading(false);
        } catch (err) {
            showStatus('error', 'Failed to load pharmacists');
            setLoading(false);
        }
    }, [showStatus]);

    useEffect(() => {
        fetchPharmacists();
    }, [fetchPharmacists]);

    // ✅ Row click selection (Edit)
    const handleRowClick = useCallback((pharmacist) => {
        const id = pharmacist.id || pharmacist._id;
        setSearchId(id);
        setSelectedPharmacist(pharmacist);
        setFormData({
            userId: pharmacist.userId || '',
            nomPharmacie: pharmacist.nomPharmacie || '',
            adressePharmacie: pharmacist.adressePharmacie || '',
            numAgrement: pharmacist.numAgrement || '',
            isNightShift: pharmacist.isNightShift || false
        });
    }, []);

    // ✅ View details — sends id up to AdminView (GetSinglePharmacist)
    const handleViewDetails = useCallback((pharmacist) => {
        const id = pharmacist.id || pharmacist._id;
        if (onSelectPharmacist) {
            onSelectPharmacist(id);
        }
    }, [onSelectPharmacist]);

    // ✅ Search by ID
    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        if (!searchId.trim()) {
            showStatus('error', 'Please enter a Pharmacist ID');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.get('/api/pharmacist/getAll');
            const found = res.data.find(p => (p.id || p._id) === searchId.trim());
            if (found) {
                handleRowClick(found);
                showStatus('success', 'Pharmacist found!');
            } else {
                setSelectedPharmacist(null);
                showStatus('error', 'Pharmacist not found');
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
    const handleDelete = useCallback((pharmacist) => {
        const id = pharmacist.id || pharmacist._id;
        showModal({
            type: 'confirmDelete',
            title: '🗑️ Confirm Delete',
            message: 'This action cannot be undone. Delete this pharmacist?',
            details: {
                'Pharmacist ID': id,
                'User ID': pharmacist.userId || 'N/A',
                'Pharmacy': pharmacist.nomPharmacie || 'N/A',
                'Approval #': pharmacist.numAgrement || 'N/A',
                'Night Shift': pharmacist.isNightShift ? '✅ Yes' : '❌ No'
            },
            onConfirm: async () => {
                try {
                    await axios.delete(`/api/pharmacist/${id}`);
                    showStatus('success', `✅ Pharmacist ${id} deleted!`);
                    if (selectedPharmacist && (selectedPharmacist.id === id || selectedPharmacist._id === id)) {
                        handleCancel();
                    }
                    fetchPharmacists();
                } catch (err) {
                    showStatus('error', '❌ Delete failed: ' + err.message);
                }
            }
        });
    }, [selectedPharmacist, showModal, showStatus, fetchPharmacists, handleCancel]);

    // ✅ Update with modal
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedPharmacist) {
            showStatus('error', 'Please select a pharmacist first');
            return;
        }
        showModal({
            type: 'confirmUpdate',
            title: '✏️ Confirm Update',
            message: 'Update this pharmacist information?',
            details: {
                'Pharmacist ID': selectedPharmacist.id || selectedPharmacist._id,
                'User ID': formData.userId,
                'Pharmacy': formData.nomPharmacie,
                'Night Shift': formData.isNightShift ? '✅ Yes' : '❌ No'
            },
            onConfirm: async () => {
                setLoading(true);
                try {
                    const id = selectedPharmacist.id || selectedPharmacist._id;
                    await axios.put(`/api/pharmacist/${id}`, formData);
                    showStatus('success', `✅ Pharmacist ${id} updated!`);
                    fetchPharmacists();
                    handleCancel();
                } catch (err) {
                    showStatus('error', 'Update failed: ' + err.message);
                } finally {
                    setLoading(false);
                }
            }
        });
    }, [selectedPharmacist, formData, showModal, showStatus, fetchPharmacists, handleCancel]);

    // ✅ Filter for text search
    const filteredPharmacists = pharmacists.filter(pharmacist => {
        const q = searchQuery.toLowerCase();
        return (pharmacist.userId || '').toLowerCase().includes(q) ||
               (pharmacist.nomPharmacie || '').toLowerCase().includes(q) ||
               (pharmacist.adressePharmacie || '').toLowerCase().includes(q) ||
               (pharmacist.numAgrement || '').toLowerCase().includes(q) ||
               ((pharmacist.id || pharmacist._id) || '').toLowerCase().includes(q);
    });

    // ✅ Truncate address for table
    const truncateAddress = (address, max = 30) => {
        if (!address) return 'N/A';
        return address.length > max ? address.slice(0, max) + '...' : address;
    };

    return (
        <div className="manage-page">
            <div className="manage-card form-card">
                <div className="logo-text">💊 Manage<span>Pharmacist</span></div>
                <p className="tagline">Pharmacy Management System</p>

                {status.message && (
                    <div className={`status-message form-status ${status.type}`}>{status.message}</div>
                )}

                {/* ID Search */}
                <form onSubmit={handleSearch} className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="🔍 Search by Pharmacist ID..."
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
                        placeholder="🔎 Filter by name, address, approval #..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <button type="button" className="search-btn" onClick={() => setSearchQuery('')}>
                        {searchQuery ? '🗑️ Clear' : '🔍 Filter'}
                    </button>
                </div>

                {/* Table */}
                <div className="table-wrapper">
                    {loading && pharmacists.length === 0 ? (
                        <div className="loading">⏳ Loading pharmacists...</div>
                    ) : filteredPharmacists.length === 0 ? (
                        <div className="no-data">
                            {searchQuery ? 'No pharmacists match your search' : '📭 No pharmacists found'}
                        </div>
                    ) : (
                        <table className="pharmacists-table form-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Pharmacy</th>
                                    <th>Address</th>
                                    <th>Approval #</th>
                                    <th>Night Shift</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPharmacists.map((pharmacist) => {
                                    const pharmacistId = pharmacist.id || pharmacist._id;
                                    const isSelected = selectedPharmacist && (selectedPharmacist.id === pharmacistId || selectedPharmacist._id === pharmacistId);

                                    return (
                                        <tr
                                            key={pharmacistId}
                                            className={isSelected ? 'selected' : ''}
                                            onClick={() => handleRowClick(pharmacist)}
                                        >
                                            <td>{pharmacistId}</td>
                                            <td>
                                                <strong>{pharmacist.nomPharmacie || 'N/A'}</strong>
                                                <br />
                                                <small className="text-muted">User: {pharmacist.userId || 'N/A'}</small>
                                            </td>
                                            <td><span className="address-cell">{truncateAddress(pharmacist.adressePharmacie)}</span></td>
                                            <td><span className="badge approval">{pharmacist.numAgrement || 'N/A'}</span></td>
                                            <td>
                                                <span className={`status-badge ${pharmacist.isNightShift ? 'night' : 'day'}`}>
                                                    {pharmacist.isNightShift ? '🌙 Night' : '☀️ Day'}
                                                </span>
                                            </td>
                                            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    className="action-btn view"
                                                    onClick={(e) => { e.stopPropagation(); handleViewDetails(pharmacist); }}
                                                >
                                                    👁️ View
                                                </button>
                                                <button className="action-btn edit" onClick={() => handleRowClick(pharmacist)}>✏️</button>
                                                <button className="action-btn delete" onClick={() => handleDelete(pharmacist)}>🗑️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Edit Form */}
                {selectedPharmacist && (
                    <div className="divider"><span>✏️ Edit Mode</span></div>
                )}

                {selectedPharmacist && (
                    <form onSubmit={handleSubmit} className="edit-form">
                        <h3>📋 Edit Pharmacist Information</h3>

                        <input
                            type="text"
                            name="userId"
                            placeholder="🆔 User ID"
                            value={formData.userId}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="nomPharmacie"
                            placeholder="🏪 Pharmacy Name"
                            value={formData.nomPharmacie}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="adressePharmacie"
                            placeholder="📍 Pharmacy Address"
                            value={formData.adressePharmacie}
                            onChange={handleInputChange}
                            required
                        />
                        <input
                            type="text"
                            name="numAgrement"
                            placeholder="📋 Approval Number"
                            value={formData.numAgrement}
                            onChange={handleInputChange}
                            required
                        />

                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isNightShift"
                                checked={formData.isNightShift}
                                onChange={handleInputChange}
                            />
                            <span>🌙 Night Shift Pharmacy</span>
                        </label>

                        <div className="form-actions">
                            <button type="button" className="cancel-btn form-btn form-btn-danger" onClick={handleCancel}>❌ Cancel</button>
                            <button type="submit" className="main-btn form-btn" disabled={loading}>
                                {loading ? '⏳ Updating...' : '💾 Update'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="warning-box">
                    <p>⚠️ Verify information accuracy before updating</p>
                    <p style={{fontSize:'12px',color:'#64748b'}}>📊 Showing {filteredPharmacists.length} of {pharmacists.length} pharmacists</p>
                </div>

                <button className="refresh-btn" onClick={fetchPharmacists}>🔄 Refresh List</button>
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

export default ManagePharmacist;
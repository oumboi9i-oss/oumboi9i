import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManageFireFighter.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const ManageFireFighter = ({ onSelectFireFighter }) => {
    const [firefighters, setFirefighters] = useState([]);
    const [selectedFirefighter, setSelectedFirefighter] = useState(null);
    const [formData, setFormData] = useState({
        userId: '',
        matricule: '',
        grade: '',
        uniteIntervention: ''
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
        setSelectedFirefighter(null);
        setFormData({ userId: '', matricule: '', grade: '', uniteIntervention: '' });
        setSearchId('');
    }, []);

    const fetchFirefighters = useCallback(async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API_BASE}/FireFighter/getAll`);
            setFirefighters(res.data || []);
            setLoading(false);
        } catch (err) {
            showStatus('error', 'Failed to load firefighters');
            setLoading(false);
        }
    }, [showStatus]);

    useEffect(() => { fetchFirefighters(); }, [fetchFirefighters]);

    const handleRowClick = useCallback((ff) => {
        const id = ff._id; // ✅ نستخدمو _id ديال MongoDB
        setSearchId(id);
        setSelectedFirefighter(ff);
        setFormData({
            userId: ff.userId || '',
            matricule: ff.matricule || '',
            grade: ff.grade || '',
            uniteIntervention: ff.uniteIntervention || ''
        });
    }, []);

    // ✅ دالة جديدة باش نبعثو الـ _id لـ GetSingleFireFighter
    const handleViewDetails = useCallback((ff) => {
        const id = ff._id; // ✅ نبعثو الـ _id ماشي matricule
        console.log('👁️ Viewing firefighter _id:', id);
        console.log('🔢 Matricule (for display):', ff.matricule);
        if (onSelectFireFighter) {
            onSelectFireFighter(id);
        }
    }, [onSelectFireFighter]);

    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        if (!searchId.trim()) { showStatus('error', 'Please enter a Firefighter ID'); return; }
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/FireFighter/getAll`);
            const found = res.data.find(f => f._id === searchId.trim() || f.matricule === searchId.trim());
            if (found) { handleRowClick(found); showStatus('success', 'Firefighter found!'); }
            else { setSelectedFirefighter(null); showStatus('error', 'Firefighter not found'); }
        } catch (err) { showStatus('error', 'Search error: ' + err.message); }
        finally { setLoading(false); }
    }, [searchId, showStatus, handleRowClick]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleDelete = useCallback((ff) => {
        const id = ff._id;
        showModal({
            type: 'confirmDelete',
            title: '🗑️ Confirm Delete',
            message: 'This action cannot be undone. Delete this firefighter?',
            details: { 'Firefighter ID': ff.matricule, 'Grade': ff.grade, 'Unit': ff.uniteIntervention },
            onConfirm: async () => {
                try {
                    await axios.delete(`${API_BASE}/FireFighter/${id}`);
                    showStatus('success', `✅ Firefighter ${ff.matricule} deleted!`);
                    if (selectedFirefighter && selectedFirefighter._id === id) handleCancel();
                    fetchFirefighters();
                } catch (err) { showStatus('error', '❌ Delete failed: ' + err.message); }
            }
        });
    }, [selectedFirefighter, showModal, showStatus, fetchFirefighters, handleCancel]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedFirefighter) { showStatus('error', 'Please select a firefighter first'); return; }
        showModal({
            type: 'confirmUpdate',
            title: '✏️ Confirm Update',
            message: 'Update this firefighter information?',
            details: { 'Firefighter ID': selectedFirefighter.matricule, 'Grade': formData.grade },
            onConfirm: async () => {
                setLoading(true);
                try {
                    const id = selectedFirefighter._id;
                    await axios.put(`${API_BASE}/FireFighter/${id}`, formData);
                    showStatus('success', `✅ Firefighter ${selectedFirefighter.matricule} updated!`);
                    fetchFirefighters(); handleCancel();
                } catch (err) { showStatus('error', 'Update failed: ' + err.message); }
                finally { setLoading(false); }
            }
        });
    }, [selectedFirefighter, formData, showModal, showStatus, fetchFirefighters, handleCancel]);

    const filteredFirefighters = firefighters.filter(ff => {
        const q = searchQuery.toLowerCase();
        return (ff.matricule || '').toLowerCase().includes(q) ||
               (ff.grade || '').toLowerCase().includes(q) ||
               (ff.userId || '').toLowerCase().includes(q) ||
               (ff.uniteIntervention || '').toLowerCase().includes(q);
    });

    const gradeOptions = [
        { value: '', label: '-- Select Grade --' },
        { value: 'Sapeur', label: '🔹 Sapeur' }, { value: 'Caporal', label: '🔸 Caporal' },
        { value: 'Sergent', label: '⭐ Sergent' }, { value: 'Adjudant', label: '🎖️ Adjudant' },
        { value: 'Lieutenant', label: '👨‍🚒 Lieutenant' }, { value: 'Capitaine', label: '👨‍💼 Capitaine' },
        { value: 'Commandant', label: '🎯 Commandant' }
    ];

    const uniteOptions = [
        { value: '', label: '-- Select Unit --' },
        { value: 'Secours', label: '🚑 Secours & Urgences' }, { value: 'Incendie', label: '🔥 Lutte Incendie' },
        { value: 'Risques', label: '⚠️ Risques Technologiques' }, { value: 'SecoursRoutier', label: '🛣️ Secours Routier' },
        { value: 'Nautique', label: '🚤 Secours Nautique' }, { value: 'Montagne', label: '🏔️ Secours Montagne' }
    ];

    return (
        <div className="manage-page">
            <div className="manage-card form-card">
                <div className="logo-text">🚒 Manage<span>FireFighter</span></div>
                <p className="tagline">Emergency Response Management System</p>
                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSearch} className="search-box">
                    <input type="text" className="search-input" placeholder="🔍 Search by ID or Matricule..." value={searchId} onChange={(e) => setSearchId(e.target.value)} />
                    <button type="submit" className="search-btn" disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
                </form>

                <div className="search-box" style={{ marginBottom: '10px' }}>
                    <input type="text" className="search-input" placeholder="🔎 Filter by grade, unit..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button type="button" className="search-btn" onClick={() => setSearchQuery('')}>{searchQuery ? '🗑️ Clear' : '🔍 Filter'}</button>
                </div>

                <div className="table-wrapper">
                    {loading && firefighters.length === 0 ? <div className="loading">⏳ Loading...</div> :
                     filteredFirefighters.length === 0 ? <div className="no-data">📭 No firefighters found</div> :
                     <table className="firefighters-table form-table">
                        <thead><tr><th>Matricule</th><th>User ID</th><th>Grade</th><th>Unit</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filteredFirefighters.map((ff) => {
                                const ffId = ff._id; // ✅ نستخدمو _id للـ key
                                const isSelected = selectedFirefighter && selectedFirefighter._id === ffId;
                                return (
                                    <tr key={ffId} className={isSelected ? 'selected' : ''} onClick={() => handleRowClick(ff)}>
                                        <td><strong>{ff.matricule || 'N/A'}</strong></td>
                                        <td><small className="text-muted">{ff.userId?.slice(-8) || 'N/A'}</small></td>
                                        <td><span className="badge grade">{ff.grade || 'N/A'}</span></td>
                                        <td><span className="badge unit">{ff.uniteIntervention || 'N/A'}</span></td>
                                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                            <button className="action-btn view" onClick={(e) => { e.stopPropagation(); handleViewDetails(ff); }} title="View">👁️</button>
                                            <button className="action-btn edit" onClick={() => handleRowClick(ff)} title="Edit">✏️</button>
                                            <button className="action-btn delete" onClick={() => handleDelete(ff)} title="Delete">🗑️</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>}
                </div>

                {selectedFirefighter && <>
                    <div className="divider"><span>✏️ Edit Mode</span></div>
                    <form onSubmit={handleSubmit} className="edit-form">
                        <h3>📋 Edit Firefighter</h3>
                        <input type="text" name="userId" placeholder="🆔 User ID" value={formData.userId} onChange={handleInputChange} required />
                        <input type="text" name="matricule" placeholder="🔢 Matricule" value={formData.matricule} onChange={handleInputChange} required />
                        <select name="grade" value={formData.grade} onChange={handleInputChange} required className="form-select">
                            {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select name="uniteIntervention" value={formData.uniteIntervention} onChange={handleInputChange} required className="form-select">
                            {uniteOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <div className="form-actions">
                            <button type="button" className="cancel-btn form-btn form-btn-danger" onClick={handleCancel}>❌ Cancel</button>
                            <button type="submit" className="main-btn form-btn" disabled={loading}>{loading ? '⏳...' : '💾 Update'}</button>
                        </div>
                    </form>
                </>}

                <div className="warning-box"><p>⚠️ Verify before updating</p><p style={{fontSize:'12px',color:'#64748b'}}>📊 {filteredFirefighters.length}/{firefighters.length}</p></div>
                <button className="refresh-btn" onClick={fetchFirefighters}>🔄 Refresh</button>
            </div>

            {modal.show && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-dialog" onClick={e => e.stopPropagation()}>
                        <h4>{modal.title}</h4><p>{modal.message}</p>
                        {modal.details && <div className="modal-details">{Object.entries(modal.details).map(([k,v]) => <div key={k}><strong>{k}:</strong> {String(v)}</div>)}</div>}
                        <div className="modal-actions">
                            <button className="modal-btn cancel" onClick={closeModal}>Cancel</button>
                            <button className={`modal-btn confirm ${modal.type === 'confirmUpdate' ? 'edit' : ''}`} onClick={() => { closeModal(); modal.onConfirm?.(); }}>{modal.type === 'confirmDelete' ? '🗑️ Delete' : '✅ Confirm'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageFireFighter;
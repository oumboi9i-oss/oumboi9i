import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './ManageDoctor.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const ManageDoctor = ({ onSelectDoctor }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [formData, setFormData] = useState({
        fullName: '', 
        email: '', 
        specialty: '', 
        numOrdre: '', 
        location: '', 
        isAvailable: true
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
        setSelectedDoctor(null);
        setFormData({ 
            fullName: '', 
            email: '', 
            specialty: '', 
            numOrdre: '', 
            location: '', 
            isAvailable: true 
        });
        setSearchId('');
    }, []);

    const fetchDoctors = useCallback(async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching doctors from:', `${API_BASE}/doctor/getAll`);
            
            const res = await axios.get(`${API_BASE}/doctor/getAll`);
            console.log('✅ Doctors response:', res.data);
            
            const doctorsData = res.data || [];
            setDoctors(doctorsData);
            
            if (doctorsData.length === 0) {
                showStatus('info', '📭 No doctors found in database');
            }
            setLoading(false);
        } catch (err) {
            console.error('❌ Error fetching doctors:', err);
            const errorMsg = err.response?.status === 404 
                ? '🔌 API endpoint not found. Check if server is running on port 5000'
                : 'Failed to load doctors: ' + (err.response?.data?.message || err.message);
            showStatus('error', errorMsg);
            setLoading(false);
        }
    }, [showStatus]);

    useEffect(() => { 
        fetchDoctors(); 
    }, [fetchDoctors]);

    const handleRowClick = useCallback((doctor) => {
        const id = doctor._id;
        setSearchId(id);
        setSelectedDoctor(doctor);
        setFormData({
            fullName: doctor.fullName || '',
            email: doctor.email || '',
            specialty: doctor.specialty || '',
            numOrdre: doctor.numOrdre || '',
            location: doctor.location || '',
            isAvailable: doctor.isAvailable ?? true
        });
    }, []);

    const handleViewDetails = useCallback((doctor) => {
        const id = doctor._id;
        console.log('👁️ Viewing doctor _id:', id);
        if (onSelectDoctor) {
            onSelectDoctor(id);
        }
    }, [onSelectDoctor]);

    const handleSearch = useCallback(async (e) => {
        e.preventDefault();
        if (!searchId.trim()) { 
            showStatus('error', 'Please enter a Doctor ID'); 
            return; 
        }
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/doctor/getAll`);
            const doctorsData = res.data || [];
            const found = doctorsData.find(d => d._id === searchId.trim() || d.numOrdre === searchId.trim());
            
            if (found) { 
                handleRowClick(found); 
                showStatus('success', '✅ Doctor found!'); 
            } else { 
                setSelectedDoctor(null); 
                showStatus('error', '❌ Doctor not found'); 
            }
        } catch (err) { 
            showStatus('error', 'Search error: ' + err.message); 
        } finally { 
            setLoading(false); 
        }
    }, [searchId, showStatus, handleRowClick]);

    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }, []);

    const handleDelete = useCallback((doctor) => {
        const id = doctor._id;
        showModal({
            type: 'confirmDelete', 
            title: '🗑️ Confirm Delete',
            message: 'This action cannot be undone. Delete this doctor?',
            details: { 
                'Doctor ID': doctor.numOrdre, 
                'Name': doctor.fullName, 
                'Specialty': doctor.specialty 
            },
            onConfirm: async () => {
                try {
                    console.log('🗑️ Deleting doctor with ID:', id);
                    await axios.delete(`${API_BASE}/doctor/${id}`);
                    showStatus('success', `✅ Doctor ${doctor.numOrdre} deleted!`);
                    if (selectedDoctor && selectedDoctor._id === id) handleCancel();
                    fetchDoctors();
                } catch (err) { 
                    console.error('❌ Delete error:', err);
                    showStatus('error', '❌ Delete failed: ' + err.message); 
                }
            }
        });
    }, [selectedDoctor, showModal, showStatus, fetchDoctors, handleCancel]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!selectedDoctor) { 
            showStatus('error', 'Please select a doctor first'); 
            return; 
        }
        showModal({
            type: 'confirmUpdate', 
            title: '✏️ Confirm Update',
            message: 'Update this doctor information?',
            details: { 
                'Doctor ID': selectedDoctor.numOrdre, 
                'Name': formData.fullName 
            },
            onConfirm: async () => {
                setLoading(true);
                try {
                    const id = selectedDoctor._id;
                    console.log('✏️ Updating doctor with ID:', id, formData);
                    await axios.put(`${API_BASE}/doctor/${id}`, formData);
                    showStatus('success', `✅ Doctor ${selectedDoctor.numOrdre} updated!`);
                    fetchDoctors(); 
                    handleCancel();
                } catch (err) { 
                    console.error('❌ Update error:', err);
                    showStatus('error', '❌ Update failed: ' + err.message); 
                } finally { 
                    setLoading(false); 
                }
            }
        });
    }, [selectedDoctor, formData, showModal, showStatus, fetchDoctors, handleCancel]);

    const filteredDoctors = doctors.filter(doctor => {
        const q = searchQuery.toLowerCase();
        return (doctor.fullName || '').toLowerCase().includes(q) ||
               (doctor.email || '').toLowerCase().includes(q) ||
               (doctor.specialty || '').toLowerCase().includes(q) ||
               (doctor.numOrdre || '').toLowerCase().includes(q) ||
               (doctor.location || '').toLowerCase().includes(q) ||
               (doctor._id || '').toLowerCase().includes(q);
    });

    const getSpecialtyEmoji = (specialty) => {
        const map = { 
            'Cardiology': '❤️', 
            'Pediatrics': '👶', 
            'Dermatology': '🧴', 
            'Orthopedics': '🦴', 
            'Neurology': '🧠', 
            'General Practice': '🩺', 
            'Surgery': '🔪', 
            'Psychiatry': '🧙' 
        };
        return map[specialty] || '👨‍⚕️';
    };

    const truncateLocation = (loc, max = 25) => !loc ? 'N/A' : loc.length > max ? loc.slice(0, max) + '...' : loc;

    const specialtyOptions = [
        { value: '', label: '-- Select Specialty --' },
        { value: 'Cardiology', label: '❤️ Cardiology' }, 
        { value: 'Pediatrics', label: '👶 Pediatrics' },
        { value: 'Dermatology', label: '🧴 Dermatology' }, 
        { value: 'Orthopedics', label: '🦴 Orthopedics' },
        { value: 'Neurology', label: '🧠 Neurology' }, 
        { value: 'General Practice', label: '🩺 General Practice' },
        { value: 'Surgery', label: '🔪 Surgery' }, 
        { value: 'Psychiatry', label: '🧙 Psychiatry' }
    ];

    return (
        <div className="manage-page">
            <div className="manage-card form-card">
                <div className="logo-text">👨‍️ Manage<span>Doctor</span></div>
                <p className="tagline">Hospital Management System</p>
                
                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSearch} className="search-box">
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="🔍 Search by ID or numOrdre..." 
                        value={searchId} 
                        onChange={(e) => setSearchId(e.target.value)} 
                    />
                    <button type="submit" className="search-btn" disabled={loading}>
                        {loading ? '⏳ Searching...' : '🔍 Search'}
                    </button>
                </form>

                <div className="search-box" style={{ marginBottom: '10px' }}>
                    <input 
                        type="text" 
                        className="search-input" 
                        placeholder="🔎 Filter by name, specialty..." 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                    />
                    <button 
                        type="button" 
                        className="search-btn" 
                        onClick={() => setSearchQuery('')}
                    >
                        {searchQuery ? '🗑️ Clear' : '🔍 Filter'}
                    </button>
                </div>

                <div className="table-wrapper">
                    {loading && doctors.length === 0 ? (
                        <div className="loading">⏳ Loading doctors...</div>
                    ) : filteredDoctors.length === 0 ? (
                        <div className="no-data">
                            📭 No doctors found
                            {doctors.length === 0 && (
                                <p style={{fontSize:'12px',marginTop:'10px',color:'#64748b'}}>
                                    💡 Tip: Add a doctor first using the "Add Doctor" form
                                </p>
                            )}
                        </div>
                    ) : (
                        <table className="doctors-table form-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Specialty</th>
                                    <th>Location</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDoctors.map((doctor) => {
                                    const doctorId = doctor._id;
                                    const isSelected = selectedDoctor && selectedDoctor._id === doctorId;
                                    return (
                                        <tr 
                                            key={doctorId} 
                                            className={isSelected ? 'selected' : ''} 
                                            onClick={() => handleRowClick(doctor)}
                                        >
                                            <td>{doctor.numOrdre || doctorId.slice(-6)}</td>
                                            <td>
                                                <strong>{doctor.fullName || 'N/A'}</strong>
                                                <br/>
                                                <small className="text-muted">#{doctor.numOrdre}</small>
                                            </td>
                                            <td>
                                                <span className="badge specialty">
                                                    {getSpecialtyEmoji(doctor.specialty)} {doctor.specialty}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="location-cell">
                                                    {truncateLocation(doctor.location)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${doctor.isAvailable ? 'available' : 'busy'}`}>
                                                    {doctor.isAvailable ? '✅ Available' : '❌ Busy'}
                                                </span>
                                            </td>
                                            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    className="action-btn view" 
                                                    onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        handleViewDetails(doctor); 
                                                    }}
                                                >
                                                    👁️ View
                                                </button>
                                                <button 
                                                    className="action-btn edit" 
                                                    onClick={() => handleRowClick(doctor)}
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    className="action-btn delete" 
                                                    onClick={() => handleDelete(doctor)}
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {selectedDoctor && (
                    <>
                        <div className="divider"><span>✏️ Edit Mode</span></div>
                        <form onSubmit={handleSubmit} className="edit-form">
                            <h3>📋 Edit Doctor</h3>
                            <input 
                                type="text" 
                                name="fullName" 
                                placeholder="👤 Full Name" 
                                value={formData.fullName} 
                                onChange={handleInputChange} 
                                required 
                            />
                            <input 
                                type="email" 
                                name="email" 
                                placeholder="📧 Email" 
                                value={formData.email} 
                                onChange={handleInputChange} 
                                required 
                            />
                            <select 
                                name="specialty" 
                                value={formData.specialty} 
                                onChange={handleInputChange} 
                                required 
                                className="form-select"
                            >
                                {specialtyOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <input 
                                type="text" 
                                name="numOrdre" 
                                placeholder="🔢 Order Number" 
                                value={formData.numOrdre} 
                                onChange={handleInputChange} 
                                required 
                            />
                            <input 
                                type="text" 
                                name="location" 
                                placeholder="🏥 Location" 
                                value={formData.location} 
                                onChange={handleInputChange} 
                                required 
                            />
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    name="isAvailable" 
                                    checked={formData.isAvailable} 
                                    onChange={handleInputChange} 
                                /> 
                                <span>✅ Available</span>
                            </label>
                            <div className="form-actions">
                                <button type="button" className="cancel-btn form-btn form-btn-danger" onClick={handleCancel}>
                                    ❌ Cancel
                                </button>
                                <button type="submit" className="main-btn form-btn" disabled={loading}>
                                    {loading ? '⏳ Updating...' : '💾 Update'}
                                </button>
                            </div>
                        </form>
                    </>
                )}

                <div className="warning-box">
                    <p>⚠️ Verify before updating</p>
                    <p style={{fontSize:'12px',color:'#64748b'}}>
                        📊 Showing {filteredDoctors.length} of {doctors.length} doctors
                    </p>
                </div>
                <button className="refresh-btn" onClick={fetchDoctors}>
                    🔄 Refresh List
                </button>
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
                            <button className="modal-btn cancel" onClick={closeModal}>
                                Cancel
                            </button>
                            <button 
                                className={`modal-btn confirm ${modal.type === 'confirmUpdate' ? 'edit' : ''}`} 
                                onClick={() => { 
                                    closeModal(); 
                                    modal.onConfirm?.(); 
                                }}
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

export default ManageDoctor;
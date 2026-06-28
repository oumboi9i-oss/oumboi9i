import React, { useState, useCallback } from 'react';
import axios from 'axios';
import './AddDoctor.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const AddDoctor = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        specialty: '',
        numOrdre: '',
        location: '',
        isAvailable: true
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    
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

    const handleInputChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }, []);

    const handleReset = useCallback(() => {
        setFormData({
            fullName: '', email: '', password: '', specialty: '', numOrdre: '', location: '', isAvailable: true
        });
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!formData.fullName || !formData.email || !formData.password || !formData.specialty || !formData.numOrdre || !formData.location) {
            showStatus('error', '⚠️ Please fill in all required fields');
            return;
        }

        showModal({
            type: 'confirmAdd',
            title: '👨‍️ Confirm Addition',
            message: 'Add this new doctor to the system?',
            details: {
                'Full Name': formData.fullName,
                'Email': formData.email,
                'Specialty': formData.specialty,
                'Num Ordre': formData.numOrdre,
                'Location': formData.location
            },
            onConfirm: async () => {
                setLoading(true);
                try {
                    console.log('📤 Sending data:', formData);
                    
                    await axios.post(`${API_BASE}/doctor/add`, {
                        fullName: formData.fullName,
                        email: formData.email.toLowerCase(),
                        password: formData.password,
                        specialty: formData.specialty,
                        numOrdre: formData.numOrdre,
                        location: formData.location,
                        isAvailable: formData.isAvailable
                    });
                    
                    showStatus('success', `✅ Dr. ${formData.fullName} added successfully!`);
                    handleReset();
                } catch (error) {
                    console.error('❌ Error:', error);
                    console.error('📦 Response data:', error.response?.data);
                    showStatus('error', '❌ Failed to add: ' + (error.response?.data?.message || error.message));
                } finally {
                    setLoading(false);
                }
            }
        });
    }, [formData, showStatus, handleReset, showModal]);

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
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">👨‍️ <span>Add</span> Doctor</div>
                <p className="tagline">Hospital Management System</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSubmit}>
                    <input type="text" name="fullName" placeholder="👤 Full Name (Dr. ...)" value={formData.fullName} onChange={handleInputChange} required className="form-field" />
                    <input type="email" name="email" placeholder="📧 Email Address" value={formData.email} onChange={handleInputChange} required className="form-field" />
                    <input type="password" name="password" placeholder="🔐 Password" value={formData.password} onChange={handleInputChange} required className="form-field" />

                    <select name="specialty" value={formData.specialty} onChange={handleInputChange} required className="form-select form-field">
                        {specialtyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    <input type="text" name="numOrdre" placeholder="🔢 Order Number (Num Ordre)" value={formData.numOrdre} onChange={handleInputChange} required className="form-field" />
                    <input type="text" name="location" placeholder="📍 Clinic/Hospital Location" value={formData.location} onChange={handleInputChange} required className="form-field" />

                    <label className="checkbox-label">
                        <input type="checkbox" name="isAvailable" checked={formData.isAvailable} onChange={handleInputChange} />
                        <span>✅ Available for Appointments</span>
                    </label>

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Adding...' : '✅ Add Doctor'}
                    </button>
                </form>
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
                            <button className="modal-btn confirm edit" onClick={() => { closeModal(); modal.onConfirm?.(); }}>Confirm Add</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddDoctor;
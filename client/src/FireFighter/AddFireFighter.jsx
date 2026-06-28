import React, { useState } from 'react';
import axios from 'axios';
import './AddFireFighter.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const AddFireFighter = () => {
    const [formData, setFormData] = useState({
        userId: '',
        gmail: '',
        matricule: '',
        password: '',
        grade: '',
        uniteIntervention: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const { gmail, matricule, password, grade, uniteIntervention } = formData;

        if (!gmail || !matricule || !password || !grade || !uniteIntervention) {
            setStatus({ type: 'error', message: '⚠️ Please fill in all required fields' });
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_BASE}/firefighter/add`, formData);
            setStatus({ type: 'success', message: '✅ Firefighter added successfully!' });
            setFormData({ userId: '', gmail: '', matricule: '', password: '', grade: '', uniteIntervention: '' });
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Failed to add: ' + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    const gradeOptions = [
        { value: '', label: '-- Select Grade --' },
        { value: 'Sapeur', label: '🔹 Sapeur' },
        { value: 'Caporal', label: '🔸 Caporal' },
        { value: 'Sergent', label: '⭐ Sergent' },
        { value: 'Adjudant', label: '🎖️ Adjudant' },
        { value: 'Lieutenant', label: '👨‍🚒 Lieutenant' },
        { value: 'Capitaine', label: '👨‍ Capitaine' },
        { value: 'Commandant', label: '🎯 Commandant' }
    ];

    const uniteOptions = [
        { value: '', label: '-- Select Unit --' },
        { value: 'Secours', label: '🚑 Secours & Urgences' },
        { value: 'Incendie', label: '🔥 Lutte Incendie' },
        { value: 'Risques', label: '⚠️ Risques Technologiques' },
        { value: 'SecoursRoutier', label: '🛣️ Secours Routier' },
        { value: 'Nautique', label: '🚤 Secours Nautique' },
        { value: 'Montagne', label: '🏔️ Secours Montagne' }
    ];

    return (
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">🚒 <span>Add</span> Firefighter</div>
                <p className="tagline">Emergency Response Management</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSubmit}>
                    <input type="text" name="userId" placeholder="🆔 User ID" value={formData.userId} onChange={handleChange} />
                    <input type="email" name="gmail" placeholder="📧 Email Address" value={formData.gmail} onChange={handleChange} required />
                    <input type="text" name="matricule" placeholder="🔢 Matricule Number" value={formData.matricule} onChange={handleChange} required />
                    <input type="password" name="password" placeholder="🔒 Password" value={formData.password} onChange={handleChange} required />
                    
                    <select name="grade" value={formData.grade} onChange={handleChange} required className="form-select">
                        {gradeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    
                    <select name="uniteIntervention" value={formData.uniteIntervention} onChange={handleChange} required className="form-select">
                        {uniteOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Processing...' : '➕ Add Firefighter'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddFireFighter;
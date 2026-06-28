import React, { useState } from 'react';
import axios from 'axios';
import './AddPharmacist.css';
import '../styles/form.css';

const API_BASE = 'http://localhost:5000/api'; // ✅ مسار أساسي

const AddPharmacist = () => {
    const [formData, setFormData] = useState({
        userId: '',
        gmail: '',           // ✅
        password: '',        // ✅
        nomPharmacie: '',
        adressePharmacie: '',
        numAgrement: '',
        isNightShift: false
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        // ✅ تصحيح الخطأ: نخرجو البيانات من formData
        const { gmail, password, nomPharmacie, adressePharmacie, numAgrement } = formData;

        // ✅ الآن المتغيرات معرفة
        if (!gmail || !password || !nomPharmacie || !adressePharmacie || !numAgrement) {
            setStatus({ type: 'error', message: '⚠️ Please fill in all required fields' });
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_BASE}/pharmacist/add`, formData);
            setStatus({ type: 'success', message: '✅ Pharmacist added successfully!' });
            setFormData({
                userId: '',
                gmail: '',
                password: '',
                nomPharmacie: '',
                adressePharmacie: '',
                numAgrement: '',
                isNightShift: false
            });
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Failed to add: ' + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">
                    💊 <span>Add</span> Pharmacist
                </div>
                <p className="tagline">Pharmacy Management System</p>

                {status.message && (
                    <div className={`status-message form-status ${status.type}`}>{status.message}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <input 
                        type="text" 
                        name="userId" 
                        placeholder="🆔 User ID" 
                        value={formData.userId} 
                        onChange={handleChange} 
                    />
                    <input 
                        type="email"          
                        name="gmail" 
                        placeholder="📧 Email Address" 
                        value={formData.gmail} 
                        onChange={handleChange} 
                        required 
                    />
                    <input 
                        type="password"       
                        name="password" 
                        placeholder="🔒 Password" 
                        value={formData.password} 
                        onChange={handleChange} 
                        required 
                    />
                    <input 
                        type="text" 
                        name="nomPharmacie" 
                        placeholder="🏪 Pharmacy Name" 
                        value={formData.nomPharmacie} 
                        onChange={handleChange} 
                        required 
                    />
                    <input 
                        type="text" 
                        name="adressePharmacie" 
                        placeholder="📍 Pharmacy Address" 
                        value={formData.adressePharmacie} 
                        onChange={handleChange} 
                        required 
                    />
                    <input 
                        type="text" 
                        name="numAgrement" 
                        placeholder="📋 Approval Number" 
                        value={formData.numAgrement} 
                        onChange={handleChange} 
                        required 
                    />
                    
                    <label className="checkbox-label">
                        <input 
                            type="checkbox" 
                            name="isNightShift" 
                            checked={formData.isNightShift} 
                            onChange={handleChange} 
                        />
                        <span>🌙 Night Shift Pharmacy</span>
                    </label>

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Processing...' : '➕ Add Pharmacist'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddPharmacist;
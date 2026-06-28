import React, { useState } from 'react';
import axios from 'axios';
import './createAccount.css';

const CreateAccount = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        phone: ''
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

        if (!formData.username || !formData.email || !formData.password) {
            setStatus({ type: 'error', message: '⚠️ Please fill in username, email and password' });
            setLoading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: 'error', message: '⚠️ Passwords do not match' });
            setLoading(false);
            return;
        }
        if (formData.password.length < 6) {
            setStatus({ type: 'error', message: '⚠️ Password must be at least 6 characters' });
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post('/api/account/create', {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                phone: formData.phone
            });
            
            if (res.data.success) {
                setStatus({ type: 'success', message: '✅ Account created successfully!' });
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    role: 'user',
                    phone: ''
                });
            }
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.error || '❌ Failed to create account' 
            });
        } finally {
            setLoading(false);
        }
    };

    const roleOptions = [
        { value: 'user', label: '👤 User' },
        { value: 'admin', label: '👑 Admin' },
        { value: 'doctor', label: '👨‍️ Doctor' },
        { value: 'nurse', label: '🩺 Nurse' },
        { value: 'pharmacist', label: '💊 Pharmacist' },
        { value: 'firefighter', label: '👨‍🚒 Fire Fighter' }  // ✅ هنا زدنا FireFighter
    ];

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="logo-text">
                    👤 <span>Create</span> Account
                </div>
                <p className="tagline">Hospital Management System</p>

                {status.message && (
                    <div className={`status-message ${status.type}`}>{status.message}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="username">Username *</label>
                            <input 
                                type="text" 
                                id="username"
                                name="username" 
                                placeholder="Enter username" 
                                value={formData.username} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input 
                                type="email" 
                                id="email"
                                name="email" 
                                placeholder="Enter email" 
                                value={formData.email} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="phone">Phone Number</label>
                            <input 
                                type="tel" 
                                id="phone"
                                name="phone" 
                                placeholder="Enter phone" 
                                value={formData.phone} 
                                onChange={handleChange} 
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="role">Account Role</label>
                            <select 
                                id="role"
                                name="role" 
                                value={formData.role} 
                                onChange={handleChange}
                            >
                                {roleOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <input 
                                type="password" 
                                id="password"
                                name="password" 
                                placeholder="Min. 6 characters" 
                                value={formData.password} 
                                onChange={handleChange} 
                                required 
                                minLength="6"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <input 
                                type="password" 
                                id="confirmPassword"
                                name="confirmPassword" 
                                placeholder="Confirm password" 
                                value={formData.confirmPassword} 
                                onChange={handleChange} 
                                required 
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="submit" className="main-btn" disabled={loading}>
                            {loading ? '⏳ Creating...' : '🚀 Create Account'}
                        </button>
                    </div>
                </form>

                <div className="warning-box">
                    <p>⚠️ All fields marked with * are required</p>
                    <p style={{fontSize:'12px',color:'#64748b'}}>🔐 Password is encrypted automatically</p>
                </div>
            </div>
        </div>
    );
};

export default CreateAccount;
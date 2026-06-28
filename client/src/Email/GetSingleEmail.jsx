import React, { useState } from 'react';
import axios from 'axios';
import './SendEmail.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`; // ✅ مسار أساسي

const SendEmail = ({ onEmailSent }) => {
    const [formData, setFormData] = useState({ to: '', subject: '', text: '', html: '' });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [mode, setMode] = useState('text');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        if (!formData.to || !formData.subject || (!formData.text && !formData.html)) {
            setStatus({ type: 'error', message: '⚠️ Please fill in all required fields' });
            setLoading(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.to)) {
            setStatus({ type: 'error', message: '⚠️ Please enter a valid email address' });
            setLoading(false);
            return;
        }

        try {
            // ✅ مسار صحيح: /api/email/send
            const res = await axios.post(`${API_BASE}/email/send`, {
                to: formData.to,
                subject: formData.subject,
                text: mode === 'text' ? formData.text : '',
                html: mode === 'html' ? formData.html : ''
            });
            
            if (res.data.success) {
                setStatus({ type: 'success', message: `✅ Email sent successfully!` });
                if (onEmailSent && res.data.savedId) {
                    onEmailSent(res.data.savedId);
                }
                setFormData({ to: '', subject: '', text: '', html: '' });
            }
        } catch (error) {
            console.error('❌ Send error:', error);
            setStatus({ type: 'error', message: error.response?.data?.error || error.response?.data?.message || '❌ Failed to send email' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">📧 <span>Send</span> Email</div>
                <p className="tagline">Internal Messaging System</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSubmit}>
                    <input type="email" name="to" placeholder="👤 Recipient Email" value={formData.to} onChange={handleChange} required />
                    <input type="text" name="subject" placeholder="📝 Subject" value={formData.subject} onChange={handleChange} required />

                    <div className="mode-toggle">
                        <button type="button" className={`toggle-btn ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>📄 Plain Text</button>
                        <button type="button" className={`toggle-btn ${mode === 'html' ? 'active' : ''}`} onClick={() => setMode('html')}>💻 HTML</button>
                    </div>

                    {mode === 'text' ? (
                        <textarea name="text" placeholder="✍️ Write your message..." value={formData.text} onChange={handleChange} required rows="5" className="form-textarea" />
                    ) : (
                        <textarea name="html" placeholder="<!DOCTYPE html> Write your HTML email..." value={formData.html} onChange={handleChange} required rows="5" className="form-textarea" />
                    )}

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Sending...' : '📤 Send Email'}
                    </button>
                </form>

                <div className="info-box">
                    <p>💡 <strong>Tip:</strong> Fill in all fields to send an email</p>
                </div>
            </div>
        </div>
    );
};

export default SendEmail;
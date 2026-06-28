import React, { useState } from 'react';
import axios from 'axios';
import './AddMessage.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const AddMessage = () => {
    const [formData, setFormData] = useState({
        senderId: '',
        receiverId: '',
        content: '',
        timestamp: new Date().toISOString().slice(0, 16),
        isRead: false
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        const { senderId, receiverId, content } = formData;

        if (!senderId || !receiverId || !content) {
            setStatus({ type: 'error', message: '⚠️ Please fill in all required fields' });
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_BASE}/message/add`, formData);
            setStatus({ type: 'success', message: '✅ Message sent successfully!' });
            setFormData({
                senderId: '',
                receiverId: '',
                content: '',
                timestamp: new Date().toISOString().slice(0, 16),
                isRead: false
            });
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Failed to send: ' + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">💬 <span>Add</span> Message</div>
                <p className="tagline">Internal Messaging System</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSubmit}>
                    <input type="text" name="senderId" placeholder="👤 Sender ID" value={formData.senderId} onChange={handleChange} required />
                    <input type="text" name="receiverId" placeholder="🎯 Receiver ID" value={formData.receiverId} onChange={handleChange} required />
                    <textarea name="content" placeholder="✍️ Message content..." value={formData.content} onChange={handleChange} required rows="4" className="form-textarea" />
                    <input type="datetime-local" name="timestamp" value={formData.timestamp} onChange={handleChange} className="form-datetime" />
                    
                    <label className="checkbox-label">
                        <input type="checkbox" name="isRead" checked={formData.isRead} onChange={handleChange} />
                        <span>👁️ Mark as Read</span>
                    </label>

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Sending...' : '📤 Send Message'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddMessage;
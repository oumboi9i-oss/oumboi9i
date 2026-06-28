import React, { useState } from 'react';
import axios from 'axios';
import './AddTransaction.css';
import '../styles/form.css';

const API_BASE = 'http://localhost:5000/api';

const AddTransaction = () => {
    const [formData, setFormData] = useState({
        gardeId: '',
        demanderId: '',
        status: 'en_attente'
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

        const { gardeId, demanderId } = formData;

        if (!gardeId || !demanderId) {
            setStatus({ type: 'error', message: '⚠️ Please fill in all required fields' });
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_BASE}/transaction/add`, formData);
            setStatus({ type: 'success', message: '✅ Transaction added successfully!' });
            setFormData({ gardeId: '', demanderId: '', status: 'en_attente' });
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Failed to add: ' + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    const statusOptions = [
        { value: 'en_attente', label: '🟡 En Attente' },
        { value: 'accepted', label: '🟢 Accepted' },
        { value: 'rejected', label: '🔴 Rejected' },
        { value: 'completed', label: '✅ Completed' }
    ];

    return (
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">💰 <span>Add</span> Transaction</div>
                <p className="tagline">Transaction Management System</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSubmit}>
                    <input type="text" name="gardeId" placeholder="🆔 Garde ID" value={formData.gardeId} onChange={handleChange} required />
                    <input type="text" name="demanderId" placeholder="👤 Demander ID" value={formData.demanderId} onChange={handleChange} required />
                    
                    <select name="status" value={formData.status} onChange={handleChange} required className="form-select">
                        {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Processing...' : '➕ Add Transaction'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddTransaction;
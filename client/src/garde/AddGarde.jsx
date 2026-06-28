import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddGarde.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const AddGarde = ({ currentUser }) => {
    const ownerDefault = currentUser?.fullName || currentUser?.userId || currentUser?.matricule || currentUser?.email || '';
    const placeDefault = currentUser?.hospital || currentUser?.location || currentUser?.nomPharmacie || '';
    const serviceDefault = currentUser?.specialty || currentUser?.service || '';

    const [formData, setFormData] = useState({
        owner: ownerDefault,
        dateGarde: '',
        time: '',
        place: placeDefault,
        service: serviceDefault,
        status: 'Active',
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            owner: ownerDefault,
            place: placeDefault,
            service: serviceDefault,
        }));
    }, [ownerDefault, placeDefault, serviceDefault]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        if (!formData.owner || !formData.dateGarde) {
            setStatus({ type: 'error', message: '⚠️ Owner and date are required' });
            setLoading(false);
            return;
        }

        try {
            const ownerId = currentUser?._id || currentUser?.id || currentUser?.userId;
            await axios.post(`${API_BASE}/garde/add`, { ...formData, ownerId: ownerId || 'admin' });
            setStatus({ type: 'success', message: '✅ Shift added successfully!' });
            setFormData({
                owner: ownerDefault,
                dateGarde: '',
                time: '',
                place: placeDefault,
                service: serviceDefault,
                status: 'Active',
            });
        } catch (error) {
            setStatus({ type: 'error', message: '❌ Failed: ' + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">📅 <span>Add</span> Shift</div>
                <p className="tagline">Staff Shift Management</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="owner"
                        placeholder="👤 Assigned To"
                        value={formData.owner}
                        onChange={handleChange}
                        required
                        className="form-field"
                    />
                    <input
                        type="date"
                        name="dateGarde"
                        value={formData.dateGarde}
                        onChange={handleChange}
                        required
                        className="form-field"
                    />
                    <input
                        type="time"
                        name="time"
                        value={formData.time}
                        onChange={handleChange}
                        className="form-field"
                    />
                    <input
                        type="text"
                        name="place"
                        placeholder="📍 Place / Hospital"
                        value={formData.place}
                        onChange={handleChange}
                        className="form-field"
                    />
                    <input
                        type="text"
                        name="service"
                        placeholder="🩺 Service / Specialty"
                        value={formData.service}
                        onChange={handleChange}
                        className="form-field"
                    />
                    <select name="status" value={formData.status} onChange={handleChange} className="form-field">
                        <option value="Active">🟢 Active</option>
                        <option value="Inactive">🔴 Inactive</option>
                        <option value="Completed">✅ Completed</option>
                    </select>

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Processing...' : '➕ Add Shift'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddGarde;

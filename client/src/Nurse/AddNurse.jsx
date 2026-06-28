import React, { useState } from 'react';
import axios from 'axios';
import './AddNurse.css';
import '../styles/form.css';

const API_BASE = `${process.env.REACT_APP_API_URL}/api`;

const AddNurse = () => {
    const [formData, setFormData] = useState({
        gmail: '',
        password: '',
        diplome: '',
        service: '',
        equipe: ''
        // ✅ حيدنا userId من هنا، حيت غادي يتولد وحدو فالسيرفر
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

        const { gmail, password, diplome, service, equipe } = formData;

        if (!gmail || !password || !diplome || !service || !equipe) {
            setStatus({ type: 'error', message: '⚠️ Please fill in all required fields' });
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${API_BASE}/nurse/add`, formData);
            console.log('✅ Add response:', response.data);
            setStatus({ type: 'success', message: `✅ Nurse added successfully! (ID: ${response.data.nurse?.userId})` });
            setFormData({ gmail: '', password: '', diplome: '', service: '', equipe: '' });
        } catch (error) {
            console.error('❌ Error:', error);
            setStatus({ type: 'error', message: '❌ Failed to add: ' + (error.response?.data?.message || error.message) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card form-card">
                <div className="logo-text">🩺 <span>Add</span> Nurse</div>
                <p className="tagline">Hospital Management System</p>

                {status.message && <div className={`status-message form-status ${status.type}`}>{status.message}</div>}

                <form onSubmit={handleSubmit}>
                    {/* ✅ حيدنا input ديال userId، حيت كيتولد وحدو */}
                    <input type="email" name="gmail" placeholder="📧 Email Address" value={formData.gmail} onChange={handleChange} required className="form-field" />
                    <input type="password" name="password" placeholder="🔒 Password" value={formData.password} onChange={handleChange} required className="form-field" />
                    <select name="diplome" value={formData.diplome} onChange={handleChange} required className="form-select form-field">
                        <option value="">🎓 -- Select Diploma --</option>
                        <option value="IDE">IDE</option>
                        <option value="ISP">ISP</option>
                    </select>
                    <input type="text" name="service" placeholder="🏥 Service/Department" value={formData.service} onChange={handleChange} required className="form-field" />
                    <input type="text" name="equipe" placeholder="👥 Team/Shift" value={formData.equipe} onChange={handleChange} required className="form-field" />

                    <button type="submit" className="main-btn form-btn" disabled={loading}>
                        {loading ? '⏳ Processing...' : '➕ Add Nurse'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddNurse;
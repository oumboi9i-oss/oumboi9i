import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ManageManager.css';
import '../styles/form.css';

const ManageDDS = ({ onSelectDDS }) => {
  const [ddsList, setDdsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDDS();
  }, []);

  const fetchDDS = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/manager/getAll');
      setDdsList(res.data);
    } catch (error) {
      console.error('Error fetching DDS:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Manager?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/manager/${id}`);
      setDdsList(ddsList.filter(d => d._id !== id));
      alert('✅ Manager deleted successfully');
    } catch (error) {
      alert('❌ Failed to delete Manager');
    }
  };

  if (loading) return <div className="loading">⏳ Loading...</div>;

  return (
    <div className="manage-dds form-card">
      <h2>👔 Manage Managers</h2>

      {ddsList.length === 0 ? (
        <div className="empty-state">
          <span>👔</span>
          <p>No managers found</p>
        </div>
      ) : (
        <div className="dds-table">
          <table className="form-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ddsList.map((dds) => (
                <tr key={dds._id}>
                  <td>{dds.fullName}</td>
                  <td>{dds.email}</td>
                  <td>{dds.position || 'Director'}</td>
                  <td>
                    <button 
                      className="btn-delete form-btn form-btn-danger"
                      onClick={() => handleDelete(dds._id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageDDS;
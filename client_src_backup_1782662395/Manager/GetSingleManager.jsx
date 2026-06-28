import React, { useState, useEffect } from 'react';

const GetSingleDDS = ({ ddsId }) => {
  const [dds, setDds] = useState(null);

  useEffect(() => {
    if (ddsId) {
      setDds({ _id: ddsId });
    }
  }, [ddsId]);

  if (!ddsId || !dds) return null;

  return (
    <div style={{ 
      padding: '20px', 
      background: 'white', 
      borderRadius: '12px', 
      marginTop: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <h3>DDS Details</h3>
      <p><strong>ID:</strong> {dds._id}</p>
      <p><strong>Status:</strong> Active</p>
    </div>
  );
};

export default GetSingleDDS;
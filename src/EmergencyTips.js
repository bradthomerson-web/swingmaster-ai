// src/EmergencyTips.js
import React, { useState } from 'react';
import { emergencyTips } from './emergencyData'; // Importing the file you just made!

const EmergencyTips = ({ isProUser }) => {
  const [selectedTip, setSelectedTip] = useState(null);

  // 🔒 STATE 1: User is NOT a Pro
  if (!isProUser) {
    return (
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
        <h3>🚑 Swing 911</h3>
        <p>Unlock instant fixes for slices, hooks, and tops.</p>
        <button style={{ backgroundColor: '#FFD700', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
          Upgrade to Pro 🔒
        </button>
      </div>
    );
  }

  // ✅ STATE 2: User IS Pro, but hasn't picked a specific problem yet
  if (!selectedTip) {
    return (
      <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ color: 'red' }}>🚑 Swing 911</h3>
        <p>What's going wrong right now?</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          {emergencyTips.map((tip) => (
            <button 
              key={tip.id} 
              onClick={() => setSelectedTip(tip)}
              style={{ padding: '15px', backgroundColor: '#ffecec', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              {tip.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 📖 STATE 3: User selected a specific problem (Showing the Tip)
  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
      <button onClick={() => setSelectedTip(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: '10px' }}>
        ← Back to list
      </button>
      
      <div style={{ fontSize: '40px' }}>{selectedTip.icon}</div>
      <h3>{selectedTip.symptom}</h3>
      <p style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '10px' }}>
        {selectedTip.fix}
      </p>
    </div>
  );
};

export default EmergencyTips;
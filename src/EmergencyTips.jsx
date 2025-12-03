import React, { useState } from 'react';

const EmergencyTips = ({ isProUser }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔒 LOCKED STATE (If user is not Pro)
  if (!isProUser) {
    return (
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
        <h3>🚑 Swing 911</h3>
        <p>Unlock the AI Coach to fix your swing instantly.</p>
        <button style={{ backgroundColor: '#FFD700', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }}>
          Upgrade to Pro 🔒
        </button>
      </div>
    );
  }

  // 🧠 THE FUNCTION TO CALL AI
  const handleAskAI = async () => {
    if (!input) return;
    
    setIsLoading(true);
    setResponse(null); // Clear old answer

    // --- REAL AI LOGIC GOES HERE LATER ---
    // For now, we simulate a delay so you can see the loading state!
    setTimeout(() => {
      setResponse(`(Simulated AI Response): Here is a quick drill to fix "${input}". Keep your head still and rotate through impact!`);
      setIsLoading(false);
    }, 2000);
    // -------------------------------------
  };

  // ✅ UNLOCKED STATE (Chat Interface)
  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h3 style={{ color: 'red', marginTop: 0 }}>🚑 Swing 911 (AI Coach)</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>Describe your bad shot (e.g., "I keep slicing my driver")</p>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type here..."
        rows="3"
        style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', fontFamily: 'inherit' }}
      />

      <button 
        onClick={handleAskAI}
        disabled={isLoading}
        style={{ 
          marginTop: '10px', 
          backgroundColor: isLoading ? '#ccc' : 'red', 
          color: 'white', 
          padding: '10px 20px', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: isLoading ? 'not-allowed' : 'pointer',
          width: '100%',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? 'Analysing Swing...' : 'Ask Coach 🚑'}
      </button>

      {/* THE ANSWER BOX */}
      {response && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#eef', borderRadius: '5px', borderLeft: '4px solid red' }}>
          <strong>💡 Coach Says:</strong>
          <p style={{ marginTop: '5px' }}>{response}</p>
        </div>
      )}
    </div>
  );
};

export default EmergencyTips;
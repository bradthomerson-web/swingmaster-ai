import React, { useState } from 'react';

const EmergencyTips = ({ isProUser }) => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔒 LOCKED STATE
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

 // 🧠 THE REAL AI FUNCTION (Updated for Gemini 1.5 Flash)
  const handleAskAI = async () => {
    if (!input) return;
    
    setIsLoading(true);
    setResponse(null);

    // 1. Get the Key
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

// --- PASTE THIS BLOCK HERE ---
    console.log("Checking available models...");
    try {
        const listResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResponse.json();
        console.log("📜 MY ALLOWED MODELS:", listData); // <--- LOOK FOR THIS IN CONSOLE
    } catch (e) {
        console.error("List failed:", e);
    }
    // -----------------------------

    // Debugging: Let's check if the key is actually there
    console.log("Using API Key:", apiKey ? "Found key ending in..." + apiKey.slice(-4) : "MISSING!");

    if (!apiKey) {
        setResponse("Error: Missing API Key. Check your .env file!");
        setIsLoading(false);
        return;
    }

  try {
      // FIX: Changed 'v1beta' to 'v1' and used standard 'gemini-1.5-flash'
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ text: `You are a professional golf coach. A golfer is asking for help mid-round. The user says: "${input}". Give a very short, specific, actionable tip (max 2 sentences) to fix this immediately.` }] 
            }]
          }),
        }
      );

      const data = await response.json();

      // 3. Check for Google Errors (like 404 or 400)
      if (!response.ok) {
        console.error("Google API Error:", data); // This prints the detailed error to the console
        throw new Error(data.error?.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      // 4. Extract the answer
      if (data.candidates && data.candidates.length > 0) {
        setResponse(data.candidates[0].content.parts[0].text);
      } else {
        setResponse("Coach is thinking, but didn't give an answer. Try rephrasing.");
      }

    } catch (error) {
      console.error("Fetch Error:", error);
      setResponse(`Sorry, the Coach is offline. (${error.message})`);
    }

    setIsLoading(false);
  };

  return (
    <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
      <h3 style={{ color: 'red', marginTop: 0 }}>🚑 Swing 911 (Live Coach)</h3>
      <p style={{ fontSize: '14px', color: '#666' }}>What's going wrong? (e.g. "I'm topping my 5 iron")</p>
      
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Describe your bad shot..."
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
        {isLoading ? 'Consulting Coach...' : 'Get Fix 🚑'}
      </button>

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
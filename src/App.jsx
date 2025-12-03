import React, { useState } from 'react';
import SwingmasterAi from './SwingMasterAI'; 
import './index.css';
import EmergencyTips from './EmergencyTips'; 
import GPSRangefinder from './GPSRangefinder'; // <--- 1. Import it here

function App() {
    const [isPro, setIsPro] = useState(true); // Default to true for testing

    return (
        <div style={{ paddingBottom: '50px' }}>
            {/* The Dev Toggle (Optional, can keep or remove) */}
            <div style={{ padding: '10px', background: '#333', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                    <input 
                        type="checkbox" 
                        checked={isPro} 
                        onChange={() => setIsPro(!isPro)} 
                    />
                    {' '} Simulate Pro User Mode
                </label>
            </div>

            {/* Main App */}
            <SwingmasterAi />

            {/* Container for the Tools */}
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
                
                {/* 2. ADD THE GPS HERE! 📍 */}
                <GPSRangefinder isProUser={isPro} />

                {/* spacer */}
                <div style={{ height: '20px' }}></div>

                {/* Emergency Tips */}
                <EmergencyTips isProUser={isPro} />
            </div>
        </div>
    );
}

export default App;
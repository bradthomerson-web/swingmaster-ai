import React, { useState, useEffect } from 'react';
import SwingmasterAi from './SwingMasterAI'; 
import './index.css';
import EmergencyTips from './EmergencyTips'; 
import GPSRangefinder from './GPSRangefinder'; 

function App() {
    // 1. Default to FALSE (Locked) so it is secure by default
    const [isPro, setIsPro] = useState(false);

    // 2. Check Local Storage when the app loads to see if they are really Pro
    useEffect(() => {
        const savedProStatus = localStorage.getItem('ai_is_pro') === 'true';
        setIsPro(savedProStatus);
    }, []);

    return (
        <div style={{ paddingBottom: '50px' }}>
            {/* DEV TOGGLE: Use this to test, but now it starts unchecked for users! */}
            <div style={{ padding: '10px', background: '#333', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                    <input 
                        type="checkbox" 
                        checked={isPro} 
                        onChange={(e) => {
                            setIsPro(e.target.checked);
                            // Optional: Update storage so it remembers your choice during testing
                            localStorage.setItem('ai_is_pro', e.target.checked); 
                        }} 
                    />
                    {' '} Simulate Pro User Mode (Dev Only)
                </label>
            </div>

            {/* Main App */}
            <SwingmasterAi isPro={isPro} />

            {/* Container for the Tools */}
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
                
                {/* These tools will now receive 'false' unless the user is actually Pro */}
                <GPSRangefinder isProUser={isPro} />

                {/* spacer */}
                <div style={{ height: '20px' }}></div>

                {/* Emergency Tips - Now locked by default */}
                <EmergencyTips isProUser={isPro} />
            </div>
        </div>
    );
}

export default App;
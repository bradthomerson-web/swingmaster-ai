import React, { useState, useEffect } from 'react';
import SwingMasterAI from './SwingMasterAI'; 
import LandingPage from './LandingPage'; // <--- The new import!
import './index.css';
import EmergencyTips from './EmergencyTips'; 
import GPSRangefinder from './GPSRangefinder'; 

function App() {
    const [isPro, setIsPro] = useState(false);
    
    // NEW STATE: Tracks if the user has clicked "Start" yet
    const [hasStarted, setHasStarted] = useState(false);

    useEffect(() => {
        // 1. Check Pro Status
        const savedProStatus = localStorage.getItem('ai_is_pro') === 'true';
        setIsPro(savedProStatus);
        
        // 2. Check if they have already seen the landing page
        const alreadyStarted = localStorage.getItem('sm_has_started');
        if (alreadyStarted) setHasStarted(true);
    }, []);

    const handleStart = () => {
        setHasStarted(true);
        localStorage.setItem('sm_has_started', 'true'); // Remember this for next time
    };

    // --- VIEW LOGIC ---

    // 1. If they haven't clicked Start, show the Landing Page
    if (!hasStarted) {
        return <LandingPage onStart={handleStart} />;
    }

    // 2. Otherwise, show the full Main App
    return (
        <div style={{ paddingBottom: '50px' }}>
            {/* Dev Toggle */}
            <div style={{ padding: '10px', background: '#333', color: '#fff', textAlign: 'center', marginBottom: '20px' }}>
                <label style={{ cursor: 'pointer' }}>
                    <input 
                        type="checkbox" 
                        checked={isPro} 
                        onChange={(e) => {
                            setIsPro(e.target.checked);
                            localStorage.setItem('ai_is_pro', e.target.checked); 
                        }} 
                    />
                    {' '} Simulate Pro User Mode (Dev Only)
                </label>
            </div>
{/* Dev Toggle */}
<div style={{ padding: '10px', background: '#333', color: '#fff', textAlign: 'center', marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center' }}>
    
    {/* 1. The Pro Toggle */}
    <label style={{ cursor: 'pointer' }}>
        <input 
            type="checkbox" 
            checked={isPro} 
            onChange={(e) => {
                setIsPro(e.target.checked);
                localStorage.setItem('ai_is_pro', e.target.checked); 
            }} 
        />
        {' '} Simulate Pro User Mode
    </label>

    {/* 2. NEW: The "Reset" Button */}
    <button 
        onClick={() => {
            setHasStarted(false); // Reset State
            localStorage.removeItem('sm_has_started'); // Clear Memory
        }}
        style={{ fontSize: '12px', padding: '5px 10px', background: '#e11d48', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
    >
        Reset to Landing Page
    </button>

</div>
            {/* Main Dashboard */}
            <SwingMasterAI isPro={isPro} />

            {/* Tools Grid */}
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '0 20px' }}>
                <GPSRangefinder isProUser={isPro} />
                <div style={{ height: '20px' }}></div>
                <EmergencyTips isProUser={isPro} />
            </div>
        </div>
    );
}

export default App;
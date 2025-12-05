import React, { useState, useEffect } from 'react';
import SwingMasterAI from './SwingMasterAI'; 
import LandingPage from './LandingPage'; 
import HandicapCalculator from './HandicapCalculator'; // <--- New Import
import './index.css';

function App() {
    const [isPro, setIsPro] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
// Add this near your imports in App.jsx
const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00';
 
useEffect(() => {
        // 1. Check Local Storage
        const savedProStatus = localStorage.getItem('ai_is_pro') === 'true';
        let isNowPro = savedProStatus;

        // 2. CRITICAL: Check URL for Stripe Success (e.g. ?pro=1)
        const url = new URL(window.location.href);
        if (url.searchParams.get('pro') === '1') {
            isNowPro = true;
            localStorage.setItem('ai_is_pro', 'true'); // Save it forever
            
            // Clean the URL so they don't see ?pro=1 anymore
            url.searchParams.delete('pro');
            window.history.replaceState({}, '', url);
            
            // Optional: Celebrate!
            alert("Payment Successful! Welcome to Pro.");
        }

        setIsPro(isNowPro);
        
        // 3. Check Landing Page Status
        const alreadyStarted = localStorage.getItem('sm_has_started');
        if (alreadyStarted) setHasStarted(true);
    }, []);

    const handleStart = () => {
        setHasStarted(true);
        localStorage.setItem('sm_has_started', 'true');
    };

    // 1. If they haven't clicked Start, show the Landing Page
    if (!hasStarted) {
        return <LandingPage onStart={handleStart} />;
    }

   // 2. Otherwise, show the full Main App
    return (
        <div style={{ paddingBottom: '50px' }}>
            
            {/* --- NEW: OPTIONAL PRO BANNER (Value Add) --- */}
            {/* Only show this if they are NOT pro. It drives urgency. */}
            {!isPro && (
                <div className="bg-slate-900 text-white text-center py-2 text-xs font-bold tracking-wide cursor-pointer" onClick={() => window.location.href = STRIPE_PAYMENT_URL}>
                    🚀 <span className="text-green-400">Launch Special:</span> Get Lifetime Pro Access for $49. <span className="underline decoration-green-500">Upgrade Now</span>
                </div>
            )}

            {/* Main Dashboard */}
            <SwingMasterAI isPro={isPro} />

            {/* Bottom Tool Area - Handicap Calculator */}
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
                <HandicapCalculator />
            </div>
        </div>
    );
}

export default App;
import React, { useState, useEffect } from 'react';
import SwingMasterAI from './SwingMasterAI'; 
import HandicapCalculator from './HandicapCalculator'; 
import './index.css';

function App() {
    const [isPro, setIsPro] = useState(false);

    // Your Stripe Link
    const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00';
 
    useEffect(() => {
        // 1. Check Local Storage for Pro status
        const savedProStatus = localStorage.getItem('ai_is_pro') === 'true';
        let isNowPro = savedProStatus;

        // 2. Check URL for Stripe Success (e.g. ?pro=1)
        const url = new URL(window.location.href);
        if (url.searchParams.get('pro') === '1') {
            isNowPro = true;
            localStorage.setItem('ai_is_pro', 'true'); 
            
            // Clean the URL so the code disappears
            url.searchParams.delete('pro');
            window.history.replaceState({}, '', url);
            
            alert("Payment Successful! Welcome to Pro.");
        }

        setIsPro(isNowPro);
    }, []);

    // 3. Render the Main App immediately (No Landing Page check)
    return (
        <div style={{ paddingBottom: '50px' }}>
            
            {/* Optional Banner for Free Users */}
            {!isPro && (
                <div className="bg-slate-900 text-white text-center py-2 text-xs font-bold tracking-wide cursor-pointer" onClick={() => window.location.href = STRIPE_PAYMENT_URL}>
                    🚀 <span className="text-green-400">Launch Special:</span> Get Lifetime Pro Access for $49. <span className="underline decoration-green-500">Upgrade Now</span>
                </div>
            )}

            {/* Main Dashboard Component */}
            <SwingMasterAI isPro={isPro} />

            {/* Bottom Tool Area */}
            <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px' }}>
                <HandicapCalculator />
            </div>
        </div>
    );
}

export default App;
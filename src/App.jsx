import React from 'react';
import SwingmasterAi from './SwingmasterAi'; 
import './index.css';
import EmergencyTips from './EmergencyTips'; // Make sure this matches your file name (Capital E)

function App() {
    // We set this to 'true' so you can see the feature immediately!
    const isPro = true;

    return (
        <div>
            <h1>TESTING</h1>
            {/* The Main App */}
            <SwingmasterAi />

            {/* The New Feature - Now it's out of the box! */}
            <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                <EmergencyTips isProUser={isPro} />
            </div>
        </div>
    );
}

export default App;
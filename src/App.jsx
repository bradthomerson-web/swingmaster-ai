import React from 'react';
import SwingmasterAi from './SwingmasterAi';
import './index.css';
import EmergencyTips from './EmergencyTips'; // Ensure this matches your file name (Capital E usually)

function App() {
    // Toggle this to false if you want to test the "Locked" view!
    const isPro = true; 

    return (
        <div className="app-container">
            {/* Your Main App */}
            <SwingmasterAi />
            
            {/* Your New Emergency Feature */}
            <div style={{ marginTop: '20px', padding: '20px' }}>
                <EmergencyTips isProUser={isPro} />
            </div>
        </div>
    );
}

export default App;
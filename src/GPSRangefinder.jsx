import React, { useState, useEffect } from 'react';

const GPSRangefinder = ({ isProUser }) => {
  // 1. ALWAYS CALL HOOKS FIRST (Before any return statements)
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);

  // ⛳ TARGET: Example Green coordinates
  const targetLat = 33.5021; 
  const targetLng = -82.0226;

  // 2. DEFINE FUNCTIONS
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const toRad = x => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 1.09361);
  };

  const updateLocation = () => {
    if (!navigator.geolocation) {
      setError("GPS not supported");
      return;
    }
    setGpsReady(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const d = calculateDistance(position.coords.latitude, position.coords.longitude, targetLat, targetLng);
        setDistance(d);
        setGpsReady(true);
        setError(null);
      },
      (err) => { setError("Enable GPS permissions"); console.error(err); },
      { enableHighAccuracy: true }
    );
  };

  // 3. CALL EFFECT (But only run logic inside if Pro)
  useEffect(() => {
    let interval;
    if (isProUser) {
        updateLocation();
        interval = setInterval(updateLocation, 10000);
    }
    return () => {
        if(interval) clearInterval(interval);
    }
  }, [isProUser]);

  // 4. NOW WE CAN DO THE CONDITIONAL RETURN (Lock Screen)
  if (!isProUser) {
    return (
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        background: '#f9f9f9', 
        border: '1px solid #ccc',
        borderRadius: '10px', 
        textAlign: 'center'
      }}>
        <h3 style={{ margin: 0, color: '#333' }}>📍 GPS Rangefinder</h3>
        <p style={{ color: '#666', fontSize: '14px', margin: '10px 0' }}>
          Get precise yardage to the pin on every hole.
        </p>
        <button style={{ backgroundColor: '#FFD700', border: 'none', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderRadius: '5px' }}>
          Upgrade to Pro 🔒
        </button>
      </div>
    );
  }

  // 5. UNLOCKED VIEW
  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '20px', 
      background: '#222', 
      color: '#0f0', 
      borderRadius: '10px', 
      textAlign: 'center',
      fontFamily: 'monospace',
      border: '4px solid #444',
      boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>📍 RANGEFINDER</h3>
      
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '10px 0' }}>
          {distance !== null ? distance : "--"} <span style={{fontSize: '1rem'}}>YDS</span>
        </div>
      )}

      <button 
        onClick={updateLocation}
        style={{ background: '#444', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}
      >
        {gpsReady ? "REFRESH" : "LOCATING..."}
      </button>
    </div>
  );
};

export default GPSRangefinder;
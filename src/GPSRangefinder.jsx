import React, { useState, useEffect } from 'react';

const GPSRangefinder = () => {
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);
  const [gpsReady, setGpsReady] = useState(false);

  // ⛳ TARGET: The Green (Currently set to Augusta National Hole 12)
  // CHANGE THESE to your house/park to test it!
  const targetLat = 33.5021; 
  const targetLng = -82.0226;

  // 🧮 THE MATH: Calculates yards between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const toRad = x => x * Math.PI / 180;
    
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distanceMeters = R * c;
    
    // Convert meters to Yards (1 meter = 1.09361 yards)
    return Math.round(distanceMeters * 1.09361);
  };

  // 📍 GET LOCATION FUNCTION
  const updateLocation = () => {
    if (!navigator.geolocation) {
      setError("GPS not supported on this device");
      return;
    }

    setGpsReady(false);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        
        const yards = calculateDistance(userLat, userLng, targetLat, targetLng);
        setDistance(yards);
        setGpsReady(true);
        setError(null);
      },
      (err) => {
        setError("Please enable GPS permissions.");
        console.error(err);
      },
      { enableHighAccuracy: true } // Important for golf precision!
    );
  };

  // Auto-update every 10 seconds
  useEffect(() => {
    updateLocation();
    const interval = setInterval(updateLocation, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ 
      marginTop: '20px', 
      padding: '20px', 
      background: '#222', 
      color: '#0f0', 
      borderRadius: '10px', 
      textAlign: 'center',
      fontFamily: 'monospace',
      border: '4px solid #444'
    }}>
      <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem' }}>📍 RANGEFINDER</h3>
      
      {error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '10px 0' }}>
          {distance !== null ? distance : "---"} <span style={{fontSize: '1rem'}}>YDS</span>
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
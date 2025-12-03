// utils.js

// Helper to convert degrees to radians
function toRad(value) {
  return (value * Math.PI) / 180;
}

// Calculates distance between two points in YARDS
export function calculateDistanceInYards(userLat, userLng, targetLat, targetLng) {
  const R = 6371000; // Earth's radius in meters
  
  const dLat = toRad(targetLat - userLat);
  const dLon = toRad(targetLng - userLng);
  
  const lat1 = toRad(userLat);
  const lat2 = toRad(targetLat);

  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  const distanceInMeters = R * c;
  
  // Convert meters to yards (1 meter = 1.09361 yards)
  return Math.round(distanceInMeters * 1.09361);
}
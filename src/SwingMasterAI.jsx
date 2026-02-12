// src/SwingMasterAI.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Sparkles, Plus, TrendingUp, Trophy, Calendar, Target, User, Save, 
  Navigation, Zap, Lock, CreditCard, Locate, Stethoscope, Dumbbell, Video, 
  Users, BarChart3, ChevronRight, ChevronLeft, Camera, X, Activity 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UpgradeModal from './UpgradeModal'; 
// 📦 NEW: Import MediaPipe for AI Vision
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00"; 

const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

// 🛠️ PERMANENT FIX: Locked to Gemini 2.5 Flash
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const STANDARD_CLUBS = [
  'Driver', '3 Wood', '5 Wood', 'Hybrid', '3 Iron', '4 Iron', 
  '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 
  'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge'
];

const EQUIPMENT_OPTIONS = ['Driving Range', 'Golf Net', 'Hitting Mat', 'Simulator', 'Alignment Stick', 'Full Bag'];

export default function SwingMasterAI({ isPro }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- DATA STATE ---
  const [rounds, setRounds] = useState([]);
  const [userProfile, setUserProfile] = useState({ 
    name: '', age: '', handicap: '', strengths: '', weaknesses: '', equipment: ''
  });
  const [newRound, setNewRound] = useState({ date: '', course: '', score: '', putts: '', fairways: '', gir: '' });
  const [newDistanceEntry, setNewDistanceEntry] = useState({ club: '', carry: '', total: '' });
  const [clubDistances, setClubDistances] = useState([]);

  // --- LEAGUE STATE ---
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [newLeague, setNewLeague] = useState({ name: '', pot: '', members: '1' });
  const [leagues, setLeagues] = useState([
    { id: 1, name: 'Saturday Skins', members: 12, pot: '$50', rank: 4, score: '+2' },
    { id: 2, name: 'PGA Fantasy', members: 850, pot: 'Global', rank: 142, score: '885 pts' }
  ]);

  // --- AI STATE ---
  const [aiTool, setAiTool] = useState('trainer');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [caddieData, setCaddieData] = useState({ distance: '', wind: 'calm', lie: 'fairway' });
  const [fixInput, setFixInput] = useState('');
  const [customPracticeInput, setCustomPracticeInput] = useState('');

  // --- GPS STATE ---
  const [gpsActive, setGpsActive] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [gpsError, setGpsError] = useState(null);
  const [shotHistory, setShotHistory] = useState([]); 
  const [selectedClub, setSelectedClub] = useState('Driver');
  
  // --- VIDEO & MEDIAPIPE STATE (NEW) ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [aiFeedback, setAiFeedback] = useState("Align yourself in frame...");
  const requestRef = useRef(null);
  const baselineHeadX = useRef(null); // To track head sway

  const handleUpgradeToPro = () => window.location.href = STRIPE_CHECKOUT_URL;

  // --- LOAD DATA ---
  useEffect(() => {
    try {
      const savedRounds = localStorage.getItem('swingmaster_rounds');
      const savedProfile = localStorage.getItem('swingmaster_profile');
      const savedDistances = localStorage.getItem('swingmaster_club_distances');
      const savedLeagues = localStorage.getItem('swingmaster_leagues');
      
      if (savedRounds) setRounds(JSON.parse(savedRounds));
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
      if (savedDistances) setClubDistances(JSON.parse(savedDistances));
      if (savedLeagues) setLeagues(JSON.parse(savedLeagues));
    } catch (err) { console.error(err); }
  }, []);

  // --- SAVE EFFECTS ---
  useEffect(() => localStorage.setItem('swingmaster_rounds', JSON.stringify(rounds)), [rounds]);
  useEffect(() => localStorage.setItem('swingmaster_profile', JSON.stringify(userProfile)), [userProfile]);
  useEffect(() => localStorage.setItem('swingmaster_club_distances', JSON.stringify(clubDistances)), [clubDistances]);
  useEffect(() => localStorage.setItem('swingmaster_leagues', JSON.stringify(leagues)), [leagues]);

  // --- HELPERS ---
  const getAverages = () => {
    if (rounds.length === 0) return { score: '-', putts: '-', gir: '-', fairways: '-' };
    const sum = rounds.reduce((acc, curr) => ({
      score: acc.score + Number(curr.score),
      putts: acc.putts + Number(curr.putts),
      gir: acc.gir + Number(curr.gir),
      fairways: acc.fairways + Number(curr.fairways)
    }), { score: 0, putts: 0, gir: 0, fairways: 0 });
    return {
      score: (sum.score / rounds.length).toFixed(1),
      putts: (sum.putts / rounds.length).toFixed(1),
      gir: (sum.gir / rounds.length).toFixed(1),
      fairways: (sum.fairways / rounds.length).toFixed(1)
    };
  };
  const averages = getAverages();

  const handleSaveRound = () => {
    if (!newRound.score) return;
    setRounds([{...newRound, id: Date.now()}, ...rounds]);
    setNewRound({ date: '', course: '', score: '', putts: '', fairways: '', gir: '' });
    setActiveTab('dashboard');
  };

  const handleCreateLeague = () => {
    if (!newLeague.name) return;
    const newEntry = { 
        id: Date.now(), 
        name: newLeague.name, 
        pot: newLeague.pot || '$0', 
        members: 1,
        rank: 1,
        score: 'E'
    };
    setLeagues([...leagues, newEntry]);
    setNewLeague({ name: '', pot: '', members: '1' });
    setShowLeagueModal(false);
  };

  const handleLeagueClick = (league) => {
    setSelectedLeague(league);
    setActiveTab('league-detail');
  };

  const handleEquipmentChange = (item, isChecked) => {
    let currentItems = userProfile.equipment ? userProfile.equipment.split(',').map(i => i.trim()).filter(i => i) : [];
    if (isChecked) { if (!currentItems.includes(item)) currentItems.push(item); } else { currentItems = currentItems.filter(i => i !== item); }
    setUserProfile({ ...userProfile, equipment: currentItems.join(', ') });
  };

  const handleMiscEquipment = (text) => {
    let currentItems = userProfile.equipment ? userProfile.equipment.split(',').map(i => i.trim()) : [];
    const knownItems = currentItems.filter(i => EQUIPMENT_OPTIONS.includes(i));
    const newEquipmentString = knownItems.length > 0 ? knownItems.join(', ') + (text ? ', ' + text : '') : text;
    setUserProfile({ ...userProfile, equipment: newEquipmentString });
  };

  const getMiscText = () => {
    if (!userProfile.equipment) return '';
    const items = userProfile.equipment.split(',').map(i => i.trim());
    return items.filter(i => !EQUIPMENT_OPTIONS.includes(i)).join(', ');
  };

  const handleSaveDistance = () => {
    if (!newDistanceEntry.club || !newDistanceEntry.carry) return;
    setClubDistances([{...newDistanceEntry, id: Date.now(), carry: Number(newDistanceEntry.carry)}, ...clubDistances]);
    setNewDistanceEntry({ club: '', carry: '', total: '' });
  };

  // --- GPS LOGIC ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180, Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.09361);
  };

  const startShot = () => {
    if (!navigator.geolocation) { setGpsError("GPS not supported."); return; }
    setGpsActive(true); setCurrentDistance(0); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setStartCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGpsError("Location Error"), { enableHighAccuracy: true }
    );
  };

  const saveShot = () => {
    if(currentDistance > 0) setShotHistory([{ dist: currentDistance, club: selectedClub }, ...shotHistory]);
    setGpsActive(false); setStartCoords(null); setCurrentDistance(0);
  };

  useEffect(() => {
    let watchId;
    if (gpsActive && startCoords) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => setCurrentDistance(calculateDistance(startCoords.lat, startCoords.lng, pos.coords.latitude, pos.coords.longitude)),
        (err) => console.log(err), { enableHighAccuracy: true, maximumAge: 1000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [gpsActive, startCoords]);

  // --- VIDEO & AI ANALYSIS LOGIC ---
  
  // 1. Initialize AI Model
  useEffect(() => {
    const createPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });
      setPoseLandmarker(landmarker);
    };
    createPoseLandmarker();
  }, []);

  // 2. Start Camera & Analysis Loop
  const startCamera = async () => {
    setCameraActive(true);
    baselineHeadX.current = null; // Reset baseline
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener("loadeddata", predictWebcam);
      }
    } catch (err) { console.error("Camera Error", err); }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
    }
  };

  // 3. The "Brain": Analyze the Frame
  const predictWebcam = () => {
    if (!poseLandmarker || !videoRef.current || !canvasRef.current) return;
    
    let startTimeMs = performance.now();
    
    // Detect Body
    const results = poseLandmarker.detectForVideo(videoRef.current, startTimeMs);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const video = videoRef.current;

    // Match canvas size to video size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks && results.landmarks.length > 0) {
      const drawingUtils = new DrawingUtils(ctx);
      
      // Draw Skeleton
      for (const landmark of results.landmarks) {
        drawingUtils.drawLandmarks(landmark, { radius: 3, color: "#00FF00" });
        drawingUtils.drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: "#FFFFFF", lineWidth: 2 });
        
        // --- REAL-TIME ANALYSIS ---
        const nose = landmark[0]; // Nose is index 0
        
        // Set Baseline (Address Position)
        if (baselineHeadX.current === null) {
            baselineHeadX.current = nose.x;
            setAiFeedback("✅ Tracking Active. Swing away!");
        } else {
            // Calculate Sway (Difference from baseline)
            const sway = nose.x - baselineHeadX.current;
            
            // Threshold: If nose moves > 5% of screen width
            if (Math.abs(sway) > 0.05) {
                setAiFeedback(sway > 0 ? "⚠️ HEAD SWAY: LEFT" : "⚠️ HEAD SWAY: RIGHT");
                // Draw Warning Box
                ctx.strokeStyle = "red";
                ctx.lineWidth = 5;
                ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
            } else {
                setAiFeedback("✅ Good Head Stability");
            }
        }
      }
    }
    
    if(cameraActive) {
        requestRef.current = requestAnimationFrame(predictWebcam);
    }
  };

  // --- AI LOGIC (LOCKED TO 2.5) ---
  const callGemini = async (prompt) => {
    if (!apiKey) {
        alert("Missing API Key! Make sure VITE_GEMINI_API_KEY is in your .env file.");
        return;
    }
    setLoadingAI(true);
    setAiResponse(null);
    try {
      const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiResponse(text);
    } catch (err) {
      setAiResponse(`⚠️ Error: ${err.message}. Check your API Key and connection.`);
    } finally {
      setLoadingAI(false);
    }
  };

  const generateDataDrivenPlan = () => {
    const prompt = `Act as a PGA Coach. Create a 45-minute practice plan. MY STATS: Score Avg ${averages.score}, Putts ${averages.putts}. WEAKNESS: "${userProfile.weaknesses}". EQUIPMENT: ${userProfile.equipment || 'Standard'}. Provide YouTube links for drills.`;
    callGemini(prompt);
  };

  const generateCaddieAdvice = () => {
    const prompt = `Act as a Tour Caddie. Shot: ${caddieData.distance} yards, Wind: ${caddieData.wind}, Lie: ${caddieData.lie}. Recommendation?`;
    callGemini(prompt);
  };

  const generateQuickFix = () => {
    if(!isPro) { setShowUpgradeModal(true); return; }
    if(!fixInput) return;
    const prompt = `EMERGENCY GOLF MODE. User Issue: "${fixInput}". Provide 1 mechanical cause, 2 setup fixes (Option A/B), 2 swing thoughts (Option A/B), and 1 post-round drill explanation. Concise.`;
    callGemini(prompt);
  };

  const generateCustomPractice = () => {
    if(!isPro) { setShowUpgradeModal(true); return; }
    if(!customPracticeInput) return;
    const prompt = `Act as a PGA Coach. I want to work on: "${customPracticeInput}". Create a focused session with 3 drills. Provide YouTube links for each.`;
    callGemini(prompt);
  };

  const renderSummaryTable = () => {
    const summaryArray = clubDistances ? clubDistances : [];
    if (summaryArray.length === 0) return <p className="text-slate-500 text-sm text-center">Log distances to see data here.</p>;
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-4">
        <div className="p-3 bg-slate-100 font-bold text-xs text-slate-500 uppercase">My Bag Data</div>
        {summaryArray.map((entry, i) => (
             <div key={i} className="flex justify-between p-3 border-b text-sm">
                 <span className="font-bold text-slate-700">{entry.club}</span>
                 <span className="text-blue-600 font-bold">{entry.carry}y</span>
             </div>
        ))}
      </div>
    );
  };

  const renderGPS = () => (
    <div className="max-w-xl mx-auto space-y-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 relative">
            <h2 className="font-bold text-slate-900 mb-2 flex justify-center gap-2"><Navigation className="text-blue-600"/> GPS Measure</h2>
            <div className="text-7xl font-black text-slate-900 mb-1">{currentDistance}</div>
            <div className="text-slate-400 font-bold mb-6">YARDS</div>
            <div className="mb-6">
                <select value={selectedClub} onChange={(e) => setSelectedClub(e.target.value)} className="w-full p-2 border rounded-lg font-bold text-center bg-slate-50">
                    {STANDARD_CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            {!gpsActive ? <button onClick={startShot} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center gap-2"><Locate/> Start Shot</button>
            : <button onClick={saveShot} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold animate-pulse">Stop & Save</button>}
            {gpsError && <p className="text-red-500 text-sm mt-2">{gpsError}</p>}
        </div>
        {shotHistory.length > 0 && <div className="bg-white rounded-xl shadow p-4 text-left"><h3 className="font-bold border-b pb-2 mb-2">History</h3>{shotHistory.map((s,i)=><div key={i} className="flex justify-between py-2 border-b last:border-0"><span>{s.club}</span><span className="font-bold">{s.dist}y</span></div>)}</div>}
    </div>
  );

  // --- VIEWS ---
  return (
    <div className="bg-slate-50 font-sans text-slate-900 max-w-7xl mx-auto w-full min-h-screen pb-20">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">SwingMaster <span className="text-green-500">Pro</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPro ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-100'}`}>
              {isPro ? 'PRO MEMBER' : 'FREE'}
            </span>
          </div>
        </div>
        <div className="flex justify-around bg-slate-800 p-2 overflow-x-auto">
            {[
              { id: 'dashboard', icon: Trophy, label: 'Stats' },
              { id: 'leagues', icon: Users, label: 'Leagues' }, 
              { id: 'rounds', icon: Calendar, label: 'Log' },
              { id: 'gps', icon: Navigation, label: 'GPS' },
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'ai-hub', icon: Stethoscope, label: 'Coach' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                className={`flex flex-col items-center gap-1 text-xs font-bold px-2 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                <tab.icon size={20} /> {tab.label}
              </button>
            ))}
        </div>
      </header>
      <main className="p-4">
        
        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="text-slate-500 text-xs uppercase font-bold">Avg Score</div>
                    <div className="text-3xl font-bold text-slate-900">{averages.score}</div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 text-center">
                    <div className="text-slate-500 text-xs uppercase font-bold">Putts</div>
                    <div className="text-3xl font-bold text-slate-900">{averages.putts}</div>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart3 size={18} className="text-blue-500"/> Performance Trends</h3>
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1"><span>Driving Accuracy</span><span>42%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width: '42%'}}></div></div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1"><span>GIR (Greens)</span><span>38%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width: '38%'}}></div></div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs font-bold mb-1"><span>Scrambling</span><span>18%</span></div>
                        <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{width: '18%'}}></div></div>
                    </div>
                </div>
            </div>

            {rounds.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-3 bg-slate-100 font-bold text-sm text-slate-600">History</div>
                    {rounds.map(r => (
                        <div key={r.id} className="p-3 border-b flex justify-between text-sm">
                            <span>{r.date || 'No Date'}</span>
                            <span className="font-bold">{r.score}</span>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* TAB: LEAGUES LIST */}
        {activeTab === 'leagues' && (
             <div className="space-y-4">
                 <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl text-white shadow-lg">
                     <h2 className="text-xl font-bold mb-1">Active Leagues</h2>
                     <p className="text-slate-400 text-sm mb-4">Compete with friends & win prizes.</p>
                     <button 
                        onClick={() => setShowLeagueModal(true)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm w-full hover:bg-green-400 transition-colors"
                     >
                        Create New League
                     </button>
                 </div>
                 
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                     {leagues.map((league) => (
                        <button 
                            key={league.id} 
                            onClick={() => handleLeagueClick(league)}
                            className="w-full text-left p-4 border-b last:border-0 flex justify-between items-center hover:bg-slate-50 transition-colors"
                        >
                            <div>
                                <div className="font-bold text-slate-900">{league.name}</div>
                                <div className="text-xs text-slate-500">{league.members} Members • Pot: {league.pot}</div>
                            </div>
                            <ChevronRight className="text-slate-400"/>
                        </button>
                     ))}
                 </div>
                 
                 {!isPro && (
                     <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                         <p className="text-sm text-amber-800 font-bold mb-2">Unlock Unlimited Leagues</p>
                         <button onClick={handleUpgradeToPro} className="bg-amber-400 text-slate-900 px-4 py-2 rounded-lg font-bold text-sm">Upgrade to Pro</button>
                     </div>
                 )}
             </div>
        )}

        {/* TAB: LEAGUE DETAIL VIEW */}
        {activeTab === 'league-detail' && selectedLeague && (
            <div className="space-y-4 animate-fadeIn">
                <button onClick={() => setActiveTab('leagues')} className="text-slate-500 font-bold text-sm flex items-center gap-1 mb-2 hover:text-slate-800 transition-colors">
                    <ChevronLeft size={18}/> Back to Leagues
                </button>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">{selectedLeague.name}</h2>
                            <p className="text-slate-500 text-sm">Pot: <span className="text-green-600 font-bold">{selectedLeague.pot}</span> • {selectedLeague.members} Players</p>
                        </div>
                        <div className="bg-slate-100 p-2 rounded-lg text-center min-w-[60px]">
                            <div className="text-xs text-slate-500 uppercase font-bold">My Rank</div>
                            <div className="text-xl font-bold text-slate-900">#{selectedLeague.rank}</div>
                        </div>
                    </div>

                    <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase flex items-center gap-2"><Trophy size={14} className="text-amber-500"/> Leaderboard</h3>
                    <div className="space-y-2">
                        {/* Dummy Leaderboard Data for Demo */}
                        {[1, 2, 3, selectedLeague.rank, 5].sort((a,b) => a-b).map((rank, i) => (
                            <div key={rank} className={`flex justify-between items-center p-3 rounded-lg ${rank === selectedLeague.rank ? 'bg-blue-50 border border-blue-100' : 'bg-slate-50'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`font-bold w-6 text-center ${rank === 1 ? 'text-amber-500' : 'text-slate-400'}`}>{rank}</span>
                                    <div className="flex flex-col">
                                        <span className={`font-bold text-sm ${rank === selectedLeague.rank ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {rank === selectedLeague.rank ? (userProfile.name || 'You') : `Player ${Math.floor(Math.random() * 100)}`}
                                        </span>
                                    </div>
                                </div>
                                <span className={`font-bold ${rank === 1 ? 'text-green-600' : 'text-slate-900'}`}>
                                    {rank === selectedLeague.rank ? selectedLeague.score : (rank === 1 ? '-4' : rank === 2 ? '-2' : rank === 3 ? 'E' : '+3')}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* LOG ROUND */}
        {activeTab === 'rounds' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-4">Log Round</h2>
                <div className="space-y-3">
                    <input type="date" className="w-full p-2 border rounded" onChange={e => setNewRound({...newRound, date: e.target.value})} />
                    <input type="text" placeholder="Course Name" className="w-full p-2 border rounded" onChange={e => setNewRound({...newRound, course: e.target.value})} />
                    <div className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Score" className="p-2 border rounded" onChange={e => setNewRound({...newRound, score: e.target.value})} />
                        <input type="number" placeholder="Putts" className="p-2 border rounded" onChange={e => setNewRound({...newRound, putts: e.target.value})} />
                        <input type="number" placeholder="Fairways" className="p-2 border rounded" onChange={e => setNewRound({...newRound, fairways: e.target.value})} />
                        <input type="number" placeholder="GIR" className="p-2 border rounded" onChange={e => setNewRound({...newRound, gir: e.target.value})} />
                    </div>
                    <button onClick={handleSaveRound} className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700">Save Round</button>
                </div>
            </div>
        )}

        {/* GPS TAB */}
        {activeTab === 'gps' && renderGPS()}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <h2 className="font-bold text-slate-900 mb-6">Profile</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} className="w-full p-2 border rounded"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Hcp</label><input type="text" value={userProfile.handicap} onChange={e => setUserProfile({...userProfile, handicap: e.target.value})} className="w-full p-2 border rounded"/></div>
            </div>
            <div className="mb-6">
                <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">My Equipment</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                    {EQUIPMENT_OPTIONS.map(item => {
                        const isChecked = userProfile.equipment?.includes(item);
                        return (
                            <label key={item} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                                <input type="checkbox" checked={isChecked || false} onChange={(e) => handleEquipmentChange(item, e.target.checked)} className="w-4 h-4 accent-blue-600"/>
                                <span className="text-sm font-bold">{item}</span>
                            </label>
                        );
                    })}
                </div>
                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Other / Misc (comma separated)</label>
                <input type="text" value={getMiscText()} onChange={(e) => handleMiscEquipment(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="e.g. FlightScope, PuttOut Mat..."/>
            </div>
            <div className="mb-6">
                <label className="text-xs font-bold text-red-500 uppercase mb-1 block">My Key Miss / Focus Area</label>
                <input type="text" value={userProfile.weaknesses} onChange={(e) => setUserProfile({...userProfile, weaknesses: e.target.value})} className="w-full p-3 bg-red-50 border border-red-100 rounded-lg text-sm" placeholder="e.g. Slice off the tee, Fat iron shots..." />
            </div>
            <button onClick={() => setActiveTab('dashboard')} className="bg-slate-900 text-white px-6 py-2 rounded font-bold"><Save size={18} className="inline mr-2"/> Save Profile</button>
          </div>
        )}

        {/* AI HUB TAB */}
        {activeTab === 'ai-hub' && (
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 animate-fadeIn">
                <div className="md:w-1/3 space-y-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                            <Stethoscope className="text-green-600" /> Treatment Plan
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'trainer', label: 'Daily Trainer', icon: '🏋️', desc: 'Custom practice routine' },
                                { id: 'custom', label: 'Skill Builder', icon: '🎯', desc: 'Focus on one area', locked: !isPro },
                                { id: 'analyzer', label: 'Swing Studio', icon: '📹', desc: 'Record & Analyze', locked: false },
                                { id: 'caddie', label: 'Smart Caddie', icon: '⛳', desc: 'Club & shot advice' },
                                { id: 'distances', label: 'Bag Mapping', icon: '📏', desc: 'Track your yardages' },
                                { id: 'fix', label: 'Swing 911', icon: '🚑', desc: 'Emergency fix', locked: !isPro }
                            ].map((tool) => (
                                <button key={tool.id} onClick={() => { setAiTool(tool.id); setAiResponse(null); setCameraActive(false); }} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${aiTool === tool.id ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500' : 'border-slate-100 hover:border-green-300 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><span className="text-2xl bg-white p-2 rounded-lg shadow-sm border border-slate-100">{tool.icon}</span><div><div className={`font-bold ${aiTool === tool.id ? 'text-green-800' : 'text-slate-700'}`}>{tool.label}</div><div className="text-xs text-slate-400 font-medium">{tool.desc}</div></div></div>
                                    {tool.locked && <Lock size={16} className="text-slate-300 group-hover:text-red-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="md:w-2/3">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                        <div className="space-y-6">
                            
                            {/* VIDEO ANALYZER (UPDATED WITH AI) */}
                            {aiTool === 'analyzer' && (
                                <div className="space-y-4">
                                    <div className="relative bg-black rounded-xl overflow-hidden aspect-[3/4] flex items-center justify-center">
                                        {!cameraActive ? (
                                            <div className="text-center">
                                                <Camera className="mx-auto text-slate-500 mb-2" size={48} />
                                                <p className="text-slate-400 mb-4">Allow camera access to analyze swing</p>
                                                <button onClick={startCamera} className="bg-blue-600 text-white px-6 py-3 rounded-full font-bold">Start Camera</button>
                                            </div>
                                        ) : (
                                            <>
                                                {/* VIDEO FEED */}
                                                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                                                
                                                {/* AI OVERLAY CANVAS */}
                                                <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
                                                
                                                {/* FEEDBACK OVERLAY */}
                                                <div className="absolute top-4 left-4 bg-black/70 text-white px-4 py-2 rounded-lg backdrop-blur-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Activity className="text-green-400" size={16} />
                                                        <span className="font-bold text-sm">{aiFeedback}</span>
                                                    </div>
                                                </div>

                                                <div className="absolute bottom-4 left-0 w-full flex justify-center pointer-events-auto">
                                                    <button onClick={stopCamera} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">Stop</button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600">
                                        <strong>💡 How it works:</strong> The AI tracks your nose position. If it moves too far left or right during your swing, it alerts you to "Swaying."
                                    </div>
                                </div>
                            )}

                            {aiTool === 'trainer' && <button onClick={generateDataDrivenPlan} disabled={loadingAI} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex justify-center items-center gap-2">{loadingAI ? "Analyzing Stats..." : "Generate Today's Plan"} {!loadingAI && <Sparkles size={18}/>}</button>}
                            
                            {aiTool === 'custom' && (
                                !isPro ? (
                                    <div className="text-center py-10 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={32}/></div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Pro Access Only</h3>
                                        <p className="text-slate-500 mb-6">Unlock custom practice plans for any part of your game.</p>
                                        <button onClick={handleUpgradeToPro} className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-3 rounded-full font-bold">Unlock for $49</button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Target className="text-blue-500"/> Skill Builder</h2>
                                        <p className="text-sm text-slate-500">What do you want to work on today?</p>
                                        <input type="text" value={customPracticeInput} onChange={(e) => setCustomPracticeInput(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Short Game, Bunker Shots, Lag Putting..." />
                                        <button onClick={generateCustomPractice} disabled={loadingAI || !customPracticeInput} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex justify-center items-center gap-2">
                                            {loadingAI ? "Building Plan..." : "Get Drills"} {!loadingAI && <Dumbbell size={18}/>}
                                        </button>
                                    </div>
                                )
                            )}

                            {aiTool === 'caddie' && <div className="space-y-4"><input type="number" placeholder="Distance to Pin" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg" onChange={e => setCaddieData({...caddieData, distance: e.target.value})} /><button onClick={generateCaddieAdvice} disabled={loadingAI} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg">{loadingAI ? "Consulting..." : "Get Advice"}</button></div>}
                            
                            {aiTool === 'distances' && <div className="space-y-4"><div className="flex gap-3"><select className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" onChange={e => setNewDistanceEntry({...newDistanceEntry, club: e.target.value})}><option>Select Club</option>{STANDARD_CLUBS.map(c => <option key={c}>{c}</option>)}</select><input type="number" placeholder="Yards" className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg" onChange={e => setNewDistanceEntry({...newDistanceEntry, carry: e.target.value})} /></div><button onClick={handleSaveDistance} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700">Log Shot Data</button>{renderSummaryTable()}</div>}
                            
                            {aiTool === 'fix' && (
                                !isPro ? (
                                    <div className="text-center py-10 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-300"><h3 className="text-xl font-bold text-slate-800 mb-2">Pro Access Only</h3><button onClick={handleUpgradeToPro} className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-3 rounded-full font-bold">Unlock for $49</button></div>
                                ) : (
                                    <div className="space-y-4"><textarea className="w-full p-4 bg-red-50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[120px]" placeholder="Describe your miss (e.g. slicing driver)" onChange={e => setFixInput(e.target.value)}></textarea><button onClick={generateQuickFix} disabled={loadingAI} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold text-lg">{loadingAI ? "Diagnosing..." : "Fix My Swing"}</button></div>
                                )
                            )}
                        </div>
                        {aiResponse && (
                            <div className="mt-8 pt-8 border-t border-slate-100 animate-fadeIn">
                                <div className="prose prose-slate max-w-none p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </main>

      {/* --- LEAGUE CREATION MODAL --- */}
      {showLeagueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
                <button onClick={() => setShowLeagueModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
                <h3 className="text-xl font-bold text-slate-900 mb-4">Create New League</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">League Name</label>
                        <input type="text" className="w-full p-3 border rounded-xl" placeholder="e.g. Sunday Skins" value={newLeague.name} onChange={e => setNewLeague({...newLeague, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Buy-In / Pot</label>
                        <input type="text" className="w-full p-3 border rounded-xl" placeholder="e.g. $20" value={newLeague.pot} onChange={e => setNewLeague({...newLeague, pot: e.target.value})} />
                    </div>
                    <button onClick={handleCreateLeague} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Create League</button>
                </div>
            </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgradeToPro} />
    </div>
  );
}
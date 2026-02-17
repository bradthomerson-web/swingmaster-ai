// src/SwingMasterAI.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Sparkles, Plus, TrendingUp, Trophy, Calendar, Target, User, Save, 
  Navigation, Zap, Lock, CreditCard, Locate, Stethoscope, Dumbbell, Video, 
  Users, BarChart3, ChevronRight, ChevronLeft, Camera, X, Activity, CheckCircle2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UpgradeModal from './UpgradeModal'; 
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00"; 
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

// 🛠️ PERMANENT LOCK: Gemini 2.5 Flash
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const EQUIPMENT_OPTIONS = ['Driving Range', 'Golf Net', 'Hitting Mat', 'Simulator', 'Alignment Stick', 'Full Bag'];
const STANDARD_CLUBS = ['Driver', '3 Wood', '5 Wood', 'Hybrid', '3 Iron', '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge'];

export default function SwingMasterAI({ isPro }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- DATA STATE ---
  const [rounds, setRounds] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', handicap: '', weaknesses: '', equipment: '' });
  
  // --- LIVE ROUND STATE ---
  const [isLiveRound, setIsLiveRound] = useState(false);
  const [currentHole, setCurrentHole] = useState(1);
  const [liveData, setLiveData] = useState(Array(18).fill().map((_, i) => ({
    hole: i + 1, par: 4, strokes: 4, putts: 2, fairway: 'hit', gir: true
  })));

  // --- GPS SHOT TRACKING STATE ---
  const [gpsActive, setGpsActive] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [shotHistory, setShotHistory] = useState([]);
  const [selectedClub, setSelectedClub] = useState('Driver');

  // --- LEAGUE STATE ---
  const [showLeagueModal, setShowLeagueModal] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [newLeague, setNewLeague] = useState({ name: '', pot: '', members: '1' });
  const [leagues, setLeagues] = useState([
    { id: 1, name: 'Saturday Skins', members: 12, pot: '$50', rank: 4, score: '+2' },
    { id: 2, name: 'PGA Fantasy', members: 850, pot: 'Global', rank: 142, score: '885 pts' }
  ]);

  // --- AI HUB STATE ---
  const [aiTool, setAiTool] = useState('trainer');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [caddieData, setCaddieData] = useState({ distance: '' });
  const [fixInput, setFixInput] = useState('');
  const [customPracticeInput, setCustomPracticeInput] = useState('');

  // --- VIDEO & AI VISION STATE ---
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [aiFeedback, setAiFeedback] = useState("Align yourself...");
  const requestRef = useRef(null);
  const baselineHeadX = useRef(null);

  const handleUpgradeToPro = () => window.location.href = STRIPE_CHECKOUT_URL;

  // --- PERSISTENCE ---
  useEffect(() => {
    try {
      const saved = localStorage.getItem('swingmaster_master_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rounds) setRounds(parsed.rounds);
        if (parsed.profile) setUserProfile(parsed.profile);
        if (parsed.leagues) setLeagues(parsed.leagues);
        if (parsed.shots) setShotHistory(parsed.shots);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    localStorage.setItem('swingmaster_master_v6', JSON.stringify({ rounds, profile: userProfile, leagues, shots: shotHistory }));
  }, [rounds, userProfile, leagues, shotHistory]);

  // --- AI VISION INIT ---
  useEffect(() => {
    async function initAI() {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm");
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, delegate: "GPU" },
          runningMode: "VIDEO", numPoses: 1
        });
        setPoseLandmarker(landmarker);
      } catch (err) { console.error("AI Init Failed", err); }
    }
    initAI();
  }, []);

  // --- GPS LOGIC ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; 
    const φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180, Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)*Math.sin(Δφ/2) + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)*Math.sin(Δλ/2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.09361);
  };

  const startShot = () => {
    setGpsActive(true);
    setCurrentDistance(0);
    navigator.geolocation.getCurrentPosition((pos) => {
      setStartCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    }, (err) => alert("GPS Error: Please enable location."), { enableHighAccuracy: true });
  };

  useEffect(() => {
    let watchId;
    if (gpsActive && startCoords) {
      watchId = navigator.geolocation.watchPosition((pos) => {
        setCurrentDistance(calculateDistance(startCoords.lat, startCoords.lng, pos.coords.latitude, pos.coords.longitude));
      }, null, { enableHighAccuracy: true });
    }
    return () => navigator.geolocation.clearWatch(watchId);
  }, [gpsActive, startCoords]);

  const saveShot = () => {
    setShotHistory([{ club: selectedClub, distance: currentDistance, date: new Date().toLocaleDateString() }, ...shotHistory]);
    setGpsActive(false);
    setStartCoords(null);
  };

  // --- OTHER LOGIC FUNCTIONS ---
  const startNewRound = () => {
    setLiveData(Array(18).fill().map((_, i) => ({ hole: i + 1, par: 4, strokes: 4, putts: 2, fairway: 'hit', gir: true })));
    setCurrentHole(1);
    setIsLiveRound(true);
    setActiveTab('live-scorecard');
  };

  const updateHole = (field, value) => {
    const newData = [...liveData];
    newData[currentHole - 1][field] = value;
    setLiveData(newData);
  };

  const finishRound = () => {
    const totalStrokes = liveData.reduce((acc, h) => acc + h.strokes, 0);
    const summary = { id: Date.now(), date: new Date().toLocaleDateString(), score: totalStrokes, putts: liveData.reduce((a,b)=>a+b.putts,0) };
    setRounds([summary, ...rounds]);
    setIsLiveRound(false);
    setActiveTab('dashboard');
  };

  const handleEquipmentChange = (item, isChecked) => {
    let currentItems = userProfile.equipment ? userProfile.equipment.split(',').map(i => i.trim()).filter(i => i) : [];
    if (isChecked) { if (!currentItems.includes(item)) currentItems.push(item); } 
    else { currentItems = currentItems.filter(i => i !== item); }
    setUserProfile({ ...userProfile, equipment: currentItems.join(', ') });
  };

  const handleCreateLeague = () => {
    if (!newLeague.name) return;
    const newEntry = { id: Date.now(), name: newLeague.name, pot: newLeague.pot || '$0', members: 1, rank: 1, score: 'E' };
    setLeagues([...leagues, newEntry]);
    setNewLeague({ name: '', pot: '', members: '1' });
    setShowLeagueModal(false);
  };

  const callGemini = async (prompt) => {
    setLoadingAI(true);
    setAiResponse(null);
    try {
      const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      setAiResponse(data.candidates[0].content.parts[0].text);
    } catch (err) { setAiResponse("⚠️ AI Error. Locked to 2.5 Flash."); }
    setLoadingAI(false);
  };

  const startCamera = async () => {
    setCameraActive(true);
    baselineHeadX.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = predictWebcam;
      }
    } catch (err) { setCameraActive(false); }
  };

  const stopCamera = () => {
    setCameraActive(false);
    if (videoRef.current?.srcObject) { videoRef.current.srcObject.getTracks().forEach(t => t.stop()); }
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const predictWebcam = () => {
    if (!poseLandmarker || !videoRef.current || !canvasRef.current || !cameraActive) return;
    const results = poseLandmarker.detectForVideo(videoRef.current, performance.now());
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks?.length > 0) {
      const landmark = results.landmarks[0];
      new DrawingUtils(ctx).drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: "#00FF00", lineWidth: 2 });
      const nose = landmark[0];
      if (baselineHeadX.current === null) baselineHeadX.current = nose.x;
      else {
          const sway = nose.x - baselineHeadX.current;
          setAiFeedback(Math.abs(sway) > 0.06 ? "⚠️ SWAY DETECTED" : "✅ STABLE CENTER");
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-900">
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold tracking-tight">SwingMaster <span className="text-green-500">Pro</span></h1>
            <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 py-1 rounded-full uppercase">{isPro ? 'PRO MEMBER' : 'FREE'}</span>
        </div>
        <div className="flex justify-around bg-slate-800 p-2 overflow-x-auto border-t border-slate-700">
            {[
              { id: 'dashboard', icon: Trophy, label: 'Stats' },
              { id: 'leagues', icon: Users, label: 'Leagues' }, 
              { id: 'live-scorecard', icon: Calendar, label: 'Play' },
              { id: 'gps', icon: Navigation, label: 'GPS' },
              { id: 'ai-hub', icon: Stethoscope, label: 'Coach' },
              { id: 'profile', icon: User, label: 'Profile' },
            ].map(tab => (
              <button key={tab.id} onClick={() => {setActiveTab(tab.id); setSelectedLeague(null);}} 
                className={`flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-tighter px-3 py-1 transition-all ${activeTab.includes(tab.id) ? 'text-white' : 'text-slate-400'}`}>
                <tab.icon size={18} className={activeTab.includes(tab.id) ? 'text-green-500' : ''} /> {tab.label}
              </button>
            ))}
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        
        {/* STATS VIEW (UPDATED WITH DYNAMIC CHARTS) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <button onClick={startNewRound} className="w-full bg-green-600 text-white py-5 rounded-3xl font-bold shadow-xl flex justify-center items-center gap-2"><Plus/> Start New Round</button>
            
            {/* AVG CARDS */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border text-center">
                    <div className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Avg Score</div>
                    <div className="text-4xl font-black">{ rounds.length > 0 ? (rounds.reduce((a,b)=>a+b.score,0)/rounds.length).toFixed(1) : '-' }</div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border text-center">
                    <div className="text-slate-400 text-[10px] font-black uppercase mb-1 tracking-widest">Avg Putts</div>
                    <div className="text-4xl font-black">{ rounds.length > 0 ? (rounds.reduce((a,b)=>a+b.putts,0)/rounds.length).toFixed(1) : '-' }</div>
                </div>
            </div>

            {/* IMPROVEMENT CHART */}
            <div className="bg-white p-6 rounded-3xl border shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-widest">
                    <TrendingUp size={16} className="text-blue-500"/> Scoring Trends (Last 5)
                </h3>
                {rounds.length > 0 ? (
                    <div className="flex items-end justify-between h-32 gap-2">
                        {rounds.slice(0, 5).reverse().map((r, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                <div className="text-[10px] font-bold text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{r.score}</div>
                                <div 
                                    className="w-full bg-blue-100 rounded-t-lg hover:bg-blue-500 transition-colors relative group-hover:shadow-lg" 
                                    style={{height: `${Math.min(100, (r.score / 120) * 100)}%`}}
                                ></div>
                                <div className="text-[9px] font-bold text-slate-400 mt-2">{r.date.split('/')[0]}/{r.date.split('/')[1]}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400 text-xs">Play rounds to see your improvement trends here.</div>
                )}
            </div>

            {/* RECENT HISTORY */}
            {rounds.length > 0 && (
                <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                    <div className="p-4 bg-slate-50 font-bold text-xs text-slate-400 uppercase tracking-widest">Recent Rounds</div>
                    {rounds.slice(0, 5).map((r, i) => (
                        <div key={i} className="p-4 border-b last:border-0 flex justify-between items-center">
                            <div>
                                <div className="text-sm font-bold text-slate-900">{r.date}</div>
                                <div className="text-[10px] text-slate-400">{r.putts} Putts</div>
                            </div>
                            <div className="text-xl font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">{r.score}</div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* GPS VIEW */}
        {activeTab === 'gps' && (
            <div className="space-y-6 animate-fadeIn text-center">
                <div className="bg-white p-10 rounded-[40px] border shadow-sm">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-center gap-2"><Locate size={16}/> GPS Rangefinder</h2>
                    <div className="text-8xl font-black text-slate-900 mb-2">{currentDistance}</div>
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">YARDS</div>
                    
                    <select value={selectedClub} onChange={(e)=>setSelectedClub(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-center mb-6 outline-none">
                        {STANDARD_CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {!gpsActive ? 
                        <button onClick={startShot} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-bold shadow-xl">Start Shot</button> :
                        <button onClick={saveShot} className="w-full bg-green-600 text-white py-5 rounded-3xl font-bold animate-pulse">Save & Stop</button>
                    }
                </div>
                {shotHistory.length > 0 && (
                    <div className="bg-white rounded-3xl border text-left overflow-hidden">
                        <div className="p-4 bg-slate-50 font-bold text-xs text-slate-400 uppercase tracking-widest">Shot History</div>
                        {shotHistory.slice(0, 5).map((s, i) => (
                            <div key={i} className="p-4 border-b last:border-0 flex justify-between">
                                <span className="font-bold">{s.club}</span>
                                <span className="font-black text-blue-600">{s.distance}y</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* LIVE SCORECARD */}
        {activeTab === 'live-scorecard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-900 text-white p-8 rounded-[40px]">
                <div><div className="text-xs font-black text-slate-500 uppercase">Hole</div><div className="text-5xl font-black">{currentHole}</div></div>
                <div className="text-right"><div className="text-xs font-black text-slate-500 uppercase">Total</div><div className="text-5xl font-black text-green-500">{liveData.slice(0, currentHole).reduce((a,b)=>a+b.strokes,0)}</div></div>
            </div>
            <div className="bg-white p-10 rounded-[40px] border shadow-sm space-y-10 text-center">
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-6">Strokes</label>
                    <div className="flex justify-center items-center gap-10">
                        <button onClick={()=>updateHole('strokes', Math.max(1, liveData[currentHole-1].strokes - 1))} className="w-16 h-16 rounded-full border-2 text-3xl font-light">-</button>
                        <div className="text-7xl font-black">{liveData[currentHole-1].strokes}</div>
                        <button onClick={()=>updateHole('strokes', liveData[currentHole-1].strokes + 1)} className="w-16 h-16 rounded-full border-2 text-3xl font-light">+</button>
                    </div>
                </div>
                <div className="flex justify-center gap-4">
                     {/* Simplified toggles for cleaner look */}
                     <button onClick={()=>updateHole('putts', Math.max(0, liveData[currentHole-1].putts - 1))} className="p-4 border rounded-xl font-bold"> - Putt</button>
                     <div className="p-4 font-black text-xl">{liveData[currentHole-1].putts} Putts</div>
                     <button onClick={()=>updateHole('putts', liveData[currentHole-1].putts + 1)} className="p-4 border rounded-xl font-bold"> + Putt</button>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={()=>setCurrentHole(Math.max(1, currentHole-1))} className="flex-1 bg-white border py-5 rounded-3xl font-bold text-slate-600">Prev</button>
                {currentHole < 18 ? 
                    <button onClick={()=>setCurrentHole(currentHole+1)} className="flex-[2] bg-slate-900 text-white py-5 rounded-3xl font-bold">Next Hole</button> : 
                    <button onClick={finishRound} className="flex-[2] bg-green-600 text-white py-5 rounded-3xl font-bold">Finish Round</button>
                }
            </div>
          </div>
        )}

        {/* AI HUB / COACH */}
        {activeTab === 'ai-hub' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-3">
                {[{ id: 'trainer', label: 'Daily Trainer', icon: '🏋️' }, { id: 'analyzer', label: 'Swing Studio', icon: '📹' }, { id: 'custom', label: 'Skill Builder', icon: '🎯' }, { id: 'caddie', label: 'Smart Caddie', icon: '⛳' }, { id: 'fix', label: 'Swing 911', icon: '🚑' }].map(tool => (
                    <button key={tool.id} onClick={()=>{setAiTool(tool.id); setAiResponse(null); setCameraActive(false);}} className={`p-4 rounded-3xl border-2 text-left transition-all ${aiTool === tool.id ? 'border-green-500 bg-green-50' : 'bg-white border-slate-100'}`}>
                        <div className="text-2xl mb-1">{tool.icon}</div>
                        <div className="font-black text-[10px] uppercase text-slate-900">{tool.label}</div>
                    </button>
                ))}
            </div>
            <div className="bg-white p-8 rounded-[40px] border shadow-sm min-h-[400px]">
                {aiTool === 'trainer' && <button onClick={()=>callGemini(`Act as a PGA Coach. Create 45-min plan for HCP: ${userProfile.handicap}.`)} disabled={loadingAI} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold">{loadingAI ? "Thinking..." : "Generate Today's Plan"}</button>}
                {aiTool === 'custom' && <div className="space-y-4"><input type="text" placeholder="e.g. Bunker shots" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold" onChange={e=>setCustomPracticeInput(e.target.value)} /><button onClick={()=>callGemini(`Act as PGA Coach. Drills for: ${customPracticeInput}`)} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold">Get Drills</button></div>}
                {aiTool === 'fix' && <div className="space-y-4"><textarea placeholder="e.g. Slicing Driver" className="w-full p-5 bg-red-50 border-none rounded-2xl font-bold min-h-[120px]" onChange={e=>setFixInput(e.target.value)} /><button onClick={()=>callGemini(`Act as PGA Pro. EMERGENCY 911 fix for: ${fixInput}`)} className="w-full bg-red-600 text-white py-5 rounded-2xl font-bold">Fix My Swing</button></div>}
                {aiTool === 'caddie' && <div className="space-y-3"><input type="number" placeholder="Distance (yards)" className="w-full p-3 border rounded-xl" onChange={e=>setCaddieData({...caddieData, distance: e.target.value})} /><button onClick={()=>callGemini(`Act as Tour Caddie. Shot: ${caddieData.distance}y.`)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold">Advice</button></div>}
                {aiTool === 'analyzer' && (!isPro ? <div className="text-center py-10"><Lock className="mx-auto mb-2 text-amber-500"/><button onClick={handleUpgradeToPro} className="bg-amber-400 text-slate-900 px-8 py-3 rounded-full font-bold">Upgrade for AI Vision</button></div> : <div className="relative bg-black rounded-3xl aspect-[3/4] overflow-hidden flex items-center justify-center">{!cameraActive ? <button onClick={startCamera} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-2xl">Start Analysis</button> : <><video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover"/><canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/><div className="absolute top-4 left-4 bg-black/60 p-2 rounded-lg text-white font-bold text-xs">{aiFeedback}</div><button onClick={()=>{setCameraActive(false); stopCamera();}} className="absolute bottom-6 bg-red-600 text-white px-8 py-2 rounded-full font-bold">Stop</button></>}</div>)}
                {aiResponse && <div className="mt-8 pt-8 border-t prose prose-slate"><ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown></div>}
            </div>
          </div>
        )}

        {/* LEAGUES VIEW */}
        {activeTab === 'leagues' && !selectedLeague && (
            <div className="space-y-4 animate-fadeIn">
                <button onClick={()=>setShowLeagueModal(true)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold">Create New League</button>
                {leagues.map(l => (
                    <button key={l.id} onClick={()=>setSelectedLeague(l)} className="w-full bg-white p-5 rounded-2xl border flex justify-between items-center text-left">
                        <div><div className="font-bold">{l.name}</div><div className="text-xs text-slate-400">{l.members} Members • {l.pot}</div></div>
                        <ChevronRight size={18} className="text-slate-300"/>
                    </button>
                ))}
            </div>
        )}

        {activeTab === 'leagues' && selectedLeague && (
            <div className="space-y-4 animate-fadeIn">
                <button onClick={()=>setSelectedLeague(null)} className="flex items-center gap-1 text-xs font-bold text-slate-500"><ChevronLeft size={16}/> Back</button>
                <div className="bg-white p-6 rounded-3xl border">
                    <h2 className="text-2xl font-black">{selectedLeague.name}</h2>
                    <p className="text-sm text-slate-500 mb-6">Pot: {selectedLeague.pot} • Rank: #{selectedLeague.rank}</p>
                    <div className="space-y-2">
                        <div className="flex justify-between p-3 bg-blue-50 rounded-xl font-bold text-sm"><span>You</span><span>{selectedLeague.score}</span></div>
                        <div className="flex justify-between p-3 bg-slate-50 rounded-xl text-sm opacity-50"><span>Player 1</span><span>-4</span></div>
                    </div>
                </div>
            </div>
        )}

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="bg-white p-10 rounded-[40px] border shadow-sm space-y-8">
            <h2 className="font-black text-2xl text-slate-900">Player Profile</h2>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Handicap</label><input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-lg" value={userProfile.handicap} onChange={e=>setUserProfile({...userProfile, handicap: e.target.value})} /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">My Weakness</label><input type="text" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black text-lg" value={userProfile.weaknesses} onChange={e=>setUserProfile({...userProfile, weaknesses: e.target.value})} /></div>
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">My Equipment</label>
                <div className="grid grid-cols-2 gap-2">
                    {EQUIPMENT_OPTIONS.map(item => (
                        <label key={item} className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-bold ${userProfile.equipment?.includes(item) ? 'bg-blue-50 border-blue-400' : 'bg-slate-50'}`}>
                            <input type="checkbox" checked={userProfile.equipment?.includes(item) || false} onChange={(e) => handleEquipmentChange(item, e.target.checked)} className="accent-blue-600"/> {item}
                        </label>
                    ))}
                </div>
            </div>
            <button onClick={() => setActiveTab('dashboard')} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase tracking-widest"><Save size={18} className="inline mr-2"/> Save Profile</button>
          </div>
        )}
      </main>

      {/* LEAGUE MODAL */}
      {showLeagueModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative">
                <button onClick={()=>setShowLeagueModal(false)} className="absolute top-4 right-4"><X/></button>
                <h3 className="text-xl font-bold mb-4">New League</h3>
                <input type="text" placeholder="League Name" className="w-full p-3 border rounded-xl mb-3" onChange={e=>setNewLeague({...newLeague, name:e.target.value})}/>
                <input type="text" placeholder="Buy-in (e.g. $20)" className="w-full p-3 border rounded-xl mb-4" onChange={e=>setNewLeague({...newLeague, pot:e.target.value})}/>
                <button onClick={handleCreateLeague} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Create</button>
            </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgradeToPro} />
    </div>
  );
}
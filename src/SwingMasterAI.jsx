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
      const saved = localStorage.getItem('swingmaster_master_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.rounds) setRounds(parsed.rounds);
        if (parsed.profile) setUserProfile(parsed.profile);
        if (parsed.leagues) setLeagues(parsed.leagues);
      }
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    localStorage.setItem('swingmaster_master_v4', JSON.stringify({ rounds, profile: userProfile, leagues }));
  }, [rounds, userProfile, leagues]);

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

  // --- LOGIC FUNCTIONS ---
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

  // --- CAMERA ANALYSIS ---
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
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">SwingMaster <span className="text-green-500">Pro</span></h1>
          <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 py-1 rounded-full uppercase">{isPro ? 'PRO' : 'FREE'}</span>
        </div>
        <nav className="flex justify-around text-[10px] font-bold uppercase tracking-tighter text-slate-400">
          <button onClick={() => {setActiveTab('dashboard'); setSelectedLeague(null);}} className={activeTab === 'dashboard' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Stats</button>
          <button onClick={() => {setActiveTab('leagues'); setSelectedLeague(null);}} className={activeTab === 'leagues' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Leagues</button>
          <button onClick={() => {setActiveTab('live-scorecard'); setSelectedLeague(null);}} className={activeTab === 'live-scorecard' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Play</button>
          <button onClick={() => {setActiveTab('ai-hub'); setSelectedLeague(null);}} className={activeTab === 'ai-hub' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Coach</button>
          <button onClick={() => {setActiveTab('profile'); setSelectedLeague(null);}} className={activeTab === 'profile' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Profile</button>
        </nav>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* STATS VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <button onClick={startNewRound} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg flex justify-center items-center gap-2"><Plus/> Start Round</button>
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border text-center">
                    <div className="text-slate-400 text-[10px] font-bold uppercase">Avg Score</div>
                    <div className="text-3xl font-black">{(rounds.reduce((a,b)=>a+b.score,0)/(rounds.length||1)).toFixed(1)}</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border text-center">
                    <div className="text-slate-400 text-[10px] font-bold uppercase">Avg Putts</div>
                    <div className="text-3xl font-black">{(rounds.reduce((a,b)=>a+b.putts,0)/(rounds.length||1)).toFixed(1)}</div>
                </div>
            </div>
          </div>
        )}

        {/* LIVE SCORECARD */}
        {activeTab === 'live-scorecard' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-3xl">
                <div><div className="text-xs font-bold text-slate-500 uppercase">Hole</div><div className="text-4xl font-black">{currentHole}</div></div>
                <div className="text-right"><div className="text-xs font-bold text-slate-500 uppercase">Total</div><div className="text-4xl font-black text-green-400">{liveData.slice(0, currentHole).reduce((a,b)=>a+b.strokes,0)}</div></div>
            </div>
            <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-8 text-center">
                <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-4">Total Strokes</label>
                    <div className="flex justify-center items-center gap-8">
                        <button onClick={()=>updateHole('strokes', Math.max(1, liveData[currentHole-1].strokes - 1))} className="w-14 h-14 rounded-full border-2 text-2xl font-bold">-</button>
                        <div className="text-6xl font-black">{liveData[currentHole-1].strokes}</div>
                        <button onClick={()=>updateHole('strokes', liveData[currentHole-1].strokes + 1)} className="w-14 h-14 rounded-full border-2 text-2xl font-bold">+</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={()=>updateHole('fairway', liveData[currentHole-1].fairway==='hit'?'miss':'hit')} className={`p-4 rounded-2xl border font-bold ${liveData[currentHole-1].fairway==='hit'?'bg-green-50 border-green-500 text-green-700':'bg-slate-50'}`}>Fairway</button>
                    <button onClick={()=>updateHole('gir', !liveData[currentHole-1].gir)} className={`p-4 rounded-2xl border font-bold ${liveData[currentHole-1].gir?'bg-green-50 border-green-500 text-green-700':'bg-slate-50'}`}>Green (GIR)</button>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={()=>setCurrentHole(Math.max(1, currentHole-1))} className="flex-1 bg-slate-200 py-4 rounded-2xl font-bold">Prev</button>
                {currentHole < 18 ? <button onClick={()=>setCurrentHole(currentHole+1)} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-bold">Next Hole</button> : <button onClick={finishRound} className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold">Finish Round</button>}
            </div>
          </div>
        )}

        {/* AI HUB / COACH */}
        {activeTab === 'ai-hub' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {[{ id: 'trainer', label: 'Daily Trainer', icon: '🏋️' }, { id: 'analyzer', label: 'Swing Studio', icon: '📹' }, { id: 'custom', label: 'Skill Builder', icon: '🎯' }, { id: 'caddie', label: 'Smart Caddie', icon: '⛳' }, { id: 'fix', label: 'Swing 911', icon: '🚑' }].map(tool => (
                    <button key={tool.id} onClick={()=>{setAiTool(tool.id); setAiResponse(null); setCameraActive(false);}} className={`p-4 rounded-2xl border-2 text-left transition-all ${aiTool === tool.id ? 'border-green-500 bg-green-50' : 'bg-white border-slate-100'}`}>
                        <div className="text-2xl mb-1">{tool.icon}</div>
                        <div className="font-bold text-xs">{tool.label}</div>
                    </button>
                ))}
            </div>
            <div className="bg-white p-6 rounded-3xl border shadow-sm min-h-[300px]">
                {aiTool === 'trainer' && <button onClick={()=>callGemini(`Act as a PGA Coach. Create 45-min plan based on HCP: ${userProfile.handicap}. Weakness: ${userProfile.weaknesses}.`)} disabled={loadingAI} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">{loadingAI ? "Thinking..." : "Generate Plan"}</button>}
                {aiTool === 'custom' && <div className="space-y-4"><input type="text" placeholder="e.g. Bunker shots" className="w-full p-4 bg-slate-50 border rounded-2xl" onChange={e=>setCustomPracticeInput(e.target.value)} /><button onClick={()=>callGemini(`Act as PGA Coach. Focus on: ${customPracticeInput}`)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold">Get Drills</button></div>}
                {aiTool === 'fix' && <div className="space-y-4"><textarea placeholder="What's wrong?" className="w-full p-4 bg-red-50 border rounded-2xl" onChange={e=>setFixInput(e.target.value)} /><button onClick={()=>callGemini(`Act as PGA Pro. EMERGENCY 911 fix for: ${fixInput}`)} className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold">Fix My Swing</button></div>}
                {aiTool === 'caddie' && <div className="space-y-3"><input type="number" placeholder="Yards" className="w-full p-3 border rounded-xl" onChange={e=>setCaddieData({...caddieData, distance: e.target.value})} /><button onClick={()=>callGemini(`Act as Tour Caddie. Shot: ${caddieData.distance}y.`)} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold">Advice</button></div>}
                {aiTool === 'analyzer' && (!isPro ? <div className="text-center py-10"><Lock className="mx-auto mb-2 text-amber-500"/><button onClick={handleUpgradeToPro} className="bg-amber-400 px-6 py-2 rounded-full font-bold">Unlock AI Vision</button></div> : <div className="relative bg-black rounded-2xl aspect-[3/4] overflow-hidden flex items-center justify-center">{!cameraActive ? <button onClick={startCamera} className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold">Start AI Analysis</button> : <><video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover"/><canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/><div className="absolute top-4 left-4 bg-black/60 p-2 rounded-lg text-white font-bold text-xs">{aiFeedback}</div><button onClick={()=>{setCameraActive(false); stopCamera();}} className="absolute bottom-4 bg-red-600 text-white px-6 py-2 rounded-full font-bold">Stop</button></>}</div>)}
                {aiResponse && <div className="mt-6 pt-6 border-t prose prose-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown></div>}
            </div>
          </div>
        )}

        {/* LEAGUES VIEW */}
        {activeTab === 'leagues' && !selectedLeague && (
            <div className="space-y-4">
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
            <div className="space-y-4">
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
          <div className="bg-white p-8 rounded-3xl border shadow-sm space-y-6">
            <h2 className="font-bold text-xl">Profile & Setup</h2>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">Handicap</label><input type="text" className="w-full p-3 border rounded-xl mt-1" value={userProfile.handicap} onChange={e=>setUserProfile({...userProfile, handicap: e.target.value})} /></div>
            <div><label className="text-[10px] font-black text-slate-400 uppercase">My Miss / Focus</label><input type="text" className="w-full p-3 border rounded-xl mt-1" value={userProfile.weaknesses} onChange={e=>setUserProfile({...userProfile, weaknesses: e.target.value})} /></div>
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">My Equipment</label>
                <div className="grid grid-cols-2 gap-2">
                    {EQUIPMENT_OPTIONS.map(item => (
                        <label key={item} className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-bold ${userProfile.equipment?.includes(item) ? 'bg-blue-50 border-blue-400' : 'bg-slate-50'}`}>
                            <input type="checkbox" checked={userProfile.equipment?.includes(item) || false} onChange={(e) => handleEquipmentChange(item, e.target.checked)} className="accent-blue-600"/> {item}
                        </label>
                    ))}
                </div>
            </div>
            <button onClick={() => setActiveTab('dashboard')} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold"><Save size={18} className="inline mr-2"/> Save Settings</button>
          </div>
        )}
      </main>

      {/* LEAGUE MODAL */}
      {showLeagueModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-3xl w-full max-w-sm relative">
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
// src/SwingMasterAI.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Sparkles, Plus, TrendingUp, Trophy, Calendar, Target, User, Save, 
  Navigation, Zap, Lock, CreditCard, Locate, Stethoscope, Dumbbell, Video, 
  Users, BarChart3, ChevronRight, ChevronLeft, Camera, X, Activity, CheckCircle2, ChevronDown, Play
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UpgradeModal from './UpgradeModal'; 
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00"; 
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const EQUIPMENT_OPTIONS = ['Driving Range', 'Golf Net', 'Hitting Mat', 'Simulator', 'Alignment Stick', 'Full Bag'];
const STANDARD_CLUBS = ['Driver', '3 Wood', '5 Wood', 'Hybrid', '3 Iron', '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge'];

// --- LANDING PAGE COMPONENT ---
function LandingPage({ onEnterApp }) {
  return (
    <div className="bg-[#0B0F14] min-h-screen text-[#F9FAFB] font-sans selection:bg-[#8CFB5B] selection:text-black">
      {/* NAV */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="text-xl font-black tracking-tighter">SwingMaster<span className="text-[#8CFB5B]">.</span></div>
        <button onClick={onEnterApp} className="text-sm font-bold text-[#9CA3AF] hover:text-white transition-colors">Sign In</button>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-32 flex flex-col md:flex-row items-center gap-16">
        <div className="md:w-1/2 space-y-8">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1]">
                Fix Your Golf Swing With <span className="text-[#8CFB5B]">AI.</span>
            </h1>
            <p className="text-xl text-[#9CA3AF] leading-relaxed max-w-lg">
                Upload one swing video and get instant feedback on posture, tempo, rotation, and swing path. Build a swing you can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={onEnterApp} className="bg-[#8CFB5B] text-[#0B0F14] px-8 py-4 rounded-full font-black uppercase tracking-widest text-sm hover:shadow-[0_0_30px_rgba(140,251,91,0.3)] transition-all">
                    Analyze My Swing
                </button>
                <button className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                    <Play size={16}/> Watch Demo
                </button>
            </div>
        </div>
        
        {/* HERO VISUAL MOCKUP */}
        <div className="md:w-1/2 w-full relative">
            <div className="absolute inset-0 bg-[#8CFB5B] blur-[120px] opacity-10 rounded-full"></div>
            <div className="bg-[#111827] border border-white/10 rounded-[32px] p-2 relative overflow-hidden shadow-2xl">
                <div className="bg-[#0B0F14] rounded-[24px] aspect-[4/5] relative overflow-hidden border border-white/5 flex items-center justify-center">
                    {/* Simulated Body Tracking Overlay */}
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1535139262971-c5184570f817?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-40 grayscale"></div>
                    <div className="absolute top-0 bottom-0 left-1/2 w-[2px] bg-[#8CFB5B]/30 -translate-x-1/2"></div>
                    <div className="z-10 flex flex-col items-center gap-4 w-full px-6">
                        <div className="w-full bg-[#111827]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex justify-between items-center">
                            <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Early Extension</span>
                            <span className="text-[#8CFB5B] font-black">84% SEVERITY</span>
                        </div>
                        <div className="w-full bg-[#111827]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex justify-between items-center">
                            <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">Swing Path</span>
                            <span className="text-white font-black">OUT-TO-IN</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-y border-white/5 bg-[#111827]/50 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-around items-center gap-8 text-[#9CA3AF] text-xs md:text-sm font-bold uppercase tracking-widest text-center">
            <div><span className="text-[#8CFB5B]">✓</span> Built for Golfers</div>
            <div className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></div>
            <div><span className="text-[#8CFB5B]">✓</span> AI-Powered Diagnostics</div>
            <div className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></div>
            <div><span className="text-[#8CFB5B]">✓</span> Trusted by Competitive Amateurs</div>
            <div className="w-1 h-1 bg-white/20 rounded-full hidden md:block"></div>
            <div className="text-white">10,000+ Swings Analyzed</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 py-32 space-y-16">
        <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black">Precision Improvement.</h2>
            <p className="text-[#9CA3AF] max-w-2xl mx-auto">A seamless workflow designed to eliminate guesswork and lower your handicap.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
            {[
                { step: '01', title: 'Upload', desc: 'Record your swing in seconds. No extra hardware required.', icon: Camera },
                { step: '02', title: 'Analyze', desc: 'AI tracks body mechanics, head sway, and club path instantly.', icon: Activity },
                { step: '03', title: 'Improve', desc: 'Get customized drills and instant mechanical corrections.', icon: TrendingUp }
            ].map(card => (
                <div key={card.step} className="bg-[#111827] border border-white/5 p-8 rounded-[32px] hover:-translate-y-2 transition-transform duration-300">
                    <card.icon size={32} className="text-[#8CFB5B] mb-6"/>
                    <div className="text-[#9CA3AF] text-xs font-black uppercase tracking-widest mb-2">Step {card.step}</div>
                    <h3 className="text-2xl font-black mb-3">{card.title}</h3>
                    <p className="text-[#9CA3AF] leading-relaxed">{card.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-4xl mx-auto px-6 py-20 border-t border-white/5 text-center space-y-10">
        <div className="inline-flex items-center gap-2 bg-[#111827] border border-white/5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
            <Trophy size={14} className="text-[#8CFB5B]"/> Results
        </div>
        <h2 className="text-3xl md:text-4xl font-black italic">"I fixed my slice in two range sessions. The head-sway detection is like having a pro standing right next to me."</h2>
        <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 bg-slate-800 rounded-full border border-white/10 flex items-center justify-center font-black text-xl text-[#8CFB5B]">M</div>
            <div className="text-left">
                <div className="font-bold">Mark T.</div>
                <div className="text-[#9CA3AF] text-xs uppercase tracking-widest">12 Handicap</div>
            </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="max-w-lg mx-auto px-6 py-32">
        <div className="bg-[#111827] border border-white/10 p-10 rounded-[40px] text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#8CFB5B]"></div>
            <h2 className="text-3xl font-black">Pro Membership</h2>
            <div className="flex justify-center items-end gap-1">
                <span className="text-6xl font-black tracking-tighter">$19</span>
                <span className="text-[#9CA3AF] font-bold mb-2">/mo</span>
            </div>
            <ul className="text-left space-y-4 text-sm font-medium text-[#9CA3AF] mx-auto max-w-xs">
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#8CFB5B]"/> Unlimited AI Video Analysis</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#8CFB5B]"/> Custom Drill Generation</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#8CFB5B]"/> Advanced 18-Hole Analytics</li>
                <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-[#8CFB5B]"/> Bag Mapping & GPS</li>
            </ul>
            <button onClick={onEnterApp} className="w-full bg-[#8CFB5B] text-[#0B0F14] py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-white transition-colors">
                Start Improving Now
            </button>
        </div>
      </section>
    </div>
  );
}

// --- MAIN APPLICATION COMPONENT ---
export default function SwingMasterAI({ isPro }) {
  const [appStarted, setAppStarted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
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
      const saved = localStorage.getItem('swingmaster_master_v10');
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
    if(appStarted) {
        localStorage.setItem('swingmaster_master_v10', JSON.stringify({ rounds, profile: userProfile, leagues, shots: shotHistory }));
    }
  }, [rounds, userProfile, leagues, shotHistory, appStarted]);

  // --- AI VISION INIT ---
  useEffect(() => {
    async function initAI() {
      if(!appStarted) return;
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
  }, [appStarted]);

  // --- LOGIC FUNCTIONS ---
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
    const totalPutts = liveData.reduce((acc, h) => acc + h.putts, 0);
    const totalGIR = liveData.filter(h => h.gir).length;
    const totalFairways = liveData.filter(h => h.fairway === 'hit').length;

    const summary = { 
        id: Date.now(), 
        date: new Date().toLocaleDateString(), 
        score: totalStrokes, 
        putts: totalPutts,
        gir: totalGIR,
        fairways: totalFairways
    };
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
      // Changed overlay color to the elite #8CFB5B
      new DrawingUtils(ctx).drawConnectors(landmark, PoseLandmarker.POSE_CONNECTIONS, { color: "#8CFB5B", lineWidth: 2 });
      const nose = landmark[0];
      if (baselineHeadX.current === null) baselineHeadX.current = nose.x;
      else {
          const sway = nose.x - baselineHeadX.current;
          setAiFeedback(Math.abs(sway) > 0.06 ? "⚠️ SWAY DETECTED" : "STABLE CENTER");
      }
    }
    requestRef.current = requestAnimationFrame(predictWebcam);
  };

  // --- ROUTING LOGIC ---
  if (!appStarted) {
      return <LandingPage onEnterApp={() => setAppStarted(true)} />;
  }

  // --- MAIN APP RENDER (DARK/PREMIUM VIBE) ---
  return (
    <div className="bg-[#0B0F14] min-h-screen pb-24 font-sans text-[#F9FAFB] selection:bg-[#8CFB5B] selection:text-black">
      <header className="bg-[#0B0F14] border-b border-white/5 sticky top-0 z-50">
        <div className="px-6 py-4 flex justify-between items-center max-w-lg mx-auto">
            <h1 className="text-xl font-black tracking-tight">SwingMaster<span className="text-[#8CFB5B]">.</span></h1>
            <span className="text-[9px] font-black bg-[#8CFB5B]/10 border border-[#8CFB5B]/30 text-[#8CFB5B] px-2 py-1 rounded-sm uppercase tracking-widest">{isPro ? 'PRO' : 'FREE'}</span>
        </div>
        <div className="flex justify-around bg-[#0B0F14] p-2 border-t border-white/5 max-w-lg mx-auto">
            {[
              { id: 'dashboard', icon: Trophy, label: 'Stats' },
              { id: 'leagues', icon: Users, label: 'Leagues' }, 
              { id: 'live-scorecard', icon: Calendar, label: 'Play' },
              { id: 'gps', icon: Navigation, label: 'GPS' },
              { id: 'ai-hub', icon: Stethoscope, label: 'Coach' },
              { id: 'profile', icon: User, label: 'Profile' },
            ].map(tab => (
              <button key={tab.id} onClick={() => {setActiveTab(tab.id); setSelectedLeague(null);}} 
                className={`flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-widest px-3 py-2 transition-all rounded-lg ${activeTab.includes(tab.id) ? 'text-[#8CFB5B] bg-white/5' : 'text-[#9CA3AF] hover:text-white'}`}>
                <tab.icon size={18} className="mb-0.5" /> {tab.label}
              </button>
            ))}
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        
        {/* STATS VIEW */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-fadeIn">
            <button onClick={startNewRound} className="w-full bg-[#8CFB5B] text-[#0B0F14] py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex justify-center items-center gap-2 hover:bg-[#7AE04F] transition-all">
                <Plus size={18}/> Start New Round
            </button>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl text-center">
                    <div className="text-[#9CA3AF] text-[10px] font-black uppercase mb-1 tracking-widest">Avg Score</div>
                    <div className="text-4xl font-black">{ rounds.length > 0 ? (rounds.reduce((a,b)=>a+b.score,0)/rounds.length).toFixed(1) : '-' }</div>
                </div>
                <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl text-center">
                    <div className="text-[#9CA3AF] text-[10px] font-black uppercase mb-1 tracking-widest">Avg Putts</div>
                    <div className="text-4xl font-black">{ rounds.length > 0 ? (rounds.reduce((a,b)=>a+b.putts,0)/rounds.length).toFixed(1) : '-' }</div>
                </div>
            </div>

            <div className="bg-[#111827] border border-white/5 p-6 rounded-2xl">
                <h3 className="font-bold text-white mb-6 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <TrendingUp size={16} className="text-[#8CFB5B]"/> Scoring Trends
                </h3>
                {rounds.length > 0 ? (
                    <div className="flex items-end justify-between h-32 gap-3">
                        {rounds.slice(0, 5).reverse().map((r, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end items-center group">
                                <div className="text-[10px] font-bold text-white mb-2">{r.score}</div>
                                <div 
                                    className="w-full bg-white/10 rounded-t-sm group-hover:bg-[#8CFB5B] transition-colors" 
                                    style={{height: `${Math.min(100, (r.score / 120) * 100)}%`}}
                                ></div>
                                <div className="text-[9px] font-bold text-[#9CA3AF] mt-3">{r.date.split('/')[0]}/{r.date.split('/')[1]}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-[#9CA3AF] text-xs">Play rounds to unlock performance data.</div>
                )}
            </div>

            {rounds.length > 0 && (
                <div className="bg-[#111827] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-white/5 border-b border-white/5 font-black text-[10px] text-[#9CA3AF] uppercase tracking-widest">Round History</div>
                    {rounds.slice(0, 5).map((r, i) => (
                        <div key={i} className="p-5 border-b border-white/5 last:border-0 flex justify-between items-center">
                            <div>
                                <div className="text-sm font-bold text-white mb-1">{r.date}</div>
                                <div className="text-[10px] text-[#9CA3AF] uppercase tracking-widest">{r.putts} Putts • {r.fairways} Fairways</div>
                            </div>
                            <div className="text-xl font-black text-white">{r.score}</div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        )}

        {/* GPS VIEW */}
        {activeTab === 'gps' && (
            <div className="space-y-6 animate-fadeIn text-center">
                <div className="bg-[#111827] border border-white/5 p-10 rounded-2xl">
                    <h2 className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-6 flex justify-center gap-2 items-center"><Locate size={14}/> GPS Rangefinder</h2>
                    <div className="text-8xl font-black text-white tracking-tighter mb-2">{currentDistance}</div>
                    <div className="text-[10px] font-black text-[#8CFB5B] uppercase tracking-widest mb-8">Yards to Target</div>
                    
                    <select value={selectedClub} onChange={(e)=>setSelectedClub(e.target.value)} className="w-full p-4 bg-[#0B0F14] border border-white/10 text-white rounded-xl font-bold text-center mb-6 outline-none focus:border-[#8CFB5B]">
                        {STANDARD_CLUBS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {!gpsActive ? 
                        <button onClick={startShot} className="w-full bg-[#8CFB5B] text-[#0B0F14] py-5 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-[#7AE04F] transition-colors">Track New Shot</button> : 
                        <button onClick={saveShot} className="w-full bg-white text-black py-5 rounded-xl font-black uppercase tracking-widest text-sm animate-pulse">Save Distance</button>
                    }
                </div>
                {shotHistory.length > 0 && (
                    <div className="bg-[#111827] border border-white/5 rounded-2xl text-left overflow-hidden">
                        <div className="p-4 bg-white/5 border-b border-white/5 font-black text-[10px] text-[#9CA3AF] uppercase tracking-widest">Saved Distances</div>
                        {shotHistory.slice(0, 5).map((s, i) => (
                            <div key={i} className="p-5 border-b border-white/5 last:border-0 flex justify-between items-center">
                                <span className="font-bold text-sm">{s.club}</span>
                                <span className="font-black text-[#8CFB5B] text-lg">{s.distance}y</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* LIVE SCORECARD */}
        {activeTab === 'live-scorecard' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center bg-[#111827] border border-white/5 p-6 rounded-2xl">
                <div><div className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Hole</div><div className="text-4xl font-black">{currentHole}</div></div>
                <div className="text-right"><div className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-1">Total Score</div><div className="text-4xl font-black text-[#8CFB5B]">{liveData.slice(0, currentHole).reduce((a,b)=>a+b.strokes,0)}</div></div>
            </div>
            
            <div className="bg-[#111827] border border-white/5 p-8 rounded-2xl space-y-10 text-center">
                <div>
                    <label className="text-[10px] font-black uppercase text-[#9CA3AF] tracking-widest block mb-6">Total Strokes</label>
                    <div className="flex justify-center items-center gap-8">
                        <button onClick={()=>updateHole('strokes', Math.max(1, liveData[currentHole-1].strokes - 1))} className="w-16 h-16 rounded-full border border-white/10 text-3xl font-light hover:bg-white/5">-</button>
                        <div className="text-7xl font-black tabular-nums">{liveData[currentHole-1].strokes}</div>
                        <button onClick={()=>updateHole('strokes', liveData[currentHole-1].strokes + 1)} className="w-16 h-16 rounded-full border border-white/10 text-3xl font-light hover:bg-white/5">+</button>
                    </div>
                </div>
                
                <div>
                    <label className="text-[10px] font-black uppercase text-[#9CA3AF] tracking-widest block mb-4">Putts</label>
                    <div className="flex justify-center gap-3">
                        <button onClick={()=>updateHole('putts', Math.max(0, liveData[currentHole-1].putts - 1))} className="w-12 h-12 border border-white/10 rounded-xl font-bold hover:bg-white/5">-</button>
                        <div className="w-16 h-12 flex items-center justify-center font-black text-2xl tabular-nums">{liveData[currentHole-1].putts}</div>
                        <button onClick={()=>updateHole('putts', liveData[currentHole-1].putts + 1)} className="w-12 h-12 border border-white/10 rounded-xl font-bold hover:bg-white/5">+</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <button onClick={()=>updateHole('fairway', liveData[currentHole-1].fairway==='hit'?'miss':'hit')} className={`p-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${liveData[currentHole-1].fairway==='hit'?'bg-[#8CFB5B] border-[#8CFB5B] text-black':'bg-[#0B0F14] border-white/10 text-[#9CA3AF]'}`}>Fairway Hit</button>
                    <button onClick={()=>updateHole('gir', !liveData[currentHole-1].gir)} className={`p-4 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${liveData[currentHole-1].gir?'bg-[#8CFB5B] border-[#8CFB5B] text-black':'bg-[#0B0F14] border-white/10 text-[#9CA3AF]'}`}>Green In Reg</button>
                </div>
            </div>
            
            <div className="flex gap-3">
                <button onClick={()=>setCurrentHole(Math.max(1, currentHole-1))} className="flex-1 bg-[#111827] border border-white/10 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-[#9CA3AF] hover:text-white">Prev</button>
                {currentHole < 18 ? 
                    <button onClick={()=>setCurrentHole(currentHole+1)} className="flex-[2] bg-white text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest">Next Hole</button> : 
                    <button onClick={finishRound} className="flex-[2] bg-[#8CFB5B] text-black py-4 rounded-xl font-black text-xs uppercase tracking-widest">Save Round</button>
                }
            </div>
          </div>
        )}

        {/* AI HUB / COACH */}
        {activeTab === 'ai-hub' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-3">
                {[{ id: 'trainer', label: 'Daily Trainer', icon: '🏋️' }, { id: 'analyzer', label: 'Swing Studio', icon: '📹' }, { id: 'custom', label: 'Skill Builder', icon: '🎯' }, { id: 'caddie', label: 'Smart Caddie', icon: '⛳' }, { id: 'fix', label: 'Swing 911', icon: '🚑' }].map(tool => (
                    <button key={tool.id} onClick={()=>{setAiTool(tool.id); setAiResponse(null); setCameraActive(false);}} className={`p-5 rounded-2xl border text-left transition-all flex flex-col items-start ${aiTool === tool.id ? 'bg-[#8CFB5B]/10 border-[#8CFB5B]' : 'bg-[#111827] border-white/5 hover:border-white/20'}`}>
                        <div className="text-xl mb-3 grayscale opacity-80">{tool.icon}</div>
                        <div className={`font-black text-[10px] uppercase tracking-widest ${aiTool === tool.id ? 'text-[#8CFB5B]' : 'text-white'}`}>{tool.label}</div>
                    </button>
                ))}
            </div>
            
            <div className="bg-[#111827] border border-white/5 p-6 md:p-8 rounded-2xl min-h-[400px]">
                
                {/* DAILY TRAINER */}
                {aiTool === 'trainer' && (
                    <div className="space-y-6">
                        <h3 className="font-black text-xl">Daily Practice Plan</h3>
                        <p className="text-sm text-[#9CA3AF] leading-relaxed">Generate a bespoke 45-minute routine based on your handicap and equipment.</p>
                        <button 
                            onClick={()=>callGemini(`Act as a PGA Coach. Create 45-min plan for HCP: ${userProfile.handicap}. Weakness: "${userProfile.weaknesses}". Include YouTube search links for 3 specific drills.`)} 
                            disabled={loadingAI} 
                            className="w-full bg-[#8CFB5B] text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#7AE04F] transition-colors"
                        >
                            {loadingAI ? "Analyzing Data..." : "Generate Routine"}
                        </button>
                    </div>
                )}
                
                {/* SKILL BUILDER */}
                {aiTool === 'custom' && (
                    <div className="space-y-6">
                        <h3 className="font-black text-xl">Skill Builder</h3>
                        <input type="text" placeholder="Target area (e.g. Lag putting)" className="w-full p-4 bg-[#0B0F14] border border-white/10 text-white rounded-xl font-medium focus:border-[#8CFB5B] outline-none" onChange={e=>setCustomPracticeInput(e.target.value)} />
                        <button 
                            onClick={()=>callGemini(`Act as PGA Coach. Provide 3 specific drills for: "${customPracticeInput}". Include YouTube search links for each drill.`)} 
                            disabled={loadingAI}
                            className="w-full bg-[#8CFB5B] text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#7AE04F] transition-colors"
                        >
                            {loadingAI ? "Loading Drills..." : "Retrieve Drills"}
                        </button>
                    </div>
                )}
                
                {/* SWING 911 */}
                {aiTool === 'fix' && (
                    <div className="space-y-6">
                        <h3 className="font-black text-xl text-white">Emergency Fix</h3>
                        <textarea placeholder="Describe your miss (e.g. Hooking long irons)" className="w-full p-4 bg-[#0B0F14] border border-white/10 text-white rounded-xl font-medium min-h-[120px] focus:border-red-500 outline-none" onChange={e=>setFixInput(e.target.value)} />
                        <button 
                            onClick={()=>callGemini(`Act as PGA Pro. EMERGENCY 911 fix for: "${fixInput}". Provide 1 cause, 2 setup fixes, and 1 drill with a YouTube search link.`)} 
                            disabled={loadingAI}
                            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                        >
                            {loadingAI ? "Diagnosing Issue..." : "Diagnose Swing"}
                        </button>
                    </div>
                )}

                {/* CADDIE */}
                {aiTool === 'caddie' && (
                    <div className="space-y-6">
                        <h3 className="font-black text-xl">Smart Caddie</h3>
                        <input type="number" placeholder="Distance to target (Yards)" className="w-full p-4 bg-[#0B0F14] border border-white/10 text-white rounded-xl font-medium focus:border-[#8CFB5B] outline-none" onChange={e=>setCaddieData({...caddieData, distance: e.target.value})} />
                        <button onClick={()=>callGemini(`Act as Tour Caddie. Shot: ${caddieData.distance}y.`)} className="w-full bg-[#8CFB5B] text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#7AE04F]">Get Club Recommendation</button>
                    </div>
                )}
                
                {/* ANALYZER */}
                {aiTool === 'analyzer' && (!isPro ? (
                    <div className="text-center py-12 space-y-4 border border-white/5 rounded-2xl bg-[#0B0F14]">
                        <Lock className="mx-auto text-[#9CA3AF] mb-4" size={32}/>
                        <div className="font-black text-lg">Pro Access Required</div>
                        <p className="text-xs text-[#9CA3AF] max-w-xs mx-auto pb-4">Unlock the AI Vision Engine to track biomechanics in real-time.</p>
                        <button onClick={handleUpgradeToPro} className="bg-[#8CFB5B] text-black px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs">Unlock Pro Feature</button>
                    </div>
                ) : (
                    <div className="relative bg-[#0B0F14] rounded-2xl aspect-[3/4] overflow-hidden flex items-center justify-center border border-white/5">
                        {!cameraActive ? <button onClick={startCamera} className="bg-[#8CFB5B] text-black px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs">Activate Camera</button> : 
                        <><video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover"/><canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/>
                        <div className="absolute top-4 left-4 bg-black/80 backdrop-blur border border-white/10 p-3 rounded-xl text-white font-black text-[10px] tracking-widest uppercase flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#8CFB5B] animate-pulse"/> {aiFeedback}
                        </div>
                        <button onClick={()=>{setCameraActive(false); stopCamera();}} className="absolute bottom-6 bg-white text-black px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs">End Tracking</button></>}
                    </div>
                ))}
                
                {/* RESPONSE RENDERER */}
                {aiResponse && (
                    <div className="mt-8 pt-8 border-t border-white/10">
                        <div className="prose prose-invert prose-sm max-w-none text-[#9CA3AF] leading-relaxed marker:text-[#8CFB5B]">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}

        {/* LEAGUES VIEW */}
        {activeTab === 'leagues' && !selectedLeague && (
            <div className="space-y-4 animate-fadeIn">
                <button onClick={()=>setShowLeagueModal(true)} className="w-full bg-[#8CFB5B] text-black py-4 rounded-2xl font-black uppercase tracking-widest text-xs">Create Private League</button>
                <div className="space-y-3">
                    {leagues.map(l => (
                        <button key={l.id} onClick={()=>setSelectedLeague(l)} className="w-full bg-[#111827] border border-white/5 p-6 rounded-2xl flex justify-between items-center text-left hover:border-[#8CFB5B]/50 transition-colors">
                            <div><div className="font-bold text-white mb-1">{l.name}</div><div className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">{l.members} Players • {l.pot}</div></div>
                            <ChevronRight size={18} className="text-[#9CA3AF]"/>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'leagues' && selectedLeague && (
            <div className="space-y-4 animate-fadeIn">
                <button onClick={()=>setSelectedLeague(null)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#9CA3AF] hover:text-white"><ChevronLeft size={16}/> Back</button>
                <div className="bg-[#111827] border border-white/5 p-8 rounded-2xl">
                    <h2 className="text-2xl font-black mb-1">{selectedLeague.name}</h2>
                    <p className="text-[10px] font-bold text-[#8CFB5B] uppercase tracking-widest mb-8">Prize Pool: {selectedLeague.pot}</p>
                    <div className="space-y-3">
                        <div className="flex justify-between p-4 bg-white/5 border border-white/10 rounded-xl font-black text-sm"><span>YOU (Rank #{selectedLeague.rank})</span><span className="text-[#8CFB5B]">{selectedLeague.score}</span></div>
                        <div className="flex justify-between p-4 bg-[#0B0F14] border border-white/5 rounded-xl text-sm font-bold text-[#9CA3AF]"><span>Global Leader</span><span>-12</span></div>
                    </div>
                </div>
            </div>
        )}

        {/* PROFILE VIEW */}
        {activeTab === 'profile' && (
          <div className="bg-[#111827] border border-white/5 p-8 rounded-2xl space-y-8 animate-fadeIn">
            <h2 className="font-black text-xl border-b border-white/5 pb-4">Diagnostics Profile</h2>
            
            <div>
                <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest block mb-3">Current Handicap</label>
                <input type="text" className="w-full p-4 bg-[#0B0F14] border border-white/10 text-white rounded-xl font-black text-lg focus:border-[#8CFB5B] outline-none" value={userProfile.handicap} onChange={e=>setUserProfile({...userProfile, handicap: e.target.value})} />
            </div>
            
            <div>
                <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest block mb-3">Primary Mechanical Flaw</label>
                <input type="text" className="w-full p-4 bg-[#0B0F14] border border-white/10 text-white rounded-xl font-bold focus:border-[#8CFB5B] outline-none" value={userProfile.weaknesses} placeholder="e.g. Outside-in swing path" onChange={e=>setUserProfile({...userProfile, weaknesses: e.target.value})} />
            </div>
            
            <div>
                <label className="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest mb-4 block">Hardware Availability</label>
                <div className="grid grid-cols-2 gap-3">
                    {EQUIPMENT_OPTIONS.map(item => (
                        <label key={item} className={`flex items-center gap-2 p-4 rounded-xl border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all ${userProfile.equipment?.includes(item) ? 'bg-[#8CFB5B]/10 border-[#8CFB5B]/30 text-[#8CFB5B]' : 'bg-[#0B0F14] border-white/5 text-[#9CA3AF]'}`}>
                            <input type="checkbox" className="hidden" checked={userProfile.equipment?.includes(item) || false} onChange={(e) => handleEquipmentChange(item, e.target.checked)}/> {item}
                        </label>
                    ))}
                </div>
            </div>
            <button onClick={() => setActiveTab('dashboard')} className="w-full bg-[#8CFB5B] text-[#0B0F14] py-5 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#7AE04F]"><Save size={16} className="inline mr-2 mb-0.5"/> Save Configuration</button>
          </div>
        )}
      </main>

      {/* LEAGUE MODAL */}
      {showLeagueModal && (
        <div className="fixed inset-0 bg-[#0B0F14]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827] border border-white/10 rounded-3xl w-full max-w-sm p-8 relative shadow-2xl">
                <button onClick={()=>setShowLeagueModal(false)} className="absolute top-6 right-6 text-[#9CA3AF] hover:text-white"><X size={20}/></button>
                <h3 className="text-2xl font-black mb-6">Initialize League</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="League Title" className="w-full p-4 bg-[#0B0F14] border border-white/10 rounded-xl font-bold text-white outline-none focus:border-[#8CFB5B]" onChange={e=>setNewLeague({...newLeague, name:e.target.value})}/>
                    <input type="text" placeholder="Prize Pool (e.g. $500)" className="w-full p-4 bg-[#0B0F14] border border-white/10 rounded-xl font-bold text-white outline-none focus:border-[#8CFB5B]" onChange={e=>setNewLeague({...newLeague, pot:e.target.value})}/>
                    <button onClick={handleCreateLeague} className="w-full bg-[#8CFB5B] text-black py-4 rounded-xl font-black uppercase tracking-widest text-xs mt-2">Deploy League</button>
                </div>
            </div>
        </div>
      )}

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgradeToPro} />
    </div>
  );
}
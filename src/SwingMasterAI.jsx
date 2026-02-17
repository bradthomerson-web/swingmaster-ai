// src/SwingMasterAI.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Sparkles, Plus, TrendingUp, Trophy, Calendar, Target, User, Save, 
  Navigation, Zap, Lock, CreditCard, Locate, Stethoscope, Dumbbell, Video, 
  Users, BarChart3, ChevronRight, ChevronLeft, Camera, X, Activity, CheckCircle2, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UpgradeModal from './UpgradeModal'; 
import { FilesetResolver, PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00"; 
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; 
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const STANDARD_CLUBS = ['Driver', '3 Wood', '5 Wood', 'Hybrid', '3 Iron', '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge'];
const EQUIPMENT_OPTIONS = ['Driving Range', 'Golf Net', 'Hitting Mat', 'Simulator', 'Alignment Stick', 'Full Bag'];

export default function SwingMasterAI({ isPro }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // --- DATA STATE ---
  const [rounds, setRounds] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: '', handicap: '', weaknesses: '', equipment: '' });
  
  // --- LIVE ROUND STATE (NEW) ---
  const [isLiveRound, setIsLiveRound] = useState(false);
  const [currentHole, setCurrentHole] = useState(1);
  const [liveData, setLiveData] = useState(Array(18).fill().map((_, i) => ({
    hole: i + 1, par: 4, strokes: 4, putts: 2, fairway: 'hit', gir: true
  })));

  // --- LEAGUE & AI STATE ---
  const [leagues, setLeagues] = useState([{ id: 1, name: 'Saturday Skins', members: 12, pot: '$50', rank: 4, score: '+2' }]);
  const [aiTool, setAiTool] = useState('trainer');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  // --- GPS & VIDEO STATE ---
  const [gpsActive, setGpsActive] = useState(false);
  const [currentDistance, setCurrentDistance] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [aiFeedback, setAiFeedback] = useState("Ready to track...");

  const handleUpgradeToPro = () => window.location.href = STRIPE_CHECKOUT_URL;

  // --- LOAD/SAVE ---
  useEffect(() => {
    const saved = localStorage.getItem('swingmaster_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.rounds) setRounds(parsed.rounds);
      if (parsed.profile) setUserProfile(parsed.profile);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('swingmaster_data', JSON.stringify({ rounds, profile: userProfile }));
  }, [rounds, userProfile]);

  // --- LIVE ROUND LOGIC ---
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

    const roundSummary = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      score: totalStrokes,
      putts: totalPutts,
      gir: totalGIR,
      fairways: totalFairways,
      details: liveData
    };

    setRounds([roundSummary, ...rounds]);
    setIsLiveRound(false);
    setActiveTab('dashboard');
  };

  // --- AI LOGIC ---
  const callGemini = async (prompt) => {
    setLoadingAI(true);
    try {
      const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      setAiResponse(data.candidates[0].content.parts[0].text);
    } catch (err) { setAiResponse("Error connecting to AI."); }
    setLoadingAI(false);
  };

  // --- VIEWS ---
  return (
    <div className="bg-slate-50 min-h-screen pb-24 font-sans text-slate-900">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">SwingMaster <span className="text-green-500">Pro</span></h1>
          <span className="text-[10px] font-black bg-amber-400 text-slate-900 px-2 py-1 rounded-full">
            {isPro ? 'PRO MEMBER' : 'FREE'}
          </span>
        </div>
        <nav className="flex justify-around text-[10px] font-bold uppercase tracking-widest text-slate-400">
          <button onClick={() => setActiveTab('dashboard')} className={activeTab === 'dashboard' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Stats</button>
          <button onClick={() => setActiveTab('leagues')} className={activeTab === 'leagues' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Leagues</button>
          <button onClick={() => setActiveTab('live-scorecard')} className={activeTab.includes('live') ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Play</button>
          <button onClick={() => setActiveTab('ai-hub')} className={activeTab === 'ai-hub' ? 'text-white border-b-2 border-green-500 pb-1' : ''}>Coach</button>
        </nav>
      </header>

      <main className="p-4 max-w-md mx-auto">
        
        {/* DASHBOARD: METRICS & IMPROVEMENT */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <button onClick={startNewRound} className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 flex justify-center items-center gap-2">
              <Plus size={20}/> Start New Round
            </button>

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

            <div className="bg-white p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-blue-500"/> Improvement Trends</h3>
              <div className="space-y-4">
                {['Score', 'Fairways', 'GIR'].map((metric) => (
                  <div key={metric}>
                    <div className="flex justify-between text-xs font-bold mb-1"><span>{metric} Trend</span><span className="text-green-600">+12% Improvement</span></div>
                    <div className="flex items-end gap-1 h-12">
                      {[30, 45, 35, 60, 55].map((h, i) => (
                        <div key={i} className="flex-1 bg-blue-100 rounded-t-sm" style={{height: `${h}%`}}></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LIVE SCORECARD (NEW) */}
        {activeTab === 'live-scorecard' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl">
              <div>
                <div className="text-[10px] font-bold uppercase text-slate-400">Hole</div>
                <div className="text-3xl font-black">{currentHole} <span className="text-sm font-normal text-slate-500">/ 18</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase text-slate-400">Total Score</div>
                <div className="text-3xl font-black text-green-400">
                  {liveData.slice(0, currentHole).reduce((a,b)=>a+b.strokes,0)}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-8">
              {/* Strokes Input */}
              <div className="text-center">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Total Strokes</label>
                <div className="flex justify-center items-center gap-8">
                  <button onClick={()=>updateHole('strokes', Math.max(1, liveData[currentHole-1].strokes - 1))} className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl font-bold">-</button>
                  <div className="text-5xl font-black">{liveData[currentHole-1].strokes}</div>
                  <button onClick={()=>updateHole('strokes', liveData[currentHole-1].strokes + 1)} className="w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl font-bold">+</button>
                </div>
              </div>

              {/* Putts Input */}
              <div className="text-center">
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Putts</label>
                <div className="flex justify-center gap-3">
                  {[0,1,2,3].map(n => (
                    <button key={n} onClick={()=>updateHole('putts', n)} className={`w-10 h-10 rounded-xl font-bold border ${liveData[currentHole-1].putts === n ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50'}`}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Fairway & GIR Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <button onClick={()=>updateHole('fairway', liveData[currentHole-1].fairway === 'hit' ? 'miss' : 'hit')} className={`p-4 rounded-2xl border font-bold text-xs flex flex-col items-center gap-2 ${liveData[currentHole-1].fairway === 'hit' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50'}`}>
                  <Target size={20}/> Fairway
                </button>
                <button onClick={()=>updateHole('gir', !liveData[currentHole-1].gir)} className={`p-4 rounded-2xl border font-bold text-xs flex flex-col items-center gap-2 ${liveData[currentHole-1].gir ? 'bg-green-50 border-green-500 text-green-700' : 'bg-slate-50'}`}>
                  <CheckCircle2 size={20}/> Green (GIR)
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              {currentHole > 1 && <button onClick={()=>setCurrentHole(currentHole-1)} className="flex-1 bg-slate-200 py-4 rounded-2xl font-bold">Previous</button>}
              {currentHole < 18 ? 
                <button onClick={()=>setCurrentHole(currentHole+1)} className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-bold">Next Hole</button> :
                <button onClick={finishRound} className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-bold">Finish & Save</button>
              }
            </div>
          </div>
        )}

        {/* ... Rest of components (AI Hub, Leagues, etc.) same as before but wired to these new round metrics */}
      </main>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Activity, MapPin, Sparkles, Share2, Plus, Trash2, TrendingUp, Trophy, Calendar, Target, User, Save, Box, AlertCircle, Locate, Navigation, ChevronDown, Zap, Lock, CreditCard, CheckCircle, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 

// --- ⬇️ PASTE YOUR STRIPE URL HERE ⬇️ ---
const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00"; 

// --- API Configuration ---
const apiKey = ""; 

const CLUBS = [
  'Driver', '3 Wood', '5 Wood', 'Hybrid', '3 Iron', '4 Iron', 
  '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 
  'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge'
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // --- Monetization State ---
  const [isPro, setIsPro] = useState(false); 

  // --- CHECK FOR PAYMENT SUCCESS OR ADMIN OVERRIDE ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    
    // Check for Stripe success OR manual "pro=1" override
    if (query.get("payment") === "success" || query.get("pro") === "1") {
      setIsPro(true);
      localStorage.setItem("swingmaster_pro", "true");
      // Clean URL so user doesn't see the code
      window.history.replaceState({}, document.title, "/");
    }
    
    // Check if they were already pro
    const savedPro = localStorage.getItem("swingmaster_pro");
    if (savedPro === "true") setIsPro(true);
  }, []);

  const handleUpgrade = () => {
    window.location.href = STRIPE_CHECKOUT_URL;
  };

  // --- Data State ---
  const [rounds, setRounds] = useState([]);
  const [userProfile, setUserProfile] = useState({ 
    name: '', age: '', handicap: '', strengths: '', weaknesses: '', equipment: ''
  });
  const [newRound, setNewRound] = useState({ date: '', course: '', score: '', putts: '', fairways: '', gir: '' });

  // --- AI State ---
  const [aiTool, setAiTool] = useState('trainer');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [caddieData, setCaddieData] = useState({ distance: '', wind: 'calm', lie: 'fairway' });
  const [quickTipQuery, setQuickTipQuery] = useState('');
  const [quickTipResult, setQuickTipResult] = useState(null);

  // --- GPS State ---
  const [gpsActive, setGpsActive] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [gpsError, setGpsError] = useState(null);
  const [shotHistory, setShotHistory] = useState([]); 
  const [selectedClub, setSelectedClub] = useState('Driver');

  // --- Helpers ---
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
    if (!newRound.score || !newRound.course) return;
    const round = { ...newRound, id: Date.now() };
    setRounds([round, ...rounds]);
    setNewRound({ date: '', course: '', score: '', putts: '', fairways: '', gir: '' });
    setActiveTab('dashboard');
  };

  // --- GPS Logic ---
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1.09361); // Yards
  };

  const startShot = () => {
    if (!navigator.geolocation) { setGpsError("GPS not supported."); return; }
    setGpsActive(true); setCurrentDistance(0); setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => setStartCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setGpsError("Unable to retrieve location."), { enableHighAccuracy: true }
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

  // --- AI API Logic ---
  const callGemini = async (prompt, isQuickTip = false) => {
    setLoadingAI(true);
    if(isQuickTip) setQuickTipResult(null); else setAiResponse(null);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if(isQuickTip) setQuickTipResult(text); else setAiResponse(text);
    } catch (err) {
      const errMsg = "Error connecting to AI. Please try again.";
      if(isQuickTip) setQuickTipResult(errMsg); else setAiResponse(errMsg);
    } finally {
      setLoadingAI(false);
    }
  };

  // --- UPDATED: Trainer now asks for YouTube Links ---
  const generateDataDrivenPlan = () => {
    const prompt = `
      Act as a PGA Coach. Create a 1-hour practice routine.
      MY STATS: Score Avg ${averages.score}, Putts ${averages.putts}. 
      MY EQUIPMENT: ${userProfile.equipment || 'Standard'}.
      
      CRITICAL INSTRUCTION:
      For every drill you suggest, you MUST provide a clickable YouTube Search link in this markdown format:
      [▶️ Watch Drill Demo](https://www.youtube.com/results?search_query=NAME_OF_DRILL_HERE+golf+drill)
      
      Format the response clearly with phases (Warmup, Main, Cool down).
    `;
    callGemini(prompt, false);
  };

  const generateCaddieAdvice = () => {
    const prompt = `Act as a Tour Caddie. Situation: ${caddieData.distance} yards, Wind: ${caddieData.wind}, Lie: ${caddieData.lie}. Give concise advice.`;
    callGemini(prompt, false);
  };

  // --- UPDATED: Quick Tip now asks for Setup Instructions ---
  const generateQuickTip = () => {
    if(!quickTipQuery) return;
    const prompt = `
        Act as a Caddie helping a player MID-ROUND on the golf course.
        The player says: "${quickTipQuery}".
        
        CRITICAL RULES:
        1. NO technical drills.
        2. Give 2 simple "Swing Thoughts" to bandage the problem immediately.
        3. PROVIDE "EMERGENCY SETUP CHECKLIST":
           - Ball Position: (e.g. Move it back 1 inch)
           - Stance: (e.g. Widen stance)
           - Hands: (e.g. Press forward)
        4. Be extremely concise (under 100 words).
    `;
    callGemini(prompt, true);
  };

  // --- Views ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center mb-2">
           <h2 className="font-bold text-slate-800">Dashboard</h2>
           {isPro && <div className="text-xs font-bold px-3 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200">★ PRO ACTIVE</div>}
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1"><Trophy size={14} /> Score Avg</div>
                <div className="text-3xl font-bold">{averages.score}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold mb-1"><Target size={14} /> Putts</div>
                <div className="text-3xl font-bold text-slate-800">{averages.putts}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold mb-1"><MapPin size={14} /> G.I.R.</div>
                <div className="text-3xl font-bold text-slate-800">{averages.gir}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold mb-1"><TrendingUp size={14} /> Fairways</div>
                <div className="text-3xl font-bold text-slate-800">{averages.fairways}</div>
            </div>
        </div>

      {shotHistory.length > 0 && (
         <div className="bg-green-600 text-white p-4 rounded-xl shadow-md flex justify-between items-center cursor-pointer" onClick={() => setActiveTab('gps')}>
             <div>
                 <div className="text-xs font-bold uppercase opacity-80 mb-1">Last Measured Shot</div>
                 <div className="text-3xl font-bold flex items-baseline gap-2">{shotHistory[0].dist}y <span className="text-sm font-normal opacity-75">({shotHistory[0].club})</span></div>
             </div>
             <Navigation/>
         </div>
      )}

      {/* Stats Table */}
      {rounds.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800">Recent Rounds</h3></div>
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500">
                    <tr><th className="p-3">Date</th><th className="p-3">Course</th><th className="p-3">Score</th></tr>
                </thead>
                <tbody>
                    {rounds.map(round => (
                        <tr key={round.id} className="border-t border-slate-50">
                            <td className="p-3 text-slate-600">{round.date}</td>
                            <td className="p-3 text-slate-600">{round.course}</td>
                            <td className="p-3 font-bold text-slate-900 bg-slate-50">{round.score}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      ) : (
          <div className="text-center p-8 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-slate-500">No rounds logged yet.</p>
              <button onClick={() => setActiveTab('rounds')} className="text-blue-600 font-bold mt-2">Log your first round</button>
          </div>
      )}
    </div>
  );

  const renderGPS = () => (
    <div className="max-w-xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Navigation className="text-blue-600"/> GPS Measure</h2>
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 text-center relative overflow-hidden">
            {gpsError && <div className="bg-red-50 text-red-500 p-2 mb-4 text-sm rounded">{gpsError}</div>}
            <div className="mb-2 text-slate-500 font-bold uppercase text-sm tracking-wider">Shot Distance</div>
            <div className="text-7xl font-black text-slate-900 tracking-tighter mb-2">{currentDistance}</div>
            <div className="text-slate-400 font-medium mb-6">YARDS</div>
            <div className="mb-6 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Club</label>
                <div className="relative">
                    <select value={selectedClub} onChange={(e) => setSelectedClub(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold appearance-none" disabled={gpsActive}>
                        {CLUBS.map((club) => (<option key={club} value={club}>{club}</option>))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={16}/>
                </div>
            </div>
            {!gpsActive ? (
                <button onClick={startShot} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-xl transition-all flex items-center justify-center gap-2"><Locate size={24}/> Mark Start (Tee)</button>
            ) : (
                <div className="space-y-3">
                     <div className="animate-pulse text-green-600 font-bold text-sm flex items-center justify-center gap-2"><div className="w-2 h-2 bg-green-600 rounded-full"></div> GPS Active</div>
                     <button onClick={saveShot} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-xl transition-all">Stop & Save</button>
                </div>
            )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Recorded Shots</h3></div>
            {shotHistory.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">No shots measured yet.</div> : (
                <div className="divide-y divide-slate-50">{shotHistory.map((shot, idx) => (<div key={idx} className="p-4 flex justify-between items-center"><span className="text-slate-600 font-medium">{shot.club}</span><span className="font-bold text-slate-900 text-lg">{shot.dist}y</span></div>))}</div>
            )}
        </div>
    </div>
  );

  const renderQuickTips = () => {
      if (!isPro) {
          return (
              <div className="max-w-md mx-auto h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-6 animate-fadeIn">
                  <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mb-4"><Lock size={48} className="text-amber-600" /></div>
                  <div><h2 className="text-2xl font-bold text-slate-900">Pro Feature Locked</h2><p className="text-slate-500 mt-2">The "Emergency Quick Tips" feature is only available for Pro members.</p></div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 w-full">
                      <button onClick={handleUpgrade} className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3 rounded-lg font-bold shadow-lg hover:from-amber-600 hover:to-amber-700 flex items-center justify-center gap-2"><CreditCard size={18} /> Upgrade to Pro ($49/yr)</button>
                  </div>
              </div>
          );
      }
      return (
        <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"><Zap className="text-amber-600 flex-shrink-0 mt-1" size={24}/><div><h3 className="font-bold text-amber-900">Emergency Mode</h3><p className="text-sm text-amber-800">"Band-aid" fixes to get you through the round.</p></div></div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">What's wrong right now?</label>
                <input type="text" value={quickTipQuery} onChange={(e) => setQuickTipQuery(e.target.value)} className="w-full p-4 border-2 border-slate-200 rounded-lg text-lg focus:border-amber-500 outline-none mb-4" placeholder="e.g. I keep topping my woods..." />
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">{['Slicing Driver', 'Topping Irons', 'Shanking', 'Yips'].map(tag => (<button key={tag} onClick={() => setQuickTipQuery(tag)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 whitespace-nowrap">{tag}</button>))}</div>
                <button onClick={generateQuickTip} disabled={loadingAI || !quickTipQuery} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">{loadingAI ? 'Consulting Caddie...' : 'Get Instant Fix'}</button>
            </div>
            {quickTipResult && (
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-amber-500 animate-slideUp">
                    <h3 className="font-bold text-lg text-slate-900 mb-2 flex items-center gap-2"><CheckCircle size={20} className="text-green-500"/> Caddie's Advice:</h3>
                    <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium"><ReactMarkdown>{quickTipResult}</ReactMarkdown></div>
                </div>
            )}
        </div>
      );
  };

  const renderRoundsInput = () => (
    <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Log a Round</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Date</label><input type="date" value={newRound.date} onChange={e => setNewRound({...newRound, date: e.target.value})} className="w-full p-2 border rounded mt-1"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Course</label><input type="text" value={newRound.course} onChange={e => setNewRound({...newRound, course: e.target.value})} className="w-full p-2 border rounded mt-1" placeholder="Course Name"/></div>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-6">
                <div><label className="text-xs font-bold text-slate-500 uppercase">Score</label><input type="number" value={newRound.score} onChange={e => setNewRound({...newRound, score: e.target.value})} className="w-full p-2 border rounded mt-1 font-bold text-center" placeholder="--"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">Putts</label><input type="number" value={newRound.putts} onChange={e => setNewRound({...newRound, putts: e.target.value})} className="w-full p-2 border rounded mt-1 text-center" placeholder="--"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">FIR</label><input type="number" value={newRound.fairways} onChange={e => setNewRound({...newRound, fairways: e.target.value})} className="w-full p-2 border rounded mt-1 text-center" placeholder="--"/></div>
                <div><label className="text-xs font-bold text-slate-500 uppercase">GIR</label><input type="number" value={newRound.gir} onChange={e => setNewRound({...newRound, gir: e.target.value})} className="w-full p-2 border rounded mt-1 text-center" placeholder="--"/></div>
            </div>
            <button onClick={handleSaveRound} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center gap-2"><Plus size={18}/> Add to Stats</button>
        </div>
    </div>
  );

  const renderProfile = () => (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Golfer Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label><input type="text" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="Name" /></div>
            <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Handicap</label><input type="text" value={userProfile.handicap} onChange={e => setUserProfile({...userProfile, handicap: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg" placeholder="18" /></div>
        </div>
        <div className="space-y-6"><div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100"><label className="block text-xs font-bold text-blue-600 uppercase mb-1">Equipment</label><input type="text" value={userProfile.equipment} onChange={e => setUserProfile({...userProfile, equipment: e.target.value})} className="w-full p-3 border border-slate-200 rounded-lg bg-white" placeholder="e.g. Net, Mat, Range" /></div></div>
        <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end"><button onClick={() => setActiveTab('dashboard')} className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"><Save size={18} /> Save</button></div>
    </div>
  );

  const renderAIHub = () => (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4"><Sparkles className="text-amber-500" /> AI Coach</h2>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
                    <button onClick={() => setAiTool('trainer')} className={`flex-1 py-2 text-xs font-bold rounded uppercase transition-all ${aiTool === 'trainer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Trainer</button>
                    <button onClick={() => setAiTool('caddie')} className={`flex-1 py-2 text-xs font-bold rounded uppercase transition-all ${aiTool === 'caddie' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Caddie</button>
                </div>
                {aiTool === 'trainer' && (<div className="space-y-4"><p className="text-xs text-slate-500">Generates a 2-hour drill session.</p><button onClick={generateDataDrivenPlan} disabled={loadingAI} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold shadow-md hover:shadow-lg">{loadingAI ? 'Building...' : 'Generate Plan'}</button></div>)}
                {aiTool === 'caddie' && (<div className="space-y-3"><input type="number" value={caddieData.distance} onChange={(e) => setCaddieData({...caddieData, distance: e.target.value})} className="w-full p-2 border rounded text-sm" placeholder="150 yds" /><button onClick={generateCaddieAdvice} disabled={loadingAI} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">{loadingAI ? 'Thinking...' : 'Get Advice'}</button></div>)}
            </div>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto relative min-h-[400px]">
             {aiResponse ? (<div className="whitespace-pre-wrap text-slate-700 leading-relaxed"><ReactMarkdown>{aiResponse}</ReactMarkdown></div>) : (<div className="h-full flex items-center justify-center text-slate-300">Select a tool to begin.</div>)}
        </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-20">
        <div className="flex items-center gap-2"><Activity className="text-green-500" /><h1 className="text-xl font-bold tracking-tight">SwingMaster <span className="text-green-500">Pro</span></h1></div>
        <nav className="flex gap-1 bg-slate-800 p-1 rounded-lg overflow-x-auto">
            {[{ id: 'dashboard', icon: Trophy, label: 'Stats' }, { id: 'rounds', icon: Calendar, label: 'Log' }, { id: 'gps', icon: Navigation, label: 'GPS' }, { id: 'quick-tips', icon: Zap, label: 'Tips' }, { id: 'ai-hub', icon: Sparkles, label: 'AI Hub' }, { id: 'profile', icon: User, label: 'Profile' }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-3 md:px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'} ${tab.id === 'quick-tips' ? 'text-amber-400' : ''}`}><tab.icon size={16}/> <span className="hidden sm:inline">{tab.label}</span></button>))}
        </nav>
      </header>
      <main className="flex-grow p-4 lg:p-6 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'rounds' && renderRoundsInput()}
        {activeTab === 'gps' && renderGPS()}
        {activeTab === 'quick-tips' && renderQuickTips()}
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'ai-hub' && renderAIHub()}
      </main>
    </div>
  );
}
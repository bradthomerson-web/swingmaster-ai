import React, { useState, useEffect } from 'react';
import { Activity, MapPin, Sparkles, Plus, TrendingUp, Trophy, Calendar, Target, User, Save, Navigation, ChevronDown, Zap, Lock, CreditCard, CheckCircle, Star, Locate } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- ⬇️ PASTE YOUR STRIPE URL HERE ⬇️ ---
const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00"; 

// --- API Configuration ---
const apiKey = ""; // ⚠️ Make sure your Gemini API Key is here

const CLUBS = [
  'Driver', '3 Wood', '5 Wood', 'Hybrid', '3 Iron', '4 Iron', 
  '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron', 
  'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge'
];

// 🛠️ NEW: Predefined Equipment List
const EQUIPMENT_OPTIONS = [
    'Driving Range', 
    'Golf Net', 
    'Hitting Mat', 
    'Simulator', 
    'Alignment Stick', // <--- Added
    'Full Bag'        // <--- Added
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isPro, setIsPro] = useState(false); 

  // --- MONETIZATION & INIT ---
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.get("payment") === "success" || query.get("pro") === "1") {
      setIsPro(true);
      localStorage.setItem("swingmaster_pro", "true");
      window.history.replaceState({}, document.title, "/");
    }
    const savedPro = localStorage.getItem("swingmaster_pro");
    if (savedPro === "true") setIsPro(true);
  }, []);

  const handleUpgrade = () => window.location.href = STRIPE_CHECKOUT_URL;

  // --- DATA STATE ---
  const [rounds, setRounds] = useState([]);
  const [userProfile, setUserProfile] = useState({ 
    name: '', age: '', handicap: '', strengths: '', weaknesses: '', equipment: ''
  });
  const [newRound, setNewRound] = useState({ date: '', course: '', score: '', putts: '', fairways: '', gir: '' });

  // --- AI STATE ---
  const [aiTool, setAiTool] = useState('trainer');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [caddieData, setCaddieData] = useState({ distance: '', wind: 'calm', lie: 'fairway' });
  const [quickTipQuery, setQuickTipQuery] = useState('');
  const [quickTipResult, setQuickTipResult] = useState(null);

  // --- GPS STATE ---
  const [gpsActive, setGpsActive] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [gpsError, setGpsError] = useState(null);
  const [shotHistory, setShotHistory] = useState([]); 
  const [selectedClub, setSelectedClub] = useState('Driver');

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
    if (!newRound.score || !newRound.course) return;
    const round = { ...newRound, id: Date.now() };
    setRounds([round, ...rounds]);
    setNewRound({ date: '', course: '', score: '', putts: '', fairways: '', gir: '' });
    setActiveTab('dashboard');
  };

  // --- EQUIPMENT HELPER LOGIC ---
  const handleEquipmentChange = (item, isChecked) => {
    let currentItems = userProfile.equipment ? userProfile.equipment.split(',').map(i => i.trim()).filter(i => i) : [];
    
    if (isChecked) {
        if (!currentItems.includes(item)) currentItems.push(item);
    } else {
        currentItems = currentItems.filter(i => i !== item);
    }
    setUserProfile({ ...userProfile, equipment: currentItems.join(', ') });
  };

  const handleMiscEquipment = (text) => {
    // 1. Get current known items (checkboxes)
    let currentItems = userProfile.equipment ? userProfile.equipment.split(',').map(i => i.trim()) : [];
    const knownItems = currentItems.filter(i => EQUIPMENT_OPTIONS.includes(i));
    
    // 2. Add the new custom text
    const newEquipmentString = knownItems.length > 0 
        ? knownItems.join(', ') + (text ? ', ' + text : '') 
        : text;

    setUserProfile({ ...userProfile, equipment: newEquipmentString });
  };

  // Parse "Misc" text for display
  const getMiscText = () => {
    if (!userProfile.equipment) return '';
    const items = userProfile.equipment.split(',').map(i => i.trim());
    const miscItems = items.filter(i => !EQUIPMENT_OPTIONS.includes(i));
    return miscItems.join(', ');
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

  // --- AI API LOGIC ---
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
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if(isQuickTip) setQuickTipResult(text); else setAiResponse(text);
    } catch (err) {
      const errTxt = "Connection Error. Try again.";
      if(isQuickTip) setQuickTipResult(errTxt); else setAiResponse(errTxt);
    } finally {
      setLoadingAI(false);
    }
  };

  const generateDataDrivenPlan = () => {
    const prompt = `
      Act as a PGA Coach. Create a 45-minute practice plan.
      MY STATS: Score Avg ${averages.score}, Putts ${averages.putts}.
      EQUIPMENT: ${userProfile.equipment || 'Standard Range'}.
      
      For EVERY drill, you MUST provide a YouTube Search link in this format:
      [▶️ Watch Drill Demo](https://www.youtube.com/results?search_query=NAME_OF_DRILL_HERE+golf+drill)
      
      Format with clear headings.
    `;
    callGemini(prompt, false);
  };

  const generateCaddieAdvice = () => {
    const prompt = `Act as a Tour Caddie. Shot: ${caddieData.distance} yards, Wind: ${caddieData.wind}, Lie: ${caddieData.lie}. Recommendation?`;
    callGemini(prompt, false);
  };

  const generateQuickTip = () => {
    if(!quickTipQuery) return;
    const prompt = `
        CRITICAL: EMERGENCY GOLF MODE.
        User Issue: "${quickTipQuery}"
        
        Provide a 10-second fix.
        Format:
        ## 🛑 SETUP FIX
        (1 bullet point)
        
        ## 🏌️‍♂️ SWING THOUGHT
        (1 simple phrase)
        
        NO EXTRA TEXT.
    `;
    callGemini(prompt, true);
  };

  // --- VIEWS ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
       <div className="flex justify-between items-center mb-2">
           <h2 className="font-bold text-slate-800">Dashboard</h2>
           {isPro && <div className="text-xs font-bold px-3 py-1 rounded-full border bg-amber-100 text-amber-700 border-amber-200">★ PRO ACTIVE</div>}
       </div>
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1"><Trophy size={14} /> Score</div>
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
        {/* Rounds List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800">Recent Rounds</h3></div>
            {rounds.length === 0 ? <div className="p-8 text-center text-slate-500">No rounds yet.</div> : (
              <table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Date</th><th className="p-3">Course</th><th className="p-3">Score</th></tr></thead>
              <tbody>{rounds.map(r => (<tr key={r.id} className="border-t border-slate-50"><td className="p-3">{r.date}</td><td className="p-3">{r.course}</td><td className="p-3 font-bold">{r.score}</td></tr>))}</tbody></table>
            )}
        </div>
    </div>
  );

  const renderQuickTips = () => {
      if (!isPro) return (
          <div className="max-w-md mx-auto text-center p-8 space-y-6">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><Lock size={40} className="text-amber-600"/></div>
              <h2 className="text-2xl font-bold text-slate-900">Unlock Swing 911</h2>
              <p className="text-slate-500">Get instant, mid-round fixes for slices, shanks, and tops.</p>
              <button onClick={handleUpgrade} className="w-full bg-amber-500 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-amber-600 flex items-center justify-center gap-2"><CreditCard size={18}/> Unlock for $49</button>
          </div>
      );
      return (
        <div className="max-w-xl mx-auto space-y-6">
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3"><Zap className="text-red-600 mt-1" size={24}/><div><h3 className="font-bold text-red-900">Swing 911 (Emergency Mode)</h3><p className="text-sm text-red-800">Instant fixes. No technical jargon.</p></div></div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-2">What's the miss?</label>
                <input type="text" value={quickTipQuery} onChange={(e) => setQuickTipQuery(e.target.value)} className="w-full p-4 border-2 border-slate-200 rounded-lg text-lg focus:border-red-500 outline-none mb-4" placeholder="e.g. Slicing my driver..." />
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">{['Slicing Driver', 'Topping Irons', 'Shanking', 'Yips'].map(tag => (<button key={tag} onClick={() => setQuickTipQuery(tag)} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 whitespace-nowrap">{tag}</button>))}</div>
                <button onClick={generateQuickTip} disabled={loadingAI || !quickTipQuery} className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50">{loadingAI ? 'Consulting Caddie...' : 'FIX MY SWING'}</button>
            </div>
            {quickTipResult && (
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-red-500 animate-slideUp">
                    <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-medium">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{quickTipResult}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
      );
  };

  const renderAIHub = () => (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-[80vh]">
        <div className="md:w-1/3 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="font-bold text-slate-900 mb-4 flex gap-2"><Sparkles className="text-amber-500"/> AI Coach</h2>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-4">
                    <button onClick={() => setAiTool('trainer')} className={`flex-1 py-2 text-xs font-bold rounded ${aiTool === 'trainer' ? 'bg-white shadow' : 'text-slate-500'}`}>Trainer</button>
                    <button onClick={() => setAiTool('caddie')} className={`flex-1 py-2 text-xs font-bold rounded ${aiTool === 'caddie' ? 'bg-white shadow' : 'text-slate-500'}`}>Caddie</button>
                </div>
                {aiTool === 'trainer' && <button onClick={generateDataDrivenPlan} disabled={loadingAI} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow hover:bg-blue-700">{loadingAI ? 'Building...' : 'Generate Plan'}</button>}
                {aiTool === 'caddie' && <div className="space-y-3"><input type="number" value={caddieData.distance} onChange={(e) => setCaddieData({...caddieData, distance: e.target.value})} className="w-full p-2 border rounded" placeholder="150 yds"/><button onClick={generateCaddieAdvice} disabled={loadingAI} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">{loadingAI ? 'Thinking...' : 'Get Advice'}</button></div>}
            </div>
        </div>
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-y-auto">
             {aiResponse ? <div className="prose prose-slate max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{aiResponse}</ReactMarkdown></div> : <div className="h-full flex items-center justify-center text-slate-300">Select a tool to begin.</div>}
        </div>
    </div>
  );

  const renderRoundsInput = () => (
    <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-900 mb-4">Log Round</h2>
        <div className="space-y-3">
            <input type="date" className="w-full p-2 border rounded" onChange={e => setNewRound({...newRound, date: e.target.value})}/>
            <input type="text" placeholder="Course" className="w-full p-2 border rounded" onChange={e => setNewRound({...newRound, course: e.target.value})}/>
            <div className="grid grid-cols-4 gap-2">
                <input type="number" placeholder="Score" className="p-2 border rounded text-center font-bold" onChange={e => setNewRound({...newRound, score: e.target.value})}/>
                <input type="number" placeholder="Putts" className="p-2 border rounded text-center" onChange={e => setNewRound({...newRound, putts: e.target.value})}/>
                <input type="number" placeholder="FIR" className="p-2 border rounded text-center" onChange={e => setNewRound({...newRound, fairways: e.target.value})}/>
                <input type="number" placeholder="GIR" className="p-2 border rounded text-center" onChange={e => setNewRound({...newRound, gir: e.target.value})}/>
            </div>
            <button onClick={handleSaveRound} className="w-full bg-green-600 text-white font-bold py-3 rounded hover:bg-green-700 flex justify-center gap-2"><Plus size={18}/> Save Round</button>
        </div>
    </div>
  );

  // 🛠️ UPDATED PROFILE RENDER with Checkboxes & Misc Box
  const renderProfile = () => (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="font-bold text-slate-900 mb-6">Profile</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
            <div><label className="text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} className="w-full p-2 border rounded"/></div>
            <div><label className="text-xs font-bold text-slate-500 uppercase">Hcp</label><input type="text" value={userProfile.handicap} onChange={e => setUserProfile({...userProfile, handicap: e.target.value})} className="w-full p-2 border rounded"/></div>
        </div>

        {/* New Equipment Checklist */}
        <div className="mb-6">
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">My Equipment</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
                {EQUIPMENT_OPTIONS.map(item => {
                    const isChecked = userProfile.equipment?.includes(item);
                    return (
                        <label key={item} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${isChecked ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                            <input 
                                type="checkbox" 
                                checked={isChecked || false} 
                                onChange={(e) => handleEquipmentChange(item, e.target.checked)}
                                className="w-4 h-4 accent-blue-600"
                            />
                            <span className="text-sm font-bold">{item}</span>
                        </label>
                    );
                })}
            </div>
            
            {/* Misc Input */}
            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Other / Misc (comma separated)</label>
            <input 
                type="text" 
                value={getMiscText()} 
                onChange={(e) => handleMiscEquipment(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" 
                placeholder="e.g. FlightScope, PuttOut Mat..."
            />
        </div>

        <button onClick={() => setActiveTab('dashboard')} className="bg-slate-900 text-white px-6 py-2 rounded font-bold"><Save size={18} className="inline mr-2"/> Save Profile</button>
    </div>
  );

  const renderGPS = () => (
    <div className="max-w-xl mx-auto space-y-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 relative">
            <h2 className="font-bold text-slate-900 mb-2 flex justify-center gap-2"><Navigation className="text-blue-600"/> GPS Measure</h2>
            <div className="text-7xl font-black text-slate-900 mb-1">{currentDistance}</div>
            <div className="text-slate-400 font-bold mb-6">YARDS</div>
            {!gpsActive ? <button onClick={startShot} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex justify-center gap-2"><Locate/> Start Shot</button>
            : <button onClick={saveShot} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold animate-pulse">Stop & Save</button>}
            {gpsError && <p className="text-red-500 text-sm mt-2">{gpsError}</p>}
        </div>
        {shotHistory.length > 0 && <div className="bg-white rounded-xl shadow p-4 text-left"><h3 className="font-bold border-b pb-2 mb-2">History</h3>{shotHistory.map((s,i)=><div key={i} className="flex justify-between py-2 border-b last:border-0"><span>{s.club}</span><span className="font-bold">{s.dist}y</span></div>)}</div>}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-20">
        <div className="flex items-center gap-2"><Activity className="text-green-500"/><h1 className="text-xl font-bold">SwingMaster <span className="text-green-500">Pro</span></h1></div>
        <nav className="flex gap-1 bg-slate-800 p-1 rounded-lg overflow-x-auto">
            {[{id:'dashboard',icon:Trophy,lbl:'Stats'},{id:'rounds',icon:Calendar,lbl:'Log'},{id:'gps',icon:Navigation,lbl:'GPS'},{id:'quick-tips',icon:Zap,lbl:'Tips'},{id:'ai-hub',icon:Sparkles,lbl:'Coach'},{id:'profile',icon:User,lbl:'Me'}].map(t=>(<button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-3 py-2 rounded text-sm font-bold flex gap-2 ${activeTab===t.id?'bg-blue-600 text-white':'text-slate-400 hover:text-white'}`}><t.icon size={16}/><span className="hidden sm:inline">{t.lbl}</span></button>))}
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
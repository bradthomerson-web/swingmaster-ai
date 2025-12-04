// src/SwingMasterAI.jsx
import logoImage from './assets/Swingmaster_logo.jpg';
import React, { useState, useEffect } from 'react';
import {
  Activity,
  MapPin,
  Sparkles,
  Share2,
  Plus,
  TrendingUp,
  Trophy,
  Calendar,
  Target,
  User,
  Save,
  Box,
  AlertCircle,
  Stethoscope, // Icon for Fix My Shot
  Lock,
} from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00';

const STANDARD_CLUBS = [
  'Driver', '3 Wood', '5 Wood', '4 Hybrid',
  '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron',
  'PW', 'GW', 'SW', 'LW'
];

export default function SwingMasterAI() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('profile');
  const [rounds, setRounds] = useState([]);
  
  // Profile
  const [userProfile, setUserProfile] = useState({
    name: '', age: '', handicap: '', strengths: '', weaknesses: '', equipment: '',
  });

  // Club Distances
  const [clubDistances, setClubDistances] = useState([]);
  const [newDistanceEntry, setNewDistanceEntry] = useState({ club: '', carry: '', total: '' });
  const [summaryDistances, setSummaryDistances] = useState({});

  // Round Entry
  const [newRound, setNewRound] = useState({
    date: '', course: '', score: '', putts: '', fairways: '', gir: '',
  });

  // AI & Tools
  const [aiTool, setAiTool] = useState('trainer'); // trainer, caddie, distances, fix
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  
  // Caddie Inputs
  const [caddieData, setCaddieData] = useState({ distance: '', wind: 'calm', lie: 'fairway' });
  
  // Fix My Shot Inputs
  const [fixInput, setFixInput] = useState('');

  // Payment / Limits
  const FREE_DAILY_AI_LIMIT = 1;
  const [aiUsesToday, setAiUsesToday] = useState(0);
  const [lastUseDate, setLastUseDate] = useState(null);
  const [isPro, setIsPro] = useState(false);

  // --- UPGRADE HANDLER ---
  const handleUpgradeToPro = () => {
    console.log('➡️ Redirecting to Stripe checkout…');
    window.location.href = STRIPE_PAYMENT_URL;
  };

  // --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    try {
      const savedRounds = localStorage.getItem('swingmaster_rounds');
      const savedProfile = localStorage.getItem('swingmaster_profile');
      const savedDistances = localStorage.getItem('swingmaster_club_distances');
      
      if (savedRounds) setRounds(JSON.parse(savedRounds));
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
      if (savedDistances) setClubDistances(JSON.parse(savedDistances));

      // Load Usage Limits
      const today = new Date().toDateString();
      const savedDate = localStorage.getItem('ai_last_use_date');
      const savedPro = localStorage.getItem('ai_is_pro');

      if (savedDate !== today) {
        setAiUsesToday(0);
        setLastUseDate(today);
        localStorage.setItem('ai_last_use_date', today);
      } else {
        setAiUsesToday(Number(localStorage.getItem('ai_uses_today') || 0));
        setLastUseDate(savedDate);
      }
      setIsPro(savedPro === 'true');

      // Check URL for Stripe success
      const url = new URL(window.location.href);
      if (url.searchParams.get('pro') === '1') {
        setIsPro(true);
        localStorage.setItem('ai_is_pro', "true");
        // Clear URL
        window.history.replaceState({}, document.title, url.pathname);
        alert("Welcome to Pro! All features unlocked.");
      }

    } catch (err) { console.error(err); }
  }, []);

  // --- SAVE DATA EFFECTS ---
  useEffect(() => localStorage.setItem('swingmaster_rounds', JSON.stringify(rounds)), [rounds]);
  useEffect(() => localStorage.setItem('swingmaster_profile', JSON.stringify(userProfile)), [userProfile]);
  useEffect(() => localStorage.setItem('swingmaster_club_distances', JSON.stringify(clubDistances)), [clubDistances]);
  
  // Calculate Best Carry Distances
  useEffect(() => {
    const summaryMap = clubDistances.reduce((acc, entry) => {
      const club = entry.club.trim(); 
      const carry = Number(entry.carry); 
      if (carry > 0 && carry > (acc[club] || 0)) acc[club] = carry;
      return acc;
    }, {});
    setSummaryDistances(summaryMap);
  }, [clubDistances]);

  // Save Limits
  useEffect(() => {
    localStorage.setItem('ai_uses_today', aiUsesToday);
    localStorage.setItem('ai_last_use_date', lastUseDate);
    localStorage.setItem('ai_is_pro', isPro);
  }, [aiUsesToday, lastUseDate, isPro]);


  // --- HELPERS ---
  const getAverages = () => {
    if (rounds.length === 0) return { score: '-', putts: '-', gir: '-', fairways: '-' };
    const sum = rounds.reduce((acc, c) => ({
      score: acc.score + Number(c.score),
      putts: acc.putts + Number(c.putts),
      gir: acc.gir + Number(c.gir),
      fairways: acc.fairways + Number(c.fairways),
    }), { score: 0, putts: 0, gir: 0, fairways: 0 });
    return {
      score: (sum.score / rounds.length).toFixed(1),
      putts: (sum.putts / rounds.length).toFixed(1),
      gir: (sum.gir / rounds.length).toFixed(1),
      fairways: (sum.fairways / rounds.length).toFixed(1),
    };
  };
  const averages = getAverages();

  const handleSaveRound = () => {
    if (!newRound.score) return;
    setRounds([{...newRound, id: Date.now()}, ...rounds]);
    setNewRound({ date: '', course: '', score: '', putts: '', fairways: '', gir: '' });
    setActiveTab('dashboard');
  };

  const handleSaveDistance = () => {
    if (!newDistanceEntry.club || !newDistanceEntry.carry) return;
    setClubDistances([{...newDistanceEntry, id: Date.now(), carry: Number(newDistanceEntry.carry), total: Number(newDistanceEntry.total)}, ...clubDistances]);
    setNewDistanceEntry({ club: '', carry: '', total: '' });
  };

  // --- AI API CALL ---
  const callGemini = async (prompt) => {
    setLoadingAI(true);
    setAiResponse(null);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text);
    } catch (err) {
      console.error(err);
      setAiResponse('Error connecting to AI Coach. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  // --- 1. TRAINER LOGIC ---
  const generateDataDrivenPlan = () => {
    if (!userProfile.equipment) { alert('Please fill out Equipment in Profile first.'); setActiveTab('profile'); return; }
    
    // FREE TIER CHECK
    if (!isPro && aiUsesToday >= FREE_DAILY_AI_LIMIT) { alert("Daily limit reached. Upgrade to PRO!"); return; }
    setAiUsesToday(prev => prev + 1);

    const prompt = `
      Act as a PGA Coach. Create a 1-hour practice routine.
      MY STATS: Score Avg: ${averages.score}, Putts: ${averages.putts}, FIR: ${averages.fairways}.
      MY EQUIPMENT: ${userProfile.equipment}.
      MY WEAKNESSES: ${userProfile.weaknesses}.
      Generate specific drills I can do with this equipment. Use Bold for Drill Names.
    `;
    callGemini(prompt);
  };

  // --- 2. CADDIE LOGIC (UPDATED WITH REAL DISTANCES) ---
  const generateCaddieAdvice = () => {
    // FREE TIER CHECK
    if (!isPro && aiUsesToday >= FREE_DAILY_AI_LIMIT) { alert("Daily limit reached. Upgrade to PRO!"); return; }
    setAiUsesToday(prev => prev + 1);

    // Turn summaryDistances object into a readable string
    const myBag = Object.entries(summaryDistances)
        .map(([club, dist]) => `${club}: ${dist}y`)
        .join(', ');

    const prompt = `
      Act as a Tour Caddie. 
      Shot Distance: ${caddieData.distance} yards.
      Wind: ${caddieData.wind}.
      Lie: ${caddieData.lie}.
      
      MY CARRY DISTANCES: ${myBag || "Unknown (Estimate based on 15 handicap)"}.
      
      Recommendation:
      1. Which club should I hit?
      2. What is the specific shot shape/strategy?
      3. One swing thought.
    `;
    callGemini(prompt);
  };

// --- 3. FIX MY SHOT LOGIC (PRO ONLY) ---
  const generateQuickFix = () => {
    // STRICT PRO CHECK
    if (!isPro) {
        // If they are free, send them to stripe
        if(window.confirm("Emergency Caddie is a PRO feature. Unlock now?")) {
            handleUpgradeToPro();
        }
        return;
    }

    if (!fixInput) return alert("Please describe your shot issue.");
    
    // Increment usage or allow unlimited for Pro
    setLoadingAI(true);

    const prompt = `
      Emergency Golf Fix. I am on the golf course right now.
      MY PROBLEM: ${fixInput}.
      
      Give me:
      1. ONE immediate "Band-Aid" fix to survive the round (Setup adjustment only).
      2. ONE swing thought to focus on.
      3. ONE drill to do after the round.
      Keep it brief and encouraging.
    `;
    
    callGemini(prompt);
  };


  // --- RENDER HELPERS ---
  const renderSummaryTable = () => {
    const summaryArray = Object.entries(summaryDistances).sort(([, a], [, b]) => b - a);
    if (summaryArray.length === 0) return <p className="text-slate-500 text-sm text-center">Log distances to see data here.</p>;
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-4">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Club</th><th className="p-3">Max Carry</th></tr></thead>
          <tbody>
            {summaryArray.map(([club, dist]) => (
              <tr key={club} className="border-t"><td className="p-3 font-bold">{club}</td><td className="p-3 text-blue-600 font-bold">{dist} yds</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="bg-slate-50 font-sans text-slate-900 max-w-7xl mx-auto w-full min-h-screen pb-20">
      
      {/* HEADER */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="Logo" className="h-8 w-auto rounded" />
            <h1 className="text-xl font-bold tracking-tight">SwingMaster <span className="text-green-500">AI</span></h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPro ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-100'}`}>
              {isPro ? 'PRO MEMBER' : 'FREE'}
            </span>
            {!isPro && (
              <button onClick={handleUpgradeToPro} className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-slate-900">
                Upgrade
              </button>
            )}
          </div>
        </div>
        
        {/* TAB NAV */}
        <div className="flex justify-around bg-slate-800 p-2">
            {[
              { id: 'dashboard', icon: Trophy, label: 'Stats' },
              { id: 'rounds', icon: Calendar, label: 'Log' },
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'ai-hub', icon: Sparkles, label: 'AI Hub' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                className={`flex flex-col items-center gap-1 text-xs font-bold ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`}>
                <tab.icon size={20} /> {tab.label}
              </button>
            ))}
        </div>
      </header>

      {/* CONTENT AREA */}
      <main className="p-4">
        
        {/* DASHBOARD */}
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

        {/* PROFILE */}
        {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 max-w-md mx-auto space-y-4">
                <h2 className="text-xl font-bold">Golfer Profile</h2>
                <input type="text" placeholder="Name" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} className="w-full p-2 border rounded" />
                <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="Age" value={userProfile.age} onChange={e => setUserProfile({...userProfile, age: e.target.value})} className="w-full p-2 border rounded" />
                    <input type="text" placeholder="Handicap" value={userProfile.handicap} onChange={e => setUserProfile({...userProfile, handicap: e.target.value})} className="w-full p-2 border rounded" />
                </div>
                <textarea placeholder="Equipment (e.g. Net, Mat, Driver, 7i)" value={userProfile.equipment} onChange={e => setUserProfile({...userProfile, equipment: e.target.value})} className="w-full p-2 border rounded h-20" />
                <textarea placeholder="Weaknesses" value={userProfile.weaknesses} onChange={e => setUserProfile({...userProfile, weaknesses: e.target.value})} className="w-full p-2 border rounded h-20" />
                <p className="text-xs text-slate-500">AI uses this data to customize drills.</p>
            </div>
        )}

        {/* AI HUB */}
        {activeTab === 'ai-hub' && (
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4">
                {/* TOOLBAR */}
                <div className="md:w-1/3 bg-white p-4 rounded-xl border border-slate-200 h-fit">
                    <h3 className="font-bold mb-4 flex items-center gap-2"><Sparkles className="text-amber-500"/> Tools</h3>
                    <div className="flex flex-col gap-2">
                        <button onClick={() => {setAiTool('trainer'); setAiResponse(null);}} className={`p-3 text-left rounded font-bold text-sm ${aiTool === 'trainer' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'hover:bg-slate-50'}`}>🏋️ Daily Trainer</button>
                        <button onClick={() => {setAiTool('caddie'); setAiResponse(null);}} className={`p-3 text-left rounded font-bold text-sm ${aiTool === 'caddie' ? 'bg-green-50 text-green-700 border-l-4 border-green-600' : 'hover:bg-slate-50'}`}>⛳ Smart Caddie</button>
                        <button onClick={() => {setAiTool('distances'); setAiResponse(null);}} className={`p-3 text-left rounded font-bold text-sm ${aiTool === 'distances' ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'hover:bg-slate-50'}`}>📏 Distances</button>
                        
                        {/* EMERGENCY FIX BUTTON */}
                        <button onClick={() => {setAiTool('fix'); setAiResponse(null);}} 
                            className={`p-3 text-left rounded font-bold text-sm flex justify-between items-center ${aiTool === 'fix' ? 'bg-red-50 text-red-700 border-l-4 border-red-600' : 'hover:bg-slate-50'}`}>
                            <span>🚑 Fix My Shot</span>
                            {!isPro && <Lock size={14} className="text-slate-400"/>}
                        </button>
                    </div>
                </div>

                {/* INPUT AREA */}
                <div className="md:w-2/3 bg-white p-6 rounded-xl border border-slate-200 min-h-[400px]">
                    
                    {/* 1. TRAINER VIEW */}
                    {aiTool === 'trainer' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Daily Practice Generator</h3>
                            <p className="text-sm text-slate-500">Based on your {userProfile.equipment || "Equipment"} and Stats.</p>
                            <button onClick={generateDataDrivenPlan} disabled={loadingAI} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">
                                {loadingAI ? "Thinking..." : "Generate Routine"}
                            </button>
                        </div>
                    )}

                    {/* 2. CADDIE VIEW */}
                    {aiTool === 'caddie' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Smart Caddie</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" placeholder="Distance (yds)" className="p-2 border rounded" onChange={e => setCaddieData({...caddieData, distance: e.target.value})} />
                                <select className="p-2 border rounded" onChange={e => setCaddieData({...caddieData, wind: e.target.value})}>
                                    <option value="calm">Calm</option>
                                    <option value="helping">Tailwind</option>
                                    <option value="hurting">Headwind</option>
                                </select>
                            </div>
                            <button onClick={generateCaddieAdvice} disabled={loadingAI} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700">
                                {loadingAI ? "Calculating..." : "Get Club Advice"}
                            </button>
                        </div>
                    )}

                    {/* 3. DISTANCES VIEW */}
                    {aiTool === 'distances' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg">Bag Mapping</h3>
                            <div className="flex gap-2">
                                <select className="p-2 border rounded flex-1" onChange={e => setNewDistanceEntry({...newDistanceEntry, club: e.target.value})}>
                                    <option>Select Club</option>
                                    {STANDARD_CLUBS.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <input type="number" placeholder="Carry" className="p-2 border rounded w-24" onChange={e => setNewDistanceEntry({...newDistanceEntry, carry: e.target.value})} />
                            </div>
                            <button onClick={handleSaveDistance} className="w-full bg-purple-600 text-white py-2 rounded font-bold">Save Shot</button>
                            {renderSummaryTable()}
                        </div>
                    )}

                    {/* 4. FIX MY SHOT VIEW */}
                    {aiTool === 'fix' && (
                        <div className="space-y-4">
                            <h3 className="font-bold text-lg text-red-600 flex items-center gap-2"><Stethoscope size={20}/> Emergency Caddie</h3>
                            {!isPro ? (
                                <div className="text-center p-6 bg-slate-50 rounded-lg border border-slate-200">
                                    <Lock className="mx-auto text-slate-400 mb-2" size={32} />
                                    <p className="font-bold text-slate-700">Pro Feature</p>
                                    <p className="text-sm text-slate-500 mb-4">Unlock real-time swing fixes on the course.</p>
                                    <button onClick={handleUpgradeToPro} className="bg-amber-400 text-slate-900 px-6 py-2 rounded-full font-bold">Upgrade for $49</button>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-slate-600">What is happening right now? (e.g. "Topping every iron", "Slicing driver badly")</p>
                                    <textarea className="w-full border rounded p-3 h-24" placeholder="Describe the miss..." onChange={e => setFixInput(e.target.value)}></textarea>
                                   <button 
    onClick={generateQuickFix} 
    disabled={loadingAI} 
    className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700"
>
    {loadingAI ? "Analyzing Swing..." : "Get Quick Fix"}
</button>
                                </>
                            )}
                        </div>
                    )}

                    {/* AI RESPONSE OUTPUT */}
                    {aiResponse && (
                        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-fadeIn">
                            <h4 className="font-bold mb-2 text-slate-700">Coach Says:</h4>
                            <div className="prose prose-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                {aiResponse.split('**').map((part, i) => i % 2 === 1 ? <span key={i} className="font-bold text-black bg-yellow-100">{part}</span> : part)}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        )}

      </main>
    </div>
  );
}
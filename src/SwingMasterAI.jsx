// src/SwingMasterAI.jsx
import logoImage from './assets/Swingmaster_logo.jpg';
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown'; // <--- NEW IMPORT
import UpgradeModal from './UpgradeModal'; // <--- NEW IMPORT
import ProfileQuiz from './ProfileQuiz';
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
// src/SwingMasterAI.jsx
import { getGeminiAdvice } from './services/geminiService'; // Import the new function
// ... other imports


const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/6oU4gzdH6dpZ5KU4rE4AU03';

const STANDARD_CLUBS = [
  'Driver', '3 Wood', '5 Wood', '4 Hybrid',
  '4 Iron', '5 Iron', '6 Iron', '7 Iron', '8 Iron', '9 Iron',
  'PW', 'GW', 'SW', 'LW'
];

export default function SwingMasterAI({ isPro }) {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState('profile');
  const [rounds, setRounds] = useState([]);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

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
  

  // --- UPGRADE HANDLER ---
const handleUpgradeToPro = () => {
    // This is called when they click the button INSIDE the modal
    window.location.href = STRIPE_PAYMENT_URL;
};

// --- LOAD DATA ON MOUNT ---
  useEffect(() => {
    try {
      // 1. Load basic golf data
      const savedRounds = localStorage.getItem('swingmaster_rounds');
      const savedProfile = localStorage.getItem('swingmaster_profile');
      const savedDistances = localStorage.getItem('swingmaster_club_distances');
      
     // ... inside useEffect ...

      if (savedRounds) setRounds(JSON.parse(savedRounds));
      
      // --- NEW STRICTER CHECK ---
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
        
        // Only say "Complete" if there is actual text in the name AND a handicap
        if (parsed.name && parsed.name.trim() !== "" && parsed.handicap) {
            setIsProfileComplete(true);
        } else {
            setIsProfileComplete(false); // Force the Quiz if data is empty
        }
      } else {
        setIsProfileComplete(false); // No save file? Definitely show Quiz.
      }
      
      if (savedDistances) setClubDistances(JSON.parse(savedDistances));
      // ... rest of the code (Usage Limits, etc.) ...

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
  }, [aiUsesToday, lastUseDate]);


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
    // The complex fetch logic is now hidden in the service file
    const text = await getGeminiAdvice(prompt);
    setAiResponse(text);
  } catch (err) {
    // User-friendly error handling
    setAiResponse(`⚠️ **Connection Error:** ${err.message}. Please try again.`);
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
    // NEW:
if (!isPro) {
    setShowUpgradeModal(true); // <--- Just open the modal!
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
              <button onClick={() => setShowUpgradeModal(true)} className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-slate-900">
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
              { id: 'ai-hub', icon: Stethoscope, label: 'Swing Doctor' },
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

{/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="max-w-md mx-auto">
            {!isProfileComplete ? (
              // SHOW QUIZ IF NOT COMPLETE
              <ProfileQuiz 
                userProfile={userProfile} 
                setUserProfile={setUserProfile} 
                onComplete={() => {
                    setIsProfileComplete(true); // <--- Mark done ONLY when button is clicked
                    setActiveTab('ai-hub');
                }} 
              />
            ) : (
              // SHOW SUMMARY CARD IF COMPLETE
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto flex items-center justify-center mb-2">
                    <User size={40} className="text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold">{userProfile.name}</h2>
                <div className="flex justify-center gap-4 text-sm font-bold text-slate-500">
                    <span className="bg-slate-100 px-3 py-1 rounded-full">Hcp: {userProfile.handicap}</span>
                    <span className="bg-slate-100 px-3 py-1 rounded-full">Age: {userProfile.age}</span>
                </div>
                <div className="text-left bg-slate-50 p-4 rounded-lg border border-slate-100 mt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">My Bag / Equipment</p>
                    <p className="text-sm font-medium">{userProfile.equipment || "No equipment listed"}</p>
                </div>
                <div className="text-left bg-red-50 p-4 rounded-lg border border-red-100">
                    <p className="text-xs font-bold text-red-400 uppercase mb-1">The "Big Miss"</p>
                    <p className="text-sm font-medium text-slate-700">{userProfile.weaknesses || "None listed"}</p>
                </div>
                <button 
                    onClick={() => {
                        // Reset profile AND the completion flag
                        setUserProfile({ name: '', age: '', handicap: '', strengths: '', weaknesses: '', equipment: '' });
                        setIsProfileComplete(false); 
                    }}
                    className="text-sm text-slate-400 underline hover:text-red-500"
                >
                    Reset Profile & Retake Quiz
                </button>
              </div>
            )}
          </div>
        )}

    {/* SWING DOCTOR TAB (AI HUB) */}
        {activeTab === 'ai-hub' && (
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 animate-fadeIn">
                
                {/* LEFT SIDE: THE "MEDICAL CHART" (MENU) */}
                <div className="md:w-1/3 space-y-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                            <Stethoscope className="text-green-600" /> Treatment Plan
                        </h3>
                        <div className="space-y-3">
                            {[
                                { id: 'trainer', label: 'Daily Trainer', icon: '🏋️', desc: 'Custom practice routine' },
                                { id: 'caddie', label: 'Smart Caddie', icon: '⛳', desc: 'Club & shot advice' },
                                { id: 'distances', label: 'Bag Mapping', icon: '📏', desc: 'Track your yardages' },
                                { id: 'fix', label: 'Swing 911', icon: '🚑', desc: 'Emergency fix', locked: !isPro }
                            ].map((tool) => (
                                <button 
                                    key={tool.id}
                                    onClick={() => { setAiTool(tool.id); setAiResponse(null); }}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                                        ${aiTool === tool.id 
                                            ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500' 
                                            : 'border-slate-100 hover:border-green-300 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl bg-white p-2 rounded-lg shadow-sm border border-slate-100">{tool.icon}</span>
                                        <div>
                                            <div className={`font-bold ${aiTool === tool.id ? 'text-green-800' : 'text-slate-700'}`}>{tool.label}</div>
                                            <div className="text-xs text-slate-400 font-medium">{tool.desc}</div>
                                        </div>
                                    </div>
                                    {tool.locked && <Lock size={16} className="text-slate-300 group-hover:text-red-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* PRO TIP CARD */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg bg-gradient-to-br from-slate-900 to-slate-800">
                        <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-sm uppercase tracking-wide">
                            <Sparkles size={14}/> Pro Tip
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            "Amateurs practice until they get it right. Professionals practice until they can't get it wrong."
                        </p>
                    </div>
                </div>

                {/* RIGHT SIDE: THE "PRESCRIPTION PAD" (INPUT & OUTPUT) */}
                <div className="md:w-2/3">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                        
                        {/* TOOL HEADERS */}
                        <div className="mb-8 border-b border-slate-100 pb-6">
                            {aiTool === 'trainer' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Daily Practice Generator</h2>
                                    <p className="text-slate-500">Based on your <strong>{userProfile.equipment || "Setup"}</strong> and current Stats.</p>
                                </div>
                            )}
                            {aiTool === 'caddie' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Smart Caddie</h2>
                                    <p className="text-slate-500">Enter your conditions to get the perfect club recommendation.</p>
                                </div>
                            )}
                            {aiTool === 'distances' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Bag Mapping</h2>
                                    <p className="text-slate-500">Log your carry distances to help the AI make better choices.</p>
                                </div>
                            )}
                            {aiTool === 'fix' && (
                                <div>
                                    <h2 className="text-2xl font-bold text-red-600 mb-2 flex items-center gap-2">
                                        <AlertCircle className="fill-red-100"/> Emergency Fix
                                    </h2>
                                    <p className="text-slate-500">Mid-round meltdown? Describe the miss, get a band-aid.</p>
                                </div>
                            )}
                        </div>

                        {/* INPUT FORMS (Unchanged Logic, just container styling) */}
                        <div className="space-y-6">
                            {/* 1. TRAINER INPUT */}
                            {aiTool === 'trainer' && (
                                <button 
                                    onClick={generateDataDrivenPlan} 
                                    disabled={loadingAI} 
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex justify-center items-center gap-2"
                                >
                                    {loadingAI ? "Analyzing Stats..." : "Generate Today's Plan"} 
                                    {!loadingAI && <Sparkles size={18}/>}
                                </button>
                            )}

                            {/* 2. CADDIE INPUT */}
                            {aiTool === 'caddie' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Distance to Pin</label>
                                            <input type="number" placeholder="150" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-green-500 outline-none" onChange={e => setCaddieData({...caddieData, distance: e.target.value})} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Wind</label>
                                            <select className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-green-500 outline-none" onChange={e => setCaddieData({...caddieData, wind: e.target.value})}>
                                                <option value="calm">Calm</option>
                                                <option value="helping">Helping (Tail)</option>
                                                <option value="hurting">Hurting (Head)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={generateCaddieAdvice} disabled={loadingAI} className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-green-200 transition-all active:scale-95">
                                        {loadingAI ? "Consulting Caddie..." : "What should I hit?"}
                                    </button>
                                </div>
                            )}

                            {/* 3. DISTANCES INPUT */}
                            {aiTool === 'distances' && (
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <select className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" onChange={e => setNewDistanceEntry({...newDistanceEntry, club: e.target.value})}>
                                            <option>Select Club</option>
                                            {STANDARD_CLUBS.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                        <input type="number" placeholder="Yards" className="w-32 p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg" onChange={e => setNewDistanceEntry({...newDistanceEntry, carry: e.target.value})} />
                                    </div>
                                    <button onClick={handleSaveDistance} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700">Log Shot Data</button>
                                    {renderSummaryTable()}
                                </div>
                            )}

                            {/* 4. FIX MY SHOT INPUT */}
                            {aiTool === 'fix' && (
                                !isPro ? (
                                    <div className="text-center py-10 px-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Lock size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-2">Pro Access Only</h3>
                                        <p className="text-slate-500 mb-6 max-w-sm mx-auto">The Emergency Caddie is reserved for Pro members. Unlock it to save your round.</p>
                                        <button onClick={handleUpgradeToPro} className="bg-amber-400 hover:bg-amber-300 text-slate-900 px-8 py-3 rounded-full font-bold shadow-lg shadow-amber-200 transition-all transform hover:scale-105">
                                            Unlock for $49
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <textarea 
                                            className="w-full p-4 bg-red-50 border border-red-100 rounded-xl focus:ring-2 focus:ring-red-500 outline-none min-h-[120px]" 
                                            placeholder="Example: I'm slicing my driver, or I keep topping my irons..." 
                                            onChange={e => setFixInput(e.target.value)}
                                        ></textarea>
                                        <button onClick={generateQuickFix} disabled={loadingAI} className="w-full bg-red-600 hover:bg-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-95">
                                            {loadingAI ? "Diagnosing..." : "Fix My Swing"}
                                        </button>
                                    </div>
                                )
                            )}
                        </div>

                        {/* AI RESPONSE AREA */}
                        {aiResponse && (
                            <div className="mt-8 pt-8 border-t border-slate-100 animate-fadeIn">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <User className="text-green-600" size={20}/>
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">Swing Doctor Analysis</div>
                                        <div className="text-xs text-slate-400">Just now</div>
                                    </div>
                                </div>
                                <div className="prose prose-slate max-w-none p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed">
                                    <ReactMarkdown>{aiResponse}</ReactMarkdown>
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
            </div>
        )}

      </main>
      {/* UPGRADE MODAL - Lives here, always ready to pop up */}
      <UpgradeModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        onUpgrade={handleUpgradeToPro} 
      />
    </div>
  );
}
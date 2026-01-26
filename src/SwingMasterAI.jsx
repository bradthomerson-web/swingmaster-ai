// src/SwingMasterAI.jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Sparkles, Plus, TrendingUp, Trophy, Calendar, Target, User, Save, Navigation, Zap, Lock, CreditCard, Locate, Stethoscope } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UpgradeModal from './UpgradeModal'; 

const STRIPE_CHECKOUT_URL = "https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00"; 
const apiKey = "AIzaSyBhb9KGlAH6xhu0TaFv1xAWDjR1ORaXcGI"; // ⚠️ Make sure your Gemini API Key is here

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

  // --- AI STATE ---
  const [aiTool, setAiTool] = useState('trainer');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [caddieData, setCaddieData] = useState({ distance: '', wind: 'calm', lie: 'fairway' });
  const [fixInput, setFixInput] = useState('');

  // --- GPS STATE ---
  const [gpsActive, setGpsActive] = useState(false);
  const [startCoords, setStartCoords] = useState(null);
  const [currentDistance, setCurrentDistance] = useState(0);
  const [gpsError, setGpsError] = useState(null);
  const [shotHistory, setShotHistory] = useState([]); 
  const [selectedClub, setSelectedClub] = useState('Driver');

  const handleUpgradeToPro = () => window.location.href = STRIPE_CHECKOUT_URL;

  // --- LOAD DATA ---
  useEffect(() => {
    try {
      const savedRounds = localStorage.getItem('swingmaster_rounds');
      const savedProfile = localStorage.getItem('swingmaster_profile');
      const savedDistances = localStorage.getItem('swingmaster_club_distances');
      if (savedRounds) setRounds(JSON.parse(savedRounds));
      if (savedProfile) setUserProfile(JSON.parse(savedProfile));
      if (savedDistances) setClubDistances(JSON.parse(savedDistances));
    } catch (err) { console.error(err); }
  }, []);

  // --- SAVE EFFECTS ---
  useEffect(() => localStorage.setItem('swingmaster_rounds', JSON.stringify(rounds)), [rounds]);
  useEffect(() => localStorage.setItem('swingmaster_profile', JSON.stringify(userProfile)), [userProfile]);
  useEffect(() => localStorage.setItem('swingmaster_club_distances', JSON.stringify(clubDistances)), [clubDistances]);

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

  // --- AI LOGIC ---
  const callGemini = async (prompt) => {
    setLoadingAI(true);
    setAiResponse(null);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      setAiResponse(text);
    } catch (err) {
      setAiResponse("Connection Error. Try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const generateDataDrivenPlan = () => {
    const prompt = `
      Act as a PGA Coach. Create a 45-minute practice plan.
      MY STATS: Score Avg ${averages.score}, Putts ${averages.putts}.
      MY KEY WEAKNESS: "${userProfile.weaknesses}".
      EQUIPMENT: ${userProfile.equipment || 'Standard Range'}.
      For EVERY drill, you MUST provide a YouTube Search link in this format:
      [▶️ Watch Drill Demo](https://www.youtube.com/results?search_query=NAME_OF_DRILL_HERE+golf+drill)
      Format with clear headings.
    `;
    callGemini(prompt);
  };

  const generateCaddieAdvice = () => {
    const prompt = `Act as a Tour Caddie. Shot: ${caddieData.distance} yards, Wind: ${caddieData.wind}, Lie: ${caddieData.lie}. Recommendation?`;
    callGemini(prompt);
  };

  const generateQuickFix = () => {
    if(!isPro) { setShowUpgradeModal(true); return; }
    if(!fixInput) return;
    const prompt = `
        CRITICAL: EMERGENCY GOLF MODE.
        User Issue: "${fixInput}"
        Provide a survival guide for the rest of the round.
        Format:
        ## 🛑 SETUP FIX
        (1 clear bullet point adjustment)
        ## 🏌️‍♂️ SWING THOUGHTS
        1. (First simple thought)
        2. (Second simple thought)
        ## 🏠 POST-ROUND DRILL
        (Name of one drill to fix this permanently)
        Keep it concise.
    `;
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

  // --- RESTORED: GPS RENDER FUNCTION ---
  const renderGPS = () => (
    <div className="max-w-xl mx-auto space-y-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 relative">
            <h2 className="font-bold text-slate-900 mb-2 flex justify-center gap-2"><Navigation className="text-blue-600"/> GPS Measure</h2>
            <div className="text-7xl font-black text-slate-900 mb-1">{currentDistance}</div>
            <div className="text-slate-400 font-bold mb-6">YARDS</div>

             {/* Club Selection for GPS */}
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
      
      {/* HEADER */}
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
        
        {/* TAB NAV (Updated with GPS) */}
        <div className="flex justify-around bg-slate-800 p-2">
            {[
              { id: 'dashboard', icon: Trophy, label: 'Stats' },
              { id: 'rounds', icon: Calendar, label: 'Log' },
              { id: 'gps', icon: Navigation, label: 'GPS' }, // <--- RESTORED
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'ai-hub', icon: Stethoscope, label: 'Coach' },
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

        {/* GPS TAB (Restored Content) */}
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

            {/* BIG MISS INPUT */}
            <div className="mb-6">
                <label className="text-xs font-bold text-red-500 uppercase mb-1 block">My Key Miss / Focus Area</label>
                <input type="text" value={userProfile.weaknesses} onChange={(e) => setUserProfile({...userProfile, weaknesses: e.target.value})} className="w-full p-3 bg-red-50 border border-red-100 rounded-lg text-sm" placeholder="e.g. Slice off the tee, Fat iron shots..." />
            </div>

            <button onClick={() => setActiveTab('dashboard')} className="bg-slate-900 text-white px-6 py-2 rounded font-bold"><Save size={18} className="inline mr-2"/> Save Profile</button>
          </div>
        )}

    {/* SWING DOCTOR TAB (AI HUB) */}
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
                                { id: 'caddie', label: 'Smart Caddie', icon: '⛳', desc: 'Club & shot advice' },
                                { id: 'distances', label: 'Bag Mapping', icon: '📏', desc: 'Track your yardages' },
                                { id: 'fix', label: 'Swing 911', icon: '🚑', desc: 'Emergency fix', locked: !isPro }
                            ].map((tool) => (
                                <button key={tool.id} onClick={() => { setAiTool(tool.id); setAiResponse(null); }} className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${aiTool === tool.id ? 'border-green-500 bg-green-50 shadow-md ring-1 ring-green-500' : 'border-slate-100 hover:border-green-300 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-3"><span className="text-2xl bg-white p-2 rounded-lg shadow-sm border border-slate-100">{tool.icon}</span><div><div className={`font-bold ${aiTool === tool.id ? 'text-green-800' : 'text-slate-700'}`}>{tool.label}</div><div className="text-xs text-slate-400 font-medium">{tool.desc}</div></div></div>
                                    {tool.locked && <Lock size={16} className="text-slate-300 group-hover:text-red-400" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="md:w-2/3">
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm min-h-[500px]">
                        {/* INPUT FORMS */}
                        <div className="space-y-6">
                            {aiTool === 'trainer' && <button onClick={generateDataDrivenPlan} disabled={loadingAI} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-200 transition-all transform active:scale-95 flex justify-center items-center gap-2">{loadingAI ? "Analyzing Stats..." : "Generate Today's Plan"} {!loadingAI && <Sparkles size={18}/>}</button>}
                            
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

                        {/* AI RESPONSE */}
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
      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} onUpgrade={handleUpgradeToPro} />
    </div>
  );
}
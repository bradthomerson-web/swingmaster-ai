// src/SwingMasterAI.jsx
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
} from 'lucide-react';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/14AbJ1dH699J2yIaQ24AU00';

// Inside export default function SwingMasterAI() { … }
function handleUpgradeToPro() {
    console.log('➡️ Redirecting to Stripe checkout…');
    window.location.href = STRIPE_PAYMENT_URL;
}

const STANDARD_CLUBS = [
  'Driver',
  '3 Wood',
  '5 Wood',
  '2 Iron',
  '3 Iron',
  '4 Iron',
  '5 Iron',
  '6 Iron',
  '7 Iron',
  '8 Iron',
  '9 Iron',
  'PW', // Pitching Wedge
  'GW', // Gap Wedge
  'SW', // Sand Wedge
  'LW', // Lob Wedge
];

export default function SwingMasterAI() {
  // Which tab is active
  const [activeTab, setActiveTab] = useState('profile'); // start on profile

  // --- Data state ---
  const [rounds, setRounds] = useState([]);

  // --- Profile state ---
  const [userProfile, setUserProfile] = useState({
    name: '',
    age: '',
    handicap: '',
    strengths: '',
    weaknesses: '',
    equipment: '',
 });

 // --- Club Distance State (PRO Feature) ---
  const [clubDistances, setClubDistances] = useState([]);
  const [newDistanceEntry, setNewDistanceEntry] = useState({
    club: '',
    carry: '',
    total: '',
  });

  const [summaryDistances, setSummaryDistances] = useState({});

  // --- Round entry form state ---
  const [newRound, setNewRound] = useState({
    date: '',
    course: '',
    score: '',
    putts: '',
    fairways: '',
    gir: '',
  });

  // --- AI state ---
  const [aiTool, setAiTool] = useState('trainer');
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);
  const [caddieData, setCaddieData] = useState({
    distance: '',
    wind: 'calm',
    lie: 'fairway',
  });

  // --- Free-tier / PRO Subscription State ---
  const FREE_DAILY_AI_LIMIT = 1;
  const [aiUsesToday, setAiUsesToday] = useState(0);
  const [lastUseDate, setLastUseDate] = useState(null);
  const [isPro, setIsPro] = useState(false); // default: free user

  // 🔹 When user upgrades to PRO → just redirect to Stripe
  const handleUpgradeToPro = () => {
    console.log('➡️ Redirecting to Stripe checkout…');
    window.location.href = STRIPE_PAYMENT_URL;
  };

  // --- Load saved data from localStorage on first render ---
 // --- Load Club Distances from localStorage on first render ---
  useEffect(() => {
    try {
      const savedDistances = window.localStorage.getItem(
        'swingmaster_club_distances'
      );
      if (savedDistances) {
        console.log('  → found club distances:', savedDistances);
        setClubDistances(JSON.parse(savedDistances));
      }
    } catch (err) {
      console.error('Error loading club distances:', err);
    }
  }, []); // Empty array runs only once

// --- Persist clubDistances when they change ---
useEffect(() => {
  try {
    console.log('💾 Saving club distances to localStorage...', clubDistances);
    window.localStorage.setItem(
      'swingmaster_club_distances',
      JSON.stringify(clubDistances)
    );
  } catch (err) {
    console.error('Error saving club distances to localStorage:', err);
  }
}, [clubDistances]);

// --- Calculate Summary Distances whenever clubDistances array changes ---
useEffect(() => {
  console.log('🔄 Recalculating summary distances...');
  
  // Find the highest recorded carry distance for each club (e.g., if you hit 7 Iron 150y, 148y, 155y, it picks 155)
  const summaryMap = clubDistances.reduce((acc, entry) => {
    const clubName = entry.club.trim(); 
    const carry = Number(entry.carry); 

    // Only keep the longest recorded carry for that club
    if (carry > 0 && carry > (acc[clubName] || 0)) {
      acc[clubName] = carry;
    }
    return acc;
  }, {});

  // Update the dedicated summary state
  setSummaryDistances(summaryMap);
  
}, [clubDistances]); // 📢 Reruns every time you save a new distance entry
 
  useEffect(() => {
    try {
      console.log('📂 Loading data from localStorage...');
      const savedRounds = window.localStorage.getItem('swingmaster_rounds');
      const savedProfile = window.localStorage.getItem('swingmaster_profile');

      if (savedRounds) {
        console.log('  → found rounds:', savedRounds);
        setRounds(JSON.parse(savedRounds));
      }
      if (savedProfile) {
        console.log('  → found profile:', savedProfile);
        setUserProfile(JSON.parse(savedProfile));
      }
    } catch (err) {
      console.error('Error loading saved SwingMaster data:', err);
    }
  }, []);

  // --- Load free-tier usage on startup ---
  useEffect(() => {
    const today = new Date().toDateString();

    const savedUses = localStorage.getItem('ai_uses_today');
    const savedDate = localStorage.getItem('ai_last_use_date');
    const savedPro = localStorage.getItem('ai_is_pro');

    if (savedDate !== today) {
      setAiUsesToday(0);
      setLastUseDate(today);
      localStorage.setItem('ai_last_use_date', today);
    } else {
      setAiUsesToday(Number(savedUses || 0));
      setLastUseDate(savedDate);
    }

    setIsPro(savedPro === 'true');
  }, []);

  // --- Persist rounds when they change ---
 useEffect(() => {
  try {
    console.log('💾 Saving rounds to localStorage...', rounds);
    window.localStorage.setItem(
      'swingmaster_rounds',
      JSON.stringify(rounds)
    );
  } catch (err) {
    console.error('Error saving rounds to localStorage:', err);
  }
}, [rounds]);

  // --- Persist profile when it changes ---
useEffect(() => {
  try {
    console.log('💾 Saving profile to localStorage...', userProfile);
    window.localStorage.setItem(
      'swingmaster_profile',
      JSON.stringify(userProfile)
    );
  } catch (err) {
    console.error('Error saving profile to localStorage:', err);
  }
}, [userProfile]);

  // Save AI usage whenever it changes
useEffect(() => {
  localStorage.setItem('ai_uses_today', aiUsesToday);
  localStorage.setItem('ai_last_use_date', lastUseDate);
}, [aiUsesToday, lastUseDate]);

// Save PRO status
useEffect(() => {
  localStorage.setItem('ai_is_pro', isPro);
}, [isPro]);

// --- Detect Stripe return ( ?pro=1 ) and unlock PRO ---
useEffect(() => {
  try {
    const url = new URL(window.location.href);
    const proFlag = url.searchParams.get('pro');

    if (proFlag === '1') {
      setIsPro(true);
      setAiUsesToday(0);
      setLastUseDate(new Date().toDateString());
      console.log('✅ PRO unlocked from URL parameter');

      localStorage.setItem('ai_is_pro', "true");
      localStorage.setItem('ai_uses_today', "0");
      localStorage.setItem('ai_last_use_date', new Date().toDateString());
      
      // OPTIONAL: Clean up the URL so a refresh doesn't re-trigger this
      window.history.replaceState({}, document.title, url.pathname);
    }
  } catch (err) {
    console.error('Error reading PRO flag from URL:', err);
  }
}, []);

  // --- Helpers ---
  const getAverages = () => {
    if (rounds.length === 0)
      return { score: '-', putts: '-', gir: '-', fairways: '-' };

    const sum = rounds.reduce(
      (acc, curr) => ({
        score: acc.score + Number(curr.score),
        putts: acc.putts + Number(curr.putts),
        gir: acc.gir + Number(curr.gir),
        fairways: acc.fairways + Number(curr.fairways),
      }),
      { score: 0, putts: 0, gir: 0, fairways: 0 }
    );

    return {
      score: (sum.score / rounds.length).toFixed(1),
      putts: (sum.putts / rounds.length).toFixed(1),
      gir: (sum.gir / rounds.length).toFixed(1),
      fairways: (sum.fairways / rounds.length).toFixed(1),
    };
  };

  const averages = getAverages();

  const getClubRecommendation = (targetDistance) => {
  const target = parseInt(targetDistance, 10);
  if (target <= 0 || isNaN(target)) return null;

  // Convert the distances object into an array and sort it Longest to Shortest
  const distancesArray = Object.entries(summaryDistances);
  distancesArray.sort(([, distA], [, distB]) => distB - distA); 

  let bestClub = null;

  for (const [club, distance] of distancesArray) {
    if (distance >= target) {
      bestClub = club;
    } else {
      break; // Found the shortest club that works, or all remaining are too short
    }
  }

  if (bestClub) {
    return { club: bestClub, distance: summaryDistances[bestClub] };
  } else {
    return { club: 'N/A', distance: 'Too Far!' };
  }
};
  
  const handleSaveRound = () => {
    if (!newRound.score || !newRound.course) return;
    const round = { ...newRound, id: Date.now() };
    setRounds([round, ...rounds]);
    setNewRound({
      date: '',
      course: '',
      score: '',
      putts: '',
      fairways: '',
      gir: '',
    });
    setActiveTab('dashboard');
  };

const handleSaveDistance = () => {
    if (!newDistanceEntry.club || !newDistanceEntry.carry) return;

    // Create a new entry object
    const entry = {
      ...newDistanceEntry,
      id: Date.now(), // Unique ID
      carry: Number(newDistanceEntry.carry), // Ensure numbers are stored as numbers
      total: Number(newDistanceEntry.total),
    };

    // Use the functional state update to safely add the new entry
    setClubDistances((prevDistances) => [entry, ...prevDistances]);

    // Clear the form
    setNewDistanceEntry({
      club: '',
      carry: '',
      total: '',
    });
  };

  // --- API call helper ---
  const callGemini = async (prompt) => {
    setLoadingAI(true);
    setAiResponse(null);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
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

  // --- AI generators ---
  const generateDataDrivenPlan = () => {
    if (!userProfile.equipment) {
      alert('Please fill out your Equipment list in the Profile tab first.');
      setActiveTab('profile');
      return;
    }

    const prompt = `
      Act as a Data-Driven PGA Coach.
      
      1. MY STATS (Last ${rounds.length} rounds):
      ${
        rounds.length === 0
          ? 'No stats recorded yet. Focus on general fundamentals.'
          : `- Scoring Avg: ${averages.score}
      - Putts per Round: ${averages.putts}
      - Greens in Regulation: ${averages.gir}
      - Fairways Hit: ${averages.fairways}`
      }
      
      2. MY PROFILE:
      - Name: ${userProfile.name}
      - Age: ${userProfile.age}
      - Handicap: ${userProfile.handicap}
      - Self-Reported Strengths: ${userProfile.strengths}
      - Self-Reported Weaknesses: ${userProfile.weaknesses}
      
      3. EQUIPMENT AVAILABLE TODAY:
      - ${userProfile.equipment}
      
      TASK:
      Create a highly specific 2-hour practice routine.
      - Compare my Stats vs Weaknesses.
      - ONLY suggest drills that can be done with the 'Equipment Available'.
      - Structure in Markdown with time blocks.
    `;
// FREE TIER LIMIT CHECK
if (!isPro && aiUsesToday >= FREE_DAILY_AI_LIMIT) {
  alert("You've used your free AI session for today. Upgrade to PRO for unlimited access.");
  return;
}

// Allowed → count today's usage
setAiUsesToday(prev => prev + 1);
    callGemini(prompt);
  };

  const generateCaddieAdvice = () => {
    const prompt = `Act as a Tour Caddie for a ${
      userProfile.handicap || '15'
    } handicap golfer. 
    Situation: ${caddieData.distance} yards, Wind: ${
      caddieData.wind
    }, Lie: ${caddieData.lie}.
    Give me a club recommendation and specific strategy.`;
   

    // FREE TIER LIMIT CHECK
if (!isPro && aiUsesToday >= FREE_DAILY_AI_LIMIT) {
  alert("You've used your free AI session for today. Upgrade to PRO for unlimited access.");
  return;
}

// Allowed → count today's usage
setAiUsesToday(prev => prev + 1);
    callGemini(prompt);
  };

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fadeIn">
      {rounds.length === 0 ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            Welcome to SwingMaster AI
          </h3>
          <p className="text-slate-500 max-w-md mx-auto mt-2 mb-6">
            Start by logging your first round or filling out your profile to
            get AI insights.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg hover:bg-slate-200"
            >
              Fill Profile
            </button>
            <button
              onClick={() => setActiveTab('rounds')}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
            >
              Log Round
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1">
              <Trophy size={14} /> Scoring Avg
            </div>
            <div className="text-3xl font-bold">{averages.score}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold mb-1">
              <Target size={14} /> Putts / Rnd
            </div>
            <div className="text-3xl font-bold text-slate-800">
              {averages.putts}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold mb-1">
              <MapPin size={14} /> G.I.R.
            </div>
            <div className="text-3xl font-bold text-slate-800">
              {averages.gir}
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs uppercase font-bold mb-1">
              <TrendingUp size={14} /> Fairways
            </div>
            <div className="text-3xl font-bold text-slate-800">
              {averages.fairways}
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-xl font-bold mb-1">
            Ready to train{userProfile.name ? `, ${userProfile.name}` : ''}?
          </h3>
          <p className="text-blue-100 text-sm max-w-md">
            {userProfile.equipment
              ? "We'll build a routine based on your listed equipment and stats."
              : 'Go to Profile > Equipment to enable custom training plans.'}
          </p>
        </div>
        <button
          onClick={() => {
            setActiveTab('ai-hub');
            setAiTool('trainer');
          }}
          className="bg-white text-blue-700 px-6 py-3 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
        >
          Go to AI Coach
        </button>
      </div>

      {rounds.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Recent Rounds</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Course</th>
                <th className="p-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((round) => (
                <tr key={round.id} className="border-t border-slate-50">
                  <td className="p-3 text-slate-600">{round.date}</td>
                  <td className="p-3 text-slate-600">{round.course}</td>
                  <td className="p-3 font-bold text-slate-900 bg-slate-50">
                    {round.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
  <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
      <div className="p-3 bg-slate-100 rounded-full">
        <User className="text-slate-700" size={24} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Golfer Profile</h2>
        <p className="text-slate-500 text-sm">
          Update this daily to get accurate AI recommendations.
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
          Name
        </label>
        <input
          type="text"
          value={userProfile.name}
          onChange={(e) => {
            const next = { ...userProfile, name: e.target.value };
            console.log('🧠 Updating userProfile.name →', next);
            setUserProfile(next);
          }}
          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Enter your name"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Age
          </label>
          <input
            type="text"
            value={userProfile.age}
            onChange={(e) =>
              setUserProfile({ ...userProfile, age: e.target.value })
            }
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. 35"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
            Handicap
          </label>
          <input
            type="text"
            value={userProfile.handicap}
            onChange={(e) =>
              setUserProfile({ ...userProfile, handicap: e.target.value })
            }
            className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. 18"
          />
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div>
        <label className="block text-xs font-bold text-green-600 uppercase mb-1 flex items-center gap-2">
          <TrendingUp size={14} /> Current Strengths
        </label>
        <textarea
          value={userProfile.strengths}
          onChange={(e) =>
            setUserProfile({ ...userProfile, strengths: e.target.value })
          }
          className="w-full p-3 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-green-500 outline-none transition-all bg-green-50/30"
          placeholder="e.g. Driving distance, short putts..."
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-red-600 uppercase mb-1 flex items-center gap-2">
          <Activity size={14} /> Current Weaknesses
        </label>
        <textarea
          value={userProfile.weaknesses}
          onChange={(e) =>
            setUserProfile({ ...userProfile, weaknesses: e.target.value })
          }
          className="w-full p-3 border border-slate-200 rounded-lg h-24 focus:ring-2 focus:ring-red-500 outline-none transition-all bg-red-50/30"
          placeholder="e.g. Bunker shots, slicing driver..."
        />
      </div>

      <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
        <label className="block text-xs font-bold text-blue-600 uppercase mb-1 flex items-center gap-2">
          <Box size={14} /> Equipment Available Today
        </label>
        <input
          type="text"
          value={userProfile.equipment}
          onChange={(e) =>
            setUserProfile({ ...userProfile, equipment: e.target.value })
          }
          className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          placeholder="e.g. Just a net, or Full Range, or Putting Mat only..."
        />
        <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
          <AlertCircle size={12} /> The AI will only suggest drills using this
          gear.
        </p>
      </div>
    </div>

    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
      <button
        onClick={() => setActiveTab('dashboard')}
        className="bg-slate-900 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-slate-800 transition-all"
      >
        <Save size={18} /> Save Profile
      </button>
    </div>
  </div>
);

  const renderRoundsInput = () => (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Log a Round</h2>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Date
            </label>
            <input
              type="date"
              value={newRound.date}
              onChange={(e) =>
                setNewRound({ ...newRound, date: e.target.value })
              }
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Course
            </label>
            <input
              type="text"
              value={newRound.course}
              onChange={(e) =>
                setNewRound({ ...newRound, course: e.target.value })
              }
              className="w-full p-2 border rounded mt-1"
              placeholder="Course Name"
            />
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Score
            </label>
            <input
              type="number"
              value={newRound.score}
              onChange={(e) =>
                setNewRound({ ...newRound, score: e.target.value })
              }
              className="w-full p-2 border rounded mt-1 font-bold text-center"
              placeholder="--"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              Putts
            </label>
            <input
              type="number"
              value={newRound.putts}
              onChange={(e) =>
                setNewRound({ ...newRound, putts: e.target.value })
              }
              className="w-full p-2 border rounded mt-1 text-center"
              placeholder="--"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              FIR
            </label>
            <input
              type="number"
              value={newRound.fairways}
              onChange={(e) =>
                setNewRound({ ...newRound, fairways: e.target.value })
              }
              className="w-full p-2 border rounded mt-1 text-center"
              placeholder="--"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase">
              GIR
            </label>
            <input
              type="number"
              value={newRound.gir}
              onChange={(e) =>
                setNewRound({ ...newRound, gir: e.target.value })
              }
              className="w-full p-2 border rounded mt-1 text-center"
              placeholder="--"
            />
          </div>
        </div>
        <button
          onClick={handleSaveRound}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex justify-center gap-2"
        >
          <Plus size={18} /> Add to Stats
        </button>
      </div>
    </div>
  );

  const renderAIHub = () => (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6">
      {/* Sidebar */}
      <div className="lg:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-grow lg:flex-grow-0">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Sparkles className="text-amber-500" /> AI Coach
          </h2>

          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg mb-6">
            <button
              onClick={() => setAiTool('trainer')}
              className={`flex-1 py-2 text-xs font-bold rounded uppercase transition-all ${
                aiTool === 'trainer'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Trainer
            </button>
            <button
              onClick={() => setAiTool('caddie')}
              className={`flex-1 py-2 text-xs font-bold rounded uppercase transition-all ${
                aiTool === 'caddie'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
             Caddie
            </button>
            {/* 🎯 NEW BUTTON ADDED HERE 🎯 */}
            <button
              onClick={() => setAiTool('distances')}
              className={`flex-1 py-2 text-xs font-bold rounded uppercase transition-all ${
                aiTool === 'distances'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Distances
            </button>
          </div>

          {aiTool === 'trainer' && (
            <div className="space-y-4">
              <div className="text-xs bg-slate-50 border border-slate-100 p-3 rounded space-y-2 text-slate-600">
                {userProfile.equipment ? (
                  <>
                    <div className="flex justify-between">
                      <span>Equipment:</span>
                      <span className="font-bold text-slate-900 truncate w-32 text-right">
                        {userProfile.equipment}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rounds Logged:</span>
                      <span className="font-bold text-slate-900">
                        {rounds.length}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-red-500 flex items-center gap-1 font-bold">
                    <AlertCircle size={12} /> Profile Incomplete
                  </div>
                )}
                <button
                  onClick={() => setActiveTab('profile')}
                  className="text-blue-600 hover:underline w-full text-left mt-1 text-[10px] uppercase font-bold"
                >
                  Edit Profile
                </button>
              </div>
              <button
                onClick={generateDataDrivenPlan}
                disabled={loadingAI}
                className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center gap-2 transition-all shadow-md hover:shadow-lg"
              >
                {loadingAI ? "Building Plan..." : "Generate Today's Plan"}
              </button>
            </div>
          )}

          {aiTool === 'caddie' && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Distance
                </label>
                <input
                  type="number"
                  value={caddieData.distance}
                  onChange={(e) =>
                    setCaddieData({ ...caddieData, distance: e.target.value }) }
                  className="w-full p-2 border rounded text-sm"
                  placeholder="150"
                />
              </div>
              <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 text-center">
      <p className="text-sm font-bold text-blue-700 uppercase mb-1">
        Your Club Recommendation
      </p>
      
      {getClubRecommendation(caddieData.distance) ? (
        <>
          <h3 className="text-3xl font-bold text-slate-900">
            {getClubRecommendation(caddieData.distance).club}
          </h3>
          <p className="text-sm text-slate-600">
            Carry: {getClubRecommendation(caddieData.distance).distance} Yds
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-600">Enter distance to see club.</p>
      )}
    </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">
                  Wind
                </label>
                <select
                  value={caddieData.wind}
                  onChange={(e) =>
                    setCaddieData({ ...caddieData, wind: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm bg-white"
                >
                  <option value="calm">Calm</option>
                  <option value="helping">Tailwind</option>
                  <option value="hurting">Headwind</option>
                </select>
              </div>
              <button
                onClick={generateCaddieAdvice}
                disabled={loadingAI}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800"
              >
                {loadingAI ? 'Thinking...' : 'Get Advice'}
              </button>
            </div>
          )}
          {/* 🎯 NEW: Distances Input Form (PRO Feature) 🎯 */}
          {aiTool === 'distances' && (
            <div className="space-y-4">
              {!isPro ? (
                <div className="bg-amber-100 border border-amber-300 p-4 rounded-lg text-center">
                  <h3 className="font-bold text-lg text-amber-800 mb-2">
                    PRO Feature Unlocked!
                  </h3>
                  <p className="text-sm text-amber-700 mb-4">
                    Track your club distances over time to get laser-focused AI
                    feedback.
                  </p>
                  <button
                    onClick={handleUpgradeToPro}
                    className="w-full bg-amber-500 text-white py-2 rounded-lg font-bold hover:bg-amber-600 transition-colors"
                  >
                    Upgrade to PRO Now
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-3 text-lg">
                      Log a Club Shot
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">
        Club Name
    </label>
    <select
        // 📢 Check this line: We are setting the state correctly here
        value={newDistanceEntry.club}
        onChange={(e) =>
            setNewDistanceEntry({
                ...newDistanceEntry,
                club: e.target.value,
            })
        }
        className="w-full p-2 border rounded text-sm bg-white"
    >
        <option value="" disabled>-- Select Club --</option>
        {/* 📢 Check this line: We map over the array defined in Step 1 */}
        {STANDARD_CLUBS.map((club) => (
            <option key={club} value={club}>
                {club}
            </option>
        ))}
    </select>
</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Carry (Yds)
                          </label>
                          <input
                            type="number"
                            value={newDistanceEntry.carry}
                            onChange={(e) =>
                              setNewDistanceEntry({
                                ...newDistanceEntry,
                                carry: e.target.value,
                              })
                            }
                            className="w-full p-2 border rounded text-sm text-center"
                            placeholder="150"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Total (Yds)
                          </label>
                          <input
                            type="number"
                            value={newDistanceEntry.total}
                            onChange={(e) =>
                              setNewDistanceEntry({
                                ...newDistanceEntry,
                                total: e.target.value,
                              })
                            }
                            className="w-full p-2 border rounded text-sm text-center"
                            placeholder="165"
                          />
                        </div>
                      </div>
                      <button
                        onClick={handleSaveDistance}
                        className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 flex justify-center items-center gap-2 transition-colors"
                      >
                        <Plus size={18} /> Add Distance
                      </button>
                    </div>
                  </div>

                  {/* Club Distance History Table */}
                  {clubDistances.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                      <div className="p-4 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800">
                          Recorded Distances
                        </h3>
                      </div>
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="p-3">Club</th>
                            <th className="p-3">Carry</th>
                            <th className="p-3">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clubDistances.map((d) => (
                            <tr
                              key={d.id}
                              className="border-t border-slate-50"
                            >
                              <td className="p-3 text-slate-900 font-semibold">
                                {d.club}
                              </td>
                              <td className="p-3 text-slate-600">
                                {d.carry} Yds
                              </td>
                              <td className="p-3 text-slate-600">
                                {d.total} Yds
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 overflow-y-auto relative min-h-[500px]">
        {loadingAI && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-blue-600 mb-4" />
            <p className="text-slate-600 font-bold animate-pulse">
              Analyzing Stats &amp; Equipment...
            </p>
          </div>
        )}

        {aiResponse ? (
          <div className="prose prose-slate max-w-none">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-2xl font-bold text-slate-900 m-0">
                {aiTool === 'trainer' ? 'Custom Daily Routine' : 'Caddie Insight'}
              </h3>
              <Share2
                size={20}
                className="text-slate-400 cursor-pointer hover:text-blue-500"
              />
            </div>
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {aiResponse.split('**').map((part, i) =>
                i % 2 === 1 ? (
                  <span
                    key={i}
                    className="font-bold text-slate-900 bg-yellow-100 px-1 rounded"
                  >
                    {part}
                  </span>
                ) : (
                  part
                )
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-300">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <Sparkles size={48} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-400">AI Coach Ready</h3>
            <p className="max-w-xs text-center mt-2 text-slate-400">
              Select "Trainer" and hit Generate to build a routine based on your{' '}
              <span className="text-slate-500 font-semibold">Equipment</span> and{' '}
              <span className="text-slate-500 font-semibold">Stats</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );

// --- Main layout & navigation ---
return (
  // 1. **THE FINAL FIX IS HERE:** max-w-7xl mx-auto centers the entire block
  <div className="bg-slate-50 font-sans text-slate-900 max-w-7xl mx-auto w-full min-h-screen">

    {/* HEADER: We only need the background color here now */}
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="px-4 md:px-6 py-3 flex justify-between items-center">
        
        {/* Left side: logo + title */}
        <div className="flex items-center gap-2">
          <Activity className="text-green-500" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">
            SwingMaster <span className="text-green-500">AI</span>
          </h1>
        </div>

        {/* Right side: status pill + upgrade + nav */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            {/* Status pill */}
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${
                isPro
                  ? 'bg-amber-400 text-slate-900'       // PRO look
                  : 'bg-slate-700 text-slate-100'       // FREE look
              }`}
            >
              {isPro
                ? 'PRO MEMBER'
                : `FREE • ${Math.max(FREE_DAILY_AI_LIMIT - aiUsesToday, 0)} AI left`}
            </span>

            {/* Upgrade button only if NOT pro */}
            {!isPro && (
    <button
      onClick={handleUpgradeToPro}
      className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500 text-slate-900 hover:bg-emerald-400 transition-colors shadow-sm"
    >
      Upgrade to Pro
    </button>
  )}
          </div>

          {/* Nav tabs */}
          <nav className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {[
              { id: 'dashboard', icon: Trophy, label: 'Stats' },
              { id: 'rounds', icon: Calendar, label: 'Log' },
              { id: 'profile', icon: User, label: 'Profile' },
              { id: 'ai-hub', icon: Sparkles, label: 'AI Hub' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>

    {/* MAIN CONTENT SECTION: Remove all extra centering here, it's done at the root */}
    <main className="p-4 lg:p-6">
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'rounds' && renderRoundsInput()}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'ai-hub' && renderAIHub()}
    </main>
  </div>
);
}

import React, { useState, useEffect } from 'react';
import { Calculator, RotateCcw, Save } from 'lucide-react';

export default function HandicapCalculator() {
  // Initialize with 10 empty rounds
  const [rounds, setRounds] = useState(
    Array(10).fill({ score: '', rating: '', slope: '' })
  );
  const [handicap, setHandicap] = useState(null);

  // 1. Load saved data when component mounts
  useEffect(() => {
    const saved = localStorage.getItem('sm_handicap_rounds');
    if (saved) {
      setRounds(JSON.parse(saved));
    }
  }, []);

  // 2. Save data whenever the user types
  useEffect(() => {
    localStorage.setItem('sm_handicap_rounds', JSON.stringify(rounds));
  }, [rounds]);

  const updateRound = (index, field, value) => {
    const newRounds = [...rounds];
    newRounds[index] = { ...newRounds[index], [field]: value };
    setRounds(newRounds);
  };

  const calculateHandicap = () => {
    // Calculate differentials for every row that has numbers
    const differentials = rounds
      .map(r => {
        const s = parseFloat(r.score);
        const rt = parseFloat(r.rating);
        const sl = parseFloat(r.slope);
        if (!s || !rt || !sl) return null; // Skip incomplete rows
        return ((s - rt) * 113) / sl;
      })
      .filter(d => d !== null);

    if (differentials.length === 0) {
      alert("Please enter at least one full round (Score, Rating, Slope).");
      return;
    }

    // Average the differentials (Simple Average of entered rounds)
    const sum = differentials.reduce((acc, curr) => acc + curr, 0);
    const avg = sum / differentials.length;

    setHandicap(avg.toFixed(1));
  };

  const clearAll = () => {
    if(window.confirm("Clear all 10 rounds?")) {
        setRounds(Array(10).fill({ score: '', rating: '', slope: '' }));
        setHandicap(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-sm tracking-wide">
            <Calculator size={16} /> Free Tool
        </div>
        <button onClick={clearAll} className="text-xs text-slate-500 hover:text-red-400 flex items-center gap-1 transition-colors">
            <RotateCcw size={12}/> Clear List
        </button>
      </div>

      <h3 className="text-xl font-bold mb-4">Handicap Tracker (Last 10)</h3>
      
      {/* Table Header */}
      <div className="grid grid-cols-4 gap-2 mb-2 text-xs text-slate-400 font-bold uppercase text-center">
        <span className="text-left pl-2">#</span>
        <span>Score</span>
        <span>Rating</span>
        <span>Slope</span>
      </div>

      {/* Input Rows */}
      <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {rounds.map((round, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            <span className="text-slate-500 text-sm font-mono pl-2">{i + 1}</span>
            <input 
                type="number" 
                placeholder="-" 
                className="bg-slate-800 border border-slate-600 rounded p-2 text-center text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                value={round.score}
                onChange={(e) => updateRound(i, 'score', e.target.value)}
            />
            <input 
                type="number" 
                placeholder="72.0" 
                className="bg-slate-800 border border-slate-600 rounded p-2 text-center text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                value={round.rating}
                onChange={(e) => updateRound(i, 'rating', e.target.value)}
            />
            <input 
                type="number" 
                placeholder="113" 
                className="bg-slate-800 border border-slate-600 rounded p-2 text-center text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all"
                value={round.slope}
                onChange={(e) => updateRound(i, 'slope', e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Result Area */}
      {handicap !== null ? (
        <div className="text-center bg-green-500/20 border border-green-500/50 p-6 rounded-xl animate-fadeIn">
          <p className="text-sm text-green-300 font-bold uppercase mb-1">Your Index</p>
          <p className="text-5xl font-extrabold text-white tracking-tight">{handicap}</p>
          <p className="text-xs text-green-400/80 mt-2">Based on {rounds.filter(r => r.score).length} rounds</p>
          <button onClick={() => setHandicap(null)} className="mt-4 text-xs text-slate-400 hover:text-white underline">
            Recalculate
          </button>
        </div>
      ) : (
        <button 
            onClick={calculateHandicap} 
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 transition-all transform hover:scale-[1.02]"
        >
          Calculate Index
        </button>
      )}
    </div>
  );
}
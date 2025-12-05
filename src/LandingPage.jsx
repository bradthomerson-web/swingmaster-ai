import React from 'react';
import { Trophy, Target, Zap, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      
      {/* HERO SECTION */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-green-500/20 text-green-400 font-bold text-sm tracking-wide">
          🚀 NEW: AI Caddie 2.0 Released
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Drop 5 Strokes. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            No Video Required.
          </span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Stop struggling with complex video tools. SwingMaster AI analyzes your <strong>misses and stats</strong> to generate instant fixes and PGA-level practice plans.
        </p>
        
        <button 
          onClick={onStart}
          className="group bg-green-500 hover:bg-green-400 text-slate-900 text-xl font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(74,222,128,0.5)] flex items-center gap-2 mx-auto"
        >
          Start Free Assessment <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
        </button>
        
        <p className="mt-4 text-sm text-slate-500">No credit card required • Free "Swing 911" Access</p>
      </div>

      {/* SOCIAL PROOF / TRUST */}
      <div className="border-y border-slate-800 bg-slate-900/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {['TrustPilot ⭐⭐⭐⭐⭐', 'Featured in GolfDigest', '50,000+ Rounds Logged'].map((text) => (
            <span key={text} className="text-lg font-bold text-slate-400">{text}</span>
          ))}
        </div>
      </div>

      {/* PROBLEM / SOLUTION GRID */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-colors">
            <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-6">
              <Zap className="text-red-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Emergency "Swing 911"</h3>
            <p className="text-slate-400">Mid-round meltdown? Tell us your miss (e.g., "Slicing Driver"), and get one simple thought to save your round instantly.</p>
          </div>

          {/* Feature 2 */}
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
              <Target className="text-blue-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Custom Practice Plans</h3>
            <p className="text-slate-400">Don't just hit balls. Get a specific 30-minute routine based on <em>your</em> weaknesses and equipment (Net, Mat, or Range).</p>
          </div>

          {/* Feature 3 */}
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 hover:border-green-500/50 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
              <Trophy className="text-purple-400" size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Smart Caddie</h3>
            <p className="text-slate-400">Not sure what to hit? We calculate wind, slope, and your true carry distances to tell you exactly which club to pull.</p>
          </div>
        </div>
      </div>

      {/* FINAL CTA */}
      <div className="text-center py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <h2 className="text-3xl font-bold mb-6">Ready to break 80?</h2>
        <button 
          onClick={onStart}
          className="bg-white text-slate-900 hover:bg-slate-200 font-bold py-3 px-8 rounded-full transition-colors"
        >
          Join SwingMaster AI Now
        </button>
      </div>
    </div>
  );
}
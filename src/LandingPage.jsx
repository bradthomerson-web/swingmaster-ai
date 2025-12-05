import React from 'react';
import { Trophy, Target, Zap, ArrowRight, CheckCircle } from 'lucide-react';

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      
      {/* HERO SECTION */}
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
      <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-green-500/20 text-green-400 font-bold text-sm tracking-wide flex items-center gap-2 mx-auto w-fit">
  🩺 Meet Your Personal Swing Doctor
</div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
          Drop 5 Strokes. <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            No Video Required.
          </span>
        </h1>
       <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
  Stop struggling with complex video tools. Get instant fixes, PGA-level practice plans, and a <strong className="text-white">Free Handicap Calculator</strong>.
</p>
        
        <button 
          onClick={onStart}
          className="group bg-green-500 hover:bg-green-400 text-slate-900 text-xl font-bold py-4 px-10 rounded-full transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(74,222,128,0.5)] flex items-center gap-2 mx-auto"
        >
          Start Free Assessment <ArrowRight className="group-hover:translate-x-1 transition-transform"/>
        </button>
        
        <p className="mt-4 text-sm text-slate-500">No credit card required • Get your custom plan instantly!</p>
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

      {/* HOW IT WORKS */}
      <div className="py-20 bg-slate-800/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Your Path to Lower Scores</h2>
            <p className="text-slate-400">No generic advice. We treat your specific symptoms.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector Line (Desktop Only) */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-green-500/0 via-green-500/50 to-green-500/0 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 text-center group">
              <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 group-hover:border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors shadow-xl">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-xl font-bold mb-2">1. The Intake</h3>
              <p className="text-slate-400 text-sm px-4">Take the 2-minute quiz to tell us about your game, your miss, and your equipment.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 text-center group">
              <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 group-hover:border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors shadow-xl">
                <span className="text-3xl">🩺</span>
              </div>
              <h3 className="text-xl font-bold mb-2">2. The Diagnosis</h3>
              <p className="text-slate-400 text-sm px-4">The "Swing Doctor" analyzes your stats to identify exactly what to work on today.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 text-center group">
              <div className="w-24 h-24 bg-slate-900 border-4 border-slate-800 group-hover:border-green-500 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors shadow-xl">
                <span className="text-3xl">💊</span>
              </div>
              <h3 className="text-xl font-bold mb-2">3. The Prescription</h3>
              <p className="text-slate-400 text-sm px-4">Get a custom practice routine or an instant "Swing 911" fix for the course.</p>
            </div>
          </div>
        </div>
      </div>

    {/* FINAL CTA */}
      <div className="text-center py-20 bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">Ready to break 80?</h2>
            <p className="text-green-400 font-bold mb-8 uppercase tracking-widest text-xs">
                ⚡ Launch Special: Lifetime Pro Access Available
            </p>
            <button 
            onClick={onStart}
            className="bg-white text-slate-900 hover:bg-green-400 hover:text-white hover:scale-105 font-bold py-4 px-10 rounded-full transition-all shadow-xl"
            >
            Start My Diagnosis
        </button>
      </div>
    </div>
  </div>
  );
}
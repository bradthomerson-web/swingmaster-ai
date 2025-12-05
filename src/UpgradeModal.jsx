import React, { useState } from 'react'; // Import useState
import { X, Check, Star, Zap, Shield, Key } from 'lucide-react';

export default function UpgradeModal({ isOpen, onClose, onUpgrade }) {
  const [promoCode, setPromoCode] = useState('');

  if (!isOpen) return null;

  // --- THE SECRET UNLOCK LOGIC ---
  const handleRedeem = () => {
    // CHANGE "VIPGOLF" TO WHATEVER CODE YOU WANT
    if (promoCode.trim().toUpperCase() === 'VIPGOLF') {
        localStorage.setItem('ai_is_pro', 'true'); // Save Pro status
        alert("Code Accepted! Welcome to Pro.");
        window.location.reload(); // Reload the page to activate
    } else {
        alert("Invalid Code");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Dark Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header Image */}
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-green-900/40 to-slate-900 z-0"></div>
            <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
                    <Star size={12} fill="black" /> Pro Access
                </div>
                <h2 className="text-3xl font-extrabold text-white mb-2">Unlock Your Best Game</h2>
                <p className="text-slate-300 text-sm">Join the top 10% of SwingMaster users.</p>
            </div>
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/10 p-2 rounded-full backdrop-blur-md transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
            <div className="space-y-4">
                {[
                    { title: 'Unlimited Swing 911', desc: 'Instant fixes for mid-round meltdowns.' },
                    { title: 'Smart Caddie 2.0', desc: 'Wind, slope, and lie adjustments.' },
                    { title: 'Advanced Stats', desc: 'Track strokes gained and dispersion.' },
                    { title: 'Priority AI', desc: 'Faster responses and deeper analysis.' }
                ].map((item, i) => (
                    <div key={i} className="flex items-start gap-4">
                        <div className="mt-1 bg-green-100 p-1 rounded-full">
                            <Check size={16} className="text-green-600" strokeWidth={3} />
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                            <p className="text-slate-500 text-xs">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Price Anchor */}
            <div className="text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-slate-500 text-xs line-through mb-1">$99/year value</p>
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">$49</span>
                    <span className="text-slate-500 font-medium">/ lifetime</span>
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={onUpgrade}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-green-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
                <Zap size={20} fill="currentColor" /> Upgrade Now
            </button>
            
            <div className="text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                <Shield size={12} /> Secure Stripe Checkout
            </div>

            {/* --- NEW: PROMO CODE SECTION --- */}
            <div className="pt-4 mt-4 border-t border-slate-100">
                <p className="text-xs text-center text-slate-400 mb-2 font-bold">Have a referral code?</p>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="Enter Code" 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none uppercase"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button 
                        onClick={handleRedeem}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700"
                    >
                        Apply
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { ArrowRight, Check, User, Target, Club } from 'lucide-react';

export default function ProfileQuiz({ userProfile, setUserProfile, onComplete }) {
  const [step, setStep] = useState(1);

  const handleNext = () => setStep(step + 1);
  
  // Helper to update specific fields
  const update = (field, value) => {
    setUserProfile({ ...userProfile, [field]: value });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-lg mx-auto">
      
      {/* Progress Bar */}
      <div className="h-2 bg-slate-100">
        <div 
          className="h-full bg-green-500 transition-all duration-500 ease-out" 
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      <div className="p-8">
        
        {/* STEP 1: THE BASICS */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <User size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Let's get you checked in.</h2>
            <p className="text-slate-500">To prescribe the right drills, we need to know who we're working with.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">What's your name?</label>
                <input 
                  type="text" 
                  value={userProfile.name} 
                  onChange={(e) => update('name', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Tiger Woods"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">How old are you?</label>
                <input 
                  type="number" 
                  value={userProfile.age} 
                  onChange={(e) => update('age', e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="e.g. 35"
                />
              </div>
            </div>
            <button onClick={handleNext} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              Next Step <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 2: SKILL LEVEL */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4">
              <Target size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">What's your handicap?</h2>
            <p className="text-slate-500">Be honest! The Swing Doctor handles everything from beginners to scratch players.</p>
            
            <input 
              type="number" 
              value={userProfile.handicap} 
              onChange={(e) => update('handicap', e.target.value)}
              className="w-full text-center text-4xl font-bold p-4 border border-slate-200 rounded-xl focus:border-green-500 outline-none text-slate-900"
              placeholder="18"
            />
            
            <div className="flex gap-2 justify-center">
                {['High (20+)', 'Mid (10-19)', 'Low (0-9)'].map(level => (
                    <button key={level} onClick={() => update('handicap', level.replace(/\D/g,''))} className="text-xs bg-slate-100 px-3 py-1 rounded-full hover:bg-slate-200">
                        {level}
                    </button>
                ))}
            </div>

            <button onClick={handleNext} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              Continue <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 3: THE BAG */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Club size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Practice Setup</h2>
            <p className="text-slate-500">Select what you have access to right now. The AI will build drills based on this.</p>
            
            <div className="grid grid-cols-2 gap-3">
                {['Driving Range', 'Home Net', 'Putting Mat', 'Indoor Sim', 'Just a Club', 'Full Gym'].map((item) => (
                    <button 
                        key={item}
                        onClick={() => {
                            const current = userProfile.equipment || '';
                            update('equipment', current.includes(item) ? current.replace(item + ', ', '') : current + item + ', ');
                        }}
                        className={`p-3 text-sm font-bold rounded-lg border-2 text-left transition-all ${userProfile.equipment?.includes(item) ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 hover:border-slate-300'}`}
                    >
                        {userProfile.equipment?.includes(item) ? <Check size={16} className="inline mr-1"/> : '+'} {item}
                    </button>
                ))}
            </div>

            <button onClick={handleNext} className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              Almost Done <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* STEP 4: DIAGNOSIS */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
              <Check size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Final Diagnosis</h2>
            <p className="text-slate-500">In one sentence, what is your "Big Miss" or biggest frustration?</p>
            
            <textarea 
                value={userProfile.weaknesses}
                onChange={(e) => update('weaknesses', e.target.value)}
                placeholder="e.g. I slice my driver into the woods, or I 3-putt way too often."
                className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none h-32"
            />

            <button onClick={onComplete} className="w-full bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-green-600 shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02]">
              Complete Profile <Check size={18} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
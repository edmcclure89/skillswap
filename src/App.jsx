import './App.css';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching:", error);
      } else {
        setProfiles(data);
      }
    }
    fetchProfiles();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-12 flex justify-between items-center">
        <div className="text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 font-black italic">SkillSwap</h1>
          <p className="text-slate-600 text-lg">Trade talent. Scale faster. Zero cash.</p>
        </div>
        <button 
          onClick={() => window.location.href = '/auth'} 
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200"
        >
          Join the Network
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <div key={profile.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center space-x-4 mb-4">
              <img 
                src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.full_name}`} 
                className="w-16 h-16 rounded-full bg-slate-100" 
                alt="avatar" 
              />
              <div>
                <h2 className="text-xl font-bold text-slate-800">{profile.full_name}</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {profile.primary_skill}
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-4">{profile.bio}</p>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Seeking: {profile.seeking_skill}</span>
              <button className="text-blue-600 font-bold">Swap</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
import './App.css';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  const categories = ['AI', 'UGC', 'Video Editing', 'Arts & Crafts', 'Writing'];

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
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b border-slate-100 px-8 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-900">SkillSwap</h1>
          <button
            onClick={() => window.location.href = '/auth'}
            className="bg-teal-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-teal-600 transition"
          >
            Join the Network
          </button>
        </div>
      </header>

      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-black leading-tight mb-4">Your skills are currency.</h2>
          <p className="text-2xl text-slate-300 mb-8">Match with people who have what you need and need what you have. Zero dollars exchanged.</p>

          <div className="bg-white text-slate-900 rounded-xl p-1 flex items-center gap-2 mb-8 shadow-2xl">
            <input
              type="text"
              placeholder="Search a skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-6 py-3 outline-none text-lg rounded-lg"
            />
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-lg font-bold transition">
              Search
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <div key={cat} className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === cat ? null : cat)}
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 border border-white border-opacity-30 text-white px-5 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                >
                  {cat}
                  <span className={`text-sm transition ${openDropdown === cat ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openDropdown === cat && (
                  <div className="absolute top-full left-0 mt-2 bg-white text-slate-900 rounded-lg shadow-lg p-3 w-48 z-10">
                    <p className="text-sm text-slate-600 mb-2">Explore {cat}:</p>
                    <ul className="space-y-2 text-sm">
                      <li><a href="#" className="hover:text-teal-500 font-medium">Trending in {cat}</a></li>
                      <li><a href="#" className="hover:text-teal-500 font-medium">Top Experts</a></li>
                      <li><a href="#" className="hover:text-teal-500 font-medium">New Offers</a></li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-slate-900 mb-8">Traders in Your Network</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto pb-6">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition border border-slate-100 p-6 flex-shrink-0">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.full_name}`}
                    className="w-16 h-16 rounded-full bg-slate-100"
                    alt="avatar"
                  />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{profile.full_name}</h2>
                    <span className="bg-teal-100 text-teal-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {profile.primary_skill}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-4">{profile.bio}</p>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Seeking: {profile.seeking_skill}</span>
                  <button className="text-teal-600 hover:text-teal-700 font-bold transition">Swap</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
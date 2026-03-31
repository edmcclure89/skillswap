import './App.css';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Signup from './Signup';
import Auth from './Auth';

function App() {
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [showTerms, setShowTerms] = useState(false);

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

  const pathname = window.location.pathname;

  // Route to Signup component if on /signup path
  if (pathname === '/signup') {
    return <Signup />;
  }

  const handleAuthClose = () => {
    window.location.href = '/';
  };

  const appleColors = {
    silver: '#e6e6e6',
    gray: '#424245',
    white: '#f5f5f7',
    blue: '#0066cc',
    orange: '#f56300'
  };

  const featuredPhotos = [
    '/happy.jpg',
    '/pexels-gustavo-fring-7447286.jpg',
    '/pexels-kampus-5920774.jpg',
    '/pexels-kindelmedia-8488020.jpg',
    '/pexels-reyhandiptayana-6258540.jpg'
  ];

  const handleJoin = () => {
    window.location.href = '/auth';
  };

  const handleSwap = (profileId) => {
    console.log('Swap initiated with:', profileId);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: appleColors.white, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* Navigation */}
      <header style={{ backgroundColor: appleColors.gray, borderBottom: `1px solid ${appleColors.silver}`, padding: '16px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: appleColors.silver, margin: 0 }}>SkillSwap</h1>
          <button
            onClick={handleJoin}
            style={{
              backgroundColor: appleColors.blue,
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Join the Network
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        backgroundColor: appleColors.gray,
        color: 'white',
        padding: '96px 32px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px' }}>Your skills are currency</h2>
          <p style={{ fontSize: '20px', color: appleColors.silver, marginBottom: '32px' }}>Match with people who have what you need and need what you have. Zero dollars exchanged.</p>

          {/* Search Bar */}
          <div style={{
            backgroundColor: 'white',
            color: appleColors.gray,
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '32px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <input
              type="text"
              placeholder="Search a skill..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                padding: '12px 24px',
                outline: 'none',
                border: 'none',
                fontSize: '16px',
                borderRadius: '8px'
              }}
            />
            <button style={{
              backgroundColor: appleColors.blue,
              color: 'white',
              padding: '12px 32px',
              borderRadius: '8px',
              fontWeight: '700',
              border: 'none',
              cursor: 'pointer'
            }}>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* Featured Traders Photos */}
      <section style={{ padding: '64px 32px', backgroundColor: appleColors.white }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: appleColors.gray, marginBottom: '32px' }}>Featured Traders</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {featuredPhotos.map((photo, idx) => (
              <div key={idx} style={{
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                aspectRatio: '1'
              }}>
                <img
                  src={photo}
                  alt={`Featured trader ${idx + 1}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traders Grid */}
      <section style={{ padding: '64px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: appleColors.gray, marginBottom: '32px' }}>Traders in Your Network</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px'
          }}>
            {profiles.map((profile, idx) => (
              <div
                key={profile.id}
                style={{
                  backgroundColor: appleColors.white,
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  border: `1px solid ${appleColors.silver}`,
                  padding: '24px',
                  transition: 'box-shadow 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <img
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.full_name}`}
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      backgroundColor: appleColors.silver
                    }}
                    alt="avatar"
                  />
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: appleColors.gray, margin: '0 0 8px 0' }}>{profile.full_name}</h2>
                    <span style={{
                      backgroundColor: idx % 2 === 0 ? appleColors.blue : appleColors.orange,
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}>
                      {profile.primary_skill}
                    </span>
                  </div>
                </div>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px' }}>{profile.bio}</p>
                <div style={{
                  paddingTop: '16px',
                  borderTop: `1px solid ${appleColors.silver}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '12px', color: '#999', fontWeight: '600' }}>Seeking: {profile.seeking_skill}</span>
                  <button 
                    onClick={() => handleSwap(profile.id)}
                    style={{
                      color: appleColors.blue,
                      fontWeight: '700',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Swap
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Auth modal for /auth route */}
      {pathname === '/auth' && (
        <Auth
          onClose={handleAuthClose}
          onShowTerms={() => setShowTerms(true)}
          refCode={null}
        />
      )}
    </div>
  );
}

export default App;
// Force rebuild - trigger Vercel redeploy

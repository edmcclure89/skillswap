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
  const [pathname, setPathname] = useState(window.location.pathname);

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

  useEffect(() => {
    const handleLocationChange = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setPathname(window.location.pathname);
    };

    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setPathname(window.location.pathname);
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  // Route to Signup component if on /signup path
  if (pathname === '/signup') {
    return <Signup />;
  }

  // Route to Category page if on /category/:name path
  const categoryMatch = pathname.match(/^\/category\/(.+)$/);
  if (categoryMatch) {
    const categoryName = categoryMatch[1];
    const categoryDisplayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
    const categoryProfiles = profiles.filter(p =>
      p.primary_skill.toLowerCase().includes(categoryName.toLowerCase())
    );

    return (
      <div style={{ minHeight: '100vh', backgroundColor: appleColors.white, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        {/* Navigation */}
        <header style={{ backgroundColor: appleColors.gray, borderBottom: `1px solid ${appleColors.silver}`, padding: '16px 32px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                window.history.pushState(null, '', '/');
                setPathname('/');
              }}
              style={{
                fontSize: '28px',
                fontWeight: '700',
                color: appleColors.silver,
                margin: 0,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer'
              }}
            >
              ← SkillSwap
            </button>
          </div>
        </header>

        {/* Category Header */}
        <section style={{
          backgroundColor: appleColors.white,
          color: appleColors.gray,
          padding: '64px 32px',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px' }}>{categoryDisplayName}</h2>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '32px' }}>
              {categoryProfiles.length} people in your network offer {categoryDisplayName.toLowerCase()} skills
            </p>
          </div>
        </section>

        {/* Category Profiles Grid */}
        <section style={{ padding: '64px 32px', minHeight: 'calc(100vh - 300px)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            {categoryProfiles.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px'
              }}>
                {categoryProfiles.map((profile) => (
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
                      <SkillIcon skill={profile.primary_skill} />
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: appleColors.gray, margin: '0 0 8px 0' }}>{profile.full_name}</h2>
                        <span style={{
                          backgroundColor: appleColors.blue,
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
            ) : (
              <div style={{ textAlign: 'center', padding: '64px 32px' }}>
                <p style={{ fontSize: '18px', color: '#999' }}>No one in your network offers {categoryDisplayName.toLowerCase()} skills yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    );
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

  const skillCategories = [
    { name: 'Baking', image: '/images/happy.jpg' },
    { name: 'Construction', image: '/images/pexels-gustavo-fring-7447286.jpg' },
    { name: 'Education', image: '/images/pexels-kampus-5920774.jpg' },
    { name: 'Coaching', image: '/images/pexels-kindelmedia-8488020.jpg' },
    { name: 'Design', image: '/images/pexels-reyhandiptayana-6258540.jpg' }
  ];

  const handleJoin = () => {
    window.location.href = '/auth';
  };

  const handleSwap = (profileId) => {
    console.log('Swap initiated with:', profileId);
  };

  const handleCategoryClick = (categoryName) => {
    window.history.pushState(null, '', `/category/${categoryName.toLowerCase()}`);
    setPathname(`/category/${categoryName.toLowerCase()}`);
  };

  const SkillIcon = ({ skill }) => {
    const getSkillIcon = (skillName) => {
      const skillLower = skillName.toLowerCase();

      // Return SVG icons based on skill type
      if (skillLower.includes('cook') || skillLower.includes('bak')) {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.orange} strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      } else if (skillLower.includes('design') || skillLower.includes('art')) {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.blue} strokeWidth="2">
            <circle cx="12" cy="12" r="1" />
            <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m2.12 2.12l4.24 4.24M1 12h6m6 0h6M4.22 19.78l4.24-4.24m2.12-2.12l4.24-4.24" />
          </svg>
        );
      } else if (skillLower.includes('build') || skillLower.includes('construct')) {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.orange} strokeWidth="2">
            <path d="M6 9l6-6 6 6v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z" />
            <rect x="9" y="9" width="6" height="6" />
          </svg>
        );
      } else if (skillLower.includes('teach') || skillLower.includes('coach') || skillLower.includes('education')) {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.blue} strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        );
      } else if (skillLower.includes('music')) {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.orange} strokeWidth="2">
            <path d="M9 18V5l12-2v13a4 4 0 1 1-4 4M9 9h12" />
          </svg>
        );
      } else if (skillLower.includes('tech') || skillLower.includes('code') || skillLower.includes('software')) {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.blue} strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        );
      } else if (skillLower.includes('fitness') || skillLower.includes('yoga')) {
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.orange} strokeWidth="2">
            <circle cx="12" cy="5" r="1.5" />
            <path d="M12 6.5v5m-2-2l4 4m0-4l-4 4m8-8v8m-4-4h8" />
          </svg>
        );
      } else {
        // Default skill icon
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke={appleColors.blue} strokeWidth="2">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
        );
      }
    };

    return (
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        backgroundColor: appleColors.silver,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <div style={{ width: '40px', height: '40px' }}>
          {getSkillIcon(skill)}
        </div>
      </div>
    );
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
        backgroundColor: appleColors.white,
        color: appleColors.gray,
        padding: '96px 32px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px' }}>Your skills are currency</h2>
          <p style={{ fontSize: '20px', color: appleColors.gray, marginBottom: '32px' }}>Match with people who have what you need and need what you have. Zero dollars exchanged.</p>

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

      {/* Featured Skill Categories */}
      <section style={{ padding: '64px 32px', backgroundColor: appleColors.white }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: appleColors.gray, marginBottom: '32px' }}>Explore Skills</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px'
          }}>
            {skillCategories.map((category, idx) => (
              <div key={idx} style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleCategoryClick(category.name)}>
                <div style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  aspectRatio: '1',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  transform: 'scale(1)',
                  ':hover': { transform: 'scale(1.05)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}>
                  <img
                    src={category.image}
                    alt={category.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <h4 style={{ fontSize: '18px', fontWeight: '700', color: appleColors.gray, marginTop: '16px', margin: '16px 0 0 0' }}>
                  {category.name}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Traders Grid */}
      <section style={{ padding: '64px 32px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: appleColors.gray, marginBottom: '32px' }}>Trending in Your Network</h3>
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
                  <SkillIcon skill={profile.primary_skill} />
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

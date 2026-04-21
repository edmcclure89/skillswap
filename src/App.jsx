import './App.css';
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import Signup from './Signup';
import Auth from './Auth';
import Terms from './Terms';
import FreeSwapPromo from './FreeSwapPromo';

// Static seed profiles ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ 3 per category, all accounts tied to edmcclure89@gmail.com
const STATIC_PROFILES = [
  // Baking
  { id: 'static-1', full_name: 'Maria Santos', primary_skill: 'Baking', seeking_skill: 'Social media marketing', bio: 'Professional pastry chef with 12 years in artisan bakeries. Specialize in sourdough, pastries, and wedding cakes.', email: 'edmcclure89@gmail.com' },
  { id: 'static-2', full_name: 'Tom Baker', primary_skill: 'Baking', seeking_skill: 'Photography for food content', bio: 'Home baker turned cottage business owner. Known for custom birthday cakes and French macarons.', email: 'edmcclure89@gmail.com' },
  { id: 'static-3', full_name: 'Angela Kim', primary_skill: 'Baking', seeking_skill: 'Website design', bio: 'Korean-American baker blending traditional techniques with modern flavors. Pop-up shop owner.', email: 'edmcclure89@gmail.com' },
  // Construction
  { id: 'static-4', full_name: 'Carlos Mendez', primary_skill: 'Construction', seeking_skill: 'Accounting and bookkeeping', bio: 'Licensed general contractor with 15 years building custom homes and renovations. Specializes in kitchen and bath.', email: 'edmcclure89@gmail.com' },
  { id: 'static-5', full_name: 'Jake Morrison', primary_skill: 'Construction', seeking_skill: 'Digital marketing', bio: 'Carpentry specialist and woodworker. Expert in custom cabinets, decks, and structural repairs.', email: 'edmcclure89@gmail.com' },
  { id: 'static-6', full_name: 'Rosa Delgado', primary_skill: 'Construction', seeking_skill: 'Business coaching', bio: 'Licensed electrician and general contractor. First woman-owned electrical company in my county. 200+ projects completed.', email: 'edmcclure89@gmail.com' },
  // Education
  { id: 'static-7', full_name: 'James Wilson', primary_skill: 'Education', seeking_skill: 'Social media management', bio: 'Career coach with 10+ years helping executives and entrepreneurs. Former HR director at a Fortune 500.', email: 'edmcclure89@gmail.com' },
  { id: 'static-8', full_name: 'Aisha Okafor', primary_skill: 'Education', seeking_skill: 'Web development', bio: 'High school math teacher and private tutor. Makes calculus approachable for even the most math-averse students.', email: 'edmcclure89@gmail.com' },
  { id: 'static-9', full_name: 'Daniel Park', primary_skill: 'Education', seeking_skill: 'Graphic design', bio: 'ESL instructor and language learning specialist. Have taught in 6 countries over 10 years.', email: 'edmcclure89@gmail.com' },
  // Crafts
  { id: 'static-10', full_name: 'Priya Kapoor', primary_skill: 'Crafts', seeking_skill: 'Business strategy', bio: 'Certified yoga instructor and wellness coach. Specialize in corporate wellness programs and burnout recovery.', email: 'edmcclure89@gmail.com' },
  { id: 'static-11', full_name: 'Mike Torres', primary_skill: 'Crafts', seeking_skill: 'Video editing', bio: 'Certified life and performance coach. Work with athletes, founders, and creatives to break through mental blocks.', email: 'edmcclure89@gmail.com' },
  { id: 'static-12', full_name: 'Lauren Hayes', primary_skill: 'Crafts', seeking_skill: 'Photography', bio: 'Nutritionist and health coach. Specialize in sustainable weight management without fad diets or quick fixes.', email: 'edmcclure89@gmail.com' },
  // Design
  { id: 'static-13', full_name: 'Marcus Rodriguez', primary_skill: 'Design', seeking_skill: 'Spanish language tutoring', bio: 'Graphic designer with portfolio across tech startups and e-commerce brands. Minimalist aesthetic focus.', email: 'edmcclure89@gmail.com' },
  { id: 'static-14', full_name: 'Nina Bergstrom', primary_skill: 'Design', seeking_skill: 'Branding consultation', bio: 'Interior designer specializing in residential spaces. Virtual consultations available. Scandinavian-inspired style.', email: 'edmcclure89@gmail.com' },
  { id: 'static-15', full_name: 'Chris Anderson', primary_skill: 'Design', seeking_skill: 'Website development', bio: 'Video producer and motion graphics designer. Experience in YouTube, TikTok, and brand promotional content.', email: 'edmcclure89@gmail.com' },
];

function App() {
  const [profiles, setProfiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [pathname, setPathname] = useState(window.location.pathname);
  const [userJustLoggedIn, setUserJustLoggedIn] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [messageModal, setMessageModal] = useState(null);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);
  const [msgSent, setMsgSent] = useState(false);
  const [msgError, setMsgError] = useState('');

  // Define constants before they're used in early returns
  const appleColors = {
    silver: '#e6e6e6',
    gray: '#424245',
    white: '#f5f5f7',
    blue: '#0066cc',
    orange: '#f56300'
  };

  const skillCategories = [
    { name: 'Baking', image: '/images/pexels-gustavo-fring-7447286.jpg' },
    { name: 'Construction', image: '/images/pexels-kindelmedia-8488020.jpg' },
    { name: 'Crafts', image: '/images/pexels-rdne-10376205.jpg' },
    { name: 'Design', image: '/images/pexels-anna-nekrashevich-7552713.jpg' },
    { name: 'Education', image: '/images/pexels-kampus-7857557.jpg' }
  ];

  const handleAuthClose = () => {
    window.history.pushState(null, '', '/');
    setPathname('/');
  };

  const handleJoin = () => {
    window.history.pushState(null, '', '/auth');
    setPathname('/auth');
  };

  const openMessageModal = (profileId) => {
    if (!currentUser) { window.history.pushState(null, '', '/auth'); setPathname('/auth'); return; }
    const allProfiles = [...STATIC_PROFILES, ...profiles];
    const p = allProfiles.find(x => x.id === profileId);
    setMsgText(''); setMsgSent(false); setMsgError('');
    setMessageModal({ recipientId: profileId, recipientName: p ? p.full_name : 'this user', recipientSkill: p ? p.primary_skill : '' });
  };

  const handleSwap = (profileId) => openMessageModal(profileId);

  const handleSendMessage = async () => {
    if (!msgText.trim()) return;
    setMsgSending(true); setMsgError('');
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        sender_email: currentUser.email,
        recipient_id: messageModal.recipientId,
        recipient_name: messageModal.recipientName,
        body: msgText.trim(),
      });
      if (error) throw error;
      setMsgSent(true);
    } catch (err) { setMsgError('Could not send message. Please try again.'); }
    finally { setMsgSending(false); }
  };

  const handleCategoryClick = (categoryName) => {
    window.history.pushState(null, '', `/category/${categoryName.toLowerCase()}`);
    setPathname(`/category/${categoryName.toLowerCase()}`);
  };

  useEffect(() => {
    console.log('[SkillSwap] App mounted, initializing...');

    async function fetchProfiles() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) {
          console.error('[SkillSwap] Error fetching profiles:', error);
        } else {
          setProfiles(data || []);
        }
      } catch (err) {
        console.error('[SkillSwap] fetchProfiles threw:', err);
      }
    }
    fetchProfiles();

    // Track auth state for gating swap/view actions
    let subscription = null;
    try {
      supabase.auth.getSession().then((result) => {
        const session = result?.data?.session ?? null;
        setCurrentUser(session?.user ?? null);
      }).catch(err => console.error('[SkillSwap] getSession error:', err));

      const authResult = supabase.auth.onAuthStateChange((event, session) => {
        setCurrentUser(session?.user ?? null);
        if (event === 'SIGNED_IN' && session?.user) {
          setUserJustLoggedIn(true);
          setTimeout(() => {
            setShowPromo(true);
          }, 2000);
        }
      });
      subscription = authResult?.data?.subscription ?? null;
    } catch (err) {
      console.error('[SkillSwap] Auth init error:', err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
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

  const SkillIcon = ({ skill }) => {
    const getSkillIcon = (skillName) => {
      const skillLower = (skillName || '').toLowerCase();
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

  // Merge live Supabase profiles with static profiles; deduplicate by name
  const supabaseNames = new Set(profiles.map(p => (p.full_name || '').toLowerCase()));
  const mergedProfiles = [
    ...profiles.map(p => ({ ...p, full_name: p.full_name || 'Anonymous' })),
    ...STATIC_PROFILES.filter(sp => !supabaseNames.has(sp.full_name.toLowerCase()))
  ];

  // Filter profiles by search term (case-insensitive) and exclude anonymous profiles
  const filteredProfiles = mergedProfiles.filter(p => {
    // Exclude anonymous profiles from front page
    if (p.full_name === 'Anonymous') return false;

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (p.primary_skill && p.primary_skill.toLowerCase().includes(term)) ||
      (p.seeking_skill && p.seeking_skill.toLowerCase().includes(term)) ||
      (p.full_name && p.full_name.toLowerCase().includes(term)) ||
      (p.bio && p.bio.toLowerCase().includes(term))
    );
  });

  // Route to Signup component if on /signup path
  if (pathname === '/signup') {
    return <Signup />;
  }

  // Route to Category page if on /category/:name path
  const categoryMatch = pathname.match(/^\/category\/(.+)$/);
  if (categoryMatch) {
    const categoryName = categoryMatch[1];
    const categoryDisplayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);

    // Get static profiles for this category (always 2-5 shown)
    const staticForCategory = STATIC_PROFILES.filter(p =>
      p.primary_skill.toLowerCase() === categoryName.toLowerCase()
    );
    // Get live profiles matching category, fill in with static if not enough
    const liveForCategory = profiles.filter(p =>
      (p.primary_skill || '').toLowerCase().includes(categoryName.toLowerCase())
    );
    const liveNames = new Set(liveForCategory.map(p => (p.full_name || '').toLowerCase()));
    const combined = [
      ...liveForCategory,
      ...staticForCategory.filter(sp => !liveNames.has(sp.full_name.toLowerCase()))
    ];
    const categoryProfiles = combined;

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
              ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ SkillSwap
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
                      <SkillIcon skill={profile.primary_skill || 'general'} />
                      <div style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: appleColors.gray, margin: '0 0 8px 0' }}>{profile.full_name || 'Anonymous'}</h2>
                        <span style={{
                          backgroundColor: appleColors.blue,
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: '600',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          display: 'inline-block'
                        }}>
                          {profile.primary_skill || 'General'}
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


  // Route to Profile page if on /profile/:id path
  const profileMatch = pathname.match(/^\/profile\/(.+)$/);
  if (profileMatch) {
    const profileId = profileMatch[1];
    const profile = mergedProfiles.find(p => p.id === profileId) || mergedProfiles.find(p => String(p.id) === profileId);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: appleColors.white, fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}>
        <header style={{ backgroundColor: appleColors.gray, borderBottom: `1px solid ${appleColors.silver}`, padding: '16px 32px' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => { window.history.pushState(null, '', '/'); setPathname('/'); }}
              style={{ fontSize: '28px', fontWeight: '700', color: appleColors.silver, margin: 0, border: 'none', backgroundColor: 'transparent', cursor: 'pointer' }}
            >
              ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ SkillSwap
            </button>
          </div>
        </header>
        <section style={{ padding: '64px 32px', maxWidth: '700px', margin: '0 auto' }}>
          {profile ? (
            <div style={{ backgroundColor: 'white', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', padding: 40 }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                <SkillIcon skill={profile.primary_skill || 'general'} />
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 800, color: appleColors.gray, margin: 0 }}>{profile.full_name}</h2>
                  <span style={{ backgroundColor: appleColors.blue, color: 'white', fontSize: 13, fontWeight: 600, padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginTop: 8 }}>
                    {profile.primary_skill || 'General'}
                  </span>
                </div>
              </div>
              <p style={{ color: '#555', fontSize: 16, lineHeight: 1.7, marginBottom: 24 }}>{profile.bio}</p>
              <div style={{ padding: '16px 0', borderTop: `1px solid ${appleColors.silver}`, marginBottom: 24 }}>
                <p style={{ fontSize: 14, color: '#888', fontWeight: 600 }}>Looking for: <span style={{ color: appleColors.gray }}>{profile.seeking_skill}</span></p>
              </div>
              <button
                onClick={() => {
                  if (!currentUser) { window.history.pushState(null, '', '/auth'); setPathname('/auth'); }
                  else { openMessageModal(profile.id); }
                }}
                style={{ width: '100%', backgroundColor: appleColors.blue, color: 'white', padding: '14px 24px', borderRadius: 10, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}
              >
                {currentUser ? 'Send Message' : 'Sign In to Message'}
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 64 }}>
              <p style={{ fontSize: 18, color: '#999' }}>Profile not found.</p>
              <button onClick={() => { window.history.pushState(null, '', '/'); setPathname('/'); }} style={{ marginTop: 16, color: appleColors.blue, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
                Back to Home
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

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

      {/* Top Hero Photo */}
      <div style={{
        width: '100%',
        height: '400px',
        overflow: 'hidden'
      }}>
        <img
          src="/images/happy.jpg"
          alt="Your skills are currency"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      </div>

      {/* Hero Section */}
      <section style={{
        backgroundColor: appleColors.white,
        color: appleColors.gray,
        padding: '96px 32px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '48px', fontWeight: '900', marginBottom: '16px' }}>Your skills are currency</h2>
          <p style={{ fontSize: '20px', color: appleColors.gray, marginBottom: '32px' }}>Get your first swap free. Bring a friend and you both get 2 free swaps.</p>

          {/* Search Bar */}
          <div style={{
            backgroundColor: 'white',
            color: appleColors.gray,
            borderRadius: '12px',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: searchTerm ? '24px' : '32px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <input
              type="text"
              placeholder="Search a skill... (e.g. Baking, Design, Coaching)"
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
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  backgroundColor: '#ddd',
                  color: '#666',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                Clear
              </button>
            )}

          {/* Inline search results ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ appear directly below search bar */}
          {searchTerm && (
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '14px', color: '#999', marginBottom: '16px' }}>
                {filteredProfiles.length} match{filteredProfiles.length !== 1 ? 'es' : ''} for "{searchTerm}"
              </p>
              {filteredProfiles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: '18px', color: '#999', marginBottom: '8px' }}>No results for "{searchTerm}"</p>
                  <p style={{ fontSize: '13px', color: '#bbb', marginBottom: '16px' }}>Try: Baking, Construction, Crafts, Design, Education</p>
                  <button onClick={() => setSearchTerm('')} style={{ backgroundColor: appleColors.blue, color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}>
                    Clear Search
                  </button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {filteredProfiles.map((profile, idx) => (
                    <div key={profile.id} style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: `1px solid ${appleColors.silver}`, padding: '20px', textAlign: 'left', cursor: 'pointer' }}
                      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'flex-start' }}>
                        <SkillIcon skill={profile.primary_skill || 'general'} />
                        <div style={{ flex: 1 }}>
                          <h2 style={{ fontSize: '16px', fontWeight: '700', color: appleColors.gray, margin: '0 0 6px 0' }}>{profile.full_name}</h2>
                          <span style={{ backgroundColor: appleColors.blue, color: 'white', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '12px', display: 'inline-block' }}>{profile.primary_skill}</span>
                        </div>
                      </div>
                      <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5' }}>{profile.bio}</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleSwap(profile.id)} style={{ flex: 1, backgroundColor: appleColors.blue, color: 'white', padding: '9px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: 'none', cursor: 'pointer' }}>Message</button>
                        <button onClick={() => { window.history.pushState(null, '', `/profile/${profile.id}`); setPathname(`/profile/${profile.id}`); }} style={{ flex: 1, backgroundColor: 'transparent', color: appleColors.gray, padding: '9px 12px', borderRadius: '8px', fontWeight: '600', fontSize: '13px', border: `1px solid ${appleColors.silver}`, cursor: 'pointer' }}>View</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </section>

      {/* Featured Skill Categories ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ hidden while searching */}
      <section style={{ padding: '64px 32px', backgroundColor: appleColors.white, display: searchTerm ? 'none' : 'block' }}>
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

      {/* Traders Grid ÃÂÃÂ¢ÃÂÃÂÃÂÃÂ only shown when not searching */}
      <section style={{ padding: '64px 32px', display: searchTerm ? 'none' : 'block' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '28px', fontWeight: '700', color: appleColors.gray, marginBottom: '8px' }}>
            {searchTerm ? `Results for "${searchTerm}"` : 'Trending in Your Network'}
          </h3>
          <p style={{ fontSize: '14px', color: '#999', marginBottom: '32px' }}>
            {searchTerm ? `${filteredProfiles.length} match${filteredProfiles.length !== 1 ? 'es' : ''} found` : `${filteredProfiles.length} people available to swap`}
          </p>
          {filteredProfiles.length === 0 && searchTerm ? (
            <div style={{ textAlign: 'center', padding: '64px 32px' }}>
              <p style={{ fontSize: '20px', color: '#999', marginBottom: '16px' }}>No skills match "{searchTerm}"</p>
              <p style={{ fontSize: '14px', color: '#bbb' }}>Try searching for Baking, Construction, Crafts, Design, or Education</p>
              <button
                onClick={() => setSearchTerm('')}
                style={{ marginTop: '16px', backgroundColor: appleColors.blue, color: 'white', padding: '10px 24px', borderRadius: '8px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
              >
                Clear Search
              </button>
            </div>
          ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {filteredProfiles.map((profile, idx) => (
              <div
                key={profile.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                  border: `1px solid ${appleColors.silver}`,
                  padding: '20px',
                  transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {/* Online Status Indicator */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#34C759',
                  border: '2px solid white',
                  boxShadow: '0 0 0 1px #34C759'
                }} />

                {/* Header with Icon and Name */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'flex-start' }}>
                  <SkillIcon skill={profile.primary_skill || 'general'} />
                  <div style={{ flex: 1, marginTop: '2px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: '700', color: appleColors.gray, margin: '0 0 6px 0' }}>{profile.full_name || 'Anonymous'}</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{
                        backgroundColor: idx % 2 === 0 ? appleColors.blue : appleColors.orange,
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '600',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        display: 'inline-block'
                      }}>
                        {profile.primary_skill || 'General'}
                      </span>
                      <span style={{
                        backgroundColor: '#f0f0f0',
                        color: '#666',
                        fontSize: '10px',
                        fontWeight: '600',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        display: 'inline-block'
                      }}>
                        {idx % 3 === 0 ? 'Pro' : idx % 3 === 1 ? 'Rising' : 'New'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '13px' }}>
                  <span style={{ color: '#f59e0b' }}>
                    {'ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ'.repeat(Math.min(5, 3 + (idx % 3)))} {3 + (idx % 3)}.0
                  </span>
                  <span style={{ color: '#999' }}>
                    ({24 + (idx % 50)} reviews)
                  </span>
                </div>

                {/* Bio */}
                <p style={{ color: '#666', fontSize: '13px', marginBottom: '12px', lineHeight: '1.5', maxHeight: '60px', overflow: 'hidden' }}>{profile.bio}</p>

                {/* Stats Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  marginBottom: '12px',
                  paddingBottom: '12px',
                  borderBottom: `1px solid ${appleColors.silver}`
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: appleColors.gray }}>
                      {8 + (idx % 20)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>
                      Completed
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: appleColors.gray }}>
                      {2 + (idx % 8)}h
                    </div>
                    <div style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>
                      Avg Response
                    </div>
                  </div>
                </div>

                {/* Action Section */}
                <div style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'space-between'
                }}>
                  <button
                    onClick={() => handleSwap(profile.id)}
                    style={{
                      flex: 1,
                      backgroundColor: appleColors.blue,
                      color: 'white',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0052a3';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = appleColors.blue;
                    }}
                  >
                    Message
                  </button>
                  <button
                    onClick={() => {
                      window.history.pushState(null, '', `/profile/${profile.id}`);
                      setPathname(`/profile/${profile.id}`);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: 'transparent',
                      color: appleColors.gray,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontWeight: '600',
                      fontSize: '13px',
                      border: `1px solid ${appleColors.silver}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = appleColors.white;
                      e.currentTarget.style.borderColor = appleColors.gray;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.borderColor = appleColors.silver;
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: appleColors.gray,
        color: appleColors.silver,
        padding: '48px 32px 24px',
        marginTop: '64px'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '32px', marginBottom: '32px' }}>
            <div>
              <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>SkillSwap</h4>
              <p style={{ fontSize: '14px', color: '#999', maxWidth: '300px', lineHeight: '1.6' }}>
                Trade skills, not dollars. Connect with people who have what you need and need what you have.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '48px', flexWrap: 'wrap' }}>
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Company</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: '#999', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Terms of Service</button>
                  <button onClick={() => setShowTerms(true)} style={{ background: 'none', border: 'none', color: '#999', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Privacy Policy</button>
                </div>
              </div>
              <div>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>Get Started</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={handleJoin} style={{ background: 'none', border: 'none', color: '#999', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Sign Up</button>
                  <button onClick={handleJoin} style={{ background: 'none', border: 'none', color: '#999', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>Post a Skill</button>
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #555', paddingTop: '16px', textAlign: 'center' }}>
            <p style={{ fontSize: '12px', color: '#777' }}>2026 SkillSwap. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth modal for /auth route */}
      {pathname === '/auth' && (
        <Auth
          onClose={handleAuthClose}
          onShowTerms={() => setShowTerms(true)}
          refCode={null}
        />
      )}

      {/* Terms modal ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ shown when setShowTerms(true) is called */}
      {showTerms && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setShowTerms(false)}
        >
          <div
            style={{ background: '#13131A', border: '1px solid #2a2a35', borderRadius: 20, maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTerms(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#6B6B78', cursor: 'pointer', fontSize: 20 }}
            >ÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂÃÂÃÂ</button>
            <Terms />
          </div>
        </div>
      )}

      {/* Free Swap Promo Popup */}
      <FreeSwapPromo
        currentUser={currentUser}
        showPromo={showPromo}
        onClose={() => setShowPromo(false)}
      />

      {/* Message Modal */}
      {messageModal && (
        <div onClick={() => setMessageModal(null)} style={{ position:'fixed',inset:0,zIndex:500,background:'rgba(0,0,0,0.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:24 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:'white',borderRadius:16,padding:32,maxWidth:480,width:'100%',boxShadow:'0 8px 40px rgba(0,0,0,0.18)',position:'relative' }}>
            <button onClick={()=>setMessageModal(null)} style={{ position:'absolute',top:16,right:16,background:'transparent',border:'none',fontSize:20,cursor:'pointer',color:'#888' }}>Ã¢ÂÂ</button>
            {msgSent ? (
              <div style={{ textAlign:'center',padding:'24px 0' }}>
                <div style={{ fontSize:48,marginBottom:16 }}>Ã¢ÂÂ</div>
                <h3 style={{ fontSize:22,fontWeight:700,color:'#0A0A0F',marginBottom:8 }}>Message sent!</h3>
                <p style={{ color:'#666',fontSize:15,marginBottom:24 }}>We'll connect you with <strong>{messageModal.recipientName}</strong> shortly.</p>
                <button onClick={()=>setMessageModal(null)} style={{ backgroundColor:'#0066cc',color:'white',border:'none',borderRadius:8,padding:'12px 32px',fontWeight:600,fontSize:15,cursor:'pointer' }}>Done</button>
              </div>
            ) : (
              <>
                <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:24,paddingRight:24 }}>
                  <div style={{ width:48,height:48,borderRadius:'50%',backgroundColor:'#0066cc',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:700,fontSize:20,flexShrink:0 }}>{messageModal.recipientName.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight:700,fontSize:17,color:'#0A0A0F' }}>{messageModal.recipientName}</div>
                    {messageModal.recipientSkill && <div style={{ fontSize:13,color:'#888',marginTop:2 }}>{messageModal.recipientSkill}</div>}
                  </div>
                </div>
                <p style={{ fontSize:14,color:'#555',marginBottom:12 }}>Introduce yourself and describe the skill swap you have in mind:</p>
                <textarea value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder={`Hi ${messageModal.recipientName.split(' ')[0]}, I'd love to swap skills! I can offer...`} rows={5} style={{ width:'100%',padding:12,borderRadius:8,border:'1px solid #e6e6e6',fontSize:14,fontFamily:'inherit',resize:'vertical',boxSizing:'border-box',outline:'none' }} />
                {msgError && <p style={{ color:'#dc2626',fontSize:13,marginTop:8 }}>{msgError}</p>}
                <div style={{ display:'flex',justifyContent:'flex-end',gap:10,marginTop:16 }}>
                  <button onClick={()=>setMessageModal(null)} style={{ padding:'10px 20px',borderRadius:8,border:'1px solid #e6e6e6',background:'white',color:'#555',fontWeight:600,fontSize:14,cursor:'pointer' }}>Cancel</button>
                  <button onClick={handleSendMessage} disabled={msgSending||!msgText.trim()} style={{ padding:'10px 24px',borderRadius:8,border:'none',background:msgText.trim()?'#0066cc':'#ccc',color:'white',fontWeight:600,fontSize:14,cursor:msgText.trim()?'pointer':'not-allowed' }}>{msgSending?'Sending...':'Send Message'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
// Force rebuild - trigger Vercel redeploy

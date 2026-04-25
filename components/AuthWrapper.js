// 📁 LOCATION: components/AuthWrapper.js
'use client';

import { useState, useEffect } from 'react';
import { auth, provider, ALLOWED_EMAILS, signInWithPopup, signOut, onAuthStateChanged } from '../lib/firebase';
import { AppStateProvider } from '../lib/state';

const LOGO = 'https://yt3.ggpht.com/f-njPL99xOnQaXJYUPNkxJQTyH3SLRlhQIWwSpAlgrkySuGcBvQLAFTqllWrfQI42KIFx678=s800-c-k-c0x00ffffff-no-rj';

export default function AuthWrapper({ children }) {
  const [status,  setStatus]  = useState('loading');
  const [user,    setUser]    = useState(null);
  const [error,   setError]   = useState('');
  const [btnBusy, setBtnBusy] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(u.email)) {
          await signOut(auth);
          setStatus('auth');
          setError('❌ Is email ko access nahi hai.');
          return;
        }
        setUser(u); setStatus('app');
      } else {
        setUser(null); setStatus('auth');
      }
    });
    return unsub;
  }, []);

  async function googleLogin() {
    setBtnBusy(true); setError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      let msg = 'Login fail. Dobara try karo.';
      if (e.code === 'auth/popup-closed-by-user')   msg = 'Popup band kar diya.';
      if (e.code === 'auth/network-request-failed')  msg = 'Internet check karo.';
      if (e.code === 'auth/popup-blocked')           msg = 'Popup block hai — browser mein allow karo.';
      setError('⚠️ ' + msg);
    } finally { setBtnBusy(false); }
  }

  // ── Loading ───────────────────────────────────
  if (status === 'loading') {
    return (
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#080008', gap:16 }}>
        <style>{`
          @keyframes s1 { 0%,15%,85%,100%{width:0} 30%,70%{width:60px} }
          @keyframes s2 { 0%,30%,100%{width:0} 45%,85%{width:44px} }
          @keyframes s3 { 0%,45%{width:0} 60%,100%{width:70px} }
          @keyframes s4 { 0%,60%,100%{width:0} 75%,95%{width:34px} }
          @keyframes brushX { 0%{left:52px} 25%{left:38px} 50%{left:62px} 75%{left:26px} 100%{left:52px} }
          @keyframes brushY { 0%{top:10px} 25%{top:28px} 50%{top:46px} 75%{top:64px} 100%{top:10px} }
          @keyframes dotPulse { 0%,80%,100%{opacity:.2;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
        `}</style>

        <div style={{ position:'relative', width:110, height:114 }}>
          {/* Canvas SVG */}
          <svg width="110" height="114" viewBox="0 0 110 114">
            <line x1="15" y1="88" x2="4" y2="113" stroke="#6b4c2a" strokeWidth="3" strokeLinecap="round"/>
            <line x1="95" y1="88" x2="106" y2="113" stroke="#6b4c2a" strokeWidth="3" strokeLinecap="round"/>
            <line x1="55" y1="88" x2="55" y2="113" stroke="#6b4c2a" strokeWidth="2.5" strokeLinecap="round"/>
            <rect x="8" y="5" width="94" height="83" rx="4" fill="#f5f0e8" stroke="#6b4c2a" strokeWidth="3"/>
            <rect x="16" y="17" height="12" rx="4" fill="#ff6644" style={{width:0, animation:'s1 3.2s ease-in-out infinite'}}/>
            <rect x="16" y="34" height="12" rx="4" fill="#cc55ff" style={{width:0, animation:'s2 3.2s ease-in-out infinite'}}/>
            <rect x="16" y="51" height="12" rx="4" fill="#ff3388" style={{width:0, animation:'s3 3.2s ease-in-out infinite'}}/>
            <rect x="16" y="68" height="10" rx="4" fill="#33aaff" style={{width:0, animation:'s4 3.2s ease-in-out infinite'}}/>
          </svg>
          {/* Brush */}
          <div style={{ position:'absolute', animation:'brushX 3.2s ease-in-out infinite, brushY 3.2s ease-in-out infinite', pointerEvents:'none' }}>
            <svg width="18" height="36" viewBox="0 0 18 36">
              <rect x="7" y="0" width="4" height="22" rx="2" fill="#d4a96a"/>
              <rect x="6" y="21" width="6" height="4" rx="1" fill="#999"/>
              <ellipse cx="9" cy="30" rx="5" ry="6" fill="#ff6644"/>
            </svg>
          </div>
        </div>

        <span style={{ fontWeight:800, fontSize:22, background:'linear-gradient(135deg,#ff6644,#cc88ff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          रंग तरंग
        </span>
        <div style={{ display:'flex', gap:6 }}>
          {[0,0.2,0.4].map((d,i) => (
            <span key={i} style={{ width:6, height:6, background:'#ff6644', borderRadius:'50%', display:'inline-block', animation:'dotPulse 1.2s ease-in-out infinite', animationDelay:`${d}s` }}/>
          ))}
        </div>
      </div>
    );
  }

  // ── Auth / Login ──────────────────────────────
  if (status === 'auth') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#080008', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 340, textAlign: 'center' }}>
          {/* Logo */}
          <img src={LOGO} alt="RangTarang" style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid #ff6644', marginBottom: 12, objectFit: 'cover' }} />
          <div style={{ fontWeight: 800, fontSize: 22, background: 'linear-gradient(135deg,#ff6644,#cc88ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 4 }}>रंग तरंग</div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 32 }}>Studio</div>

          {/* Card */}
          <div style={{ background: '#0f0f0f', border: '1px solid #2a0022', borderRadius: 20, padding: '28px 24px' }}>
            <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, marginBottom: 24 }}>
              Apne Google account se login karo aur channel manage karo! 🌈
            </p>

            <button onClick={googleLogin} disabled={btnBusy} style={{ width: '100%', padding: 14, background: '#fff', color: '#111', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: btnBusy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: btnBusy ? 0.7 : 1 }}>
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.6 29.2 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.2 5.1 29.4 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.1-2.7-.4-4z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.9 1.1 8.1 2.9l5.7-5.7C34.2 5.1 29.4 3 24 3 16.3 3 9.7 7.9 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 45c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 36.3 26.8 37 24 37c-5.2 0-9.6-3.4-11.2-8.1l-6.6 5.1C9.7 40.1 16.3 45 24 45z"/>
                <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.4-2.4 4.5-4.5 5.8l6.2 5.2C40.8 35.5 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
              </svg>
              {btnBusy ? 'Login ho raha hai...' : 'Google se Login Karo'}
            </button>

            {error && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(255,68,0,0.1)', border: '1px solid #440000', borderRadius: 8, color: '#ff6666', fontSize: 12 }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── App ───────────────────────────────────────
  return (
    <AppStateProvider>
      {typeof children === 'function' ? children({ user }) : children}
    </AppStateProvider>
  );
}

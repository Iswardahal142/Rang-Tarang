// 📁 LOCATION: components/AppShell.js
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const LOGO = 'https://yt3.ggpht.com/f-njPL99xOnQaXJYUPNkxJQTyH3SLRlhQIWwSpAlgrkySuGcBvQLAFTqllWrfQI42KIFx678=s800-c-k-c0x00ffffff-no-rj';

const TABS = [
  { key: 'dashboard',      icon: '📺', label: 'Dashboard',   path: '/dashboard'      },
  { key: 'activity',       icon: '💬', label: 'Activity',    path: '/activity'       },
  { key: 'create-series',  icon: '🎬', label: 'Series',      path: '/create-series'  },
  { key: 'compare-series', icon: '⚔️', label: 'Compare',     path: '/compare-action' },
  { key: 'long-video',     icon: '🎥', label: 'Long Video',  path: '/long-video'     },
  { key: 'trending',       icon: '🔥', label: 'Trending',    path: '/trending'       },
];
const TAB_COLORS = { dashboard: '#ff4400', activity: '#44bb66', 'create-series': '#cc88ff', 'compare-series': '#ffaa00', 'long-video': '#4488ff', trending: '#ff4400' };

// Notification type → color/icon
function getNotifStyle(n) {
  const t = (n.type || n.icon || '').toLowerCase();
  if (t.includes('like') || t === '❤️' || t === '👍')
    return { accent: '#ff4488', icon: '❤️' };
  if (t.includes('comment') || t === '💬')
    return { accent: '#4488ff', icon: '💬' };
  if (t.includes('sub') || t === '👥' || t === '🔔')
    return { accent: '#44bb66', icon: '🔔' };
  if (t.includes('view') || t === '👁')
    return { accent: '#ff8800', icon: '👁' };
  return { accent: '#ff4400', icon: n.icon || '🔔' };
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router   = useRouter();

  const [sidebarOpen, setSidebarOpen]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds]             = useState(new Set()); // ✅ FIX: track read locally
  const [showBell, setShowBell]           = useState(false);
  const [showChannel, setShowChannel]     = useState(false);
  const [ytData, setYtData]               = useState(null);
  const [copied, setCopied]               = useState(false);

  const bellRef    = useRef(null);
  const channelRef = useRef(null);
  const pollRef    = useRef(null);

  const isLoginPage = pathname === '/' || pathname === '/login';

  useEffect(() => {
    if (!isLoginPage) {
      fetchNotifications();
      fetchYT();
      pollRef.current = setInterval(fetchNotifications, 30000);
    }
    return () => clearInterval(pollRef.current);
  }, [isLoginPage]);

  useEffect(() => {
    function h(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
      if (channelRef.current && !channelRef.current.contains(e.target)) setShowChannel(false);
    }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function fetchYT() {
    try {
      const res = await fetch('/api/youtube');
      const data = await res.json();
      if (!data.error) setYtData(data);
    } catch {}
  }

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (!data.error) {
        // ✅ FIX: server se sirf fresh notifications lo, read state local rakho
        setNotifications(data.notifications || []);
      }
    } catch {}
  }

  // ✅ FIX: read state sirf local Set mein track hoga — server poll se overwrite nahi hoga
  function markRead(id) {
    setReadIds(prev => new Set([...prev, id]));
  }
  function markAllRead() {
    setReadIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
  }

  // Merge: notification read hai agar readIds mein hai YA server ne read:true bheji
  function isRead(n) {
    return readIds.has(n.id) || !!n.read;
  }

  function copyLink() {
    navigator.clipboard.writeText(`https://www.youtube.com/channel/${ytData?.channelId || ''}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  function fmtNum(n) {
    n = parseInt(n || 0);
    if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
    if (n >= 100000)  return (n/100000).toFixed(1)+'L';
    if (n >= 1000)    return (n/1000).toFixed(1)+'K';
    return n.toString();
  }

  const unreadCount = notifications.filter(n => !isRead(n)).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#080008' }}>

      {/* ── HEADER ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 997,
        height: 52,
        background: 'rgba(8,0,8,0.97)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid #2a0022',
        display: 'flex', alignItems: 'center',
        padding: '0 14px', gap: 10,
      }}>

        {/* Left — Hamburger */}
        {!isLoginPage ? (
          <button onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 2px', display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0, width: 32 }}>
            <span style={{ display: 'block', width: 22, height: 2, background: sidebarOpen ? '#ff4400' : '#888', borderRadius: 2, transition: 'all 0.25s', transform: sidebarOpen ? 'rotate(45deg) translate(5px,5px)' : 'none' }} />
            <span style={{ display: 'block', width: 22, height: 2, background: sidebarOpen ? 'transparent' : '#888', borderRadius: 2, transition: 'all 0.25s', opacity: sidebarOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: sidebarOpen ? '#ff4400' : '#888', borderRadius: 2, transition: 'all 0.25s', transform: sidebarOpen ? 'rotate(-45deg) translate(5px,-5px)' : 'none' }} />
          </button>
        ) : <div style={{ width: 32 }} />}

        {/* Center — Logo + Name */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <img src={LOGO} alt="" style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #ff6644', objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg,#ff6644,#cc88ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            रंग तरंग
          </span>
        </div>

        {/* Right — Bell + Channel Logo */}
        {!isLoginPage ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 'auto' }}>

            {/* Bell */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowBell(o => !o); setShowChannel(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, position: 'relative', display: 'inline-flex' }}>
                <span style={{ fontSize: 22 }}>🔔</span>
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: '#ff4400', color: '#fff', fontSize: 9, fontWeight: 800, width: 15, height: 15, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Bell Dropdown */}
              {showBell && (
                <div style={{ position: 'absolute', top: 44, right: 0, zIndex: 9999, background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 16, width: 290, maxHeight: 400, overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.9)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#eee' }}>🔔 Notifications</span>
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Sab Read</button>
                  </div>
                  {notifications.length === 0
                    ? <div style={{ padding: 24, textAlign: 'center', color: '#444', fontSize: 12 }}>Koi notification nahi</div>
                    : notifications.map(n => {
                        const read = isRead(n);
                        const { accent, icon } = getNotifStyle(n);
                        return (
                          <div key={n.id} onClick={() => markRead(n.id)}
                            style={{ padding: '12px 14px', borderBottom: '1px solid #111', background: read ? 'transparent' : `${accent}11`, cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start', borderLeft: read ? '3px solid transparent' : `3px solid ${accent}` }}>
                            <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: read ? '#555' : '#eee', marginBottom: 2 }}>{n.title}</div>
                              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{n.body}</div>
                            </div>
                            {!read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: accent, marginTop: 4, flexShrink: 0 }} />}
                          </div>
                        );
                      })
                  }
                </div>
              )}
            </div>

            {/* Channel Logo */}
            <div ref={channelRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowChannel(o => !o); setShowBell(false); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <img src={LOGO} alt="" style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${showChannel ? '#ff4400' : '#333'}`, objectFit: 'cover', display: 'block' }} />
              </button>

              {/* Channel Dropdown */}
              {showChannel && (
                <div style={{ position: 'absolute', top: 42, right: 0, zIndex: 9999, background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 16, width: 240, padding: 16, boxShadow: '0 8px 30px rgba(0,0,0,0.9)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <img src={LOGO} alt="" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #ff4400', objectFit: 'cover' }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{ytData?.channelName || 'रंग तरंग'}</div>
                      <div style={{ fontSize: 11, color: '#ff6644', fontWeight: 700 }}>👥 {fmtNum(ytData?.subscriberCount)} subscribers</div>
                    </div>
                  </div>
                  <button onClick={copyLink} style={{ width: '100%', background: copied ? '#1a3a1a' : '#1a1a1a', border: `1px solid ${copied ? '#44bb66' : '#333'}`, color: copied ? '#44bb66' : '#aaa', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {copied ? '✅ Copied!' : '📋 Channel Link Copy Karo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : <div style={{ width: 32 }} />}
      </header>

      {/* ── SIDEBAR OVERLAY ── */}
      {!isLoginPage && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 995 }} />
      )}

      {/* ── SIDEBAR ── */}
      {!isLoginPage && (
        <aside style={{
          position: 'fixed', top: 52, left: 0, bottom: 58,
          width: sidebarOpen ? 220 : 0,
          background: '#0a000a',
          borderRight: sidebarOpen ? '1px solid #2a0022' : 'none',
          zIndex: 996,
          overflow: 'hidden',
          transition: 'width 0.25s ease',
        }}>
          <div style={{ width: 220, padding: '16px 0', opacity: sidebarOpen ? 1 : 0, transition: 'opacity 0.15s' }}>
            <div style={{ fontSize: 10, color: '#444', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, padding: '0 16px', marginBottom: 12 }}>Menu</div>
            {TABS.map(tab => {
              const active = pathname.startsWith(tab.path);
              const color  = TAB_COLORS[tab.key];
              return (
                <button key={tab.key} onClick={() => { router.push(tab.path); setSidebarOpen(false); }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: active ? `${color}12` : 'none', border: 'none', borderLeft: active ? `3px solid ${color}` : '3px solid transparent', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 20 }}>{tab.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? color : '#666' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>
      )}

      {/* ── MAIN CONTENT ── */}
      <main style={{ flex: 1, paddingTop: 52, paddingBottom: isLoginPage ? 0 : 58, minHeight: '100vh' }}>
        {children}
      </main>

      {/* ── BOTTOM NAV ── */}
      {!isLoginPage && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 998,
          display: 'flex', alignItems: 'stretch',
          background: 'rgba(8,0,8,0.97)',
          backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
          borderTop: '1px solid #2a0022',
          height: 58,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}>
          {TABS.map(tab => {
            const active = pathname.startsWith(tab.path);
            const color  = TAB_COLORS[tab.key];
            return (
              <button key={tab.key} onClick={() => router.push(tab.path)}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', WebkitTapHighlightColor: 'transparent', position: 'relative' }}>
                {active && <span style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: color, borderRadius: '0 0 3px 3px' }} />}
                <span style={{ fontSize: 22, lineHeight: 1, transform: active ? 'translateY(-1px)' : 'none', transition: 'transform 0.15s' }}>{tab.icon}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

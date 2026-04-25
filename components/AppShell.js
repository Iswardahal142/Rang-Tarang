// 📁 LOCATION: components/AppShell.js
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const LOGO = 'https://yt3.ggpht.com/f-njPL99xOnQaXJYUPNkxJQTyH3SLRlhQIWwSpAlgrkySuGcBvQLAFTqllWrfQI42KIFx678=s800-c-k-c0x00ffffff-no-rj';

const TABS = [
  { key: 'dashboard',     icon: '📺', label: 'Dashboard',  path: '/dashboard'     },
  { key: 'activity',      icon: '💬', label: 'Activity',   path: '/activity'      },
  { key: 'create-series', icon: '🎬', label: 'Series',     path: '/create-series' },
];
const TAB_COLORS = { dashboard: '#ff4400', activity: '#44bb66', 'create-series': '#cc88ff' };

function BellIcon({ count }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <span style={{ fontSize: 20 }}>🔔</span>
      {count > 0 && (
        <span style={{ position: 'absolute', top: -4, right: -4, background: '#ff4400', color: '#fff', fontSize: 9, fontWeight: 800, width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </div>
  );
}

function NotificationPanel({ notifications, onRead, onReadAll }) {
  function timeStr(t) {
    if (!t) return '';
    const d = Math.floor((Date.now() - new Date(t).getTime()) / 60000);
    if (d < 1) return 'Abhi';
    if (d < 60) return `${d}m pehle`;
    if (d < 1440) return `${Math.floor(d / 60)}h pehle`;
    return `${Math.floor(d / 1440)}d pehle`;
  }
  return (
    <div style={{ position: 'absolute', top: 48, right: 0, zIndex: 9999, background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 16, width: 290, maxHeight: 400, overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#eee' }}>🔔 Notifications</span>
        <button onClick={onReadAll} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Sab Read</button>
      </div>
      {notifications.length === 0
        ? <div style={{ padding: 24, textAlign: 'center', color: '#444', fontSize: 12 }}>Koi notification nahi</div>
        : notifications.map(n => (
          <div key={n.id} onClick={() => onRead(n.id)} style={{ padding: '12px 14px', borderBottom: '1px solid #111', background: n.read ? 'transparent' : '#1a0a00', cursor: 'pointer', display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: n.read ? '#555' : '#eee', marginBottom: 2 }}>{n.title}</div>
              <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{n.body}</div>
              <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{timeStr(n.time)}</div>
            </div>
            {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4400', marginTop: 4, flexShrink: 0 }} />}
          </div>
        ))
      }
    </div>
  );
}

export default function AppShell({ children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showBell, setShowBell]           = useState(false);
  const bellRef                           = useRef(null);
  const pollRef                           = useRef(null);

  useEffect(() => {
    fetchNotifications();
    pollRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    function h(e) { if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (!data.error) {
        setNotifications(prev => {
          const prevMap = Object.fromEntries(prev.map(n => [n.id, n]));
          return (data.notifications || []).map(n => prevMap[n.id] || n);
        });
      }
    } catch {}
  }

  function markRead(id) { setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x)); }
  function markAllRead() { setNotifications(n => n.map(x => ({ ...x, read: true }))); }

  const unreadCount = notifications.filter(n => !n.read).length;
  const isLoginPage = pathname === '/' || pathname === '/login';

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
        padding: '0 14px',
      }}>
        {/* Left sidebar placeholder (blank for now) */}
        <div style={{ width: 40 }} />

        {/* Center — Logo */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <img src={LOGO} alt="RangTarang" style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #ff6644', objectFit: 'cover' }} />
          <span style={{ fontWeight: 800, fontSize: 15, background: 'linear-gradient(135deg,#ff6644,#cc88ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            रंग तरंग
          </span>
        </div>

        {/* Right — Bell */}
        {!isLoginPage && (
          <div ref={bellRef} style={{ position: 'relative', width: 40, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setShowBell(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <BellIcon count={unreadCount} />
            </button>
            {showBell && (
              <NotificationPanel notifications={notifications} onRead={markRead} onReadAll={markAllRead} />
            )}
          </div>
        )}
        {isLoginPage && <div style={{ width: 40 }} />}
      </header>

      {/* ── BODY (sidebar + content) ── */}
      <div style={{ display: 'flex', flex: 1, paddingTop: 52 }}>

        {/* Left Sidebar — blank for now */}
        {!isLoginPage && (
          <aside style={{
            width: 56,
            position: 'fixed', top: 52, left: 0, bottom: 58,
            background: 'rgba(8,0,8,0.95)',
            borderRight: '1px solid #1a0022',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            paddingTop: 12, gap: 8,
            zIndex: 996,
          }}>
            {/* Empty for now — bhai baad mein fill karenge */}
          </aside>
        )}

        {/* Main Content */}
        <main style={{ flex: 1, marginLeft: isLoginPage ? 0 : 56, minHeight: 'calc(100vh - 52px - 58px)', overflow: 'hidden' }}>
          {children}
        </main>
      </div>

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
                <span style={{ fontSize: 10, color: active ? color : '#555', letterSpacing: 0.3, transition: 'color 0.15s', fontWeight: active ? 700 : 400 }}>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

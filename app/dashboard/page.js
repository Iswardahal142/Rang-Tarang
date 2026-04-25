// 📁 LOCATION: app/dashboard/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import AuthWrapper from '../../components/AuthWrapper';

import { ToastProvider, useToast } from '../../components/Toast';

function formatViews(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n/1000000).toFixed(1)+'M';
  if (n >= 100000)  return (n/100000).toFixed(1)+'L';
  if (n >= 1000)    return (n/1000).toFixed(1)+'K';
  return n.toString();
}
function timeAgo(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now()-new Date(iso).getTime())/86400000);
  if (d===0) return 'Aaj'; if (d===1) return 'Kal';
  if (d<30) return `${d} din pehle`;
  if (d<365) return `${Math.floor(d/30)} mahine pehle`;
  return `${Math.floor(d/365)} saal pehle`;
}
function fmtDur(sec) {
  if (!sec) return '';
  return `${Math.floor(sec/60)}:${(sec%60).toString().padStart(2,'0')}`;
}

// ── Bell Notifications ────────────────────────────────────
function BellIcon({ count }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <span style={{ fontSize: 22 }}>🔔</span>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          background: '#ff4400', color: '#fff',
          fontSize: 9, fontWeight: 800,
          width: 16, height: 16, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{count > 9 ? '9+' : count}</span>
      )}
    </div>
  );
}

function NotificationPanel({ notifications, onRead, onReadAll, onClose }) {
  function timeStr(t) {
    if (!t) return '';
    const d = Math.floor((Date.now()-new Date(t).getTime())/60000);
    if (d < 1) return 'Abhi';
    if (d < 60) return `${d}m pehle`;
    if (d < 1440) return `${Math.floor(d/60)}h pehle`;
    return `${Math.floor(d/1440)}d pehle`;
  }
  return (
    <div style={{
      position: 'absolute', top: 46, right: 0, zIndex: 999,
      background: '#0f0f0f', border: '1px solid #2a2a2a',
      borderRadius: 16, width: 290, maxHeight: 400,
      overflowY: 'auto', boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #1a1a1a' }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#eee' }}>🔔 Notifications</span>
        <button onClick={onReadAll} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Sab Read</button>
      </div>
      {notifications.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: '#444', fontSize: 12 }}>Koi notification nahi</div>
      ) : notifications.map(n => (
        <div key={n.id} onClick={() => onRead(n.id)}
          style={{ padding: '12px 14px', borderBottom: '1px solid #111', background: n.read ? 'transparent' : '#1a0a00', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: n.read ? '#666' : '#eee', marginBottom: 2 }}>{n.title}</div>
            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.4 }}>{n.body}</div>
            <div style={{ fontSize: 10, color: '#444', marginTop: 4 }}>{timeStr(n.time)}</div>
          </div>
          {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff4400', marginTop: 4, flexShrink: 0 }} />}
        </div>
      ))}
    </div>
  );
}

// ── Channel Profile ───────────────────────────────────────
function ChannelProfile({ ytData }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  function copyLink() {
    navigator.clipboard.writeText(`https://www.youtube.com/channel/${ytData?.channelId||''}`).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: '50%', padding: 0, cursor: 'pointer', width: 34, height: 34, overflow: 'hidden' }}>
        {ytData?.channelThumb
          ? <img src={ytData.channelThumb} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%' }} />
          : <div style={{ width: 34, height: 34, background: '#1a0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📺</div>
        }
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 42, right: 0, zIndex: 999, background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 16, padding: 16, minWidth: 240, boxShadow: '0 8px 30px rgba(0,0,0,0.7)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {ytData?.channelThumb ? <img src={ytData.channelThumb} alt="" style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid #ff4400' }} /> : <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#1a0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📺</div>}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{ytData?.channelName||'Channel'}</div>
              <div style={{ fontSize: 11, color: '#ff6644', fontWeight: 700 }}>👥 {formatViews(parseInt(ytData?.subscriberCount||0))} subscribers</div>
            </div>
          </div>
          <button onClick={copyLink} style={{ width: '100%', background: copied ? '#1a3a1a' : '#1a1a1a', border: `1px solid ${copied ? '#44bb66' : '#333'}`, color: copied ? '#44bb66' : '#aaa', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {copied ? '✅ Copied!' : '📋 Channel Link Copy Karo'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Top Banner ────────────────────────────────────────────
function TopVideoBanner({ video }) {
  return (
    <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'relative', paddingTop: '56.25%' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>▶</div>
        }
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', top: 10, left: 10, background: '#ff4400', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>🔥 BEST VIDEO</div>
        {video.isShort
          ? <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.85)', color: '#ff4400', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4 }}>⚡ SHORT</div>
          : video.durationSec > 0 && <div style={{ position: 'absolute', bottom: 68, right: 10, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>{fmtDur(video.durationSec)}</div>
        }
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1.4, marginBottom: 6, fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{video.title}</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#ff6644', fontWeight: 700 }}>👁 {formatViews(video.viewCount)}</span>
            <span style={{ fontSize: 12, color: '#aaa' }}>👍 {formatViews(video.likeCount)}</span>
            <span style={{ fontSize: 12, color: '#666' }}>{timeAgo(video.publishedAt)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

// ── Small Card ────────────────────────────────────────────
function SmallCard({ video }) {
  return (
    <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', gap: 10, textDecoration: 'none', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ position: 'relative', width: 110, height: 62, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#111' }}>
        {video.thumbnail ? <img src={video.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>}
        {video.isShort
          ? <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.85)', color: '#ff4400', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3 }}>⚡</div>
          : video.durationSec > 0 && <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>{fmtDur(video.durationSec)}</div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', lineHeight: 1.4, marginBottom: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{video.title}</div>
        <div style={{ fontSize: 10, color: '#ff6644', fontWeight: 700 }}>👁 {formatViews(video.viewCount)}</div>
        <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{timeAgo(video.publishedAt)}</div>
      </div>
    </a>
  );
}

// ── Main Dashboard ────────────────────────────────────────
function DashboardPage({ user }) {
  const [ytData, setYtData]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [filter, setFilter]           = useState('all');
  const [sortBy, setSortBy]           = useState('views');
  const [notifications, setNotifications] = useState([]);
  const [showBell, setShowBell]       = useState(false);
  const bellRef                       = useRef(null);
  const pollRef                       = useRef(null);
  const initial = (user?.displayName||user?.email||'U').charAt(0).toUpperCase();

  useEffect(() => {
    fetchAll();
    // 30s polling
    pollRef.current = setInterval(fetchAll, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    function h(e) { if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  async function fetchAll() {
    fetchYT();
    fetchNotifications();
  }

  async function fetchYT() {
    if (!loading) {} // silent refresh
    try {
      const res = await fetch('/api/youtube');
      const data = await res.json();
      if (!data.error) { setYtData(data); setError(''); setLoading(false); }
      else { setError(data.error); setLoading(false); }
    } catch (e) { setError(e.message); setLoading(false); }
  }

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (!data.error) {
        setNotifications(prev => {
          const prevIds = new Set(prev.map(n => n.id));
          const newOnes = (data.notifications||[]).map(n => prevIds.has(n.id) ? (prev.find(p => p.id===n.id)||n) : n);
          return newOnes;
        });
      }
    } catch {}
  }

  function markRead(id) {
    setNotifications(n => n.map(x => x.id===id ? {...x, read: true} : x));
  }
  function markAllRead() {
    setNotifications(n => n.map(x => ({...x, read: true})));
  }

  const unreadCount = notifications.filter(n => !n.read).length;
  const videos = ytData?.videos || [];
  const filtered = videos.filter(v => {
    if (filter==='all') return true;
    if (filter==='short') return v.isShort===true;
    return v.isShort===false;
  });
  const sorted = [...filtered].sort((a,b) => {
    if (sortBy==='views') return (b.viewCount||0)-(a.viewCount||0);
    if (sortBy==='likes') return (b.likeCount||0)-(a.likeCount||0);
    return new Date(b.publishedAt)-new Date(a.publishedAt);
  });
  const totalViews = videos.reduce((a,v) => a+(v.viewCount||0), 0);
  const totalLikes = videos.reduce((a,v) => a+(v.likeCount||0), 0);
  const avgViews = videos.length ? Math.round(totalViews/videos.length) : 0;
  const topVideo = [...videos].sort((a,b)=>(b.viewCount||0)-(a.viewCount||0))[0];

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      {/* TOP BAR */}
      <div className="mini-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌈</span>
          <span style={{ color: '#ff6644', fontSize: 14, fontWeight: 700 }}>RangTarang Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <button onClick={() => setShowBell(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <BellIcon count={unreadCount} />
            </button>
            {showBell && (
              <NotificationPanel
                notifications={notifications}
                onRead={markRead}
                onReadAll={markAllRead}
                onClose={() => setShowBell(false)}
              />
            )}
          </div>
          {ytData && <ChannelProfile ytData={ytData} />}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#555' }}><div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: '#ff4400' }} /><div style={{ fontSize: 12 }}>Loading...</div></div>}
        {error && <div style={{ background: '#1a0000', border: '1px solid #440000', borderRadius: 12, padding: 16, fontSize: 12, color: '#ff6666' }}>⚠️ {error}</div>}

        {!loading && !error && ytData && <>
          {/* STATS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Total Views', value: formatViews(totalViews), icon: '👁', color: '#ff6644' },
              { label: 'Total Likes', value: formatViews(totalLikes), icon: '👍', color: '#44bb66' },
              { label: 'Avg Views',   value: formatViews(avgViews),   icon: '📊', color: '#4488ff' },
            ].map((s,i) => (
              <div key={i} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 18 }}>{s.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
                <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* TOP VIDEO BANNER */}
          {topVideo && <>
            <div style={{ fontSize: 10, color: '#ff4400', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700 }}>🔥 Best Performing</div>
            <TopVideoBanner video={topVideo} />
          </>}

          {/* FILTER + SORT */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {[{key:'all',label:'🎬 All'},{key:'short',label:'⚡ Shorts'},{key:'long',label:'📹 Long'}].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{ flex: 1, padding: '8px 4px', borderRadius: 20, border: 'none', cursor: 'pointer', background: filter===f.key ? '#ff4400' : '#1a1a1a', color: filter===f.key ? '#fff' : '#666', fontSize: 11, fontWeight: 700 }}>{f.label}</button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', borderRadius: 20, padding: '8px 10px', fontSize: 11, outline: 'none' }}>
              <option value="views">👁 Views</option>
              <option value="likes">👍 Likes</option>
              <option value="recent">🕐 Recent</option>
            </select>
          </div>

          {/* VIDEO LIST */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, padding: '4px 14px' }}>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, padding: '10px 0 4px' }}>📹 {sorted.length} Videos</div>
            {sorted.map(v => <SmallCard key={v.videoId} video={v} />)}
            {!sorted.length && <div style={{ textAlign: 'center', padding: 20, color: '#444', fontSize: 12 }}>Koi video nahi mili.</div>}
          </div>
        </>}
      </div>
      </>
    </div>
  );
}

export default function DashboardWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <DashboardPage user={user} />}</AuthWrapper></ToastProvider>;
}

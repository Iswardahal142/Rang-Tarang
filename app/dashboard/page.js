// 📁 LOCATION: app/dashboard/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import BottomNav from '../../components/BottomNav';
import { ToastProvider, useToast } from '../../components/Toast';

function formatViews(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return 'Aaj';
  if (d === 1) return 'Kal';
  if (d < 30) return `${d} din pehle`;
  if (d < 365) return `${Math.floor(d / 30)} mahine pehle`;
  return `${Math.floor(d / 365)} saal pehle`;
}
function fmtDur(sec) {
  if (!sec) return '';
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
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
    navigator.clipboard.writeText(`https://www.youtube.com/channel/${ytData?.channelId || ''}`).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: 'none', border: '1px solid #2a2a2a', borderRadius: '50%',
        padding: 0, cursor: 'pointer', width: 34, height: 34, overflow: 'hidden',
      }}>
        {ytData?.channelThumb
          ? <img src={ytData.channelThumb} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: '50%' }} />
          : <div style={{ width: 34, height: 34, background: '#1a0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📺</div>
        }
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 42, right: 0, zIndex: 999,
          background: '#0f0f0f', border: '1px solid #2a2a2a',
          borderRadius: 16, padding: 16, minWidth: 240,
          boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {ytData?.channelThumb
              ? <img src={ytData.channelThumb} alt="" style={{ width: 46, height: 46, borderRadius: '50%', border: '2px solid #ff4400' }} />
              : <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#1a0000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📺</div>
            }
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{ytData?.channelName || 'Channel'}</div>
              <div style={{ fontSize: 11, color: '#ff6644', fontWeight: 700 }}>👥 {formatViews(parseInt(ytData?.subscriberCount || 0))} subscribers</div>
            </div>
          </div>
          <button onClick={copyLink} style={{
            width: '100%', background: copied ? '#1a3a1a' : '#1a1a1a',
            border: `1px solid ${copied ? '#44bb66' : '#333'}`,
            color: copied ? '#44bb66' : '#aaa',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {copied ? '✅ Copied!' : '📋 Channel Link Copy Karo'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Top Banner Video ──────────────────────────────────────
function TopVideoBanner({ video }) {
  return (
    <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer"
      style={{ display: 'block', textDecoration: 'none', borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#0a0000' }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', paddingTop: '56.25%' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>▶</div>
        }
        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />
        {/* TOP badge */}
        <div style={{ position: 'absolute', top: 10, left: 10, background: '#ff4400', color: '#fff', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>🔥 BEST VIDEO</div>
        {/* Duration */}
        {video.durationSec > 0 && (
          <div style={{ position: 'absolute', bottom: 60, right: 10, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
            {video.isShort ? '⚡ Short' : fmtDur(video.durationSec)}
          </div>
        )}
        {/* Title + stats overlay */}
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

// ── Small Video Card ──────────────────────────────────────
function SmallCard({ video, rank }) {
  return (
    <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer"
      style={{ display: 'flex', gap: 10, textDecoration: 'none', padding: '10px 0', borderBottom: '1px solid #1a1a1a' }}>
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: 110, height: 62, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: '#111' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
        }
        {video.isShort && (
          <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.85)', color: '#ff4400', fontSize: 8, fontWeight: 800, padding: '1px 5px', borderRadius: 3 }}>⚡ SHORT</div>
        )}
        {!video.isShort && video.durationSec > 0 && (
          <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.85)', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 3 }}>{fmtDur(video.durationSec)}</div>
        )}
      </div>
      {/* Info */}
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
  const [ytData, setYtData]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('all');
  const [sortBy, setSortBy]     = useState('views');
  const initial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  useEffect(() => { fetchYT(); }, []);

  async function fetchYT() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/youtube');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setYtData(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  const videos = ytData?.videos || [];

  const filtered = videos.filter(v => {
    if (filter === 'all') return true;
    if (filter === 'short') return v.isShort === true;
    if (filter === 'long') return v.isShort === false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sortBy === 'likes') return (b.likeCount || 0) - (a.likeCount || 0);
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  const totalViews = videos.reduce((a, v) => a + (v.viewCount || 0), 0);
  const totalLikes = videos.reduce((a, v) => a + (v.likeCount || 0), 0);
  const avgViews = videos.length ? Math.round(totalViews / videos.length) : 0;
  const topVideo = [...videos].sort((a,b) => (b.viewCount||0)-(a.viewCount||0))[0];

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      {/* TOP BAR */}
      <div className="mini-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌈</span>
          <span style={{ color: '#ff6644', fontSize: 14, fontWeight: 700 }}>RangTarang Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={fetchYT} style={{ background: 'none', border: '1px solid #333', color: '#666', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>🔄</button>
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
              { label: 'Avg Views', value: formatViews(avgViews), icon: '📊', color: '#4488ff' },
            ].map((s, i) => (
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
              {[{ key: 'all', label: '🎬 All' }, { key: 'short', label: '⚡ Shorts' }, { key: 'long', label: '📹 Long' }].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  background: filter === f.key ? '#ff4400' : '#1a1a1a',
                  color: filter === f.key ? '#fff' : '#666', fontSize: 11, fontWeight: 700,
                }}>{f.label}</button>
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
            <div style={{ fontSize: 10, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, padding: '10px 0 4px' }}>
              📹 {sorted.length} Videos
            </div>
            {sorted.map((v, i) => <SmallCard key={v.videoId} video={v} rank={i + 1} />)}
            {!sorted.length && <div style={{ textAlign: 'center', padding: 20, color: '#444', fontSize: 12 }}>Koi video nahi mili.</div>}
          </div>
        </>}
      </div>
      <BottomNav userInitial={initial} />
    </div>
  );
}

export default function DashboardWrapper() {
  return (
    <ToastProvider>
      <AuthWrapper>{({ user }) => <DashboardPage user={user} />}</AuthWrapper>
    </ToastProvider>
  );
}

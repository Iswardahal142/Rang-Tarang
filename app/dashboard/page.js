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

function YoutubeProfile({ ytData }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function copyChannelLink() {
    const url = `https://www.youtube.com/channel/${ytData?.channelId || ''}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: '#1a0000', border: '1px solid #440000',
        borderRadius: 10, padding: '7px 10px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
      }}>
        <svg width="22" height="15" viewBox="0 0 22 15">
          <rect width="22" height="15" rx="4" fill="#FF0000"/>
          <polygon points="9,3.5 9,11.5 16,7.5" fill="white"/>
        </svg>
        <span style={{ fontSize: 10, color: '#888' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 46, right: 0, zIndex: 999,
          background: '#140000', border: '1px solid #440000',
          borderRadius: 16, padding: 16, minWidth: 230,
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            {ytData?.channelThumb
              ? <img src={ytData.channelThumb} alt="" style={{ width: 44, height: 44, borderRadius: '50%', border: '2px solid #ff4400' }} />
              : <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#330000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📺</div>
            }
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 3 }}>{ytData?.channelName || 'Channel'}</div>
              <div style={{ fontSize: 11, color: '#ff6644', fontWeight: 700 }}>
                👥 {formatViews(parseInt(ytData?.subscriberCount || 0))} subscribers
              </div>
            </div>
          </div>
          <button onClick={copyChannelLink} style={{
            width: '100%', background: copied ? '#1a3a1a' : '#2a0000',
            border: `1px solid ${copied ? '#44bb66' : '#550000'}`,
            color: copied ? '#44bb66' : '#ff8866',
            borderRadius: 10, padding: '10px 14px',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>
            {copied ? '✅ Copied!' : '📋 Channel Link Copy Karo'}
          </button>
        </div>
      )}
    </div>
  );
}

function VideoCard({ video, rank, isTop }) {
  const views = video.viewCount || 0;
  const likes = video.likeCount || 0;
  const ctr = views > 0 ? ((likes / views) * 100).toFixed(1) : '0';
  return (
    <a href={`https://youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer"
      style={{
        display: 'block', textDecoration: 'none',
        background: isTop ? 'linear-gradient(135deg,#0a0000,#1a0500)' : '#0f0f0f',
        border: `1px solid ${isTop ? '#ff4400' : '#1e1e1e'}`,
        borderRadius: 12, overflow: 'hidden', position: 'relative',
      }}>
      {rank && <div style={{ position: 'absolute', top: 8, left: 8, zIndex: 2, background: isTop ? '#ff4400' : '#333', color: '#fff', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>#{rank}</div>}
      {isTop && <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2, background: '#ff4400', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20 }}>🔥 TOP</div>}
      <div style={{ position: 'relative', paddingTop: '56.25%', background: '#111' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>▶</div>
        }
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#eee', lineHeight: 1.4, marginBottom: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{video.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#ff6644', fontWeight: 700 }}>👁 {formatViews(views)}</span>
          <span style={{ fontSize: 10, color: '#444' }}>·</span>
          <span style={{ fontSize: 10, color: '#555' }}>{timeAgo(video.publishedAt)}</span>
          <span style={{ fontSize: 10, color: '#444' }}>·</span>
          <span style={{ fontSize: 10, color: '#666' }}>👍 {formatViews(likes)} ({ctr}%)</span>
        </div>
      </div>
    </a>
  );
}

function DashboardPage({ user }) {
  const [ytData, setYtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('views');
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
    const title = (v.title || '').toLowerCase();
    const isShort = title.includes('short') || (v.duration && v.duration <= 60);
    return filter === 'short' ? isShort : !isShort;
  });
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sortBy === 'likes') return (b.likeCount || 0) - (a.likeCount || 0);
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  const totalViews = videos.reduce((a, v) => a + (v.viewCount || 0), 0);
  const totalLikes = videos.reduce((a, v) => a + (v.likeCount || 0), 0);
  const avgViews = videos.length ? Math.round(totalViews / videos.length) : 0;

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌈</span>
          <span style={{ color: '#ff6644', fontSize: 14, fontWeight: 700 }}>RangTarang Studio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={fetchYT} style={{ background: 'none', border: '1px solid #333', color: '#666', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>🔄</button>
          {ytData && <YoutubeProfile ytData={ytData} />}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#555' }}><div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: '#ff4400' }} /><div style={{ fontSize: 12 }}>Loading...</div></div>}
        {error && <div style={{ background: '#1a0000', border: '1px solid #440000', borderRadius: 12, padding: 16, fontSize: 12, color: '#ff6666' }}>⚠️ {error}</div>}

        {!loading && !error && ytData && <>
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

          {sorted[0] && <div>
            <div style={{ fontSize: 10, color: '#ff4400', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>🔥 Best Performing</div>
            <VideoCard video={sorted[0]} rank={1} isTop={true} />
          </div>}

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 6, flex: 1 }}>
              {[{ key: 'all', label: '🎬 All' }, { key: 'short', label: '⚡ Shorts' }, { key: 'long', label: '📹 Long' }].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{ flex: 1, padding: '8px 4px', borderRadius: 20, border: 'none', cursor: 'pointer', background: filter === f.key ? '#ff4400' : '#1a1a1a', color: filter === f.key ? '#fff' : '#666', fontSize: 11, fontWeight: 700 }}>{f.label}</button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', borderRadius: 20, padding: '8px 10px', fontSize: 11, outline: 'none' }}>
              <option value="views">👁 Views</option>
              <option value="likes">👍 Likes</option>
              <option value="recent">🕐 Recent</option>
            </select>
          </div>

          <div style={{ background: '#0a0a0f', border: '1px solid #1a1a2e', borderRadius: 14, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#4488ff', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>📊 Top 5 Analysis</div>
            {sorted.slice(0, 5).map((v, i) => {
              const pct = Math.round((v.viewCount / (sorted[0]?.viewCount || 1)) * 100);
              return <div key={v.videoId} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: '#555', width: 14 }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: 11, color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{v.title}</span>
                  <span style={{ fontSize: 11, color: '#ff6644', fontWeight: 700 }}>{formatViews(v.viewCount)}</span>
                </div>
                <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: i === 0 ? '#ff4400' : '#333', borderRadius: 4 }} />
                </div>
              </div>;
            })}
          </div>

          <div>
            <div style={{ fontSize: 10, color: '#888', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>📹 All Videos ({sorted.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sorted.map((v, i) => <VideoCard key={v.videoId} video={v} rank={i + 1} isTop={i === 0} />)}
              {!sorted.length && <div style={{ textAlign: 'center', padding: 24, color: '#444', fontSize: 12 }}>Koi video nahi mili.</div>}
            </div>
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

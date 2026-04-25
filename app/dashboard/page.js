'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
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
function getDuration(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ── Compact video card (YouTube style) ──────────────────
function VideoCard({ video, rank, isTop }) {
  const views = video.viewCount || 0;
  const likes = video.likeCount || 0;
  const ctr = views > 0 ? ((likes / views) * 100).toFixed(1) : '0';

  return (
    <a
      href={`https://youtube.com/watch?v=${video.videoId}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block',
        textDecoration: 'none',
        background: isTop ? 'linear-gradient(135deg,#0a0000,#1a0500)' : '#0f0f0f',
        border: `1px solid ${isTop ? '#ff4400' : '#1e1e1e'}`,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        transition: 'transform 0.15s, border-color 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {/* Rank badge */}
      {rank && (
        <div style={{
          position: 'absolute', top: 8, left: 8, zIndex: 2,
          background: isTop ? '#ff4400' : '#333',
          color: '#fff', fontSize: 10, fontWeight: 800,
          padding: '2px 8px', borderRadius: 20,
        }}>
          #{rank}
        </div>
      )}
      {isTop && (
        <div style={{
          position: 'absolute', top: 8, right: 8, zIndex: 2,
          background: '#ff4400', color: '#fff',
          fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 20,
        }}>
          🔥 TOP
        </div>
      )}

      {/* Thumbnail */}
      <div style={{ position: 'relative', paddingTop: '56.25%', background: '#111' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>▶</div>
        }
        <div style={{
          position: 'absolute', bottom: 4, right: 6,
          background: 'rgba(0,0,0,0.85)', color: '#fff',
          fontSize: 10, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
        }}>
          {video.duration || 'Short'}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#eee',
          lineHeight: 1.4, marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
          fontFamily: "'Noto Sans Devanagari', sans-serif",
        }}>
          {video.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#ff6644', fontWeight: 700 }}>
            👁 {formatViews(views)}
          </span>
          <span style={{ fontSize: 10, color: '#444' }}>·</span>
          <span style={{ fontSize: 10, color: '#555' }}>{timeAgo(video.publishedAt)}</span>
          <span style={{ fontSize: 10, color: '#444' }}>·</span>
          <span style={{ fontSize: 10, color: '#666' }}>
            👍 {formatViews(likes)} ({ctr}%)
          </span>
        </div>
      </div>
    </a>
  );
}

// ── Main Dashboard ───────────────────────────────────────
function DashboardPage({ user }) {
  const toast = useToast();
  const router = useRouter();

  const [ytData, setYtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all | short | long
  const [sortBy, setSortBy] = useState('views'); // views | recent | likes

  const displayName = user?.displayName || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => { fetchYT(); }, []);

  async function fetchYT() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/youtube');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setYtData(data);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }

  const videos = ytData?.videos || [];

  // Filter: short = <= 60s, long = > 60s (by title hint or duration)
  const filtered = videos.filter(v => {
    if (filter === 'all') return true;
    const title = (v.title || '').toLowerCase();
    const isShort = title.includes('#short') || title.includes('short') || (v.duration && v.duration <= 60);
    return filter === 'short' ? isShort : !isShort;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'views') return (b.viewCount || 0) - (a.viewCount || 0);
    if (sortBy === 'likes') return (b.likeCount || 0) - (a.likeCount || 0);
    if (sortBy === 'recent') return new Date(b.publishedAt) - new Date(a.publishedAt);
    return 0;
  });

  const topVideo = sorted[0];
  const totalViews = videos.reduce((a, v) => a + (v.viewCount || 0), 0);
  const totalLikes = videos.reduce((a, v) => a + (v.likeCount || 0), 0);
  const avgViews = videos.length ? Math.round(totalViews / videos.length) : 0;

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      {/* TOP BAR */}
      <div className="mini-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🌈</span>
          <span className="mini-topbar-title" style={{ color: '#ff6644', fontFamily: 'inherit', fontSize: 14 }}>
            RangTarang Studio
          </span>
        </div>
        <button
          onClick={fetchYT}
          style={{ background: 'none', border: '1px solid #333', color: '#666', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>
            <div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: '#ff4400' }} />
            <div style={{ fontSize: 12 }}>YouTube se data aa raha hai...</div>
          </div>
        )}

        {error && (
          <div style={{ background: '#1a0000', border: '1px solid #440000', borderRadius: 12, padding: 16, fontSize: 12, color: '#ff6666' }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && ytData && (
          <>
            {/* ── CHANNEL STATS ── */}
            <div style={{ background: 'linear-gradient(135deg,#0a0000,#150a00)', border: '1px solid #3a1500', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              {ytData.channelThumb && (
                <img src={ytData.channelThumb} alt="" style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid #ff4400', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ytData.channelName || 'RangTarang'}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#ff6644' }}>👥 {formatViews(parseInt(ytData.subscriberCount || 0))}</span>
                  <span style={{ fontSize: 11, color: '#888' }}>🎬 {ytData.videoCount} videos</span>
                </div>
              </div>
            </div>

            {/* ── QUICK STATS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Total Views', value: formatViews(totalViews), icon: '👁', color: '#ff6644' },
                { label: 'Total Likes', value: formatViews(totalLikes), icon: '👍', color: '#44bb66' },
                { label: 'Avg Views', value: formatViews(avgViews), icon: '📊', color: '#4488ff' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 18 }}>{s.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: '#555', marginTop: 2, letterSpacing: 0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* ── TOP VIDEO ── */}
            {topVideo && (
              <div>
                <div style={{ fontSize: 10, color: '#ff4400', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>
                  🔥 Best Performing Video
                </div>
                <VideoCard video={topVideo} rank={1} isTop={true} />
              </div>
            )}

            {/* ── FILTER + SORT ── */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                {[
                  { key: 'all', label: '🎬 All' },
                  { key: 'short', label: '⚡ Shorts' },
                  { key: 'long', label: '📹 Long' },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilter(f.key)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 20, border: 'none', cursor: 'pointer',
                      background: filter === f.key ? '#ff4400' : '#1a1a1a',
                      color: filter === f.key ? '#fff' : '#666',
                      fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                style={{
                  background: '#1a1a1a', border: '1px solid #333', color: '#888',
                  borderRadius: 20, padding: '8px 12px', fontSize: 11, outline: 'none',
                }}
              >
                <option value="views">👁 Views</option>
                <option value="likes">👍 Likes</option>
                <option value="recent">🕐 Recent</option>
              </select>
            </div>

            {/* ── ANALYSIS ── */}
            <div style={{ background: '#0a0a0f', border: '1px solid #1a1a2e', borderRadius: 14, padding: 14 }}>
              <div style={{ fontSize: 10, color: '#4488ff', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 12 }}>
                📊 Channel Analysis
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sorted.slice(0, 5).map((v, i) => {
                  const maxViews = sorted[0]?.viewCount || 1;
                  const pct = Math.round((v.viewCount / maxViews) * 100);
                  return (
                    <div key={v.videoId}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: '#555', width: 14 }}>#{i + 1}</span>
                        <span style={{
                          flex: 1, fontSize: 11, color: '#ccc', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          fontFamily: "'Noto Sans Devanagari', sans-serif",
                        }}>{v.title}</span>
                        <span style={{ fontSize: 11, color: '#ff6644', fontWeight: 700, flexShrink: 0 }}>
                          {formatViews(v.viewCount)}
                        </span>
                      </div>
                      <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: pct + '%',
                          background: i === 0 ? '#ff4400' : '#333',
                          borderRadius: 4, transition: 'width 0.5s ease',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── ALL VIDEOS ── */}
            <div>
              <div style={{ fontSize: 10, color: '#888', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>
                📹 All Videos ({sorted.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sorted.map((v, i) => (
                  <VideoCard key={v.videoId} video={v} rank={i + 1} isTop={i === 0} />
                ))}
                {sorted.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 24, color: '#444', fontSize: 12 }}>
                    Koi video nahi mili is filter mein.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav userInitial={initial} />
    </div>
  );
}

export default function DashboardWrapper() {
  return (
    <ToastProvider>
      <AuthWrapper>
        {({ user }) => <DashboardPage user={user} />}
      </AuthWrapper>
    </ToastProvider>
  );
}

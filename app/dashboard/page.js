// 📁 LOCATION: app/dashboard/page.js
'use client';

import { useState, useEffect } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import BottomNav from '../../components/BottomNav';
import { ToastProvider } from '../../components/Toast';

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
  if (d===0) return 'Aaj';
  if (d===1) return 'Kal';
  if (d<30)  return d+' din pehle';
  if (d<365) return Math.floor(d/30)+' mahine pehle';
  return Math.floor(d/365)+' saal pehle';
}
function fmtDur(sec) {
  if (!sec) return '';
  return Math.floor(sec/60)+':'+(sec%60).toString().padStart(2,'0');
}

function TopVideoBanner({ video }) {
  return (
    <a href={'https://youtube.com/watch?v='+video.videoId} target="_blank" rel="noopener noreferrer"
      style={{ display:'block', textDecoration:'none', borderRadius:16, overflow:'hidden', position:'relative' }}>
      <div style={{ position:'relative', paddingTop:'56.25%' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ position:'absolute', inset:0, background:'#111', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40 }}>▶</div>
        }
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 55%)' }} />
        <div style={{ position:'absolute', top:10, left:10, background:'#ff4400', color:'#fff', fontSize:10, fontWeight:800, padding:'3px 10px', borderRadius:20 }}>🔥 BEST VIDEO</div>
        {video.isShort
          ? <div style={{ position:'absolute', top:10, right:10, background:'rgba(0,0,0,0.85)', color:'#ff4400', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:4 }}>⚡ SHORT</div>
          : video.durationSec > 0
            ? <div style={{ position:'absolute', bottom:68, right:10, background:'rgba(0,0,0,0.85)', color:'#fff', fontSize:11, fontWeight:700, padding:'2px 6px', borderRadius:4 }}>{fmtDur(video.durationSec)}</div>
            : null
        }
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 14px' }}>
          <div style={{ fontSize:13, fontWeight:800, color:'#fff', lineHeight:1.4, marginBottom:6, fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{video.title}</div>
          <div style={{ display:'flex', gap:12 }}>
            <span style={{ fontSize:12, color:'#ff6644', fontWeight:700 }}>👁 {formatViews(video.viewCount)}</span>
            <span style={{ fontSize:12, color:'#aaa' }}>👍 {formatViews(video.likeCount)}</span>
            <span style={{ fontSize:12, color:'#666' }}>{timeAgo(video.publishedAt)}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

function SmallCard({ video }) {
  return (
    <a href={'https://youtube.com/watch?v='+video.videoId} target="_blank" rel="noopener noreferrer"
      style={{ display:'flex', gap:10, textDecoration:'none', padding:'10px 0', borderBottom:'1px solid #1a1a1a' }}>
      <div style={{ position:'relative', width:110, height:62, flexShrink:0, borderRadius:8, overflow:'hidden', background:'#111' }}>
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>▶</div>
        }
        {video.isShort
          ? <div style={{ position:'absolute', bottom:3, right:3, background:'rgba(0,0,0,0.85)', color:'#ff4400', fontSize:8, fontWeight:800, padding:'1px 5px', borderRadius:3 }}>⚡</div>
          : video.durationSec > 0
            ? <div style={{ position:'absolute', bottom:3, right:3, background:'rgba(0,0,0,0.85)', color:'#fff', fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:3 }}>{fmtDur(video.durationSec)}</div>
            : null
        }
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#ddd', lineHeight:1.4, marginBottom:4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', fontFamily:"'Noto Sans Devanagari',sans-serif" }}>{video.title}</div>
        <div style={{ fontSize:10, color:'#ff6644', fontWeight:700 }}>👁 {formatViews(video.viewCount)}</div>
        <div style={{ fontSize:10, color:'#555', marginTop:2 }}>{timeAgo(video.publishedAt)}</div>
      </div>
    </a>
  );
}

function DashboardPage({ user }) {
  const [ytData,  setYtData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [filter,  setFilter]  = useState('all');
  const [sortBy,  setSortBy]  = useState('views');

  useEffect(() => { fetchYT(); }, []);

  async function fetchYT() {
    setLoading(true); setError('');
    try {
      const res  = await fetch('/api/youtube');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setYtData(data);
    } catch(e) { setError(e.message); }
    setLoading(false);
  }

  const videos   = ytData ? ytData.videos || [] : [];
  const filtered = videos.filter(function(v) {
    if (filter === 'all')   return true;
    if (filter === 'short') return v.isShort === true;
    return v.isShort === false;
  });
  const sorted = filtered.slice().sort(function(a,b) {
    if (sortBy === 'views')  return (b.viewCount||0)  - (a.viewCount||0);
    if (sortBy === 'likes')  return (b.likeCount||0)  - (a.likeCount||0);
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });

  const totalViews = videos.reduce(function(a,v){ return a+(v.viewCount||0); }, 0);
  const totalLikes = videos.reduce(function(a,v){ return a+(v.likeCount||0); }, 0);
  const avgViews   = videos.length ? Math.round(totalViews/videos.length) : 0;
  const topVideo   = videos.slice().sort(function(a,b){ return (b.viewCount||0)-(a.viewCount||0); })[0];

  return (
    <div style={{ background:'#080008', minHeight:'100%' }}>
      <div style={{ padding:12, display:'flex', flexDirection:'column', gap:14 }}>

        {loading && (
          <div style={{ textAlign:'center', padding:40, color:'#555' }}>
            <div className="spinner" style={{ margin:'0 auto 12px', borderTopColor:'#ff4400' }} />
            <div style={{ fontSize:12 }}>Loading...</div>
          </div>
        )}

        {error && (
          <div style={{ background:'#1a0000', border:'1px solid #440000', borderRadius:12, padding:16, fontSize:12, color:'#ff6666' }}>
            ⚠️ {error}
          </div>
        )}

        {!loading && !error && ytData && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

            {/* STATS */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
              {[
                { label:'Total Views', value:formatViews(totalViews), icon:'👁', color:'#ff6644' },
                { label:'Total Likes', value:formatViews(totalLikes), icon:'👍', color:'#44bb66' },
                { label:'Avg Views',   value:formatViews(avgViews),   icon:'📊', color:'#4488ff' },
              ].map(function(s,i) {
                return (
                  <div key={i} style={{ background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:12, padding:'10px 8px', textAlign:'center' }}>
                    <div style={{ fontSize:18 }}>{s.icon}</div>
                    <div style={{ fontSize:13, fontWeight:800, color:s.color, marginTop:2 }}>{s.value}</div>
                    <div style={{ fontSize:9, color:'#555', marginTop:2 }}>{s.label}</div>
                  </div>
                );
              })}
            </div>

            {/* TOP VIDEO */}
            {topVideo && (
              <div>
                <div style={{ fontSize:10, color:'#ff4400', letterSpacing:2, textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>🔥 Best Performing</div>
                <TopVideoBanner video={topVideo} />
              </div>
            )}

            {/* FILTER + SORT */}
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ display:'flex', gap:6, flex:1 }}>
                {[{k:'all',l:'🎬 All'},{k:'short',l:'⚡ Shorts'},{k:'long',l:'📹 Long'}].map(function(f) {
                  return (
                    <button key={f.k} onClick={function(){ setFilter(f.k); }}
                      style={{ flex:1, padding:'8px 4px', borderRadius:20, border:'none', cursor:'pointer', background:filter===f.k?'#ff4400':'#1a1a1a', color:filter===f.k?'#fff':'#666', fontSize:11, fontWeight:700 }}>
                      {f.l}
                    </button>
                  );
                })}
              </div>
              <select value={sortBy} onChange={function(e){ setSortBy(e.target.value); }}
                style={{ background:'#1a1a1a', border:'1px solid #333', color:'#888', borderRadius:20, padding:'8px 10px', fontSize:11, outline:'none' }}>
                <option value="views">👁 Views</option>
                <option value="likes">👍 Likes</option>
                <option value="recent">🕐 Recent</option>
              </select>
            </div>

            {/* VIDEO LIST */}
            <div style={{ background:'#0f0f0f', border:'1px solid #1e1e1e', borderRadius:14, padding:'4px 14px' }}>
              <div style={{ fontSize:10, color:'#555', letterSpacing:1.5, textTransform:'uppercase', fontWeight:700, padding:'10px 0 4px' }}>
                📹 {sorted.length} Videos
              </div>
              {sorted.map(function(v) { return <SmallCard key={v.videoId} video={v} />; })}
              {sorted.length === 0 && (
                <div style={{ textAlign:'center', padding:20, color:'#444', fontSize:12 }}>Koi video nahi mili.</div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardWrapper() {
  return (
    <ToastProvider>
      <AuthWrapper>
        {function({ user }) { return <DashboardPage user={user} />; }}
      </AuthWrapper>
    </ToastProvider>
  );
}

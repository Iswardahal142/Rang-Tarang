// 📁 LOCATION: app/trending/page.js
'use client';

import { useState, useEffect } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import { ToastProvider, useToast } from '../../components/Toast';

const CATEGORIES = [
  { id: '26', label: 'Howto', emoji: '🎨' },
  { id: '24', label: 'Entertainment', emoji: '🎭' },
  { id: '27', label: 'Education', emoji: '📚' },
  { id: '10', label: 'Music', emoji: '🎵' },
  { id: '1',  label: 'Film', emoji: '🎬' },
];

async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini', max_tokens: 1500, temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

function fmtNum(n) {
  n = parseInt(n || 0);
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 100000)  return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000)    return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

function timeAgo(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'Aaj';
  if (days === 1) return 'Kal';
  if (days < 7)   return `${days} din pehle`;
  if (days < 30)  return `${Math.floor(days / 7)} hafte pehle`;
  return `${Math.floor(days / 30)} mahine pehle`;
}

// ── MAIN ─────────────────────────────────────────────
function TrendingPage() {
  const toast = useToast();
  const [videos, setVideos]         = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [loading, setLoading]       = useState(false);
  const [category, setCategory]     = useState('26');
  const [filterMode, setFilterMode] = useState('all');   // all | kids | shorts | long
  const [aiIdeas, setAiIdeas]       = useState('');
  const [aiLoading, setAiLoading]   = useState(false);
  const [activeTab, setActiveTab]   = useState('videos'); // videos | ideas
  const [fetchedAt, setFetchedAt]   = useState(null);
  const [openVideo, setOpenVideo]   = useState(null);

  useEffect(() => { fetchTrending(); }, [category]);

  useEffect(() => {
    let list = [...videos];
    if (filterMode === 'kids') {
      const kidsKeywords = ['kids','children','baby','cartoon','rhymes','story','bachche','baccho','bal','hindi','sikh','learn','abc','123','color','colour','animal','song','nursery'];
      list = list.filter(v =>
        kidsKeywords.some(k => v.title.toLowerCase().includes(k) || v.channelName.toLowerCase().includes(k))
      );
    } else if (filterMode === 'shorts') {
      list = list.filter(v => v.isShort);
    } else if (filterMode === 'long') {
      list = list.filter(v => !v.isShort);
    }
    setFiltered(list);
  }, [videos, filterMode]);

  async function fetchTrending() {
    setLoading(true); setVideos([]); setAiIdeas(''); setActiveTab('videos');
    try {
      const res  = await fetch(`/api/trending?cat=${category}`);
      const data = await res.json();
      if (data.error) { toast('❌ ' + data.error); setLoading(false); return; }
      setVideos(data.videos || []);
      setFetchedAt(data.fetchedAt);
    } catch (e) { toast('❌ ' + e.message); }
    setLoading(false);
  }

  async function generateIdeas() {
    const source = filtered.length > 0 ? filtered : videos;
    if (!source.length) { toast('⚠️ Pehle videos load karo'); return; }
    setAiLoading(true); setAiIdeas('');

    const top15 = source.slice(0, 15).map((v, i) =>
      `${i + 1}. "${v.title}" by ${v.channelName} — ${fmtNum(v.viewCount)} views${v.isShort ? ' [Short]' : ''}`
    ).join('\n');

    try {
      const text = await aiCall(`You are a content strategist for Hindi kids YouTube channel "Rang Tarang" (teaches kids colors, shapes, animals, actions, comparisons in Hindi).

Current trending videos in India:
${top15}

Based on these trends, suggest for Rang Tarang:
1. 🔥 3 TRENDING TOPICS jo abhi viral ho sakte hain (kids angle se)
2. 🎬 4 specific VIDEO IDEAS with Hindi titles
3. ⚡ 1 FORMAT tip (Shorts ya Long, kya better rahega abhi)
4. 🏷️ 5 trending TAGS/KEYWORDS jo use karne chahiye

Reply in Hinglish. Be specific, creative, and actionable.`);
      setAiIdeas(text);
      setActiveTab('ideas');
    } catch (e) { toast('❌ AI ideas nahi aaye'); }
    setAiLoading(false);
  }

  // ── VIDEO DETAIL ──────────────────────────────────
  if (openVideo) {
    const v = openVideo;
    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenVideo(null)} style={{ background: 'none', border: 'none', color: '#ff8800', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 11, color: '#555', fontWeight: 700 }}>#{v.rank} Trending</span>
          <a href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer"
            style={{ background: '#cc0000', border: 'none', color: '#fff', borderRadius: 16, padding: '6px 12px', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
            ▶ Watch
          </a>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {v.thumbnail && (
            <img src={v.thumbnail} alt="" style={{ width: '100%', borderRadius: 12, objectFit: 'cover' }} />
          )}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', lineHeight: 1.5, marginBottom: 8 }}>{v.title}</div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>{v.channelName} • {timeAgo(v.publishedAt)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: 'Views',    value: fmtNum(v.viewCount),   color: '#ff8800' },
                { label: 'Likes',    value: fmtNum(v.likeCount),   color: '#44bb66' },
                { label: 'Comments', value: fmtNum(v.commentCount),color: '#4488ff' },
              ].map(s => (
                <div key={s.label} style={{ background: '#111', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {v.tags?.length > 0 && (
            <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 8 }}>🏷️ TAGS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {v.tags.slice(0, 20).map((tag, i) => (
                  <span key={i} style={{ background: '#1a1a2a', border: '1px solid #334', color: '#888', borderRadius: 20, padding: '4px 10px', fontSize: 11 }}>{tag}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN LIST VIEW ────────────────────────────────
  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ff8800', fontSize: 14, fontWeight: 700 }}>🔥 Trending India</span>
        <button onClick={generateIdeas} disabled={aiLoading || loading}
          style={{ background: aiLoading ? '#111' : 'linear-gradient(135deg,#4400cc,#8844ff)', border: 'none', color: aiLoading ? '#555' : '#fff', borderRadius: 16, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: aiLoading ? 'not-allowed' : 'pointer' }}>
          {aiLoading ? '...' : '🤖 Ideas'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Category Selector */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              style={{ flexShrink: 0, background: category === c.id ? '#ff880022' : '#0f0f0f', border: `1px solid ${category === c.id ? '#ff8800' : '#222'}`, color: category === c.id ? '#ff8800' : '#555', borderRadius: 20, padding: '7px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['all','Sab'],['kids','🧒 Kids'],['shorts','⚡ Shorts'],['long','🎬 Long']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterMode(val)}
              style={{ flex: 1, background: filterMode === val ? '#1a1a0a' : '#0f0f0f', border: `1px solid ${filterMode === val ? '#ffaa00' : '#222'}`, color: filterMode === val ? '#ffaa00' : '#555', borderRadius: 8, padding: '7px 4px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['videos','ideas'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, background: activeTab === t ? '#1a0a00' : '#0f0f0f', border: `1px solid ${activeTab === t ? '#ff8800' : '#222'}`, color: activeTab === t ? '#ff8800' : '#555', borderRadius: 10, padding: '9px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              {t === 'videos' ? '🔥 Trending' : '💡 AI Ideas'}
            </button>
          ))}
        </div>

        {fetchedAt && activeTab === 'videos' && (
          <div style={{ fontSize: 10, color: '#333', textAlign: 'center' }}>
            Last updated: {new Date(fetchedAt).toLocaleTimeString('hi-IN')} • {filtered.length} videos
          </div>
        )}

        {/* Videos Tab */}
        {activeTab === 'videos' && (
          loading ? (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ff8800' }} />
              <div style={{ fontSize: 12, color: '#555' }}>Trending fetch ho raha hai...</div>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 13, color: '#555' }}>Koi video nahi mila is filter mein</div>
            </div>
          ) : filtered.map((v) => (
            <div key={v.videoId} onClick={() => setOpenVideo(v)}
              style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden', display: 'flex', gap: 10, padding: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: v.rank <= 3 ? '#ffaa00' : '#333', minWidth: 20, paddingTop: 2, flexShrink: 0 }}>#{v.rank}</div>
              {v.thumbnail && (
                <img src={v.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', lineHeight: 1.4, marginBottom: 4 }}>{v.title}</div>
                <div style={{ fontSize: 10, color: '#555', marginBottom: 4 }}>{v.channelName}</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, color: '#ff8800', fontWeight: 700 }}>👁 {fmtNum(v.viewCount)}</span>
                  <span style={{ fontSize: 10, color: '#44bb66' }}>👍 {fmtNum(v.likeCount)}</span>
                  <span style={{ fontSize: 9, background: v.isShort ? '#ff448822' : '#44bb6622', color: v.isShort ? '#ff4488' : '#44bb66', border: `1px solid ${v.isShort ? '#ff448844' : '#44bb6644'}`, borderRadius: 8, padding: '1px 6px', fontWeight: 700 }}>
                    {v.isShort ? '⚡Short' : '🎬Long'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* AI Ideas Tab */}
        {activeTab === 'ideas' && (
          <div style={{ background: '#0a0014', border: '1px solid #4400cc44', borderRadius: 14, padding: 16 }}>
            {aiIdeas ? (
              <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{aiIdeas}</div>
            ) : (
              <div style={{ textAlign: 'center', padding: 30 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🤖</div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>AI trending videos dekh ke Rang Tarang ke liye ideas generate karega</div>
                <button onClick={generateIdeas} disabled={aiLoading || loading}
                  style={{ background: 'linear-gradient(135deg,#4400cc,#8844ff)', border: 'none', color: '#fff', borderRadius: 12, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  🤖 Ideas Generate Karo
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrendingWrapper() {
  return <ToastProvider><AuthWrapper>{() => <TrendingPage />}</AuthWrapper></ToastProvider>;
}

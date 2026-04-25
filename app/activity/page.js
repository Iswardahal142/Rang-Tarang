// 📁 LOCATION: app/activity/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import AuthWrapper from '../../components/AuthWrapper';

import { ToastProvider, useToast } from '../../components/Toast';

function timeAgo(iso) {
  if (!iso) return '';
  const d = Math.floor((Date.now()-new Date(iso).getTime())/86400000);
  if (d===0) { const h = Math.floor((Date.now()-new Date(iso).getTime())/3600000); if (h===0) { const m = Math.floor((Date.now()-new Date(iso).getTime())/60000); return m<1 ? 'Abhi' : `${m}m pehle`; } return `${h}h pehle`; }
  if (d===1) return 'Kal';
  if (d<30) return `${d} din pehle`;
  return `${Math.floor(d/30)} mahine pehle`;
}

function ActivityPage({ user }) {
  const toast = useToast();
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [posting, setPosting]     = useState(false);
  const pollRef                   = useRef(null);
  const initial = (user?.displayName||user?.email||'U').charAt(0).toUpperCase();

  useEffect(() => {
    fetchComments();
    pollRef.current = setInterval(fetchComments, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  async function fetchComments() {
    try {
      const res = await fetch('/api/comments');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setComments(data.comments || []);
      setError('');
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  async function postReply(commentId) {
    if (!replyText.trim()) { toast('⚠️ Reply likho!'); return; }
    setPosting(true);
    try {
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, text: replyText.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast('✅ Reply post ho gaya!');
      setComments(c => c.filter(x => x.commentId !== commentId));
      setReplyingId(null);
      setReplyText('');
    } catch (e) {
      toast('❌ ' + e.message);
    }
    setPosting(false);
  }

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💬</span>
          <span style={{ color: '#44bb66', fontSize: 14, fontWeight: 700 }}>Activity</span>
        </div>
        <button onClick={fetchComments} style={{ background: 'none', border: '1px solid #333', color: '#666', borderRadius: 8, padding: '4px 8px', fontSize: 11, cursor: 'pointer' }}>🔄</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {loading && <div style={{ textAlign: 'center', padding: 40 }}><div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: '#44bb66' }} /><div style={{ fontSize: 12, color: '#555' }}>Comments load ho rahe hain...</div></div>}
        {error && <div style={{ background: '#001a00', border: '1px solid #004400', borderRadius: 12, padding: 16, fontSize: 12, color: '#66ff66' }}>⚠️ {error}</div>}

        {!loading && !error && comments.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#444' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi unreplied comment nahi!</div>
            <div style={{ fontSize: 12, color: '#333' }}>Sab comments ka reply ho gaya 🎉</div>
          </div>
        )}

        {!loading && comments.map(c => (
          <div key={c.commentId} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, overflow: 'hidden' }}>
            {/* Video title */}
            <div style={{ padding: '8px 14px', background: '#0a0a0a', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10 }}>🎬</span>
              <span style={{ fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{c.videoTitle}</span>
            </div>

            {/* Comment */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                {c.authorPhoto
                  ? <img src={c.authorPhoto} alt="" style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0 }} />
                  : <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#eee' }}>{c.author}</span>
                    <span style={{ fontSize: 10, color: '#444' }}>{timeAgo(c.publishedAt)}</span>
                    {c.likeCount > 0 && <span style={{ fontSize: 10, color: '#666' }}>👍 {c.likeCount}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#bbb', lineHeight: 1.5, fontFamily: "'Noto Sans Devanagari',sans-serif" }}>{c.text}</div>
                </div>
              </div>

              {/* Reply area */}
              {replyingId === c.commentId ? (
                <div style={{ marginTop: 8 }}>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Reply likho..."
                    rows={3}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #333', color: '#eee', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', fontFamily: "'Noto Sans Devanagari',sans-serif", boxSizing: 'border-box' }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button onClick={() => postReply(c.commentId)} disabled={posting} style={{ flex: 2, background: posting ? '#0a1a0a' : 'linear-gradient(135deg,#004400,#002200)', border: '1px solid #226622', color: '#44bb66', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: posting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {posting ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#44bb66' }} />Posting...</> : '📤 Reply Karo'}
                    </button>
                    <button onClick={() => { setReplyingId(null); setReplyText(''); }} style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setReplyingId(c.commentId); setReplyText(''); }} style={{ background: 'rgba(68,187,102,0.1)', border: '1px solid rgba(68,187,102,0.3)', color: '#44bb66', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
                  💬 Reply
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ActivityWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <ActivityPage user={user} />}</AuthWrapper></ToastProvider>;
}

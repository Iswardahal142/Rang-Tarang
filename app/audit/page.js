// 📁 LOCATION: app/audit/page.js
'use client';

import { useState, useEffect } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import { ToastProvider, useToast } from '../../components/Toast';

async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      max_tokens: 1200,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
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

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#44bb66' : score >= 50 ? '#ffaa00' : '#ff4455';
  const label = score >= 80 ? 'Good' : score >= 50 ? 'OK' : 'Poor';
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%',
      border: `2px solid ${color}`,
      background: `${color}15`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 11, fontWeight: 900, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 8, color: `${color}99`, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function SeverityDot({ severity }) {
  const color = severity === 'high' ? '#ff4455' : severity === 'medium' ? '#ffaa00' : '#4488ff';
  return <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0, marginTop: 3 }} />;
}

// ── Apply Confirm Modal ──────────────────────────────
function ApplyConfirmModal({ videoTitle, newTitle, newTags, onConfirm, onCancel, applying }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.96)',
      zIndex: 2000, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: 20, gap: 14,
    }}>
      <div style={{ fontSize: 28 }}>⚠️</div>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa00', textAlign: 'center' }}>YouTube pe Apply Karein?</div>
      <div style={{ fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 1.6 }}>
        Ye changes <span style={{ color: '#fff' }}>seedha YouTube</span> aur <span style={{ color: '#cc88ff' }}>Firestore</span> mein save honge.
      </div>

      {/* Old vs New */}
      <div style={{ width: '100%', background: '#0d0d0d', border: '1px solid #222', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <div style={{ fontSize: 9, color: '#555', fontWeight: 700, marginBottom: 4 }}>PURANA TITLE</div>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.4 }}>{videoTitle}</div>
        </div>
        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 10 }}>
          <div style={{ fontSize: 9, color: '#ff8800', fontWeight: 700, marginBottom: 4 }}>NAYA TITLE</div>
          <div style={{ fontSize: 12, color: '#ffcc88', lineHeight: 1.4 }}>{newTitle}</div>
        </div>
        <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 10 }}>
          <div style={{ fontSize: 9, color: '#44bb66', fontWeight: 700, marginBottom: 6 }}>NAYE TAGS ({newTags.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {newTags.slice(0, 8).map((t, i) => (
              <span key={i} style={{ background: '#44bb6615', border: '1px solid #44bb6633', color: '#44bb6699', borderRadius: 20, padding: '2px 8px', fontSize: 10 }}>{t}</span>
            ))}
            {newTags.length > 8 && <span style={{ fontSize: 10, color: '#444' }}>+{newTags.length - 8} more</span>}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, width: '100%' }}>
        <button onClick={onCancel} disabled={applying} style={{
          flex: 1, background: '#1a1a1a', border: '1px solid #333', color: '#666',
          borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>✕ Cancel</button>
        <button onClick={onConfirm} disabled={applying} style={{
          flex: 2,
          background: applying ? '#1a1a2a' : 'linear-gradient(135deg,#ff6600,#ffaa00)',
          border: 'none', color: applying ? '#555' : '#fff',
          borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700,
          cursor: applying ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          {applying ? (
            <>
              <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderTopColor: '#cc88ff' }} />
              Apply ho raha hai...
            </>
          ) : '✅ Haan, Apply Karo'}
        </button>
      </div>
    </div>
  );
}

// ── AI Fix Modal ──────────────────────────────────────
function AiFixModal({ video, uid, onClose, onApplied }) {
  const toast = useToast();
  const [loading, setLoading]   = useState(true);
  const [result, setResult]     = useState(null);
  const [copied, setCopied]     = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => { generate(); }, []);

  async function generate() {
    setLoading(true);
    try {
      const issueList = video.issues.map(i => `- ${i.msg}`).join('\n');
      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang" (teaches colors, shapes, animals in Hindi for kids 2–8 years).

Video details:
Title: "${video.title}"
Tags: ${video.tags.length > 0 ? video.tags.join(', ') : 'NONE'}
Description (first 300 chars): "${video.description.slice(0, 300)}"
Views: ${video.viewCount}
Type: ${video.isShort ? 'YouTube Short' : 'Long video'}

Issues found:
${issueList}

Please provide EXACTLY in this format (no extra text):

TITLE:
[Improved Hindi/Hinglish title, max 80 chars, with | or - separator]

TAGS:
[15 comma-separated tags, mix of Hindi & English, relevant to kids + topic]

DESCRIPTION_START:
[First 150 chars of a good description in Hinglish, include main keywords]

WHY:
[2-3 line explanation in Hinglish of what you changed and why]`);

      const parse = (key) => {
        const match = text.match(new RegExp(`${key}:\\n([\\s\\S]*?)(?=\\n[A-Z_]+:|$)`));
        return match ? match[1].trim() : '';
      };
      setResult({
        title:       parse('TITLE'),
        tags:        parse('TAGS'),
        description: parse('DESCRIPTION_START'),
        why:         parse('WHY'),
      });
    } catch (e) {
      toast('❌ AI fix nahi aaya');
      onClose();
    }
    setLoading(false);
  }

  function copyText(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    });
  }

  // Tags string → array
  function parsedTags() {
    if (!result?.tags) return [];
    return result.tags.split(',').map(t => t.trim()).filter(Boolean);
  }

  async function handleApply() {
    setApplying(true);
    try {
      const res = await fetch('/api/audit/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: video.videoId,
          title:   result.title,
          tags:    parsedTags(),
          uid,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast('❌ ' + (data.error || 'Update fail hua'));
        setApplying(false);
        setShowConfirm(false);
        return;
      }
      toast('✅ YouTube + Firestore dono update ho gaye!');
      setShowConfirm(false);
      setApplying(false);
      // Parent ko bata do — video list refresh karo
      if (onApplied) onApplied(video.videoId, result.title, parsedTags());
      onClose();
    } catch (e) {
      toast('❌ ' + e.message);
      setApplying(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      {showConfirm && (
        <ApplyConfirmModal
          videoTitle={video.title}
          newTitle={result?.title || ''}
          newTags={parsedTags()}
          onConfirm={handleApply}
          onCancel={() => setShowConfirm(false)}
          applying={applying}
        />
      )}

      <div style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
        zIndex: 1000, display: 'flex', flexDirection: 'column',
        padding: 16, gap: 12, overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#cc88ff' }}>🤖 AI Fix Suggestions</div>
          <button onClick={onClose} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#888', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>✕ Close</button>
        </div>

        {/* Video title ref */}
        <div style={{ background: '#111', border: '1px solid #222', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 3 }}>VIDEO</div>
          <div style={{ fontSize: 12, color: '#aaa', lineHeight: 1.4 }}>{video.title}</div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div className="spinner" style={{ borderTopColor: '#cc88ff' }} />
            <div style={{ fontSize: 12, color: '#555' }}>AI soch raha hai...</div>
          </div>
        ) : result && (
          <>
            {/* Title */}
            <FixCard
              label="✏️ Better Title"
              value={result.title}
              copied={copied === 'title'}
              onCopy={() => copyText(result.title, 'title')}
              color="#ff8800"
            />

            {/* Tags */}
            <FixCard
              label="🏷️ Suggested Tags"
              value={result.tags}
              copied={copied === 'tags'}
              onCopy={() => copyText(result.tags, 'tags')}
              color="#44bb66"
              isTagList
            />

            {/* Description */}
            <FixCard
              label="📝 Description Start"
              value={result.description}
              copied={copied === 'desc'}
              onCopy={() => copyText(result.description, 'desc')}
              color="#4488ff"
            />

            {/* Why */}
            {result.why && (
              <div style={{ background: '#0a0a14', border: '1px solid #223', borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 10, color: '#4488ff', fontWeight: 700, marginBottom: 6 }}>💡 WHY THESE CHANGES</div>
                <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7 }}>{result.why}</div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={generate} style={{
                flex: 1,
                background: '#1a0a2a', border: '1px solid #cc88ff44', color: '#cc88ff',
                borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                🔄 Dobara
              </button>

              {/* ✅ APPLY TO YOUTUBE BUTTON */}
              <button onClick={() => setShowConfirm(true)} style={{
                flex: 2,
                background: 'linear-gradient(135deg,#ff6600,#ffaa00)',
                border: 'none', color: '#fff',
                borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                🚀 YouTube pe Apply Karo
              </button>
            </div>

            {/* Info note */}
            <div style={{ fontSize: 10, color: '#333', textAlign: 'center', lineHeight: 1.5 }}>
              Title + Tags YouTube aur Firestore dono mein update honge.<br />
              Description unchanged rahega.
            </div>
          </>
        )}
      </div>
    </>
  );
}

function FixCard({ label, value, copied, onCopy, color, isTagList }) {
  return (
    <div style={{ background: '#0d0d0d', border: `1px solid ${color}33`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 10, color, fontWeight: 700 }}>{label}</div>
        <button onClick={onCopy} style={{
          background: copied ? `${color}22` : '#1a1a1a',
          border: `1px solid ${copied ? color : '#333'}`,
          color: copied ? color : '#666',
          borderRadius: 8, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
        }}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      {isTagList ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {value.split(',').map((t, i) => (
            <span key={i} style={{
              background: `${color}15`, border: `1px solid ${color}33`,
              color: `${color}cc`, borderRadius: 20, padding: '3px 9px', fontSize: 10, fontWeight: 700,
            }}>{t.trim()}</span>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.6 }}>{value}</div>
      )}
    </div>
  );
}

// ── Video Detail ──────────────────────────────────────
function VideoDetail({ video, uid, onBack, onApplied }) {
  const [showAiFix, setShowAiFix] = useState(false);

  const highIssues   = video.issues.filter(i => i.severity === 'high');
  const mediumIssues = video.issues.filter(i => i.severity === 'medium');
  const lowIssues    = video.issues.filter(i => i.severity === 'low');

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      {showAiFix && (
        <AiFixModal
          video={video}
          uid={uid}
          onClose={() => setShowAiFix(false)}
          onApplied={(videoId, newTitle, newTags) => {
            onApplied && onApplied(videoId, newTitle, newTags);
          }}
        />
      )}

      <div className="mini-topbar">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#cc88ff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
        <ScoreBadge score={video.score} />
        {video.issues.length > 0 && (
          <button onClick={() => setShowAiFix(true)} style={{
            background: 'linear-gradient(135deg,#4400cc,#cc88ff)',
            border: 'none', color: '#fff', borderRadius: 16,
            padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}>🤖 AI Fix</button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Thumbnail + title */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
          {video.thumbnail && <img src={video.thumbnail} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />}
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', lineHeight: 1.5, marginBottom: 6 }}>{video.title}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#ff8800', fontWeight: 700 }}>👁 {fmtNum(video.viewCount)}</span>
              <span style={{ fontSize: 10, color: '#44bb66' }}>👍 {fmtNum(video.likeCount)}</span>
              <span style={{ fontSize: 9, background: video.isShort ? '#ff448822' : '#44bb6622', color: video.isShort ? '#ff4488' : '#44bb66', border: `1px solid ${video.isShort ? '#ff448844' : '#44bb6644'}`, borderRadius: 8, padding: '1px 6px', fontWeight: 700 }}>
                {video.isShort ? '⚡ Short' : '🎬 Long'}
              </span>
            </div>
          </div>
        </div>

        {/* Issues */}
        {video.issues.length === 0 ? (
          <div style={{ background: '#0a140a', border: '1px solid #44bb6633', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 13, color: '#44bb66', fontWeight: 700 }}>Sab theek hai! Koi issue nahi mila.</div>
          </div>
        ) : (
          <div style={{ background: '#0f0f0f', border: '1px solid #2a1a1a', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#ff4455', fontWeight: 700, marginBottom: 10 }}>
              ⚠️ {video.issues.length} Issue{video.issues.length > 1 ? 's' : ''} Mili
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...highIssues, ...mediumIssues, ...lowIssues].map((issue, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <SeverityDot severity={issue.severity} />
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: issue.severity === 'high' ? '#ff4455' : issue.severity === 'medium' ? '#ffaa00' : '#4488ff', textTransform: 'uppercase', marginRight: 6 }}>{issue.severity}</span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>{issue.msg}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Tags */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 8 }}>🏷️ CURRENT TAGS ({video.tags.length})</div>
          {video.tags.length === 0 ? (
            <div style={{ fontSize: 12, color: '#ff4455' }}>Koi tags nahi hain ❌</div>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {video.tags.map((tag, i) => (
                <span key={i} style={{ background: '#1a1a2a', border: '1px solid #334', color: '#888', borderRadius: 20, padding: '3px 10px', fontSize: 11 }}>{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Description preview */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginBottom: 8 }}>📝 DESCRIPTION</div>
          {video.description ? (
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{video.description.slice(0, 200)}{video.description.length > 200 ? '...' : ''}</div>
          ) : (
            <div style={{ fontSize: 12, color: '#ff4455' }}>Description khaali hai ❌</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────
function AuditPage({ user }) {
  const toast = useToast();
  const uid   = user?.uid;

  const [loading, setLoading]     = useState(false);
  const [data, setData]           = useState(null);
  const [openVideo, setOpenVideo] = useState(null);
  const [filterIssue, setFilterIssue] = useState('all');

  useEffect(() => { fetchAudit(); }, []);

  async function fetchAudit() {
    setLoading(true); setData(null); setOpenVideo(null);
    try {
      const res  = await fetch('/api/audit');
      const json = await res.json();
      if (json.error) { toast('❌ ' + json.error); setLoading(false); return; }
      setData(json);
    } catch (e) { toast('❌ ' + e.message); }
    setLoading(false);
  }

  // Apply hone ke baad video list mein title/tags update karo
  function handleApplied(videoId, newTitle, newTags) {
    setData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        videos: prev.videos.map(v =>
          v.videoId === videoId
            ? { ...v, title: newTitle, tags: newTags }
            : v
        ),
      };
    });
    // Open video bhi update karo
    setOpenVideo(prev =>
      prev && prev.videoId === videoId
        ? { ...prev, title: newTitle, tags: newTags }
        : prev
    );
  }

  if (openVideo) return (
    <VideoDetail
      video={openVideo}
      uid={uid}
      onBack={() => setOpenVideo(null)}
      onApplied={handleApplied}
    />
  );

  const videos = data?.videos || [];

  const filtered = filterIssue === 'all'    ? videos
    : filterIssue === 'high'   ? videos.filter(v => v.issues.some(i => i.severity === 'high'))
    : filterIssue === 'medium' ? videos.filter(v => v.issues.some(i => i.severity === 'medium') && !v.issues.some(i => i.severity === 'high'))
    : videos.filter(v => v.issues.length === 0);

  const highCount   = videos.filter(v => v.issues.some(i => i.severity === 'high')).length;
  const mediumCount = videos.filter(v => v.issues.some(i => i.severity === 'medium') && !v.issues.some(i => i.severity === 'high')).length;
  const okCount     = videos.filter(v => v.issues.length === 0).length;
  const avgScore    = videos.length ? Math.round(videos.reduce((a, v) => a + v.score, 0) / videos.length) : 0;

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#cc88ff', fontSize: 14, fontWeight: 700 }}>🔍 Channel Audit</span>
        <button onClick={fetchAudit} disabled={loading}
          style={{ background: '#1a1a2a', border: '1px solid #cc88ff44', color: loading ? '#444' : '#cc88ff', borderRadius: 16, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '...' : '🔄 Refresh'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: '#cc88ff' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Channel scan ho raha hai...</div>
          </div>
        ) : !data ? null : (
          <>
            {/* Channel Info */}
            <div style={{ background: '#0d0d0d', border: '1px solid #cc88ff22', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              {data.channelThumb && <img src={data.channelThumb} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #cc88ff44' }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff' }}>{data.channelName}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{fmtNum(data.subscriberCount)} subscribers • {data.videoCount} videos</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: avgScore >= 80 ? '#44bb66' : avgScore >= 50 ? '#ffaa00' : '#ff4455' }}>{avgScore}</div>
                <div style={{ fontSize: 9, color: '#444', fontWeight: 700 }}>AVG SCORE</div>
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '🔴 High',   count: highCount,   color: '#ff4455', filter: 'high'   },
                { label: '🟡 Medium', count: mediumCount, color: '#ffaa00', filter: 'medium' },
                { label: '✅ OK',     count: okCount,     color: '#44bb66', filter: 'ok'     },
              ].map(s => (
                <button key={s.filter} onClick={() => setFilterIssue(filterIssue === s.filter ? 'all' : s.filter)}
                  style={{ background: filterIssue === s.filter ? `${s.color}15` : '#0d0d0d', border: `1px solid ${filterIssue === s.filter ? s.color : '#1e1e1e'}`, borderRadius: 12, padding: '12px 8px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 9, color: '#555', fontWeight: 700, marginTop: 2 }}>{s.label}</div>
                </button>
              ))}
            </div>

            {/* Video list */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#444', fontSize: 13 }}>Is filter mein koi video nahi</div>
            ) : filtered.map(v => (
              <div key={v.videoId} onClick={() => setOpenVideo(v)}
                style={{ background: '#0d0d0d', border: `1px solid ${v.issues.some(i => i.severity === 'high') ? '#ff445522' : v.issues.length === 0 ? '#44bb6622' : '#ffaa0022'}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
                {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 72, height: 42, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {v.issues.length === 0 ? (
                      <span style={{ fontSize: 10, color: '#44bb66', fontWeight: 700 }}>✅ No issues</span>
                    ) : v.issues.slice(0, 2).map((issue, i) => (
                      <span key={i} style={{ fontSize: 9, background: issue.severity === 'high' ? '#ff445518' : '#ffaa0018', color: issue.severity === 'high' ? '#ff4455' : '#ffaa00', border: `1px solid ${issue.severity === 'high' ? '#ff445533' : '#ffaa0033'}`, borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>
                        {issue.msg.length > 25 ? issue.msg.slice(0, 25) + '…' : issue.msg}
                      </span>
                    ))}
                    {v.issues.length > 2 && <span style={{ fontSize: 9, color: '#444' }}>+{v.issues.length - 2} more</span>}
                  </div>
                </div>
                <ScoreBadge score={v.score} />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function AuditWrapper() {
  return (
    <ToastProvider>
      <AuthWrapper>
        {({ user }) => <AuditPage user={user} />}
      </AuthWrapper>
    </ToastProvider>
  );
}

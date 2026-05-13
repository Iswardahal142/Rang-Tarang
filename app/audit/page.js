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

function fmtDuration(sec) {
  if (!sec) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#44bb66' : score >= 50 ? '#ffaa00' : '#ff4455';
  const label = score >= 80 ? 'Good' : score >= 50 ? 'OK' : 'Poor';
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%',
      border: `2px solid ${color}`, background: `${color}15`,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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

async function updateYouTubeField(videoId, categoryId, title, description, tags) {
  const res = await fetch('/api/audit', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoId, categoryId, title, description, tags }),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || 'Update fail');
  return data;
}

// ── Analytics Mini Card ──
function AnalyticsBar({ analytics }) {
  if (!analytics) return (
    <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 10, padding: '10px 12px', fontSize: 10, color: '#333', textAlign: 'center' }}>
      📊 Analytics data nahi mila (90 din mein views nahi)
    </div>
  );

  const ctrColor = analytics.ctr >= 5 ? '#44bb66' : analytics.ctr >= 3 ? '#ffaa00' : '#ff4455';
  const avgFmt   = fmtDuration(analytics.avgViewDurationSec);

  return (
    <div style={{ background: '#0a0a0a', border: '1px solid #1e2a1e', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 9, color: '#555', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>📊 ANALYTICS (90 DAYS)</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 2 }}>👁 Views</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#ff8800' }}>{fmtNum(analytics.views)}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 2 }}>⏱ Watch Time</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#4488ff' }}>{fmtNum(analytics.watchTimeMinutes)} min</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 2 }}>📺 Avg View</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff' }}>{avgFmt}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 2 }}>🎯 CTR</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: ctrColor }}>{analytics.ctr}%</div>
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ fontSize: 9, color: '#444', marginBottom: 2 }}>👓 Impressions</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa44' }}>{fmtNum(analytics.impressions)}</div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TITLE SECTION
// ══════════════════════════════════════════════════════
function TitleSection({ video, onVideoUpdate }) {
  const toast = useToast();
  const [title, setTitle]           = useState(video.title || '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [status, setStatus]         = useState('idle');

  const isDirty = title !== video.title;

  async function generateTitle() {
    setGenerating(true);
    try {
      const analyticsContext = video.analytics
        ? `CTR: ${video.analytics.ctr}% | Avg View: ${fmtDuration(video.analytics.avgViewDurationSec)} | Watch Time: ${video.analytics.watchTimeMinutes} mins`
        : 'Analytics: not available';

      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang".

Video title: "${video.title}"
Views: ${video.viewCount} | ${analyticsContext}
Tags: ${(video.tags || []).slice(0, 5).join(', ') || 'none'}
Type: ${video.isShort ? 'YouTube Short' : 'Long video'}

Generate ONE improved YouTube title.
RULES:
- Pattern: "[emoji] [Hindi curiosity hook]! | [count] [English topic] Names for Kids | Rang Tarang"
- Examples: "🌸 गुलाब से ज़्यादा सुंदर फूल! | 5 Flowers Names for Kids | Rang Tarang"
- Max 80 characters
- Kid-friendly, catchy, curiosity-based Hindi hook
Return ONLY the title text, nothing else.`);
      setTitle(text.trim());
      toast('🤖 Title ready! Check karo phir Update dabao.');
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function handleUpdate() {
    if (!title.trim()) { toast('⚠️ Title khaali nahi ho sakta!'); return; }
    setSaving(true);
    try {
      await updateYouTubeField(video.videoId, video.categoryId, title.trim(), video.description, (video.tags || []).join(', '));
      setStatus('saved');
      onVideoUpdate({ ...video, title: title.trim() });
      toast('✅ Title YouTube pe update ho gaya!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus('error');
      toast('❌ ' + e.message);
      setTimeout(() => setStatus('idle'), 3000);
    }
    setSaving(false);
  }

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${isDirty ? '#ff880055' : '#1e1e1e'}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#ff8800', fontWeight: 700 }}>📌 TITLE</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isDirty && <span style={{ fontSize: 9, background: 'rgba(255,136,0,0.12)', color: '#ff8800', border: '1px solid #442200', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>Unsaved</span>}
          {status === 'saved' && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.12)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>✅ Updated</span>}
          <span style={{ fontSize: 9, color: title.length > 100 ? '#ff4455' : '#555', fontWeight: 600 }}>{title.length}/100</span>
        </div>
      </div>
      <input value={title} onChange={e => { setTitle(e.target.value); setStatus('idle'); }} maxLength={120} placeholder="Video ka title..."
        style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${isDirty ? '#ff880055' : '#222'}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={generateTitle} disabled={generating}
          style={{ flex: 1, background: generating ? '#111' : 'linear-gradient(135deg,#1a0a2a,#0d0018)', border: `1px solid ${generating ? '#333' : '#cc88ff55'}`, color: generating ? '#555' : '#cc88ff', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {generating ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#cc88ff' }} />Generating...</> : '🤖 AI Generate'}
        </button>
        <button onClick={handleUpdate} disabled={saving || !isDirty}
          style={{ flex: 1, background: saving ? '#111' : isDirty ? 'linear-gradient(135deg,#0a1a44,#05102a)' : '#111', border: `1px solid ${saving ? '#333' : isDirty ? '#4488ff' : '#222'}`, color: saving ? '#555' : isDirty ? '#4488ff' : '#333', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: saving || !isDirty ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {saving ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#4488ff' }} />Updating...</> : '🚀 Update'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// DESCRIPTION SECTION
// ══════════════════════════════════════════════════════
function DescriptionSection({ video, onVideoUpdate }) {
  const toast = useToast();
  const [desc, setDesc]             = useState(video.description || '');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [status, setStatus]         = useState('idle');

  const isDirty = desc !== video.description;

  async function generateDesc() {
    setGenerating(true);
    try {
      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang".

Video title: "${video.title}"
Tags: ${(video.tags || []).slice(0, 8).join(', ') || 'none'}
Type: ${video.isShort ? 'YouTube Short' : 'Long video'}

Generate a complete YouTube description in Hinglish.
FORMAT (follow exactly):
Line 1: Hook in Hindi (exciting, 1 line)
Line 2: ✅ Is video mein: [list main topics based on title]
Line 3: 👶 2-6 saal ke bacchon ke liye perfect!
Line 4: 🔔 Rang Tarang Subscribe karo: https://youtube.com/@RangTarangHindi
Line 5: Relevant hashtags (#Shorts #HindiKids #RangTarang etc)

Return ONLY the description text, nothing else. No markdown.`);
      setDesc(text.trim());
      toast('🤖 Description ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function handleUpdate() {
    setSaving(true);
    try {
      await updateYouTubeField(video.videoId, video.categoryId, video.title, desc.trim(), (video.tags || []).join(', '));
      setStatus('saved');
      onVideoUpdate({ ...video, description: desc.trim() });
      toast('✅ Description updated!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus('error');
      toast('❌ ' + e.message);
      setTimeout(() => setStatus('idle'), 3000);
    }
    setSaving(false);
  }

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${isDirty ? '#4488ff44' : '#1e1e1e'}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#4488ff', fontWeight: 700 }}>📝 DESCRIPTION</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isDirty && <span style={{ fontSize: 9, background: 'rgba(68,136,255,0.12)', color: '#4488ff', border: '1px solid #112244', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>Unsaved</span>}
          {status === 'saved' && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.12)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>✅ Updated</span>}
          <span style={{ fontSize: 9, color: '#555', fontWeight: 600 }}>{desc.length} chars</span>
        </div>
      </div>
      <textarea value={desc} onChange={e => { setDesc(e.target.value); setStatus('idle'); }} placeholder="Video ki description..." rows={5}
        style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${isDirty ? '#4488ff44' : '#222'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, marginBottom: 10 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={generateDesc} disabled={generating}
          style={{ flex: 1, background: generating ? '#111' : 'linear-gradient(135deg,#1a0a2a,#0d0018)', border: `1px solid ${generating ? '#333' : '#cc88ff55'}`, color: generating ? '#555' : '#cc88ff', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {generating ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#cc88ff' }} />Generating...</> : '🤖 AI Generate'}
        </button>
        <button onClick={handleUpdate} disabled={saving || !isDirty}
          style={{ flex: 1, background: saving ? '#111' : isDirty ? 'linear-gradient(135deg,#0a1a44,#05102a)' : '#111', border: `1px solid ${saving ? '#333' : isDirty ? '#4488ff' : '#222'}`, color: saving ? '#555' : isDirty ? '#4488ff' : '#333', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: saving || !isDirty ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {saving ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#4488ff' }} />Updating...</> : '🚀 Update'}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════
// TAGS SECTION
// ══════════════════════════════════════════════════════
function TagsSection({ video, onVideoUpdate }) {
  const toast = useToast();
  const [tags, setTags]             = useState((video.tags || []).join(', '));
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [status, setStatus]         = useState('idle');

  const originalTags = (video.tags || []).join(', ');
  const isDirty  = tags !== originalTags;
  const tagCount = tags.split(',').filter(t => t.trim()).length;

  async function generateTags() {
    setGenerating(true);
    try {
      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang".

Video title: "${video.title}"
Current tags: ${(video.tags || []).join(', ') || 'none'}
Type: ${video.isShort ? 'YouTube Short' : 'Long video'}

Generate exactly 15 YouTube tags.
RULES:
- Mix of Hindi + English keywords
- Topic-specific + general kids learning tags
- Each tag max 3 words
- Comma separated list
- No # symbol, no quotes
Return ONLY the comma-separated tags, nothing else.`);
      setTags(text.trim());
      toast('🤖 Tags ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function handleUpdate() {
    setSaving(true);
    try {
      await updateYouTubeField(video.videoId, video.categoryId, video.title, video.description, tags);
      const newTagsArr = tags.split(',').map(t => t.trim()).filter(Boolean);
      setStatus('saved');
      onVideoUpdate({ ...video, tags: newTagsArr });
      toast('✅ Tags updated!');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) {
      setStatus('error');
      toast('❌ ' + e.message);
      setTimeout(() => setStatus('idle'), 3000);
    }
    setSaving(false);
  }

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${isDirty ? '#44bb6644' : '#1e1e1e'}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: '#44bb66', fontWeight: 700 }}>🏷️ TAGS</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {isDirty && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.1)', color: '#44bb66', border: '1px solid #1a3a1a', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>Unsaved</span>}
          {status === 'saved' && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.12)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 7px', borderRadius: 20, fontWeight: 700 }}>✅ Updated</span>}
          <span style={{ fontSize: 9, color: tagCount < 10 ? '#ffaa00' : '#44bb66', fontWeight: 700 }}>{tagCount} tags</span>
        </div>
      </div>
      <textarea value={tags} onChange={e => { setTags(e.target.value); setStatus('idle'); }} placeholder="tag1, tag2, tag3..." rows={3}
        style={{ width: '100%', background: '#0a0a0a', border: `1px solid ${isDirty ? '#44bb6644' : '#222'}`, borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6, marginBottom: 8 }} />
      {tags.trim() && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {tags.split(',').filter(t => t.trim()).map((t, i) => (
            <span key={i} style={{ background: '#1a2a1a', border: '1px solid #44bb6633', color: '#44bb66aa', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{t.trim()}</span>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={generateTags} disabled={generating}
          style={{ flex: 1, background: generating ? '#111' : 'linear-gradient(135deg,#1a0a2a,#0d0018)', border: `1px solid ${generating ? '#333' : '#cc88ff55'}`, color: generating ? '#555' : '#cc88ff', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {generating ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#cc88ff' }} />Generating...</> : '🤖 AI Generate'}
        </button>
        <button onClick={handleUpdate} disabled={saving || !isDirty}
          style={{ flex: 1, background: saving ? '#111' : isDirty ? 'linear-gradient(135deg,#0a1a44,#05102a)' : '#111', border: `1px solid ${saving ? '#333' : isDirty ? '#4488ff' : '#222'}`, color: saving ? '#555' : isDirty ? '#4488ff' : '#333', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: saving || !isDirty ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {saving ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#4488ff' }} />Updating...</> : '🚀 Update'}
        </button>
      </div>
    </div>
  );
}

// ── Video Detail ──
function VideoDetail({ video: initialVideo, onBack }) {
  const [video, setVideo] = useState(initialVideo);

  const highIssues   = video.issues.filter(i => i.severity === 'high');
  const mediumIssues = video.issues.filter(i => i.severity === 'medium');
  const lowIssues    = video.issues.filter(i => i.severity === 'low');

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#cc88ff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
        <ScoreBadge score={video.score} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Thumbnail + stats */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, overflow: 'hidden' }}>
          {video.thumbnail && <img src={video.thumbnail} alt="" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />}
          <div style={{ padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#eee', lineHeight: 1.5, marginBottom: 6 }}>{video.title}</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: '#ff8800', fontWeight: 700 }}>👁 {fmtNum(video.viewCount)}</span>
              <span style={{ fontSize: 10, color: '#44bb66' }}>👍 {fmtNum(video.likeCount)}</span>
              <span style={{ fontSize: 9, background: video.isShort ? '#ff448822' : '#44bb6622', color: video.isShort ? '#ff4488' : '#44bb66', border: `1px solid ${video.isShort ? '#ff448844' : '#44bb6644'}`, borderRadius: 8, padding: '1px 6px', fontWeight: 700 }}>
                {video.isShort ? '⚡ Short' : '🎬 Long'}
              </span>
            </div>
          </div>
        </div>

        {/* Analytics bar */}
        <AnalyticsBar analytics={video.analytics} />

        {/* Issues */}
        {video.issues.length === 0 ? (
          <div style={{ background: '#0a140a', border: '1px solid #44bb6633', borderRadius: 12, padding: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
            <div style={{ fontSize: 13, color: '#44bb66', fontWeight: 700 }}>Koi issue nahi mila!</div>
          </div>
        ) : (
          <div style={{ background: '#0f0f0f', border: '1px solid #2a1a1a', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 11, color: '#ff4455', fontWeight: 700, marginBottom: 10 }}>⚠️ {video.issues.length} Issue{video.issues.length > 1 ? 's' : ''} Mili</div>
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

        <TitleSection       video={video} onVideoUpdate={setVideo} />
        <DescriptionSection video={video} onVideoUpdate={setVideo} />
        <TagsSection        video={video} onVideoUpdate={setVideo} />
      </div>
    </div>
  );
}

// ── MAIN PAGE ──
function AuditPage() {
  const toast = useToast();
  const [loading, setLoading]         = useState(false);
  const [data, setData]               = useState(null);
  const [openVideo, setOpenVideo]     = useState(null);
  const [filterIssue, setFilterIssue] = useState('all');
  const [exported, setExported]       = useState(false);

  useEffect(() => { fetchAudit(); }, []);

  async function fetchAudit() {
    setLoading(true); setData(null); setOpenVideo(null);
    try {
      const [auditRes, analyticsRes] = await Promise.all([
        fetch('/api/audit'),
        fetch('/api/youtube/analytics'),
      ]);
      const json          = await auditRes.json();
      const analyticsJson = await analyticsRes.json();

      if (json.error) { toast('❌ ' + json.error); setLoading(false); return; }

      const analyticsMap = analyticsJson.analytics || {};
      if (json.videos) {
        json.videos = json.videos.map(v => ({
          ...v,
          analytics: analyticsMap[v.videoId] || null,
        }));
      }
      setData(json);
    } catch (e) { toast('❌ ' + e.message); }
    setLoading(false);
  }

  const videos      = data?.videos || [];
  const filtered    = filterIssue === 'all' ? videos
    : filterIssue === 'high'   ? videos.filter(v => v.issues.some(i => i.severity === 'high'))
    : filterIssue === 'medium' ? videos.filter(v => v.issues.some(i => i.severity === 'medium') && !v.issues.some(i => i.severity === 'high'))
    : videos.filter(v => v.issues.length === 0);

  const highCount   = videos.filter(v => v.issues.some(i => i.severity === 'high')).length;
  const mediumCount = videos.filter(v => v.issues.some(i => i.severity === 'medium') && !v.issues.some(i => i.severity === 'high')).length;
  const okCount     = videos.filter(v => v.issues.length === 0).length;
  const avgScore    = videos.length ? Math.round(videos.reduce((a, v) => a + v.score, 0) / videos.length) : 0;

  function buildExportText() {
    if (!data) return '';
    const lines = [];
    lines.push(`=== RANG TARANG CHANNEL AUDIT ===`);
    lines.push(`Channel: ${data.channelName}`);
    lines.push(`Subscribers: ${data.subscriberCount} | Videos: ${data.videoCount}`);
    lines.push(`Avg SEO Score: ${avgScore}/100`);
    lines.push(`High Issues: ${highCount} | Medium: ${mediumCount} | OK: ${okCount}`);
    lines.push(``);
    lines.push(`=== VIDEOS ===`);
    videos.forEach((v, i) => {
      lines.push(``);
      lines.push(`[${i + 1}] ${v.title}`);
      lines.push(`Score: ${v.score}/100 | Views: ${v.viewCount} | Likes: ${v.likeCount}`);
      lines.push(`Type: ${v.isShort ? 'Short' : 'Long'} | Duration: ${fmtDuration(v.durationSec)}`);
      lines.push(`Tags (${(v.tags || []).length}): ${(v.tags || []).join(', ') || 'none'}`);
      if (v.description) lines.push(`Description: ${v.description.slice(0, 200)}...`);
      if (v.analytics) {
        lines.push(`Watch Time: ${v.analytics.watchTimeMinutes} mins | Avg View: ${fmtDuration(v.analytics.avgViewDurationSec)} | Impressions: ${v.analytics.impressions} | CTR: ${v.analytics.ctr}%`);
      }
      if (v.issues.length > 0) {
        lines.push(`Issues:`);
        v.issues.forEach(iss => lines.push(`  [${iss.severity.toUpperCase()}] ${iss.msg}`));
      } else {
        lines.push(`Issues: none`);
      }
    });
    lines.push(``);
    lines.push(`=== AI PROMPT ===`);
    lines.push(`Yeh mere Hindi kids YouTube channel "Rang Tarang" ka SEO audit data hai. Analytics data bhi include hai (views, watch time, CTR, impressions). Saari problems dekho aur priority ke hisaab se fixes batao. Har video ke liye specific improved title, description aur tags suggest karo.`);
    return lines.join('\n');
  }

  if (openVideo) return <VideoDetail video={openVideo} onBack={() => setOpenVideo(null)} />;

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#cc88ff', fontSize: 14, fontWeight: 700 }}>🔍 Channel Audit</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {data && (
            <button onClick={() => { navigator.clipboard.writeText(buildExportText()); setExported(true); toast('📋 AI ke liye data copy ho gaya!'); setTimeout(() => setExported(false), 3000); }}
              style={{ background: exported ? 'rgba(68,187,102,0.15)' : '#1a1a1a', border: `1px solid ${exported ? '#44bb66' : '#333'}`, color: exported ? '#44bb66' : '#888', borderRadius: 16, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {exported ? '✅ Copied!' : '🤖 AI Export'}
            </button>
          )}
          <button onClick={fetchAudit} disabled={loading}
            style={{ background: '#1a1a2a', border: '1px solid #cc88ff44', color: loading ? '#444' : '#cc88ff', borderRadius: 16, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div className="spinner" style={{ margin: '0 auto 12px', borderTopColor: '#cc88ff' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Channel scan ho raha hai...</div>
          </div>
        ) : !data ? null : (
          <>
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

            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: '#444', fontSize: 13 }}>Is filter mein koi video nahi</div>
            ) : filtered.map(v => (
              <div key={v.videoId} onClick={() => setOpenVideo(v)}
                style={{ background: '#0d0d0d', border: `1px solid ${v.issues.some(i => i.severity === 'high') ? '#ff445522' : v.issues.length === 0 ? '#44bb6622' : '#ffaa0022'}`, borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
                {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 72, height: 42, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#ddd', lineHeight: 1.4, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                    {v.issues.length === 0 ? (
                      <span style={{ fontSize: 10, color: '#44bb66', fontWeight: 700 }}>✅ No issues</span>
                    ) : v.issues.slice(0, 2).map((issue, i) => (
                      <span key={i} style={{ fontSize: 9, background: issue.severity === 'high' ? '#ff445518' : '#ffaa0018', color: issue.severity === 'high' ? '#ff4455' : '#ffaa00', border: `1px solid ${issue.severity === 'high' ? '#ff445533' : '#ffaa0033'}`, borderRadius: 6, padding: '2px 7px', fontWeight: 700 }}>
                        {issue.msg.length > 25 ? issue.msg.slice(0, 25) + '…' : issue.msg}
                      </span>
                    ))}
                    {v.issues.length > 2 && <span style={{ fontSize: 9, color: '#444' }}>+{v.issues.length - 2} more</span>}
                  </div>
                  {/* Mini analytics inline */}
                  {v.analytics && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 9, color: '#4488ff', fontWeight: 700 }}>⏱ {v.analytics.watchTimeMinutes}m</span>
                      <span style={{ fontSize: 9, color: v.analytics.ctr >= 5 ? '#44bb66' : v.analytics.ctr >= 3 ? '#ffaa00' : '#ff4455', fontWeight: 700 }}>🎯 {v.analytics.ctr}%</span>
                      <span style={{ fontSize: 9, color: '#cc88ff', fontWeight: 700 }}>📺 {fmtDuration(v.analytics.avgViewDurationSec)}</span>
                    </div>
                  )}
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
  return <ToastProvider><AuthWrapper>{() => <AuditPage />}</AuthWrapper></ToastProvider>;
}

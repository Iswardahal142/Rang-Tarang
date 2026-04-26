// 📁 LOCATION: app/long-video/page.js
'use client';

import { useState, useEffect } from 'react';
import { ToastProvider, useToast } from '../../components/Toast';
import AuthWrapper from '../../components/AuthWrapper';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC4G3cBS6fTmi7PXRrCbQPIkEbr-bh_470",
  authDomain: "fir-c929f.firebaseapp.com",
  projectId: "fir-c929f",
  storageBucket: "fir-c929f.firebasestorage.app",
  messagingSenderId: "82713990557",
  appId: "1:82713990557:web:d4586900ad445cb8a2cb74",
};
function getDB() {
  const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  return getFirestore(app);
}
async function getLongVideos(uid) {
  const db = getDB();
  const snap = await getDocs(query(collection(db, 'users', uid, 'long_videos'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveLongVideo(uid, data) {
  return addDoc(collection(getDB(), 'users', uid, 'long_videos'), { ...data, createdAt: serverTimestamp() });
}
async function updateLongVideo(uid, id, data) {
  await updateDoc(doc(getDB(), 'users', uid, 'long_videos', id), data);
}
async function deleteLongVideo(uid, id) {
  await deleteDoc(doc(getDB(), 'users', uid, 'long_videos', id));
}

// ── Helpers ─────────────────────────────────────────────
function getSeriesType(topic) {
  const n = (topic || '').toLowerCase();
  if (n.includes('number') || n.includes('counting') || n.includes('ginti')) return 'number';
  if (n.includes('alphabet') || n.includes('abc') || n.includes('letter')) return 'alphabet';
  if (n.includes('color') || n.includes('colour') || n.includes('rang')) return 'color';
  if (n.includes('shape')) return 'shape';
  if (n.includes('fruit')) return 'fruit';
  if (n.includes('animal')) return 'animal';
  if (n.includes('vegetable') || n.includes('veggie') || n.includes('sabzi')) return 'vegetable';
  return 'general';
}
function getQuestion(type) {
  switch(type) {
    case 'number':    return 'यह कौनसा नंबर है?';
    case 'alphabet':  return 'यह कौनसा अक्षर है?';
    case 'color':     return 'यह कौनसा रंग है?';
    case 'shape':     return 'यह कौनसी आकृति है?';
    case 'fruit':     return 'यह कौनसा फल है?';
    case 'animal':    return 'यह कौनसा जानवर है?';
    case 'vegetable': return 'यह कौनसी सब्ज़ी है?';
    default:          return 'यह क्या है?';
  }
}

// ── Prompt Builders ─────────────────────────────────────
function buildItemImagePrompt(item, type, question) {
  const isSymbol = type === 'number' || type === 'alphabet';
  const centerDesc = isSymbol
    ? `Large bold glowing "${item}" in 3D colorful style displayed center-right — no other object`
    : `${item} object displayed center-right, large, colorful, 3D Pixar style`;
  return `Use reference background exactly. Use reference teacher character exactly.
Teacher center-left, pointing right with curious excited expression.
${centerDesc}.
Bold question text "${question}" at TOP center with sparkles.
No "?" symbol anywhere. No question mark floating anywhere. No other text.
16:9 horizontal ratio. Pixar 3D style. Bright colorful scene.`;
}

function buildItemVideoPrompt(item, type, question) {
  const isSymbol = type === 'number' || type === 'alphabet';
  const centerDesc = isSymbol ? `large glowing "${item}" center` : `${item} center`;
  return `Use reference scene exactly. 16:9 horizontal ratio.
Teacher center-left pointing at ${centerDesc} on right.
Teacher asks in Hindi: "${question}". Pause 2 seconds.
Question text at top center animates away → glowing bold "${item.toUpperCase()}" appears at top center with sparkle animation. Answer stays visible until very last frame.
Teacher says in Hindi: "यह ${item} है! बहुत अच्छे!" Teacher smiles and gives thumbs up.
No "?" or question mark anywhere. No floating symbols. No background music.
8 seconds total. Smooth animation. No glitch. Only Hindi Indian accent audio.`;
}

function buildIntroImagePrompt(topic) {
  return `Use reference background exactly. Use reference teacher character exactly.
Teacher standing center, smiling, waving hand with excited expression.
Bold glowing text "${topic}" floating center-top with colorful sparkles and confetti.
16:9 horizontal ratio. Pixar 3D style. Bright colorful scene. No other text.`;
}

function buildIntroVideoPrompt(topic) {
  return `Use reference scene exactly. 16:9 horizontal ratio.
No text on screen. Teacher standing center, smiling, waving at camera excitedly.
Teacher says in Hindi: "Hello bacchon! Aaj hum sikhenge ${topic} — chalo shuru karte hain!" Teacher claps happily.
No background music. 8 seconds. Smooth animation. No glitch. Hindi audio only.`;
}

function buildOutroImagePrompt() {
  return `Use reference background exactly. Use reference teacher character exactly.
Teacher standing center, waving goodbye with big smile and thumbs up.
Colorful sparkles, stars, confetti floating around.
16:9 horizontal ratio. Pixar 3D style. No text.`;
}

function buildOutroVideoPrompt() {
  return `Use reference scene exactly. 16:9 horizontal ratio.
No text on screen. Teacher center, waves goodbye happily.
Teacher says in Hindi: "Toh bacchon, aaj ke liye bas itna hi — milte hain agle video mein, tata bye bye!"
No background music. 8 seconds. Smooth. No glitch. Hindi audio only.`;
}

function buildThumbnailPrompt(topic, type, items) {
  let leftObjects = '';
  if (type === 'number')        leftObjects = 'Large colorful 3D numbers "1", "2", "3" stacked on left side';
  else if (type === 'alphabet') leftObjects = 'Large colorful 3D letters "A", "B", "C" stacked on left side';
  else if (type === 'fruit')    leftObjects = `Large colorful 3D fruits: ${items.slice(0,3).join(', ')} on left side`;
  else if (type === 'animal')   leftObjects = `Large colorful 3D animals: ${items.slice(0,3).join(', ')} on left side`;
  else if (type === 'vegetable')leftObjects = `Large colorful 3D vegetables: ${items.slice(0,3).join(', ')} on left side`;
  else if (type === 'color')    leftObjects = 'Large colorful 3D color circles and blobs on left side';
  else if (type === 'shape')    leftObjects = 'Large colorful 3D shapes: circle, square, triangle on left side';
  else                          leftObjects = `Large colorful 3D objects related to "${topic}" on left side`;

  return `Create a YouTube kids thumbnail in this exact style:

BACKGROUND:
- Bright vibrant rainbow gradient (red → yellow → green → blue → purple)
- Colorful confetti pieces scattered all over
- Glowing sparkles and gold stars throughout the image

CENTER TEXT:
- Large bold 3D bubbly text: "${topic}"
- Each word in different bright color (red, green, blue, pink, orange)
- Dark outline and shadow on each letter for visibility
- Rounded bubbly font style, Pixar-inspired

CHARACTER:
- Cute Pixar 3D boy, brown hair, wearing colorful striped t-shirt and denim overalls
- Positioned right side of image, pointing toward center text excitedly
- Big open-mouth smile, happy expression

LEFT SIDE:
- ${leftObjects}
- Large, colorful, 3D render style, slightly overlapping
- Bright saturated colors, no dull tones

LOGO:
- Top right corner: Use the exact logo from the reference image provided — replicate it as accurately as possible, same design, same text, same colors
OVERALL:
- Ultra colorful, eye-catching, Pixar 3D render quality
- Kids YouTube thumbnail style, high contrast
- 16:9 ratio, high resolution, no watermark, no extra text`;
}

async function aiCall(messages) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 800, temperature: 0.7, messages }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

const PRESETS = [
  { label: '1–10',    topic: 'Numbers 1 to 10',  type: 'number',   range: '1 to 10' },
  { label: '1–50',    topic: 'Numbers 1 to 50',  type: 'number',   range: '1 to 50' },
  { label: '1–100',   topic: 'Numbers 1 to 100', type: 'number',   range: '1 to 100' },
  { label: 'A–Z',     topic: 'Alphabets A to Z', type: 'alphabet', range: 'A to Z' },
  { label: 'Fruits',  topic: 'Fruits',           type: 'fruit',    range: '' },
  { label: 'Animals', topic: 'Animals',          type: 'animal',   range: '' },
  { label: 'Veggies', topic: 'Vegetables',       type: 'vegetable',range: '' },
  { label: 'Colors',  topic: 'Colors',           type: 'color',    range: '' },
  { label: 'Shapes',  topic: 'Shapes',           type: 'shape',    range: '' },
];

const PER_PAGE = 10;

// ── MAIN ────────────────────────────────────────────────
function LongVideoPage({ user }) {
  const toast = useToast();
  const [list, setList]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [openVideo, setOpenVideo] = useState(null);
  const [modal, setModal]         = useState(false);
  const [selPreset, setSelPreset] = useState(null);
  const [customTopic, setCustom]  = useState('');
  const [customRange, setRange]   = useState('');
  const [creating, setCreating]   = useState(false);

  useEffect(() => { loadList(); }, [user.uid]);

  async function loadList() {
    setLoading(true);
    try { setList(await getLongVideos(user.uid)); } catch { toast('❌ Load fail'); }
    setLoading(false);
  }

  async function createVideo() {
    const topic = selPreset ? selPreset.topic : customTopic.trim();
    const range = selPreset ? selPreset.range : customRange.trim();
    const type  = selPreset ? selPreset.type  : getSeriesType(customTopic);
    if (!topic) return toast('⚠️ Topic daalo!');
    setCreating(true);
    try {
      let items = [];
      if (type === 'number') {
        const nums = range.match(/\d+/g)?.map(Number) || [1, 10];
        items = Array.from({ length: nums[1] - nums[0] + 1 }, (_, i) => String(nums[0] + i));
      } else if (type === 'alphabet') {
        items = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      } else {
        const text = await aiCall([{ role: 'user', content: `Generate a list of items for kids YouTube series "${topic}".
Return ONLY a JSON array of English item names, no markdown, no explanation.
Example: ["Apple","Banana","Cherry"]
Generate 20 unique items.` }]);
        items = JSON.parse(text.replace(/```json|```/g, '').trim());
      }
      await saveLongVideo(user.uid, { topic, range, type, items, ytTitle: '', ytDescription: '' });
      toast(`✅ "${topic}" ready!`);
      setModal(false); setSelPreset(null); setCustom(''); setRange('');
      loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setCreating(false);
  }

  if (openVideo) return (
    <DetailView
      video={openVideo} user={user} toast={toast}
      onBack={() => setOpenVideo(null)}
      onDelete={async () => {
        if (!confirm(`"${openVideo.topic}" delete karein?`)) return;
        await deleteLongVideo(user.uid, openVideo.id);
        toast('🗑 Deleted!'); setOpenVideo(null); loadList();
      }}
      onUpdate={updated => {
        setList(l => l.map(v => v.id === updated.id ? updated : v));
        setOpenVideo(updated);
      }}
    />
  );

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ffaa00', fontSize: 14, fontWeight: 700 }}>🎥 Long Video</span>
        <button onClick={() => setModal(true)} style={{ background: '#ffaa00', border: 'none', color: '#000', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Naya</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0d00', border: '1px solid #443300', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa00', marginBottom: 14, textAlign: 'center' }}>🎥 Naya Long Video</div>
              <div style={{ fontSize: 10, color: '#666', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>⚡ Quick Select</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {PRESETS.map(p => (
                  <button key={p.label} onClick={() => setSelPreset(selPreset?.label === p.label ? null : p)}
                    style={{ background: selPreset?.label === p.label ? 'rgba(255,170,0,0.2)' : '#111', border: `1px solid ${selPreset?.label === p.label ? '#ffaa00' : '#333'}`, color: selPreset?.label === p.label ? '#ffaa00' : '#666', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    {p.label}
                  </button>
                ))}
              </div>
              {!selPreset && <>
                <input value={customTopic} onChange={e => setCustom(e.target.value)} placeholder="Custom topic e.g. Body Parts..."
                  style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: '#eee', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
                <input value={customRange} onChange={e => setRange(e.target.value)} placeholder="Range (optional) e.g. 1 to 20"
                  style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: '#eee', outline: 'none', boxSizing: 'border-box', marginBottom: 8 }} />
              </>}
              {selPreset && <div style={{ background: 'rgba(255,170,0,0.07)', border: '1px solid #332200', borderRadius: 10, padding: '10px 12px', fontSize: 12, color: '#aa7700', marginBottom: 12 }}>📌 {selPreset.topic} {selPreset.range && `(${selPreset.range})`}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={createVideo} disabled={creating}
                  style={{ flex: 2, background: creating ? '#1a1000' : 'linear-gradient(135deg,#cc7700,#ffaa00)', border: 'none', color: creating ? '#555' : '#000', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: creating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {creating ? <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#ffaa00' }} />Ban raha hai...</> : '🚀 Create Karo'}
                </button>
                <button onClick={() => { setModal(false); setSelPreset(null); }}
                  style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ffaa00' }} /><div style={{ fontSize: 12, color: '#555' }}>Loading...</div></div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎥</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi video nahi hai</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Naya" se banao</div>
          </div>
        ) : list.map(v => (
          <div key={v.id} onClick={() => setOpenVideo(v)}
            style={{ background: '#0f0f0f', border: '1px solid #2a2000', borderLeft: '3px solid #ffaa00', borderRadius: 14, padding: 14, cursor: 'pointer' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 4 }}>🎥 {v.topic}</div>
            {v.range && <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Range: {v.range}</div>}
            <div style={{ fontSize: 11, color: '#555' }}>{(v.items || []).length} items</div>
            {v.ytTitle && <div style={{ fontSize: 10, color: '#888', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📝 {v.ytTitle}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── DETAIL VIEW ─────────────────────────────────────────
function DetailView({ video, user, toast, onBack, onDelete, onUpdate }) {
  const [page, setPage]       = useState(0);
  const [copiedKey, setCopied]= useState('');
  const [genTD, setGenTD]     = useState(false);
  const [ytTitle, setYtTitle] = useState(video.ytTitle || '');
  const [ytDesc, setYtDesc]   = useState(video.ytDescription || '');
  const [showYT, setShowYT]   = useState(false);
  const [showThumb, setShowThumb] = useState(false);

  const type     = video.type || getSeriesType(video.topic);
  const question = getQuestion(type);
  const items    = video.items || [];
  const total    = Math.ceil(items.length / PER_PAGE);
  const pageItems= items.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(''), 2000); toast('📋 Copied!');
    });
  }

  function PromptBox({ label, text, pkey, color }) {
    return (
      <div>
        <div style={{ fontSize: 9, color: color || '#ffaa00', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{label}</div>
        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 44px 12px 12px', fontSize: 12, lineHeight: 1.7, color: '#bbb', position: 'relative' }}>
          {text}
          <button onClick={() => copy(pkey, text)}
            style={{ position: 'absolute', top: 8, right: 8, background: copiedKey === pkey ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === pkey ? '#44bb66' : '#333'}`, color: copiedKey === pkey ? '#fff' : '#666', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {copiedKey === pkey ? '✅' : '📋'}
          </button>
        </div>
      </div>
    );
  }

  async function generateTitleDesc() {
    setGenTD(true);
    try {
      const text = await aiCall([{ role: 'user', content: `YouTube SEO expert for Hindi kids channel "Rang Tarang".
Generate title and description for: "${video.topic}"
- Title: Catchy Hindi+English, under 70 chars, end with "| Rang Tarang"
- Description: 3-4 lines, fun, what kids learn, includes "Rang Tarang", ends with subscribe line
Return ONLY JSON: {"title":"...","description":"..."}` }]);
      const p = JSON.parse(text.replace(/```json|```/g, '').trim());
      setYtTitle(p.title); setYtDesc(p.description);
      await updateLongVideo(user.uid, video.id, { ytTitle: p.title, ytDescription: p.description });
      onUpdate({ ...video, ytTitle: p.title, ytDescription: p.description });
      toast('✅ Ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  function PaginationBar() {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
          style={{ background: page === 0 ? '#111' : '#1a1a00', border: `1px solid ${page === 0 ? '#222' : '#443300'}`, color: page === 0 ? '#333' : '#ffaa00', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
          ← Prev
        </button>
        <span style={{ fontSize: 11, color: '#555' }}>{page + 1} / {total}</span>
        <button onClick={() => setPage(p => Math.min(total - 1, p + 1))} disabled={page >= total - 1}
          style={{ background: page >= total - 1 ? '#111' : '#1a1a00', border: `1px solid ${page >= total - 1 ? '#222' : '#443300'}`, color: page >= total - 1 ? '#333' : '#ffaa00', borderRadius: 8, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: page >= total - 1 ? 'not-allowed' : 'pointer' }}>
          Next →
        </button>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#ffaa00', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
        <span style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>🎥 {video.topic}</span>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ── YOUTUBE CARD ── */}
        <div style={{ background: '#0f0f0f', border: `1px solid ${video.ytTitle ? '#1a3a2a' : '#2a2000'}`, borderRadius: 14, overflow: 'hidden' }}>
          <div onClick={() => setShowYT(s => !s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: video.ytTitle ? '#44bb66' : '#ffaa44' }}>📺 YouTube Card</span>
              {video.ytTitle && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
            </div>
            <span style={{ fontSize: 13, color: '#444' }}>{showYT ? '▲' : '▼'}</span>
          </div>
          {showYT && (
            <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button onClick={generateTitleDesc} disabled={genTD}
                style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {genTD ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ffaa44' }} />Generate ho raha hai...</> : '🤖 AI se Generate Karo'}
              </button>
              <div>
                <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>📌 Title</div>
                <div style={{ position: 'relative' }}>
                  <input value={ytTitle} onChange={e => setYtTitle(e.target.value)} placeholder="YouTube title..."
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                  <button onClick={() => copy('ytTitle', ytTitle)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey === 'ytTitle' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'ytTitle' ? '#44bb66' : '#333'}`, color: copiedKey === 'ytTitle' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey === 'ytTitle' ? '✅' : '📋'}</button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>📄 Description</div>
                <div style={{ position: 'relative' }}>
                  <textarea value={ytDesc} onChange={e => setYtDesc(e.target.value)} placeholder="YouTube description..." rows={4}
                    style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
                  <button onClick={() => copy('ytDesc', ytDesc)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey === 'ytDesc' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'ytDesc' ? '#44bb66' : '#333'}`, color: copiedKey === 'ytDesc' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey === 'ytDesc' ? '✅' : '📋'}</button>
                </div>
              </div>
              <button onClick={async () => {
                await updateLongVideo(user.uid, video.id, { ytTitle, ytDescription: ytDesc });
                onUpdate({ ...video, ytTitle, ytDescription: ytDesc });
                toast('💾 Saved!');
              }} style={{ background: 'rgba(68,187,102,0.12)', border: '1px solid rgba(68,187,102,0.4)', color: '#44bb66', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                💾 Save Karo
              </button>
            </div>
          )}
        </div>

        {/* ── THUMBNAIL ── */}
        <div style={{ background: '#0f0f0f', border: '1px solid #2a1a00', borderRadius: 14, overflow: 'hidden' }}>
          <div onClick={() => setShowThumb(s => !s)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#ff8844' }}>🖼 Thumbnail Prompt</span>
            <span style={{ fontSize: 13, color: '#444' }}>{showThumb ? '▲' : '▼'}</span>
          </div>
          {showThumb && (
            <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1e1e1e' }}>
              <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 44px 12px 12px', fontSize: 12, lineHeight: 1.7, color: '#bbb', position: 'relative', marginTop: 10, whiteSpace: 'pre-wrap' }}>
                {buildThumbnailPrompt(video.topic, type, items)}
                <button onClick={() => copy('thumb', buildThumbnailPrompt(video.topic, type, items))}
                  style={{ position: 'absolute', top: 8, right: 8, background: copiedKey === 'thumb' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'thumb' ? '#44bb66' : '#333'}`, color: copiedKey === 'thumb' ? '#fff' : '#666', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {copiedKey === 'thumb' ? '✅' : '📋'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── INTRO ── */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#4488ff' }}>🎬 Intro</div>
          <PromptBox label="🖼 IMAGE PROMPT" text={buildIntroImagePrompt(video.topic)} pkey="intro_img" color="#4488ff" />
          <PromptBox label="🎬 VIDEO PROMPT" text={buildIntroVideoPrompt(video.topic)} pkey="intro_vid" color="#cc88ff" />
        </div>

        {/* ── ITEMS ── */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#ffaa00' }}>
              📋 Items {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, items.length)} / {items.length}
            </div>
          </div>
          <PaginationBar />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
            {pageItems.map((item, i) => {
              const gi = page * PER_PAGE + i;
              return (
                <div key={gi} style={{ borderTop: i > 0 ? '1px solid #1a1a1a' : 'none', paddingTop: i > 0 ? 14 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#ffcc44', marginBottom: 8 }}>{gi + 1}. {item}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <PromptBox label="🖼 IMAGE PROMPT" text={buildItemImagePrompt(item, type, question)} pkey={`img_${gi}`} color="#4488ff" />
                    <PromptBox label="🎬 VIDEO PROMPT" text={buildItemVideoPrompt(item, type, question)} pkey={`vid_${gi}`} color="#cc88ff" />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14 }}><PaginationBar /></div>
        </div>

        {/* ── OUTRO ── */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#cc88ff' }}>🎤 Outro</div>
          <PromptBox label="🖼 IMAGE PROMPT" text={buildOutroImagePrompt()} pkey="outro_img" color="#4488ff" />
          <PromptBox label="🎬 VIDEO PROMPT" text={buildOutroVideoPrompt()} pkey="outro_vid" color="#cc88ff" />
        </div>

      </div>
    </div>
  );
}

export default function LongVideoWrapper() {
  return (
    <ToastProvider>
      <AuthWrapper>{({ user }) => <LongVideoPage user={user} />}</AuthWrapper>
    </ToastProvider>
  );
}

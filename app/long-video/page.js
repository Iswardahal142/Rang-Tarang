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
  if (n.includes('bird')) return 'bird';
  if (n.includes('vegetable') || n.includes('veggie') || n.includes('sabzi')) return 'vegetable';
  return 'general';
}

function getQuestion(type) {
  switch(type) {
    case 'number':    return 'यह कौनसा नंबर है?';
    case 'alphabet':  return 'यह कौनसा Alphabet है?';
    case 'color':     return 'कौनसा रंग है?';
    case 'shape':     return 'यह कौनसी आकृति है?';
    case 'fruit':     return 'यह कौनसा फल है?';
    case 'animal':    return 'यह कौनसा जानवर है?';
    case 'bird':      return 'यह कौनसा पक्षी है?';
    case 'vegetable': return 'यह कौनसी सब्ज़ी है?';
    default:          return 'यह क्या है?';
  }
}

// ── Prompt Builders ─────────────────────────────────────

function buildIntroVideoPrompt(topic) {
  return `Use reference scene exactly. 16:9 horizontal ratio.
Bold glowing text "${topic}" placed center screen. Teacher standing behind/below the title text.
Teacher raises both hands and pushes the title text upward — title slides up and off screen smoothly.
Teacher steps forward from behind, faces camera, smiles excitedly and waves.
Teacher says in Hindi: "Hello bacchon! Aaj hum sikhenge ${topic} — chalo shuru karte hain!"
No background music. 8 seconds. Smooth animation. No glitch. Hindi audio only.`;
}

function buildItemVideoPrompt(item, type, question, itemIndex = 0) {
  const isSymbol = type === 'number' || type === 'alphabet';
  const hasOwnLegs = type === 'animal' || type === 'bird';
  const prefix = itemIndex === 0 ? 'तो बताओ..' : 'अब बताओ..';
  const q = `${prefix} ${question}`;

  const entryDesc = isSymbol
    ? `Big bold 3D bright golden yellow "${item}" — exactly the character shape, no face, no eyes — only two small cute legs at bottom and two small arms on sides. Character walks out from behind the right side table, swinging arms naturally while walking. Teacher eyes follow the character from right side all the way to center. Character reaches center and stops with a small bounce effect. Teacher and character do a friendly handshake.`
    : hasOwnLegs
      ? `${item} walks in naturally from right side of screen on its own legs. Teacher eyes follow it all the way to center. ${item} reaches center and stops.`
      : `${item} — with two small cute legs at bottom and two small arms on sides — walks in from right side of screen with light glow trail. Teacher eyes follow it all the way to center. ${item} reaches center and stops with a small bounce effect. Teacher and ${item} do a friendly handshake.`;

  return `Use reference scene exactly. 16:9 horizontal ratio.
${entryDesc}
Teacher points to ${item} curiously. Teacher asks in Hindi: "${q}".
Bold rainbow gradient text "${q}" visible at very bottom center — red, orange, yellow, green, blue, violet colors. Pause 2 seconds.
Teacher softly touches the ${item}. Bottom text animates away and glowing bold rainbow text "यह ${item} है!" appears at same position. Answer text stays visible until the very last frame.
Teacher says in Hindi: "यह ${item} है! बहुत अच्छे!" Teacher smiles and gives thumbs up.
No "?" or question mark anywhere at any point in the video. No floating symbols above the object at any point. No background music.
8 seconds total. Smooth. No glitch. Pure Hindi Indian accent audio only.`;
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
  else if (type === 'bird')     leftObjects = `Large colorful 3D birds: ${items.slice(0,3).join(', ')} on left side`;
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
  { label: 'Birds',   topic: 'Birds',            type: 'bird',     range: '' },
  { label: 'Veggies', topic: 'Vegetables',       type: 'vegetable',range: '' },
  { label: 'Colors',  topic: 'Colors',           type: 'color',    range: '' },
  { label: 'Shapes',  topic: 'Shapes',           type: 'shape',    range: '' },
];

const PER_PAGE = 10;

function getAvailablePresets(list) {
  const topics = list.map(v => (v.topic || '').toLowerCase());
  const has10  = topics.some(t => t.includes('1 to 10'));
  const has50  = topics.some(t => t.includes('1 to 50'));
  const has100 = topics.some(t => t.includes('1 to 100'));

  return PRESETS.filter(p => {
    if (p.label === '1–10')  return !has10 && !has50 && !has100;
    if (p.label === '1–50')  return !has50 && !has100;
    if (p.label === '1–100') return !has100;
    return true;
  });
}

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
  const [ytVideos, setYtVideos]   = useState([]);
  const [ytChecking, setYtChecking] = useState(true);

  useEffect(() => { loadList(); fetchYT(); }, [user.uid]);

  async function loadList() {
    setLoading(true);
    try { setList(await getLongVideos(user.uid)); } catch { toast('❌ Load fail'); }
    setLoading(false);
  }

  async function fetchYT() {
    setYtChecking(true);
    try {
      const r = await fetch('/api/youtube');
      const d = await r.json();
      if (!d.error) setYtVideos(d.videos || []);
    } catch {}
    setYtChecking(false);
  }

  function checkUploaded(video) {
    if (ytChecking) return null;
    if (!ytVideos.length) return false;
    const matchStr = (video.ytTitle || video.topic || '').toLowerCase().trim();
    const matched = ytVideos.find(v => {
      const ytTitle = (v.title || '').toLowerCase().trim();
      return ytTitle === matchStr || ytTitle.startsWith(matchStr + ' ') || ytTitle.endsWith(' ' + matchStr) || ytTitle.includes(' ' + matchStr + ' ');
    });
    if (!matched) return false;
    if (matched.isScheduled) return 'scheduled';
    if (matched.privacyStatus === 'private') return 'private';
    return true;
  }

  async function createVideo() {
    const topic = selPreset ? selPreset.topic : customTopic.trim();
    const range = selPreset ? selPreset.range : customRange.trim();
    const type  = selPreset ? selPreset.type  : getSeriesType(customTopic);
    if (!topic) return toast('⚠️ Topic daalo!');

    if (type === 'number' && range) {
      const newNums = range.match(/\d+/g)?.map(Number);
      if (newNums && newNums.length >= 2) {
        const [newFrom, newTo] = newNums;
        const overlap = list.find(v => {
          if (v.type !== 'number') return false;
          const existNums = (v.range || '').match(/\d+/g)?.map(Number);
          if (!existNums || existNums.length < 2) return false;
          const [eFrom, eTo] = existNums;
          return newFrom >= eFrom && newTo <= eTo;
        });
        if (overlap) return toast(`⚠️ "${overlap.topic}" mein ye numbers already hain!`);
      }
    }

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
      await saveLongVideo(user.uid, { topic, range, type, items, ytTitle: '', ytDescription: '', doneSections: {}, isDone: false });
      toast(`✅ "${topic}" ready!`);
      setModal(false); setSelPreset(null); setCustom(''); setRange('');
      loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setCreating(false);
  }

  if (openVideo) {
    const uploadedStatus = checkUploaded(openVideo);
    return (
      <DetailView
        video={openVideo} user={user} toast={toast}
        isUploaded={uploadedStatus}
        ytChecking={ytChecking}
        onBack={() => setOpenVideo(null)}
        onDelete={async () => {
          if (uploadedStatus === true) return toast('⚠️ YouTube pe upload hai — delete nahi ho sakta!');
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
  }

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ffaa00', fontSize: 14, fontWeight: 700 }}>🎥 Long Video</span>
        <button onClick={() => setModal(true)} disabled={ytChecking}
          style={{ background: ytChecking ? '#554400' : '#ffaa00', border: 'none', color: ytChecking ? '#888' : '#000', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: ytChecking ? 'not-allowed' : 'pointer' }}>
          {ytChecking ? '🔄 Checking...' : '+ Naya'}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {modal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0d00', border: '1px solid #443300', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa00', marginBottom: 14, textAlign: 'center' }}>🎥 Naya Long Video</div>
              <div style={{ fontSize: 10, color: '#666', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>⚡ Quick Select</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {getAvailablePresets(list).map(p => (
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
        ) : list.map(v => {
          const uploaded = checkUploaded(v);
          return (
            <div key={v.id} onClick={() => setOpenVideo(v)}
              style={{ background: '#0f0f0f', border: '1px solid #2a2000', borderLeft: `3px solid ${v.isDone ? '#44bb66' : '#ffaa00'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}>
              <div style={{ padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 4 }}>🎥 {v.topic}</div>
                {v.range && <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>Range: {v.range}</div>}
                <div style={{ fontSize: 11, color: '#555' }}>{(v.items || []).length} items</div>
                {v.ytTitle && <div style={{ fontSize: 10, color: '#888', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📝 {v.ytTitle}</div>}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 20, textAlign: 'center',
                background: uploaded===true ? 'rgba(68,187,102,0.12)' : uploaded==='scheduled' ? 'rgba(68,136,255,0.12)' : uploaded==='private' ? 'rgba(204,136,255,0.12)' : uploaded===false ? 'rgba(255,68,0,0.1)' : '#1a1a1a',
                color: uploaded===true ? '#44bb66' : uploaded==='scheduled' ? '#4488ff' : uploaded==='private' ? '#cc88ff' : uploaded===false ? '#ff8866' : '#555',
                border: `1px solid ${uploaded===true ? 'rgba(68,187,102,0.3)' : uploaded==='scheduled' ? 'rgba(68,136,255,0.3)' : uploaded==='private' ? 'rgba(204,136,255,0.3)' : uploaded===false ? 'rgba(255,68,0,0.2)' : '#222'}` }}>
                {uploaded===true ? '✅ YouTube pe hai' : uploaded==='scheduled' ? '📅 Scheduled hai' : uploaded==='private' ? '🔒 Private hai' : uploaded===false ? '⏳ Upload baaki' : '🔄 Checking...'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── DETAIL VIEW ─────────────────────────────────────────
function DetailView({ video, user, toast, onBack, onDelete, onUpdate, isUploaded, ytChecking }) {
  const [page, setPage]               = useState(0);
  const [copiedKey, setCopied]        = useState('');
  const [genTD, setGenTD]             = useState(false);
  const [ytTitle, setYtTitle]         = useState(video.ytTitle || '');
  const [ytDesc, setYtDesc]           = useState(video.ytDescription || '');
  const [openSection, setOpenSection] = useState(null);
  const [doneSections, setDoneSections] = useState(video.doneSections || {});
  const [isDone, setIsDone]           = useState(video.isDone || false);

  const type     = video.type || getSeriesType(video.topic);
  const question = getQuestion(type);
  const items    = video.items || [];
  const totalPages = Math.ceil(items.length / PER_PAGE);
  const pageItems  = items.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(''), 2000); toast('📋 Copied!');
    });
  }

  function PromptBox({ label, text, pkey, color }) {
    return (
      <div>
        <div style={{ fontSize: 9, color: color || '#ffaa00', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{label}</div>
        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 44px 12px 12px', fontSize: 12, lineHeight: 1.7, color: '#bbb', position: 'relative', whiteSpace: 'pre-wrap' }}>
          {text}
          <button onClick={() => copy(pkey, text)}
            style={{ position: 'absolute', top: 8, right: 8, background: copiedKey === pkey ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === pkey ? '#44bb66' : '#333'}`, color: copiedKey === pkey ? '#fff' : '#666', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
            {copiedKey === pkey ? '✅' : '📋'}
          </button>
        </div>
      </div>
    );
  }

  function SectionCard({ skey, title, color, done, children }) {
    const isOpen = openSection === skey;
    return (
      <div style={{ background: '#0f0f0f', border: `1px solid ${done ? '#1a3a1a' : '#1e1e1e'}`, borderRadius: 12, overflow: 'hidden' }}>
        <div onClick={() => setOpenSection(isOpen ? null : skey)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: done ? '#44bb66' : color }}>{title}</span>
            {done && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
          </div>
          <span style={{ fontSize: 13, color: '#444' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
        {isOpen && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {children}
          </div>
        )}
      </div>
    );
  }

  async function markSectionDone(key) {
    const updated = { ...doneSections, [key]: true };
    setDoneSections(updated);
    await updateLongVideo(user.uid, video.id, { doneSections: updated });
    toast('✅ Done!');
  }

  async function markAllDone() {
    setIsDone(true);
    await updateLongVideo(user.uid, video.id, { isDone: true });
    onUpdate({ ...video, isDone: true });
    toast('🎉 Video complete!');
  }

  async function generateTitleDesc() {
    setGenTD(true);
    try {
      const text = await aiCall([{ role: 'user', content: `YouTube SEO expert for Hindi kids channel "Rang Tarang".
Generate title and description for: "${video.topic}"
- Title: Catchy Hindi+English, under 70 chars, end with "| Rang Tarang". Add exactly 5 viral topic-related hashtags at the end.
- Description: 3-4 lines, fun, what kids learn, includes "Rang Tarang", ends with subscribe line. Add exactly 10 viral topic-related hashtags on a new line after description.
Return ONLY JSON: {"title":"...","description":"..."}` }]);
      const p = JSON.parse(text.replace(/```json|```/g, '').trim());
      setYtTitle(p.title); setYtDesc(p.description);
      await updateLongVideo(user.uid, video.id, { ytTitle: p.title, ytDescription: p.description });
      onUpdate({ ...video, ytTitle: p.title, ytDescription: p.description });
      toast('✅ Ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  const isLastPage = page >= totalPages - 1;

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#ffaa00', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
        <span style={{ fontSize: 12, color: '#888', fontWeight: 700 }}>🎥 {video.topic}</span>
        <button onClick={onDelete} disabled={ytChecking || isUploaded === true}
          title={isUploaded === true ? 'YouTube pe upload hai' : ytChecking ? 'Checking...' : 'Delete'}
          style={{ background: 'none', border: 'none', color: (ytChecking || isUploaded === true) ? '#333' : '#555', fontSize: 18, cursor: (ytChecking || isUploaded === true) ? 'not-allowed' : 'pointer', opacity: (ytChecking || isUploaded === true) ? 0.4 : 1 }}>🗑</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 160, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── YOUTUBE CARD ── */}
        <SectionCard skey="yt" title="📺 YouTube Card" color={ytTitle ? '#44bb66' : '#ffaa44'} done={!!ytTitle}>
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
        </SectionCard>

        {/* ── THUMBNAIL ── */}
        <SectionCard skey="thumb" title="🖼 Thumbnail Prompt" color="#ff8844" done={!!doneSections['thumb']}>
          <PromptBox label="🖼 THUMBNAIL PROMPT (16:9)" text={buildThumbnailPrompt(video.topic, type, items)} pkey="thumb_img" color="#ff8844" />
          <button onClick={() => markSectionDone('thumb')} disabled={!!doneSections['thumb']}
            style={{ background: doneSections['thumb'] ? 'rgba(68,187,102,0.12)' : '#0a1a0a', border: `1px solid ${doneSections['thumb'] ? 'rgba(68,187,102,0.4)' : '#224422'}`, color: doneSections['thumb'] ? '#44bb66' : '#44aa44', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: doneSections['thumb'] ? 'not-allowed' : 'pointer', width: '100%' }}>
            {doneSections['thumb'] ? '✅ Done ho gaya!' : '✔ Mark as Done'}
          </button>
        </SectionCard>

        {/* ── INTRO ── */}
        <SectionCard skey="intro" title="🎬 Intro" color="#4488ff" done={!!doneSections['intro']}>
          <PromptBox label="🎬 VIDEO PROMPT" text={buildIntroVideoPrompt(video.topic)} pkey="intro_vid" color="#cc88ff" />
          <button onClick={() => markSectionDone('intro')} disabled={!!doneSections['intro']}
            style={{ background: doneSections['intro'] ? 'rgba(68,187,102,0.12)' : '#0a1a0a', border: `1px solid ${doneSections['intro'] ? 'rgba(68,187,102,0.4)' : '#224422'}`, color: doneSections['intro'] ? '#44bb66' : '#44aa44', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: doneSections['intro'] ? 'not-allowed' : 'pointer', width: '100%' }}>
            {doneSections['intro'] ? '✅ Done ho gaya!' : '✔ Mark as Done'}
          </button>
        </SectionCard>

        {/* ── ITEMS ── */}
        <div style={{ fontSize: 11, color: '#555', textAlign: 'center', fontWeight: 700 }}>
          📋 Items {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, items.length)} / {items.length}
        </div>

        {pageItems.map((item, i) => {
          const gi = page * PER_PAGE + i;
          const skey = `item_${gi}`;
          return (
            <SectionCard key={gi} skey={skey} title={`${gi + 1}. ${item}`} color="#ffaa00" done={!!doneSections[skey]}>
              <PromptBox label="🎬 VIDEO PROMPT" text={buildItemVideoPrompt(item, type, question, gi)} pkey={`vid_${gi}`} color="#cc88ff" />
              <button onClick={() => markSectionDone(skey)} disabled={!!doneSections[skey]}
                style={{ background: doneSections[skey] ? 'rgba(68,187,102,0.12)' : '#0a1a0a', border: `1px solid ${doneSections[skey] ? 'rgba(68,187,102,0.4)' : '#224422'}`, color: doneSections[skey] ? '#44bb66' : '#44aa44', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: doneSections[skey] ? 'not-allowed' : 'pointer', width: '100%' }}>
                {doneSections[skey] ? '✅ Done ho gaya!' : '✔ Mark as Done'}
              </button>
            </SectionCard>
          );
        })}

        {/* ── OUTRO — only on last page ── */}
        {isLastPage && (
          <SectionCard skey="outro" title="🎤 Outro" color="#cc88ff" done={!!doneSections['outro']}>
            <PromptBox label="🎬 VIDEO PROMPT" text={buildOutroVideoPrompt()} pkey="outro_vid" color="#cc88ff" />
            <button onClick={() => markSectionDone('outro')} disabled={!!doneSections['outro']}
              style={{ background: doneSections['outro'] ? 'rgba(68,187,102,0.12)' : '#0a1a0a', border: `1px solid ${doneSections['outro'] ? 'rgba(68,187,102,0.4)' : '#224422'}`, color: doneSections['outro'] ? '#44bb66' : '#44aa44', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: doneSections['outro'] ? 'not-allowed' : 'pointer', width: '100%' }}>
              {doneSections['outro'] ? '✅ Done ho gaya!' : '✔ Mark as Done'}
            </button>
            <button onClick={markAllDone} disabled={isDone}
              style={{ background: isDone ? 'rgba(68,187,102,0.08)' : 'linear-gradient(135deg,#1a3a1a,#0a2a0a)', border: `1px solid ${isDone ? 'rgba(68,187,102,0.3)' : '#33aa33'}`, color: isDone ? '#44bb66' : '#55dd55', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 800, cursor: isDone ? 'not-allowed' : 'pointer', width: '100%', marginTop: 4 }}>
              {isDone ? '🎉 Video Complete!' : '🏁 Poori Video Mark as Done'}
            </button>
          </SectionCard>
        )}

      </div>

      {/* ── FIXED BOTTOM NAV ── */}
      <div style={{ position: 'fixed', bottom: 70, left: 0, right: 0, background: 'rgba(0,0,0,0.97)', borderTop: '1px solid #333', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, zIndex: 200 }}>
        <button onClick={() => { setPage(p => Math.max(0, p - 1)); setOpenSection(null); }} disabled={page === 0}
          style={{ flex: 1, background: page === 0 ? '#111' : '#1a1a00', border: `1px solid ${page === 0 ? '#222' : '#443300'}`, color: page === 0 ? '#333' : '#ffaa00', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: page === 0 ? 'not-allowed' : 'pointer' }}>
          ← Prev
        </button>
        <span style={{ fontSize: 11, color: '#555', fontWeight: 700, minWidth: 60, textAlign: 'center' }}>
          {page + 1} / {totalPages}
        </span>
        <button onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); setOpenSection(null); }} disabled={isLastPage}
          style={{ flex: 1, background: isLastPage ? '#111' : '#1a1a00', border: `1px solid ${isLastPage ? '#222' : '#443300'}`, color: isLastPage ? '#333' : '#ffaa00', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: isLastPage ? 'not-allowed' : 'pointer' }}>
          Next →
        </button>
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

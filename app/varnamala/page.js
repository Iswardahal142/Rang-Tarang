// 📁 LOCATION: app/varnamala/page.js
'use client';

import { useState, useEffect } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import { ToastProvider, useToast } from '../../components/Toast';
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
async function getSeries(uid) {
  const db = getDB();
  const snap = await getDocs(query(collection(db, 'users', uid, 'rt_varnamala'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveSeries(uid, data) {
  return addDoc(collection(getDB(), 'users', uid, 'rt_varnamala'), { ...data, createdAt: serverTimestamp() });
}
async function updateSeries(uid, id, data) {
  await updateDoc(doc(getDB(), 'users', uid, 'rt_varnamala', id), data);
}
async function deleteSeries(uid, id) {
  await deleteDoc(doc(getDB(), 'users', uid, 'rt_varnamala', id));
}

// ── Types ──
const SERIES_TYPES = {
  varnamala: { label: 'वर्णमाला',           emoji: '🔤', color: '#4488ff', desc: 'अ आ इ ई — Letters sikhao' },
  asei:      { label: 'अ से अनार',          emoji: '🍎', color: '#ff4488', desc: 'अ से अनार, आ से आम' },
  shabd:     { label: 'शब्द बनाओ',          emoji: '✏️', color: '#44bb66', desc: 'माँ, पा, दा — Words banao' },
  matra:     { label: 'मात्राएं',            emoji: '🔡', color: '#ffaa44', desc: 'का, की, कु — Matra sikhao' },
  do_akshar: { label: 'दो अक्षर वाले शब्द', emoji: '📖', color: '#cc88ff', desc: 'घर, मन, नल — Padhna seekho' },
};

function hasNextPart(series, allSeries) {
  const baseName = series.name.replace(/ Part \d+$/, '').trim();
  const currentPart = series.part || 1;
  return allSeries.some(s => {
    const sBase = s.name.replace(/ Part \d+$/, '').trim();
    return sBase === baseName && (s.part || 1) === currentPart + 1;
  });
}

// ── Schedule helpers ──
function getTimeForDay(day) {
  if (day === 6) return { h: 13, m: 0 };
  if (day === 0) return { h: 10, m: 0 };
  return { h: 15, m: 0 };
}
function getOccupiedDates(ytVideos) {
  const occupied = new Set();
  ytVideos.forEach(v => {
    const d = v.scheduledAt || v.publishedAt;
    if (d) { const date = new Date(d); occupied.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`); }
  });
  return occupied;
}
function findNextFreeSlot(ytVideos) {
  const occupied = getOccupiedDates(ytVideos);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i <= 60; i++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() + i);
    const key = `${candidate.getFullYear()}-${candidate.getMonth()}-${candidate.getDate()}`;
    if (!occupied.has(key)) {
      const { h, m } = getTimeForDay(candidate.getDay());
      candidate.setHours(h, m, 0, 0);
      return candidate;
    }
  }
  return null;
}
function formatSlotDisplay(date) {
  if (!date) return '';
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = date.getHours(); const min = date.getMinutes().toString().padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()} — ${h}:${min} ${ampm}`;
}
function formatScheduledTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = date.getHours(); const min = date.getMinutes().toString().padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} • ${h}:${min} ${ampm}`;
}

// ══════════════════════════════════════════════════════
// PROMPT BUILDERS
// ══════════════════════════════════════════════════════

// 1. वर्णमाला
function buildVarnamalaImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center-left, smiling excitedly, pointing toward a giant bold colorful 3D letter "${item.letter}" floating at center-right. Letter is huge, glossy, rainbow colored with sparkles around it. 9:16 vertical. Pixar style. No other text. No "?" anywhere. Ultra high quality. Cinematic lighting.`;
}
function buildVarnamalaVideoPrompt(item, isFirst = true) {
  const q = isFirst ? 'तो बताओ.. यह कौनसा अक्षर है?' : 'अब बताओ.. यह कौनसा अक्षर है?';
  return `Use reference image exactly as background scene. Teacher standing left, pointing to giant 3D letter "${item.letter}" floating center-right. Letter bobs gently up and down. Teacher asks in Hindi: "${q}". Bold rainbow gradient text "यह कौनसा अक्षर है?" at very bottom center. Pause 2 seconds. Bottom text animates away and glowing bold rainbow text "${item.letter}" appears with sparkle animation — only the letter, nothing else. Answer stays visible until last frame. Teacher says in Hindi: "यह ${item.letter} है! चलो साथ में बोलो — ${item.letter}! बहुत अच्छे!" Teacher smiles and gives thumbs up. No "?" anywhere. No background music. 8 seconds. Smooth. Hindi audio only. Teacher lip sync.`;
}

// 2. अ से अनार
function buildAseiImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center-left, smiling excitedly. On the right side: giant bold colorful 3D letter "${item.letter}" at top-right with an arrow pointing down to a big Pixar 3D cartoon ${item.word} (${item.object}) below it. Both letter and object clearly visible and large. 9:16 vertical. Pixar style. No other text. No "?" anywhere. Ultra high quality. Cinematic lighting.`;
}
function buildAseiVideoPrompt(item, isFirst = true) {
  const q = isFirst ? 'तो बताओ.. ${item.letter} से क्या?' : 'अब बताओ.. ${item.letter} से क्या?';
  return `Use reference image exactly as background scene. Teacher standing left. Giant 3D letter "${item.letter}" at top-right with Pixar 3D ${item.word} (${item.object}) below it. Teacher points to letter then to ${item.word} and asks in Hindi: "${item.letter} से क्या?" Bold rainbow text "${item.letter} से क्या?" at bottom center. Pause 2 seconds. Text animates away and glowing bold "${item.letter} से ${item.word}!" appears — only this text. Teacher says: "${item.letter} से ${item.word}! चलो बोलो — ${item.word}! बहुत अच्छे!" Thumbs up. 8 seconds. Smooth. Hindi audio. Teacher lip sync. No "?" anywhere.`;
}

// 3. शब्द बनाओ
function buildShabdImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center-left, smiling excitedly, pointing toward right side. On right side: individual colorful 3D letters "${item.letters.join(' + ')}" floating separately, then combining together with sparkles to form the word "${item.word}" in big bold colorful 3D text. 9:16 vertical. Pixar style. No other text. Ultra high quality. Cinematic lighting.`;
}
function buildShabdVideoPrompt(item, isFirst = true) {
  const q = isFirst ? 'तो बताओ.. यह शब्द क्या है?' : 'अब बताओ.. यह शब्द क्या है?';
  return `Use reference image exactly as background scene. Teacher standing left. Individual letters "${item.letters.join(', ')}" floating on right, then combining with sparkle animation to form "${item.word}". Teacher points excitedly and asks: "${q}". Bold rainbow text "यह शब्द क्या है?" at bottom. Pause 2 seconds. Text changes to glowing "${item.word}" — only the word. Teacher says: "यह ${item.word} है! चलो बोलो — ${item.word}! बहुत अच्छे!" Thumbs up. 10 seconds. Smooth. Hindi audio. Teacher lip sync.`;
}

// 4. मात्राएं
function buildMatraImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center-left, smiling, pointing toward right side. On right: giant colorful 3D letter "${item.base_letter}" and matra symbol "${item.matra}" combining together with sparkles to form "${item.result}" in big bold colorful 3D text. Result word "${item.example}" shown below in Pixar 3D cartoon style. 9:16 vertical. Pixar style. No other text. Ultra high quality.`;
}
function buildMatraVideoPrompt(item, isFirst = true) {
  const q = isFirst ? 'तो बताओ.. यह क्या बनता है?' : 'अब बताओ.. यह क्या बनता है?';
  return `Use reference image exactly as background scene. Teacher standing left. Letter "${item.base_letter}" and matra "${item.matra}" shown separately then combining with sparkle animation to form "${item.result}". Pixar 3D ${item.example} appears below. Teacher asks: "${q}". Bold rainbow text "यह क्या बनता है?" at bottom. Pause 2 seconds. Text changes to glowing "${item.result} — ${item.example}" — only this. Teacher says: "${item.base_letter} पर ${item.matra_name} लगाने से ${item.result} बनता है! जैसे — ${item.example}! बहुत अच्छे!" 10 seconds. Smooth. Hindi audio. Teacher lip sync.`;
}

// 5. दो अक्षर वाले शब्द
function buildDoAksharImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center-left, smiling excitedly, pointing toward right. On right: big bold colorful 3D word "${item.word}" with a Pixar 3D cartoon ${item.meaning} (${item.object}) below it. Both word and object clearly visible. 9:16 vertical. Pixar style. No other text. Ultra high quality. Cinematic lighting.`;
}
function buildDoAksharVideoPrompt(item, isFirst = true) {
  const q = isFirst ? 'तो बताओ.. यह शब्द पढ़ो!' : 'अब बताओ.. यह शब्द पढ़ो!';
  return `Use reference image exactly as background scene. Teacher standing left. Big bold 3D word "${item.word}" on right with Pixar 3D ${item.meaning} (${item.object}) below. Teacher points to word and says: "${q}". Bold rainbow text "यह शब्द पढ़ो!" at bottom. Pause 2 seconds. Text changes to glowing "${item.word}" — only the word. Teacher says: "${item.word}! यह ${item.word} है! चलो साथ में पढ़ो — ${item.word}! शाबाश!" Thumbs up. 8 seconds. Smooth. Hindi audio. Teacher lip sync.`;
}

// ── Intro / Outro ──
function buildIntroImagePrompt(seriesName, type, items = []) {
  const typeInfo = SERIES_TYPES[type] || SERIES_TYPES.varnamala;
  const first3 = items.slice(0, 3).map(i => i.letter || i.word || i.name || '').join(', ');
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, waving hand excitedly. Bold glowing text "${seriesName}" floating center with colorful sparkles. Show related colorful 3D elements at bottom: ${first3 || 'colorful Hindi letters'}. 9:16 vertical. Pixar style. No other text. Ultra high quality. Cinematic lighting.`;
}

function buildIntroVideoPrompt(seriesName, part = 1) {
  const partMention = part > 1 ? ` — भाग ${part}` : '';
  return `Use reference image exactly as background scene. Teacher standing center, smiling, waving at camera. Teacher grabs title text "${seriesName}" and slides it off screen. Teacher says in Hindi: "हेल्लो बच्चों! आज हम सीखेंगे ${seriesName}${partMention} — चलो शुरू करते हैं!" 8 seconds. Smooth. Hindi audio. Teacher lip sync.`;
}

function buildOutroVideoPrompt() {
  return `Use reference image exactly as background scene. Any text fades away. Teacher standing center, waves goodbye with big smile and says in Hindi: "तो बच्चों, आज के लिए बस इतना ही — मिलते हैं अगले video में, टाटा!" 8 seconds. Smooth. Hindi audio. Teacher lip sync.`;
}

async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 800, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

// ── TitleDescSection ──
function TitleDescSection({ series, genTD, onGenerate, onSave, onCopy, copiedKey, isUploaded, matchedVideoId, matchedCategoryId }) {
  const toast = useToast();
  const hasTitleDesc = !!(series.ytTitle && series.ytDescription);
  const [title, setTitle] = useState(series.ytTitle || '');
  const [desc, setDesc]   = useState(series.ytDescription || '');
  const [tags, setTags]   = useState(series.ytTags || '');
  const [openField, setOpenField] = useState(null);
  const [regenLoading, setRegenLoading] = useState(null);
  const [savingField, setSavingField] = useState(null);
  const [savedField, setSavedField]   = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTitle(series.ytTitle || '');
    setDesc(series.ytDescription || '');
    setTags(series.ytTags || '');
  }, [series.ytTitle, series.ytDescription, series.ytTags]);

  async function regenField(field) {
    setRegenLoading(field);
    try {
      const baseName = series.name.replace(/ Part \d+$/, '').trim();
      const partText = (series.part || 1) > 1 ? ` भाग ${series.part}` : '';
      let prompt = '';
      if (field === 'title') prompt = `Generate YouTube title for Hindi kids series "${baseName}${partText}". Pattern: "${baseName}${partText} | Rang Tarang". Max 60 chars. NO emoji. Return ONLY title.`;
      else if (field === 'desc') prompt = `Generate YouTube description for Hindi kids series "${baseName}${partText}". Hook in Hindi, content list, subscribe https://youtube.com/@RangTarangHindi, hashtags. Return ONLY description.`;
      else prompt = `Generate 15 YouTube tags for Hindi kids series "${baseName}${partText}". Comma separated, Hindi+English mix. Return ONLY tags.`;
      const res = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 400, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }) });
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || '').trim();
      if (field === 'title') setTitle(text);
      else if (field === 'desc') setDesc(text);
      else setTags(text);
      toast(`🔄 Regenerated!`);
    } catch (e) { toast('❌ ' + e.message); }
    setRegenLoading(null);
  }

  async function ytUpdateField(field) {
    if (!matchedVideoId) { toast('❌ Video nahi mila'); return; }
    setSavingField(field);
    try {
      const res = await fetch('/api/audit', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId: matchedVideoId, categoryId: matchedCategoryId || '22', title, description: desc, tags }) });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Update fail');
      onSave(title, desc, tags);
      setSavedField(field); setTimeout(() => setSavedField(null), 2500);
      toast(`✅ YouTube pe update ho gaya!`);
    } catch (e) { toast('❌ ' + e.message); }
    setSavingField(null);
  }

  const fieldDefs = [
    { key: 'title', label: '📌 Title',       color: '#ff8800', value: title, setter: setTitle, orig: series.ytTitle || '' },
    { key: 'desc',  label: '📄 Description', color: '#4488ff', value: desc,  setter: setDesc,  orig: series.ytDescription || '' },
    { key: 'tags',  label: '🏷️ Tags',        color: '#44bb66', value: tags,  setter: setTags,  orig: series.ytTags || '' },
  ];

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${hasTitleDesc ? '#1a3a2a' : '#2a1a00'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: hasTitleDesc ? '#44bb66' : '#ffaa44' }}>📝 Title & Description</span>
          {hasTitleDesc && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
          {isUploaded && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.1)', color: '#44bb66', border: '1px solid #1a3a1a', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>🔗</span>}
        </div>
        <span style={{ fontSize: 13, color: '#444' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ marginTop: 10, background: isUploaded ? 'rgba(68,136,255,0.07)' : 'rgba(255,170,0,0.06)', border: `1px solid ${isUploaded ? '#223355' : '#2a2000'}`, borderRadius: 10, padding: '8px 12px', fontSize: 10, color: isUploaded ? '#4466aa' : '#aa7700' }}>
            {isUploaded ? '🔗 Linked — Update dabao seedha YouTube pe jayega.' : '📋 Upload nahi hua — Copy karo → YouTube pe paste karo.'}
          </div>
          <button onClick={onGenerate} disabled={genTD}
            style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '10px', fontSize: 11, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {genTD ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#ffaa44' }} />Generating...</> : '🤖 Generate All (Title + Desc + Tags)'}
          </button>
          {fieldDefs.map(({ key, label, color, value, setter, orig }) => {
            const isFieldOpen = openField === key;
            const dirty = value !== orig;
            const isSaving = savingField === key;
            const isSaved  = savedField  === key;
            const copyKey  = `td_${key}`;
            return (
              <div key={key} style={{ background: '#0a0a0a', border: `1px solid ${dirty ? color + '44' : '#1e1e1e'}`, borderRadius: 10, overflow: 'hidden' }}>
                <div onClick={() => setOpenField(isFieldOpen ? null : key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 10, color, fontWeight: 700 }}>{label}</span>
                    {isSaved && <span style={{ fontSize: 9, color: '#44bb66', fontWeight: 700 }}>✅ Updated</span>}
                    {dirty && !isSaved && <span style={{ fontSize: 9, color: '#ffaa44' }}>●</span>}
                  </div>
                  <span style={{ fontSize: 11, color: '#333' }}>{isFieldOpen ? '▲' : '▼'}</span>
                </div>
                {isFieldOpen && (
                  <div style={{ padding: '0 12px 12px', borderTop: '1px solid #111', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {key === 'title' ? (
                      <input value={value} onChange={e => setter(e.target.value)}
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${dirty ? color+'66' : '#222'}`, color: '#eee', fontSize: 12, outline: 'none', padding: '8px 0', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    ) : (
                      <textarea value={value} onChange={e => setter(e.target.value)} rows={key === 'tags' ? 3 : 5}
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${dirty ? color+'66' : '#222'}`, color: '#eee', fontSize: 12, outline: 'none', padding: '8px 0', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => regenField(key)} disabled={regenLoading === key}
                        style={{ background: regenLoading === key ? '#111' : '#0a0a1a', border: `1px solid ${regenLoading === key ? '#333' : color + '55'}`, color: regenLoading === key ? '#444' : color, borderRadius: 8, padding: '8px 10px', fontSize: 13, cursor: regenLoading === key ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {regenLoading === key ? <div className="spinner" style={{ width: 11, height: 11, borderTopColor: color }} /> : '🔄'}
                      </button>
                      <button onClick={() => { navigator.clipboard.writeText(value); onCopy(copyKey, value); }}
                        style={{ flex: 1, background: copiedKey === copyKey ? 'rgba(68,187,102,0.15)' : '#111', border: `1px solid ${copiedKey === copyKey ? '#44bb66' : '#333'}`, color: copiedKey === copyKey ? '#44bb66' : '#666', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {copiedKey === copyKey ? '✅ Copied!' : '📋 Copy'}
                      </button>
                      {isUploaded ? (
                        <button onClick={() => ytUpdateField(key)} disabled={isSaving || !dirty}
                          style={{ flex: 1, background: isSaving ? '#111' : dirty ? 'linear-gradient(135deg,#0a1a44,#05102a)' : '#111', border: `1px solid ${dirty ? '#4488ff' : '#222'}`, color: isSaving ? '#555' : dirty ? '#4488ff' : '#333', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: isSaving || !dirty ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {isSaving ? <><div className="spinner" style={{ width: 11, height: 11, borderTopColor: '#4488ff' }} />...</> : dirty ? '🚀 Update' : '✓ Saved'}
                        </button>
                      ) : (
                        <button onClick={() => { onSave(title, desc, tags); toast('💾 Saved!'); }}
                          style={{ flex: 1, background: '#0a1a0a', border: '1px solid #224422', color: '#44bb66', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          💾 Save
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
function VarnamalaPage({ user }) {
  const toast = useToast();
  const [seriesList, setSeriesList]     = useState([]);
  const [loadingList, setLoadingList]   = useState(true);
  const [openType, setOpenType]         = useState(null);
  const [openSeries, setOpenSeries]     = useState(null);
  const [openSection, setOpenSection]   = useState(null);
  const [copiedKey, setCopiedKey]       = useState('');
  const [ytVideos, setYtVideos]         = useState([]);
  const [continuing, setContinuing]     = useState(null);
  const [genTD, setGenTD]               = useState(false);
  const [modal, setModal]               = useState('none');
  const [selectedType, setSelectedType] = useState('varnamala');
  const [generating, setGenerating]     = useState(false);
  const [ytLoading, setYtLoading]       = useState(true);
  const [scheduleSlot, setScheduleSlot] = useState(null);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [scheduleCopied, setScheduleCopied] = useState(false);
  const [playlistStatus, setPlaylistStatus] = useState({});
  const [seriesNote, setSeriesNote]     = useState('');
  const [customName, setCustomName]     = useState('');

  useEffect(() => { loadList(); fetchYT(); }, [user.uid]);

  async function loadList() {
    setLoadingList(true);
    try { setSeriesList(await getSeries(user.uid)); } catch { toast('❌ Load fail'); }
    setLoadingList(false);
  }

  async function fetchYT() {
    setYtLoading(true);
    try {
      const r = await fetch('/api/youtube');
      const d = await r.json();
      if (!d.error) { const vids = d.videos || []; setYtVideos(vids); setScheduleSlot(findNextFreeSlot(vids)); }
    } catch {}
    setYtLoading(false);
  }

  function checkUploaded(series) {
    if (!ytVideos.length) return null;
    const matchStr = (series.ytTitle || series.name || '').trim().toLowerCase();
    if (!matchStr || matchStr.length < 3) return null;
    const matched = ytVideos.find(v => {
      const ytTitle = (v.title || '').toLowerCase();
      return ytTitle.includes(matchStr) || matchStr.includes(ytTitle.slice(0, 20));
    });
    if (!matched) return false;
    if (matched.isScheduled) return { status: 'scheduled', scheduledAt: matched.scheduledAt };
    if (matched.privacyStatus === 'private') return 'private';
    return true;
  }

  function getMatchedVideo(series) {
    if (!ytVideos.length) return null;
    const matchStr = (series.ytTitle || series.name || '').trim().toLowerCase();
    if (!matchStr || matchStr.length < 3) return null;
    return ytVideos.find(v => {
      const ytTitle = (v.title || '').toLowerCase();
      return ytTitle.includes(matchStr) || matchStr.includes(ytTitle.slice(0, 20));
    }) || null;
  }

  function isDeleteDisabled(series) {
    const u = checkUploaded(series);
    if (u === true || u === 'private') return true;
    if (u && typeof u === 'object' && u.status === 'scheduled') return true;
    return false;
  }

  // ── Generate Series ──
  async function generateSeries() {
    setGenerating(true);
    try {
      
      const existing = seriesList.filter(s => s.type === selectedType).map(s => s.name).join(', ') || 'none';
      const noteLine = seriesNote.trim() ? `\nNote: ${seriesNote.trim()}` : '';
      let items = [];
      let seriesName = '';

      if (selectedType === 'varnamala') {
        // Auto detect next set of letters
        const allDone = seriesList.filter(s => s.type === 'varnamala').flatMap(s => (s.items || []).map(i => i.letter));
        const allLetters = ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','क','ख','ग','घ','च','छ','ज','झ','ट','ठ','ड','ढ','त','थ','द','ध','न','प','फ','ब','भ','म','य','र','ल','व','श','ष','स','ह'];
        const remaining = allLetters.filter(l => !allDone.includes(l));
        const next5 = remaining.slice(0, 5);
        if (next5.length === 0) { toast('✅ Saari varnamala ho gayi!'); setGenerating(false); return; }
        seriesName = customName.trim() || `वर्णमाला — ${next5[0]} से ${next5[next5.length-1]}`;
        items = next5.map(letter => ({ letter, name: letter }));

      } else if (selectedType === 'asei') {
        const text = await aiCall(`Generate 5 unique Hindi letter-word pairs for kids series "अ से अनार".${noteLine}
Already done: ${existing}
Return ONLY JSON array:
[{"letter":"अ","word":"अनार","object":"bright red pomegranate with seeds visible"}]
RULES: Each letter different. Common easy words kids know. "object" = English description max 6 words.`);
        items = JSON.parse(text.replace(/```json|```/g, '').trim());
        seriesName = customName.trim() || `अ से अनार — ${items.map(i=>i.letter).join(' ')}`;

      } else if (selectedType === 'shabd') {
        const text = await aiCall(`Generate 5 unique simple Hindi words (2-3 letters) for kids "शब्द बनाओ" series.${noteLine}
Already done: ${existing}
Return ONLY JSON array:
[{"word":"माँ","letters":["म","ा"],"meaning":"mother","object":"loving Indian mother cartoon"}]
RULES: Very simple common words. "letters" = individual letters/matras. "object" = English desc 6 words.`);
        items = JSON.parse(text.replace(/```json|```/g, '').trim());
        seriesName = customName.trim() || `शब्द बनाओ — ${items.map(i=>i.word).join(', ')}`;

      } else if (selectedType === 'matra') {
        const text = await aiCall(`Generate 5 unique Hindi matra examples for kids "मात्राएं" series.${noteLine}
Already done: ${existing}
Return ONLY JSON array:
[{"base_letter":"क","matra":"ा","matra_name":"आ की मात्रा","result":"का","example":"काम"}]
RULES: Common matras. Simple easy examples. One matra per item.`);
        items = JSON.parse(text.replace(/```json|```/g, '').trim());
        seriesName = customName.trim() || `मात्राएं — ${items.map(i=>i.matra_name).join(', ')}`;

      } else if (selectedType === 'do_akshar') {
        const text = await aiCall(`Generate 5 unique simple 2-letter Hindi words for kids "दो अक्षर वाले शब्द" series.${noteLine}
Already done: ${existing}
Return ONLY JSON array:
[{"word":"घर","meaning":"house","object":"cute colorful cartoon house"}]
RULES: Very simple 2-letter words only. Common words kids know. "object" = English desc 6 words.`);
        items = JSON.parse(text.replace(/```json|```/g, '').trim());
        seriesName = customName.trim() || `दो अक्षर — ${items.map(i=>i.word).join(', ')}`;
      }

      Object.entries(SERIES_TYPES).map(([key, info]) => {
  const typeSeries = seriesList.filter(s => s.type === key);
  if (typeSeries.length === 0) return null; // ← YEH ADD KRO

        
      await saveSeries(user.uid, {
        name: seriesName, type: selectedType,
        emoji: typeInfo.emoji, color: typeInfo.color,
        items, doneSections: {}, doneCount: 0, progress: 0,
        part, ytTitle: '', ytDescription: '', ytTags: '',
        folderLabel: typeInfo.label, folderEmoji: typeInfo.emoji, folderColor: typeInfo.color,
      });

      toast(`${typeInfo.emoji} "${seriesName}" ready!`);
      setModal('none'); setSeriesNote(''); setCustomName(''); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function continueSeries(e, series) {
    e.stopPropagation();
    setContinuing(series.id);
    try {
      const done = (series.items || []).map(i => i.letter || i.word || i.name).join(', ');
      let newItems = [];

      if (series.type === 'varnamala') {
        const allDone = seriesList.filter(s => s.type === 'varnamala').flatMap(s => (s.items || []).map(i => i.letter));
        const allLetters = ['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ','क','ख','ग','घ','च','छ','ज','झ','ट','ठ','ड','ढ','त','थ','द','ध','न','प','फ','ब','भ','म','य','र','ल','व','श','ष','स','ह'];
        const remaining = allLetters.filter(l => !allDone.includes(l));
        const next5 = remaining.slice(0, 5);
        if (next5.length === 0) { toast('✅ Saari varnamala ho gayi!'); setContinuing(null); return; }
        newItems = next5.map(letter => ({ letter, name: letter }));
      } else if (series.type === 'asei') {
        const text = await aiCall(`5 MORE unique Hindi letter-word pairs. Already done: ${done}. Return ONLY JSON: [{"letter":"ब","word":"बकरी","object":"white fluffy cartoon goat"}]`);
        newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      } else if (series.type === 'shabd') {
        const text = await aiCall(`5 MORE unique simple Hindi words. Already done: ${done}. Return ONLY JSON: [{"word":"घर","letters":["घ","र"],"meaning":"house","object":"colorful cartoon house"}]`);
        newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      } else if (series.type === 'matra') {
        const text = await aiCall(`5 MORE unique Hindi matra examples. Already done: ${done}. Return ONLY JSON: [{"base_letter":"ग","matra":"ी","matra_name":"इ की मात्रा","result":"गी","example":"गीत"}]`);
        newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      } else if (series.type === 'do_akshar') {
        const text = await aiCall(`5 MORE unique 2-letter Hindi words. Already done: ${done}. Return ONLY JSON: [{"word":"नल","meaning":"tap","object":"silver water tap cartoon"}]`);
        newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      }

      const newPart = (series.part || 1) + 1;
      const baseName = series.name.replace(/ Part \d+$/, '').trim();
      const typeInfo = SERIES_TYPES[series.type];
      const newName = series.type === 'varnamala'
        ? `वर्णमाला — ${newItems[0]?.letter} से ${newItems[newItems.length-1]?.letter}`
        : `${baseName} Part ${newPart}`;

      await saveSeries(user.uid, {
        name: newName, type: series.type,
        emoji: series.emoji, color: series.color,
        items: newItems, doneSections: {}, doneCount: 0, progress: 0,
        part: newPart, ytTitle: '', ytDescription: '', ytTags: '',
        folderLabel: series.folderLabel, folderEmoji: series.folderEmoji, folderColor: series.folderColor,
      });
      toast(`🎉 Next part ready!`); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setContinuing(null);
  }

  async function markDone(series, key, wasDone) {
    const doneSections = { ...(series.doneSections || {}) };
    if (wasDone) delete doneSections[key]; else doneSections[key] = true;
    const total = (series.items || []).length + 2;
    const doneCount = Object.keys(doneSections).length;
    const progress = Math.round((doneCount / total) * 100);
    await updateSeries(user.uid, series.id, { doneSections, doneCount, progress });
    const updated = { ...series, doneSections, doneCount, progress };
    setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
    setOpenSeries(updated);
    toast(wasDone ? 'Undone!' : '✅ Done!');
  }

  async function addToPlaylist(series, videoId) {
    setPlaylistStatus(p => ({ ...p, [series.id]: 'loading' }));
    try {
      const res = await fetch('/api/youtube/playlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId, playlistTitle: series.folderLabel || 'Varnamala' }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlaylistStatus(p => ({ ...p, [series.id]: 'added' }));
      await updateSeries(user.uid, series.id, { playlistAdded: true });
      const updated = { ...series, playlistAdded: true };
      setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
      setOpenSeries(updated);
      toast(data.message);
    } catch (e) {
      setPlaylistStatus(p => ({ ...p, [series.id]: null }));
      toast('❌ ' + e.message);
    }
  }

  async function generateTitleDesc(series) {
    setGenTD(true);
    try {
      const typeInfo = SERIES_TYPES[series.type] || {};
      const baseName = series.name.replace(/ Part \d+$/, '').trim();
      const partText = (series.part || 1) > 1 ? ` भाग ${series.part}` : '';
      const itemsStr = (series.items || []).map(i => i.letter || i.word || i.name || '').join(', ');
      const text = await aiCall(`YouTube SEO expert for Hindi kids channel "Rang Tarang".
Series: "${baseName}${partText}" Type: ${typeInfo.label || series.type}
Items: ${itemsStr}
TITLE: "${baseName}${partText} | Rang Tarang" — Max 60 chars, NO emoji.
DESCRIPTION: Hook in Hindi, items list, subscribe https://youtube.com/@RangTarangHindi, hashtags.
TAGS: 15 comma separated Hindi+English tags.
Return ONLY JSON: {"title":"...","description":"...","tags":"..."}`);
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      await updateSeries(user.uid, series.id, { ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags || '' });
      const updated = { ...series, ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags || '' };
      setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
      setOpenSeries(updated);
      toast('✅ Title, Description & Tags ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  async function saveTitleDesc(series, title, desc, tags = '') {
    await updateSeries(user.uid, series.id, { ytTitle: title, ytDescription: desc, ytTags: tags });
    const updated = { ...series, ytTitle: title, ytDescription: desc, ytTags: tags };
    setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
    setOpenSeries(updated);
    toast('💾 Saved!');
  }

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(''), 2000); toast('📋 Copied!'); });
  }

  async function handleDelete(series) {
    if (!confirm(`"${series.name}" delete karein?`)) return;
    await deleteSeries(user.uid, series.id);
    toast('🗑 Deleted!'); setOpenSeries(null); loadList();
  }

  // ── Build sections for series ──
  function buildSections(s) {
    const sections = [
      { key: 'intro', title: '🎬 Intro', color: '#4488ff', prompts: [
        { type: '🖼 IMAGE', text: buildIntroImagePrompt(s.name, s.type, s.items || []) },
        { type: '🎬 VIDEO', text: buildIntroVideoPrompt(s.name, s.part || 1) },
      ]},
    ];

    (s.items || []).forEach((item, i) => {
      const isFirst = i === 0;
      const label = item.letter || item.word || item.name || `Item ${i+1}`;
      let prompts = [];

      if (s.type === 'varnamala') {
        prompts = [
          { type: '🖼 IMAGE', text: buildVarnamalaImagePrompt(item) },
          { type: '🎬 VIDEO', text: buildVarnamalaVideoPrompt(item, isFirst) },
        ];
      } else if (s.type === 'asei') {
        prompts = [
          { type: '🖼 IMAGE', text: buildAseiImagePrompt(item) },
          { type: '🎬 VIDEO', text: buildAseiVideoPrompt(item, isFirst) },
        ];
      } else if (s.type === 'shabd') {
        prompts = [
          { type: '🖼 IMAGE', text: buildShabdImagePrompt(item) },
          { type: '🎬 VIDEO', text: buildShabdVideoPrompt(item, isFirst) },
        ];
      } else if (s.type === 'matra') {
        prompts = [
          { type: '🖼 IMAGE', text: buildMatraImagePrompt(item) },
          { type: '🎬 VIDEO', text: buildMatraVideoPrompt(item, isFirst) },
        ];
      } else if (s.type === 'do_akshar') {
        prompts = [
          { type: '🖼 IMAGE', text: buildDoAksharImagePrompt(item) },
          { type: '🎬 VIDEO', text: buildDoAksharVideoPrompt(item, isFirst) },
        ];
      }

      sections.push({ key: `item_${i}`, title: `${i+1}. ${label}`, color: s.color, prompts });
    });

    sections.push({ key: 'outro', title: '🎤 Outro', color: '#cc88ff', prompts: [
      { type: '🎬 VIDEO', text: buildOutroVideoPrompt() },
    ]});

    return sections;
  }

  // ══════════════════════════════════════════════
  // LEVEL 3: SERIES DETAIL
  // ══════════════════════════════════════════════
  if (openSeries) {
    const s = openSeries;
    const done = s.doneSections || {};
    const total = (s.items || []).length + 2;
    const hasTitleDesc = !!(s.ytTitle && s.ytDescription);
    const deleteDisabled = isDeleteDisabled(s);
    const matchedVideo = getMatchedVideo(s);
    const videoId = matchedVideo?.videoId || null;
    const uploaded = checkUploaded(s);
    const isUploaded = uploaded === true || uploaded === 'private' || (uploaded && typeof uploaded === 'object');
    const typeInfo = SERIES_TYPES[s.type] || SERIES_TYPES.varnamala;
    const sections = buildSections(s);

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenSeries(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{s.emoji} {s.name}</span>
          {deleteDisabled ? <span style={{ fontSize: 18, opacity: 0.2, cursor: 'not-allowed' }}>🗑</span> : <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Progress */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Progress</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 800 }}>{s.doneCount||0} / {total}</span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (s.progress||0)+'%', background: s.color, borderRadius: 6 }} />
            </div>
          </div>

          {/* Schedule */}
          {!ytLoading && scheduleSlot && (
            <button onClick={() => { setScheduleModal(true); setScheduleCopied(false); }}
              style={{ width: '100%', background: 'rgba(68,136,255,0.07)', border: '1px solid #4488ff44', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, color: '#4488ff', fontWeight: 700, marginBottom: 2 }}>📅 NEXT FREE SLOT</div>
                <div style={{ fontSize: 13, color: '#ddd', fontWeight: 700 }}>{formatSlotDisplay(scheduleSlot)}</div>
              </div>
              <span style={{ fontSize: 18, color: '#4488ff' }}>→</span>
            </button>
          )}

          {scheduleModal && scheduleSlot && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
              <div style={{ background: '#080e1a', border: '1px solid #4488ff55', borderRadius: 20, padding: 22, width: '100%' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#4488ff', textAlign: 'center', marginBottom: 14 }}>📅 Schedule Confirm Karo</div>
                <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 8, padding: '8px 12px', fontSize: 10, color: '#555', fontFamily: 'monospace', marginBottom: 14, wordBreak: 'break-all' }}>{scheduleSlot.toISOString()}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { navigator.clipboard.writeText(scheduleSlot.toISOString()); setScheduleCopied(true); toast('📋 Copied!'); }}
                    style={{ flex: 2, background: scheduleCopied?'rgba(68,187,102,0.15)':'linear-gradient(135deg,#0a1a44,#05102a)', border:`1px solid ${scheduleCopied?'#44bb66':'#4488ff'}`, color: scheduleCopied?'#44bb66':'#4488ff', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    {scheduleCopied ? '✅ Copied!' : '📋 ISO Copy Karo'}
                  </button>
                  <button onClick={() => setScheduleModal(false)} style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            </div>
          )}

          {/* Playlist */}
          {videoId ? (
            <div style={{ background: '#0f0f0f', border: `1px solid ${s.playlistAdded || playlistStatus[s.id] === 'added' ? '#1a3a1a' : '#1a2a1a'}`, borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>🎵 PLAYLIST</div>
              {s.playlistAdded || playlistStatus[s.id] === 'added' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#44bb66' }}>Already Added</div>
                </div>
              ) : (
                <button onClick={() => addToPlaylist(s, videoId)} disabled={playlistStatus[s.id] === 'loading'}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#0a1a0a,#0a2a0a)', border: '1px solid #224422', color: '#44bb66', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {playlistStatus[s.id] === 'loading' ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#44bb66' }} />Adding...</> : `➕ Add to Playlist — ${typeInfo.label}`}
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: '13px 14px', fontSize: 12, color: '#444', textAlign: 'center' }}>
              🎵 Pehle video YouTube pe upload karo
            </div>
          )}

          {/* Title Desc */}
          <TitleDescSection
            series={s} genTD={genTD}
            onGenerate={() => generateTitleDesc(s)}
            onSave={(title, desc, tags) => saveTitleDesc(s, title, desc, tags)}
            onCopy={copy} copiedKey={copiedKey} isUploaded={isUploaded}
            matchedVideoId={matchedVideo?.videoId || null} matchedCategoryId={matchedVideo?.categoryId || '22'}
          />

          {/* Sections */}
          {sections.map(sec => {
            const isDone = !!done[sec.key];
            const isOpen = openSection === sec.key;
            return (
              <div key={sec.key} style={{ background: '#0f0f0f', border: `1px solid ${isDone?'#1a3a1a':'#1e1e1e'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => setOpenSection(isOpen ? null : sec.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDone?'#44bb66':'#ccc' }}>{sec.title}</span>
                    {isDone && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#444' }}>{isOpen?'▲':'▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sec.prompts.map((p, pi) => {
                      const bck = `varn_${sec.key}_${pi}`;
                      return (
                        <div key={pi}>
                          <div style={{ fontSize: 9, color: sec.color, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{p.type}</div>
                          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px', fontSize: 12, lineHeight: 1.7, color: '#bbb' }}>{p.text}</div>
                          <button onClick={() => copy(bck, p.text)}
                            style={{ background: copiedKey===bck?'rgba(68,136,255,0.15)':'#0a0a1a', border:`1px solid ${copiedKey===bck?'#4488ff':'#223355'}`, color: copiedKey===bck?'#4488ff':'#4477cc', borderRadius:10, padding:'11px', fontSize:12, fontWeight:700, cursor:'pointer', width:'100%', marginTop:6 }}>
                            {copiedKey===bck ? '✅ Copied!' : `📋 Copy ${p.type}`}
                          </button>
                        </div>
                      );
                    })}
                    <button onClick={() => markDone(s, sec.key, isDone)}
                      style={{ background: isDone?'rgba(68,187,102,0.12)':'#0a1a0a', border:`1px solid ${isDone?'rgba(68,187,102,0.4)':'#224422'}`, color: isDone?'#44bb66':'#44aa44', borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor:'pointer', width:'100%' }}>
                      {isDone ? '✅ Done ho gaya!' : '✔ Mark as Done'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // LEVEL 2: TYPE VIEW (series list)
  // ══════════════════════════════════════════════
  if (openType) {
    const typeInfo = SERIES_TYPES[openType];
    const typeSeries = seriesList.filter(s => s.type === openType).sort((a,b) => (a.part||1)-(b.part||1));
    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenType(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: typeInfo.color }}>{typeInfo.emoji} {typeInfo.label}</span>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600 }}>{typeSeries.length} series</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {typeSeries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{typeInfo.emoji}</div>
              <div style={{ fontSize: 13, color: '#555' }}>Koi series nahi — neeche "+ Nayi" se banao</div>
            </div>
          ) : typeSeries.map(s => {
            const total = (s.items || []).length + 2;
            const uploaded = checkUploaded(s);
            const isScheduledObj = uploaded && typeof uploaded === 'object' && uploaded.status === 'scheduled';
            const uploadColor = uploaded===true?'#44bb66':isScheduledObj?'#4488ff':uploaded==='private'?'#cc88ff':uploaded===false?'#ff8866':'#555';
            const scheduledTime = isScheduledObj ? formatScheduledTime(uploaded.scheduledAt) : null;
            const uploadText = ytLoading ? '🔍...' : uploaded===true ? '✅ YouTube pe hai' : isScheduledObj ? `📅 ${scheduledTime||'Scheduled'}` : uploaded==='private' ? '🔒 Private' : '⏳ Upload baaki';
            const nextExists = hasNextPart(s, seriesList);
            const isContinuing = continuing === s.id;
            return (
              <div key={s.id} onClick={() => setOpenSeries(s)}
                style={{ background: '#0f0f0f', borderRadius: 14, border: '1px solid #1e1e1e', borderLeft: `4px solid ${s.color}`, cursor: 'pointer', padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{s.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{s.doneCount||0}/{total} done</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: uploadColor }}>{uploadText}</span>
                  </div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (s.progress||0)+'%', background: s.color, borderRadius: 4 }} />
                  </div>
                  {!nextExists && (
                    <button onClick={(e) => continueSeries(e, s)} disabled={isContinuing}
                      style={{ marginTop: 10, background: isContinuing?'#111':`${s.color}18`, border:`1px solid ${s.color}55`, color: isContinuing?'#555':s.color, borderRadius:8, padding:'7px 12px', fontSize:11, fontWeight:700, cursor: isContinuing?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, width:'100%', justifyContent:'center' }}>
                      {isContinuing ? <><div className="spinner" style={{ width:12, height:12, borderTopColor:s.color }} /> Generating...</> : `➕ Continue → Next Part`}
                    </button>
                  )}
                </div>
                <span style={{ fontSize: 20, color: '#333', alignSelf: 'flex-start', marginTop: 4 }}>›</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════
  // LEVEL 1: TYPE LIST
  // ══════════════════════════════════════════════
  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ffcc00', fontSize: 14, fontWeight: 700 }}>🔤 वर्णमाला</span>
        <button onClick={() => setModal('create')} style={{ background: '#ffcc00', border: 'none', color: '#000', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nayi</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Create Modal */}
        {modal === 'create' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0d00', border: '1px solid #444400', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffcc00', marginBottom: 16, textAlign: 'center' }}>🔤 Type Chuno</div>

              {/* Type selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {Object.entries(SERIES_TYPES).map(([key, info]) => (
                  <button key={key} onClick={() => setSelectedType(key)}
                    style={{ background: selectedType===key ? `${info.color}22` : '#0f0f0f', border: `1px solid ${selectedType===key ? info.color : '#222'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                    <span style={{ fontSize: 28 }}>{info.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: selectedType===key ? info.color : '#eee', marginBottom: 2 }}>{info.label}</div>
                      <div style={{ fontSize: 11, color: '#666' }}>{info.desc}</div>
                    </div>
                    {selectedType===key && <span style={{ marginLeft: 'auto', fontSize: 16 }}>✅</span>}
                  </button>
                ))}
              </div>

              {/* Custom name (optional) */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>📝 CUSTOM NAAM (OPTIONAL)</div>
                <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Custom series naam... (khali chhodo = auto)"
                  maxLength={50}
                  style={{ width: '100%', background: '#1a1a00', border: '1px solid #444400', borderRadius: 10, padding: '10px 12px', color: '#eee', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              {/* Note */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>📝 AI KO NOTE (OPTIONAL)</div>
                <textarea value={seriesNote} onChange={e => setSeriesNote(e.target.value)} placeholder="e.g. Only swar letters. Easy common words only."
                  maxLength={200}
                  style={{ width: '100%', background: '#1a1a00', border: '1px solid #444400', borderRadius: 10, padding: '10px 12px', color: '#eee', fontSize: 12, outline: 'none', resize: 'none', minHeight: 60, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={generateSeries} disabled={generating}
                  style={{ flex: 2, background: generating?'#1a1a00':'linear-gradient(135deg,#555500,#333300)', border:'1px solid #666600', color: generating?'#555':'#ffcc00', borderRadius:10, padding:'12px', fontSize:13, fontWeight:800, cursor: generating?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  {generating ? <><div className="spinner" style={{ borderTopColor:'#ffcc00', width:16, height:16 }} />Ban raha hai...</> : '🤖 Generate Karo'}
                </button>
                <button onClick={() => { setModal('none'); setSeriesNote(''); setCustomName(''); }}
                  style={{ flex:1, background:'#111', border:'1px solid #333', color:'#666', borderRadius:10, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Type Cards */}
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ffcc00' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Loading...</div>
          </div>
        ) : (
          Object.entries(SERIES_TYPES).map(([key, info]) => {
            const typeSeries = seriesList.filter(s => s.type === key);
            const uploadedCount = typeSeries.filter(s => checkUploaded(s) === true).length;
            return (
              <div key={key} onClick={() => setOpenType(key)}
                style={{ background: '#0d0d0d', border: `1px solid ${info.color}44`, borderRadius: 16, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 15% 50%, ${info.color}0f 0%, transparent 65%)`, pointerEvents: 'none' }} />
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${info.color}1a`, border: `1px solid ${info.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{info.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: info.color, marginBottom: 3 }}>{info.label}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 3 }}>{info.desc}</div>
                  <div style={{ fontSize: 11, color: '#444' }}>{typeSeries.length} series • {uploadedCount} uploaded</div>
                </div>
                <span style={{ fontSize: 22, color: `${info.color}66` }}>›</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function VarnamalaWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <VarnamalaPage user={user} />}</AuthWrapper></ToastProvider>;
}

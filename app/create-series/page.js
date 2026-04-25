// 📁 LOCATION: app/create-series/page.js
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
  const snap = await getDocs(query(collection(db, 'users', uid, 'rt_series'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveSeries(uid, data) {
  return addDoc(collection(getDB(), 'users', uid, 'rt_series'), { ...data, createdAt: serverTimestamp() });
}
async function updateSeries(uid, id, data) {
  await updateDoc(doc(getDB(), 'users', uid, 'rt_series', id), data);
}
async function deleteSeries(uid, id) {
  await deleteDoc(doc(getDB(), 'users', uid, 'rt_series', id));
}

function buildIntroImagePrompt(n) { return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, waving hand with excited expression. Bold glowing text "${n}" floating center with colorful sparkles. 9:16 vertical. Pixar style. No other text.`; }
function buildIntroVideoPrompt(n) { return `Use reference scene exactly. No text on screen. Teacher standing center, smiling, waving hand at camera. Teacher says in Hindi with Indian accent: "Hello bachcho! Aaj ki video mein hum sikhenge ${n} — to chalo shuru karte hain!" Teacher claps excitedly. Soft cheerful background music. 8 seconds. Smooth animation. No glitch. Only Hindi Indian accent audio.`; }
function buildOutroImagePrompt() { return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, waving goodbye with big smile. Colorful sparkles and stars floating around. 9:16 vertical. Pixar style. No text.`; }
function buildOutroVideoPrompt() { return `Use reference image exactly. No text on screen. Character center, waves goodbye, says in Hindi: "To bachcho, aaj ke liye itna hi — milte hain agle video mein, tata!" Soft outro music. 8 seconds. Smooth. No glitch. Only Hindi Indian accent audio.`; }
function buildImagePrompt(item) { return `Use reference background exactly. Use reference teacher character exactly. Teacher left side, pointing right, curious expression. Big glowing "?" center top with sparkles. ${item.object} floating clearly center right. Bold text "Yeh kya hai?" bottom center. 9:16 vertical. Pixar style. No other text.`; }
function buildVideoPrompt(item) { return `Use reference scene exactly. Teacher left side, pointing to ${item.object} curiously. "?" appears center top with sparkles. Teacher asks in Hindi: "To btao.. yeh kya hai?" Pause 2 seconds. "?" disappears, glowing bold "${item.name.toUpperCase()}" appears center top. Text changes to "${item.name} - ${item.hindi}" at bottom with sparkles. Teacher says: "Yeh ${item.name.toUpperCase()} hai.. Bahut achhe!" Teacher claps. 8 seconds. Smooth. No glitch. Only Hindi Indian accent audio.`; }

const COLORS = ['#ff4400','#44bb66','#4488ff','#cc88ff','#ff8800','#ff4488','#00ccbb','#ffcc00'];
const EMOJIS = ['🍎','🔢','🌈','🐾','🥦','🚗','🎵','🏠','🌟','🦁','📚','⚽','🌺','🦋','🍕'];

async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 800, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

function CreateSeriesPage({ user }) {
  const toast = useToast();
  const [seriesList, setSeriesList]   = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [openSeries, setOpenSeries]   = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [copiedKey, setCopiedKey]     = useState('');
  const [ytVideos, setYtVideos]       = useState([]);
  const [continuing, setContinuing]   = useState(false);

  // Modal state: 'none' | 'choose' | 'suggestions' | 'custom' | 'picker'
  const [modal, setModal]             = useState('none');
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading]   = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customName, setCustomName]   = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [selectedColor, setSelectedColor] = useState('#ff4400');
  const [generating, setGenerating]   = useState(false);

  const initial = (user?.displayName || user?.email || 'U').charAt(0).toUpperCase();

  useEffect(() => { loadList(); fetchYT(); }, [user.uid]);

  async function loadList() {
    setLoadingList(true);
    try { setSeriesList(await getSeries(user.uid)); } catch { toast('❌ Load fail'); }
    setLoadingList(false);
  }
  async function fetchYT() {
    try { const r = await fetch('/api/youtube'); const d = await r.json(); if (!d.error) setYtVideos(d.videos || []); } catch {}
  }
  function checkUploaded(series) {
    if (!ytVideos.length) return null;
    const name = (series.name || '').toLowerCase();
    return ytVideos.some(v => (v.title || '').toLowerCase().includes(name));
  }

  // ── Open choose modal ─────────────────────────────────
  function openChoose() { setModal('choose'); }

  // ── Load AI suggestions ───────────────────────────────
  async function loadSuggestions() {
    setModal('suggestions'); setSugLoading(true); setSuggestions([]);
    try {
      const existing = seriesList.map(s => s.name).join(', ') || 'none';
      const text = await aiCall(`You are an AI for Hindi kids YouTube channel "RangTarang".
Already created: ${existing}
Suggest exactly 4 NEW unique educational series topics for kids aged 2-6.
Return ONLY JSON array, no markdown: [{"name":"Series Name","emoji":"🎯","description":"One line"}]`);
      setSuggestions(JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim()));
    } catch { toast('❌ Suggestions nahi aaye'); }
    setSugLoading(false);
  }

  function selectSuggestion(topic) {
    setSelectedTopic(topic);
    setSelectedEmoji(topic.emoji || '🌟');
    setModal('picker');
  }

  function submitCustom() {
    if (!customName.trim()) { toast('⚠️ Naam likho!'); return; }
    setSelectedTopic({ name: customName.trim(), emoji: selectedEmoji, description: '' });
    setModal('picker');
  }

  // ── Generate series ───────────────────────────────────
  async function generateSeries() {
    if (!selectedTopic) return;
    setGenerating(true);
    try {
      const existing = seriesList.map(s => s.name).join(', ');
      const text = await aiCall(`Generate exactly 10 unique items for Hindi kids YouTube series about "${selectedTopic.name}".
Avoid overlap with: ${existing}
Return ONLY JSON array, no markdown: [{"name":"English Name","hindi":"Hinglish Roman","object":"One [adjective] [item] for Pixar 3D animation"}]`);
      const items = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
      await saveSeries(user.uid, { name: selectedTopic.name, emoji: selectedEmoji, color: selectedColor, items, doneSections: {}, doneCount: 0, progress: 0, part: 1 });
      toast(`${selectedEmoji} "${selectedTopic.name}" ready!`);
      setModal('none'); setSelectedTopic(null); setCustomName('');
      loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  // ── Continue series ───────────────────────────────────
  async function continueSeries(series) {
    setContinuing(true);
    try {
      const done = (series.items || []).map(i => i.name).join(', ');
      const text = await aiCall(`Generate 10 MORE unique items for Hindi kids series "${series.name}".
Already done (DO NOT repeat): ${done}
Return ONLY JSON array: [{"name":"English","hindi":"Hinglish Roman","object":"Pixar 3D description"}]`);
      const newItems = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
      const newPart = (series.part || 1) + 1;
      await saveSeries(user.uid, { name: `${series.name} Part ${newPart}`, emoji: series.emoji, color: series.color, items: newItems, doneSections: {}, doneCount: 0, progress: 0, part: newPart });
      toast(`🎉 Part ${newPart} ready!`); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setContinuing(false);
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

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => { setCopiedKey(key); setTimeout(() => setCopiedKey(''), 2000); toast('📋 Copied!'); });
  }

  async function handleDelete(series) {
    if (!confirm(`"${series.name}" delete karein?`)) return;
    await deleteSeries(user.uid, series.id);
    toast('🗑 Deleted!'); setOpenSeries(null); loadList();
  }

  // ── DETAIL VIEW ───────────────────────────────────────
  if (openSeries) {
    const s = openSeries;
    const done = s.doneSections || {};
    const total = (s.items || []).length + 2;
    const sections = [
      { key: 'intro', title: '🎬 Intro', color: '#4488ff', prompts: [{ type: '🖼 IMAGE', text: buildIntroImagePrompt(s.name) }, { type: '🎬 VIDEO', text: buildIntroVideoPrompt(s.name) }] },
      ...(s.items || []).map((item, i) => ({ key: `item_${i}`, title: `${i+1}. ${item.name} (${item.hindi})`, color: s.color, prompts: [{ type: '🖼 IMAGE', text: buildImagePrompt(item) }, { type: '🎬 VIDEO', text: buildVideoPrompt(item) }] })),
      { key: 'outro', title: '🎤 Outro', color: '#cc88ff', prompts: [{ type: '🖼 IMAGE', text: buildOutroImagePrompt() }, { type: '🎬 VIDEO', text: buildOutroVideoPrompt() }] },
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenSeries(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{s.emoji} {s.name}</span>
          <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Progress</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 800 }}>{s.doneCount||0} / {total}</span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (s.progress||0)+'%', background: s.color, borderRadius: 6 }} />
            </div>
          </div>
          {sections.map(sec => {
            const isDone = !!done[sec.key];
            const isOpen = openSection === sec.key;
            return (
              <div key={sec.key} style={{ background: '#0f0f0f', border: `1px solid ${isDone ? '#1a3a1a' : '#1e1e1e'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => setOpenSection(isOpen ? null : sec.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#44bb66' : '#ccc' }}>{sec.title}</span>
                    {isDone && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#444' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sec.prompts.map((p, pi) => {
                      const ck = `${sec.key}_${pi}`;
                      return (
                        <div key={pi}>
                          <div style={{ fontSize: 9, color: sec.color, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{p.type}</div>
                          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px 44px 12px 12px', fontSize: 12, lineHeight: 1.7, color: '#bbb', position: 'relative' }}>
                            {p.text}
                            <button onClick={() => copy(ck, p.text)} style={{ position: 'absolute', top: 8, right: 8, background: copiedKey===ck ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey===ck ? '#44bb66' : '#333'}`, color: copiedKey===ck ? '#fff' : '#666', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{copiedKey===ck ? '✅' : '📋'}</button>
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => markDone(s, sec.key, isDone)} style={{ background: isDone ? 'rgba(68,187,102,0.12)' : '#0a1a0a', border: `1px solid ${isDone ? 'rgba(68,187,102,0.4)' : '#224422'}`, color: isDone ? '#44bb66' : '#44aa44', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
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

  // ── LIST VIEW ─────────────────────────────────────────
  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#cc88ff', fontSize: 14, fontWeight: 700 }}>🎬 Series</span>
        <button onClick={openChoose} style={{ background: '#cc88ff', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nayi</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── CHOOSE MODAL ── */}
        {modal === 'choose' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d000d', border: '1px solid #440044', borderRadius: 20, padding: 20, width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff', marginBottom: 16, textAlign: 'center' }}>✨ Series Kaise Banao?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={loadSuggestions} style={{ background: 'linear-gradient(135deg,#1a0033,#0d0020)', border: '1px solid #660066', borderRadius: 14, padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>🤖</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff', marginBottom: 3 }}>AI Suggest Kare</div>
                    <div style={{ fontSize: 11, color: '#777' }}>AI 4 topics suggest karega based on channel</div>
                  </div>
                </button>
                <button onClick={() => setModal('custom')} style={{ background: '#0f0f0f', border: '1px solid #333', borderRadius: 14, padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>✏️</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 3 }}>Custom Series</div>
                    <div style={{ fontSize: 11, color: '#777' }}>Khud series ka naam likho</div>
                  </div>
                </button>
              </div>
              <button onClick={() => setModal('none')} style={{ width: '100%', marginTop: 12, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── AI SUGGESTIONS MODAL ── */}
        {modal === 'suggestions' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d000d', border: '1px solid #440044', borderRadius: 20, padding: 20, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff', marginBottom: 16, textAlign: 'center' }}>🤖 AI Suggestions</div>
              {sugLoading ? (
                <div style={{ textAlign: 'center', padding: 30 }}><div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#cc88ff' }} /><div style={{ fontSize: 12, color: '#666' }}>AI soch raha hai...</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => selectSuggestion(s)} style={{ background: '#1a001a', border: '1px solid #440044', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
                      <span style={{ fontSize: 32 }}>{s.emoji}</span>
                      <div><div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 3 }}>{s.name}</div><div style={{ fontSize: 11, color: '#888' }}>{s.description}</div></div>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setModal('choose')} style={{ width: '100%', marginTop: 14, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
            </div>
          </div>
        )}

        {/* ── CUSTOM NAME MODAL ── */}
        {modal === 'custom' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d000d', border: '1px solid #440044', borderRadius: 20, padding: 20, width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff', marginBottom: 16, textAlign: 'center' }}>✏️ Custom Series</div>
              <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Series ka naam (e.g. Animals, Body Parts...)" maxLength={30}
                style={{ width: '100%', background: '#1a001a', border: '1px solid #440044', color: '#eee', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', marginBottom: 14, fontFamily: 'inherit' }} />
              <div style={{ fontSize: 10, color: '#777', marginBottom: 8 }}>EMOJI CHUNO</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {EMOJIS.map(e => <button key={e} onClick={() => setSelectedEmoji(e)} style={{ fontSize: 22, padding: '6px 8px', borderRadius: 10, cursor: 'pointer', background: selectedEmoji===e ? 'rgba(204,136,255,0.2)' : '#1a1a1a', border: `1px solid ${selectedEmoji===e ? '#cc88ff' : '#333'}` }}>{e}</button>)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={submitCustom} style={{ flex: 2, background: 'linear-gradient(135deg,#550055,#330033)', border: '1px solid #660066', color: '#cc88ff', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Next →</button>
                <button onClick={() => setModal('choose')} style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
              </div>
            </div>
          </div>
        )}

        {/* ── PICKER MODAL ── */}
        {modal === 'picker' && selectedTopic && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d000d', border: '1px solid #440044', borderRadius: 20, padding: 20, width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff', marginBottom: 4, textAlign: 'center' }}>{selectedEmoji} {selectedTopic.name}</div>
              {selectedTopic.description && <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginBottom: 14 }}>{selectedTopic.description}</div>}
              <div style={{ fontSize: 10, color: '#777', marginBottom: 8 }}>EMOJI CHUNO</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {EMOJIS.map(e => <button key={e} onClick={() => setSelectedEmoji(e)} style={{ fontSize: 22, padding: '6px 8px', borderRadius: 10, cursor: 'pointer', background: selectedEmoji===e ? 'rgba(204,136,255,0.2)' : '#1a1a1a', border: `1px solid ${selectedEmoji===e ? '#cc88ff' : '#333'}` }}>{e}</button>)}
              </div>
              <div style={{ fontSize: 10, color: '#777', marginBottom: 8 }}>COLOR CHUNO</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {COLORS.map(c => <div key={c} onClick={() => setSelectedColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${selectedColor===c ? '#fff' : 'transparent'}`, transform: selectedColor===c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }} />)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={generateSeries} disabled={generating} style={{ flex: 2, background: generating ? '#1a001a' : 'linear-gradient(135deg,#550055,#330033)', border: '1px solid #660066', color: '#cc88ff', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {generating ? <><div className="spinner" style={{ borderTopColor: '#cc88ff', width: 16, height: 16 }} />Generating...</> : '🤖 Generate Karo'}
                </button>
                <button onClick={() => setModal('none')} style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── SERIES LIST ── */}
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 32 }}><div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#cc88ff' }} /><div style={{ fontSize: 12, color: '#555' }}>Loading...</div></div>
        ) : seriesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#444' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi series nahi hai</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Nayi" se banao</div>
          </div>
        ) : seriesList.map(s => {
          const total = (s.items || []).length + 2;
          const uploaded = checkUploaded(s);
          return (
            <div key={s.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, overflow: 'hidden', borderLeft: `3px solid ${s.color}` }}>
              <div onClick={() => setOpenSeries(s)} style={{ padding: '14px 14px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 36 }}>{s.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{s.doneCount||0} / {total} prompts done</div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (s.progress||0)+'%', background: s.color, borderRadius: 4 }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, color: '#333' }}>›</span>
              </div>
              <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 20, textAlign: 'center', background: uploaded===true ? 'rgba(68,187,102,0.12)' : uploaded===false ? 'rgba(255,68,0,0.1)' : '#1a1a1a', color: uploaded===true ? '#44bb66' : uploaded===false ? '#ff8866' : '#555', border: `1px solid ${uploaded===true ? 'rgba(68,187,102,0.3)' : uploaded===false ? 'rgba(255,68,0,0.2)' : '#222'}` }}>
                  {uploaded===true ? '✅ YouTube pe hai' : uploaded===false ? '⏳ Upload baaki' : '🔄 Checking...'}
                </div>
                <button onClick={() => continueSeries(s)} disabled={continuing} style={{ background: `${s.color}15`, border: `1px solid ${s.color}40`, color: s.color, borderRadius: 20, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: continuing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {continuing ? <div className="spinner" style={{ width: 12, height: 12, borderTopColor: s.color }} /> : '▶ Continue'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CreateSeriesWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <CreateSeriesPage user={user} />}</AuthWrapper></ToastProvider>;
}

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

// ── Series type detect ───────────────────────────────────
function getSeriesType(seriesName) {
  const n = (seriesName || '').toLowerCase();
  if (n.includes('number') || n.includes('counting') || n.includes('ginti') || n.includes('1 to') || n.includes('numbers')) return 'number';
  if (n.includes('color') || n.includes('colour') || n.includes('rang')) return 'color';
  if (n.includes('fruit')) return 'fruit';
  if (n.includes('animal')) return 'animal';
  if (n.includes('alphabet') || n.includes(' abc') || n.includes('letter')) return 'alphabet';
  if (n.includes('shape')) return 'shape';
  if (n.includes('vegetable') || n.includes('veggie') || n.includes('sabzi') || n.includes('sabziyon')) return 'vegetable';
  return 'general';
}

function getQuestionText(type, forImage = false) {
  switch(type) {
    case 'number':    return forImage ? 'यह कौनसा नंबर है?' : 'तो बताओ.. यह कौनसा नंबर है?';
    case 'counting':  return forImage ? 'यह कितने हैं?' : 'तो बताओ.. यह कितने हैं?';
    case 'color':     return forImage ? 'कौनसा रंग है?' : 'तो बताओ.. कौनसा रंग है?';
    case 'shape':     return forImage ? 'यह कौनसी आकृति है?' : 'तो बताओ.. यह कौनसी आकृति है?';
    case 'alphabet':  return forImage ? 'यह कौनसा अक्षर है?' : 'तो बताओ.. यह कौनसा अक्षर है?';
    case 'vegetable': return forImage ? 'यह कौनसी सब्ज़ी है?' : 'तो बताओ.. यह कौनसी सब्ज़ी है?';
    case 'fruit':     return forImage ? 'यह कौनसा फल है?' : 'तो बताओ.. यह कौनसा फल है?';
    case 'animal':    return forImage ? 'यह कौनसा जानवर है?' : 'तो बताओ.. यह कौनसा जानवर है?';
    default:          return forImage ? 'यह क्या है?' : 'तो बताओ.. यह क्या है?';
  }
}
function getQuestionTextPart2(type) {
  switch(type) {
    case 'number':    return 'अब बताओ.. यह कौनसा नंबर है?';
    case 'counting':  return 'अब बताओ.. यह कितने हैं?';
    case 'color':     return 'अब बताओ.. कौनसा रंग है?';
    case 'shape':     return 'अब बताओ.. यह कौनसी आकृति है?';
    case 'alphabet':  return 'अब बताओ.. यह कौनसा अक्षर है?';
    case 'vegetable': return 'अब बताओ.. यह कौनसी सब्ज़ी है?';
    case 'fruit':     return 'अब बताओ.. यह कौनसा फल है?';
    case 'animal':    return 'अब बताओ.. यह कौनसा जानवर है?';
    default:          return 'अब बताओ.. यह क्या है?';
  }
}

function buildIntroImagePrompt(seriesName, items = []) {
  const first3 = items.slice(0, 3);
  const positions = ['bottom left', 'bottom center', 'bottom right'];
  const shuffled = positions.sort(() => Math.random() - 0.5);

  const itemsDesc = first3.length > 0
    ? first3.map((item, i) => `${item.name} (${item.object}) at ${shuffled[i]}`).join(', ')
    : 'colorful educational items at bottom';

  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, waving hand with excited expression. Bold glowing text "${seriesName}" floating center with colorful sparkles. Show 3 Pixar 3D cartoon items at bottom: ${itemsDesc}. 9:16 vertical. Pixar style. No other text.`;
}
function buildIntroVideoPrompt(n, part = 1, items = []) {
  const partMention = part > 1 ? ` — यह है part ${part}` : '';
  const firstItem = items?.[0]?.name || '';
  const objectLine = firstItem ? `Teacher bends down, picks up a ${firstItem} from the bottom, stands back up holding it and shows it to camera excitedly.` : '';
  return `Use reference scene exactly. Teacher standing center, smiling, waving hand at camera. Teacher grabs the title text "${n}" with hand and slides it off screen to the right. ${objectLine} Teacher says in Hindi: "हेल्लो बच्चों! आज हम सीखेंगे ${n}${partMention} — चलो शुरू करते हैं!" Teacher claps excitedly. 8 seconds. Smooth animation. No glitch. Hindi audio only.`;
}

function buildOutroImagePrompt() { return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, waving goodbye with big smile. Colorful sparkles and stars floating around. 9:16 vertical. Pixar style. No text.`; }
function buildOutroVideoPrompt() { return `Use reference image exactly. No text on screen. Character center, waves goodbye, says in Hindi: "तो बच्चों, आज के लिए बस इतना ही — मिलते हैं अगले video में, टाटा!" Soft outro music. 8 seconds. Smooth. No glitch. Hindi audio only.`; }

function buildImagePrompt(item, seriesName) {
  const type = getSeriesType(seriesName);
  const q = getQuestionText(type, true);
  return `Use reference background exactly.
Use reference teacher exactly.
Teacher left side pointing right with curious expression. big  ${item.name} clearly center right.
Bold text "${q}" at very bottom center. 9:16 vertical. Pixar style. No other text. No question mark. No "?" anywhere in the image. No floating symbols above the object.`;
}

function buildVideoPrompt(item, seriesName, isFirstPart = true) {
  const type = getSeriesType(seriesName);
  const q = isFirstPart ? getQuestionText(type, false) : getQuestionTextPart2(type);
  return `Use reference scene exactly. Teacher points to ${item.object} curiously. Teacher asks in Hindi: "${q}". Pause 2 seconds. The question text at bottom center animates away and glowing bold "${item.name.toUpperCase()}" appears at same position with sparkle animation. Answer text stays visible until the very last frame. Teacher says in Hindi: "यह ${item.name} है! बहुत अच्छे!" Teacher smiles and gives thumbs up. No "?" or question mark anywhere at any point in the video. No floating symbols above the object at any point. 8 seconds total. Smooth animation. No glitch. Only Hindi Indian accent audio.`;
}

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

  const [genTD, setGenTD]             = useState(false);

  const [modal, setModal]             = useState('none');
  const [suggestions, setSuggestions] = useState([]);
  const [sugLoading, setSugLoading]   = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [customName, setCustomName]   = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [selectedColor, setSelectedColor] = useState('#ff4400');
  const [generating, setGenerating]   = useState(false);
  const [ytLoading, setYtLoading]     = useState(true);

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
      if (!d.error) setYtVideos(d.videos || []);
    } catch {}
    setYtLoading(false);
  }

  // ── YouTube check ────────────────────────────────────────
 function checkUploaded(series) {
  if (!ytVideos.length) return null;
  const matchStr = (series.ytTitle || series.name || '').trim().toLowerCase();
  if (!matchStr || matchStr.length < 3) return null;
  const matched = ytVideos.find(v => {
    const ytTitle = (v.title || '').toLowerCase();
    return ytTitle.includes(matchStr) || matchStr.includes(ytTitle.slice(0, 20));
  });
  if (!matched) return false;
  if (matched.isScheduled) return 'scheduled';
  if (matched.privacyStatus === 'private') return 'private';
  return true;
 }
  function openChoose() { setModal('choose'); }

  async function loadSuggestions() {
    setModal('suggestions'); setSugLoading(true); setSuggestions([]);
    try {
      const existing = seriesList.map(s => s.name).join(', ') || 'none';
      const text = await aiCall(`You are an AI for Hindi kids YouTube channel "RangTarang".\nAlready created: ${existing}\nSuggest exactly 4 NEW unique educational series topics for kids aged 2-6.\nReturn ONLY JSON array, no markdown: [{"name":"Series Name","emoji":"🎯","description":"One line"}]`);
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

  async function generateSeries() {
    if (!selectedTopic) return;
    setGenerating(true);
    try {
      const existing = seriesList.map(s => s.name).join(', ');
      const text = await aiCall(`Generate exactly 10 unique items for English learning kids YouTube series about "${selectedTopic.name}".\nAvoid overlap with: ${existing}\nReturn ONLY JSON array, no markdown: [{"name":"English Name","object":"One [adjective] [item] for Pixar 3D animation"}]`);
      const items = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
      await saveSeries(user.uid, { name: selectedTopic.name, emoji: selectedEmoji, color: selectedColor, items, doneSections: {}, doneCount: 0, progress: 0, part: 1, ytTitle: '', ytDescription: '' });
      toast(`${selectedEmoji} "${selectedTopic.name}" ready!`);
      setModal('none'); setSelectedTopic(null); setCustomName('');
      loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function continueSeries(series) {
    setContinuing(true);
    try {
      const done = (series.items || []).map(i => i.name).join(', ');
      const text = await aiCall(`Generate 10 MORE unique items for English learning kids series "${series.name}".\nAlready done (DO NOT repeat): ${done}\nReturn ONLY JSON array: [{"name":"English","object":"Pixar 3D description"}]`);
      const newItems = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
      const newPart = (series.part || 1) + 1;
      await saveSeries(user.uid, { name: `${series.name} Part ${newPart}`, emoji: series.emoji, color: series.color, items: newItems, doneSections: {}, doneCount: 0, progress: 0, part: newPart, ytTitle: '', ytDescription: '' });
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

  async function generateTitleDesc(series) {
    setGenTD(true);
    try {
      const itemNames = (series.items || []).map(i => i.name).join(', ');
      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang".
Generate a YouTube video title and description for a kids educational video.
Series: "${series.name}"
Items covered: ${itemNames}

Rules:
- Title: Catchy, Hindi+English mix, under 70 chars, include "| Rang Tarang" at end
- Description: 3-4 lines, fun, mentions what kids will learn, includes "Rang Tarang" channel name, ends with subscribe line

Return ONLY JSON, no markdown: {"title":"...","description":"..."}
`);
      const parsed = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
      await updateSeries(user.uid, series.id, { ytTitle: parsed.title, ytDescription: parsed.description });
      const updated = { ...series, ytTitle: parsed.title, ytDescription: parsed.description };
      setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
      setOpenSeries(updated);
      toast('✅ Title & Description ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  async function saveTitleDesc(series, title, desc) {
    await updateSeries(user.uid, series.id, { ytTitle: title, ytDescription: desc });
    const updated = { ...series, ytTitle: title, ytDescription: desc };
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

// ── DETAIL VIEW ───────────────────────────────────────
  if (openSeries) {
    const s = openSeries;
    const done = s.doneSections || {};
    const total = (s.items || []).length + 2;
    const allPromptsDone = Object.keys(done).length >= total;
    const hasTitleDesc = !!(s.ytTitle && s.ytDescription);
    const isUploaded = checkUploaded(s) === true;

    const isFirstPart = (s.part || 1) === 1;
    const sections = [
      { key: 'intro', title: '🎬 Intro', color: '#4488ff', prompts: [{ type: '🖼 IMAGE', text: buildIntroImagePrompt(s.name, s.items || []) }, { type: '🎬 VIDEO', text: buildIntroVideoPrompt(s.name, s.part || 1, s.items || []) }] },
      ...(s.items || []).map((item, i) => ({ key: `item_${i}`, title: `${i+1}. ${item.name}`, color: s.color, prompts: [{ type: '🖼 IMAGE', text: buildImagePrompt(item, s.name) }, { type: '🎬 VIDEO', text: buildVideoPrompt(item, s.name, isFirstPart) }] })),
      { key: 'outro', title: '🎤 Outro', color: '#cc88ff', prompts: [{ type: '🖼 IMAGE', text: buildOutroImagePrompt() }, { type: '🎬 VIDEO', text: buildOutroVideoPrompt() }] },
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenSeries(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{s.emoji} {s.name}</span>
          {isUploaded ? (
            <span style={{ fontSize: 18, opacity: 0.25, cursor: 'not-allowed' }} title="YouTube pe upload hai, delete nahi ho sakta">🗑</span>
          ) : (
            <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>
          )}
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

          {/* Title & Description */}
          <TitleDescSection
            series={s}
            allPromptsDone={allPromptsDone}
            hasTitleDesc={hasTitleDesc}
            genTD={genTD}
            onGenerate={() => generateTitleDesc(s)}
            onSave={(title, desc) => saveTitleDesc(s, title, desc)}
            onCopy={copy}
            copiedKey={copiedKey}
          />

          {/* Prompt sections */}
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

        {/* ✅ FIX: ytLoading ho toh + Nayi button greyed out/disabled */}
        {ytLoading ? (
          <button disabled style={{
            background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#444',
            borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700,
            cursor: 'not-allowed', opacity: 0.5
          }}>+ Nayi</button>
        ) : (() => {
          const hasUnuploaded = seriesList.some(s => checkUploaded(s) === false);
          return hasUnuploaded ? (
            <button onClick={() => toast('⚠️ Pehle purani series upload karo!')} style={{
              background: '#333', border: 'none', color: '#666',
              borderRadius: 20, padding: '6px 14px', fontSize: 12,
              fontWeight: 700, cursor: 'not-allowed', opacity: 0.6
            }}>+ Nayi</button>
          ) : (
            <button onClick={openChoose} style={{
              background: '#cc88ff', border: 'none', color: '#fff',
              borderRadius: 20, padding: '6px 14px', fontSize: 12,
              fontWeight: 700, cursor: 'pointer'
            }}>+ Nayi</button>
          );
        })()}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* CHOOSE MODAL */}
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

        {/* AI SUGGESTIONS MODAL */}
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

        {/* CUSTOM NAME MODAL */}
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

        {/* PICKER MODAL */}
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
{/* SERIES LIST */}
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
          const hasTD = !!(s.ytTitle && s.ytDescription);
          return (
            <div key={s.id} style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 14, overflow: 'hidden', borderLeft: `3px solid ${s.color}` }}>
              <div onClick={() => setOpenSeries(s)} style={{ padding: '14px 14px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 36 }}>{s.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 2 }}>{s.name}</div>
                  {hasTD && <div style={{ fontSize: 10, color: '#888', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>📝 {s.ytTitle}</div>}
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{s.doneCount||0} / {total} prompts done</div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (s.progress||0)+'%', background: s.color, borderRadius: 4 }} />
                  </div>
                </div>
                <span style={{ fontSize: 13, color: '#333' }}>›</span>
              </div>
              <div style={{ padding: '0 14px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, fontSize: 10, fontWeight: 700, padding: '5px 10px', borderRadius: 20, textAlign: 'center',
                  background: uploaded===true ? 'rgba(68,187,102,0.12)'
                    : uploaded==='scheduled' ? 'rgba(68,136,255,0.12)'
                    : uploaded==='private' ? 'rgba(204,136,255,0.12)'
                    : uploaded===false ? 'rgba(255,68,0,0.1)' : '#1a1a1a',
                  color: uploaded===true ? '#44bb66'
                    : uploaded==='scheduled' ? '#4488ff'
                    : uploaded==='private' ? '#cc88ff'
                    : uploaded===false ? '#ff8866' : '#555',
                  border: `1px solid ${
                    uploaded===true ? 'rgba(68,187,102,0.3)'
                    : uploaded==='scheduled' ? 'rgba(68,136,255,0.3)'
                    : uploaded==='private' ? 'rgba(204,136,255,0.3)'
                    : uploaded===false ? 'rgba(255,68,0,0.2)' : '#222'}` }}>
                  {ytLoading ? '🔍 Checking...'
                    : uploaded===true ? '✅ YouTube pe hai'
                    : uploaded==='scheduled' ? '📅 Scheduled hai'
                    : uploaded==='private' ? '🔒 Private hai'
                    : '⏳ Upload baaki'}
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

// ── Title & Description Sub-Component ────────────────────
function TitleDescSection({ series, allPromptsDone, hasTitleDesc, genTD, onGenerate, onSave, onCopy, copiedKey }) {
  const [editing, setEditing]   = useState(false);
  const [title, setTitle]       = useState(series.ytTitle || '');
  const [desc, setDesc]         = useState(series.ytDescription || '');

  useEffect(() => {
    setTitle(series.ytTitle || '');
    setDesc(series.ytDescription || '');
  }, [series.ytTitle, series.ytDescription]);

  const isOpen = editing || hasTitleDesc;

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${hasTitleDesc ? '#1a3a2a' : '#2a1a00'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setEditing(e => !e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: hasTitleDesc ? '#44bb66' : '#ffaa44' }}>📝 Title & Description</span>
          {hasTitleDesc && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
          {!hasTitleDesc && <span style={{ fontSize: 9, background: 'rgba(255,170,0,0.1)', color: '#ffaa44', border: '1px solid rgba(255,170,0,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Zaroori</span>}
        </div>
        <span style={{ fontSize: 13, color: '#444' }}>{editing ? '▲' : '▼'}</span>
      </div>

      {editing && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {!allPromptsDone && !hasTitleDesc && (
            <div style={{ background: 'rgba(255,170,0,0.07)', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 12px', fontSize: 11, color: '#aa7700' }}>
              💡 Pehle saare prompts mark as done karo, phir title generate karo
            </div>
          )}

          <button onClick={onGenerate} disabled={genTD}
            style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {genTD ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ffaa44' }} />Generate ho raha hai...</> : '🤖 AI se Generate Karo'}
          </button>

          <div>
            <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>📌 YouTube Title</div>
            <div style={{ position: 'relative' }}>
              <input value={title} onChange={e => setTitle(e.target.value)}
                placeholder="Video ka title..."
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={() => onCopy('ytTitle', title)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey==='ytTitle' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey==='ytTitle' ? '#44bb66' : '#333'}`, color: copiedKey==='ytTitle' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey==='ytTitle' ? '✅' : '📋'}</button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>📄 YouTube Description</div>
            <div style={{ position: 'relative' }}>
              <textarea value={desc} onChange={e => setDesc(e.target.value)}
                placeholder="Video ki description..."
                rows={4}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
              <button onClick={() => onCopy('ytDesc', desc)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey==='ytDesc' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey==='ytDesc' ? '#44bb66' : '#333'}`, color: copiedKey==='ytDesc' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey==='ytDesc' ? '✅' : '📋'}</button>
            </div>
          </div>

          <button onClick={() => { onSave(title, desc); setEditing(false); }}
            style={{ background: 'rgba(68,187,102,0.12)', border: '1px solid rgba(68,187,102,0.4)', color: '#44bb66', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
            💾 Save Karo
          </button>
        </div>
      )}
    </div>
  );
}

export default function CreateSeriesWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <CreateSeriesPage user={user} />}</AuthWrapper></ToastProvider>;
}

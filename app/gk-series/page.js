// 📁 LOCATION: app/gk-series/page.js
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
  const snap = await getDocs(query(collection(db, 'users', uid, 'rt_gk_series'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveSeries(uid, data) {
  return addDoc(collection(getDB(), 'users', uid, 'rt_gk_series'), { ...data, createdAt: serverTimestamp() });
}
async function updateSeries(uid, id, data) {
  await updateDoc(doc(getDB(), 'users', uid, 'rt_gk_series', id), data);
}
async function deleteSeries(uid, id) {
  await deleteDoc(doc(getDB(), 'users', uid, 'rt_gk_series', id));
}

// ── GK Categories ──
const GK_CATEGORIES = {
  freedom_fighter: { label: 'Freedom Fighters', emoji: '🇮🇳', color: '#ff6600' },
  scientist:       { label: 'Scientists',        emoji: '🔬', color: '#4488ff' },
  animal:          { label: 'Animals',           emoji: '🦁', color: '#ffaa44' },
  planet:          { label: 'Planets',           emoji: '🪐', color: '#cc88ff' },
  country:         { label: 'Countries',         emoji: '🌍', color: '#44bb66' },
  sport:           { label: 'Sports',            emoji: '⚽', color: '#ff4488' },
  invention:       { label: 'Inventions',        emoji: '💡', color: '#ffcc00' },
  monument:        { label: 'Monuments',         emoji: '🏛️', color: '#ff8866' },
  festival:        { label: 'Festivals',         emoji: '🎉', color: '#ff44aa' },
  other:           { label: 'GK',                emoji: '📚', color: '#888888' },
};

function getGKType(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('freedom') || n.includes('fighter') || n.includes('gandhi') || n.includes('swatantra') || n.includes('azadi')) return 'freedom_fighter';
  if (n.includes('scientist') || n.includes('inventor') || n.includes('vigyan'))  return 'scientist';
  if (n.includes('animal') || n.includes('janwar'))       return 'animal';
  if (n.includes('planet') || n.includes('grah'))         return 'planet';
  if (n.includes('country') || n.includes('desh'))        return 'country';
  if (n.includes('sport') || n.includes('khel'))          return 'sport';
  if (n.includes('invention') || n.includes('aavishkar')) return 'invention';
  if (n.includes('monument') || n.includes('imaarat') || n.includes('dhrohar')) return 'monument';
  if (n.includes('festival') || n.includes('tyohar'))     return 'festival';
  return 'other';
}

function getFolder(type) {
  return GK_CATEGORIES[type] || GK_CATEGORIES['other'];
}

function groupByFolder(list) {
  const groups = {};
  list.forEach(s => {
    const key = s.type || getGKType(s.name);
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
}

function hasNextPart(series, allSeries) {
  const base = series.name.replace(/ Part \d+$/, '').trim();
  const cur = series.part || 1;
  return allSeries.some(s => s.name.replace(/ Part \d+$/, '').trim() === base && (s.part || 1) === cur + 1);
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

// ── AI Call ──
async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 800, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

// ── AI Emoji Detect (same as create-series) ──
async function detectEmoji(seriesName) {
  const text = await aiCall(`Given this kids YouTube GK series name: "${seriesName}"
Return ONLY a single most appropriate emoji for this topic. No explanation, no text, just one emoji.`);
  return text.trim().replace(/[^a-zA-Z\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}]/gu, '').slice(0, 2) || '📚';
}

// ── Prompt Builders ──
function buildPortraitImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center-left, smiling excitedly, holding up a large ornate portrait frame with both hands toward camera. Inside the portrait frame: a Pixar 3D cartoon illustration of ${item.portraitDesc}. Portrait frame is large, clearly visible, golden ornate border. 9:16 vertical. Pixar style. No other text. No "?" anywhere.`;
}

function buildGKVideoPrompt(item, seriesName, isFirst = true) {
  const isPersonTopic = ['freedom_fighter', 'scientist'].includes(getGKType(seriesName));
  const question = isPersonTopic
    ? (isFirst ? 'तो बताओ.. यह कौन हैं?' : 'अब बताओ.. यह कौन हैं?')
    : (isFirst ? 'तो बताओ.. यह क्या है?' : 'अब बताओ.. यह क्या है?');
  const questionText = isPersonTopic ? 'यह कौन हैं?' : 'यह क्या है?';
  return `Use reference image exactly as background scene. Teacher standing on left side, holding up a large ornate portrait frame in both hands showing it to camera. Inside the frame: Pixar 3D cartoon of ${item.portraitDesc}. Teacher asks in Hindi: "${question}". Bold rainbow gradient text "${questionText}" visible at very bottom center — red, orange, yellow, green, blue, violet colors. Pause 2 seconds. Bottom text animates away and glowing bold rainbow text "${item.name.toUpperCase()}" appears at same position with sparkle animation. Answer text stays visible until the very last frame. Teacher says in Hindi: "${item.dialogue}" Teacher looks at camera, smiles and gives thumbs up. No "?" or question mark anywhere at any point. No floating objects. No background music. 8 seconds total. Smooth animation. No glitch. Teacher must lip sync. Pure Hindi Indian accent audio only.`;
}

function buildIntroImagePrompt(seriesName, items = []) {
  const first3 = items.slice(0, 3);
  const itemsDesc = first3.length > 0
    ? first3.map(item => `framed portrait of ${item.portraitDesc}`).join(', ')
    : 'colorful framed portraits at bottom';
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, waving hand with excited expression. Bold glowing text "${seriesName}" floating center with colorful sparkles. Show 3 big ornate portrait frames at bottom: ${itemsDesc}. 9:16 vertical. Pixar style. No other text.`;
}

function buildIntroVideoPrompt(seriesName, part = 1) {
  const base = seriesName.replace(/ Part \d+$/, '').trim();
  const partMention = part > 1 ? ` — यह है part ${part}` : '';
  return `Use reference image exactly as background scene. Teacher standing center, smiling, waving hand at camera. Bold glowing title text "${base}" flies in from top with sparkles. Teacher says in Hindi: "हेल्लो बच्चों! आज हम सीखेंगे ${base}${partMention} — चलो शुरू करते हैं!" Teacher pushes title off screen dramatically. 8 seconds. Smooth animation. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function buildOutroVideoPrompt() {
  return `Use reference image exactly as background scene. Any text on screen fades away completely. Teacher standing center, all portrait frames have been put aside. Screen is clean with only teacher visible. Teacher waves goodbye to camera with big smile and says in Hindi: "तो बच्चों, आज के लिए बस इतना ही — मिलते हैं अगले video में, टाटा!" 8 seconds. Smooth. No floating objects. No glitch. Hindi audio only. Teacher must lip sync.`;
}

const COLORS = ['#ff4400','#44bb66','#4488ff','#cc88ff','#ff8800','#ff4488','#00ccbb','#ffcc00'];
const EMOJIS = ['🇮🇳','🔬','🦁','🪐','🌍','⚽','💡','🏛️','🎉','📚','🌟','🎨','🏆','🌺','🦋','👨‍🔬','🕌','🎭','🌐','⚗️'];

// ══════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════
function GKSeriesPage({ user }) {
  const toast = useToast();
  const [seriesList, setSeriesList]             = useState([]);
  const [loadingList, setLoadingList]           = useState(true);
  const [openFolder, setOpenFolder]             = useState(null);
  const [openSeries, setOpenSeries]             = useState(null);
  const [openSection, setOpenSection]           = useState(null);
  const [copiedKey, setCopiedKey]               = useState('');
  const [continuing, setContinuing]             = useState(null);
  const [modal, setModal]                       = useState('none');
  const [suggestions, setSuggestions]           = useState([]);
  const [sugLoading, setSugLoading]             = useState(false);
  const [selectedTopic, setSelectedTopic]       = useState(null);
  const [customName, setCustomName]             = useState('');
  const [selectedEmoji, setSelectedEmoji]       = useState('📚');
  const [generating, setGenerating]             = useState(false);
  const [aiSuggestions, setAiSuggestions]       = useState([]);
  const [customSugLoading, setCustomSugLoading] = useState(false);
  const [seriesNote, setSeriesNote]             = useState('');
  const [genTD, setGenTD]                       = useState(false);
  const [copiedTD, setCopiedTD]                 = useState('');
  const [customMode, setCustomMode]             = useState('five');
  const [customFullTitle, setCustomFullTitle]   = useState('');
  // YouTube state
  const [ytVideos, setYtVideos]                 = useState([]);
  const [ytLoading, setYtLoading]               = useState(true);
  const [playlistStatus, setPlaylistStatus]     = useState({});
  // TD inline state
  const [tdOpen, setTdOpen]                     = useState(false);
  const [tdOpenField, setTdOpenField]           = useState(null);
  const [tdTitle, setTdTitle]                   = useState('');
  const [tdDesc, setTdDesc]                     = useState('');
  const [tdTags, setTdTags]                     = useState('');
  const [savingField, setSavingField]           = useState(null);
  const [savedField, setSavedField]             = useState(null);
  const [regenField, setRegenField]             = useState(null); // 'title'|'desc'|'tags'

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

  // ── Same upload check as create-series ──
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

  function getNextColor() {
    const lastColor = seriesList?.[0]?.color || '';
    const avail = COLORS.filter(c => c !== lastColor);
    return avail[Math.floor(Math.random() * avail.length)];
  }

  // ── Suggestions ──
  async function loadSuggestions() {
    setModal('suggestions'); setSugLoading(true); setSuggestions([]);
    try {
      const existing = seriesList.map(s => s.name).join(', ') || 'none';
      const text = await aiCall(`You are an AI for Hindi kids YouTube channel "RangTarang" — GK series for kids aged 2-6.
Already created: ${existing}
Suggest exactly 4 NEW unique GK series topics. Examples: "5 Freedom Fighters", "5 Planets", "5 Indian Monuments", "5 Great Scientists".
Return ONLY JSON array, no markdown: [{"name":"5 Freedom Fighters","emoji":"🇮🇳","description":"One line Hindi"}]`);
      setSuggestions(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { toast('❌ Suggestions nahi aaye'); }
    setSugLoading(false);
  }

  async function selectSuggestion(topic) {
    // AI se emoji detect karo — same as create-series
    const detectedEmoji = await detectEmoji(topic.name);
    setSelectedEmoji(detectedEmoji);
    setSelectedTopic({ ...topic, emoji: detectedEmoji });
    setModal('picker');
  }

  async function loadCustomSuggestions() {
    setCustomSugLoading(true); setAiSuggestions([]);
    try {
      const existing = seriesList.map(s => s.name).join(', ') || 'none';
      const hint = customMode === 'five' ? customName.trim() : customFullTitle.trim();
      const text = await aiCall(`You are an AI for Hindi kids YouTube channel "RangTarang" — GK series.
Already created: ${existing}
User hint: "${hint}"
Suggest 6 unique GK topics NOT already created. Return ONLY JSON array of short topic names:
["Freedom Fighters","Planets","Indian Monuments","Great Scientists","World Animals","Famous Inventors"]`);
      setAiSuggestions(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { toast('❌ Suggestions nahi aaye'); }
    setCustomSugLoading(false);
  }

  async function submitCustom() {
    let fullName = '';
    if (customMode === 'five') {
      if (!customName.trim()) { toast('⚠️ Topic likho!'); return; }
      fullName = `5 ${customName.trim()}`;
    } else {
      if (!customFullTitle.trim()) { toast('⚠️ Title likho!'); return; }
      fullName = customFullTitle.trim();
    }
    // AI emoji detect
    const detectedEmoji = await detectEmoji(fullName);
    setSelectedEmoji(detectedEmoji);
    setSelectedTopic({ name: fullName, emoji: detectedEmoji, description: '' });
    setAiSuggestions([]);
    setModal('picker');
  }

  // ── Generate Series ──
  async function generateSeries() {
    if (!selectedTopic) return;
    setGenerating(true);
    try {
      const dup = seriesList.find(s => s.name.toLowerCase() === selectedTopic.name.toLowerCase());
      if (dup) { toast(`⚠️ Already exist karta hai!`); setGenerating(false); return; }
      const existing = seriesList.map(s => s.name).join(', ');
      const noteLine = seriesNote.trim() ? `\nIMPORTANT NOTE: ${seriesNote.trim()}` : '';
      const detectedType = getGKType(selectedTopic.name);
      const autoColor = getNextColor();
      const folder = GK_CATEGORIES[detectedType] || GK_CATEGORIES['other'];

      const text = await aiCall(`Generate exactly 5 unique items for Hindi kids GK YouTube series: "${selectedTopic.name}".${noteLine}
Avoid overlap with: ${existing}
For each item provide:
- name: The name in English (e.g. "Mahatma Gandhi")
- hindiName: Name in Hindi (e.g. "महात्मा गांधी")
- portraitDesc: Short description for portrait image (e.g. "Mahatma Gandhi, bald head, round glasses, white dhoti, gentle smile, holding a walking stick")
- dialogue: VERY SHORT Hindi dialogue, max 8-10 words only, for a 6-second clip. E.g. "यह गांधी जी हैं! बहुत अच्छे!"
Return ONLY JSON array, no markdown:
[{"name":"Mahatma Gandhi","hindiName":"महात्मा गांधी","portraitDesc":"Mahatma Gandhi, bald head, round glasses, white dhoti, gentle smile, holding a walking stick","dialogue":"यह गांधी जी हैं! बहुत अच्छे!"}]`);

      const items = JSON.parse(text.replace(/```json|```/g, '').trim());

      await saveSeries(user.uid, {
        name: selectedTopic.name,
        emoji: selectedEmoji,
        color: autoColor,
        items,
        type: detectedType,
        folderLabel: folder.label,
        folderEmoji: folder.emoji,
        folderColor: folder.color,
        doneSections: {},
        doneCount: 0,
        progress: 0,
        part: 1,
        ytTitle: '',
        ytDescription: '',
        ytTags: '',
      });

      toast(`${selectedEmoji} "${selectedTopic.name}" ready!`);
      setModal('none'); setSelectedTopic(null); setCustomName(''); setSeriesNote('');
      setCustomMode('five'); setCustomFullTitle('');
      loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  // ── Continue Series ──
  async function continueSeries(e, series) {
    e.stopPropagation();
    setContinuing(series.id);
    try {
      const done = (series.items || []).map(i => i.name).join(', ');
      const text = await aiCall(`Generate 5 MORE unique items for GK series "${series.name}".
Already done (DO NOT repeat): ${done}
Return ONLY JSON array:
[{"name":"Bhagat Singh","hindiName":"भगत सिंह","portraitDesc":"Bhagat Singh, young man, brown hat, moustache, brave expression, wearing suit","dialogue":"यह भगत सिंह हैं! बहुत बहादुर! बहुत अच्छे!"}]`);
      const newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      const newPart = (series.part || 1) + 1;
      const base = series.name.replace(/ Part \d+$/, '').trim();
      await saveSeries(user.uid, {
        name: `${base} Part ${newPart}`,
        emoji: series.emoji,
        color: series.color,
        items: newItems,
        type: series.type,
        folderLabel: series.folderLabel,
        folderEmoji: series.folderEmoji,
        folderColor: series.folderColor,
        doneSections: {},
        doneCount: 0,
        progress: 0,
        part: newPart,
        ytTitle: '',
        ytDescription: '',
        ytTags: '',
      });
      toast(`🎉 Part ${newPart} ready!`); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setContinuing(null);
  }

  // ── Add to Playlist ──
  async function addToPlaylist(series, videoId) {
    setPlaylistStatus(p => ({ ...p, [series.id]: 'loading' }));
    try {
      const folderLabel = series.folderLabel || getFolder(series.type || getGKType(series.name)).label;
      const res = await fetch('/api/youtube/playlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, playlistTitle: folderLabel }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlaylistStatus(p => ({ ...p, [series.id]: 'added' }));
      await updateSeries(user.uid, series.id, { playlistAdded: true });
      const updated = { ...series, playlistAdded: true };
      setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
      setOpenSeries(updated);
      toast(data.message || '✅ Playlist mein add ho gaya!');
    } catch (e) {
      setPlaylistStatus(p => ({ ...p, [series.id]: null }));
      toast('❌ ' + e.message);
    }
  }

  // ── Mark Done ──
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

  // ── Generate Title & Desc ──
  async function generateTitleDesc(series) {
    setGenTD(true);
    try {
      const itemNames = (series.items || []).map(i => i.name).join(', ');
      const base = series.name.replace(/ Part \d+$/, '').trim();
      const partText = (series.part || 1) > 1 ? ` Part ${series.part}` : '';
      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang" — GK series.
Series: "${base}${partText}"
Items: ${itemNames}
Generate YouTube title, description, and tags.
TITLE: "[count] [Hindi topic name] | [count] [English topic name] | Rang Tarang" — Max 60 chars, no emoji.
DESCRIPTION:
Line 1: Hook in Hindi (1 line)
Line 2: ✅ इस video में: ${(series.items||[]).slice(0,5).map(i=>i.name).join(', ')}
Line 3: 👶 2-6 साल के बच्चों के लिए perfect GK!
Line 4: 🔔 Rang Tarang Subscribe karo: https://youtube.com/@RangTarangHindi
Line 5: Relevant hashtags
TAGS: 15 comma-separated Hindi+English tags
Return ONLY JSON: {"title":"...","description":"...","tags":"..."}`);
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      await updateSeries(user.uid, series.id, { ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags });
      const updated = { ...series, ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags };
      setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
      setOpenSeries(updated);
      setTdTitle(parsed.title); setTdDesc(parsed.description); setTdTags(parsed.tags || '');
      toast('✅ Title & Description ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key); setTimeout(() => setCopiedKey(''), 2000);
      toast('📋 Copied!');
    });
  }

  async function handleDelete(series) {
    if (!confirm(`"${series.name}" delete karein?`)) return;
    await deleteSeries(user.uid, series.id);
    toast('🗑 Deleted!'); setOpenSeries(null); loadList();
  }

  // ══════════════════════════════════════════════
  // LEVEL 3: SERIES DETAIL
  // ══════════════════════════════════════════════
  if (openSeries) {
    const s = openSeries;
    const done = s.doneSections || {};
    const total = (s.items || []).length + 2;
    const hasTitleDesc = !!(s.ytTitle && s.ytDescription);
    const matchedVideo = getMatchedVideo(s);
    const videoId = matchedVideo?.videoId || null;
    const isUploaded = !!matchedVideo;
    const folderLabel = s.folderLabel || getFolder(s.type || getGKType(s.name)).label;
    const hasTags = matchedVideo && matchedVideo.tags && matchedVideo.tags.length > 0;

    // Sync TD state when series opens
    if (!tdOpen && tdTitle !== (s.ytTitle || '')) {
      setTdTitle(s.ytTitle || ''); setTdDesc(s.ytDescription || ''); setTdTags(s.ytTags || '');
    }

    async function regenOneField(field) {
      setRegenField(field);
      try {
        const base = s.name.replace(/ Part \d+$/, '').trim();
        const partText = (s.part || 1) > 1 ? ` Part ${s.part}` : '';
        const itemNames = (s.items || []).map(i => i.name).join(', ');
        let prompt = '';
        if (field === 'title') {
          prompt = `You are a YouTube SEO expert for Hindi kids channel "Rang Tarang" — GK series.
Series: "${base}${partText}" | Items: ${itemNames}
Current description: "${tdDesc.slice(0, 100)}"
Current tags: "${tdTags.slice(0, 100)}"
Generate ONE improved YouTube title matching the description and tags.
RULES: Exactly "[count] [Hindi name] | [count] [English name] | Rang Tarang" pattern. Max 60 chars. NO emoji.
Return ONLY the title text, nothing else.`;
        } else if (field === 'desc') {
          prompt = `You are a YouTube SEO expert for Hindi kids channel "Rang Tarang" — GK series.
Series: "${base}${partText}" | Items: ${itemNames}
Current title: "${tdTitle}"
Current tags: "${tdTags.slice(0, 150)}"
Generate YouTube description matching the title and tags.
FORMAT:
Line 1: Hook in Hindi (1 line)
Line 2: ✅ इस video में: ${(s.items||[]).slice(0,5).map(i=>i.name).join(', ')}
Line 3: 👶 2-6 साल के बच्चों के लिए perfect GK!
Line 4: 🔔 Rang Tarang Subscribe karo: https://youtube.com/@RangTarangHindi
Line 5: Relevant hashtags
Return ONLY the description text, nothing else.`;
        } else {
          prompt = `You are a YouTube SEO expert for Hindi kids channel "Rang Tarang" — GK series.
Series: "${base}${partText}" | Items: ${itemNames}
Current title: "${tdTitle}"
Current description: "${tdDesc.slice(0, 150)}"
Generate exactly 15 YouTube tags matching the title and description.
RULES: Comma separated, mix Hindi + English, topic-specific + general kids GK tags. No # symbol.
Return ONLY the comma-separated tags, nothing else.`;
        }
        const res = await fetch('/api/ai', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 500, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
        });
        const data = await res.json();
        const text = (data.choices?.[0]?.message?.content || '').trim();
        if (field === 'title') setTdTitle(text);
        else if (field === 'desc') setTdDesc(text);
        else setTdTags(text);
        toast(`🔄 ${field === 'title' ? 'Title' : field === 'desc' ? 'Description' : 'Tags'} regenerated!`);
      } catch (e) { toast('❌ ' + e.message); }
      setRegenField(null);
    }

    async function ytUpdateField(field) {
      if (!matchedVideo?.videoId) { toast('❌ Video YouTube pe nahi mila'); return; }
      setSavingField(field);
      try {
        const res = await fetch('/api/audit', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ videoId: matchedVideo.videoId, categoryId: matchedVideo.categoryId || '22', title: tdTitle, description: tdDesc, tags: tdTags }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || 'Update fail');
        await updateSeries(user.uid, s.id, { ytTitle: tdTitle, ytDescription: tdDesc, ytTags: tdTags });
        const updated = { ...s, ytTitle: tdTitle, ytDescription: tdDesc, ytTags: tdTags };
        setSeriesList(l => l.map(x => x.id === s.id ? updated : x));
        setOpenSeries(updated);
        setSavedField(field); setTimeout(() => setSavedField(null), 2500);
        toast(`✅ YouTube pe update ho gaya!`);
      } catch (e) { toast('❌ ' + e.message); }
      setSavingField(null);
    }

    async function saveTDLocal() {
      await updateSeries(user.uid, s.id, { ytTitle: tdTitle, ytDescription: tdDesc, ytTags: tdTags });
      const updated = { ...s, ytTitle: tdTitle, ytDescription: tdDesc, ytTags: tdTags };
      setSeriesList(l => l.map(x => x.id === s.id ? updated : x));
      setOpenSeries(updated);
      toast('💾 Saved!');
    }

    const tdFieldDefs = [
      { key: 'title', label: '📌 Title',       color: '#ff8800', value: tdTitle, setter: setTdTitle, orig: s.ytTitle  || '' },
      { key: 'desc',  label: '📄 Description', color: '#4488ff', value: tdDesc,  setter: setTdDesc,  orig: s.ytDescription || '' },
      { key: 'tags',  label: '🏷️ Tags',        color: '#44bb66', value: tdTags,  setter: setTdTags,  orig: s.ytTags  || '' },
    ];

    const sections = [
      {
        key: 'intro', title: '🎬 Intro', color: '#4488ff',
        prompts: [
          { type: '🖼 IMAGE', text: buildIntroImagePrompt(s.name, s.items || []) },
          { type: '🎬 VIDEO', text: buildIntroVideoPrompt(s.name, s.part || 1) },
        ]
      },
      ...(s.items || []).map((item, i) => ({
        key: `item_${i}`, title: `${i + 1}. ${item.name}`, color: s.color,
        prompts: [
          { type: '🖼 IMAGE', text: buildPortraitImagePrompt(item) },
          { type: '🎬 VIDEO', text: buildGKVideoPrompt(item, s.name, i === 0) },
        ]
      })),
      {
        key: 'outro', title: '🎤 Outro', color: '#cc88ff',
        prompts: [{ type: '🎬 VIDEO', text: buildOutroVideoPrompt() }]
      },
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenSeries(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{s.emoji} {s.name}</span>
          <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Progress */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Progress</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 800 }}>{s.doneCount || 0} / {total}</span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (s.progress || 0) + '%', background: s.color, borderRadius: 6 }} />
            </div>
          </div>

          {/* Items preview */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 10, letterSpacing: 1 }}>🖼 PORTRAIT LIST</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(s.items || []).map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#0a0a0a', borderRadius: 10, padding: '10px 12px' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: s.color + '22', border: `1px solid ${s.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🖼</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#eee', marginBottom: 2 }}>{item.name} <span style={{ fontSize: 11, color: '#555' }}>{item.hindiName}</span></div>
                    <div style={{ fontSize: 10, color: '#666', lineHeight: 1.5 }}>{item.dialogue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Playlist Section — same as create-series */}
          {videoId ? (
            <div style={{ background: '#0f0f0f', border: `1px solid ${s.playlistAdded || playlistStatus[s.id] === 'added' ? '#1a3a1a' : '#1a2a1a'}`, borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>🎵 PLAYLIST</div>
              {s.playlistAdded || playlistStatus[s.id] === 'added' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#44bb66' }}>Already Added to Playlist</div>
                    <div style={{ fontSize: 11, color: '#555' }}>{folderLabel}</div>
                  </div>
                </div>
              ) : (
                <button onClick={() => addToPlaylist(s, videoId)} disabled={playlistStatus[s.id] === 'loading'}
                  style={{ width: '100%', background: playlistStatus[s.id] === 'loading' ? '#111' : 'linear-gradient(135deg,#0a1a0a,#0a2a0a)', border: '1px solid #224422', color: playlistStatus[s.id] === 'loading' ? '#555' : '#44bb66', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: playlistStatus[s.id] === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {playlistStatus[s.id] === 'loading' ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#44bb66' }} />Adding...</> : `➕ Add to Playlist — ${folderLabel}`}
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: '13px 14px', fontSize: 12, color: '#444', textAlign: 'center' }}>
              🎵 Pehle video YouTube pe upload karo
            </div>
          )}

          {/* Title & Description — with YouTube direct update */}
          <div style={{ background: '#0f0f0f', border: `1px solid ${hasTitleDesc ? '#1a3a2a' : '#2a1a00'}`, borderRadius: 12, overflow: 'hidden' }}>
            <div onClick={() => setTdOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: hasTitleDesc ? '#44bb66' : '#ffaa44' }}>📝 Title & Description</span>
                {hasTitleDesc && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
                {isUploaded && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.1)', color: '#44bb66', border: '1px solid #1a3a1a', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>🔗 Linked</span>}
              </div>
              <span style={{ fontSize: 13, color: '#444' }}>{tdOpen ? '▲' : '▼'}</span>
            </div>
            {tdOpen && (
              <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ marginTop: 10, background: isUploaded ? 'rgba(68,136,255,0.07)' : 'rgba(255,170,0,0.06)', border: `1px solid ${isUploaded ? '#223355' : '#2a2000'}`, borderRadius: 10, padding: '8px 12px', fontSize: 10, color: isUploaded ? '#4466aa' : '#aa7700' }}>
                  {isUploaded ? '🔗 Linked — Update dabao seedha YouTube pe jayega.' : '📋 Upload nahi hua — Copy karo → YouTube pe paste karo.'}
                </div>
                <button onClick={() => generateTitleDesc(s)} disabled={genTD}
                  style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '10px', fontSize: 11, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {genTD ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#ffaa44' }} />Generating...</> : '🤖 Generate Title + Desc + Tags'}
                </button>
                {tdFieldDefs.map(({ key, label, color, value, setter, orig }) => {
                  const isFieldOpen = tdOpenField === key;
                  const dirty = value !== orig;
                  const isSaving = savingField === key;
                  const isSaved  = savedField  === key;
                  const copyKey  = `td_${key}`;
                  return (
                    <div key={key} style={{ background: '#0a0a0a', border: `1px solid ${dirty ? color + '44' : '#1e1e1e'}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div onClick={() => setTdOpenField(isFieldOpen ? null : key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }}>
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
                            {/* 🔄 Regenerate — sirf yeh field */}
                            <button onClick={() => regenOneField(key)} disabled={regenField === key}
                              style={{ background: regenField === key ? '#111' : '#0a0a1a', border: `1px solid ${regenField === key ? '#333' : color + '55'}`, color: regenField === key ? '#444' : color, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontWeight: 700, cursor: regenField === key ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                              {regenField === key ? <div className="spinner" style={{ width: 11, height: 11, borderTopColor: color }} /> : '🔄'}
                            </button>
                            {/* 📋 Copy */}
                            <button onClick={() => { navigator.clipboard.writeText(value); setCopiedTD(copyKey); setTimeout(() => setCopiedTD(''), 2000); toast('📋 Copied!'); }}
                              style={{ flex: 1, background: copiedTD === copyKey ? 'rgba(68,187,102,0.15)' : '#111', border: `1px solid ${copiedTD === copyKey ? '#44bb66' : '#333'}`, color: copiedTD === copyKey ? '#44bb66' : '#666', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              {copiedTD === copyKey ? '✅ Copied!' : '📋 Copy'}
                            </button>
                            {isUploaded ? (
                              <button onClick={() => ytUpdateField(key)} disabled={isSaving || !dirty}
                                style={{ flex: 1, background: isSaving ? '#111' : dirty ? 'linear-gradient(135deg,#0a1a44,#05102a)' : '#111', border: `1px solid ${dirty ? '#4488ff' : '#222'}`, color: isSaving ? '#555' : dirty ? '#4488ff' : '#333', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: isSaving || !dirty ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                {isSaving ? <><div className="spinner" style={{ width: 11, height: 11, borderTopColor: '#4488ff' }} />...</> : dirty ? '🚀 Update' : '✓ Saved'}
                              </button>
                            ) : (
                              <button onClick={saveTDLocal}
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

          {/* Sections */}
          {sections.map(sec => {
            const isDone = !!done[sec.key];
            const isOpen = openSection === sec.key;
            return (
              <div key={sec.key} style={{ background: '#0f0f0f', border: `1px solid ${isDone ? '#1a3a1a' : '#1e1e1e'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => setOpenSection(isOpen ? null : sec.key)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#44bb66' : '#ccc' }}>{sec.title}</span>
                    {isDone && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#444' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sec.prompts.map((p, pi) => {
                      const bck = `prompt_${sec.key}_${pi}`;
                      return (
                        <div key={pi}>
                          <div style={{ fontSize: 9, color: sec.color, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>{p.type}</div>
                          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px', fontSize: 12, lineHeight: 1.7, color: '#bbb' }}>{p.text}</div>
                          <button onClick={() => copy(bck, p.text)}
                            style={{ background: copiedKey === bck ? 'rgba(68,136,255,0.15)' : '#0a0a1a', border: `1px solid ${copiedKey === bck ? '#4488ff' : '#223355'}`, color: copiedKey === bck ? '#4488ff' : '#4477cc', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%', marginTop: 6 }}>
                            {copiedKey === bck ? '✅ Copied!' : `📋 Copy ${p.type}`}
                          </button>
                        </div>
                      );
                    })}
                    <button onClick={() => markDone(s, sec.key, isDone)}
                      style={{ background: isDone ? 'rgba(68,187,102,0.12)' : '#0a1a0a', border: `1px solid ${isDone ? 'rgba(68,187,102,0.4)' : '#224422'}`, color: isDone ? '#44bb66' : '#44aa44', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
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
  // LEVEL 2: FOLDER VIEW
  // ══════════════════════════════════════════════
  if (openFolder) {
    const grouped = groupByFolder(seriesList);
    const folderSeries = grouped[openFolder] || [];
    const folder = getFolder(openFolder);
    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenFolder(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: folder.color }}>{folder.emoji} {folder.label}</span>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600 }}>{folderSeries.length} series</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {folderSeries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{folder.emoji}</div>
              <div style={{ fontSize: 13, color: '#555' }}>Koi series nahi hai</div>
            </div>
          ) : folderSeries.map(s => {
            const total = (s.items || []).length + 2;
            const uploaded = checkUploaded(s);
            const isScheduledObj = uploaded && typeof uploaded === 'object' && uploaded.status === 'scheduled';
            const uploadColor = uploaded === true ? '#44bb66' : isScheduledObj ? '#4488ff' : uploaded === 'private' ? '#cc88ff' : uploaded === false ? '#ff8866' : '#555';
            const scheduledTime = isScheduledObj ? formatScheduledTime(uploaded.scheduledAt) : null;
            const uploadText = ytLoading ? '🔍...' : uploaded === true ? '✅ YouTube pe hai' : isScheduledObj ? `📅 ${scheduledTime || 'Scheduled'}` : uploaded === 'private' ? '🔒 Private' : '⏳ Upload baaki';
            const isContinuing = continuing === s.id;
            const nextExists = hasNextPart(s, seriesList);
            const matchedVideo = getMatchedVideo(s);
            const hasTags = matchedVideo && matchedVideo.tags && matchedVideo.tags.length > 0;
            return (
              <div key={s.id} onClick={() => setOpenSeries(s)}
                style={{ background: '#0f0f0f', borderRadius: 14, border: '1px solid #1e1e1e', borderLeft: `4px solid ${s.color}`, cursor: 'pointer', padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{s.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{s.doneCount || 0}/{total} done</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: uploadColor }}>{uploadText}</span>
                    {/* Tag detect dot — same as create-series */}
                    {matchedVideo && (
                      <span style={{ fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                        🏷️
                        <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: hasTags ? '#44bb66' : '#ff4444' }} />
                      </span>
                    )}
                  </div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (s.progress || 0) + '%', background: s.color, borderRadius: 4 }} />
                  </div>
                  {!nextExists && (
                    <button onClick={(e) => continueSeries(e, s)} disabled={isContinuing}
                      style={{ marginTop: 10, background: isContinuing ? '#111' : `${s.color}18`, border: `1px solid ${s.color}55`, color: isContinuing ? '#555' : s.color, borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: isContinuing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
                      {isContinuing ? <><div className="spinner" style={{ width: 12, height: 12, borderTopColor: s.color }} />Generating...</> : `➕ Continue → Part ${(s.part || 1) + 1}`}
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
  // LEVEL 1: FOLDER LIST
  // ══════════════════════════════════════════════
  const grouped = groupByFolder(seriesList);
  const sortedFolders = Object.keys(grouped).sort((a, b) => {
    const aT = grouped[a]?.[0]?.createdAt?.seconds || 0;
    const bT = grouped[b]?.[0]?.createdAt?.seconds || 0;
    return bT - aT;
  });

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ffaa44', fontSize: 14, fontWeight: 700 }}>📚 GK Series</span>
        <button onClick={() => setModal('choose')} style={{ background: '#ffaa44', border: 'none', color: '#000', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nayi</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Modal: Choose ── */}
        {modal === 'choose' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0800', border: '1px solid #443300', borderRadius: 20, padding: 20, width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa44', marginBottom: 16, textAlign: 'center' }}>📚 GK Series Kaise Banao?</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button onClick={loadSuggestions} style={{ background: 'linear-gradient(135deg,#1a0a00,#2a1400)', border: '1px solid #664400', borderRadius: 14, padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>🤖</span>
                  <div><div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa44', marginBottom: 3 }}>AI Suggest Kare</div><div style={{ fontSize: 11, color: '#777' }}>AI 4 GK topics suggest karega</div></div>
                </button>
                <button onClick={() => setModal('custom')} style={{ background: '#0f0f0f', border: '1px solid #333', borderRadius: 14, padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 32 }}>✏️</span>
                  <div><div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 3 }}>Custom Topic</div><div style={{ fontSize: 11, color: '#777' }}>Khud topic ka naam likho</div></div>
                </button>
              </div>
              <button onClick={() => setModal('none')} style={{ width: '100%', marginTop: 12, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Modal: AI Suggestions ── */}
        {modal === 'suggestions' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0800', border: '1px solid #443300', borderRadius: 20, padding: 20, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa44', marginBottom: 16, textAlign: 'center' }}>🤖 AI Suggestions</div>
              {sugLoading ? (
                <div style={{ textAlign: 'center', padding: 30 }}>
                  <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ffaa44' }} />
                  <div style={{ fontSize: 12, color: '#666' }}>AI soch raha hai...</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => selectSuggestion(s)} style={{ background: '#1a0800', border: '1px solid #443300', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
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

        {/* ── Modal: Custom ── */}
        {modal === 'custom' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0800', border: '1px solid #443300', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa44', marginBottom: 16, textAlign: 'center' }}>✏️ Custom GK Series</div>

              {/* Toggle */}
              <div style={{ display: 'flex', background: '#1a0800', border: '1px solid #443300', borderRadius: 12, padding: 4, marginBottom: 14, gap: 4 }}>
                <button onClick={() => setCustomMode('five')}
                  style={{ flex: 1, background: customMode === 'five' ? 'linear-gradient(135deg,#552200,#331100)' : 'none', border: customMode === 'five' ? '1px solid #ffaa44' : '1px solid transparent', color: customMode === 'five' ? '#ffaa44' : '#555', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                  5 ... Series
                </button>
                <button onClick={() => setCustomMode('custom')}
                  style={{ flex: 1, background: customMode === 'custom' ? 'linear-gradient(135deg,#552200,#331100)' : 'none', border: customMode === 'custom' ? '1px solid #ffaa44' : '1px solid transparent', color: customMode === 'custom' ? '#ffaa44' : '#555', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                  Custom Title
                </button>
              </div>

              {customMode === 'five' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a0800', border: '1px solid #443300', borderRadius: 12, padding: '12px 14px', marginBottom: 8 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#ffaa44', whiteSpace: 'nowrap' }}>5</span>
                    <input value={customName} onChange={e => { setCustomName(e.target.value); setAiSuggestions([]); }}
                      placeholder="Freedom Fighters, Planets..."
                      maxLength={40}
                      style={{ flex: 1, background: 'none', border: 'none', color: '#eee', fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
                  </div>
                  {customName.trim() && (
                    <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 10 }}>
                      👁 <span style={{ color: '#eee', fontWeight: 700 }}>5 {customName.trim()}</span>
                    </div>
                  )}
                  <button onClick={loadCustomSuggestions} disabled={customSugLoading}
                    style={{ width: '100%', background: customSugLoading ? '#111' : 'linear-gradient(135deg,#1a0a00,#2a1400)', border: '1px solid #664400', color: customSugLoading ? '#555' : '#ffaa44', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: customSugLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                    {customSugLoading ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ffaa44' }} />AI soch raha hai...</> : '🤖 AI se Ideas Lo'}
                  </button>
                  {aiSuggestions.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>TAP KARO SELECT KARNE KE LIYE</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {aiSuggestions.map((sug, i) => {
                          const sugStr = typeof sug === 'string' ? sug : sug.name || sug;
                          const displayStr = sugStr.replace(/^5\s+/i, '');
                          return (
                            <button key={i} onClick={() => setCustomName(displayStr)}
                              style={{ background: customName === displayStr ? 'rgba(255,170,0,0.2)' : '#1a0800', border: `1px solid ${customName === displayStr ? '#ffaa44' : '#443300'}`, color: customName === displayStr ? '#ffaa44' : '#aaa', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              {displayStr}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {customMode === 'custom' && (
                <>
                  <input value={customFullTitle} onChange={e => setCustomFullTitle(e.target.value)}
                    placeholder="e.g. 5 Indian Scientists, 5 Great Monuments..."
                    maxLength={60}
                    style={{ width: '100%', background: '#1a0800', border: '1px solid #443300', borderRadius: 12, padding: '12px 14px', color: '#eee', fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 8 }} />
                  {customFullTitle.trim() && (
                    <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 10 }}>
                      👁 <span style={{ color: '#eee', fontWeight: 700 }}>{customFullTitle.trim()}</span>
                    </div>
                  )}
                </>
              )}

              {/* Note */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>📝 AI KO NOTE (OPTIONAL)</div>
                <textarea value={seriesNote} onChange={e => setSeriesNote(e.target.value)}
                  placeholder="e.g. Only Indian freedom fighters. No foreign scientists."
                  maxLength={200}
                  style={{ width: '100%', background: '#1a0800', border: '1px solid #443300', borderRadius: 10, padding: '10px 12px', color: '#eee', fontSize: 12, fontWeight: 600, outline: 'none', resize: 'none', minHeight: 65, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={submitCustom} disabled={customMode === 'five' ? !customName.trim() : !customFullTitle.trim()}
                  style={{ flex: 2, background: (customMode === 'five' ? customName.trim() : customFullTitle.trim()) ? 'linear-gradient(135deg,#552200,#331100)' : '#111', border: '1px solid #664400', color: (customMode === 'five' ? customName.trim() : customFullTitle.trim()) ? '#ffaa44' : '#444', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: (customMode === 'five' ? customName.trim() : customFullTitle.trim()) ? 'pointer' : 'not-allowed' }}>
                  Next →
                </button>
                <button onClick={() => { setModal('choose'); setAiSuggestions([]); setCustomName(''); setCustomMode('five'); setCustomFullTitle(''); setSeriesNote(''); }}
                  style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal: Picker ── */}
        {modal === 'picker' && selectedTopic && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0800', border: '1px solid #443300', borderRadius: 20, padding: 20, width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ffaa44', marginBottom: 4, textAlign: 'center' }}>{selectedEmoji} {selectedTopic.name}</div>
              {selectedTopic.description && <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginBottom: 14 }}>{selectedTopic.description}</div>}
              <div style={{ fontSize: 10, color: '#777', marginBottom: 8 }}>EMOJI CHUNO</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setSelectedEmoji(e)}
                    style={{ fontSize: 22, padding: '6px 8px', borderRadius: 10, cursor: 'pointer', background: selectedEmoji === e ? 'rgba(255,170,0,0.2)' : '#1a1a1a', border: `1px solid ${selectedEmoji === e ? '#ffaa44' : '#333'}` }}>
                    {e}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={generateSeries} disabled={generating}
                  style={{ flex: 2, background: generating ? '#1a0800' : 'linear-gradient(135deg,#552200,#331100)', border: '1px solid #664400', color: '#ffaa44', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {generating ? <><div className="spinner" style={{ borderTopColor: '#ffaa44', width: 16, height: 16 }} />Generating...</> : '🤖 Generate Karo'}
                </button>
                <button onClick={() => setModal('none')} style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Folder List ── */}
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ffaa44' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Loading...</div>
          </div>
        ) : seriesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi GK series nahi hai</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Nayi" se banao</div>
          </div>
        ) : sortedFolders.map(type => {
          const seriesInFolder = grouped[type];
          const folder = getFolder(type);
          const uploadedCount = seriesInFolder.filter(s => checkUploaded(s) === true).length;
          const canContinue = seriesInFolder.find(s => !hasNextPart(s, seriesList));
          return (
            <div key={type} onClick={() => setOpenFolder(type)}
              style={{ background: '#0d0d0d', border: `1px solid ${folder.color}44`, borderRadius: 16, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 15% 50%, ${folder.color}0f 0%, transparent 65%)`, pointerEvents: 'none' }} />
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${folder.color}1a`, border: `1px solid ${folder.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{folder.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: folder.color, marginBottom: 3 }}>{folder.label}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{seriesInFolder.length} series • {uploadedCount} uploaded</div>
                {canContinue && !ytLoading && (
                  <div style={{ fontSize: 10, color: '#ffaa44', fontWeight: 700, marginTop: 4, background: 'rgba(255,170,0,0.08)', border: '1px solid #443300', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                    ✨ Part {(canContinue.part || 1) + 1} ban sakta hai
                  </div>
                )}
              </div>
              <span style={{ fontSize: 22, color: `${folder.color}66` }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GKSeriesWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <GKSeriesPage user={user} />}</AuthWrapper></ToastProvider>;
}

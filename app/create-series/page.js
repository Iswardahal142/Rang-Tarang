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
  if (n.includes('bird')) return 'animal';
  if (n.includes('animal') || n.includes('wild') || n.includes('domestic') || n.includes('farm')) return 'animal';
  if (n.includes('insect') || n.includes('bug')) return 'animal';
  if (n.includes('fish') || n.includes('sea') || n.includes('ocean') || n.includes('water') || n.includes('aquatic')) return 'animal';
  if (n.includes('alphabet') || n.includes(' abc') || n.includes('letter')) return 'alphabet';
  if (n.includes('shape')) return 'shape';
  if (n.includes('vegetable') || n.includes('veggie') || n.includes('sabzi') || n.includes('sabziyon')) return 'vegetable';
  return 'general';
}

// ── Hindi category word for specific question ────────────
function getHindiCategoryWord(seriesName) {
  const n = (seriesName || '').toLowerCase();
  if (n.includes('flower'))                                                                                    return 'flower';
  if (n.includes('insect') || n.includes('bug'))                                                              return 'insect';
  if (n.includes('fish') || n.includes('sea') || n.includes('ocean') || n.includes('water') || n.includes('aquatic')) return 'water animal';
  if (n.includes('bird'))                                                                                      return 'bird';
  if (n.includes('wild') || n.includes('forest') || n.includes('domestic') || n.includes('pet') || n.includes('farm') || n.includes('animal')) return 'animal';
  if (n.includes('fruit'))                                                                                     return 'fruit';
  if (n.includes('vegetable') || n.includes('veggie') || n.includes('sabzi'))                                 return 'vegetable';
  if (n.includes('color') || n.includes('colour'))                                                            return 'colour';
  if (n.includes('shape'))                                                                                     return 'shape';
  if (n.includes('alphabet') || n.includes('abc') || n.includes('letter'))                                    return 'letter';
  if (n.includes('number') || n.includes('ginti'))                                                            return 'number';
  if (n.includes('tree'))                                                                                      return 'tree';
  if (n.includes('sport'))                                                                                     return 'sport';
  if (n.includes('vehicle') || n.includes('transport'))                                                       return 'vehicle';
  if (n.includes('food'))                                                                                      return 'food';
  return 'चीज़';
}

// ── Folder config ────────────────────────────────────────
const FOLDER_CONFIG = {
  number:    { label: 'Numbers',    emoji: '🔢', color: '#4488ff' },
  animal:    { label: 'Animals',    emoji: '🐾', color: '#ff8800' },
  fruit:     { label: 'Fruits',     emoji: '🍎', color: '#ff4488' },
  vegetable: { label: 'Vegetables', emoji: '🥦', color: '#44bb66' },
  color:     { label: 'Colors',     emoji: '🌈', color: '#cc88ff' },
  alphabet:  { label: 'Alphabets',  emoji: '🔤', color: '#00ccbb' },
  shape:     { label: 'Shapes',     emoji: '🔷', color: '#ffcc00' },
  general:   { label: 'flowers',      emoji: '🌺', color: '#888888' },
};

function groupSeriesByFolder(seriesList) {
  const groups = {};
  seriesList.forEach(s => {
    const type = getSeriesType(s.name);
    if (!groups[type]) groups[type] = [];
    groups[type].push(s);
  });
  return groups;
}

function buildIntroImagePrompt(seriesName, items = []) {
  const first3 = items.slice(0, 3);
  const positions = ['bottom left', 'bottom center', 'bottom right'];
  const shuffled = positions.sort(() => Math.random() - 0.5);
  const itemsDesc = first3.length > 0
    ? first3.map((item, i) => `${item.name} (${item.object}) at ${shuffled[i]}`).join(', ')
    : 'colorful educational items at bottom';
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, waving hand with excited expression. Bold glowing text "${seriesName}" floating center with colorful sparkles. Show 3 big Pixar 3D cartoon items at bottom: ${itemsDesc}. 9:16 vertical. Pixar style. No other text.`;
}

function buildIntroVideoPrompt(n, part = 1, items = []) {
  const partMention = part > 1 ? ` — यह है part ${part}` : '';
  const firstItem = items?.[0]?.name || '';
  const objectLine = firstItem ? `Teacher bends down, picks up a big ${firstItem} from the bottom, stands back up holding it and shows it to camera excitedly.` : '';
  return `Use reference image exactly as background scene. Teacher standing center, smiling, waving hand at camera. Teacher grabs the title text "${n}" with hand and slides it off screen to the right. ${objectLine} Teacher says in Hindi: "हेल्लो बच्चों! आज हम सीखेंगे ${n}${partMention} — चलो शुरू करते हैं!" 8 seconds. Smooth animation. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function buildOutroVideoPrompt(items = []) {
  const lastItem = items?.[items.length - 1]?.object || 'the object';
  return `Use reference image exactly as background scene. ${lastItem} floating on right side slowly fades out and disappears. Any text on screen also fades away completely. Screen is clean with only teacher visible. Teacher waves goodbye to camera with big smile, says in Hindi: "तो बच्चों, आज के लिए बस इतना ही — मिलते हैं अगले video में, टाटा!" 8 seconds. Smooth. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function buildVideoPrompt(item, seriesName, isFirstPart = true) {
  const type = getSeriesType(seriesName);
  const categoryWord = getHindiCategoryWord(seriesName);

  if (type === 'number') {
    const num = item.name;
    const hindiNum = item.hindiName || num;
    const q = isFirstPart ? `तो बताओ.. यह कौनसा ${categoryWord} है?` : `अब बताओ.. यह कौनसा ${categoryWord} है?`;
    const qText = `यह कौनसा ${categoryWord} है?`;
    return `Use reference image exactly as background scene. Teacher standing on left side pointing toward right. Big bold 3D bright golden yellow "${num}" — exactly the character shape, no face, no eyes — only two small cute legs at bottom and two small arms on sides — floating in air at center-right of screen, gently bobbing up and down. Teacher points to the ${num} curiously. Teacher asks in Hindi: "${q}". Bold rainbow gradient text "${qText}" visible at very bottom center — red, orange, yellow, green, blue, violet colors. Pause 2 seconds. Teacher softly touches the ${num}. Bottom text animates away and glowing bold rainbow text "यह ${num} है!" appears at same position. Answer text stays visible until the very last frame. Teacher says in Hindi: "यह ${hindiNum} है! बहुत अच्छे!" Teacher looks at camera, smiles and gives thumbs up. No "?" or question mark anywhere at any point in the video. No floating symbols above the object at any point. No background music. 10 seconds total. Smooth. No glitch. Teacher must lip sync Pure Hindi Indian accent audio only.`;
  }

  const q = isFirstPart
    ? `तो बताओ.. यह कौनसा ${categoryWord} है?`
    : `अब बताओ.. यह कौनसा ${categoryWord} है?`;
  const qText = `यह कौनसा ${categoryWord} है?`;

  return `Use reference image exactly as background scene. Teacher standing on left side pointing toward right. Big Pixar 3D animated ${item.name} (${item.object}) floating in air at center-right of screen, gently bobbing up and down. Object is large and clearly visible — not small. No walking, no entry animation — object already floating when scene starts. Teacher points to the ${item.name} curiously. Teacher asks in Hindi: "${q}". Bold rainbow gradient text "${qText}" visible at very bottom center — red, orange, yellow, green, blue, violet colors. Pause 2 seconds. Bottom text animates away and glowing bold rainbow text "${item.name.toUpperCase()}" appears at same position with sparkle animation. Answer text stays visible until the very last frame. Teacher says in Hindi: "यह ${item.name} है! बहुत अच्छे!" Teacher looks at camera, smiles and gives thumbs up. No "?" or question mark anywhere at any point in the video. No floating symbols above the object at any point. No background music. 8 seconds total. Smooth animation. No glitch. Teacher must lip sync Pure Hindi Indian accent audio only.`;
}

const hindiNumbers = {
  1:'वन',2:'टू',3:'थ्री',4:'फोर',5:'फाइव',
  6:'सिक्स',7:'सेवन',8:'एट',9:'नाइन',10:'टेन',
  11:'इलेवन',12:'ट्वेल्व',13:'थर्टीन',14:'फोर्टीन',15:'फिफ्टीन',
  16:'सिक्सटीन',17:'सेवेंटीन',18:'एटीन',19:'नाइनटीन',20:'ट्वेंटी',
  21:'ट्वेंटी-वन',22:'ट्वेंटी-टू',23:'ट्वेंटी-थ्री',24:'ट्वेंटी-फोर',
  25:'ट्वेंटी-फाइव',26:'ट्वेंटी-सिक्स',27:'ट्वेंटी-सेवन',28:'ट्वेंटी-एट',
  29:'ट्वेंटी-नाइन',30:'थर्टी',31:'थर्टी-वन',32:'थर्टी-टू',
  33:'थर्टी-थ्री',34:'थर्टी-फोर',35:'थर्टी-फाइव',36:'थर्टी-सिक्स',
  37:'थर्टी-सेवन',38:'थर्टी-एट',39:'थर्टी-नाइन',40:'फोर्टी',
  41:'फोर्टी-वन',42:'फोर्टी-टू',43:'फोर्टी-थ्री',44:'फोर्टी-फोर',
  45:'फोर्टी-फाइव',46:'फोर्टी-सिक्स',47:'फोर्टी-सेवन',48:'फोर्टी-एट',
  49:'फोर्टी-नाइन',50:'फिफ्टी',51:'फिफ्टी-वन',52:'फिफ्टी-टू',
  53:'फिफ्टी-थ्री',54:'फिफ्टी-फोर',55:'फिफ्टी-फाइव',56:'फिफ्टी-सिक्स',
  57:'फिफ्टी-सेवन',58:'फिफ्टी-एट',59:'फिफ्टी-नाइन',60:'सिक्सटी',
  61:'सिक्सटी-वन',62:'सिक्सटी-टू',63:'सिक्सटी-थ्री',64:'सिक्सटी-फोर',
  65:'सिक्सटी-फाइव',66:'सिक्सटी-सिक्स',67:'सिक्सटी-सेवन',68:'सिक्सटी-एट',
  69:'सिक्सटी-नाइन',70:'सेवेंटी',71:'सेवेंटी-वन',72:'सेवेंटी-टू',
  73:'सेवेंटी-थ्री',74:'सेवेंटी-फोर',75:'सेवेंटी-फाइव',76:'सेवेंटी-सिक्स',
  77:'सेवेंटी-सेवन',78:'सेवेंटी-एट',79:'सेवेंटी-नाइन',80:'एटी',
  81:'एटी-वन',82:'एटी-टू',83:'एटी-थ्री',84:'एटी-फोर',
  85:'एटी-फाइव',86:'एटी-सिक्स',87:'एटी-सेवन',88:'एटी-एट',
  89:'एटी-नाइन',90:'नाइंटी',91:'नाइंटी-वन',92:'नाइंटी-टू',
  93:'नाइंटी-थ्री',94:'नाइंटी-फोर',95:'नाइंटी-फाइव',96:'नाइंटी-सिक्स',
  97:'नाइंटी-सेवन',98:'नाइंटी-एट',99:'नाइंटी-नाइन',100:'हंड्रेड'
};

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

async function detectEmoji(seriesName) {
  const text = await aiCall(`Given this kids YouTube series name: "${seriesName}"
Return ONLY a single most appropriate emoji for this topic. No explanation, no text, just one emoji.`);
  return text.trim().replace(/[^a-zA-Z\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}]/gu, '').slice(0, 2) || '🌟';
}

function CreateSeriesPage({ user }) {
  const toast = useToast();
  const [seriesList, setSeriesList]         = useState([]);
  const [loadingList, setLoadingList]       = useState(true);
  const [openSeries, setOpenSeries]         = useState(null);
  const [openSection, setOpenSection]       = useState(null);
  const [copiedKey, setCopiedKey]           = useState('');
  const [ytVideos, setYtVideos]             = useState([]);
  const [continuing, setContinuing]         = useState(false);
  const [genTD, setGenTD]                   = useState(false);
  const [openFolders, setOpenFolders]       = useState({});
  const [modal, setModal]                   = useState('none');
  const [suggestions, setSuggestions]       = useState([]);
  const [sugLoading, setSugLoading]         = useState(false);
  const [selectedTopic, setSelectedTopic]   = useState(null);
  const [customName, setCustomName]         = useState('');
  const [selectedEmoji, setSelectedEmoji]   = useState('🌟');
  const [selectedColor, setSelectedColor]   = useState('#ff4400');
  const [generating, setGenerating]         = useState(false);
  const [ytLoading, setYtLoading]           = useState(true);

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

  function toggleFolder(type) {
    setOpenFolders(prev => ({ ...prev, [type]: !prev[type] }));
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

  async function selectSuggestion(topic) {
    const detectedEmoji = await detectEmoji(topic.name);
    setSelectedEmoji(detectedEmoji);
    setSelectedTopic({ ...topic, emoji: detectedEmoji });
    setModal('picker');
  }

  async function submitCustom() {
    if (!customName.trim()) { toast('⚠️ Naam likho!'); return; }
    const detectedEmoji = await detectEmoji(customName.trim());
    setSelectedEmoji(detectedEmoji);
    setSelectedTopic({ name: customName.trim(), emoji: detectedEmoji, description: '' });
    setModal('picker');
  }

  async function generateSeries() {
    if (!selectedTopic) return;
    setGenerating(true);
    try {
      const existing = seriesList.map(s => s.name).join(', ');
      const text = await aiCall(`Generate exactly 10 unique items for English learning kids YouTube series about "${selectedTopic.name}".\nAvoid overlap with: ${existing}\nReturn ONLY JSON array, no markdown: [{"name":"English Name","object":"One [adjective] [item] description for Pixar 3D animation"}]`);
      const items = JSON.parse(text.replace(/\`\`\`json|\`\`\`/g, '').trim());
      if (getSeriesType(selectedTopic.name) === 'number') {
        items.forEach(item => {
          const n = parseInt(item.name);
          if (!isNaN(n)) item.hindiName = hindiNumbers[n] || item.name;
        });
      }
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
      if (getSeriesType(series.name) === 'number') {
        newItems.forEach(item => {
          const n = parseInt(item.name);
          if (!isNaN(n)) item.hindiName = hindiNumbers[n] || item.name;
        });
      }
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

Return ONLY JSON, no markdown: {"title":"...","description":"..."}`);
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

    const sections = [
      { key: 'intro', title: '🎬 Intro', color: '#4488ff', prompts: [
        { type: '🖼 IMAGE', text: buildIntroImagePrompt(s.name, s.items || []) },
        { type: '🎬 VIDEO', text: buildIntroVideoPrompt(s.name, s.part || 1, s.items || []) }
      ]},
      ...(s.items || []).map((item, i) => ({
        key: `item_${i}`,
        title: `${i+1}. ${item.name}`,
        color: s.color,
        prompts: [{ type: '🎬 VIDEO', text: buildVideoPrompt(item, s.name, i === 0) }]
      })),
      { key: 'outro', title: '🎤 Outro', color: '#cc88ff', prompts: [
        { type: '🎬 VIDEO', text: buildOutroVideoPrompt(s.items || []) }
      ]},
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenSeries(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{s.emoji} {s.name}</span>
          {isUploaded ? (
            <span style={{ fontSize: 18, opacity: 0.25, cursor: 'not-allowed' }}>🗑</span>
          ) : (
            <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>
          )}
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

          <TitleDescSection
            series={s} allPromptsDone={allPromptsDone} hasTitleDesc={hasTitleDesc}
            genTD={genTD} onGenerate={() => generateTitleDesc(s)}
            onSave={(title, desc) => saveTitleDesc(s, title, desc)}
            onCopy={copy} copiedKey={copiedKey}
          />

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

  // ── LIST VIEW with 2-LEVEL FOLDERS ───────────────────
  const grouped = groupSeriesByFolder(seriesList);
  const folderOrder = ['number','animal','fruit','vegetable','color','alphabet','shape','general'];

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#cc88ff', fontSize: 14, fontWeight: 700 }}>🎬 Series</span>
        {ytLoading ? (
          <button disabled style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#444', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 }}>+ Nayi</button>
        ) : (() => {
          const hasUnuploaded = seriesList.some(s => checkUploaded(s) === false);
          return hasUnuploaded ? (
            <button onClick={() => toast('⚠️ Pehle purani series upload karo!')} style={{ background: '#333', border: 'none', color: '#666', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.6 }}>+ Nayi</button>
          ) : (
            <button onClick={openChoose} style={{ background: '#cc88ff', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nayi</button>
          );
        })()}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

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

        {modal === 'custom' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d000d', border: '1px solid #440044', borderRadius: 20, padding: 20, width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#cc88ff', marginBottom: 16, textAlign: 'center' }}>✏️ Custom Series</div>
              <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Series ka naam (e.g. Wild Animals, Flowers...)" maxLength={30}
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

        {/* ── 2-LEVEL FOLDER LIST ── */}
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#cc88ff' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Loading...</div>
          </div>
        ) : seriesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi series nahi hai</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Nayi" se banao</div>
          </div>
        ) : folderOrder.filter(type => grouped[type]?.length > 0).map(type => {
          const folder = FOLDER_CONFIG[type];
          const seriesInFolder = grouped[type];
          const isFolderOpen = openFolders[type] !== false;

          return (
            <div key={type} style={{ background: '#0d0d0d', border: `1px solid ${folder.color}33`, borderRadius: 14, overflow: 'hidden' }}>

              {/* Level 1: Category */}
              <div onClick={() => toggleFolder(type)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 14px', cursor: 'pointer', background: `${folder.color}0d` }}>
                <span style={{ fontSize: 22 }}>{folder.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: folder.color }}>{folder.label}</div>
                  <div style={{ fontSize: 10, color: '#555', marginTop: 1 }}>{seriesInFolder.length} series</div>
                </div>
                <span style={{ fontSize: 12, color: '#555', fontWeight: 700 }}>{isFolderOpen ? '▲' : '▼'}</span>
              </div>

              {/* Level 2: Series */}
              {isFolderOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${folder.color}22` }}>
                  {seriesInFolder.map(s => {
                    const total = (s.items || []).length + 2;
                    const uploaded = checkUploaded(s);
                    const uploadColor = uploaded===true ? '#44bb66' : uploaded==='scheduled' ? '#4488ff' : uploaded==='private' ? '#cc88ff' : uploaded===false ? '#ff8866' : '#555';
                    const uploadText = ytLoading ? '🔍...' : uploaded===true ? '✅ YouTube pe hai' : uploaded==='scheduled' ? '📅 Scheduled' : uploaded==='private' ? '🔒 Private' : '⏳ Upload baaki';

                    return (
                      <div key={s.id} onClick={() => setOpenSeries(s)} style={{ borderLeft: `3px solid ${s.color}`, margin: '4px 8px', borderRadius: 10, background: '#111', cursor: 'pointer', padding: '11px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 20 }}>{s.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#eee', marginBottom: 2 }}>{s.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                            <span style={{ fontSize: 10, color: '#555' }}>{s.doneCount||0}/{total}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: uploadColor }}>{uploadText}</span>
                          </div>
                          <div style={{ height: 3, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: (s.progress||0)+'%', background: s.color, borderRadius: 3 }} />
                          </div>
                        </div>
                        <span style={{ fontSize: 14, color: '#444' }}>›</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Title & Description Sub-Component ────────────────────
function TitleDescSection({ series, allPromptsDone, hasTitleDesc, genTD, onGenerate, onSave, onCopy, copiedKey }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(series.ytTitle || '');
  const [desc, setDesc]       = useState(series.ytDescription || '');

  useEffect(() => {
    setTitle(series.ytTitle || '');
    setDesc(series.ytDescription || '');
  }, [series.ytTitle, series.ytDescription]);

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
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video ka title..."
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={() => onCopy('ytTitle', title)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey==='ytTitle' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey==='ytTitle' ? '#44bb66' : '#333'}`, color: copiedKey==='ytTitle' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey==='ytTitle' ? '✅' : '📋'}</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>📄 YouTube Description</div>
            <div style={{ position: 'relative' }}>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Video ki description..." rows={4}
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

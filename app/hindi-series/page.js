// 📁 LOCATION: app/hindi-series/page.js
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
  const snap = await getDocs(query(collection(db, 'users', uid, 'rt_hindi_series'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveSeries(uid, data) {
  return addDoc(collection(getDB(), 'users', uid, 'rt_hindi_series'), { ...data, createdAt: serverTimestamp() });
}
async function updateSeries(uid, id, data) {
  await updateDoc(doc(getDB(), 'users', uid, 'rt_hindi_series', id), data);
}
async function deleteSeries(uid, id) {
  await deleteDoc(doc(getDB(), 'users', uid, 'rt_hindi_series', id));
}

// ── Series Type Detect ──
function getSeriesType(seriesName) {
  const n = (seriesName || '').toLowerCase();
  if (n.includes('फूल') || n.includes('flower'))                return 'flower';
  if (n.includes('त्योहार') || n.includes('festival'))          return 'festival';
  if (n.includes('संख्या') || n.includes('गिनती') || n.includes('number')) return 'number';
  if (n.includes('रंग') || n.includes('color'))                 return 'color';
  if (n.includes('फल') || n.includes('fruit'))                  return 'fruit';
  if (n.includes('वर्णमाला') || n.includes('alphabet'))         return 'alphabet';
  if (n.includes('आकार') || n.includes('shape'))                return 'shape';
  if (n.includes('सब्जी') || n.includes('vegetable'))           return 'vegetable';
  if (n.includes('शरीर') || n.includes('body'))                 return 'body';
  if (n.includes('वाहन') || n.includes('vehicle'))              return 'vehicle';
  if (n.includes('खाना') || n.includes('food'))                 return 'food';
  if (n.includes('खेल') || n.includes('sport'))                 return 'sport';
  if (n.includes('वाद्य') || n.includes('instrument'))          return 'instrument';
  if (n.includes('अंतरिक्ष') || n.includes('ग्रह') || n.includes('space')) return 'space';
  if (n.includes('मौसम') || n.includes('weather'))              return 'weather';
  if (n.includes('कीट') || n.includes('insect'))                return 'insect';
  if (n.includes('पक्षी') || n.includes('bird'))                return 'bird';
  if (n.includes('जलज') || n.includes('समुद्र') || n.includes('water')) return 'water_animal';
  if (n.includes('जंगली') || n.includes('wild'))                return 'wild_animal';
  if (n.includes('पालतू') || n.includes('domestic'))            return 'domestic_animal';
  if (n.includes('जानवर') || n.includes('animal'))              return 'wild_animal';
  return 'other';
}

const KNOWN_FOLDERS = {
  number:          { label: 'संख्याएं',        emoji: '🔢', color: '#4488ff' },
  wild_animal:     { label: 'जंगली जानवर',     emoji: '🦁', color: '#ff6600' },
  domestic_animal: { label: 'पालतू जानवर',     emoji: '🐄', color: '#ffaa44' },
  water_animal:    { label: 'जलज प्राणी',      emoji: '🐟', color: '#44bbff' },
  bird:            { label: 'पक्षी',           emoji: '🐦', color: '#ff6644' },
  insect:          { label: 'कीट पतंगे',       emoji: '🐛', color: '#88cc44' },
  fruit:           { label: 'फल',             emoji: '🍎', color: '#ff4488' },
  vegetable:       { label: 'सब्जियां',        emoji: '🥦', color: '#44bb66' },
  color:           { label: 'रंग',            emoji: '🌈', color: '#cc88ff' },
  alphabet:        { label: 'वर्णमाला',        emoji: '🔤', color: '#00ccbb' },
  shape:           { label: 'आकार',           emoji: '🔷', color: '#ffcc00' },
  flower:          { label: 'फूल',            emoji: '🌺', color: '#ff88aa' },
  festival:        { label: 'त्योहार',         emoji: '🎉', color: '#ff44aa' },
  vehicle:         { label: 'वाहन',           emoji: '🚗', color: '#44ccff' },
  food:            { label: 'खाना',           emoji: '🍕', color: '#ffaa44' },
  sport:           { label: 'खेल',            emoji: '⚽', color: '#88ff44' },
  body:            { label: 'शरीर के अंग',    emoji: '🫀', color: '#ff6644' },
  instrument:      { label: 'वाद्य यंत्र',    emoji: '🎵', color: '#aa88ff' },
  space:           { label: 'अंतरिक्ष',        emoji: '🚀', color: '#4444ff' },
  weather:         { label: 'मौसम',           emoji: '⛅', color: '#44bbff' },
};

function getFolder(type, seriesList = []) {
  if (KNOWN_FOLDERS[type]) return KNOWN_FOLDERS[type];
  const sample = seriesList.find(s => (s.type || getSeriesType(s.name)) === type && s.folderLabel);
  if (sample) return { label: sample.folderLabel, emoji: sample.folderEmoji || '📦', color: sample.folderColor || '#888888' };
  const label = type.replace(/_/g, ' ');
  const colors = ['#ff6644','#44bbff','#ffaa44','#cc88ff','#44bb66','#ff4488','#4488ff','#ffcc00'];
  const idx = type.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return { label, emoji: '📦', color: colors[idx] };
}

function groupSeriesByFolder(seriesList) {
  const groups = {};
  seriesList.forEach(s => {
    const key = s.folderLabel || s.type || getSeriesType(s.name);
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
}

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

// ── Prompt Builders ──
function buildIntroImagePrompt(seriesName, items = []) {
  const first3 = items.slice(0, 3);
  const positions = ['bottom left', 'bottom center', 'bottom right'];
  const shuffled = positions.sort(() => Math.random() - 0.5);
  const itemsDesc = first3.length > 0
    ? first3.map((item, i) => `${item.name} (${item.object}) at ${shuffled[i]}`).join(', ')
    : 'colorful educational items at bottom';
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, waving hand with excited expression. Bold glowing text "${seriesName}" floating center with colorful sparkles. Show 3 big Pixar 3D cartoon items at bottom: ${itemsDesc}. 9:16 vertical. Pixar style. No other text. Ultra high quality. 8K resolution. Sharp details. Cinematic lighting. Professional render.`;
}

const INTRO_ANIMATIONS = [
  { id: 'slide_right', label: 'Slide Right',    emoji: '👉', desc: 'Teacher grabs title and slides it off screen to the right dramatically.' },
  { id: 'slide_left',  label: 'Slide Left',     emoji: '👈', desc: 'Teacher grabs title and slides it off screen to the left with a spin.' },
  { id: 'slide_up',    label: 'Slide Up',       emoji: '⬆️', desc: 'Teacher pushes title upward with both hands — it flies off screen to the top.' },
  { id: 'slide_down',  label: 'Slide Down',     emoji: '⬇️', desc: 'Teacher pushes title downward — it slides off screen to the bottom.' },
  { id: 'jump_push',   label: 'Jump Push',      emoji: '🦘', desc: 'Teacher does a big jump and pushes the title upward — title flies off screen.' },
  { id: 'kick',        label: 'Big Kick',       emoji: '🦵', desc: 'Teacher runs toward title, does a big kick and sends it flying off screen.' },
  { id: 'magic_wand',  label: 'Magic Wand',     emoji: '🪄', desc: 'Teacher waves a magic wand — title sparkles and disappears in a poof of stars.' },
  { id: 'shatter',     label: 'Shatter',        emoji: '💥', desc: 'Teacher taps title with one finger — it shatters into colorful pieces and disappears.' },
  { id: 'blow_away',   label: 'Blow Away',      emoji: '💨', desc: 'Teacher blows a big puff of air toward title — it wobbles and flies off screen like wind.' },
  { id: 'rocket',      label: 'Rocket Launch',  emoji: '🚀', desc: 'Teacher attaches tiny rocket to title — it launches off screen with fire trail.' },
  { id: 'random',      label: 'Random',         emoji: '🎲', desc: 'Different animation every time — surprise!' },
];

function buildIntroVideoPrompt(seriesName, part = 1, items = [], animationId = 'random') {
  const baseName = seriesName.replace(/ Part \d+$/, '').trim();
  const partMention = part > 1 ? ` — यह है भाग ${part}` : '';
  const firstItem = items?.[0]?.name || '';
  const objectLine = firstItem ? `Teacher bends down, picks up a big ${firstItem} from the bottom, stands back up holding it and shows it to camera excitedly.` : '';
  let anim = INTRO_ANIMATIONS.find(a => a.id === animationId);
  if (!anim || anim.id === 'random') {
    const nonRandom = INTRO_ANIMATIONS.filter(a => a.id !== 'random');
    anim = nonRandom[Math.floor(Math.random() * nonRandom.length)];
  }
  return `Use reference image exactly as background scene. Teacher standing center, smiling, waving hand at camera. ${anim.desc.replace('title', `title text "${baseName}"`)} ${objectLine} Teacher says in Hindi: "हेल्लो बच्चों! आज हम सीखेंगे ${baseName}${partMention} — चलो शुरू करते हैं!" 8 seconds. Smooth animation. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function buildOutroVideoPrompt(items = []) {
  const last = items?.[items.length - 1];
  const lastName = last?.name || 'the object';
  const lastObj = (last?.object || last?.name || '').toLowerCase();
  const isAnimal = ['जानवर','शेर','हाथी','बंदर','हिरण','खरगोश','मेंढक','मछली','सांप','मगरमच्छ','tiger','lion','elephant','giraffe','dog','cat','horse','cow','monkey','bear','rabbit','frog','fish','snake'].some(w => lastObj.includes(w));
  const isBird = ['पक्षी','तोता','कबूतर','मोर','bird','parrot','peacock','sparrow','eagle','owl','crow'].some(w => lastObj.includes(w));
  const isHeavy = ['कार','बस','ट्रक','ट्रेन','car','truck','bus','train','boat','ship'].some(w => lastObj.includes(w));
  let outroAction = '';
  if (isBird) outroAction = `Teacher gently picks up the last ${lastName} with both hands carefully, lifts it toward the open window, and softly releases it — the bird flaps its wings and flies away off screen.`;
  else if (isAnimal) outroAction = `Teacher gives the last ${lastName} a gentle friendly push — the animal happily walks away and exits the screen.`;
  else if (isHeavy) outroAction = `Teacher gives the last ${lastName} a big push with both hands — it rolls or drives away slowly and exits the screen.`;
  else outroAction = `Teacher picks up the last ${lastName} with both hands, carries it to the side, and places it neatly off screen. Teacher comes back to center, dusts hands and smiles at camera.`;
  return `Use reference image exactly as background scene. Any text on screen fades away completely. ${outroAction} Screen is clean with only teacher visible at center. Teacher waves goodbye to camera with big smile and says in Hindi: "तो बच्चों, आज के लिए बस इतना ही — मिलते हैं अगले video में, टाटा!" 10 seconds. Smooth. No floating objects. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function cleanObjectDesc(obj) {
  return (obj || '')
    .replace(/lounging\s+under.*$/i,'').replace(/standing\s+in\s+.*$/i,'').replace(/sitting\s+on\s+.*$/i,'')
    .replace(/in\s+the\s+(jungle|savanna|ocean|forest|sky|field|farm|desert|river|lake|sea|grass|meadow|kitchen|room|park).*/i,'')
    .replace(/on\s+(a\s+)?(table|chair|ground|floor|branch|tree|rock|hill|mountain|grass).*/i,'')
    .replace(/under\s+(a\s+)?\w+.*/i,'').replace(/near\s+.*$/i,'').replace(/\s{2,}/g,' ').trim();
}

function isLargeObject(objectName) {
  const o = (objectName || '').toLowerCase();
  return ['car','truck','bus','boat','ship','train','tractor','elephant','giraffe','horse','cow','camel','lion','tiger','bear','sofa','table','refrigerator','bicycle','bike','motorcycle'].some(w => o.includes(w));
}

function buildItemImagePrompt(item) {
  const cleanObj = cleanObjectDesc(item.object) || item.name;
  const large = isLargeObject(item.object || item.name);
  const placement = large
    ? `Big Pixar 3D cartoon ${item.name} (${cleanObj}) placed on the floor at center-right of screen. Large and clearly visible.`
    : `Teacher holding up a big Pixar 3D cartoon ${item.name} (${cleanObj}) in both hands toward camera, showing it clearly. Object is large and clearly visible.`;
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center-left, smiling excitedly. ${placement} 9:16 vertical. Pixar style. No other text. No "?" anywhere. Ultra high quality. Sharp details. Cinematic lighting.`;
}

function buildVideoPrompt(item, seriesName, isFirstPart = true) {
  const q = isFirstPart ? `तो बताओ.. यह क्या है?` : `अब बताओ.. यह क्या है?`;
  const qText = `यह क्या है?`;
  const cleanObj = cleanObjectDesc(item.object) || item.name;
  const objLower = (item.object || item.name || '').toLowerCase();
  const isBird = ['पक्षी','तोता','कबूतर','मोर','bird','parrot','peacock','sparrow','eagle','owl','crow'].some(w => objLower.includes(w));
  const isAnimal = !isBird && ['जानवर','शेर','हाथी','बंदर','tiger','lion','elephant','dog','cat','horse','cow','monkey','bear','rabbit','frog','fish','snake'].some(w => objLower.includes(w));
  const isHeavy = ['कार','बस','ट्रक','ट्रेन','car','truck','bus','train','boat','airplane','bicycle','bike'].some(w => objLower.includes(w));
  const isSmall = !isBird && !isAnimal && !isHeavy && !isLargeObject(item.object || item.name);
  let placementDesc = '', teacherAction = '';
  if (isBird) {
    placementDesc = `Big Pixar 3D animated ${item.name} (${cleanObj}) standing on the floor at center-right. Bird is large and clearly visible. No floating. No flying.`;
    teacherAction = `Teacher points to the ${item.name} with one finger curiously while asking`;
  } else if (isAnimal) {
    placementDesc = `Big Pixar 3D animated ${item.name} (${cleanObj}) sitting naturally on the floor at center-right. Large and clearly visible.`;
    teacherAction = `Teacher walks toward the ${item.name} and softly touches it while asking`;
  } else if (isHeavy) {
    placementDesc = `Big Pixar 3D animated ${item.name} (${cleanObj}) parked on the floor at center-right. Large and clearly visible. No floating.`;
    teacherAction = `Teacher walks to the ${item.name}, places hand on it proudly while asking`;
  } else if (isSmall) {
    placementDesc = `Teacher holding up a big Pixar 3D cartoon ${item.name} (${cleanObj}) in both hands toward camera clearly.`;
    teacherAction = `Teacher holds the ${item.name} up toward camera and looks at it curiously while asking`;
  } else {
    placementDesc = `Big Pixar 3D animated ${item.name} (${cleanObj}) placed on the floor at center-right. Large and clearly visible.`;
    teacherAction = `Teacher walks toward the ${item.name} and softly touches it while asking`;
  }
  return `Use reference image exactly as background scene. Teacher standing on left side. ${placementDesc} ${teacherAction} in Hindi: "${q}". Bold rainbow gradient text "${qText}" visible at very bottom center — red, orange, yellow, green, blue, violet colors. Pause 2 seconds. Bottom text animates away and glowing bold rainbow text "${item.name.toUpperCase()}" appears at same position with sparkle animation — only the name, nothing else. Answer text stays visible until the very last frame. Teacher says in Hindi: "यह ${item.name} है! चलो साथ में बोलो — ${item.name}! बहुत अच्छे!" Teacher looks at camera, smiles and gives thumbs up. No "?" anywhere. No background music. 10 seconds total. Smooth. No glitch. Hindi audio only. Teacher must lip sync.`;
}

const COLORS = ['#ff4400','#44bb66','#4488ff','#cc88ff','#ff8800','#ff4488','#00ccbb','#ffcc00'];
const EMOJIS = ['🍎','🔢','🌈','🐾','🥦','🚗','🎵','🏠','🌟','🦁','📚','⚽','🌺','🦋','🍕'];
const ANIM_PER_PAGE = 6;

async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 800, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function detectEmoji(seriesName) {
  const text = await aiCall(`Given this Hindi kids YouTube series name: "${seriesName}" Return ONLY a single most appropriate emoji. No explanation, just one emoji.`);
  return text.trim().replace(/[^a-zA-Z\u{1F000}-\u{1FFFF}\u{2600}-\u{27FF}]/gu, '').slice(0, 2) || '🌟';
}

// ── TitleDescSection ──
function TitleDescSection({ series, allPromptsDone, hasTitleDesc, genTD, onGenerate, onSave, onCopy, copiedKey, isUploaded, matchedVideoId, matchedCategoryId }) {
  const toast = useToast();
  const [title, setTitle] = useState(series.ytTitle || '');
  const [desc, setDesc]   = useState(series.ytDescription || '');
  const [tags, setTags]   = useState(series.ytTags || '');
  const [openField, setOpenField] = useState(null);
  const [regenTitle, setRegenTitle] = useState(false);
  const [regenDesc,  setRegenDesc]  = useState(false);
  const [regenTags,  setRegenTags]  = useState(false);
  const [savingTitle, setSavingTitle] = useState(false);
  const [savingDesc,  setSavingDesc]  = useState(false);
  const [savingTags,  setSavingTags]  = useState(false);
  const [statusTitle, setStatusTitle] = useState('idle');
  const [statusDesc,  setStatusDesc]  = useState('idle');
  const [statusTags,  setStatusTags]  = useState('idle');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setTitle(series.ytTitle || '');
    setDesc(series.ytDescription || '');
    setTags(series.ytTags || '');
  }, [series.ytTitle, series.ytDescription, series.ytTags]);

  async function regenField(field) {
    const setRegen = field === 'title' ? setRegenTitle : field === 'desc' ? setRegenDesc : setRegenTags;
    setRegen(true);
    try {
      const baseName = series.name.replace(/ Part \d+$/, '').trim();
      const partText = (series.part || 1) > 1 ? ` भाग ${series.part}` : '';
      const itemNames = (series.items || []).map(i => i.name).join(', ');
      let prompt = '';
      if (field === 'title') {
        prompt = `YouTube SEO expert for Hindi kids channel "Rang Tarang". Series: "${baseName}${partText}" Items: ${itemNames}. Generate ONE YouTube title. Pattern: "${baseName}${partText} | Rang Tarang". Max 60 chars. NO emoji. Return ONLY title text.`;
      } else if (field === 'desc') {
        prompt = `YouTube SEO expert for Hindi kids channel "Rang Tarang". Series: "${baseName}${partText}" Items: ${itemNames}. Generate YouTube description. Hook in Hindi, items list, subscribe link https://youtube.com/@RangTarangHindi, hashtags. Return ONLY description text.`;
      } else {
        prompt = `YouTube SEO expert for Hindi kids channel "Rang Tarang". Series: "${baseName}${partText}" Items: ${itemNames}. Generate 15 YouTube tags. Comma separated, mix Hindi+English. Return ONLY tags string.`;
      }
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 500, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || '').trim();
      if (field === 'title') { setTitle(text); setStatusTitle('idle'); }
      else if (field === 'desc') { setDesc(text); setStatusDesc('idle'); }
      else { setTags(text); setStatusTags('idle'); }
      toast(`🔄 ${field === 'title' ? 'Title' : field === 'desc' ? 'Description' : 'Tags'} regenerated!`);
    } catch (e) { toast('❌ ' + e.message); }
    setRegen(false);
  }

  async function ytUpdate(field, setSaving, setStatus) {
    if (!matchedVideoId) { toast('❌ VideoId nahi mila'); return; }
    setSaving(true); setStatus('saving');
    try {
      const res = await fetch('/api/audit', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: matchedVideoId, categoryId: matchedCategoryId || '22', title, description: desc, tags }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Update fail');
      onSave(title, desc, tags);
      setStatus('saved');
      toast(`✅ YouTube pe update ho gaya!`);
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e) { setStatus('error'); toast('❌ ' + e.message); setTimeout(() => setStatus('idle'), 3000); }
    setSaving(false);
  }

  const titleDirty = title !== (series.ytTitle || '');
  const descDirty  = desc  !== (series.ytDescription || '');
  const tagsDirty  = tags  !== (series.ytTags || '');

  function Badge({ status, dirty }) {
    if (status === 'saved') return <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.12)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>✅</span>;
    if (dirty) return <span style={{ fontSize: 9, background: 'rgba(255,170,0,0.1)', color: '#ffaa44', border: '1px solid #442200', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>●</span>;
    return null;
  }

  const fieldDefs = [
    { key: 'title', label: '📌 Title',       color: '#ff8800', badge: <Badge status={statusTitle} dirty={titleDirty} /> },
    { key: 'desc',  label: '📄 Description', color: '#4488ff', badge: <Badge status={statusDesc}  dirty={descDirty}  /> },
    { key: 'tags',  label: '🏷️ Tags',        color: '#44bb66', badge: <Badge status={statusTags}  dirty={tagsDirty}  /> },
  ];

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${hasTitleDesc ? '#1a3a2a' : '#2a1a00'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: hasTitleDesc ? '#44bb66' : '#ffaa44' }}>📝 Title & Description</span>
          {hasTitleDesc && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
          {!hasTitleDesc && <span style={{ fontSize: 9, background: 'rgba(255,170,0,0.1)', color: '#ffaa44', border: '1px solid rgba(255,170,0,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Zaroori</span>}
          {isUploaded && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.1)', color: '#44bb66', border: '1px solid #1a3a1a', padding: '2px 6px', borderRadius: 20, fontWeight: 700 }}>🔗</span>}
        </div>
        <span style={{ fontSize: 13, color: '#444' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ marginTop: 10, background: isUploaded ? 'rgba(68,136,255,0.07)' : 'rgba(255,170,0,0.06)', border: `1px solid ${isUploaded ? '#223355' : '#2a2000'}`, borderRadius: 10, padding: '9px 12px', fontSize: 10, color: isUploaded ? '#4466aa' : '#aa7700' }}>
            {isUploaded ? '🔗 Linked — Update dabao toh seedha YouTube pe jayega.' : '📋 Upload nahi hua — Copy karo → YouTube pe paste karo.'}
          </div>
          <button onClick={onGenerate} disabled={genTD}
            style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '10px', fontSize: 11, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {genTD ? <><div className="spinner" style={{ width: 13, height: 13, borderTopColor: '#ffaa44' }} />Generating...</> : '🤖 Generate All (Title + Desc + Tags)'}
          </button>
          {fieldDefs.map(({ key, label, color, badge }) => {
            const isFieldOpen = openField === key;
            const isRegen  = key === 'title' ? regenTitle  : key === 'desc' ? regenDesc  : regenTags;
            const isSaving = key === 'title' ? savingTitle : key === 'desc' ? savingDesc : savingTags;
            const isDirty  = key === 'title' ? titleDirty  : key === 'desc' ? descDirty  : tagsDirty;
            const status   = key === 'title' ? statusTitle : key === 'desc' ? statusDesc : statusTags;
            const setStatus = key === 'title' ? setStatusTitle : key === 'desc' ? setStatusDesc : setStatusTags;
            const setSaving = key === 'title' ? setSavingTitle : key === 'desc' ? setSavingDesc : setSavingTags;
            const copyKey  = key === 'title' ? 'ytTitle' : key === 'desc' ? 'ytDesc' : 'ytTags';
            const value    = key === 'title' ? title : key === 'desc' ? desc : tags;
            return (
              <div key={key} style={{ background: '#0a0a0a', border: `1px solid ${isDirty ? color + '44' : '#1e1e1e'}`, borderRadius: 10, overflow: 'hidden' }}>
                <div onClick={() => setOpenField(isFieldOpen ? null : key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color, fontWeight: 700 }}>{label}</span>
                    {badge}
                    {status === 'saved' && <span style={{ fontSize: 9, color: '#44bb66', fontWeight: 700 }}>✅ Updated</span>}
                  </div>
                  <span style={{ fontSize: 11, color: '#333' }}>{isFieldOpen ? '▲' : '▼'}</span>
                </div>
                {isFieldOpen && (
                  <div style={{ padding: '0 12px 12px', borderTop: '1px solid #111', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {key === 'title' ? (
                      <input value={title} onChange={e => { setTitle(e.target.value); setStatusTitle('idle'); }} placeholder="Video ka title..."
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${isDirty ? color + '66' : '#222'}`, color: '#eee', fontSize: 12, outline: 'none', padding: '8px 0', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                    ) : (
                      <textarea value={key === 'desc' ? desc : tags} onChange={e => { key === 'desc' ? setDesc(e.target.value) : setTags(e.target.value); key === 'desc' ? setStatusDesc('idle') : setStatusTags('idle'); }} rows={key === 'tags' ? 3 : 4}
                        style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: `1px solid ${isDirty ? color + '66' : '#222'}`, color: '#eee', fontSize: 12, outline: 'none', padding: '8px 0', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => regenField(key)} disabled={isRegen}
                        style={{ background: isRegen ? '#111' : '#0a0a1a', border: `1px solid ${isRegen ? '#333' : color + '55'}`, color: isRegen ? '#444' : color, borderRadius: 8, padding: '8px 10px', fontSize: 11, cursor: isRegen ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                        {isRegen ? <div className="spinner" style={{ width: 11, height: 11, borderTopColor: color }} /> : '🔄'}
                      </button>
                      <button onClick={() => onCopy(copyKey, value)}
                        style={{ flex: 1, background: copiedKey === copyKey ? 'rgba(68,187,102,0.15)' : '#111', border: `1px solid ${copiedKey === copyKey ? '#44bb66' : '#333'}`, color: copiedKey === copyKey ? '#44bb66' : '#666', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        {copiedKey === copyKey ? '✅ Copied!' : '📋 Copy'}
                      </button>
                      {isUploaded ? (
                        <button onClick={() => ytUpdate(label, setSaving, setStatus)} disabled={isSaving || !isDirty}
                          style={{ flex: 1, background: isSaving ? '#111' : isDirty ? 'linear-gradient(135deg,#0a1a44,#05102a)' : '#111', border: `1px solid ${isDirty ? '#4488ff' : '#222'}`, color: isSaving ? '#555' : isDirty ? '#4488ff' : '#333', borderRadius: 8, padding: '8px', fontSize: 11, fontWeight: 700, cursor: isSaving || !isDirty ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          {isSaving ? <><div className="spinner" style={{ width: 11, height: 11, borderTopColor: '#4488ff' }} />...</> : isDirty ? '🚀 Update' : '✓ Saved'}
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
function HindiSeriesPage({ user }) {
  const toast = useToast();
  const [seriesList, setSeriesList]         = useState([]);
  const [loadingList, setLoadingList]       = useState(true);
  const [openFolder, setOpenFolder]         = useState(null);
  const [openSeries, setOpenSeries]         = useState(null);
  const [openSection, setOpenSection]       = useState(null);
  const [copiedKey, setCopiedKey]           = useState('');
  const [ytVideos, setYtVideos]             = useState([]);
  const [continuing, setContinuing]         = useState(null);
  const [genTD, setGenTD]                   = useState(false);
  const [modal, setModal]                   = useState('none');
  const [selectedTopic, setSelectedTopic]   = useState(null);
  const [customTopic, setCustomTopic]       = useState('');
  const [selectedEmoji, setSelectedEmoji]   = useState('🌟');
  const [generating, setGenerating]         = useState(false);
  const [ytLoading, setYtLoading]           = useState(true);
  const [aiSuggestions, setAiSuggestions]   = useState([]);
  const [sugLoading, setSugLoading]         = useState(false);
  const [animModal, setAnimModal]           = useState(false);
  const [animPage, setAnimPage]             = useState(0);
  const [chosenAnim, setChosenAnim]         = useState('random');
  const [scheduleSlot, setScheduleSlot]     = useState(null);
  const [scheduleModal, setScheduleModal]   = useState(false);
  const [scheduleCopied, setScheduleCopied] = useState(false);
  const [playlistStatus, setPlaylistStatus] = useState({});
  const [seriesNote, setSeriesNote]         = useState('');

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

  function getNextColor() {
    const lastColor = seriesList?.[0]?.color || '';
    const available = COLORS.filter(c => c !== lastColor);
    return available[Math.floor(Math.random() * available.length)];
  }

  async function loadSuggestions() {
    setSugLoading(true); setAiSuggestions([]);
    try {
      const existing = seriesList.map(s => s.name).join(', ') || 'none';
      const text = await aiCall(`You are an AI for Hindi kids YouTube channel "RangTarang".
Already created: ${existing}
Suggest exactly 6 NEW unique Hindi educational series topics for kids aged 2-6.
Format: "पांच [topic] के नाम" — examples: "पांच फलों के नाम", "पांच जंगली जानवरों के नाम", "पांच फूलों के नाम"
Return ONLY JSON array of short topic words (not full name): ["फलों","जंगली जानवरों","फूलों","सब्जियों","पक्षियों","वाहनों"]`);
      setAiSuggestions(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { toast('❌ Suggestions nahi aaye'); }
    setSugLoading(false);
  }

  async function submitCustom() {
    if (!customTopic.trim()) { toast('⚠️ Topic likho!'); return; }
    const fullName = `पांच ${customTopic.trim()} के नाम`;
    const detectedEmoji = await detectEmoji(fullName);
    setSelectedEmoji(detectedEmoji);
    setSelectedTopic({ name: fullName, emoji: detectedEmoji });
    setModal('picker');
  }

  async function generateSeries() {
    if (!selectedTopic) return;
    setGenerating(true);
    try {
      const duplicate = seriesList.find(s => s.name.toLowerCase() === selectedTopic.name.toLowerCase());
      if (duplicate) { toast(`⚠️ Already exist karta hai!`); setGenerating(false); return; }
      const existing = seriesList.map(s => s.name).join(', ');
      const autoColor = getNextColor();
      const detectedType = getSeriesType(selectedTopic.name) || 'other';
      const folder = KNOWN_FOLDERS[detectedType] || { label: customTopic.trim(), emoji: selectedEmoji, color: autoColor };
      const folderMeta = { folderLabel: folder.label, folderEmoji: folder.emoji, folderColor: folder.color };
      const noteLine = seriesNote.trim() ? `\nIMPORTANT NOTE: ${seriesNote.trim()}` : '';
      const text = await aiCall(`Generate exactly 5 unique items for Hindi kids YouTube series: "${selectedTopic.name}".${noteLine}
Avoid overlap with: ${existing}
Return ONLY JSON array, no markdown:
[{"name":"सेब","object":"bright red shiny apple"}]
RULES: "name" field mein Hindi naam likho. "object" field mein English description max 6 words, no location or scene.`);
      const items = JSON.parse(text.replace(/```json|```/g, '').trim());
      await saveSeries(user.uid, { name: selectedTopic.name, emoji: selectedEmoji, color: autoColor, items, doneSections: {}, doneCount: 0, progress: 0, part: 1, ytTitle: '', ytDescription: '', ytTags: '', type: detectedType, ...folderMeta });
      toast(`${selectedEmoji} "${selectedTopic.name}" ready!`);
      setModal('none'); setSelectedTopic(null); setCustomTopic(''); setSeriesNote(''); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function continueSeries(e, series) {
    e.stopPropagation();
    setContinuing(series.id);
    try {
      const done = (series.items || []).map(i => i.name).join(', ');
      const text = await aiCall(`Generate 5 MORE unique items for Hindi kids series "${series.name}".
Already done (DO NOT repeat): ${done}
Return ONLY JSON array:
[{"name":"केला","object":"yellow ripe banana"}]
RULES: "name" in Hindi. "object" English description max 6 words.`);
      const newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      const newPart = (series.part || 1) + 1;
      const baseName = series.name.replace(/ Part \d+$/, '').trim();
      await saveSeries(user.uid, { name: `${baseName} Part ${newPart}`, emoji: series.emoji, color: series.color, items: newItems, doneSections: {}, doneCount: 0, progress: 0, part: newPart, ytTitle: '', ytDescription: '', ytTags: '', type: series.type, folderLabel: series.folderLabel, folderEmoji: series.folderEmoji, folderColor: series.folderColor });
      toast(`🎉 Part ${newPart} ready!`); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setContinuing(null);
  }

  async function addToPlaylist(series, videoId) {
    setPlaylistStatus(p => ({ ...p, [series.id]: 'loading' }));
    try {
      const res = await fetch('/api/youtube/playlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId, playlistTitle: series.folderLabel || 'Hindi Series' }) });
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
      const baseName = series.name.replace(/ Part \d+$/, '').trim();
      const partText = (series.part || 1) > 1 ? ` भाग ${series.part}` : '';
      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang".
Series: "${baseName}${partText}"
Items: ${itemNames}

TITLE RULES:
- Pattern: "${baseName}${partText} | Rang Tarang"
- Max 60 characters
- NO emoji in title

DESCRIPTION:
Line 1: Hook in Hindi
Line 2: ✅ इस video में: ${(series.items||[]).slice(0,5).map(i=>i.name).join(', ')}
Line 3: 👶 2-6 साल के बच्चों के लिए perfect!
Line 4: 🔔 Rang Tarang Subscribe karo: https://youtube.com/@RangTarangHindi
Line 5: Relevant hashtags

TAGS: Comma separated, 15 tags, mix Hindi+English

RETURN ONLY JSON: {"title":"...","description":"...","tags":"..."}`);
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

  // ══════════════════════════════════════════════
  // LEVEL 3: SERIES DETAIL
  // ══════════════════════════════════════════════
  if (openSeries) {
    const s = openSeries;
    const done = s.doneSections || {};
    const total = (s.items || []).length + 2;
    const allPromptsDone = Object.keys(done).length >= total;
    const hasTitleDesc = !!(s.ytTitle && s.ytDescription);
    const deleteDisabled = isDeleteDisabled(s);
    const matchedVideo = getMatchedVideo(s);
    const videoId = matchedVideo?.videoId || null;
    const uploaded = checkUploaded(s);
    const isUploaded = uploaded === true || uploaded === 'private' || (uploaded && typeof uploaded === 'object');
    const folderLabel = s.folderLabel || 'Hindi Series';

    const sections = [
      { key: 'intro', title: '🎬 Intro', color: '#4488ff', prompts: [
        { type: '🖼 IMAGE', text: buildIntroImagePrompt(s.name, s.items || []) },
        { type: '🎬 VIDEO', text: buildIntroVideoPrompt(s.name, s.part || 1, s.items || [], chosenAnim) }
      ]},
      ...(s.items || []).map((item, i) => ({
        key: `item_${i}`, title: `${i+1}. ${item.name}`, color: s.color,
        prompts: [
          { type: '🖼 IMAGE', text: buildItemImagePrompt(item) },
          { type: '🎬 VIDEO', text: buildVideoPrompt(item, s.name, i === 0) }
        ]
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

          {/* Schedule Slot */}
          {!ytLoading && (scheduleSlot ? (
            <button onClick={() => { setScheduleModal(true); setScheduleCopied(false); }}
              style={{ width: '100%', background: 'rgba(68,136,255,0.07)', border: '1px solid #4488ff44', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, color: '#4488ff', fontWeight: 700, letterSpacing: 1, marginBottom: 2 }}>📅 NEXT FREE SLOT</div>
                <div style={{ fontSize: 13, color: '#ddd', fontWeight: 700 }}>{formatSlotDisplay(scheduleSlot)}</div>
              </div>
              <span style={{ fontSize: 18, color: '#4488ff' }}>→</span>
            </button>
          ) : (
            <div style={{ background: '#0f0f0f', border: '1px solid #222', borderRadius: 12, padding: '12px 16px', fontSize: 12, color: '#444', textAlign: 'center' }}>📅 60 dino mein koi free slot nahi</div>
          ))}

          {scheduleModal && scheduleSlot && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
              <div style={{ background: '#080e1a', border: '1px solid #4488ff55', borderRadius: 20, padding: 22, width: '100%' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#4488ff', textAlign: 'center', marginBottom: 4 }}>📅 Schedule Confirm Karo</div>
                <div style={{ background: 'rgba(68,136,255,0.1)', border: '1px solid #4488ff33', borderRadius: 14, padding: '18px', textAlign: 'center', marginBottom: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ccc', marginBottom: 6 }}>{formatSlotDisplay(scheduleSlot).split('—')[0].trim()}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#4488ff', marginBottom: 6 }}>{formatSlotDisplay(scheduleSlot).split('—')[1]?.trim()}</div>
                </div>
                <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 8, padding: '8px 12px', fontSize: 10, color: '#555', fontFamily: 'monospace', marginBottom: 14, wordBreak: 'break-all' }}>{scheduleSlot.toISOString()}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => { navigator.clipboard.writeText(scheduleSlot.toISOString()); setScheduleCopied(true); toast('📋 ISO time copied!'); }}
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
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#44bb66' }}>Already Added</div>
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

          {/* Title Desc */}
          <TitleDescSection
            series={s} allPromptsDone={allPromptsDone} hasTitleDesc={hasTitleDesc}
            genTD={genTD} onGenerate={() => generateTitleDesc(s)}
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
                    {sec.key === 'intro' && (
                      <>
                        <button onClick={() => { setAnimModal(true); setAnimPage(0); }}
                          style={{ background: '#0a0a1a', border: '1px solid #334', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 700, color: '#88aaff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>🎬 Animation Chuno</span>
                          <span style={{ color: '#4488ff' }}>{INTRO_ANIMATIONS.find(a=>a.id===chosenAnim)?.emoji} {INTRO_ANIMATIONS.find(a=>a.id===chosenAnim)?.label}</span>
                        </button>
                        {animModal && (
                          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 2000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
                            <div style={{ background: '#0a0a1a', border: '1px solid #334', borderRadius: 20, padding: 20, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#88aaff', marginBottom: 16, textAlign: 'center' }}>🎬 Animation Chuno</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                                {INTRO_ANIMATIONS.slice(animPage*ANIM_PER_PAGE,(animPage+1)*ANIM_PER_PAGE).map(anim => (
                                  <button key={anim.id} onClick={() => setChosenAnim(anim.id)}
                                    style={{ background: chosenAnim===anim.id?'rgba(68,136,255,0.2)':'#0f0f0f', border:`1px solid ${chosenAnim===anim.id?'#4488ff':'#222'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                                    <span style={{ fontSize: 24 }}>{anim.emoji}</span>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontSize: 13, fontWeight: 700, color: chosenAnim===anim.id?'#4488ff':'#eee', marginBottom: 2 }}>{anim.label}</div>
                                      <div style={{ fontSize: 10, color: '#666', lineHeight: 1.4 }}>{anim.desc}</div>
                                    </div>
                                    {chosenAnim===anim.id && <span style={{ fontSize: 16 }}>✅</span>}
                                  </button>
                                ))}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => setAnimPage(p=>Math.max(0,p-1))} disabled={animPage===0}
                                  style={{ flex:1, background: animPage===0?'#111':'#1a1a2a', border:`1px solid ${animPage===0?'#222':'#334'}`, color: animPage===0?'#333':'#88aaff', borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor: animPage===0?'not-allowed':'pointer' }}>← Prev</button>
                                <button onClick={() => setAnimModal(false)}
                                  style={{ flex:2, background:'linear-gradient(135deg,#1a2255,#0a1133)', border:'1px solid #4488ff', color:'#4488ff', borderRadius:10, padding:'11px', fontSize:13, fontWeight:800, cursor:'pointer' }}>✅ Select Karo</button>
                                <button onClick={() => setAnimPage(p=>Math.min(Math.ceil(INTRO_ANIMATIONS.length/ANIM_PER_PAGE)-1,p+1))} disabled={animPage>=Math.ceil(INTRO_ANIMATIONS.length/ANIM_PER_PAGE)-1}
                                  style={{ flex:1, background: animPage>=Math.ceil(INTRO_ANIMATIONS.length/ANIM_PER_PAGE)-1?'#111':'#1a1a2a', border:`1px solid ${animPage>=Math.ceil(INTRO_ANIMATIONS.length/ANIM_PER_PAGE)-1?'#222':'#334'}`, color: animPage>=Math.ceil(INTRO_ANIMATIONS.length/ANIM_PER_PAGE)-1?'#333':'#88aaff', borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor: animPage>=Math.ceil(INTRO_ANIMATIONS.length/ANIM_PER_PAGE)-1?'not-allowed':'pointer' }}>Next →</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {sec.prompts.map((p, pi) => {
                      const bck = `hindi_${sec.key}_${pi}`;
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
                    <button onClick={() => markDone(s, sec.key, isDone)} style={{ background: isDone?'rgba(68,187,102,0.12)':'#0a1a0a', border:`1px solid ${isDone?'rgba(68,187,102,0.4)':'#224422'}`, color: isDone?'#44bb66':'#44aa44', borderRadius:10, padding:'11px', fontSize:13, fontWeight:700, cursor:'pointer', width:'100%' }}>
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
    const grouped = groupSeriesByFolder(seriesList);
    const folderSeries = grouped[openFolder] || [];
    const folder = {
      label: folderSeries[0]?.folderLabel || openFolder,
      emoji: folderSeries[0]?.folderEmoji || '📦',
      color: folderSeries[0]?.folderColor || '#888',
    };
    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenFolder(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: folder.color }}>{folder.emoji} {folder.label}</span>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600 }}>{folderSeries.length} series</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {folderSeries.map(s => {
            const total = (s.items || []).length + 2;
            const uploaded = checkUploaded(s);
            const isScheduledObj = uploaded && typeof uploaded === 'object' && uploaded.status === 'scheduled';
            const uploadColor = uploaded===true?'#44bb66':isScheduledObj?'#4488ff':uploaded==='private'?'#cc88ff':uploaded===false?'#ff8866':'#555';
            const scheduledTime = isScheduledObj ? formatScheduledTime(uploaded.scheduledAt) : null;
            const uploadText = ytLoading ? '🔍...' : uploaded===true ? '✅ YouTube pe hai' : isScheduledObj ? `📅 ${scheduledTime||'Scheduled'}` : uploaded==='private' ? '🔒 Private' : '⏳ Upload baaki';
            const nextPartExists = hasNextPart(s, seriesList);
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
                  {!nextPartExists && (
                    <button onClick={(e) => continueSeries(e, s)} disabled={isContinuing}
                      style={{ marginTop: 10, background: isContinuing?'#111':`${s.color}18`, border:`1px solid ${s.color}55`, color: isContinuing?'#555':s.color, borderRadius:8, padding:'7px 12px', fontSize:11, fontWeight:700, cursor: isContinuing?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:6, width:'100%', justifyContent:'center' }}>
                      {isContinuing ? <><div className="spinner" style={{ width:12, height:12, borderTopColor:s.color }} /> Generating...</> : `➕ Continue → भाग ${(s.part||1)+1}`}
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
  const grouped = groupSeriesByFolder(seriesList);
  const sortedFolders = Object.keys(grouped).sort((a, b) => {
    const aLatest = grouped[a]?.[0]?.createdAt?.seconds || 0;
    const bLatest = grouped[b]?.[0]?.createdAt?.seconds || 0;
    return bLatest - aLatest;
  });

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ff6644', fontSize: 14, fontWeight: 700 }}>🇮🇳 Hindi Series</span>
        {ytLoading ? (
          <button disabled style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#444', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 }}>+ Nayi</button>
        ) : (() => {
          const hasUnuploaded = seriesList.some(s => checkUploaded(s) === false);
          return hasUnuploaded ? (
            <button onClick={() => toast('⚠️ Pehle purani series upload karo!')} style={{ background: '#333', border: 'none', color: '#666', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.6 }}>+ Nayi</button>
          ) : (
            <button onClick={() => setModal('create')} style={{ background: '#ff6644', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Nayi</button>
          );
        })()}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Modal */}
        {modal === 'create' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0500', border: '1px solid #441100', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ff6644', marginBottom: 16, textAlign: 'center' }}>🇮🇳 Hindi Series Banao</div>

              {/* Format preview */}
              <div style={{ background: '#1a0800', border: '1px solid #441100', borderRadius: 12, padding: '12px 14px', marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Series ka naam aisa hoga:</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#ff6644' }}>
                  पांच {customTopic.trim() || '___'} के नाम
                </div>
              </div>

              {/* Input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1a0800', border: '1px solid #441100', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#ff6644', whiteSpace: 'nowrap' }}>पांच</span>
                <input value={customTopic} onChange={e => { setCustomTopic(e.target.value); setAiSuggestions([]); }}
                  placeholder="फलों, जंगली जानवरों..."
                  maxLength={30}
                  style={{ flex: 1, background: 'none', border: 'none', color: '#eee', fontSize: 15, fontWeight: 700, outline: 'none', fontFamily: 'inherit', textAlign: 'center' }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: '#ff6644', whiteSpace: 'nowrap' }}>के नाम</span>
              </div>

              {/* AI Suggestions */}
              <button onClick={loadSuggestions} disabled={sugLoading}
                style={{ width: '100%', background: sugLoading?'#111':'linear-gradient(135deg,#1a0500,#0d0200)', border: '1px solid #661100', color: sugLoading?'#555':'#ff6644', borderRadius:10, padding:'11px', fontSize:12, fontWeight:700, cursor: sugLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginBottom:10 }}>
                {sugLoading ? <><div className="spinner" style={{ width:14, height:14, borderTopColor:'#ff6644' }} />AI soch raha hai...</> : '🤖 AI se Ideas Lo'}
              </button>

              {aiSuggestions.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>TAP KARO SELECT KARNE KE LIYE</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {aiSuggestions.map((sug, i) => (
                      <button key={i} onClick={() => setCustomTopic(sug)}
                        style={{ background: customTopic===sug?'rgba(255,102,68,0.2)':'#1a0800', border:`1px solid ${customTopic===sug?'#ff6644':'#441100'}`, color: customTopic===sug?'#ff6644':'#aaa', borderRadius:20, padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer' }}>
                        पांच {sug} के नाम
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Note */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>📝 AI KO NOTE (OPTIONAL)</div>
                <textarea value={seriesNote} onChange={e => setSeriesNote(e.target.value)}
                  placeholder="e.g. Sirf Indian fruits. No exotic fruits."
                  maxLength={200}
                  style={{ width: '100%', background: '#1a0800', border: '1px solid #441100', borderRadius: 10, padding: '10px 12px', color: '#eee', fontSize: 12, outline: 'none', resize: 'none', minHeight: 60, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={submitCustom} disabled={!customTopic.trim()}
                  style={{ flex: 2, background: customTopic.trim()?'linear-gradient(135deg,#aa3300,#661100)':'#111', border:'1px solid #661100', color: customTopic.trim()?'#ff6644':'#444', borderRadius:10, padding:'12px', fontSize:13, fontWeight:800, cursor: customTopic.trim()?'pointer':'not-allowed' }}>
                  Next →
                </button>
                <button onClick={() => { setModal('none'); setCustomTopic(''); setAiSuggestions([]); setSeriesNote(''); }}
                  style={{ flex:1, background:'#111', border:'1px solid #333', color:'#666', borderRadius:10, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Emoji Picker Modal */}
        {modal === 'picker' && selectedTopic && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0500', border: '1px solid #441100', borderRadius: 20, padding: 20, width: '100%' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ff6644', marginBottom: 4, textAlign: 'center' }}>{selectedEmoji} {selectedTopic.name}</div>
              <div style={{ fontSize: 10, color: '#777', marginBottom: 8 }}>EMOJI CHUNO</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {EMOJIS.map(e => <button key={e} onClick={() => setSelectedEmoji(e)} style={{ fontSize:22, padding:'6px 8px', borderRadius:10, cursor:'pointer', background: selectedEmoji===e?'rgba(255,102,68,0.2)':'#1a1a1a', border:`1px solid ${selectedEmoji===e?'#ff6644':'#333'}` }}>{e}</button>)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={generateSeries} disabled={generating}
                  style={{ flex:2, background: generating?'#1a0500':'linear-gradient(135deg,#aa3300,#661100)', border:'1px solid #661100', color:'#ff6644', borderRadius:10, padding:'12px', fontSize:13, fontWeight:800, cursor: generating?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  {generating ? <><div className="spinner" style={{ borderTopColor:'#ff6644', width:16, height:16 }} />Generating...</> : '🤖 Generate Karo'}
                </button>
                <button onClick={() => setModal('none')} style={{ flex:1, background:'#111', border:'1px solid #333', color:'#666', borderRadius:10, padding:'12px', fontSize:13, fontWeight:700, cursor:'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Folder List */}
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ff6644' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Loading...</div>
          </div>
        ) : seriesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🇮🇳</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi Hindi series nahi hai</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Nayi" se banao</div>
          </div>
        ) : sortedFolders.map(type => {
          const seriesInFolder = grouped[type];
          const folder = {
            label: seriesInFolder[0]?.folderLabel || type,
            emoji: seriesInFolder[0]?.folderEmoji || '📦',
            color: seriesInFolder[0]?.folderColor || '#ff6644',
          };
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
                  <div style={{ fontSize: 10, color: '#ff6644', fontWeight: 700, marginTop: 4, background: 'rgba(255,102,68,0.08)', border: '1px solid #441100', borderRadius: 6, padding: '3px 8px', display: 'inline-block' }}>
                    ✨ भाग {(canContinue.part || 1) + 1} ban sakta hai
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

export default function HindiSeriesWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <HindiSeriesPage user={user} />}</AuthWrapper></ToastProvider>;
}

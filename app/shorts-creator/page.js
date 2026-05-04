// 📁 LOCATION: app/shorts-creator/page.js
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

async function getShorts(uid) {
  const db = getDB();
  const snap = await getDocs(query(collection(db, 'users', uid, 'rt_shorts'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveShort(uid, data) {
  return addDoc(collection(getDB(), 'users', uid, 'rt_shorts'), { ...data, createdAt: serverTimestamp() });
}
async function updateShort(uid, id, data) {
  await updateDoc(doc(getDB(), 'users', uid, 'rt_shorts', id), data);
}
async function deleteShort(uid, id) {
  await deleteDoc(doc(getDB(), 'users', uid, 'rt_shorts', id));
}

// ── Category & Type detect ───────────────────────────────────
const CATEGORY_MAP = {
  fruit:           { label: 'Fruits',           emoji: '🍎', color: '#ff4488', bg: 'a colorful fruit basket on a wooden kitchen counter with soft morning light' },
  vegetable:       { label: 'Vegetables',       emoji: '🥦', color: '#44bb66', bg: 'a fresh vegetable garden with green plants and soil' },
  wild_animal:     { label: 'Wild Animals',     emoji: '🦁', color: '#ff6600', bg: 'a lush green jungle with tall trees and golden sunlight' },
  domestic_animal: { label: 'Domestic Animals', emoji: '🐄', color: '#ffaa44', bg: 'a cozy farm with a red barn and green grass' },
  water_animal:    { label: 'Water Animals',    emoji: '🐟', color: '#44bbff', bg: 'a clear blue ocean with coral reefs and sunlight filtering through water' },
  bird:            { label: 'Birds',            emoji: '🐦', color: '#ff6644', bg: 'a bright sky with fluffy clouds and a green tree branch' },
  insect:          { label: 'Insects',          emoji: '🦋', color: '#88cc44', bg: 'a colorful flower garden with butterflies and sunlight' },
  flower:          { label: 'Flowers',          emoji: '🌸', color: '#ff88aa', bg: 'a beautiful flower garden with colorful blooms and soft sunlight' },
  vehicle:         { label: 'Vehicles',         emoji: '🚗', color: '#44ccff', bg: 'a bright clean garage with tools on the wall and shiny floor' },
  food:            { label: 'Foods',            emoji: '🍕', color: '#ffaa44', bg: 'a colorful kitchen with pots, pans, and a dining table' },
  toy:             { label: 'Toys',             emoji: '🧸', color: '#ff88ff', bg: 'a cheerful kids playroom with colorful walls and toy shelves' },
  sport:           { label: 'Sports',           emoji: '⚽', color: '#88ff44', bg: 'a bright outdoor sports field with green grass and blue sky' },
  instrument:      { label: 'Instruments',      emoji: '🎵', color: '#aa88ff', bg: 'a cozy music room with instruments on the wall and warm lighting' },
  space:           { label: 'Space',            emoji: '🚀', color: '#4444ff', bg: 'a dark galaxy background with stars and colorful nebula clouds' },
  body:            { label: 'Body Parts',       emoji: '🫀', color: '#ff6644', bg: 'a clean bright white background with colorful floating circles' },
  color:           { label: 'Colors',           emoji: '🌈', color: '#cc88ff', bg: 'a magical rainbow background with colorful paint splashes' },
  shape:           { label: 'Shapes',           emoji: '🔷', color: '#ffcc00', bg: 'a bright classroom with colorful shapes on the whiteboard' },
  weather:         { label: 'Weather',          emoji: '⛅', color: '#44bbff', bg: 'an outdoor scene with sky, clouds and colorful weather elements' },
  tool:            { label: 'Tools',            emoji: '🔧', color: '#aaaaaa', bg: 'a neat workshop with tools on pegboard and a wooden workbench' },
  clothes:         { label: 'Clothes',          emoji: '👕', color: '#ff88cc', bg: 'a bright colorful wardrobe room with clothes on hangers' },
  furniture:       { label: 'Furniture',        emoji: '🛋️', color: '#cc9966', bg: 'a cozy living room with warm lighting and wooden floors' },
  stationery:      { label: 'Stationery',       emoji: '✏️', color: '#44ccbb', bg: 'a colorful classroom desk with books and art supplies' },
};

const CONCEPT_MAP = {
  dukh: {
    label: '😢 Mera Dukh',
    scenes: [
      { title: 'Rota Hua Entry', hint: 'Object rote hue enter karta hai, aankhon mein aansu' },
      { title: 'Pehla Dukh', hint: 'Apna pehla dard batata hai bacchon ko' },
      { title: 'Aur Rona', hint: 'Aur zyada dukh sunata hai, koi nahi sunta use' },
      { title: 'Bahut Udaas', hint: 'Corner mein baith jaata hai, bilkul akela feel karta hai' },
      { title: 'Rota Rehta Hai', hint: 'Sad ending — phir bhi rota hua baith jaata hai' },
    ],
  },
  fayde: {
    label: '💪 Mere Fayde',
    scenes: [
      { title: 'Proud Entry', hint: 'Object confidently enter karta hai, chest out, smile' },
      { title: 'Pehla Fayda', hint: 'Pehla benefit batata hai excitedly' },
      { title: 'Doosra Fayda', hint: 'Doosra benefit batata hai, dancing karta hai' },
      { title: 'Teesra Fayda', hint: 'Teesra benefit, sab bacche wow bolte hain' },
      { title: 'Khao Mujhe!', hint: '"Ab toh khaao mujhe!" — happy ending thumbs up' },
    ],
  },
  intro: {
    label: '👋 Khud Ko Milao',
    scenes: [
      { title: 'Hello Bacchon!', hint: 'Object wave karta hai, excited greeting' },
      { title: 'Main Kaun Hoon', hint: 'Apna naam aur family batata hai' },
      { title: 'Meri Khasiyat', hint: 'Apni special cheez batata hai' },
      { title: 'Mera Ghar', hint: 'Kahan rehta hai, uski duniya dikhata hai' },
      { title: 'Dosto Bano!', hint: '"Mujhse dosti karoge?" — pyara ending' },
    ],
  },
  dono: {
    label: '🎭 Dukh + Fayde',
    scenes: [
      { title: 'Rota Hua Entry', hint: 'Object rote hue enter karta hai' },
      { title: 'Dukh Sunata Hai', hint: 'Koi nahi khata — dukh batata hai' },
      { title: 'Himmat Karta Hai', hint: 'Deep breath, "Ruko main batata hoon main kyu khaas hoon!"' },
      { title: 'Fayde Batata Hai', hint: 'Proudly apne benefits sunata hai' },
      { title: 'Happy Ending!', hint: '"Ab khao mujhe!" baccha aata hai, dono khush' },
    ],
  },
};

function getShortType(categoryKey) {
  return categoryKey || 'other';
}

function getCategory(type) {
  if (CATEGORY_MAP[type]) return CATEGORY_MAP[type];
  const label = type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label, emoji: '📦', color: '#888888', bg: 'a colorful bright background' };
}

function groupShortsByFolder(shortsList) {
  const groups = {};
  shortsList.forEach(s => {
    const type = s.type || 'other';
    if (!groups[type]) groups[type] = [];
    groups[type].push(s);
  });
  return groups;
}

// ── Prompt Builders ───────────────────────────────────────────
function getBackground(type, objectName) {
  const cat = CATEGORY_MAP[type];
  return cat ? cat.bg : `a colorful bright background suitable for ${objectName}`;
}

function getObjectVisual(objectName, type) {
  const visuals = {
    Apple: 'shiny red apple with a green leaf on top',
    Banana: 'bright yellow banana',
    Mango: 'golden yellow mango',
    Orange: 'round juicy orange with a small leaf',
    Grapes: 'purple grape bunch',
    Strawberry: 'red strawberry with white dots',
    Watermelon: 'round green watermelon with red inside',
    Pineapple: 'yellow pineapple with spiky crown',
    Carrot: 'orange carrot with green leafy top',
    Potato: 'round brown potato',
    Tomato: 'round red tomato with green stem',
    Lion: 'golden lion with big fluffy mane',
    Tiger: 'orange tiger with black stripes',
    Elephant: 'big grey elephant with large ears',
    Rose: 'beautiful red rose with thorny green stem',
    Sunflower: 'tall bright yellow sunflower with brown center',
  };
  return visuals[objectName] || `${objectName.toLowerCase()}`;
}

function buildIntroImagePrompt(short) {
  const bg = getBackground(short.type, short.objectName);
  const visual = getObjectVisual(short.objectName, short.type);
  const concept = CONCEPT_MAP[short.concept];
  const emotion = short.concept === 'dukh' ? 'sad teary eyes, a small frown, looking down' :
    short.concept === 'fayde' ? 'big confident smile, chest puffed out, arms wide' :
    'big happy smile, waving hand at camera';

  return `Pixar 3D style vertical 9:16 image. Background: ${bg}. Center of image: one big cute animated ${visual} character — chubby Pixar body, tiny arms and legs, very expressive face with ${emotion}. Bold glowing rainbow text "${short.objectName}" floating above the character with colorful sparkles. Bottom text: "${concept.label}" in bold Hindi font. Bright colorful lighting. No teacher. No other characters. Studio quality render.`;
}

function buildIntroVideoPrompt(short) {
  const bg = getBackground(short.type, short.objectName);
  const visual = getObjectVisual(short.objectName, short.type);
  const concept = CONCEPT_MAP[short.concept];

  const entryStyle = short.concept === 'dukh'
    ? `${short.objectName} slowly walks in from the left side, shoulders drooped, head down, tears rolling from eyes`
    : short.concept === 'fayde'
    ? `${short.objectName} bounces in energetically from the bottom with a "boing" sound, lands confidently and strikes a proud pose`
    : `${short.objectName} slides in cheerfully from the right side, waving both tiny hands at the camera`;

  const greeting = short.concept === 'dukh'
    ? `"हैलो बच्चों... मैं हूँ ${short.objectName}..." (sad, slow voice, sniffling)`
    : short.concept === 'fayde'
    ? `"हैलो बच्चों! मैं हूँ ${short.objectName}! आज मैं बताऊँगा — मैं कितना ज़रूरी हूँ!" (loud, proud, excited)`
    : `"हैलो बच्चों! मैं हूँ ${short.objectName}! आओ मुझसे दोस्ती करो!" (cheerful, warm, friendly)`;

  return `Use this exact background: ${bg}. Pixar 3D animated ${visual} character — chubby body, tiny arms and legs, very expressive anime-style eyes. ${entryStyle}. Character says in pure Hindi Indian accent: ${greeting}. Bold glowing text "${short.objectName}" appears at top. 8 seconds. Smooth entry animation. Perfect lip sync. No teacher. No other characters. No background music. Pure Hindi audio only.`;
}

function buildScenePrompt(short, sceneIndex) {
  const bg = getBackground(short.type, short.objectName);
  const visual = getObjectVisual(short.objectName, short.type);
  const concept = CONCEPT_MAP[short.concept];
  const scene = concept.scenes[sceneIndex];

  const sceneDialogues = {
    dukh: [
      `"बच्चों... कोई मुझे नहीं खाता... मैं बहुत उदास हूँ!" (wiping tears with tiny hand, lip trembling)`,
      `"देखो... मैं यहाँ रखा रहता हूँ... कोई मेरी तरफ देखता भी नहीं!" (pointing to shelf, more tears)`,
      `"मैंने सोचा था आज कोई मुझे खाएगा... पर नहीं!" (sits down on floor, crying harder)`,
      `"अकेला हूँ मैं... बहुत अकेला..." (curled up in corner, sobbing quietly, no one around)`,
      `"शायद मैं काम का नहीं हूँ किसी के..." (last tear rolls down, slow fade, still sad — no happy ending)`,
    ],
    fayde: [
      `"सुनो बच्चों! मेरा पहला फायदा — मैं तुम्हारी आँखें तेज़ करता हूँ! 👁️" (pointing to eyes excitedly, bouncing)`,
      `"मेरा दूसरा फायदा — मैं तुम्हारा पेट मज़बूत बनाता हूँ! 💪" (flexing tiny arms, big smile)`,
      `"और तीसरा — मैं बहुत tasty भी हूँ! 😋" (rubbing tummy in circles, licking lips)`,
      `"Doctor भी कहता है — रोज़ खाओ मुझे! 🩺" (wagging finger at camera, winking)`,
      `"तो बच्चों — अब देर किस बात की? खाओ मुझे और healthy रहो! 🌟" (big thumbs up, happy dance)`,
    ],
    intro: [
      `"मैं हूँ ${short.objectName}! और मैं ${getCategory(short.type).label} family से हूँ!" (pointing to self proudly, big smile)`,
      `"मेरा घर है ${bg.split(' with')[0]}! यहीं रहता हूँ मैं!" (gesturing around at background)`,
      `"मेरी सबसे ख़ास बात? मैं बहुत colorful और cute हूँ!" (doing a little spin to show off)`,
      `"बच्चों, क्या आप मुझे पहचानते हो? मैं ${short.objectName} हूँ!" (leaning toward camera curiously)`,
      `"आओ दोस्त बनो मेरे! Rang Tarang पर मिलते रहेंगे!" (big wave, hearts floating around)`,
    ],
    dono: [
      `"हैलो बच्चों... मैं ${short.objectName} हूँ... कोई मुझे नहीं खाता..." (sad entry, tears falling)`,
      `"देखो, मैं यहाँ रखा रहता हूँ... कोई नहीं आता मेरे पास..." (pointing to self sadly)`,
      `"रुको! रोना बंद! मैं बताता हूँ — मैं कितना ज़रूरी हूँ!" (wipes tears, stands up straight, determined face)`,
      `"मैं तुम्हें healthy बनाता हूँ! मैं tasty हूँ! मैं तुम्हारा दोस्त हूँ!" (proudly listing on fingers)`,
      `"अब तो खाओ मुझे!" (a child's hand appears, picks up ${short.objectName}, both are happy, big smile)`,
    ],
  };

  const dialogue = sceneDialogues[short.concept][sceneIndex];

  return `Use this exact background: ${bg}. Same Pixar 3D animated ${visual} character from previous scene — same style, same size, same colors. Scene: "${scene.title}". Character says in pure Hindi Indian accent: ${dialogue}. Very expressive face — emotions clearly visible. Perfect lip sync. 8-10 seconds. Smooth animation. No glitch. No teacher. No other characters. No background music. Pure Hindi audio only. Continue from previous scene seamlessly.`;
}

function buildOutroVideoPrompt(short) {
  const bg = getBackground(short.type, short.objectName);
  const visual = getObjectVisual(short.objectName, short.type);
  const concept = CONCEPT_MAP[short.concept];

  const outroLine = short.concept === 'dukh'
    ? `${short.objectName} still sitting sadly in corner. Slowly looks up at camera with watery eyes and says: "बच्चों... अगली बार मिलेंगे... Rang Tarang subscribe करना मत भूलना..." then looks back down sadly.`
    : `${short.objectName} does a happy little dance and says: "तो बच्चों — आज के लिए बस इतना ही! Rang Tarang subscribe करो और bell दबाओ! टाटा! 👋" waves enthusiastically at camera.`;

  return `Use this exact background: ${bg}. Same Pixar 3D animated ${visual} character. ${outroLine} Bold text appears: "Rang Tarang Subscribe Karo! 🔔" with colorful sparkles. 8 seconds. Smooth. No glitch. Perfect lip sync. Pure Hindi audio only.`;
}

// ── AI Call ───────────────────────────────────────────────────
async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-4o-mini',
      max_tokens: 800,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function generateYTTitleDesc(short) {
  const conceptLabel = CONCEPT_MAP[short.concept]?.label || '';
  const text = await aiCall(`You are a YouTube Shorts SEO expert for Hindi kids channel "Rang Tarang" (@RangTarangHindi).

Short video about: "${short.objectName}" (${getCategory(short.type).label})
Concept: ${conceptLabel}
Format: YouTube SHORT (vertical 9:16)
Target: Indian parents searching kids content

TITLE RULES:
- Max 60 characters
- Must include Hindi (Devanagari) AND English
- Pattern: "[Emoji] [Hindi] | [English] | Rang Tarang"
- Examples:
  "🍎 सेब का दुख | Apple Ki Kahani | Rang Tarang"
  "🦁 शेर के फायदे | Lion Facts for Kids | Rang Tarang"

DESCRIPTION RULES:
- Line 1: Hindi hook — "बच्चों आज मिलो ${short.objectName} से! 🎉"
- Line 2: "📺 इस video में: ${short.objectName} ${conceptLabel} सुनाता है!"
- Line 3: "👶 2-6 साल के बच्चों के लिए!"
- Line 4: "🔔 Rang Tarang Subscribe karo — #Shorts #HindiKids"
- Line 5: Hashtags mix Hindi+English

RETURN ONLY JSON: {"title":"...","description":"..."}`);

  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ── Main Component ────────────────────────────────────────────
function ShortsCreatorPage({ user }) {
  const toast = useToast();
  const [shortsList, setShortsList]       = useState([]);
  const [loadingList, setLoadingList]     = useState(true);
  const [openFolder, setOpenFolder]       = useState(null);
  const [openShort, setOpenShort]         = useState(null);
  const [openSection, setOpenSection]     = useState(null);
  const [copiedKey, setCopiedKey]         = useState('');
  const [ytVideos, setYtVideos]           = useState([]);
  const [ytLoading, setYtLoading]         = useState(true);
  const [modal, setModal]                 = useState('none');
  const [generating, setGenerating]       = useState(false);
  const [genTD, setGenTD]                 = useState(false);

  // New short form state
  const [step, setStep]                   = useState(1); // 1=category, 2=object, 3=concept
  const [selectedType, setSelectedType]   = useState(null);
  const [aiObjects, setAiObjects]         = useState([]);
  const [aiLoading, setAiLoading]         = useState(false);
  const [selectedObject, setSelectedObject] = useState('');
  const [customObject, setCustomObject]   = useState('');
  const [showCustom, setShowCustom]       = useState(false);
  const [selectedConcept, setSelectedConcept] = useState('dukh');
  const [selectedColor, setSelectedColor] = useState('#ff4488');

  const COLORS = ['#ff4400', '#44bb66', '#4488ff', '#cc88ff', '#ff8800', '#ff4488', '#00ccbb', '#ffcc00'];

  useEffect(() => { loadList(); fetchYT(); }, [user.uid]);

  async function loadList() {
    setLoadingList(true);
    try { setShortsList(await getShorts(user.uid)); } catch { toast('❌ Load fail'); }
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

  function checkUploaded(short) {
    if (!ytVideos.length) return null;
    const matchStr = (short.ytTitle || short.objectName || '').trim().toLowerCase();
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

  function isDeleteDisabled(short) {
    const u = checkUploaded(short);
    return u === true || u === 'private' || u === 'scheduled';
  }

  // ── Load AI objects for category ──
  async function loadAiObjects(type) {
    setAiLoading(true);
    setAiObjects([]);
    const cat = getCategory(type);
    try {
      const text = await aiCall(`List exactly 12 common ${cat.label} items that Indian kids aged 2-6 know well.
Already created shorts: ${shortsList.map(s => s.objectName).join(', ') || 'none'}
Return ONLY a JSON array of English names, no markdown, no explanation:
["Apple","Banana","Mango"]
Make them fun, easy, familiar to Indian kids.`);
      setAiObjects(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { toast('❌ AI se nahi aaya'); }
    setAiLoading(false);
  }

  function openNewModal() {
    setModal('new');
    setStep(1);
    setSelectedType(null);
    setAiObjects([]);
    setSelectedObject('');
    setCustomObject('');
    setShowCustom(false);
    setSelectedConcept('dukh');
    setSelectedColor('#ff4488');
  }

  async function selectCategory(type) {
    setSelectedType(type);
    setStep(2);
    await loadAiObjects(type);
  }

  function selectObject(obj) {
    setSelectedObject(obj);
    setCustomObject(obj);
    setStep(3);
  }

  async function generateShort() {
    const finalObject = customObject.trim() || selectedObject;
    if (!finalObject || !selectedType || !selectedConcept) return;
    setGenerating(true);
    try {
      const cat = getCategory(selectedType);
      await saveShort(user.uid, {
        objectName: finalObject,
        type: selectedType,
        concept: selectedConcept,
        color: selectedColor,
        emoji: cat.emoji,
        doneSections: {},
        doneCount: 0,
        progress: 0,
        ytTitle: '',
        ytDescription: '',
      });
      toast(`${cat.emoji} "${finalObject}" short ready!`);
      setModal('none');
      loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function markDone(short, key, wasDone) {
    const doneSections = { ...(short.doneSections || {}) };
    if (wasDone) delete doneSections[key]; else doneSections[key] = true;
    const total = 7; // intro_img + intro_vid + 5 scenes + outro = 8? No: intro_img, intro_vid, scene0-4, outro = 8
    const doneCount = Object.keys(doneSections).length;
    const progress = Math.round((doneCount / 8) * 100);
    await updateShort(user.uid, short.id, { doneSections, doneCount, progress });
    const updated = { ...short, doneSections, doneCount, progress };
    setShortsList(l => l.map(s => s.id === short.id ? updated : s));
    setOpenShort(updated);
    toast(wasDone ? 'Undone!' : '✅ Done!');
  }

  async function generateTitleDesc(short) {
    setGenTD(true);
    try {
      const parsed = await generateYTTitleDesc(short);
      await updateShort(user.uid, short.id, { ytTitle: parsed.title, ytDescription: parsed.description });
      const updated = { ...short, ytTitle: parsed.title, ytDescription: parsed.description };
      setShortsList(l => l.map(s => s.id === short.id ? updated : s));
      setOpenShort(updated);
      toast('✅ Title & Description ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  async function saveTitleDesc(short, title, desc) {
    await updateShort(user.uid, short.id, { ytTitle: title, ytDescription: desc });
    const updated = { ...short, ytTitle: title, ytDescription: desc };
    setShortsList(l => l.map(s => s.id === short.id ? updated : s));
    setOpenShort(updated);
    toast('💾 Saved!');
  }

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
      toast('📋 Copied!');
    });
  }

  async function handleDelete(short) {
    if (!confirm(`"${short.objectName}" delete karein?`)) return;
    await deleteShort(user.uid, short.id);
    toast('🗑 Deleted!');
    setOpenShort(null);
    loadList();
  }

  // ══════════════════════════════════════════════
  // LEVEL 3: SHORT DETAIL VIEW
  // ══════════════════════════════════════════════
  if (openShort) {
    const s = openShort;
    const done = s.doneSections || {};
    const concept = CONCEPT_MAP[s.concept] || CONCEPT_MAP.dukh;
    const cat = getCategory(s.type);
    const allPromptsDone = Object.keys(done).length >= 8;
    const hasTitleDesc = !!(s.ytTitle && s.ytDescription);
    const deleteDisabled = isDeleteDisabled(s);

    const sections = [
      {
        key: 'intro_img',
        title: '🖼 Intro Image',
        color: '#4488ff',
        type: '🖼 IMAGE',
        prompt: buildIntroImagePrompt(s),
      },
      {
        key: 'intro_vid',
        title: '🎬 Intro Video',
        color: '#4488ff',
        type: '🎬 VIDEO',
        prompt: buildIntroVideoPrompt(s),
      },
      ...concept.scenes.map((scene, i) => ({
        key: `scene_${i}`,
        title: `🎬 Scene ${i + 1} — ${scene.title}`,
        color: s.color,
        type: '🎬 VIDEO',
        prompt: buildScenePrompt(s, i),
        hint: scene.hint,
      })),
      {
        key: 'outro',
        title: '🎤 Outro',
        color: '#cc88ff',
        type: '🎬 VIDEO',
        prompt: buildOutroVideoPrompt(s),
      },
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenShort(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{cat.emoji} {s.objectName}</span>
          {deleteDisabled ? (
            <span style={{ fontSize: 18, opacity: 0.2, cursor: 'not-allowed' }}>🗑</span>
          ) : (
            <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Concept badge */}
          <div style={{ background: '#0f0f0f', border: `1px solid ${s.color}44`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{cat.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.objectName}</div>
              <div style={{ fontSize: 11, color: '#555' }}>{concept.label} • {cat.label}</div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Progress</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 800 }}>{s.doneCount || 0} / 8</span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (s.progress || 0) + '%', background: s.color, borderRadius: 6, transition: 'width 0.3s' }} />
            </div>
          </div>

          {/* Title & Desc */}
          <TitleDescSection
            short={s} allPromptsDone={allPromptsDone} hasTitleDesc={hasTitleDesc}
            genTD={genTD} onGenerate={() => generateTitleDesc(s)}
            onSave={(title, desc) => saveTitleDesc(s, title, desc)}
            onCopy={copy} copiedKey={copiedKey}
          />

          {/* Sections */}
          {sections.map(sec => {
            const isDone = !!done[sec.key];
            const isOpen = openSection === sec.key;
            return (
              <div key={sec.key} style={{ background: '#0f0f0f', border: `1px solid ${isDone ? '#1a3a1a' : '#1e1e1e'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => setOpenSection(isOpen ? null : sec.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#44bb66' : '#ccc' }}>{sec.title}</span>
                    {isDone && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>}
                    {sec.hint && !isDone && <span style={{ fontSize: 9, color: '#444', fontStyle: 'italic' }}>{sec.hint}</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#444' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 9, color: sec.color, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 2 }}>{sec.type}</div>
                    <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px', fontSize: 12, lineHeight: 1.7, color: '#bbb' }}>
                      {sec.prompt}
                    </div>
                    <button onClick={() => copy(sec.key, sec.prompt)}
                      style={{ background: copiedKey === sec.key ? 'rgba(68,136,255,0.15)' : '#0a0a1a', border: `1px solid ${copiedKey === sec.key ? '#4488ff' : '#223355'}`, color: copiedKey === sec.key ? '#4488ff' : '#4477cc', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                      {copiedKey === sec.key ? '✅ Copied!' : `📋 Copy ${sec.type}`}
                    </button>
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
    const cat = getCategory(openFolder);
    const grouped = groupShortsByFolder(shortsList);
    const shortsInFolder = grouped[openFolder] || [];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenFolder(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: cat.color }}>{cat.emoji} {cat.label}</span>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600 }}>{shortsInFolder.length} shorts</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shortsInFolder.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{cat.emoji}</div>
              <div style={{ fontSize: 13, color: '#555' }}>Koi short nahi hai</div>
            </div>
          ) : shortsInFolder.map(s => {
            const uploaded = checkUploaded(s);
            const uploadColor = uploaded === true ? '#44bb66' : uploaded === 'scheduled' ? '#4488ff' : uploaded === 'private' ? '#cc88ff' : uploaded === false ? '#ff8866' : '#555';
            const uploadText = ytLoading ? '🔍...' : uploaded === true ? '✅ YouTube pe hai' : uploaded === 'scheduled' ? '📅 Scheduled' : uploaded === 'private' ? '🔒 Private' : '⏳ Upload baaki';
            const concept = CONCEPT_MAP[s.concept] || CONCEPT_MAP.dukh;

            return (
              <div key={s.id} onClick={() => setOpenShort(s)}
                style={{ background: '#0f0f0f', borderRadius: 14, border: '1px solid #1e1e1e', borderLeft: `4px solid ${s.color}`, cursor: 'pointer', padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 2 }}>{s.objectName}</div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{concept.label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{s.doneCount || 0}/8 done</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: uploadColor }}>{uploadText}</span>
                  </div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (s.progress || 0) + '%', background: s.color, borderRadius: 4 }} />
                  </div>
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
  const grouped = groupShortsByFolder(shortsList);
  const sortedFolderOrder = Object.keys(grouped).sort((a, b) => {
    const aLatest = grouped[a]?.[0]?.createdAt?.seconds || 0;
    const bLatest = grouped[b]?.[0]?.createdAt?.seconds || 0;
    return bLatest - aLatest;
  });

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ff4488', fontSize: 14, fontWeight: 700 }}>🎬 Shorts Creator</span>
        <button onClick={() => {
          const names = shortsList.map(s => `${s.objectName} (${s.concept})`).join('\n');
          navigator.clipboard.writeText(names);
          toast('📋 Copied!');
        }} style={{ background: 'none', border: '1px solid #ff448855', color: '#ff4488', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          📋 Copy
        </button>
        <button onClick={openNewModal}
          style={{ background: '#ff4488', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
          + Naya
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── NEW SHORT MODAL ── */}
        {modal === 'new' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0008', border: '1px solid #440022', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>

              {/* Step 1: Category */}
              {step === 1 && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ff4488', marginBottom: 16, textAlign: 'center' }}>📁 Category Chuno</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {Object.entries(CATEGORY_MAP).map(([type, cat]) => (
                      <button key={type} onClick={() => selectCategory(type)}
                        style={{ background: '#0f0f1a', border: '1px solid #1a1a33', borderRadius: 14, padding: '14px 10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 26 }}>{cat.emoji}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: cat.color }}>{cat.label}</span>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setModal('none')} style={{ width: '100%', marginTop: 12, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                </>
              )}

              {/* Step 2: Object */}
              {step === 2 && selectedType && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ff4488', marginBottom: 4, textAlign: 'center' }}>
                    {getCategory(selectedType).emoji} Object Chuno
                  </div>
                  <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 14 }}>{getCategory(selectedType).label}</div>

                  {aiLoading ? (
                    <div style={{ textAlign: 'center', padding: 30 }}>
                      <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ff4488' }} />
                      <div style={{ fontSize: 12, color: '#666' }}>AI objects la raha hai...</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                        {aiObjects.map(obj => (
                          <button key={obj} onClick={() => selectObject(obj)}
                            style={{ background: selectedObject === obj ? 'rgba(255,68,136,0.2)' : '#0f0f1a', border: `1px solid ${selectedObject === obj ? '#ff4488' : '#1a1a33'}`, borderRadius: 10, padding: '10px 6px', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: selectedObject === obj ? '#ff4488' : '#aaa' }}>
                            {obj}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => loadAiObjects(selectedType)} style={{ width: '100%', background: 'linear-gradient(135deg,#1a0010,#0d0008)', border: '1px solid #660033', color: '#ff4488', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>
                        🔄 Nayi List Lo
                      </button>
                    </>
                  )}

                  {/* Custom input */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <input value={customObject} onChange={e => setCustomObject(e.target.value)} placeholder="Ya khud likho..."
                      style={{ flex: 1, background: '#0a0a1a', border: '1px solid #334', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#eee', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={() => { if (customObject.trim()) { setSelectedObject(customObject.trim()); setStep(3); } }}
                      style={{ background: '#ff4488', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>→</button>
                  </div>

                  <button onClick={() => setStep(1)} style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                </>
              )}

              {/* Step 3: Concept + Color */}
              {step === 3 && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ff4488', marginBottom: 4, textAlign: 'center' }}>
                    {getCategory(selectedType).emoji} {selectedObject || customObject}
                  </div>
                  <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 14 }}>Concept aur color chuno</div>

                  <div style={{ fontSize: 10, color: '#777', marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>CONCEPT CHUNO</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {Object.entries(CONCEPT_MAP).map(([id, concept]) => (
                      <button key={id} onClick={() => setSelectedConcept(id)}
                        style={{ background: selectedConcept === id ? 'rgba(255,68,136,0.15)' : '#0f0f1a', border: `1px solid ${selectedConcept === id ? '#ff4488' : '#1a1a33'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                        <span style={{ fontSize: 20 }}>{concept.label.split(' ')[0]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: selectedConcept === id ? '#ff4488' : '#eee' }}>{concept.label}</div>
                          <div style={{ fontSize: 10, color: '#555' }}>{concept.scenes.map(s => s.title).join(' → ')}</div>
                        </div>
                        {selectedConcept === id && <span>✅</span>}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: 10, color: '#777', marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>COLOR CHUNO</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    {COLORS.map(c => (
                      <div key={c} onClick={() => setSelectedColor(c)}
                        style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${selectedColor === c ? '#fff' : 'transparent'}`, transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }} />
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={generateShort} disabled={generating}
                      style={{ flex: 2, background: generating ? '#1a0010' : 'linear-gradient(135deg,#550022,#330011)', border: '1px solid #ff4488', color: '#ff4488', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {generating ? <><div className="spinner" style={{ borderTopColor: '#ff4488', width: 16, height: 16 }} />Saving...</> : '🎬 Banao!'}
                    </button>
                    <button onClick={() => setStep(2)}
                      style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── FOLDER CARDS ── */}
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ff4488' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Loading...</div>
          </div>
        ) : shortsList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi short nahi hai</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Naya" se banao</div>
          </div>
        ) : sortedFolderOrder.map(type => {
          const cat = getCategory(type);
          const shortsInFolder = grouped[type];
          const uploadedCount = shortsInFolder.filter(s => checkUploaded(s) === true).length;

          return (
            <div key={type} onClick={() => setOpenFolder(type)}
              style={{ background: '#0d0d0d', border: `1px solid ${cat.color}44`, borderRadius: 16, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 15% 50%, ${cat.color}0f 0%, transparent 65%)`, pointerEvents: 'none' }} />
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${cat.color}1a`, border: `1px solid ${cat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
                {cat.emoji}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: cat.color, marginBottom: 3 }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{shortsInFolder.length} shorts • {uploadedCount} uploaded</div>
              </div>
              <span style={{ fontSize: 22, color: `${cat.color}66` }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Title & Description Sub-Component ────────────────────────
function TitleDescSection({ short, allPromptsDone, hasTitleDesc, genTD, onGenerate, onSave, onCopy, copiedKey }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(short.ytTitle || '');
  const [desc, setDesc]       = useState(short.ytDescription || '');

  useEffect(() => {
    setTitle(short.ytTitle || '');
    setDesc(short.ytDescription || '');
  }, [short.ytTitle, short.ytDescription]);

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
          <button onClick={onGenerate} disabled={genTD}
            style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {genTD ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ffaa44' }} />Generate ho raha hai...</> : '🤖 AI se Generate Karo'}
          </button>
          <div>
            <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>📌 YouTube Title</div>
            <div style={{ position: 'relative' }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video ka title..."
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={() => onCopy('ytTitle', title)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey === 'ytTitle' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'ytTitle' ? '#44bb66' : '#333'}`, color: copiedKey === 'ytTitle' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey === 'ytTitle' ? '✅' : '📋'}</button>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>📄 YouTube Description</div>
            <div style={{ position: 'relative' }}>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Video ki description..." rows={4}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
              <button onClick={() => onCopy('ytDesc', desc)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey === 'ytDesc' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'ytDesc' ? '#44bb66' : '#333'}`, color: copiedKey === 'ytDesc' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey === 'ytDesc' ? '✅' : '📋'}</button>
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

export default function ShortsCreatorWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <ShortsCreatorPage user={user} />}</AuthWrapper></ToastProvider>;
}

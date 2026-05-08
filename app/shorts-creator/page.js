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

const VOICE_DESC = `13 year old Indian boy voice — medium-deep, confident, clear Hindi diction, same consistent voice in every scene. Pure Hindi Indian accent. No background music.`;

// ── Category Map ──────────────────────────────────────────────
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

// ── Category groups — concepts filter karne ke liye ──────────
// "edible" = khaane wali cheezein (fruit, vegetable, food)
// "animal" = sab janwar (wild, domestic, water, bird, insect)
// "object" = baaki sab cheezein
function getCategoryGroup(type) {
  if (['fruit', 'vegetable', 'food'].includes(type)) return 'edible';
  if (['wild_animal', 'domestic_animal', 'water_animal', 'bird', 'insect'].includes(type)) return 'animal';
  return 'object';
}

// ── CONCEPT MAP — group ke hisaab se alag-alag ───────────────
// EDIBLE concepts (fruit/vegetable/food)
const EDIBLE_CONCEPTS = {
  dukh: {
    label: '😢 Mera Dukh',
    desc: 'Koi nahi khata — rote hue apna dard sunata hai',
    scenes: [
      { title: 'Rota Hua Entry',  hint: 'Rote hue enter, aankhon mein aansu' },
      { title: 'Pehla Dukh',     hint: 'Koi nahi khata — pehla dard batata hai' },
      { title: 'Aur Rona',       hint: 'Aur zyada dukh — koi nahi sunta' },
      { title: 'Bilkul Akela',   hint: 'Corner mein baith jaata hai, akela feel' },
      { title: 'Sad Ending',     hint: 'Phir bhi rota hua baith jaata hai' },
    ],
  },
  fayde: {
    label: '💪 Mere Fayde',
    desc: 'Proudly apne benefits bacchon ko batata hai',
    scenes: [
      { title: 'Proud Entry',   hint: 'Confidently enter, chest out, smile' },
      { title: 'Pehla Fayda',  hint: 'Pehla benefit excitedly batata hai' },
      { title: 'Doosra Fayda', hint: 'Doosra benefit — dancing karta hai' },
      { title: 'Teesra Fayda', hint: 'Teesra benefit — sab bacche wow bolte hain' },
      { title: 'Khao Mujhe!',  hint: '"Ab toh khaao mujhe!" — thumbs up' },
    ],
  },
  dono: {
    label: '🎭 Dukh + Fayde',
    desc: 'Pehle rota hai, phir proudly fayde batata hai',
    scenes: [
      { title: 'Rota Hua Entry',   hint: 'Rote hue enter karta hai' },
      { title: 'Dukh Sunata Hai',  hint: 'Koi nahi khata — dard batata hai' },
      { title: 'Himmat Karta Hai', hint: '"Ruko! Main batata hoon main kyu khaas hoon!"' },
      { title: 'Fayde Batata Hai', hint: 'Proudly apne benefits sunata hai' },
      { title: 'Happy Ending!',    hint: '"Ab khao mujhe!" — baccha aata hai, dono khush' },
    ],
  },
  intro: {
    label: '👋 Khud Ko Milao',
    desc: 'Apna naam, family aur ghar bacchon ko batata hai',
    scenes: [
      { title: 'Hello Bacchon!', hint: 'Excited greeting, waving at camera' },
      { title: 'Main Kaun Hoon', hint: 'Naam aur family batata hai' },
      { title: 'Meri Khasiyat', hint: 'Apna rang, shape, taste batata hai' },
      { title: 'Mera Ghar',     hint: 'Kahan paaya jaata hai — batata hai' },
      { title: 'Dosto Bano!',   hint: '"Khaao mujhe aur dosti karo!" pyara ending' },
    ],
  },
};

// ANIMAL concepts (wild/domestic/water/bird/insect)
const ANIMAL_CONCEPTS = {
  parichay: {
    label: '🦁 Mujhe Pahchano!',
    desc: 'Main kaun hoon, kahan rehta hoon, kya khata hoon',
    scenes: [
      { title: 'Hello Bacchon!',  hint: 'Excited entry, roar/sound karta hai' },
      { title: 'Main Kaun Hoon',  hint: 'Apna naam aur animal family batata hai' },
      { title: 'Mera Ghar',       hint: 'Jungle/farm/ocean/sky mein rehta hai — dikhata hai' },
      { title: 'Main Kya Khata',  hint: 'Apna khaana batata hai — grass/meat/fish etc' },
      { title: 'Yaad Rakhna!',    hint: '"${name} ko yaad rakhna!" — pyara wave goodbye' },
    ],
  },
  awaaz: {
    label: '🔊 Meri Awaaz',
    desc: 'Apni unique awaaz aur khasiyat bacchon ko sikhata hai',
    scenes: [
      { title: 'Entry',           hint: 'Confidently enter karta hai' },
      { title: 'Meri Awaaz',      hint: 'Apni awaaz karta hai — roar/moo/tweet etc' },
      { title: 'Phir Se Bolo!',   hint: 'Bacchon ko repeat karne ke liye kehta hai' },
      { title: 'Meri Khasiyat',   hint: 'Special cheez batata hai — dhaari/patchy/wings etc' },
      { title: 'Suno Mujhe!',     hint: '"Rang Tarang pe phir milenge!" — happy ending' },
    ],
  },
  taakat: {
    label: '💪 Meri Taakat',
    desc: 'Apni power, speed, aur khaas kaam batata hai',
    scenes: [
      { title: 'Superhero Entry', hint: 'Chest out, powerful pose karta hai' },
      { title: 'Meri Power',      hint: 'Apni sabse badi khasiyat batata hai' },
      { title: 'Main Kya Kar Sakta', hint: 'Kya khaas kaam karta hai — dikhata hai' },
      { title: 'Meri Dost Species', hint: 'Kaun sa animal uska dost hai' },
      { title: 'Main Hoon Hero!', hint: '"${name} hoon main — yaad rakhna!" — victory pose' },
    ],
  },
  dono_animal: {
    label: '😢➡️💪 Dukh + Taakat',
    desc: 'Pehle akela feel karta hai, phir proudly apni taakat batata hai',
    scenes: [
      { title: 'Akela Entry',     hint: 'Sad face, slowly enter karta hai' },
      { title: 'Mera Dukh',       hint: '"Koi nahi jaanta mujhe..." — sad voice' },
      { title: 'Himmat Karta Hai',hint: '"Ruko! Main batata hoon main kaun hoon!"' },
      { title: 'Meri Taakat',     hint: 'Proudly apni power aur khasiyat sunata hai' },
      { title: 'Happy Ending!',   hint: 'Baccha aata hai, dono khush, thumbs up' },
    ],
  },
};

// OBJECT concepts (vehicle, toy, instrument, tool, furniture, etc.)
const OBJECT_CONCEPTS = {
  kaam: {
    label: '🔧 Mera Kaam',
    desc: 'Main kya kaam aata hoon — bacchon ko batata hai',
    scenes: [
      { title: 'Hello Bacchon!', hint: 'Excited entry with a proud pose' },
      { title: 'Main Kya Hoon',  hint: 'Apna naam aur category batata hai' },
      { title: 'Mera Pehla Kaam',hint: 'Pehla use-case excitedly batata hai' },
      { title: 'Mera Doosra Kaam', hint: 'Doosra use-case — dancing karta hai' },
      { title: 'Mere Bina Nahi!', hint: '"Mujhse kaam lo!" — thumbs up, happy ending' },
    ],
  },
  parichay: {
    label: '👋 Mujhe Pahchano!',
    desc: 'Apna naam, shape, rang aur ghar bacchon ko batata hai',
    scenes: [
      { title: 'Hello Bacchon!', hint: 'Wave karta hai, excited greeting' },
      { title: 'Main Kaun Hoon', hint: 'Apna naam aur type batata hai' },
      { title: 'Meri Khasiyat', hint: 'Apna rang, size, shape dikhata hai' },
      { title: 'Mera Ghar',     hint: 'Kahan milta hai — school/road/ghar' },
      { title: 'Yaad Rakhna!',  hint: '"${name} ko yaad rakhna!" — wave goodbye' },
    ],
  },
  dono_object: {
    label: '😢➡️🔧 Dukh + Kaam',
    desc: 'Koi use nahi karta — phir proudly apna kaam batata hai',
    scenes: [
      { title: 'Udaas Entry',    hint: 'Sad face, slowly enter karta hai' },
      { title: 'Mera Dukh',      hint: '"Koi mujhe use nahi karta..." — sad voice' },
      { title: 'Himmat Karta',   hint: '"Ruko! Main batata hoon main kyu zaroori hoon!"' },
      { title: 'Mera Kaam',      hint: 'Proudly apna kaam aur fayde sunata hai' },
      { title: 'Happy Ending!',  hint: 'Baccha aata hai, use karta hai, dono khush' },
    ],
  },
  superpower: {
    label: '✨ Meri Superpower',
    desc: 'Apni special khasiyat aur power ke baare mein batata hai',
    scenes: [
      { title: 'Superhero Entry', hint: 'Superhero pose ke saath enter karta hai' },
      { title: 'Meri Khasiyat',   hint: 'Sabse khaas cheez batata hai proudly' },
      { title: 'Main Kar Sakta',  hint: 'Kya special kaam karta hai — live demo' },
      { title: 'Mera Best Feature', hint: 'Best feature highlight karta hai' },
      { title: 'Main Hoon Best!', hint: '"${name} hoon main — use karo mujhe!" — victory' },
    ],
  },
};

// ── Get concepts by category type ────────────────────────────
function getConceptsForType(type) {
  const group = getCategoryGroup(type);
  if (group === 'edible') return EDIBLE_CONCEPTS;
  if (group === 'animal') return ANIMAL_CONCEPTS;
  return OBJECT_CONCEPTS;
}

function getDefaultConcept(type) {
  const group = getCategoryGroup(type);
  if (group === 'edible') return 'dukh';
  if (group === 'animal') return 'parichay';
  return 'kaam';
}

function getConceptDef(type, concept) {
  const map = getConceptsForType(type);
  return map[concept] || Object.values(map)[0];
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

function formatScheduledTime(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  let h = date.getHours(); const min = date.getMinutes().toString().padStart(2,'0');
  const ampm = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} • ${h}:${min} ${ampm}`;
}

const COLORS = ['#ff4400', '#44bb66', '#4488ff', '#cc88ff', '#ff8800', '#ff4488', '#00ccbb', '#ffcc00'];

// ── Object visual helper ──────────────────────────────────────
function getObjectVisual(objectName) {
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
    Giraffe: 'tall giraffe with long neck and yellow-brown patches',
    Monkey: 'brown monkey with long tail and big curious eyes',
    Cow: 'black and white cow with big gentle eyes',
    Dog: 'fluffy brown dog with wagging tail',
    Cat: 'orange striped cat with bright green eyes',
    Fish: 'colorful tropical fish with shiny scales',
    Dolphin: 'blue-grey dolphin jumping with a big smile',
    Frog: 'bright green frog with round big eyes',
    Butterfly: 'colorful butterfly with patterned wings',
    Parrot: 'bright green and red parrot',
    Peacock: 'beautiful peacock with colorful tail feathers spread wide',
    Sparrow: 'small brown sparrow with tiny beak',
    Rose: 'beautiful red rose with thorny green stem',
    Sunflower: 'tall bright yellow sunflower with brown center',
    Car: 'shiny red sports car with four wheels',
    Bus: 'yellow school bus with windows',
    Bicycle: 'blue bicycle with round wheels',
    Guitar: 'brown acoustic guitar with strings',
    Drum: 'red drum set with drumsticks',
    Football: 'black and white football',
    Cricket: 'cricket bat and red cricket ball',
  };
  return visuals[objectName] || `${objectName.toLowerCase()}`;
}

function getBackground(type, objectName) {
  const cat = CATEGORY_MAP[type];
  return cat ? cat.bg : `a colorful bright background suitable for ${objectName}`;
}

// ── 1. INTRO IMAGE PROMPT ─────────────────────────────────────
function buildIntroImagePrompt(short) {
  const bg = getBackground(short.type, short.objectName);
  const visual = getObjectVisual(short.objectName);
  const group = getCategoryGroup(short.type);
  const conceptDef = getConceptDef(short.type, short.concept);

  let emotion = 'big happy smile, waving hand at camera';
  if (short.concept === 'dukh') emotion = 'sad teary eyes, small frown, looking down';
  else if (short.concept === 'fayde' || short.concept === 'taakat' || short.concept === 'kaam' || short.concept === 'superpower') emotion = 'big confident smile, chest puffed out, arms wide';
  else if (short.concept === 'dono' || short.concept === 'dono_animal' || short.concept === 'dono_object') emotion = 'half sad half hopeful expression';

  return `Pixar 3D style vertical 9:16 image. Background: ${bg}. Center of image: one big cute animated ${visual} character — chubby Pixar body, tiny arms and legs, very expressive face with ${emotion}. Bold glowing rainbow text "${short.objectName}" floating above the character with colorful sparkles. Bottom text: "${conceptDef.label}" in bold Hindi font. Bright colorful lighting. No teacher. No other characters. Studio quality render. THIS IS THE REFERENCE IMAGE — all video scenes must match this exact background and character style.`;
}

// ── 2. INTRO VIDEO PROMPT ─────────────────────────────────────
function buildIntroVideoPrompt(short) {
  const visual = getObjectVisual(short.objectName);
  const name = short.objectName;
  const group = getCategoryGroup(short.type);

  let greeting = '';
  if (short.concept === 'dukh') {
    greeting = `"हैलो बच्चों... मैं हूँ ${name}..." (sad, slow voice, sniffling)`;
  } else if (short.concept === 'fayde') {
    greeting = `"हैलो बच्चों! मैं हूँ ${name}! आज मैं बताऊँगा — मैं कितना ज़रूरी हूँ!" (loud, proud, excited)`;
  } else if (short.concept === 'dono') {
    greeting = `"हैलो बच्चों... मैं हूँ ${name}..." (starts sad, voice breaks slightly)`;
  } else if (short.concept === 'parichay') {
    if (group === 'animal') greeting = `"हैलो बच्चों! मैं हूँ ${name}!" (makes animal sound, excited wave)`;
    else greeting = `"हैलो बच्चों! मैं हूँ ${name}! आओ मुझे पहचानो!" (cheerful, waving)`;
  } else if (short.concept === 'awaaz') {
    greeting = `"हैलो बच्चों! सुनो मेरी आवाज़ — मैं हूँ ${name}!" (confident, makes sound)`;
  } else if (short.concept === 'taakat') {
    greeting = `"हैलो बच्चों! मैं हूँ ${name} — और मैं बहुत powerful हूँ!" (superhero pose, loud)`;
  } else if (short.concept === 'dono_animal') {
    greeting = `"हैलो बच्चों... मैं हूँ ${name}..." (sad entry, slow voice)`;
  } else if (short.concept === 'kaam') {
    greeting = `"हैलो बच्चों! मैं हूँ ${name}! जानते हो मैं क्या काम करता हूँ?" (excited, curious)`;
  } else if (short.concept === 'dono_object') {
    greeting = `"हैलो बच्चों... मैं हूँ ${name}..." (sad entry, nobody uses me)`;
  } else if (short.concept === 'superpower') {
    greeting = `"हैलो बच्चों! मैं हूँ ${name} — और मेरे पास है एक superpower!" (dramatic pose)`;
  } else {
    greeting = `"हैलो बच्चों! मैं हूँ ${name}! आओ दोस्ती करो मुझसे!" (cheerful, friendly wave)`;
  }

  return `Use the reference image exactly as the complete background scene — do not change background, lighting, colors, or setting. Same Pixar 3D animated ${visual} character already standing at center of screen — chubby body, tiny arms and legs, very expressive anime-style eyes. NO entry animation — character is already present when video starts. Character says: ${greeting}. Bold glowing text "${name}" appears at top with sparkles. 8 seconds. Perfect lip sync. No teacher. No other characters. VOICE: ${VOICE_DESC}`;
}

// ── 3. SCENE PROMPT — fully dynamic per object + concept ──────
function buildScenePrompt(short, sceneIndex) {
  const visual = getObjectVisual(short.objectName);
  const conceptDef = getConceptDef(short.type, short.concept);
  const scene = conceptDef.scenes[sceneIndex];
  const name = short.objectName;
  const catLabel = getCategory(short.type).label;
  const group = getCategoryGroup(short.type);

  // ── EDIBLE dialogues ──────────────────────────────────────
  const edibleDialogues = {
    dukh: [
      `"बच्चों... कोई मुझे नहीं खाता... मैं ${name} हूँ और मैं बहुत उदास हूँ!" (${name} wiping tears with tiny hand, lip trembling)`,
      `"देखो... मैं यहाँ रखा रहता हूँ... कोई ${name} को नहीं चुनता!" (pointing to self sadly, more tears)`,
      `"मैंने सोचा था आज कोई मुझे खाएगा... पर किसी ने ${name} की तरफ देखा तक नहीं!" (sits down, crying harder)`,
      `"अकेला हूँ मैं... कोई नहीं है मेरा... ${name} का कोई दोस्त नहीं!" (curled up in corner, sobbing quietly)`,
      `"शायद ${name} काम का नहीं है किसी के..." (last tear rolls down, slow sad fade out)`,
    ],
    fayde: [
      `"सुनो बच्चों! ${name} का पहला फायदा — मैं तुम्हारी सेहत बनाता हूँ! 💪" (${name} pointing to muscles excitedly, bouncing)`,
      `"${name} का दूसरा फायदा — मैं तुम्हारी आँखें तेज़ करता हूँ! 👁️" (pointing to eyes, big smile, happy dance)`,
      `"और ${name} का तीसरा फायदा — मैं बहुत tasty भी हूँ! 😋" (rubbing tummy in circles, licking lips)`,
      `"Doctor भी कहता है — रोज़ खाओ ${name}! 🩺" (wagging finger at camera confidently, winking)`,
      `"तो बच्चों — खाओ ${name} और healthy रहो! 🌟" (big thumbs up, victory dance)`,
    ],
    dono: [
      `"बच्चों... कोई मुझे नहीं खाता... मैं ${name} हूँ और बहुत उदास हूँ..." (slow entry, tears, sad voice)`,
      `"देखो, मैं ${name} यहाँ रखा रहता हूँ... कोई नहीं आता मेरे पास..." (pointing sadly, small sob)`,
      `"रुको! रोना बंद! मैं ${name} बताता हूँ — मैं कितना ज़रूरी हूँ!" (wipes tears dramatically, stands straight, determined)`,
      `"मैं ${name} हूँ — मैं तुम्हें healthy बनाता हूँ, tasty हूँ, और तुम्हारा दोस्त!" (proudly listing on fingers)`,
      `"अब तो खाओ मुझे — ${name} को मत भूलना!" (child's hand appears, picks up ${name}, both happy, confetti falls)`,
    ],
    intro: [
      `"मैं हूँ ${name}! और मैं ${catLabel} family से आता हूँ!" (${name} pointing to self proudly, spinning to show off)`,
      `"मेरा नाम है ${name} — यहाँ देखो मुझे!" (pointing to self with both tiny arms, big smile)`,
      `"${name} की सबसे ख़ास बात? मैं इतना colorful और tasty हूँ!" (doing a little pose, winking at camera)`,
      `"बच्चों, क्या आप ${name} को पहचानते हो?" (leaning forward toward camera with curious big eyes)`,
      `"आओ ${name} खाओ और दोस्ती करो! Rang Tarang पर मिलते रहेंगे!" (big wave, hearts floating around)`,
    ],
  };

  // ── ANIMAL dialogues ──────────────────────────────────────
  const animalDialogues = {
    parichay: [
      `"बच्चों! मैं हूँ ${name}! मैं ${catLabel} हूँ!" (${name} makes its animal sound — roar/moo/tweet, excited wave)`,
      `"मेरा नाम है ${name} — और मैं ${catLabel} family से आता हूँ!" (${name} proudly points to self with tiny arms)`,
      `"मेरा घर है ${getCategory(short.type).bg.split(' with')[0].replace('a ', '').replace('an ', '')}! यहाँ रहता हूँ मैं!" (${name} gestures around at background happily)`,
      `"मैं ${name} खाता हूँ — यही मेरी पसंद है!" (${name} pretends to eat, rubs tummy with satisfied smile)`,
      `"${name} को याद रखना बच्चों! Rang Tarang पर मिलते रहेंगे!" (${name} waves goodbye with tiny arm, big smile)`,
    ],
    awaaz: [
      `"बच्चों! मैं हूँ ${name}! देखो मैं कैसे enter करता हूँ!" (${name} enters confidently, strikes a pose)`,
      `"सुनो मेरी आवाज़! मैं ${name} हूँ और मेरी आवाज़ है बहुत ख़ास!" (${name} opens mouth, makes its unique sound boldly)`,
      `"बच्चों! आप भी बोलो मेरे साथ! ${name} की आवाज़ करो!" (${name} cups ears, waiting for kids to repeat, excited)`,
      `"और देखो मेरी ख़ास बात — मेरा रंग, मेरा shape, सब unique!" (${name} shows off its features — stripes/spots/wings)`,
      `"${name} को याद रखो — Rang Tarang subscribe करना!" (big cheerful wave, sparkles around ${name})`,
    ],
    taakat: [
      `"बच्चों! मैं हूँ ${name} — सबसे powerful!" (${name} enters with superhero landing pose, muscles flexed)`,
      `"मेरी सबसे बड़ी power? देखो!" (${name} shows off its biggest feature — roar/jump/run/swim demonstration)`,
      `"मैं ${name} — यह कर सकता हूँ जो कोई नहीं कर सकता!" (${name} does its special move proudly)`,
      `"मेरा दोस्त कौन है? जो मेरे साथ रहता है — हम साथ powerful हैं!" (${name} makes a friendly gesture)`,
      `"मैं हूँ ${name} — hero! याद रखना बच्चों!" (${name} victory pose, fist pump, big smile)`,
    ],
    dono_animal: [
      `"बच्चों... मैं ${name} हूँ... कोई मुझे नहीं जानता..." (slow entry, sad face, drooping)`,
      `"देखो... कोई ${name} को नहीं पहचानता... बड़ा दुख होता है..." (pointing to self sadly, a tear)`,
      `"रुको! रोना बंद! मैं ${name} बताता हूँ — मैं कितना amazing हूँ!" (wipes tear, stands straight, determined)`,
      `"मैं ${name} हूँ — मेरी power है, मेरी आवाज़ है, मेरा घर है!" (proudly shows off features one by one)`,
      `"अब पहचानो मुझे! ${name} तुम्हारा दोस्त है!" (child appears, ${name} waves happily, confetti)`,
    ],
  };

  // ── OBJECT dialogues ──────────────────────────────────────
  const objectDialogues = {
    kaam: [
      `"हैलो बच्चों! मैं हूँ ${name}! मैं ${catLabel} हूँ!" (${name} enters confidently, does a little bow)`,
      `"मेरा नाम है ${name} — और मैं यह काम करता हूँ!" (${name} points to self proudly, explains what it is)`,
      `"${name} का पहला काम — देखो मैं क्या करता हूँ! 🌟" (${name} demonstrates its primary use excitedly)`,
      `"मेरा दूसरा काम — यह भी कर सकता हूँ मैं! 💪" (${name} shows another use, dancing happily)`,
      `"मेरे बिना यह काम नहीं होगा! Use करो ${name} को!" (${name} thumbs up, victory pose, big smile)`,
    ],
    parichay: [
      `"हैलो बच्चों! मैं हूँ ${name} — क्या पहचाना मुझे?" (${name} waves excitedly, curious expression)`,
      `"मेरा नाम है ${name}! मैं ${catLabel} family से हूँ!" (${name} points to self, stands tall proudly)`,
      `"देखो मेरा रंग, मेरा shape — मैं कितना unique हूँ!" (${name} spins to show off from all sides)`,
      `"मैं ${name} मिलता हूँ — बच्चों बताओ कहाँ पाओगे मुझे?" (${name} leans toward camera curiously)`,
      `"${name} को याद रखना! Rang Tarang पर मिलते रहेंगे!" (big cheerful wave, hearts and sparkles)`,
    ],
    dono_object: [
      `"बच्चों... मैं ${name} हूँ... कोई मुझे use नहीं करता..." (slow entry, sad face, slumped)`,
      `"देखो, मैं ${name} यहाँ रखा हूँ... कोई मुझे नहीं उठाता..." (pointing to self sadly, small sigh)`,
      `"रुको! मैं ${name} बताता हूँ — मैं कितना ज़रूरी हूँ!" (wipes tear, stands straight, determined face)`,
      `"मैं ${name} हूँ — मेरे बिना यह काम नहीं होगा! देखो!" (proudly demonstrates use, chest out)`,
      `"अब use करो ${name} को!" (child's hand appears and uses ${name}, both happy, confetti falls)`,
    ],
    superpower: [
      `"बच्चों! मैं हूँ ${name} — और मेरे पास है एक superpower!" (${name} dramatic superhero pose)`,
      `"मेरी superpower है — देखो!" (${name} shows off its most impressive feature dramatically)`,
      `"मैं ${name} — यह कर सकता हूँ जो कोई और नहीं कर सकता!" (${name} live demo of special feature)`,
      `"मेरा best feature है — यह!" (${name} highlights one key thing about itself with sparkles)`,
      `"मैं हूँ ${name} — best of the best! Use करो मुझे!" (victory pose, big thumbs up, fireworks)`,
    ],
  };

  // Select correct dialogue set
  let dialogue = '';
  if (group === 'edible') {
    dialogue = (edibleDialogues[short.concept] || edibleDialogues.intro)[sceneIndex] || '';
  } else if (group === 'animal') {
    dialogue = (animalDialogues[short.concept] || animalDialogues.parichay)[sceneIndex] || '';
  } else {
    dialogue = (objectDialogues[short.concept] || objectDialogues.kaam)[sceneIndex] || '';
  }

  // Replace ${name} placeholder in dialogue strings
  dialogue = dialogue.replace(/\$\{name\}/g, name);

  return `Use the reference image exactly as the complete background scene — do not change background, lighting, colors, or setting. Continue directly from the last frame of the previous scene — same Pixar 3D animated ${visual} character, exact same style, same size, same colors, seamless continuation. Scene ${sceneIndex + 1}: "${scene.title}". Character says: ${dialogue}. Very expressive face — emotions clearly visible. Perfect lip sync. 8-10 seconds. Smooth animation. No glitch. No teacher. No other characters. VOICE: ${VOICE_DESC}`;
}

// ── 4. OUTRO VIDEO PROMPT ─────────────────────────────────────
function buildOutroVideoPrompt(short) {
  const visual = getObjectVisual(short.objectName);
  const name = short.objectName;
  const group = getCategoryGroup(short.type);
  const isSad = ['dukh', 'dono', 'dono_animal', 'dono_object'].includes(short.concept);

  let outroLine = '';
  if (short.concept === 'dukh') {
    outroLine = `${name} still sitting sadly. Slowly looks up at camera with watery eyes and says: "बच्चों... ${name} को याद रखना... Rang Tarang subscribe करना मत भूलना..." then looks back down sadly.`;
  } else if (group === 'animal') {
    outroLine = `${name} does a happy little jump and makes its sound, then says: "तो बच्चों — ${name} को याद रखो! Rang Tarang subscribe करो aur bell दबाओ! टाटा! 👋" waves enthusiastically at camera.`;
  } else if (group === 'edible') {
    outroLine = `${name} does a happy little dance and says: "तो बच्चों — ${name} को याद रखो और खाओ! Rang Tarang subscribe करो और bell दबाओ! टाटा! 👋" waves enthusiastically at camera.`;
  } else {
    outroLine = `${name} does a happy little dance and says: "तो बच्चों — ${name} को याद रखो! Rang Tarang subscribe करो और bell दबाओ! टाटा! 👋" waves enthusiastically at camera.`;
  }

  return `Use the reference image exactly as the complete background scene — do not change background, lighting, colors, or setting. Continue directly from the last frame of the previous scene — same Pixar 3D animated ${visual} character, seamless continuation. ${outroLine} Bold glowing text "Rang Tarang Subscribe Karo! 🔔" appears with colorful sparkles. 8 seconds. Smooth. No glitch. Perfect lip sync. VOICE: ${VOICE_DESC}`;
}

// ── AI Call ───────────────────────────────────────────────────
async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 800, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function generateYTTitleDesc(short) {
  const conceptDef = getConceptDef(short.type, short.concept);
  const text = await aiCall(`YouTube Shorts SEO expert for Hindi kids channel "Rang Tarang" (@RangTarangHindi).
Short about: "${short.objectName}" (${getCategory(short.type).label}) — Concept: ${conceptDef.label}
Format: YouTube SHORT vertical 9:16. Target: Indian parents, kids 2-6.
TITLE: Max 60 chars, Hindi+English mix, end with "| Rang Tarang", NO emoji
DESCRIPTION: Hook in Hindi, content mention, subscribe line, hashtags
TAGS: Comma separated, max 15, mix Hindi+English
Return ONLY JSON: {"title":"...","description":"...","tags":"..."}`);
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ── TitleDescSection ──────────────────────────────────────────
function TitleDescSection({ short, hasTitleDesc, genTD, onGenerate, onSave, onCopy, copiedKey, videoId }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle]     = useState(short.ytTitle || '');
  const [desc, setDesc]       = useState(short.ytDescription || '');
  const [tags, setTags]       = useState(short.ytTags || '');
  const [regenLoading, setRegenLoading] = useState({ title: false, desc: false, tags: false });
  const [ytUpdating, setYtUpdating]     = useState(false);
  const toast = useToast();

  useEffect(() => {
    setTitle(short.ytTitle || '');
    setDesc(short.ytDescription || '');
    setTags(short.ytTags || '');
  }, [short.ytTitle, short.ytDescription, short.ytTags]);

  async function regenField(field) {
    setRegenLoading(p => ({ ...p, [field]: true }));
    try {
      const conceptDef = getConceptDef(short.type, short.concept);
      let prompt = '';
      if (field === 'title') prompt = `Generate ONLY a YouTube title for Hindi kids Shorts about "${short.objectName}" (${conceptDef.label}). Max 60 chars, Hindi+English mix, end with "| Rang Tarang". NO emoji. Return ONLY the title.`;
      else if (field === 'desc') prompt = `Generate ONLY a YouTube description for Hindi kids Shorts about "${short.objectName}" (${conceptDef.label}). Hook in Hindi, content, subscribe line https://youtube.com/@RangTarangHindi, hashtags. Return ONLY the description.`;
      else if (field === 'tags') prompt = `Generate ONLY YouTube tags for Hindi kids Shorts about "${short.objectName}" (${conceptDef.label}). Comma separated, max 15, Hindi+English. Return ONLY tags string.`;
      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 300, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || '').trim();
      if (field === 'title') setTitle(text);
      else if (field === 'desc') setDesc(text);
      else if (field === 'tags') setTags(text);
      toast(`✅ ${field} regenerated!`);
    } catch (e) { toast('❌ ' + e.message); }
    setRegenLoading(p => ({ ...p, [field]: false }));
  }

  async function updateYouTube() {
    if (!videoId) { toast('❌ Video ID nahi mila'); return; }
    setYtUpdating(true);
    try {
      const res = await fetch('/api/youtube/update', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ videoId, title, description: desc, tags }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast(data.message);
    } catch (e) { toast('❌ ' + e.message); }
    setYtUpdating(false);
  }

  const fieldStyle = { width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
  const regenBtnStyle = (loading) => ({ background: loading ? '#111' : '#1a1000', border: '1px solid #443300', color: loading ? '#555' : '#ffaa44', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 });
  const copyBtnStyle = (copied) => ({ position: 'absolute', top: 6, right: 6, background: copied ? '#44bb66' : '#1a1a1a', border: `1px solid ${copied ? '#44bb66' : '#333'}`, color: copied ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' });

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${hasTitleDesc ? '#1a3a2a' : '#2a1a00'}`, borderRadius: 12, overflow: 'hidden' }}>
      <div onClick={() => setEditing(e => !e)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: hasTitleDesc ? '#44bb66' : '#ffaa44' }}>📝 Title & Description</span>
          {hasTitleDesc
            ? <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>✅</span>
            : <span style={{ fontSize: 9, background: 'rgba(255,170,0,0.1)', color: '#ffaa44', border: '1px solid rgba(255,170,0,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>Zaroori</span>}
        </div>
        <span style={{ fontSize: 13, color: '#444' }}>{editing ? '▲' : '▼'}</span>
      </div>
      {editing && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={onGenerate} disabled={genTD}
            style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {genTD ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ffaa44' }} />Generate ho raha hai...</> : '🤖 Teeno AI se Generate Karo'}
          </button>
          {[
            { key: 'title', label: '📌 YouTube Title', val: title, set: setTitle, loading: regenLoading.title, copy: 'ytTitle', multi: false },
            { key: 'desc',  label: '📄 YouTube Description', val: desc, set: setDesc, loading: regenLoading.desc, copy: 'ytDesc', multi: true, rows: 4 },
            { key: 'tags',  label: '🏷️ YouTube Tags', val: tags, set: setTags, loading: regenLoading.tags, copy: 'ytTags', multi: true, rows: 2 },
          ].map(f => (
            <div key={f.key}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>{f.label}</div>
                <button onClick={() => regenField(f.key)} disabled={f.loading} style={regenBtnStyle(f.loading)}>
                  {f.loading ? <div className="spinner" style={{ width: 10, height: 10, borderTopColor: '#ffaa44' }} /> : '🔄 Regen'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                {f.multi
                  ? <textarea value={f.val} onChange={e => f.set(e.target.value)} rows={f.rows} style={{ ...fieldStyle, resize: 'vertical', lineHeight: 1.6 }} />
                  : <input value={f.val} onChange={e => f.set(e.target.value)} style={fieldStyle} />}
                <button onClick={() => onCopy(f.copy, f.val)} style={copyBtnStyle(copiedKey === f.copy)}>{copiedKey === f.copy ? '✅' : '📋'}</button>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onSave(title, desc, tags); setEditing(false); }}
              style={{ flex: 1, background: 'rgba(68,187,102,0.12)', border: '1px solid rgba(68,187,102,0.4)', color: '#44bb66', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>💾 Save</button>
            {videoId && (
              <button onClick={updateYouTube} disabled={ytUpdating}
                style={{ flex: 1, background: ytUpdating ? '#111' : 'rgba(255,0,0,0.1)', border: '1px solid #cc000044', color: ytUpdating ? '#555' : '#ff4444', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: ytUpdating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {ytUpdating ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ff4444' }} />Updating...</> : '▶️ YT Update'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
function ShortsCreatorPage({ user }) {
  const toast = useToast();
  const [shortsList, setShortsList]         = useState([]);
  const [loadingList, setLoadingList]       = useState(true);
  const [openFolder, setOpenFolder]         = useState(null);
  const [openShort, setOpenShort]           = useState(null);
  const [openSection, setOpenSection]       = useState(null);
  const [copiedKey, setCopiedKey]           = useState('');
  const [ytVideos, setYtVideos]             = useState([]);
  const [ytLoading, setYtLoading]           = useState(true);
  const [playlistStatus, setPlaylistStatus] = useState({});
  const [modal, setModal]                   = useState('none');
  const [generating, setGenerating]         = useState(false);
  const [genTD, setGenTD]                   = useState(false);
  const [step, setStep]                     = useState(1);
  const [selectedType, setSelectedType]     = useState(null);
  const [aiObjects, setAiObjects]           = useState([]);
  const [aiLoading, setAiLoading]           = useState(false);
  const [selectedObject, setSelectedObject] = useState('');
  const [customObject, setCustomObject]     = useState('');
  const [selectedConcept, setSelectedConcept] = useState('');
  const [selectedColor, setSelectedColor]   = useState('#ff4488');

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
    if (matched.isScheduled) return { status: 'scheduled', scheduledAt: matched.scheduledAt };
    if (matched.privacyStatus === 'private') return 'private';
    return true;
  }

  function isDeleteDisabled(short) {
    const u = checkUploaded(short);
    return u === true || u === 'private' || (u && typeof u === 'object');
  }

  async function addToPlaylist(short, videoId) {
    setPlaylistStatus(p => ({ ...p, [short.id]: 'loading' }));
    try {
      const cat = getCategory(short.type);
      const res = await fetch('/api/youtube/playlist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, playlistTitle: cat.label }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlaylistStatus(p => ({ ...p, [short.id]: 'added' }));
      await updateShort(user.uid, short.id, { playlistAdded: true });
      const updated = { ...short, playlistAdded: true };
      setShortsList(l => l.map(s => s.id === short.id ? updated : s));
      setOpenShort(updated);
      toast(data.message);
    } catch (e) {
      setPlaylistStatus(p => ({ ...p, [short.id]: null }));
      toast('❌ ' + e.message);
    }
  }

  async function loadAiObjects(type) {
    setAiLoading(true); setAiObjects([]);
    const cat = getCategory(type);
    try {
      const text = await aiCall(`List exactly 12 common ${cat.label} items that Indian kids aged 2-6 know well.
Already created: ${shortsList.map(s => s.objectName).join(', ') || 'none'}
Return ONLY JSON array of English names: ["Apple","Banana","Mango"]`);
      setAiObjects(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { toast('❌ AI se nahi aaya'); }
    setAiLoading(false);
  }

  function openNewModal() {
    setModal('new'); setStep(1); setSelectedType(null); setAiObjects([]);
    setSelectedObject(''); setCustomObject(''); setSelectedConcept(''); setSelectedColor('#ff4488');
  }

  async function selectCategory(type) {
    setSelectedType(type);
    setSelectedConcept(getDefaultConcept(type));
    setStep(2);
    await loadAiObjects(type);
  }

  function selectObject(obj) { setSelectedObject(obj); setCustomObject(obj); setStep(3); }

  async function generateShort() {
    const finalObject = customObject.trim() || selectedObject;
    if (!finalObject || !selectedType || !selectedConcept) return;
    setGenerating(true);
    try {
      const cat = getCategory(selectedType);
      await saveShort(user.uid, {
        objectName: finalObject, type: selectedType, concept: selectedConcept,
        color: selectedColor, emoji: cat.emoji,
        doneSections: {}, doneCount: 0, progress: 0,
        ytTitle: '', ytDescription: '', ytTags: '',
      });
      toast(`${cat.emoji} "${finalObject}" short ready!`);
      setModal('none'); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function markDone(short, key, wasDone) {
    const doneSections = { ...(short.doneSections || {}) };
    if (wasDone) delete doneSections[key]; else doneSections[key] = true;
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
      await updateShort(user.uid, short.id, { ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags || '' });
      const updated = { ...short, ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags || '' };
      setShortsList(l => l.map(s => s.id === short.id ? updated : s));
      setOpenShort(updated);
      toast('✅ Title, Description & Tags ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  async function saveTitleDesc(short, title, desc, tags) {
    await updateShort(user.uid, short.id, { ytTitle: title, ytDescription: desc, ytTags: tags });
    const updated = { ...short, ytTitle: title, ytDescription: desc, ytTags: tags };
    setShortsList(l => l.map(s => s.id === short.id ? updated : s));
    setOpenShort(updated);
    toast('💾 Saved!');
  }

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key); setTimeout(() => setCopiedKey(''), 2000); toast('📋 Copied!');
    });
  }

  async function handleDelete(short) {
    if (!confirm(`"${short.objectName}" delete karein?`)) return;
    await deleteShort(user.uid, short.id);
    toast('🗑 Deleted!'); setOpenShort(null); loadList();
  }

  // ── LEVEL 3: SHORT DETAIL ────────────────────────────────────
  if (openShort) {
    const s = openShort;
    const done = s.doneSections || {};
    const conceptDef = getConceptDef(s.type, s.concept);
    const cat = getCategory(s.type);
    const hasTitleDesc = !!(s.ytTitle && s.ytDescription);
    const deleteDisabled = isDeleteDisabled(s);
    const uploaded = checkUploaded(s);
    const isScheduledObj = uploaded && typeof uploaded === 'object' && uploaded.status === 'scheduled';
    const scheduledTime = isScheduledObj ? formatScheduledTime(uploaded.scheduledAt) : null;
    const matchedVideo = ytVideos.find(v => {
      const matchStr = (s.ytTitle || s.objectName || '').trim().toLowerCase();
      return (v.title || '').toLowerCase().includes(matchStr) || matchStr.includes((v.title || '').toLowerCase().slice(0, 20));
    });
    const videoId = matchedVideo?.videoId || null;

    const sections = [
      { key: 'intro_img', title: '🖼 Intro Image', color: '#4488ff', type: '🖼 IMAGE', prompt: buildIntroImagePrompt(s) },
      { key: 'intro_vid', title: '🎬 Intro Video', color: '#4488ff', type: '🎬 VIDEO', prompt: buildIntroVideoPrompt(s) },
      ...conceptDef.scenes.map((scene, i) => ({
        key: `scene_${i}`, title: `🎬 Scene ${i + 1} — ${scene.title}`,
        color: s.color, type: '🎬 VIDEO', prompt: buildScenePrompt(s, i), hint: scene.hint,
      })),
      { key: 'outro', title: '🎤 Outro', color: '#cc88ff', type: '🎬 VIDEO', prompt: buildOutroVideoPrompt(s) },
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenShort(null)} style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{cat.emoji} {s.objectName}</span>
          {deleteDisabled ? <span style={{ fontSize: 18, opacity: 0.2, cursor: 'not-allowed' }}>🗑</span>
            : <button onClick={() => handleDelete(s)} style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>🗑</button>}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Header card */}
          <div style={{ background: '#0f0f0f', border: `1px solid ${s.color}44`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>{cat.emoji}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: s.color }}>{s.objectName}</div>
              <div style={{ fontSize: 11, color: '#555' }}>{conceptDef.label} • {cat.label}</div>
            </div>
          </div>

          {/* Voice */}
          <div style={{ background: '#0a0a14', border: '1px solid #2233aa44', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ fontSize: 10, color: '#4488ff', fontWeight: 700, marginBottom: 4 }}>🎙 VOICE (sab scenes mein same)</div>
            <div style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{VOICE_DESC}</div>
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

          {/* Upload Status */}
          {!ytLoading && (
            <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: '12px 14px' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: uploaded === true ? '#44bb66' : isScheduledObj ? '#4488ff' : uploaded === 'private' ? '#cc88ff' : '#ff8866' }}>
                {uploaded === true ? '✅ YouTube pe hai' : isScheduledObj ? `📅 ${scheduledTime || 'Scheduled'}` : uploaded === 'private' ? '🔒 Private' : '⏳ Upload baaki'}
              </span>
            </div>
          )}

          {/* Playlist */}
          {videoId ? (
            <div style={{ background: '#0f0f0f', border: `1px solid ${s.playlistAdded || playlistStatus[s.id] === 'added' ? '#1a3a1a' : '#1a2a1a'}`, borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ fontSize: 10, color: '#555', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>🎵 PLAYLIST</div>
              {s.playlistAdded || playlistStatus[s.id] === 'added' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: '#44bb66' }}>Already Added</div><div style={{ fontSize: 11, color: '#555' }}>{cat.label}</div></div>
                </div>
              ) : (
                <button onClick={() => addToPlaylist(s, videoId)} disabled={playlistStatus[s.id] === 'loading'}
                  style={{ width: '100%', background: playlistStatus[s.id] === 'loading' ? '#111' : 'linear-gradient(135deg,#0a1a0a,#0a2a0a)', border: '1px solid #224422', color: playlistStatus[s.id] === 'loading' ? '#555' : '#44bb66', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: playlistStatus[s.id] === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {playlistStatus[s.id] === 'loading' ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#44bb66' }} />Adding...</> : `➕ Add to Playlist — ${cat.label}`}
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
            short={s} hasTitleDesc={hasTitleDesc} genTD={genTD}
            onGenerate={() => generateTitleDesc(s)}
            onSave={(title, desc, tags) => saveTitleDesc(s, title, desc, tags)}
            onCopy={copy} copiedKey={copiedKey} videoId={videoId}
          />

          {/* Sections */}
          {sections.map(sec => {
            const isDone = !!done[sec.key];
            const isOpen = openSection === sec.key;
            return (
              <div key={sec.key} style={{ background: '#0f0f0f', border: `1px solid ${isDone ? '#1a3a1a' : '#1e1e1e'}`, borderRadius: 12, overflow: 'hidden' }}>
                <div onClick={() => setOpenSection(isOpen ? null : sec.key)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#44bb66' : '#ccc', flexShrink: 0 }}>{sec.title}</span>
                    {isDone && <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700, flexShrink: 0 }}>✅</span>}
                    {sec.hint && !isDone && <span style={{ fontSize: 9, color: '#444', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.hint}</span>}
                  </div>
                  <span style={{ fontSize: 13, color: '#444', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 9, color: sec.color, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>{sec.type}</div>
                    <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: '12px', fontSize: 12, lineHeight: 1.7, color: '#bbb' }}>{sec.prompt}</div>
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

  // ── LEVEL 2: FOLDER VIEW ─────────────────────────────────────
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
          {shortsInFolder.map(s => {
            const uploaded = checkUploaded(s);
            const isScheduledObj = uploaded && typeof uploaded === 'object' && uploaded.status === 'scheduled';
            const scheduledTime = isScheduledObj ? formatScheduledTime(uploaded.scheduledAt) : null;
            const uploadColor = uploaded === true ? '#44bb66' : isScheduledObj ? '#4488ff' : uploaded === 'private' ? '#cc88ff' : uploaded === false ? '#ff8866' : '#555';
            const uploadText = ytLoading ? '🔍...' : uploaded === true ? '✅ YouTube pe hai' : isScheduledObj ? `📅 ${scheduledTime || 'Scheduled'}` : uploaded === 'private' ? '🔒 Private' : '⏳ Upload baaki';
            const conceptDef = getConceptDef(s.type, s.concept);
            return (
              <div key={s.id} onClick={() => setOpenShort(s)}
                style={{ background: '#0f0f0f', borderRadius: 14, border: '1px solid #1e1e1e', borderLeft: `4px solid ${s.color}`, cursor: 'pointer', padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 2 }}>{s.objectName}</div>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>{conceptDef.label}</div>
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

  // ── LEVEL 1: FOLDER LIST ─────────────────────────────────────
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
        <button onClick={() => { const names = shortsList.map(s => `${s.objectName} (${s.concept})`).join('\n'); navigator.clipboard.writeText(names); toast('📋 Copied!'); }}
          style={{ background: 'none', border: '1px solid #ff448855', color: '#ff4488', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>📋 Copy</button>
        {ytLoading ? (
          <button disabled style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#444', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.5 }}>+ Naya</button>
        ) : (() => {
          const hasUnuploaded = shortsList.some(s => checkUploaded(s) === false);
          return hasUnuploaded ? (
            <button onClick={() => toast('⚠️ Pehle purani shorts upload karo!')} style={{ background: '#333', border: 'none', color: '#666', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed', opacity: 0.6 }}>+ Naya</button>
          ) : (
            <button onClick={openNewModal} style={{ background: '#ff4488', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Naya</button>
          );
        })()}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modal === 'new' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0008', border: '1px solid #440022', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
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
              {step === 2 && selectedType && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ff4488', marginBottom: 4, textAlign: 'center' }}>{getCategory(selectedType).emoji} Object Chuno</div>
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
                      <button onClick={() => loadAiObjects(selectedType)} style={{ width: '100%', background: 'linear-gradient(135deg,#1a0010,#0d0008)', border: '1px solid #660033', color: '#ff4488', borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>🔄 Nayi List Lo</button>
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <input value={customObject} onChange={e => setCustomObject(e.target.value)} placeholder="Ya khud likho..."
                      style={{ flex: 1, background: '#0a0a1a', border: '1px solid #334', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#eee', outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={() => { if (customObject.trim()) { setSelectedObject(customObject.trim()); setStep(3); } }}
                      style={{ background: '#ff4488', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>→</button>
                  </div>
                  <button onClick={() => setStep(1)} style={{ width: '100%', background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                </>
              )}
              {step === 3 && selectedType && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#ff4488', marginBottom: 4, textAlign: 'center' }}>{getCategory(selectedType).emoji} {selectedObject || customObject}</div>
                  <div style={{ fontSize: 11, color: '#555', textAlign: 'center', marginBottom: 14 }}>Concept aur color chuno</div>
                  <div style={{ fontSize: 10, color: '#777', marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>CONCEPT CHUNO</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {Object.entries(getConceptsForType(selectedType)).map(([id, concept]) => (
                      <button key={id} onClick={() => setSelectedConcept(id)}
                        style={{ background: selectedConcept === id ? 'rgba(255,68,136,0.15)' : '#0f0f1a', border: `1px solid ${selectedConcept === id ? '#ff4488' : '#1a1a33'}`, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
                        <span style={{ fontSize: 20 }}>{concept.label.split(' ')[0]}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: selectedConcept === id ? '#ff4488' : '#eee' }}>{concept.label}</div>
                          <div style={{ fontSize: 10, color: '#555' }}>{concept.desc}</div>
                        </div>
                        {selectedConcept === id && <span style={{ flexShrink: 0 }}>✅</span>}
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
                    <button onClick={generateShort} disabled={generating || !selectedConcept}
                      style={{ flex: 2, background: generating ? '#1a0010' : 'linear-gradient(135deg,#550022,#330011)', border: '1px solid #ff4488', color: '#ff4488', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {generating ? <><div className="spinner" style={{ borderTopColor: '#ff4488', width: 16, height: 16 }} />Saving...</> : '🎬 Banao!'}
                    </button>
                    <button onClick={() => setStep(2)} style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

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
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${cat.color}1a`, border: `1px solid ${cat.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{cat.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: cat.color, marginBottom: 3 }}>{cat.label}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{shortsInFolder.length} shorts • {ytLoading ? '🔍...' : `${uploadedCount} uploaded`}</div>
              </div>
              <span style={{ fontSize: 22, color: `${cat.color}66` }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ShortsCreatorWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <ShortsCreatorPage user={user} />}</AuthWrapper></ToastProvider>;
}

// 📁 LOCATION: app/compare-action/page.js
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
  const snap = await getDocs(query(collection(db, 'users', uid, 'rt_compare'), orderBy('createdAt', 'desc')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveSeries(uid, data) {
  return addDoc(collection(getDB(), 'users', uid, 'rt_compare'), { ...data, createdAt: serverTimestamp() });
}
async function updateSeries(uid, id, data) {
  await updateDoc(doc(getDB(), 'users', uid, 'rt_compare', id), data);
}
async function deleteSeries(uid, id) {
  await deleteDoc(doc(getDB(), 'users', uid, 'rt_compare', id));
}

function nameToFolderKey(name) {
  return name.replace(/ Part \d+$/i, '').trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function getFolderMeta(folderKey, seriesList) {
  if (folderKey === 'action') return { label: 'Actions', emoji: '🏃', color: '#44bb66' };
  const first = seriesList.find(s => s.folderKey === folderKey);
  const label = folderKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label, emoji: first?.emoji || '⚖️', color: first?.color || '#ff8800' };
}

function groupByFolder(list) {
  const groups = {};
  list.forEach(s => {
    const key = s.folderKey || 'other';
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  });
  return groups;
}

function hasNextPart(series, allSeries) {
  const currentPart = series.part || 1;
  return allSeries.some(s => s.folderKey === series.folderKey && (s.part || 1) === currentPart + 1);
}

function isHandheld(objectDesc) {
  const o = (objectDesc || '').toLowerCase();
  return !['elephant','giraffe','horse','cow','lion','tiger','bus','truck','car','train',
    'mountain','hill','tree','house','building','ship','boat','sofa','table','refrigerator',
    'washing machine','bicycle','bike','motorcycle','airplane','helicopter'].some(w => o.includes(w));
}

function buildIntroImagePrompt(seriesName, items = []) {
  const itemsDesc = items.slice(0, 3).map(i => i.name).join(', ') || 'colorful educational items';
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, waving hand with excited expression. Bold glowing text "${seriesName}" floating center with colorful sparkles. Show related items at bottom: ${itemsDesc}. 9:16 vertical. Pixar style. No other text.`;
}

function buildIntroVideoPrompt(seriesName, part = 1) {
  const partMention = part > 1 ? ` — यह है part ${part}` : '';
  return `Use reference image exactly as background scene. Teacher standing center, smiling, waving hand at camera. Teacher grabs the title text "${seriesName}" with hand and slides it off screen to the right. Teacher says in Hindi: "हेल्लो बच्चों! आज की video में हम ${seriesName} compare करेंगे${partMention} — चलो शुरू करते हैं!" 8 seconds. Smooth animation. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function buildOutroVideoPrompt() {
  return `Use reference image exactly as background scene. Any objects on screen slowly fade out and disappear. Screen is clean with only teacher visible. Teacher waves goodbye to camera with big smile, says in Hindi: "तो बच्चों, आज के लिए बस इतना ही — मिलते हैं अगले video में, टाटा!" 8 seconds. Smooth. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function buildCompareVideoPrompt(item, isFirst = true) {
  const prefix = isFirst ? 'तो बताओ..' : 'अब बताओ..';
  const obj1Handheld = isHandheld(item.object1);
  const obj2Handheld = isHandheld(item.object2);
  const placement = (obj1Handheld && obj2Handheld)
    ? `Teacher standing center facing camera. Teacher holds Pixar 3D cartoon ${item.object1} in LEFT hand showing it to camera, and holds Pixar 3D cartoon ${item.object2} in RIGHT hand showing it to camera. Both objects clearly visible and large.`
    : (obj1Handheld && !obj2Handheld)
    ? `Teacher standing center-right. Big Pixar 3D ${item.object2} placed on floor at left side. Teacher holds Pixar 3D cartoon ${item.object1} in right hand toward camera.`
    : (!obj1Handheld && obj2Handheld)
    ? `Teacher standing center-left. Big Pixar 3D ${item.object1} placed on floor at left side. Teacher holds Pixar 3D cartoon ${item.object2} in right hand toward camera.`
    : `Teacher standing center. Big Pixar 3D ${item.object1} on floor LEFT side. Big Pixar 3D ${item.object2} on floor RIGHT side.`;
  return `Use reference image exactly as background scene. ${placement}
Both objects have small labels — "${item.label1}" under left object, "${item.label2}" under right object.
Teacher looks at both objects curiously and points to both alternately.
Teacher asks in Hindi: "${prefix} इन दोनों में से ${item.question} कौनसा है?"
Bold rainbow gradient text "${item.question} कौनसा है?" visible at very bottom center. Pause 2 seconds.
Teacher touches/points to ${item.answer1object} — it glows brightly. Bottom text changes to glowing bold "यह ${item.label1} है!"
Teacher says in Hindi: "यह ${item.label1} है!" Then touches ${item.answer2object} — it glows. Text changes to "यह ${item.label2} है!"
Teacher says: "यह ${item.label2} है! बहुत अच्छे!" Teacher smiles and gives thumbs up.
No "?" anywhere. No background music. 10 seconds total. Smooth. No glitch. Hindi audio only. Teacher must lip sync.`;
}

function buildCompareImagePrompt(item) {
  const obj1Handheld = isHandheld(item.object1);
  const obj2Handheld = isHandheld(item.object2);
  let placement;
  if (obj1Handheld && obj2Handheld) {
    placement = `Teacher standing center-left, smiling. Teacher holds big Pixar 3D cartoon ${item.object1} in LEFT hand raised toward camera, and big Pixar 3D cartoon ${item.object2} in RIGHT hand raised toward camera. Both objects clearly visible, large, and at eye level.`;
  } else if (obj1Handheld && !obj2Handheld) {
    placement = `Teacher standing center-right, smiling. Big Pixar 3D ${item.object2} placed on floor at left side, large and clearly visible. Teacher holds Pixar 3D cartoon ${item.object1} in right hand raised toward camera.`;
  } else if (!obj1Handheld && obj2Handheld) {
    placement = `Teacher standing center-left, smiling. Big Pixar 3D ${item.object1} placed on floor at left side, large and clearly visible. Teacher holds Pixar 3D cartoon ${item.object2} in right hand raised toward camera.`;
  } else {
    placement = `Teacher standing center-bottom, smiling, arms open wide. Big Pixar 3D ${item.object1} placed on floor at LEFT side, large clearly visible. Big Pixar 3D ${item.object2} placed on floor at RIGHT side, large clearly visible.`;
  }
  return `Use reference background exactly. Use reference teacher character exactly. ${placement} Small label "${item.label1}" floating under left object, "${item.label2}" floating under right object, bold colorful text. 9:16 vertical. Pixar style. No other text. No "?" anywhere.`;
}

function buildActionImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing center, smiling, in the middle of performing this action: ${item.action} Action is clearly visible and expressive. Teacher looks excited and energetic. 9:16 vertical. Pixar style. No text. No "?" anywhere.`;
}

function buildActionVideoPrompt(item, isFirst = true) {
  const prefix = isFirst ? 'तो बताओ..' : 'अब बताओ..';
  return `Use reference image exactly as background scene. Teacher standing center facing camera.
Teacher performs the action: ${item.action}
While performing, teacher asks in Hindi: "${prefix} यह कौनसा action है?"
Bold rainbow gradient text "यह कौनसा action है?" visible at very bottom center — red, orange, yellow, green, blue, violet colors. Pause 2 seconds while teacher still performs the action.
Bottom text animates away and glowing bold rainbow text "${item.name.toUpperCase()}" appears at same position with sparkle animation.
Teacher says in Hindi: "यह ${item.name} है! बहुत अच्छे!" Teacher smiles and gives thumbs up.
No floating 3D objects. No "?" anywhere. No background music. 8 seconds total. Smooth. No glitch. Hindi audio only. Teacher must lip sync.`;
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

const COLORS = ['#ff4400','#44bb66','#4488ff','#cc88ff','#ff8800','#ff4488','#00ccbb','#ffcc00'];

async function aiCall(prompt) {
  const res = await fetch('/api/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 1000, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
  });
  const data = await res.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function detectEmoji(name) {
  const text = await aiCall(`Given this kids YouTube series name: "${name}" Return ONLY a single most appropriate emoji. No explanation, just one emoji.`);
  return text.trim().slice(0, 2) || '⚖️';
}

// ── TitleDescSection Component ──
function TitleDescSection({ series, genTD, onGenerate, onSave, onCopy, copiedKey, videoId }) {
  const hasTitleDesc = !!(series.ytTitle && series.ytDescription);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(series.ytTitle || '');
  const [desc, setDesc]   = useState(series.ytDescription || '');
  const [tags, setTags]   = useState(series.ytTags || '');
  const [regenLoading, setRegenLoading] = useState({ title: false, desc: false, tags: false });
  const [ytUpdating, setYtUpdating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    setTitle(series.ytTitle || '');
    setDesc(series.ytDescription || '');
    setTags(series.ytTags || '');
  }, [series.ytTitle, series.ytDescription, series.ytTags]);

  async function regenField(field) {
    setRegenLoading(p => ({ ...p, [field]: true }));
    try {
      const itemNames = (series.items || []).map(i => i.name).join(', ');
      const baseName = series.name.replace(/ Part \d+$/i, '').trim();
      const partText = (series.part || 1) > 1 ? ` Part ${series.part}` : '';

      let prompt = '';
      if (field === 'title') {
        prompt = `Generate ONLY a YouTube title for Hindi kids series "${baseName}${partText}". Items: ${itemNames}. Max 60 chars, Hindi+English mix, end with "| Rang Tarang". NO emoji. Return ONLY the title text, nothing else.`;
      } else if (field === 'desc') {
        prompt = `Generate ONLY a YouTube description for Hindi kids series "${baseName}${partText}". Items: ${itemNames}. Hook in Hindi, items list, subscribe line with https://youtube.com/@RangTarangHindi, hashtags. Return ONLY the description text, nothing else.`;
      } else if (field === 'tags') {
        prompt = `Generate ONLY YouTube tags for Hindi kids series "${baseName}${partText}". Items: ${itemNames}. Comma separated, max 15 tags, mix Hindi+English. Return ONLY the tags string, nothing else.`;
      }

      const res = await fetch('/api/ai', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai/gpt-4o-mini', max_tokens: 400, temperature: 0.7, messages: [{ role: 'user', content: prompt }] }),
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
      const res = await fetch('/api/youtube/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, title, description: desc, tags }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast(data.message);
    } catch (e) { toast('❌ ' + e.message); }
    setYtUpdating(false);
  }

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
          {/* Generate All */}
          <button onClick={onGenerate} disabled={genTD}
            style={{ background: genTD ? '#111' : 'linear-gradient(135deg,#1a1000,#2a1800)', border: '1px solid #443300', color: genTD ? '#555' : '#ffaa44', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: genTD ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {genTD ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ffaa44' }} />Generate ho raha hai...</> : '🤖 Teeno AI se Generate Karo'}
          </button>

          {/* Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>📌 YouTube Title</div>
              <button onClick={() => regenField('title')} disabled={regenLoading.title}
                style={{ background: regenLoading.title ? '#111' : '#1a1000', border: '1px solid #443300', color: regenLoading.title ? '#555' : '#ffaa44', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: regenLoading.title ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {regenLoading.title ? <><div className="spinner" style={{ width: 10, height: 10, borderTopColor: '#ffaa44' }} /></> : '🔄 Regen'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video ka title..."
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              <button onClick={() => onCopy('ytTitle', title)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey === 'ytTitle' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'ytTitle' ? '#44bb66' : '#333'}`, color: copiedKey === 'ytTitle' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey === 'ytTitle' ? '✅' : '📋'}</button>
            </div>
          </div>

          {/* Description */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>📄 YouTube Description</div>
              <button onClick={() => regenField('desc')} disabled={regenLoading.desc}
                style={{ background: regenLoading.desc ? '#111' : '#1a1000', border: '1px solid #443300', color: regenLoading.desc ? '#555' : '#ffaa44', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: regenLoading.desc ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {regenLoading.desc ? <><div className="spinner" style={{ width: 10, height: 10, borderTopColor: '#ffaa44' }} /></> : '🔄 Regen'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Video ki description..." rows={4}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
              <button onClick={() => onCopy('ytDesc', desc)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey === 'ytDesc' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'ytDesc' ? '#44bb66' : '#333'}`, color: copiedKey === 'ytDesc' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey === 'ytDesc' ? '✅' : '📋'}</button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
              <div style={{ fontSize: 9, color: '#ffaa44', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>🏷️ YouTube Tags</div>
              <button onClick={() => regenField('tags')} disabled={regenLoading.tags}
                style={{ background: regenLoading.tags ? '#111' : '#1a1000', border: '1px solid #443300', color: regenLoading.tags ? '#555' : '#ffaa44', borderRadius: 6, padding: '3px 10px', fontSize: 10, fontWeight: 700, cursor: regenLoading.tags ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                {regenLoading.tags ? <><div className="spinner" style={{ width: 10, height: 10, borderTopColor: '#ffaa44' }} /></> : '🔄 Regen'}
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <textarea value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags comma se separate..." rows={3}
                style={{ width: '100%', background: '#0a0a0a', border: '1px solid #2a2000', borderRadius: 10, padding: '10px 44px 10px 12px', fontSize: 12, color: '#eee', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.6 }} />
              <button onClick={() => onCopy('ytTags', tags)} style={{ position: 'absolute', top: 6, right: 6, background: copiedKey === 'ytTags' ? '#44bb66' : '#1a1a1a', border: `1px solid ${copiedKey === 'ytTags' ? '#44bb66' : '#333'}`, color: copiedKey === 'ytTags' ? '#fff' : '#666', borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>{copiedKey === 'ytTags' ? '✅' : '📋'}</button>
            </div>
          </div>

          {/* Save + YouTube Update */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { onSave(title, desc, tags); setEditing(false); }}
              style={{ flex: 1, background: 'rgba(68,187,102,0.12)', border: '1px solid rgba(68,187,102,0.4)', color: '#44bb66', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              💾 Save
            </button>
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
function CompareActionPage({ user }) {
  const toast = useToast();
  const [list, setList]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [openFolder, setOpenFolder]   = useState(null);
  const [openSeries, setOpenSeries]   = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [copiedKey, setCopiedKey]     = useState('');
  const [continuing, setContinuing]   = useState(null);
  const [genTD, setGenTD]             = useState(false);
  const [modal, setModal]             = useState('none');
  const [customName, setCustomName]   = useState('');
  const [seriesType, setSeriesType]   = useState('compare');
  const [selectedColor, setSelectedColor] = useState('#ff8800');
  const [generating, setGenerating]   = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [sugLoading, setSugLoading]   = useState(false);
  const [ytVideos, setYtVideos]       = useState([]);
  const [ytLoading, setYtLoading]     = useState(true);
  const [playlistStatus, setPlaylistStatus] = useState({});

  useEffect(() => { loadList(); fetchYT(); }, [user.uid]);

  async function loadList() {
    setLoading(true);
    try { setList(await getSeries(user.uid)); } catch { toast('❌ Load fail'); }
    setLoading(false);
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
    if (matched.isScheduled) return { status: 'scheduled', scheduledAt: matched.scheduledAt };
    if (matched.privacyStatus === 'private') return 'private';
    return true;
  }

  async function addToPlaylist(series, videoId) {
    setPlaylistStatus(p => ({ ...p, [series.id]: 'loading' }));
    try {
      const folderMeta = getFolderMeta(series.folderKey, list);
      const res = await fetch('/api/youtube/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, playlistTitle: folderMeta.label }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlaylistStatus(p => ({ ...p, [series.id]: 'added' }));
      await updateSeries(user.uid, series.id, { playlistAdded: true });
      const updated = { ...series, playlistAdded: true };
      setList(l => l.map(s => s.id === series.id ? updated : s));
      setOpenSeries(updated);
      toast(data.message);
    } catch (e) {
      setPlaylistStatus(p => ({ ...p, [series.id]: null }));
      toast('❌ ' + e.message);
    }
  }

  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key); setTimeout(() => setCopiedKey(''), 2000); toast('📋 Copied!');
    });
  }

  async function loadSuggestions() {
    setSugLoading(true); setAiSuggestions([]);
    try {
      const existing = list.map(s => s.name).join(', ') || 'none';
      const typeHint = seriesType === 'compare'
        ? 'comparison topics using opposite quality pairs like: Big Small, Long Short, Hot Cold, Fast Slow, Heavy Light, Tall Short, Thick Thin, Wide Narrow, Old New, Tiny Huge, Hard Soft, Loud Quiet, Near Far, Full Empty, Clean Dirty, Happy Sad, Open Closed, Wet Dry, Sweet Sour, Rough Smooth, Bright Dark'
        : 'action topics like Jump, Run, Walk, Dance, Swim, Clap, Spin, Crawl, Hop, Stretch';
      const text = await aiCall(`You are an AI for Hindi kids YouTube channel "RangTarang".
Already created: ${existing}
Suggest exactly 6 NEW unique kids educational ${typeHint} that have NOT been created yet.
Return ONLY a JSON array of short names (2 words each), no markdown:
${seriesType === 'compare' ? '["Long Short","Tiny Huge","Heavy Light","Tall Short","Hot Cold","Sweet Sour"]' : '["Jump","Run","Walk","Dance","Swim","Clap"]'}`);
      setAiSuggestions(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch { toast('❌ Suggestions nahi aaye'); }
    setSugLoading(false);
  }

  async function generateSeries() {
    if (!customName.trim()) { toast('⚠️ Naam likho!'); return; }
    setGenerating(true);
    try {
      const existing = list.map(s => s.name).join(', ');
      let items = [];
      if (seriesType === 'compare') {
        const text = await aiCall(`You are making a Hindi kids YouTube comparison series called "${customName}".
Analyze the series name "${customName}" and extract exactly TWO opposing qualities/concepts being compared.
Examples: "Big Small"→Big/Small(size), "Sweet Sour"→Sweet/Sour(taste), "Hot Cold"→Hot/Cold(temp), "Fast Slow"→Fast/Slow(speed), "Tall Short"→Tall/Short(height), "Heavy Light"→Heavy/Light(weight), "Rough Smooth"→Rough/Smooth(texture), "Loud Quiet"→Loud/Quiet(sound).
Generate exactly 5 comparison items for "${customName}". Every item must use objects that BEST represent these exact qualities. Kids aged 2-6 must recognize them. All 5 must use DIFFERENT objects.
RULES: object1=quality1, object2=quality2, name="Object1 vs Object2", label1=quality1 English, label2=quality2 English, question=quality1 Hindi, object1/object2=Pixar 3D desc max 6 words NO location/scene.
Return ONLY JSON array, no markdown:
[{"name":"Candy vs Lemon","question":"मीठा","label1":"Sweet","label2":"Sour","object1":"round pink candy with sparkles","object2":"bright yellow lemon cut in half","answer1object":"candy on left","answer2object":"lemon on right"}]
Avoid: ${existing}`);
        items = JSON.parse(text.replace(/```json|```/g, '').trim());
      } else {
        const text = await aiCall(`Generate exactly 5 unique action items for kids YouTube series "${customName}".
Return ONLY JSON array: [{"name":"Jump","action":"Teacher jumps up and down excitedly 3 times with big smile, arms raised high each time"}]
Avoid: ${existing}`);
        items = JSON.parse(text.replace(/```json|```/g, '').trim());
      }
      const emoji = await detectEmoji(customName);
      const baseName = customName.trim();
      const folderKey = seriesType === 'action' ? 'action' : nameToFolderKey(baseName);
      await saveSeries(user.uid, {
        name: baseName, emoji, color: selectedColor, type: seriesType, folderKey,
        items, doneSections: {}, doneCount: 0, progress: 0,
        part: 1, ytTitle: '', ytDescription: '', ytTags: ''
      });
      toast(`✅ "${baseName}" ready!`);
      setModal('none'); setCustomName(''); loadList();
    } catch (e) { toast('❌ ' + e.message); }
    setGenerating(false);
  }

  async function continueSeries(e, series) {
    e.stopPropagation();
    setContinuing(series.id);
    try {
      const done = (series.items || []).map(i => i.name).join(', ');
      let newItems = [];
      if (series.type === 'compare') {
        const text = await aiCall(`MORE items for Hindi kids YouTube comparison series "${series.name}".
Analyze "${series.name}" — keep ALL items relevant to these exact qualities only.
Generate exactly 5 NEW items using DIFFERENT objects. object1/object2=Pixar 3D desc max 6 words NO location/scene.
Already done (DO NOT repeat): ${done}
Return ONLY JSON array: [{"name":"...","question":"...","label1":"...","label2":"...","object1":"...","object2":"...","answer1object":"...","answer2object":"..."}]`);
        newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      } else {
        const text = await aiCall(`5 MORE unique action items for "${series.name}". Already done (NO repeat): ${done}
Return ONLY JSON: [{"name":"...","action":"..."}]`);
        newItems = JSON.parse(text.replace(/```json|```/g, '').trim());
      }
      const newPart = (series.part || 1) + 1;
      const baseName = series.name.replace(/ Part \d+$/i, '').trim();
      await saveSeries(user.uid, {
        name: `${baseName} Part ${newPart}`,
        emoji: series.emoji, color: series.color, type: series.type, folderKey: series.folderKey,
        items: newItems, doneSections: {}, doneCount: 0, progress: 0,
        part: newPart, ytTitle: '', ytDescription: '', ytTags: ''
      });
      toast(`🎉 Part ${newPart} ready!`); loadList();
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
    setList(l => l.map(s => s.id === series.id ? updated : s));
    setOpenSeries(updated);
    toast(wasDone ? 'Undone!' : '✅ Done!');
  }

  async function generateTitleDesc(series) {
    setGenTD(true);
    try {
      const itemNames = (series.items || []).map(i => i.name).join(', ');
      const baseName = series.name.replace(/ Part \d+$/i, '').trim();
      const partText = (series.part || 1) > 1 ? ` Part ${series.part}` : '';
      const text = await aiCall(`You are a YouTube SEO expert for Hindi kids channel "Rang Tarang".
Series: "${baseName}${partText}" Type: ${series.type}
Items: ${itemNames}
Generate YouTube title, description, and tags.
TITLE RULES: Max 60 chars, Hindi+English mix, end with "| Rang Tarang", NO emoji
DESCRIPTION: Hook in Hindi, items list, subscribe line, hashtags
TAGS: Comma separated, max 15 tags, mix Hindi+English, topic specific
Return ONLY JSON: {"title":"...","description":"...","tags":"..."}`);
      const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
      await updateSeries(user.uid, series.id, { ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags || '' });
      const updated = { ...series, ytTitle: parsed.title, ytDescription: parsed.description, ytTags: parsed.tags || '' };
      setList(l => l.map(s => s.id === series.id ? updated : s));
      setOpenSeries(updated);
      toast('✅ Title, Description & Tags ready!');
    } catch (e) { toast('❌ ' + e.message); }
    setGenTD(false);
  }

  async function saveTitleDesc(series, title, desc, tags) {
    await updateSeries(user.uid, series.id, { ytTitle: title, ytDescription: desc, ytTags: tags });
    const updated = { ...series, ytTitle: title, ytDescription: desc, ytTags: tags };
    setList(l => l.map(s => s.id === series.id ? updated : s));
    setOpenSeries(updated);
    toast('💾 Saved!');
  }

  async function handleDelete(series) {
    if (!confirm(`"${series.name}" delete karein?`)) return;
    await deleteSeries(user.uid, series.id);
    toast('🗑 Deleted!'); setOpenSeries(null); loadList();
  }

  // ── LEVEL 3: SERIES DETAIL ──────────────────────────
  if (openSeries) {
    const s = openSeries;
    const done = s.doneSections || {};
    const total = (s.items || []).length + 2;
    const uploaded = checkUploaded(s);
    const isScheduledObj = uploaded && typeof uploaded === 'object' && uploaded.status === 'scheduled';
    const scheduledTime = isScheduledObj ? formatScheduledTime(uploaded.scheduledAt) : null;
    const folderMeta = getFolderMeta(s.folderKey, list);

    const matchedVideo = ytVideos.find(v => {
      const matchStr = (s.ytTitle || s.name || '').trim().toLowerCase();
      return (v.title || '').toLowerCase().includes(matchStr) || matchStr.includes((v.title || '').toLowerCase().slice(0, 20));
    });
    const videoId = matchedVideo?.videoId || null;

    const sections = [
      { key: 'intro', title: '🎬 Intro', color: '#4488ff', prompts: [
        { type: '🖼 IMAGE', text: buildIntroImagePrompt(s.name, s.items || []) },
        { type: '🎬 VIDEO', text: buildIntroVideoPrompt(s.name, s.part || 1) }
      ]},
      ...(s.items || []).map((item, i) => ({
        key: `item_${i}`, title: `${i + 1}. ${item.name}`, color: s.color,
        prompts: [
          { type: '🖼 IMAGE', text: s.type === 'compare' ? buildCompareImagePrompt(item) : buildActionImagePrompt(item) },
          { type: '🎬 VIDEO', text: s.type === 'compare' ? buildCompareVideoPrompt(item, i === 0) : buildActionVideoPrompt(item, i === 0) }
        ]
      })),
      { key: 'outro', title: '🎤 Outro', color: '#cc88ff', prompts: [
        { type: '🎬 VIDEO', text: buildOutroVideoPrompt() }
      ]},
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenSeries(null)} style={{ background: 'none', border: 'none', color: '#ff8800', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
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

          {/* Upload Status */}
          {!ytLoading && (
            <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#44bb66' }}>Already Added to Playlist</div>
                    <div style={{ fontSize: 11, color: '#555' }}>{folderMeta.label}</div>
                  </div>
                </div>
              ) : (
                <button onClick={() => addToPlaylist(s, videoId)} disabled={playlistStatus[s.id] === 'loading'}
                  style={{ width: '100%', background: playlistStatus[s.id] === 'loading' ? '#111' : 'linear-gradient(135deg,#0a1a0a,#0a2a0a)', border: '1px solid #224422', color: playlistStatus[s.id] === 'loading' ? '#555' : '#44bb66', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: playlistStatus[s.id] === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {playlistStatus[s.id] === 'loading' ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#44bb66' }} />Adding...</> : `➕ Add to Playlist — ${folderMeta.label}`}
                </button>
              )}
            </div>
          ) : (
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12, padding: '13px 14px', fontSize: 12, color: '#444', textAlign: 'center' }}>
              🎵 Pehle video YouTube pe upload karo
            </div>
          )}

          {/* Title Desc Tags */}
          <TitleDescSection
            series={s}
            genTD={genTD}
            onGenerate={() => generateTitleDesc(s)}
            onSave={(title, desc, tags) => saveTitleDesc(s, title, desc, tags)}
            onCopy={copy}
            copiedKey={copiedKey}
              videoId={videoId} 
          />

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
                      const bck = `${sec.key}_${pi}`;
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

  // ── LEVEL 2: FOLDER VIEW ────────────────────────────
  if (openFolder) {
    const folderMeta = getFolderMeta(openFolder, list);
    const grouped = groupByFolder(list);
    const seriesInFolder = (grouped[openFolder] || []).sort((a, b) => (a.part || 1) - (b.part || 1));
    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenFolder(null)} style={{ background: 'none', border: 'none', color: '#ff8800', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>← Back</button>
          <span style={{ fontSize: 13, fontWeight: 700, color: folderMeta.color }}>{folderMeta.emoji} {folderMeta.label}</span>
          <span style={{ fontSize: 11, color: '#444', fontWeight: 600 }}>{seriesInFolder.length} series</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {seriesInFolder.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>{folderMeta.emoji}</div>
              <div style={{ fontSize: 13, color: '#555' }}>Koi series nahi hai</div>
            </div>
          ) : seriesInFolder.map(s => {
            const total = (s.items || []).length + 2;
            const nextExists = hasNextPart(s, list);
            const isContinuing = continuing === s.id;
            const uploaded = checkUploaded(s);
            const isScheduledObj = uploaded && typeof uploaded === 'object' && uploaded.status === 'scheduled';
            const uploadColor = uploaded === true ? '#44bb66' : isScheduledObj ? '#4488ff' : uploaded === 'private' ? '#cc88ff' : uploaded === false ? '#ff8866' : '#555';
            const scheduledTime = isScheduledObj ? formatScheduledTime(uploaded.scheduledAt) : null;
            const uploadText = ytLoading ? '🔍...' : uploaded === true ? '✅ YouTube pe hai' : isScheduledObj ? `📅 ${scheduledTime || 'Scheduled'}` : uploaded === 'private' ? '🔒 Private' : '⏳ Upload baaki';
            return (
              <div key={s.id} onClick={() => setOpenSeries(s)}
                style={{ background: '#0f0f0f', borderRadius: 14, border: '1px solid #1e1e1e', borderLeft: `4px solid ${s.color}`, cursor: 'pointer', padding: '14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 28 }}>{s.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 4 }}>{s.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#555' }}>{s.doneCount || 0}/{total} done</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: uploadColor }}>{uploadText}</span>
                  </div>
                  <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: (s.progress || 0) + '%', background: s.color, borderRadius: 4 }} />
                  </div>
                  {!nextExists && (
                    <button onClick={(e) => continueSeries(e, s)} disabled={isContinuing}
                      style={{ marginTop: 10, background: isContinuing ? '#111' : `${s.color}18`, border: `1px solid ${s.color}55`, color: isContinuing ? '#555' : s.color, borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: isContinuing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
                      {isContinuing ? <><div className="spinner" style={{ width: 12, height: 12, borderTopColor: s.color }} /> Generating...</> : `➕ Continue → Part ${(s.part || 1) + 1}`}
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

  // ── LEVEL 1: FOLDER LIST ────────────────────────────
  const grouped = groupByFolder(list);
  const sortedFolders = Object.keys(grouped).sort((a, b) => {
    if (a === 'action') return -1;
    if (b === 'action') return 1;
    const aLatest = grouped[a]?.[0]?.createdAt?.seconds || 0;
    const bLatest = grouped[b]?.[0]?.createdAt?.seconds || 0;
    return bLatest - aLatest;
  });

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ff8800', fontSize: 14, fontWeight: 700 }}>⚔️ Compare & Action</span>
        <button onClick={() => setModal('create')} style={{ background: '#ff8800', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+ Naya</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {modal === 'create' && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ background: '#0d0800', border: '1px solid #443300', borderRadius: 20, padding: 20, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#ff8800', marginBottom: 14, textAlign: 'center' }}>⚔️ Naya Series Banao</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button onClick={() => { setSeriesType('compare'); setSelectedColor('#ff8800'); }}
                  style={{ flex: 1, background: seriesType === 'compare' ? 'rgba(255,136,0,0.2)' : '#111', border: `1px solid ${seriesType === 'compare' ? '#ff8800' : '#333'}`, color: seriesType === 'compare' ? '#ff8800' : '#666', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>⚖️ Compare</button>
                <button onClick={() => { setSeriesType('action'); setSelectedColor('#44bb66'); }}
                  style={{ flex: 1, background: seriesType === 'action' ? 'rgba(68,187,102,0.2)' : '#111', border: `1px solid ${seriesType === 'action' ? '#44bb66' : '#333'}`, color: seriesType === 'action' ? '#44bb66' : '#666', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🏃 Action</button>
              </div>
              <input value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder={seriesType === 'compare' ? 'e.g. Big Small, Hot Cold, Sweet Sour...' : 'e.g. Jump, Run, Dance...'}
                maxLength={40}
                style={{ width: '100%', background: '#1a1000', border: '1px solid #443300', color: '#eee', borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', marginBottom: 10, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              <button onClick={loadSuggestions} disabled={sugLoading}
                style={{ width: '100%', background: sugLoading ? '#111' : 'linear-gradient(135deg,#1a0800,#0d0500)', border: '1px solid #663300', color: sugLoading ? '#555' : '#ff8800', borderRadius: 10, padding: '11px', fontSize: 12, fontWeight: 700, cursor: sugLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                {sugLoading ? <><div className="spinner" style={{ width: 14, height: 14, borderTopColor: '#ff8800' }} />Soch raha hai...</> : '🤖 AI se Ideas Lo'}
              </button>
              {aiSuggestions.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: '#666', fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>TAP KARO SELECT KARNE KE LIYE</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {aiSuggestions.map((sug, i) => (
                      <button key={i} onClick={() => setCustomName(sug)}
                        style={{ background: customName === sug ? 'rgba(255,136,0,0.2)' : '#1a0800', border: `1px solid ${customName === sug ? '#ff8800' : '#443300'}`, color: customName === sug ? '#ff8800' : '#aaa', borderRadius: 20, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ fontSize: 10, color: '#777', marginBottom: 8 }}>COLOR CHUNO</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setSelectedColor(c)}
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: `3px solid ${selectedColor === c ? '#fff' : 'transparent'}`, transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }} />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={generateSeries} disabled={generating || !customName.trim()}
                  style={{ flex: 2, background: generating ? '#1a0800' : 'linear-gradient(135deg,#cc5500,#ff8800)', border: 'none', color: generating ? '#555' : '#fff', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {generating ? <><div className="spinner" style={{ width: 16, height: 16, borderTopColor: '#ff8800' }} />Ban raha hai...</> : '🚀 Generate Karo'}
                </button>
                <button onClick={() => { setModal('none'); setCustomName(''); setAiSuggestions([]); }}
                  style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#ff8800' }} />
            <div style={{ fontSize: 12, color: '#555' }}>Loading...</div>
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚔️</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi series nahi hai</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Naya" se banao</div>
          </div>
        ) : sortedFolders.map(folderKey => {
          const meta = getFolderMeta(folderKey, list);
          const seriesInFolder = grouped[folderKey];
          const countLabel = folderKey === 'action' ? `${seriesInFolder.length} series` : `${seriesInFolder.length} part${seriesInFolder.length > 1 ? 's' : ''}`;
          return (
            <div key={folderKey} onClick={() => setOpenFolder(folderKey)}
              style={{ background: '#0d0d0d', border: `1px solid ${meta.color}44`, borderRadius: 16, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 15% 50%, ${meta.color}0f 0%, transparent 65%)`, pointerEvents: 'none' }} />
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${meta.color}1a`, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>{meta.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: meta.color, marginBottom: 3 }}>{meta.label}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{countLabel}</div>
              </div>
              <span style={{ fontSize: 22, color: `${meta.color}66` }}>›</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CompareActionWrapper() {
  return <ToastProvider><AuthWrapper>{({ user }) => <CompareActionPage user={user} />}</AuthWrapper></ToastProvider>;
}

'use client';

import { useState, useEffect } from 'react';
import AuthWrapper from '../../components/AuthWrapper';
import BottomNav from '../../components/BottomNav';
import { ToastProvider, useToast } from '../../components/Toast';
import { db_saveState, db_loadState } from '../../lib/firebase';

// ── Firestore helpers ─────────────────────────────────────
import {
  getFirestore, collection, addDoc, getDocs,
  doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy,
} from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyC4G3cBS6fTmi7PXRrCbQPIkEbr-bh_470",
  authDomain:        "fir-c929f.firebaseapp.com",
  projectId:         "fir-c929f",
  storageBucket:     "fir-c929f.firebasestorage.app",
  messagingSenderId: "82713990557",
  appId:             "1:82713990557:web:d4586900ad445cb8a2cb74",
};

function getDB() {
  const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
  return getFirestore(app);
}

async function getSeries(uid) {
  const db = getDB();
  const q = query(collection(db, 'users', uid, 'rt_series'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
async function saveSeries(uid, data) {
  const db = getDB();
  return addDoc(collection(db, 'users', uid, 'rt_series'), { ...data, createdAt: serverTimestamp() });
}
async function updateSeries(uid, id, data) {
  const db = getDB();
  await updateDoc(doc(db, 'users', uid, 'rt_series', id), data);
}
async function deleteSeries(uid, id) {
  const db = getDB();
  await deleteDoc(doc(db, 'users', uid, 'rt_series', id));
}

// ── Prompt builders ───────────────────────────────────────
function buildIntroPrompt(seriesName) {
  return `Use reference scene exactly. No text on screen. Teacher standing center, smiling, waving hand at camera. Teacher says in Hindi with Indian accent: "Hello bachcho! Aaj ki video mein hum sikhenge ${seriesName} — to chalo shuru karte hain!" Teacher claps hands excitedly. Warm bright lighting. Soft cheerful background music. 8 seconds. Smooth animation. No glitch. Only Hindi Indian accent audio.`;
}
function buildOutroPrompt() {
  return `Use reference image exactly. No text on screen. Move character to center of frame. Character waves goodbye warmly and says in Hindi with Indian accent: "To bachcho, aaj ke liye itna hi — milte hain agle video mein, tata!" Character smiles, waves hand slowly. Soft warm outro music in background. 8 seconds. Smooth animation. No glitch. Only Hindi Indian accent audio.`;
}
function buildImagePrompt(item) {
  return `Use reference background exactly. Use reference teacher character exactly. Teacher standing left side, pointing right with curious expression. Big glowing "?" center top with sparkles. ${item.object} floating clearly center right. Bold text "Yeh kya hai?" at very bottom center. 9:16 vertical. Pixar style. No other text on screen.`;
}
function buildVideoPrompt(item) {
  return `Use reference scene exactly. Teacher standing left side, pointing to ${item.object} curiously. "?" appears center top with sparkles. Teacher asks in Hindi Indian accent: "To btao.. yeh kya hai?" Pause 2 seconds. "?" disappears and glowing bold text "${item.name.toUpperCase()}" appears center top with sparkles. Text changes to "${item.name} - ${item.hindi}" at bottom with sparkles. Teacher says in Hindi Indian accent: "Yeh ${item.name.toUpperCase()} hai.. Bahut achhe!" Teacher claps and thumbs up. 8 seconds. Smooth animation. No glitch. Only Hindi Indian accent audio.`;
}

const SERIES_COLORS = ['#ff4400', '#44bb66', '#4488ff', '#cc88ff', '#ff8800', '#ff4488', '#00ccbb', '#ffcc00'];
const SERIES_EMOJIS = ['🍎', '🔢', '🌈', '🐾', '🥦', '🚗', '🎵', '🏠', '🌟', '🦁', '📚', '⚽'];

// ── Main Component ────────────────────────────────────────
function CreateSeriesPage({ user }) {
  const toast = useToast();

  const [seriesList, setSeriesList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Create form
  const [showForm, setShowForm] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🌟');
  const [selectedColor, setSelectedColor] = useState('#ff4400');
  const [generating, setGenerating] = useState(false);

  // Detail view
  const [openSeries, setOpenSeries] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  const displayName = user?.displayName || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => { loadList(); }, [user.uid]);

  async function loadList() {
    setLoadingList(true);
    try {
      const list = await getSeries(user.uid);
      setSeriesList(list);
    } catch (e) { toast('❌ Load nahi hua'); }
    setLoadingList(false);
  }

  // ── AI Generate Items ──────────────────────────────────
  async function generateAndSave() {
    if (!seriesName.trim()) { toast('⚠️ Series ka naam likho!'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          max_tokens: 800,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: `Generate exactly 10 unique items for a Hindi kids educational YouTube series about "${seriesName}".
Return ONLY a JSON array. No markdown, no backticks, no explanation.
Format: [{"name":"English Name","hindi":"Hinglish Roman pronunciation","object":"One [adjective] [item] for Pixar 3D animation"}]
Rules:
- name: Capitalized English word
- hindi: Roman script only (no Devanagari)
- object: clear image generation description
- All 10 must be different and relevant to "${seriesName}"`,
          }],
        }),
      });
      const data = await res.json();
      let text = (data.choices?.[0]?.message?.content || '').trim();
      text = text.replace(/```json|```/g, '').trim();
      const items = JSON.parse(text);

      await saveSeries(user.uid, {
        name: seriesName.trim(),
        emoji: selectedEmoji,
        color: selectedColor,
        items,
        doneSections: {},
        doneCount: 0,
        progress: 0,
      });

      toast(`${selectedEmoji} "${seriesName}" series ready!`);
      setSeriesName(''); setShowForm(false);
      loadList();
    } catch (e) {
      console.error(e);
      toast('❌ Error: ' + e.message);
    }
    setGenerating(false);
  }

  // ── Mark Done ─────────────────────────────────────────
  async function markDone(series, sectionKey, currentlyDone) {
    const doneSections = { ...(series.doneSections || {}) };
    if (currentlyDone) delete doneSections[sectionKey];
    else doneSections[sectionKey] = true;
    const total = (series.items || []).length + 2;
    const doneCount = Object.keys(doneSections).length;
    const progress = Math.round((doneCount / total) * 100);
    await updateSeries(user.uid, series.id, { doneSections, doneCount, progress });
    const updated = { ...series, doneSections, doneCount, progress };
    setSeriesList(l => l.map(s => s.id === series.id ? updated : s));
    setOpenSeries(updated);
    toast(currentlyDone ? 'Undone!' : '✅ Done!');
  }

  // ── Copy ──────────────────────────────────────────────
  function copy(key, text) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
      toast('📋 Copied!');
    });
  }

  // ── Delete ────────────────────────────────────────────
  async function handleDelete(series) {
    if (!window.confirm(`"${series.name}" series delete karein?`)) return;
    await deleteSeries(user.uid, series.id);
    toast('🗑 Deleted!');
    setOpenSeries(null);
    loadList();
  }

  // ── RENDER ────────────────────────────────────────────

  // Detail View
  if (openSeries) {
    const s = openSeries;
    const done = s.doneSections || {};
    const total = (s.items || []).length + 2;

    const sections = [
      {
        key: 'intro',
        title: '🎬 Intro Video',
        color: '#4488ff',
        prompts: [{ type: 'VIDEO PROMPT', text: buildIntroPrompt(s.name) }],
      },
      ...(s.items || []).map((item, i) => ({
        key: `item_${i}`,
        title: `${i + 1}. ${item.name} (${item.hindi})`,
        color: s.color,
        prompts: [
          { type: '🖼 IMAGE PROMPT', text: buildImagePrompt(item) },
          { type: '🎬 VIDEO PROMPT', text: buildVideoPrompt(item) },
        ],
      })),
      {
        key: 'outro',
        title: '🎤 Outro Video',
        color: '#cc88ff',
        prompts: [{ type: 'VIDEO PROMPT', text: buildOutroPrompt() }],
      },
    ];

    return (
      <div className="page-content" style={{ background: 'var(--void)' }}>
        <div className="mini-topbar">
          <button onClick={() => setOpenSeries(null)}
            style={{ background: 'none', border: 'none', color: '#ff4400', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Back
          </button>
          <span style={{ fontSize: 13, color: '#888', fontWeight: 700 }}>{s.emoji} {s.name}</span>
          <button onClick={() => handleDelete(s)}
            style={{ background: 'none', border: 'none', color: '#555', fontSize: 18, cursor: 'pointer' }}>
            🗑
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Progress */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: 12, padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#888', fontWeight: 600 }}>Progress</span>
              <span style={{ fontSize: 12, color: s.color, fontWeight: 800 }}>{s.doneCount || 0} / {total} done</span>
            </div>
            <div style={{ height: 6, background: '#1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: (s.progress || 0) + '%', background: s.color, borderRadius: 6, transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Sections */}
          {sections.map(section => {
            const isDone = !!done[section.key];
            const isOpen = openSection === section.key;
            return (
              <div key={section.key} style={{ background: '#0f0f0f', border: `1px solid ${isDone ? '#1a3a1a' : '#1e1e1e'}`, borderRadius: 12, overflow: 'hidden' }}>
                {/* Header */}
                <div
                  onClick={() => setOpenSection(isOpen ? null : section.key)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', cursor: 'pointer', borderBottom: isOpen ? '1px solid #1e1e1e' : 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDone ? '#44bb66' : '#ccc' }}>
                      {section.title}
                    </span>
                    {isDone && (
                      <span style={{ fontSize: 9, background: 'rgba(68,187,102,0.15)', color: '#44bb66', border: '1px solid rgba(68,187,102,0.3)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                        ✅ Done
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 13, color: '#444' }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Content */}
                {isOpen && (
                  <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {section.prompts.map((p, pi) => {
                      const copyKey = `${section.key}_${pi}`;
                      const isCopied = copiedKey === copyKey;
                      return (
                        <div key={pi}>
                          <div style={{ fontSize: 9, color: section.color, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 5 }}>
                            {p.type}
                          </div>
                          <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 1.7, color: '#bbb', position: 'relative' }}>
                            {p.text}
                            <button
                              onClick={() => copy(copyKey, p.text)}
                              style={{
                                position: 'absolute', top: 8, right: 8,
                                background: isCopied ? '#44bb66' : '#1a1a1a',
                                border: `1px solid ${isCopied ? '#44bb66' : '#333'}`,
                                color: isCopied ? '#fff' : '#666',
                                borderRadius: 8, padding: '4px 10px',
                                fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {isCopied ? '✅' : '📋'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      onClick={() => markDone(s, section.key, isDone)}
                      style={{
                        background: isDone ? 'rgba(68,187,102,0.12)' : '#0a1a0a',
                        border: `1px solid ${isDone ? 'rgba(68,187,102,0.4)' : '#224422'}`,
                        color: isDone ? '#44bb66' : '#44aa44',
                        borderRadius: 10, padding: '11px 16px',
                        fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        width: '100%', transition: 'all 0.2s',
                      }}
                    >
                      {isDone ? '✅ Done ho gaya!' : '✔ Mark as Done'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <BottomNav userInitial={initial} />
      </div>
    );
  }

  // List View
  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span className="mini-topbar-title" style={{ color: '#cc88ff', fontFamily: 'inherit', fontSize: 14 }}>
          🎬 Create Series
        </span>
        <button
          onClick={() => setShowForm(true)}
          style={{ background: '#cc88ff', border: 'none', color: '#fff', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
        >
          + Nayi
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 70, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── CREATE FORM ── */}
        {showForm && (
          <div style={{ background: '#0d000d', border: '1px solid #330033', borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#cc88ff', marginBottom: 14 }}>✨ Nayi Series</div>

            <input
              value={seriesName}
              onChange={e => setSeriesName(e.target.value)}
              placeholder="Series ka naam (e.g. Animals, Vegetables...)"
              maxLength={30}
              style={{
                width: '100%', background: '#1a001a', border: '1px solid #440044',
                color: '#eee', borderRadius: 10, padding: '11px 14px',
                fontSize: 14, outline: 'none', marginBottom: 12,
                fontFamily: "'Noto Sans Devanagari', sans-serif",
              }}
            />

            {/* Emoji */}
            <div style={{ fontSize: 10, color: '#777', marginBottom: 8, letterSpacing: 1 }}>EMOJI CHUNO</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              {SERIES_EMOJIS.map(e => (
                <button key={e} onClick={() => setSelectedEmoji(e)}
                  style={{
                    fontSize: 22, padding: '6px 8px', borderRadius: 10, cursor: 'pointer',
                    background: selectedEmoji === e ? 'rgba(204,136,255,0.2)' : '#1a1a1a',
                    border: `1px solid ${selectedEmoji === e ? '#cc88ff' : '#333'}`,
                    transition: 'all 0.15s',
                  }}>{e}</button>
              ))}
            </div>

            {/* Color */}
            <div style={{ fontSize: 10, color: '#777', marginBottom: 8, letterSpacing: 1 }}>COLOR CHUNO</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {SERIES_COLORS.map(c => (
                <div key={c} onClick={() => setSelectedColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: `3px solid ${selectedColor === c ? '#fff' : 'transparent'}`,
                    transform: selectedColor === c ? 'scale(1.2)' : 'scale(1)',
                    transition: 'all 0.15s',
                  }} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={generateAndSave} disabled={generating}
                style={{
                  flex: 2, background: generating ? '#1a001a' : 'linear-gradient(135deg,#550055,#330033)',
                  border: '1px solid #660066', color: '#cc88ff', borderRadius: 10,
                  padding: '12px 16px', fontSize: 13, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}>
                {generating
                  ? <><div className="spinner" style={{ borderTopColor: '#cc88ff', width: 16, height: 16 }} />AI generate kar raha hai...</>
                  : '🤖 Generate Karo'}
              </button>
              <button onClick={() => { setShowForm(false); setSeriesName(''); }}
                style={{ flex: 1, background: '#111', border: '1px solid #333', color: '#666', borderRadius: 10, padding: '12px 8px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── SERIES LIST ── */}
        {loadingList ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#555' }}>
            <div className="spinner" style={{ margin: '0 auto 10px', borderTopColor: '#cc88ff' }} />
            <div style={{ fontSize: 12 }}>Loading...</div>
          </div>
        ) : seriesList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#444' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#555', marginBottom: 6 }}>Koi series nahi hai abhi</div>
            <div style={{ fontSize: 12, color: '#333' }}>Upar "+ Nayi" button se banao</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {seriesList.map(s => {
              const total = (s.items || []).length + 2;
              const pct = s.progress || 0;
              return (
                <div key={s.id}
                  onClick={() => setOpenSeries(s)}
                  style={{
                    background: '#0f0f0f', border: '1px solid #1e1e1e',
                    borderRadius: 14, padding: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 14,
                    borderLeft: `3px solid ${s.color}`,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = s.color}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1e1e1e'}
                >
                  <div style={{ fontSize: 36, flexShrink: 0 }}>{s.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#eee', marginBottom: 3 }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: 8 }}>
                      {s.doneCount || 0} / {total} prompts done
                    </div>
                    <div style={{ height: 4, background: '#1a1a1a', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: pct + '%', background: s.color, borderRadius: 4 }} />
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: '#333' }}>›</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav userInitial={initial} />
    </div>
  );
}

export default function CreateSeriesWrapper() {
  return (
    <ToastProvider>
      <AuthWrapper>
        {({ user }) => <CreateSeriesPage user={user} />}
      </AuthWrapper>
    </ToastProvider>
  );
}

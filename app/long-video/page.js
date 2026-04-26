// 📁 LOCATION: app/long-video/page.js
'use client';

import { useState } from 'react';
import { AppShell } from '../../components/AppShell';
import { ToastProvider, useToast } from '../../components/Toast';
import AuthWrapper from '../../components/AuthWrapper';

const PRESETS = [
  { label: '1 to 10',   topic: 'Numbers 1 to 10',   hint: '1,2,3...10' },
  { label: '1 to 50',   topic: 'Numbers 1 to 50',   hint: '1,2,3...50' },
  { label: '1 to 100',  topic: 'Numbers 1 to 100',  hint: '1,2,3...100' },
  { label: 'A to Z',    topic: 'Alphabets A to Z',  hint: 'A,B,C...Z' },
  { label: 'Fruits',    topic: 'Fruits A to Z',     hint: 'Apple, Banana...' },
  { label: 'Animals',   topic: 'Animals A to Z',    hint: 'Ant, Bear...' },
  { label: 'Veggies',   topic: 'Vegetables',        hint: 'Carrot, Brinjal...' },
  { label: 'Colors',    topic: 'Colors',            hint: 'Red, Blue...' },
  { label: 'Shapes',    topic: 'Shapes',            hint: 'Circle, Square...' },
];

function LongVideoPage() {
  const { toast } = useToast();
  const [topic, setTopic]       = useState('');
  const [range, setRange]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [prompt, setPrompt]     = useState('');
  const [copied, setCopied]     = useState(false);

  async function generate() {
    const t = topic.trim();
    const r = range.trim();
    if (!t) return toast('⚠️ Topic daalo pehle!');
    setLoading(true);
    setPrompt('');

    const userMsg = `You are a professional YouTube kids content scriptwriter for the Hindi channel "Rang Tarang".

Generate a COMPLETE and DETAILED AI prompt (that I will paste into ChatGPT/Gemini) for creating a long educational YouTube video for kids.

Topic: ${t}${r ? `\nRange/Items: ${r}` : ''}

The prompt I need should instruct the AI to write:
1. INTRO section - engaging hook, channel intro, what kids will learn
2. MAIN CONTENT - for EVERY single item in the topic (do not skip any), each item should have:
   - Fun fact or description in simple Hindi + English
   - Example sentence
   - Visual description (what should be shown on screen)
3. OUTRO section - summary, subscribe reminder, next video teaser

Requirements for the prompt you generate:
- Style: Colorful, animated, fun for kids aged 2-8
- Language: Mix of Hindi and English (Hinglish)
- Tone: Energetic, friendly teacher voice
- Each item should be consistent in format
- Include timing suggestions
- Include on-screen text suggestions

Write ONLY the prompt itself (no explanation, no preamble). Start directly with the prompt text.`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: userMsg }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      setPrompt(text);
    } catch (e) {
      toast('❌ Error: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function copyPrompt() {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopied(true);
      toast('📋 Prompt copy ho gaya!');
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="page-content" style={{ background: 'var(--void)' }}>
      <div className="mini-topbar">
        <span style={{ color: '#ffaa00', fontSize: 14, fontWeight: 700 }}>🎥 Long Video</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 12, paddingBottom: 80, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Topic Input */}
        <div style={{ background: '#0f0f0f', border: '1px solid #2a2a00', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#777', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>📌 Topic</div>
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Numbers 1 to 100, Fruits A to Z..."
            style={{ width: '100%', background: '#1a1a00', border: '1px solid #333300', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: '#eee', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Presets */}
        <div>
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>⚡ Quick Select</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESETS.map(p => (
              <button key={p.label} onClick={() => { setTopic(p.topic); setRange(p.hint); }}
                style={{ background: topic === p.topic ? 'rgba(255,170,0,0.15)' : '#111', border: `1px solid ${topic === p.topic ? '#ffaa00' : '#222'}`, color: topic === p.topic ? '#ffaa00' : '#666', borderRadius: 20, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Range Input */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 10, color: '#777', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8 }}>🎯 Range / Items <span style={{ color: '#444', fontWeight: 400 }}>(optional)</span></div>
          <input
            value={range}
            onChange={e => setRange(e.target.value)}
            placeholder="e.g. 1 to 50, Apple to Mango, only vegetables..."
            style={{ width: '100%', background: '#111', border: '1px solid #222', borderRadius: 10, padding: '11px 12px', fontSize: 13, color: '#eee', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Generate Button */}
        <button onClick={generate} disabled={loading}
          style={{ background: loading ? '#1a1000' : 'linear-gradient(135deg,#cc7700,#ffaa00)', border: 'none', color: loading ? '#555' : '#000', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {loading ? (
            <><div className="spinner" style={{ width: 18, height: 18, borderTopColor: '#ffaa00' }} />Prompt ban raha hai...</>
          ) : '✨ Prompt Generate Karo'}
        </button>

        {/* Output */}
        {prompt && (
          <div style={{ background: '#0a0a00', border: '1px solid #333300', borderRadius: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: '#ffaa00', letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 }}>✅ Ready Prompt</div>
              <button onClick={copyPrompt}
                style={{ background: copied ? '#44bb66' : '#1a1a00', border: `1px solid ${copied ? '#44bb66' : '#444400'}`, color: copied ? '#fff' : '#ffaa00', borderRadius: 10, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                {copied ? '✅ Copied!' : '📋 Copy Karo'}
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#ccc', lineHeight: 1.8, whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto', padding: 4 }}>
              {prompt}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(255,170,0,0.06)', border: '1px solid #2a2000', borderRadius: 10, fontSize: 11, color: '#888', lineHeight: 1.6 }}>
              💡 Yeh prompt copy karke <span style={{ color: '#ffaa00' }}>ChatGPT / Gemini / Claude</span> mein paste karo → poora video content mil jaayega!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LongVideoWrapper() {
  return (
    <ToastProvider>
      <AuthWrapper>{({ user }) => <LongVideoPage user={user} />}</AuthWrapper>
    </ToastProvider>
  );
}

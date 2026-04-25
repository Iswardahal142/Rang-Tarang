'use client';

import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { key: 'dashboard',     icon: '📺', label: 'Dashboard',  path: '/dashboard'     },
  { key: 'create-series', icon: '🎬', label: 'Series',     path: '/create-series' },
];

export default function BottomNav({ userInitial }) {
  const pathname = usePathname();
  const router   = useRouter();

  function isActive(tab) {
    return pathname.startsWith(tab.path);
  }

  return (
    <nav style={{
      position:             'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex:               998,
      display:              'flex',
      alignItems:           'stretch',
      background:           'rgba(8,0,8,0.97)',
      backdropFilter:       'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderTop:            '1px solid #2a0022',
      height:               58,
      paddingBottom:        'env(safe-area-inset-bottom, 0px)',
    }}>
      {TABS.map(tab => {
        const active = isActive(tab);
        const activeColor = tab.key === 'dashboard' ? '#ff4400' : '#cc88ff';
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.path)}
            style={{
              flex:                    1,
              display:                 'flex',
              flexDirection:           'column',
              alignItems:              'center',
              justifyContent:          'center',
              gap:                     3,
              background:              'none',
              border:                  'none',
              cursor:                  'pointer',
              padding:                 '6px 4px',
              WebkitTapHighlightColor: 'transparent',
              position:                'relative',
            }}
          >
            {active && (
              <span style={{
                position:     'absolute',
                top: 0, left: '20%', right: '20%',
                height:       2,
                background:   activeColor,
                borderRadius: '0 0 3px 3px',
              }} />
            )}
            <span style={{
              fontSize:  22,
              lineHeight: 1,
              transform:  active ? 'translateY(-1px)' : 'none',
              transition: 'transform 0.15s',
            }}>
              {tab.icon}
            </span>
            <span style={{
              fontSize:      10,
              color:         active ? activeColor : '#555',
              letterSpacing: 0.3,
              fontFamily:    "'Noto Sans Devanagari', sans-serif",
              transition:    'color 0.15s',
              fontWeight:    active ? 700 : 400,
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

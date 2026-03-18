'use client';
import { useState } from 'react';

const LANG_NAMES: Record<string, string> = {
  en:'English', de:'Deutsch', fr:'Français', es:'Español', it:'Italiano',
  pl:'Polski', nl:'Nederlands', pt:'Português', ro:'Română', cs:'Čeština',
  hu:'Magyar', sv:'Svenska', da:'Dansk', fi:'Suomi', sk:'Slovenčina',
  bg:'Български', hr:'Hrvatski', el:'Ελληνικά', lt:'Lietuvių', lv:'Latviešu',
  et:'Eesti', ar:'العربية', zh:'中文', ja:'日本語', ko:'한국어',
  hi:'हिन्दी', tr:'Türkçe', vi:'Tiếng Việt', th:'ไทย', id:'Indonesia',
  ms:'Melayu', fa:'فارسی', he:'עברית', uk:'Українська', ru:'Русский',
  ka:'ქართული', az:'Azərbaycanca', kk:'Қазақша', uz:'O\'zbek',
  mn:'Монгол', bn:'বাংলা', ur:'اردو', ta:'தமிழ்', te:'తెలుగు',
  sw:'Kiswahili', am:'አማርኛ', sr:'Српски', sl:'Slovenščina',
  mk:'Македонски', sq:'Shqip',
};

interface Props {
  current: string;
  available: string[];
  translations: Record<string, { name: string; description: string }>;
  onSelect: (lang: string, data: { name: string; description: string } | null) => void;
}

export default function LangSwitcher({ current, available, translations, onSelect }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e5e7eb',
          background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}
      >
        🌐 {LANG_NAMES[current] ?? current.toUpperCase()} ▾
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 4, zIndex: 200,
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,.12)', padding: 8,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
          width: 360, maxHeight: 400, overflowY: 'auto',
        }}>
          {['en', ...available].map(lang => (
            <button
              key={lang}
              onClick={() => {
                onSelect(lang, lang === 'en' ? null : translations[lang] ?? null);
                setOpen(false);
              }}
              style={{
                padding: '6px 10px', borderRadius: 6, border: 'none',
                background: lang === current ? '#eff6ff' : 'transparent',
                color: lang === current ? '#2563eb' : '#374151',
                cursor: 'pointer', fontSize: 12, fontWeight: lang === current ? 700 : 400,
                textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
              }}
            >
              {LANG_NAMES[lang] ?? lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

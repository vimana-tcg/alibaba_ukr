'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { RowsPhotoAlbum } from 'react-photo-album';
import 'react-photo-album/rows.css';
import LangSwitcher from '@/components/LangSwitcher';

const COUNTRY_MARKETS = [
  { flag: '🇩🇪', name: 'Germany' }, { flag: '🇵🇱', name: 'Poland' },
  { flag: '🇫🇷', name: 'France' }, { flag: '🇳🇱', name: 'Netherlands' },
  { flag: '🇮🇹', name: 'Italy' }, { flag: '🇪🇸', name: 'Spain' },
  { flag: '🇺🇸', name: 'USA' }, { flag: '🇬🇧', name: 'UK' },
  { flag: '🇸🇦', name: 'Saudi Arabia' }, { flag: '🇦🇪', name: 'UAE' },
  { flag: '🇯🇵', name: 'Japan' }, { flag: '🇨🇳', name: 'China' },
  { flag: '🇮🇳', name: 'India' }, { flag: '🇧🇷', name: 'Brazil' },
  { flag: '🇹🇷', name: 'Turkey' }, { flag: '🇰🇷', name: 'South Korea' },
];

const CATEGORY_ICONS: Record<string, string> = {
  food: '🌾', metals: '⚙️', chemicals: '🧪', textiles: '👗',
  machinery: '🔧', wood: '🌲', electronics: '💡', construction: '🏗️',
  energy: '⚡', healthcare: '💊', automotive: '🚗', packaging: '📦',
};

interface Product {
  id: string;
  nameEn: string;
  nameUa?: string | null;
  slug?: string | null;
  description?: string | null;
  richDescription?: string | null;
  unit: string;
  minOrderQty?: number | null;
  priceUsd?: number | null;
  hsCode?: string | null;
  imageUrl?: string | null;
}

interface Cert { id: string; certType: string; certNumber?: string | null }

interface Vendor {
  id: string;
  companyNameEn: string;
  companyNameUa: string;
  slug: string;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  yearEstablished?: number | null;
  employeeCount?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  isVerified: boolean;
  kycStatus: string;
  edrpou?: string | null;
  logoUrl?: string | null;
  translations?: Record<string, { name: string; description: string }> | null;
  products: Product[];
  certifications: Cert[];
}

interface Props {
  vendor: Vendor;
  initialLang?: string;
  initialTranslation?: { name: string; description: string } | null;
}

// Sticky nav sections
const NAV_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'products', label: 'Products' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'contact', label: 'Contact' },
];

export default function ExportPage({ vendor, initialLang = 'en', initialTranslation = null }: Props) {
  const translations = (vendor.translations as Record<string, { name: string; description: string }>) ?? {};
  const availableLangs = Object.keys(translations);
  const [lang, setLang] = useState(initialLang);
  const [t, setT] = useState<{ name: string; description: string } | null>(initialTranslation);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState('overview');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const displayName = t?.name ?? vendor.companyNameEn;
  const displayDesc = t?.description ?? vendor.description ?? '';
  const catIcon = CATEGORY_ICONS[vendor.category ?? ''] ?? '🏭';

  // All product images for gallery — deduplicated
  const allImages = Array.from(new Set(
    vendor.products.map(p => p.imageUrl).filter(Boolean) as string[]
  ));

  // hero bg = first large product photo (not the logo)
  const heroImage = allImages[0] ?? null;

  // react-photo-album needs width/height — use 4:3 default
  const galleryPhotos = allImages.map((src, i) => ({
    src,
    width: 1200,
    height: i % 3 === 0 ? 800 : 900, // slight height variation for visual interest
    alt: `${vendor.companyNameEn} — photo ${i + 1}`,
  }));

  // Scroll spy for sticky nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) setActiveSection(e.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );
    NAV_SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const yearsExp = vendor.yearEstablished
    ? `${new Date().getFullYear() - vendor.yearEstablished}+`
    : '20+';

  return (
    <div style={{ background: '#f8fafc' }}>

      {/* ══════════════════════════════════════════════
          HERO — Full-bleed cinematic
      ══════════════════════════════════════════════ */}
      <div id="overview" ref={el => { sectionRefs.current['overview'] = el; }} style={{
        position: 'relative',
        minHeight: 580,
        background: heroImage
          ? `url(${heroImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #050a19 0%, #0a1a3c 50%, #1e3a8a 100%)',
        color: '#fff',
        overflow: 'hidden',
      }}>
        {/* Dark cinematic overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(5,10,25,0.93) 0%, rgba(15,25,60,0.88) 40%, rgba(5,10,25,0.75) 100%)',
        }} />
        {/* Dot grid texture */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px', pointerEvents: 'none',
        }} />
        {/* Pulsing blue radial glow */}
        <div style={{
          position: 'absolute', top: '50%', left: '40%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none',
          animation: 'pulse 4s cubic-bezier(.4,0,.6,1) infinite',
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          {/* Breadcrumb + lang */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28, marginBottom: 52, flexWrap: 'wrap', gap: 12 }}>
            <nav style={{ fontSize: 13, opacity: 0.55 }}>
              <Link href="/" style={{ color: '#93c5fd' }}>Home</Link>{' / '}
              <Link href="/manufacturers" style={{ color: '#93c5fd' }}>Manufacturers</Link>{' / '}
              <span>{vendor.companyNameEn}</span>
            </nav>
            <LangSwitcher current={lang} available={availableLangs} translations={translations}
              onSelect={(l, d) => { setLang(l); setT(d); }} />
          </div>

          {/* Main hero layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '116px 1fr 220px', gap: 32, alignItems: 'flex-start', paddingBottom: 0 }}>

            {/* Logo — framed glass card */}
            <div style={{
              width: 116, height: 116, borderRadius: 24,
              background: 'rgba(255,255,255,0.97)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.15), 0 12px 40px rgba(0,0,0,0.5)',
              flexShrink: 0, overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Subtle inner highlight */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(145deg, rgba(255,255,255,0.8) 0%, transparent 50%)', borderRadius: 24, pointerEvents: 'none' }} />
              {vendor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logoUrl} alt={vendor.companyNameEn}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 10, position: 'relative', zIndex: 1 }} />
              ) : (
                <span style={{ fontSize: 48, fontWeight: 900, color: '#1e40af', position: 'relative', zIndex: 1 }}>
                  {vendor.companyNameEn[0]}
                </span>
              )}
            </div>

            {/* Name + info */}
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                {vendor.isVerified && (
                  <span style={{ background: '#16a34a', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>✓ KYC Verified</span>
                )}
                <span style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                  {catIcon} {(vendor.category ?? 'Manufacturing').toUpperCase()}
                </span>
                <span style={{ background: 'rgba(37,99,235,0.35)', color: '#bfdbfe', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  🌐 {availableLangs.length + 1} languages
                </span>
              </div>
              <h1 style={{ fontSize: 46, fontWeight: 900, lineHeight: 1.08, marginBottom: 12, letterSpacing: '-0.5px', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                {displayName}
              </h1>
              <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 18, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <span>🇺🇦 {vendor.city ?? 'Ukraine'}</span>
                {vendor.yearEstablished && <span>· Est. {vendor.yearEstablished}</span>}
                {vendor.employeeCount && <span>· {vendor.employeeCount} employees</span>}
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>website ↗</a>
                )}
              </p>
              <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.75, maxWidth: 640 }}>{displayDesc}</p>
            </div>

            {/* RFQ CTA — compact hero version */}
            <div style={{
              background: 'linear-gradient(145deg, rgba(37,99,235,0.85), rgba(29,78,216,0.9))',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '24px 20px', textAlign: 'center',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 40px rgba(37,99,235,0.4)',
            }}>
              <div style={{ fontSize: 34, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>Get Best Price</div>
              <div style={{ fontSize: 11, color: '#bfdbfe', marginBottom: 16 }}>Factory-direct · Reply 24h</div>
              <Link href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
                style={{ display: 'block', background: '#fff', color: '#1d4ed8', padding: '12px', borderRadius: 12, fontWeight: 900, fontSize: 14, textDecoration: 'none', marginBottom: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                📋 Request Quote (RFQ)
              </Link>
              <div style={{ fontSize: 10, color: '#93c5fd' }}>✓ Free · ✓ No registration</div>
            </div>
          </div>

          {/* Stats bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            marginTop: 48, paddingTop: 24, paddingBottom: 28,
          }}>
            {[
              { num: yearsExp, label: 'Years in business' },
              { num: vendor.employeeCount ?? '50+', label: 'Employees' },
              { num: `${vendor.products.length || '10'}+`, label: 'Product types' },
              { num: `${availableLangs.length + 1}`, label: 'Languages' },
            ].map((s, i) => (
              <div key={i} style={{
                textAlign: 'center',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                padding: '0 16px',
              }}>
                <div style={{ fontSize: 38, fontWeight: 900, color: '#60a5fa', lineHeight: 1, letterSpacing: '-1px' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════ */}
      <div style={{ background: '#15803d', padding: '13px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {[
              '✅ EUR.1 · 0% EU Import Duty (DCFTA)',
              '✅ Direct from Manufacturer',
              '✅ DDP / FOB / CIF / EXW',
              '✅ LC · T/T · CAD · Open Account',
              '✅ Pre-shipment inspection',
            ].map(item => <span key={item}>{item}</span>)}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          STICKY COMPANY NAV
      ══════════════════════════════════════════════ */}
      <div style={{
        position: 'sticky', top: 60, zIndex: 50,
        background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div className="container" style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {NAV_SECTIONS.map(s => (
            <a key={s.id} href={`#${s.id}`}
              style={{
                padding: '14px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
                color: activeSection === s.id ? '#2563eb' : '#64748b',
                borderBottom: activeSection === s.id ? '2px solid #2563eb' : '2px solid transparent',
                transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0,
              }}>
              {s.label}
            </a>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PHOTO GALLERY — react-photo-album justified rows
      ══════════════════════════════════════════════ */}
      {allImages.length > 0 && (
        <div id="gallery" ref={el => { sectionRefs.current['gallery'] = el; }}
          style={{ background: '#0f172a', padding: '56px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                Production · Equipment · Facilities
              </p>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#f8fafc' }}>
                Factory & Products
              </h2>
            </div>

            {/* react-photo-album justified rows */}
            <div style={{ cursor: 'zoom-in' }} className="photo-gallery">
              <RowsPhotoAlbum
                photos={galleryPhotos}
                targetRowHeight={280}
                spacing={8}
                padding={0}
                onClick={({ index }) => setLightboxIdx(index)}
              />
            </div>

            {allImages.length > 6 && (
              <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#475569' }}>
                Click any photo to view full-size · {allImages.length} photos total
              </p>
            )}
          </div>

          {/* Lightbox */}
          {lightboxIdx !== null && (
            <div
              onClick={() => setLightboxIdx(null)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out',
              }}>
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null && i > 0 ? i - 1 : allImages.length - 1); }}
                style={{ position: 'absolute', left: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 28, width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                ‹
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={allImages[lightboxIdx]} alt=""
                style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 80px rgba(0,0,0,0.8)' }} />
              <button
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => i !== null && i < allImages.length - 1 ? i + 1 : 0); }}
                style={{ position: 'absolute', right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 28, width: 52, height: 52, borderRadius: '50%', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
                ›
              </button>
              <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                {lightboxIdx + 1} / {allImages.length}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MAIN BODY — 2-col layout
      ══════════════════════════════════════════════ */}
      <div className="container" style={{ padding: '56px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div>

            {/* ── Products ── */}
            {vendor.products.length > 0 && (
              <section id="products" ref={el => { sectionRefs.current['products'] = el; }} style={{ marginBottom: 56 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>📦 Products for Export</h2>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                    {vendor.products.length} items
                  </span>
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                  {vendor.products.map((p: Product) => (
                    <Link key={p.id}
                      href={`/manufacturer/${vendor.slug}/product/${p.slug ?? p.id}`}
                      style={{
                        textDecoration: 'none', display: 'flex', borderRadius: 18, overflow: 'hidden',
                        background: '#fff', border: '1.5px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,.05)',
                        transition: 'all .2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 10px 32px rgba(37,99,235,0.14)';
                        (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.05)';
                        (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0';
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                      }}>
                      {/* Product image */}
                      <div style={{ width: 152, flexShrink: 0, background: '#f1f5f9', position: 'relative', minHeight: 130 }}>
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.nameEn}
                            style={{ width: '100%', height: '100%', minHeight: 130, objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', minHeight: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44 }}>
                            {catIcon}
                          </div>
                        )}
                        {/* Category badge on image */}
                        <div style={{ position: 'absolute', bottom: 6, left: 6, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 6, padding: '2px 6px', fontSize: 10, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                          {catIcon} {vendor.category ?? 'goods'}
                        </div>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 5 }}>{p.nameEn}</div>
                          {p.description && (
                            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {p.description}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {p.hsCode && (
                              <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>HS {p.hsCode}</span>
                            )}
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{p.unit}</span>
                            {p.minOrderQty && (
                              <span style={{ background: '#fffbeb', color: '#92400e', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>MOQ {p.minOrderQty} {p.unit}</span>
                            )}
                            <span style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              {p.priceUsd ? `$${p.priceUsd}/${p.unit}` : '💲 Price on request'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                          <div onClick={e => e.preventDefault()}>
                            <Link href={`/rfq/new?vendorId=${vendor.id}&productId=${p.id}`}
                              style={{ display: 'block', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800, textDecoration: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              Get Quote →
                            </Link>
                          </div>
                          <div style={{ background: '#f1f5f9', color: '#475569', padding: '8px 18px', borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: 'center' }}>
                            Details →
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Certifications ── */}
            <section id="certifications" ref={el => { sectionRefs.current['certifications'] = el; }} style={{ marginBottom: 56 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>🏅 Quality & Certifications</h2>
              {vendor.certifications.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {vendor.certifications.map(c => (
                    <div key={c.id} style={{
                      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px 16px',
                      textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.04)',
                      transition: 'filter .2s, box-shadow .2s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(37,99,235,0.12)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0,0,0,.04)'; }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                      <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 14 }}>{c.certType}</div>
                      {c.certNumber && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>#{c.certNumber}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {['ISO 9001:2015', 'CE Marking', 'DSTU/GOST', 'HACCP'].map(cert => (
                    <div key={cert} style={{
                      background: '#fff', border: '1.5px dashed #e2e8f0', borderRadius: 16, padding: '20px 16px',
                      textAlign: 'center', opacity: 0.6,
                    }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
                      <div style={{ fontWeight: 700, color: '#94a3b8', fontSize: 13 }}>{cert}</div>
                      <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 4 }}>Certification pending</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Why Ukraine — dark section ── */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: 24, padding: '44px 40px', marginBottom: 56, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              {/* Decorative radial glow */}
              <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(59,130,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8, position: 'relative' }}>🇺🇦 Why source from Ukraine?</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 32, position: 'relative' }}>Europe's most competitive B2B sourcing destination</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, position: 'relative' }}>
                {[
                  { icon: '📜', title: '0% EU Import Duty', desc: 'DCFTA since 2016 — fully tariff-free access to all 27 EU member states via EUR.1 certificate' },
                  { icon: '🏭', title: 'Direct Factory Price', desc: 'No intermediaries. Buy from the manufacturer at ex-works price — 30–60% below Western Europe' },
                  { icon: '🔬', title: 'European Quality Standards', desc: 'ISO, CE, HACCP certified plants with EU-accredited laboratory testing' },
                  { icon: '🚢', title: 'Fast EU Logistics', desc: '5 EU border crossings. Road, rail, Danube river. Average 3–7 days delivery to EU' },
                ].map(item => (
                  <div key={item.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: '22px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 7 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Export Markets ── */}
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>🌍 Export Markets</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {COUNTRY_MARKETS.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#374151', transition: 'border-color .15s, box-shadow .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(37,99,235,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                    <span style={{ fontSize: 22 }}>{c.flag}</span> {c.name}
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: '1px dashed #cbd5e1', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#64748b', fontWeight: 700 }}>
                  +34 more
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Sticky sidebar */}
          <div id="contact" ref={el => { sectionRefs.current['contact'] = el; }} style={{ position: 'sticky', top: 108, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* RFQ CTA */}
            <div style={{ background: 'linear-gradient(145deg, #1e40af, #2563eb)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', color: '#fff', boxShadow: '0 12px 40px rgba(37,99,235,0.4)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
              <div style={{ fontSize: 48, marginBottom: 8, position: 'relative' }}>🤝</div>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 6, position: 'relative' }}>Start Trading Today</div>
              <div style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 20, position: 'relative' }}>Direct from manufacturer.<br />No middlemen. Best FOB price.</div>
              <Link href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
                style={{ display: 'block', background: '#fff', color: '#1d4ed8', padding: '16px', borderRadius: 12, fontWeight: 900, fontSize: 16, textDecoration: 'none', marginBottom: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.2)', position: 'relative' }}>
                📋 Request Quote (RFQ)
              </Link>
              <div style={{ fontSize: 11, color: '#93c5fd', position: 'relative' }}>✓ Free · ✓ No registration · ✓ Reply in 24–48h</div>
            </div>

            {/* Contact */}
            {(vendor.email || vendor.phone || vendor.website) && (
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: '#0f172a' }}>📞 Contact</div>
                {vendor.email && (
                  <a href={`mailto:${vendor.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2563eb', marginBottom: 10, fontWeight: 600, textDecoration: 'none' }}>
                    <span style={{ width: 28, height: 28, background: '#eff6ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>✉️</span>
                    {vendor.email}
                  </a>
                )}
                {vendor.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', marginBottom: 10, fontWeight: 600 }}>
                    <span style={{ width: 28, height: 28, background: '#f0fdf4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>📱</span>
                    {vendor.phone}
                  </div>
                )}
                {vendor.website && (
                  <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>
                    <span style={{ width: 28, height: 28, background: '#f5f3ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🌐</span>
                    Visit Website ↗
                  </a>
                )}
              </div>
            )}

            {/* Company details */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: '#0f172a' }}>🏢 Company Details</div>
              {[
                { label: 'Country', value: '🇺🇦 Ukraine' },
                { label: 'City', value: vendor.city ?? '—' },
                { label: 'Industry', value: `${catIcon} ${vendor.category ?? '—'}` },
                { label: 'Founded', value: vendor.yearEstablished ? String(vendor.yearEstablished) : '—' },
                { label: 'Employees', value: vendor.employeeCount ?? '—' },
                { label: 'EDRPOU', value: vendor.edrpou ?? '—' },
                { label: 'KYC Status', value: vendor.kycStatus === 'approved' ? '✅ Approved' : '⏳ Pending' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Duty calculator CTA */}
            <div style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '1.5px solid #fde68a', borderRadius: 16, padding: '20px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🧮</div>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: '#92400e' }}>Calculate Import Duties</div>
              <div style={{ fontSize: 12, color: '#78350f', marginBottom: 12 }}>Instant duty rates for 180+ countries</div>
              <Link href="/calculator" style={{ display: 'block', background: '#f59e0b', color: '#fff', padding: '10px', borderRadius: 10, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
                Open Calculator →
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
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

export default function ExportPage({ vendor, initialLang = 'en', initialTranslation = null }: Props) {
  const translations = (vendor.translations as Record<string, { name: string; description: string }>) ?? {};
  const availableLangs = Object.keys(translations);
  const [lang, setLang] = useState(initialLang);
  const [t, setT] = useState<{ name: string; description: string } | null>(initialTranslation);
  const [galleryIdx, setGalleryIdx] = useState<number | null>(null);

  const displayName = t?.name ?? vendor.companyNameEn;
  const displayDesc = t?.description ?? vendor.description ?? '';
  const catIcon = CATEGORY_ICONS[vendor.category ?? ''] ?? '🏭';

  // Collect all product images for gallery
  const allImages = vendor.products.map(p => p.imageUrl).filter(Boolean) as string[];
  const heroImage = vendor.logoUrl && !vendor.logoUrl.includes('logo') ? vendor.logoUrl : allImages[0];

  return (
    <div style={{ background: '#f8fafc' }}>

      {/* ══════════════════════════════════════════════════
          HERO — Full-bleed with overlay
      ══════════════════════════════════════════════════ */}
      <div style={{
        position: 'relative', minHeight: 520,
        background: heroImage
          ? `linear-gradient(135deg, rgba(5,10,25,0.88) 0%, rgba(10,25,60,0.82) 100%), url(${heroImage}) center/cover no-repeat`
          : 'linear-gradient(135deg, #050a19 0%, #0a1a3c 40%, #1e3a8a 100%)',
        color: '#fff', overflow: 'hidden',
      }}>
        {/* Subtle grid overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, padding: '0 24px' }}>
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28, marginBottom: 48, flexWrap: 'wrap', gap: 12 }}>
            <nav style={{ fontSize: 13, opacity: 0.6 }}>
              <Link href="/" style={{ color: '#93c5fd' }}>Home</Link> {' / '}
              <Link href="/manufacturers" style={{ color: '#93c5fd' }}>Manufacturers</Link> {' / '}
              <span>{vendor.companyNameEn}</span>
            </nav>
            <LangSwitcher current={lang} available={availableLangs} translations={translations}
              onSelect={(l, d) => { setLang(l); setT(d); }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 32, alignItems: 'flex-start', paddingBottom: 64 }}>

            {/* Logo card */}
            <div style={{
              width: 100, height: 100, borderRadius: 20,
              background: 'rgba(255,255,255,0.97)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)', flexShrink: 0, overflow: 'hidden',
            }}>
              {vendor.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logoUrl} alt={vendor.companyNameEn}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8 }} />
              ) : (
                <span style={{ fontSize: 42, fontWeight: 900, color: '#1e40af' }}>
                  {vendor.companyNameEn[0]}
                </span>
              )}
            </div>

            {/* Company name + info */}
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {vendor.isVerified && (
                  <span style={{ background: '#16a34a', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>✓ KYC Verified</span>
                )}
                <span style={{ background: 'rgba(255,255,255,0.12)', color: '#e2e8f0', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {catIcon} {(vendor.category ?? 'Manufacturing').toUpperCase()}
                </span>
                <span style={{ background: 'rgba(37,99,235,0.4)', color: '#bfdbfe', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  🌐 {availableLangs.length + 1} languages
                </span>
              </div>
              <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1, marginBottom: 10, letterSpacing: '-0.5px' }}>
                {displayName}
              </h1>
              <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 20 }}>
                🇺🇦 {vendor.city ?? 'Ukraine'}
                {vendor.yearEstablished && <span> · Est. {vendor.yearEstablished}</span>}
                {vendor.employeeCount && <span> · {vendor.employeeCount} employees</span>}
                {vendor.website && <span> · <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa' }}>website ↗</a></span>}
              </p>
              <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.7, maxWidth: 640 }}>{displayDesc}</p>
            </div>

            {/* CTA card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.9), rgba(29,78,216,0.95))',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '28px 24px', textAlign: 'center',
              minWidth: 200, backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Get Best Price</div>
              <div style={{ fontSize: 11, color: '#bfdbfe', marginBottom: 16 }}>Factory-direct · Reply in 24h</div>
              <Link href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
                style={{ display: 'block', background: '#fff', color: '#1d4ed8', padding: '13px', borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8 }}>
                📋 Request Quote (RFQ)
              </Link>
              <div style={{ fontSize: 11, color: '#93c5fd' }}>✓ Free · ✓ No registration</div>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, paddingBottom: 28, gap: 0,
          }}>
            {[
              { num: vendor.yearEstablished ? `${new Date().getFullYear() - vendor.yearEstablished}+` : '30+', label: 'Years of experience' },
              { num: vendor.employeeCount ?? '50+', label: 'Employees' },
              { num: `${vendor.products.length || '10'}+`, label: 'Product types' },
              { num: `${availableLangs.length + 1}`, label: 'Languages' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none', padding: '0 16px' }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>{s.num}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════════════════ */}
      <div style={{ background: '#16a34a', padding: '14px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {['✅ EUR.1 · 0% EU Import Duty (DCFTA)', '✅ Direct from Manufacturer', '✅ DDP / FOB / CIF / EXW', '✅ LC · T/T · CAD · Open Account', '✅ Pre-shipment inspection available'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          PHOTO GALLERY — WOW
      ══════════════════════════════════════════════════ */}
      {allImages.length > 0 && (
        <div style={{ background: '#0f172a', padding: '56px 0' }}>
          <div className="container">
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#64748b', textTransform: 'uppercase', marginBottom: 24, textAlign: 'center' }}>
              Production · Equipment · Facilities
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: allImages.length === 1 ? '1fr' : allImages.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)',
              gridAutoRows: 240,
              gap: 8,
            }}>
              {allImages.slice(0, 6).map((img, i) => (
                <div key={i}
                  onClick={() => setGalleryIdx(i)}
                  style={{
                    borderRadius: 12, overflow: 'hidden', cursor: 'zoom-in',
                    gridRow: i === 0 && allImages.length >= 3 ? 'span 2' : 'span 1',
                    position: 'relative', background: '#1e293b',
                  }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`${vendor.companyNameEn} photo ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform .3s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 50%)', pointerEvents: 'none' }} />
                  {i === 5 && allImages.length > 6 && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 28, fontWeight: 900 }}>
                      +{allImages.length - 6} more
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {galleryIdx !== null && (
            <div onClick={() => setGalleryIdx(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
              <button onClick={e => { e.stopPropagation(); setGalleryIdx(g => g !== null && g > 0 ? g - 1 : allImages.length - 1); }}
                style={{ position: 'absolute', left: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 32, width: 56, height: 56, borderRadius: '50%', cursor: 'pointer' }}>‹</button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={allImages[galleryIdx]} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }} />
              <button onClick={e => { e.stopPropagation(); setGalleryIdx(g => g !== null && g < allImages.length - 1 ? g + 1 : 0); }}
                style={{ position: 'absolute', right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', fontSize: 32, width: 56, height: 56, borderRadius: '50%', cursor: 'pointer' }}>›</button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════ */}
      <div className="container" style={{ padding: '56px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 40, alignItems: 'start' }}>

          {/* LEFT */}
          <div>

            {/* Products */}
            {vendor.products.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>📦 Products for Export</h2>
                  <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 999, fontSize: 13, fontWeight: 700 }}>
                    {vendor.products.length} items
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 16 }}>
                  {vendor.products.map((p: Product) => (
                    <Link key={p.id} href={`/manufacturer/${vendor.slug}/product/${p.slug ?? p.id}`}
                      style={{ textDecoration: 'none', display: 'flex', borderRadius: 16, overflow: 'hidden', background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,.06)', transition: 'all .2s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(37,99,235,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = '#93c5fd'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.06)'; (e.currentTarget as HTMLElement).style.borderColor = '#e2e8f0'; }}>
                      {/* Product image */}
                      <div style={{ width: 140, flexShrink: 0, background: '#f1f5f9', position: 'relative', minHeight: 120 }}>
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.imageUrl} alt={p.nameEn} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                            {catIcon}
                          </div>
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 5 }}>{p.nameEn}</div>
                          {p.description && <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 10 }}>{p.description}</div>}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {p.hsCode && <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>HS {p.hsCode}</span>}
                            <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{p.unit}</span>
                            {p.minOrderQty && <span style={{ background: '#fffbeb', color: '#92400e', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>MOQ {p.minOrderQty} {p.unit}</span>}
                            <span style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                              {p.priceUsd ? `$${p.priceUsd}/${p.unit}` : '💲 RFQ'}
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
              </div>
            )}

            {/* Certifications */}
            {vendor.certifications.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>🏅 Quality & Certifications</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                  {vendor.certifications.map(c => (
                    <div key={c.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '18px 16px', textAlign: 'center', boxShadow: '0 2px 6px rgba(0,0,0,.04)' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🏆</div>
                      <div style={{ fontWeight: 800, color: '#1d4ed8', fontSize: 14 }}>{c.certType}</div>
                      {c.certNumber && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>#{c.certNumber}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why Ukraine */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: 20, padding: '40px', marginBottom: 48, color: '#fff' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 8 }}>🇺🇦 Why source from Ukraine?</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 28 }}>The smartest B2B sourcing decision in Europe</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                {[
                  { icon: '📜', title: '0% EU Import Duty', desc: 'DCFTA in force since 2016 — full tariff-free access to all 27 EU member states' },
                  { icon: '🏭', title: 'Direct Factory Price', desc: 'No intermediaries — buy straight from the manufacturer at ex-works price' },
                  { icon: '🔬', title: 'European Quality Standards', desc: 'ISO, CE, HACCP certified plants. EU-accredited labs for product testing' },
                  { icon: '🚢', title: 'Flexible Logistics', desc: 'Road, rail, Danube river. 5 EU border crossings. Average delivery 3–7 days to EU' },
                ].map(item => (
                  <div key={item.title} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px' }}>
                    <div style={{ fontSize: 28, marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Markets */}
            <div style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 20 }}>🌍 Export Markets</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
                {COUNTRY_MARKETS.map(c => (
                  <div key={c.name} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, color: '#374151' }}>
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
          <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Big RFQ CTA */}
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)', borderRadius: 20, padding: '28px 24px', textAlign: 'center', color: '#fff', boxShadow: '0 8px 32px rgba(37,99,235,0.35)' }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🤝</div>
              <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 6 }}>Start Trading Today</div>
              <div style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 20 }}>Direct from manufacturer.<br />No middlemen. Best FOB price.</div>
              <Link href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
                style={{ display: 'block', background: '#fff', color: '#1d4ed8', padding: '16px', borderRadius: 12, fontWeight: 900, fontSize: 16, textDecoration: 'none', marginBottom: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                📋 Request Quote (RFQ)
              </Link>
              <div style={{ fontSize: 11, color: '#93c5fd' }}>✓ Free · ✓ No registration · ✓ Reply in 24–48h</div>
            </div>

            {/* Contact info */}
            {(vendor.email || vendor.phone) && (
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: '#0f172a' }}>📞 Contact</div>
                {vendor.email && <a href={`mailto:${vendor.email}`} style={{ display: 'block', fontSize: 13, color: '#2563eb', marginBottom: 6, fontWeight: 600 }}>✉️ {vendor.email}</a>}
                {vendor.phone && <div style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>📱 {vendor.phone}</div>}
              </div>
            )}

            {/* Company details */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '20px' }}>
              <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 14, color: '#0f172a' }}>🏢 Company Details</div>
              {[
                { label: 'Country', value: '🇺🇦 Ukraine' },
                { label: 'City', value: vendor.city ?? '—' },
                { label: 'Industry', value: `${catIcon} ${vendor.category ?? '—'}` },
                { label: 'Founded', value: vendor.yearEstablished ? `${vendor.yearEstablished}` : '—' },
                { label: 'Employees', value: vendor.employeeCount ?? '—' },
                { label: 'EDRPOU', value: vendor.edrpou ?? '—' },
                { label: 'KYC', value: vendor.kycStatus === 'approved' ? '✅ Approved' : '⏳ Pending' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: 8, marginBottom: 8, fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Duty calculator */}
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
    </div>
  );
}

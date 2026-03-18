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
];

interface Product {
  id: string;
  nameEn: string;
  nameUa?: string | null;
  description?: string | null;
  unit: string;
  minOrderQty?: number | null;
  priceUsd?: number | null;
  hsCode?: string | null;
}

interface Cert {
  id: string;
  certType: string;
  certNumber?: string | null;
  expiresAt?: Date | null;
}

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
  isVerified: boolean;
  kycStatus: string;
  edrpou?: string | null;
  region?: string | null;
  translations?: Record<string, { name: string; description: string }> | null;
  products: Product[];
  certifications: Cert[];
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🌾', metals: '⚙️', chemicals: '🧪', textiles: '👗',
  machinery: '🔧', wood: '🌲', electronics: '💡', construction: '🏗️',
  energy: '⚡', healthcare: '💊', automotive: '🚗', packaging: '📦',
};

export default function ExportPage({ vendor }: { vendor: Vendor }) {
  const translations = (vendor.translations as Record<string, { name: string; description: string }>) ?? {};
  const availableLangs = Object.keys(translations);

  const [lang, setLang] = useState('en');
  const [t, setT] = useState<{ name: string; description: string } | null>(null);

  const displayName = t?.name ?? vendor.companyNameEn;
  const displayDesc = t?.description ?? vendor.description ?? '';
  const catIcon = CATEGORY_ICONS[vendor.category ?? ''] ?? '🏭';

  return (
    <div>
      {/* ── HERO ───────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)',
        color: '#fff', padding: '64px 0 48px',
      }}>
        <div className="container">
          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
            <nav style={{ fontSize: 13, opacity: 0.7 }}>
              <Link href="/" style={{ color: '#93c5fd' }}>Home</Link> →{' '}
              <Link href="/manufacturers" style={{ color: '#93c5fd' }}>Manufacturers</Link> →{' '}
              <span>{vendor.companyNameEn}</span>
            </nav>
            <LangSwitcher
              current={lang}
              available={availableLangs}
              translations={translations}
              onSelect={(l, data) => { setLang(l); setT(data); }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center' }}>
            <div>
              {/* Logo + Name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 16,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, fontWeight: 800, color: '#fff', flexShrink: 0,
                }}>
                  {vendor.companyNameEn[0]}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <h1 style={{ fontSize: 32, fontWeight: 900, lineHeight: 1.1 }}>{displayName}</h1>
                    {vendor.isVerified && (
                      <span style={{
                        background: '#16a34a', color: '#fff',
                        padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                      }}>✓ Verified</span>
                    )}
                  </div>
                  <p style={{ color: '#93c5fd', fontSize: 14, marginTop: 4 }}>
                    {catIcon} {vendor.category?.toUpperCase()} · 🇺🇦 {vendor.city ?? 'Ukraine'}
                    {vendor.yearEstablished && ` · Est. ${vendor.yearEstablished}`}
                    {vendor.employeeCount && ` · ${vendor.employeeCount} employees`}
                  </p>
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: 16, lineHeight: 1.7, color: '#cbd5e1', maxWidth: 680, marginBottom: 28 }}>
                {displayDesc}
              </p>

              {/* Trust badges */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { icon: '🇺🇦', text: 'Ukrainian Origin' },
                  { icon: '📜', text: 'EU DCFTA — 0% Import Duty' },
                  { icon: '🌍', text: 'Ships to 50+ Countries' },
                  { icon: '🔐', text: 'KYC Verified' },
                  { icon: '🌐', text: `${availableLangs.length} Languages` },
                ].map(b => (
                  <span key={b.text} style={{
                    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                    color: '#e2e8f0', padding: '6px 14px', borderRadius: 999,
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {b.icon} {b.text}
                  </span>
                ))}
              </div>
            </div>

            {/* RFQ CTA */}
            <div style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 16, padding: '28px 24px', textAlign: 'center', minWidth: 220,
            }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Request a Quote</div>
              <div style={{ fontSize: 12, color: '#93c5fd', marginBottom: 20 }}>Response within 24–48 hours</div>
              <Link
                href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
                style={{
                  display: 'block', background: '#2563eb', color: '#fff',
                  padding: '12px 20px', borderRadius: 10, fontWeight: 700,
                  fontSize: 14, textDecoration: 'none', marginBottom: 10,
                  transition: 'background .15s',
                }}
              >
                📋 Request Quote (RFQ)
              </Link>
              {vendor.website && (
                <a href={vendor.website} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#93c5fd', display: 'block' }}>
                  🌐 Visit Original Website →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── EXPORT ADVANTAGES STRIP ─────────────────────── */}
      <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '16px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#15803d' }}>
            <span>✅ EUR.1 Certificate available</span>
            <span>✅ 0% import duty to EU under DCFTA</span>
            <span>✅ DDP / FOB / CIF shipments</span>
            <span>✅ LC, T/T, CAD payment terms</span>
            <span>✅ Pre-shipment inspection</span>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ────────────────────────────────── */}
      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 32, alignItems: 'start' }}>

          {/* LEFT */}
          <div>
            {/* Products */}
            {vendor.products.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  📦 Products for Export
                </h2>
                <div style={{ display: 'grid', gap: 14 }}>
                  {vendor.products.map(p => (
                    <div key={p.id} style={{
                      border: '1.5px solid #e5e7eb', borderRadius: 12, padding: '20px 24px',
                      background: '#fff', display: 'flex', gap: 20, alignItems: 'center',
                      boxShadow: '0 1px 3px rgba(0,0,0,.05)',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{p.nameEn}</div>
                        {p.description && (
                          <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{p.description}</div>
                        )}
                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                          {p.hsCode && (
                            <span style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                              HS {p.hsCode}
                            </span>
                          )}
                          <span style={{ background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            Unit: {p.unit}
                          </span>
                          {p.minOrderQty && (
                            <span style={{ background: '#fffbeb', color: '#92400e', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                              MOQ: {p.minOrderQty} {p.unit}
                            </span>
                          )}
                          <span style={{ background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                            Price: {p.priceUsd ? `$${p.priceUsd}/${p.unit}` : 'RFQ'}
                          </span>
                        </div>
                      </div>
                      <Link
                        href={`/rfq/new?vendorId=${vendor.id}&productId=${p.id}`}
                        style={{
                          background: '#2563eb', color: '#fff', padding: '10px 18px',
                          borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                          flexShrink: 0, whiteSpace: 'nowrap',
                        }}
                      >
                        Get Quote →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {vendor.certifications.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>🏅 Certifications & Standards</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                  {vendor.certifications.map(c => (
                    <div key={c.id} style={{
                      padding: '16px', borderRadius: 10, border: '1.5px solid #e5e7eb',
                      background: '#fff', textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>🏆</div>
                      <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>{c.certType}</div>
                      {c.certNumber && <div style={{ fontSize: 11, color: '#6b7280' }}>#{c.certNumber}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markets */}
            <div style={{ marginBottom: 40 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>🌍 Available Export Markets</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
                {COUNTRY_MARKETS.map(c => (
                  <div key={c.name} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb',
                    background: '#fff', fontSize: 13, fontWeight: 600,
                  }}>
                    <span style={{ fontSize: 20 }}>{c.flag}</span> {c.name}
                  </div>
                ))}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px 14px', borderRadius: 8, border: '1px dashed #d1d5db',
                  background: '#f9fafb', fontSize: 13, color: '#6b7280', fontWeight: 600,
                }}>
                  +40 more
                </div>
              </div>
            </div>

            {/* Why Ukraine */}
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
              border: '1px solid #bfdbfe', borderRadius: 16, padding: '28px 32px', marginBottom: 40,
            }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>🇺🇦 Why Source from Ukraine?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {[
                  { icon: '📜', title: '0% EU Import Duty', desc: 'EU-Ukraine DCFTA agreement since 2016' },
                  { icon: '🏭', title: 'Industrial Capacity', desc: 'EU-standard manufacturing at competitive prices' },
                  { icon: '🎓', title: 'Skilled Workforce', desc: '350k+ engineers and technical specialists' },
                  { icon: '🚢', title: 'Export Infrastructure', desc: 'Danube river + 5 EU border crossings' },
                ].map(item => (
                  <div key={item.title}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{item.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#374151' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ position: 'sticky', top: 80 }}>
            {/* Big RFQ CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #1e40af, #2563eb)',
              borderRadius: 16, padding: '28px 24px', marginBottom: 20, textAlign: 'center', color: '#fff',
            }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🤝</div>
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Start Trading Today</div>
              <div style={{ fontSize: 13, color: '#bfdbfe', marginBottom: 20 }}>
                Direct from manufacturer.<br />No middlemen. Best FOB price.
              </div>
              <Link
                href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
                style={{
                  display: 'block', background: '#fff', color: '#2563eb',
                  padding: '14px', borderRadius: 10, fontWeight: 800,
                  fontSize: 15, textDecoration: 'none', marginBottom: 12,
                }}
              >
                📋 Request Quote (RFQ)
              </Link>
              <div style={{ fontSize: 11, color: '#93c5fd' }}>
                ✓ Free · ✓ No registration · ✓ Reply in 24-48h
              </div>
            </div>

            {/* Company Info */}
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>🏢 Company Details</h3>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {[
                  { label: 'Country', value: '🇺🇦 Ukraine' },
                  { label: 'City', value: vendor.city ?? '—' },
                  { label: 'Industry', value: `${catIcon} ${vendor.category ?? '—'}` },
                  { label: 'Founded', value: vendor.yearEstablished ? `${vendor.yearEstablished}` : '—' },
                  { label: 'Employees', value: vendor.employeeCount ?? '—' },
                  { label: 'EDRPOU', value: vendor.edrpou ?? '—' },
                  { label: 'KYC Status', value: vendor.kycStatus === 'approved' ? '✅ Approved' : '⏳ Pending' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                    <span style={{ color: '#6b7280' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </dl>
            </div>

            {/* Duty calculator link */}
            <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🧮</div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Calculate Import Duties</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>Check exact duty rates for your country</div>
              <Link href="/calculator" className="btn btn-outline btn-sm btn-block">Open Calculator →</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

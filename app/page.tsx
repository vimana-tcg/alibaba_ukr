import Link from 'next/link';
import { prisma } from '@/lib/db';

const CATEGORIES = [
  { icon: '🌾', name: 'Food & Agriculture', slug: 'food', count: '40+' },
  { icon: '⚙️', name: 'Metals & Steel', slug: 'metals', count: '25+' },
  { icon: '🧪', name: 'Chemicals', slug: 'chemicals', count: '18+' },
  { icon: '👗', name: 'Textiles & Apparel', slug: 'textiles', count: '22+' },
  { icon: '🔧', name: 'Machinery & Equipment', slug: 'machinery', count: '30+' },
  { icon: '🌲', name: 'Wood & Paper', slug: 'wood', count: '15+' },
  { icon: '💡', name: 'Electronics', slug: 'electronics', count: '12+' },
  { icon: '🏗️', name: 'Construction Materials', slug: 'construction', count: '20+' },
];

const HOW_IT_WORKS = [
  { step: '01', icon: '🔍', title: 'Find a Manufacturer', text: 'Browse 120+ KYC-verified Ukrainian producers. Filter by category, certification, or minimum order.' },
  { step: '02', icon: '📋', title: 'Send an RFQ', text: 'Request a quote in 3 clicks. Include incoterms, quantity, delivery country — get factory-direct pricing.' },
  { step: '03', icon: '🤝', title: 'Negotiate & Order', text: 'Chat directly with the supplier. Sign a digital contract with EUR.1 and all export docs included.' },
  { step: '04', icon: '🚢', title: 'Receive Delivery', text: 'Goods shipped DDP, FOB, or CIF to your door. Track in real-time from Kyiv to your warehouse.' },
];

const WHY_UKRAINE = [
  { icon: '📜', stat: '0%', label: 'EU Import Duty', desc: 'DCFTA in force since 2016 — full tariff-free access to all 27 EU member states with EUR.1 certificate.' },
  { icon: '💰', stat: '−40%', label: 'vs Western Europe', desc: 'Factory-direct ex-works pricing. No intermediaries. Pay what manufacturers actually charge.' },
  { icon: '🏭', stat: '120+', label: 'Verified Factories', desc: 'Every supplier KYC-verified. EDRPOU checked. Certifications (ISO, HACCP, CE) validated on-site.' },
  { icon: '🚚', stat: '3–7', label: 'Days to EU', desc: '5 EU border crossings. Road, rail, Danube. Average delivery time from Kyiv to any EU capital.' },
];

async function getStats() {
  try {
    const [vendors, verifiedVendors, products] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isVerified: true } }),
      prisma.product.count(),
    ]);
    return { vendors, verifiedVendors, products };
  } catch {
    return { vendors: 120, verifiedVendors: 87, products: 850 };
  }
}

async function getFeaturedVendors() {
  try {
    return await prisma.vendor.findMany({
      where: { isVerified: true },
      take: 6,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, slug: true, companyNameEn: true,
        category: true, city: true, logoUrl: true,
        products: { take: 1, select: { imageUrl: true } },
        _count: { select: { products: true } },
      },
    });
  } catch {
    return [];
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  food: '🌾', metals: '⚙️', chemicals: '🧪', textiles: '👗',
  machinery: '🔧', wood: '🌲', electronics: '💡', construction: '🏗️',
  energy: '⚡', healthcare: '💊', automotive: '🚗', packaging: '📦',
};

export default async function HomePage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedVendors()]);

  return (
    <>
      {/* ══════════════════════════════════════
          HERO — Full-bleed cinematic
      ══════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #020817 0%, #0a1628 30%, #0f2356 65%, #1a3a8a 100%)',
        color: '#fff', overflow: 'hidden', padding: '100px 0 80px',
      }}>
        {/* Dot grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />
        {/* Blue radial glow left */}
        <div style={{ position: 'absolute', top: '30%', left: '10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(37,99,235,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        {/* Teal glow right */}
        <div style={{ position: 'absolute', top: '20%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(16,185,129,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Pill badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37,99,235,0.25)', border: '1px solid rgba(99,160,255,0.3)', borderRadius: 999, padding: '6px 18px', fontSize: 13, fontWeight: 700, marginBottom: 28, backdropFilter: 'blur(8px)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
            🇺🇦 Ukrainian B2B Export Marketplace · DCFTA 0% EU Duty
          </div>

          <h1 style={{ fontSize: 'clamp(36px, 5.5vw, 68px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 22, letterSpacing: '-1.5px', maxWidth: 860, margin: '0 auto 22px' }}>
            Source Directly from<br />
            <span style={{ background: 'linear-gradient(90deg, #60a5fa, #34d399, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 100%' }}>
              Ukrainian Manufacturers
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: '#94a3b8', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.65 }}>
            KYC-verified factories. 0% EU import duty. Factory-direct pricing.
            From RFQ to delivery — the complete B2B export platform.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/manufacturers"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '16px 32px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px rgba(37,99,235,0.45)' }}>
              Browse Manufacturers →
            </Link>
            <Link href="/landing-lab"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', padding: '16px 32px', borderRadius: 14, fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px rgba(249,115,22,0.35)' }}>
              🎨 Launch Landing Lab
            </Link>
            <Link href="/vendor/import"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0', padding: '16px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}>
              🤖 Add Your Company Free
            </Link>
          </div>

          {/* Live stats */}
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '28px 16px', backdropFilter: 'blur(12px)', maxWidth: 720, margin: '0 auto' }}>
            {[
              { value: `${stats.vendors}+`, label: 'Verified Manufacturers', color: '#60a5fa' },
              { value: `${stats.products}+`, label: 'Products Listed', color: '#34d399' },
              { value: '50', label: 'Languages', color: '#f472b6' },
              { value: '0%', label: 'EU Duty (DCFTA)', color: '#fbbf24' },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: '1 1 140px', textAlign: 'center', padding: '8px 20px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                <div style={{ fontSize: 34, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-1px' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          WHY UKRAINE — 4 stat cards
      ══════════════════════════════════════ */}
      <section style={{ padding: '72px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }}>Why Ukraine</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 900, color: '#0f172a' }}>
              Europe&apos;s most competitive B2B source
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {WHY_UKRAINE.map(w => (
              <div key={w.stat} style={{ background: 'linear-gradient(145deg, #f8fafc, #fff)', border: '1.5px solid #e2e8f0', borderRadius: 20, padding: '32px 28px', position: 'relative', overflow: 'hidden', transition: 'box-shadow .2s, transform .2s' }}
                onMouseEnter={undefined}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ fontSize: 28, marginBottom: 12 }}>{w.icon}</div>
                <div style={{ fontSize: 40, fontWeight: 900, color: '#1d4ed8', lineHeight: 1, marginBottom: 4, letterSpacing: '-1px' }}>{w.stat}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 8 }}>{w.label}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURED MANUFACTURERS
      ══════════════════════════════════════ */}
      {featured.length > 0 && (
        <section style={{ padding: '72px 0', background: '#f8fafc' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }}>Featured</p>
                <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, color: '#0f172a' }}>Top Verified Manufacturers</h2>
              </div>
              <Link href="/manufacturers" style={{ color: '#2563eb', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                View all {stats.vendors}+ manufacturers →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {featured.map(v => {
                const coverImg = v.products[0]?.imageUrl;
                const catIcon = CATEGORY_ICONS[v.category ?? ''] ?? '🏭';
                return (
                  <Link key={v.id} href={`/manufacturer/${v.slug}`}
                    style={{ textDecoration: 'none', display: 'block', borderRadius: 20, overflow: 'hidden', background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,.06)', transition: 'all .2s' }}
                    onMouseEnter={undefined}>
                    {/* Cover photo or gradient */}
                    <div style={{ height: 160, background: coverImg ? `url(${coverImg}) center/cover` : 'linear-gradient(135deg, #1e3a8a, #2563eb)', position: 'relative' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)' }} />
                      {/* Logo */}
                      {v.logoUrl && (
                        <div style={{ position: 'absolute', bottom: -20, left: 20, width: 52, height: 52, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', overflow: 'hidden', border: '2px solid #fff' }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={v.logoUrl} alt={v.companyNameEn} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(22,163,74,0.9)', color: '#fff', borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                        ✓ Verified
                      </div>
                    </div>
                    <div style={{ padding: `${v.logoUrl ? '28px' : '20px'} 20px 20px` }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 6 }}>{v.companyNameEn}</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          {catIcon} {v.category ?? 'Manufacturing'}
                        </span>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          🇺🇦 {v.city ?? 'Ukraine'}
                        </span>
                        <span style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          {v._count.products} products
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div style={{ flex: 1, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '10px', borderRadius: 10, fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
                          View Profile →
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════
          CATEGORIES GRID
      ══════════════════════════════════════ */}
      <section style={{ padding: '72px 0', background: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#2563eb', textTransform: 'uppercase', marginBottom: 8 }}>Product Categories</p>
            <h2 style={{ fontSize: 'clamp(22px, 3vw, 34px)', fontWeight: 900, color: '#0f172a' }}>Browse by Industry</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {CATEGORIES.map(c => (
              <Link key={c.slug} href={`/manufacturers?category=${c.slug}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  padding: '28px 16px', background: '#f8fafc', borderRadius: 18,
                  border: '1.5px solid #e2e8f0', textDecoration: 'none', color: 'inherit',
                  fontWeight: 700, fontSize: 14, transition: 'all .18s',
                }}
                onMouseEnter={undefined}>
                <span style={{ fontSize: 36 }}>{c.icon}</span>
                <span style={{ color: '#0f172a', textAlign: 'center' }}>{c.name}</span>
                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>{c.count} suppliers</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS — 4 steps
      ══════════════════════════════════════ */}
      <section style={{ padding: '72px 0', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#fff' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#60a5fa', textTransform: 'uppercase', marginBottom: 8 }}>Process</p>
            <h2 style={{ fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 900 }}>How It Works</h2>
            <p style={{ color: '#94a3b8', fontSize: 16, marginTop: 10 }}>From first contact to delivery — fully digital, fully transparent</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 44, left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(99,160,255,0.3), transparent)', pointerEvents: 'none', display: 'none' }} />
            {HOW_IT_WORKS.map((h, i) => (
              <div key={h.step} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '32px 24px', textAlign: 'center', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, right: 16, fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>{h.step}</div>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(37,99,235,0.3)', border: '1px solid rgba(99,160,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 20px' }}>
                  {h.icon}
                </div>
                <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 10 }}>{h.title}</div>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65 }}>{h.text}</div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'rgba(99,160,255,0.4)', pointerEvents: 'none', display: 'none' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TRUST STRIP
      ══════════════════════════════════════ */}
      <section style={{ background: '#15803d', padding: '20px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
            {['✅ DCFTA · 0% EU Import Duty', '✅ KYC & EDRPOU Verified', '✅ ISO / HACCP / CE Certified', '✅ EUR.1 Included', '✅ DDP · FOB · CIF · EXW'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          AI IMPORT CTA BANNER
      ══════════════════════════════════════ */}
      <section style={{ padding: '72px 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', borderRadius: 28, padding: '56px 48px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 40, alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
            <div style={{ position: 'absolute', top: -60, right: 200, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(59,130,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ color: '#fff', position: 'relative' }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#60a5fa', textTransform: 'uppercase', marginBottom: 12 }}>For Manufacturers</p>
              <h2 style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 900, marginBottom: 14 }}>
                🤖 Add Your Company in 60 Seconds
              </h2>
              <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: 1.65, maxWidth: 560 }}>
                Our AI imports your website, extracts all products, translates your profile to 50 languages,
                and creates SEO pages for every country — fully automatically. No forms, no manual work.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0, position: 'relative' }}>
              <Link href="/vendor/import"
                style={{ display: 'block', background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '18px 32px', borderRadius: 14, fontWeight: 900, fontSize: 16, textDecoration: 'none', textAlign: 'center', boxShadow: '0 8px 32px rgba(37,99,235,0.45)', whiteSpace: 'nowrap' }}>
                🚀 Import My Company Free →
              </Link>
              <div style={{ fontSize: 12, color: '#475569', textAlign: 'center' }}>✓ Free · ✓ 2 min setup · ✓ 50 languages</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#fff', textAlign: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: 620, margin: '0 auto' }}>
            <div style={{ fontSize: 48, marginBottom: 20 }}>🌍</div>
            <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, color: '#0f172a', marginBottom: 16, lineHeight: 1.1 }}>
              Ready to source from Ukraine?
            </h2>
            <p style={{ color: '#64748b', fontSize: 17, marginBottom: 36, lineHeight: 1.65 }}>
              Join 500+ international buyers already sourcing from Ukrainian factories.
              Factory-direct. Zero EU duty. Full transparency.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/manufacturers"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '16px 36px', borderRadius: 14, fontWeight: 900, fontSize: 16, textDecoration: 'none', boxShadow: '0 8px 32px rgba(37,99,235,0.35)' }}>
                Browse Manufacturers →
              </Link>
              <Link href="/calculator"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f1f5f9', color: '#374151', padding: '16px 36px', borderRadius: 14, fontWeight: 800, fontSize: 15, textDecoration: 'none', border: '1.5px solid #e2e8f0' }}>
                🧮 Duty Calculator
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

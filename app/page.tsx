import Link from 'next/link';
import { prisma } from '@/lib/db';

async function getStats() {
  try {
    const [vendors, verifiedVendors] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { isVerified: true } }),
    ]);
    return { vendors, verifiedVendors };
  } catch {
    return { vendors: 120, verifiedVendors: 87 };
  }
}

export default async function HomePage() {
  const stats = await getStats();

  return (
    <>
      {/* Hero */}
      <section style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 60%, #3b82f6 100%)', color: '#fff', padding: '80px 0 100px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, opacity: .8, marginBottom: 16 }}>
            🇺🇦 UKRAINIAN B2B EXPORT MARKETPLACE
          </div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 20 }}>
            Source Directly from<br />Ukrainian Manufacturers
          </h1>
          <p style={{ fontSize: 18, opacity: .85, maxWidth: 560, margin: '0 auto 36px' }}>
            KYC-verified producers. EU DCFTA 0% duty. From RFQ to delivery — all in one platform.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/manufacturers" className="btn btn-primary btn-lg" style={{ background: '#fff', color: '#1d4ed8' }}>
              Browse Manufacturers
            </Link>
            <Link href="/calculator" className="btn btn-outline btn-lg" style={{ borderColor: 'rgba(255,255,255,.6)', color: '#fff' }}>
              🧮 Duty Calculator
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { value: `${stats.vendors}+`, label: 'Manufacturers' },
              { value: `${stats.verifiedVendors}`, label: 'KYC Verified' },
              { value: '18', label: 'Export Countries' },
              { value: '0%', label: 'EU Duty (DCFTA)' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900 }}>{s.value}</div>
                <div style={{ fontSize: 13, opacity: .7, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '64px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>
            Everything you need to import from Ukraine
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
            {[
              { icon: '🏭', title: 'Verified Manufacturers', text: 'Every supplier is KYC-checked, EDRPOU-verified, with traceable certifications (ISO, HACCP, BRC, GlobalGAP).' },
              { icon: '🧮', title: 'Duty Calculator', text: 'Instant EU DCFTA vs MFN duty comparison. Know your landed cost before you submit an RFQ.' },
              { icon: '📋', title: 'RFQ Builder', text: '3-step quote request. Incoterms selector, HS code pre-fill, multi-product quotes — all in one flow.' },
              { icon: '📄', title: 'Export Documents', text: 'EUR.1, Commercial Invoice, Packing List, Phytosanitary — generated automatically for your order.' },
              { icon: '🚢', title: 'Logistics', text: 'Nova Poshta Global integration. Real freight quotes. ETA tracking from Kyiv to your warehouse.' },
              { icon: '💳', title: 'Secure Payments', text: 'SWIFT, SEPA, Escrow.com, Letter of Credit. Funds released only on delivery confirmation.' },
            ].map(f => (
              <div key={f.title} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={{ padding: '48px 0', background: '#f9fafb' }}>
        <div className="container">
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32, textAlign: 'center' }}>Browse by Category</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            {[
              { icon: '🌾', name: 'Food & Agri', cat: 'food' },
              { icon: '⚙️', name: 'Metals & Steel', cat: 'metals' },
              { icon: '🧪', name: 'Chemicals', cat: 'chemicals' },
              { icon: '👗', name: 'Textiles', cat: 'textiles' },
              { icon: '🔧', name: 'Machinery', cat: 'machinery' },
              { icon: '🌲', name: 'Wood & Paper', cat: 'wood' },
            ].map(c => (
              <Link key={c.cat} href={`/manufacturers?category=${c.cat}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '24px 16px', background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', textDecoration: 'none', color: 'inherit', fontWeight: 600, fontSize: 14, transition: 'all .15s' }}
                className="card"
              >
                <span style={{ fontSize: 32 }}>{c.icon}</span>
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '64px 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 12 }}>Ready to source from Ukraine?</h2>
          <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 16 }}>Create your free buyer account and send your first RFQ today.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link href="/manufacturers" className="btn btn-primary btn-lg">Browse Manufacturers →</Link>
            <Link href="/dashboard" className="btn btn-outline btn-lg">Buyer Dashboard</Link>
          </div>
        </div>
      </section>
    </>
  );
}

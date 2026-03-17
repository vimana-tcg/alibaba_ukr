import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db';

async function getVendor(slug: string) {
  try {
    return await prisma.vendor.findUnique({
      where: { slug },
      include: {
        certifications: true,
        products: true,
      },
    });
  } catch {
    return null;
  }
}

export default async function VendorProfilePage({ params }: { params: { slug: string } }) {
  const vendor = await getVendor(params.slug);
  if (!vendor) notFound();

  return (
    <div className="page">
      <div className="container">

        {/* Hero */}
        <div className="card" style={{ marginBottom: 24, padding: '32px' }}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, borderRadius: 12, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, flexShrink: 0 }}>
              {vendor.companyNameEn[0]}
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800 }}>{vendor.companyNameEn}</h1>
                {vendor.isVerified && (
                  <span className="badge badge-green">✓ Verified</span>
                )}
              </div>
              <p style={{ color: '#6b7280', marginBottom: 12 }}>{vendor.companyNameUa}</p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                <span>🇺🇦 {vendor.city}, Ukraine</span>
                {vendor.yearEstablished && <span>📅 Est. {vendor.yearEstablished}</span>}
                {vendor.employeeCount && <span>👥 {vendor.employeeCount} employees</span>}
                {vendor.website && <a href={vendor.website} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>🌐 Website</a>}
              </div>
            </div>
            <Link
              href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
              className="btn btn-primary"
            >
              📋 Request Quote (RFQ)
            </Link>
          </div>
          {vendor.description && (
            <p style={{ marginTop: 20, color: '#374151', lineHeight: 1.7, borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
              {vendor.description}
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* Left: Products + Certs */}
          <div>
            {/* Products */}
            {vendor.products.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📦 Products</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>HS Code</th>
                      <th>Unit</th>
                      <th>Min. Order</th>
                      <th>Price (USD)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendor.products.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{p.nameEn}</div>
                          {p.nameUa && <div style={{ fontSize: 12, color: '#6b7280' }}>{p.nameUa}</div>}
                        </td>
                        <td><span className="cert-chip">{p.hsCode ?? '—'}</span></td>
                        <td>{p.unit}</td>
                        <td>{p.minOrderQty ? `${p.minOrderQty} ${p.unit}` : '—'}</td>
                        <td>{p.priceUsd ? `$${p.priceUsd}` : 'RFQ'}</td>
                        <td>
                          <Link
                            href={`/rfq/new?vendorId=${vendor.id}&productId=${p.id}`}
                            className="btn btn-outline btn-sm"
                          >
                            RFQ
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Certifications */}
            {vendor.certifications.length > 0 && (
              <div className="card">
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🏅 Certifications</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {vendor.certifications.map(c => (
                    <div key={c.id} style={{ padding: '14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#f9fafb' }}>
                      <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: 4 }}>{c.certType}</div>
                      {c.certNumber && <div style={{ fontSize: 12, color: '#6b7280' }}>#{c.certNumber}</div>}
                      {c.expiresAt && (
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
                          Expires: {new Date(c.expiresAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Quick Info + RFQ CTA */}
          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>Company Info</h3>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {[
                  { label: 'Country', value: '🇺🇦 Ukraine' },
                  { label: 'Region', value: vendor.region ?? '—' },
                  { label: 'Category', value: vendor.category ?? '—' },
                  { label: 'EDRPOU', value: vendor.edrpou ?? '—' },
                  { label: 'KYC Status', value: vendor.kycStatus },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                    <span style={{ color: '#6b7280' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </dl>
            </div>

            <div className="card" style={{ background: '#eff6ff', border: '1px solid #bfdbfe', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Ready to buy?</h3>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Send a quote request. Response in 24–48h.</p>
              <Link
                href={`/rfq/new?vendorId=${vendor.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}`}
                className="btn btn-primary btn-block"
              >
                Send RFQ →
              </Link>
              <div style={{ marginTop: 12 }}>
                <Link href="/calculator" style={{ fontSize: 13, color: '#2563eb' }}>🧮 Calculate import duties first</Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

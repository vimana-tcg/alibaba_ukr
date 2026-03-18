import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

async function getProduct(vendorSlug: string, productId: string) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { slug: vendorSlug },
      include: {
        products: {
          where: { OR: [{ id: productId }, { slug: productId }] },
          take: 1,
        },
      },
    });
    if (!vendor || !vendor.products[0]) return null;
    return { vendor, product: vendor.products[0] };
  } catch { return null; }
}

async function getRelated(vendorId: string, excludeId: string) {
  try {
    return prisma.product.findMany({
      where: { vendorId, NOT: { id: excludeId } },
      take: 4,
    });
  } catch { return []; }
}

export async function generateMetadata({ params }: { params: { slug: string; productId: string } }): Promise<Metadata> {
  const data = await getProduct(params.slug, params.productId);
  if (!data) return {};
  const { vendor, product } = data;
  const title = `${product.nameEn} — ${vendor.companyNameEn} | Ukrainian Manufacturer`;
  const desc = product.description ?? `Buy ${product.nameEn} directly from ${vendor.companyNameEn}, verified Ukrainian manufacturer. ${product.hsCode ? `HS code ${product.hsCode}.` : ''} 0% EU import duty. Request quote today.`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: product.imageUrl ? [{ url: product.imageUrl, alt: product.nameEn }] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string; productId: string } }) {
  const data = await getProduct(params.slug, params.productId);
  if (!data) notFound();
  const { vendor, product } = data;
  const related = await getRelated(vendor.id, product.id);

  const richParagraphs = product.richDescription?.split('\n').filter(Boolean) ?? [];

  return (
    <div>
      {/* JSON-LD Product schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.nameEn,
        description: product.description,
        image: product.imageUrl,
        sku: product.hsCode,
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: product.priceUsd ?? undefined,
          priceSpecification: !product.priceUsd ? { '@type': 'UnitPriceSpecification', description: 'Price on request' } : undefined,
          availability: 'https://schema.org/InStock',
          seller: { '@type': 'Organization', name: vendor.companyNameEn },
        },
        manufacturer: {
          '@type': 'Organization',
          name: vendor.companyNameEn,
          address: { '@type': 'PostalAddress', addressCountry: 'UA', addressLocality: vendor.city },
        },
      })}} />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', padding: '48px 0 40px' }}>
        <div className="container">
          <nav style={{ fontSize: 13, opacity: 0.6, marginBottom: 24 }}>
            <Link href="/" style={{ color: '#93c5fd' }}>Home</Link> →{' '}
            <Link href="/manufacturers" style={{ color: '#93c5fd' }}>Manufacturers</Link> →{' '}
            <Link href={`/manufacturer/${vendor.slug}`} style={{ color: '#93c5fd' }}>{vendor.companyNameEn}</Link> →{' '}
            <span>{product.nameEn}</span>
          </nav>
          <div style={{ display: 'grid', gridTemplateColumns: product.imageUrl ? '1fr 360px' : '1fr', gap: 40, alignItems: 'start' }}>
            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {product.hsCode && (
                  <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: '#e2e8f0', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                    HS {product.hsCode}
                  </span>
                )}
                <span style={{ background: '#16a34a', color: '#fff', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                  🇺🇦 Made in Ukraine
                </span>
                <span style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  0% EU Import Duty
                </span>
              </div>
              <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15, marginBottom: 12 }}>{product.nameEn}</h1>
              <p style={{ color: '#93c5fd', fontSize: 15, marginBottom: 20 }}>
                by{' '}
                <Link href={`/manufacturer/${vendor.slug}`} style={{ color: '#60a5fa', fontWeight: 700 }}>
                  {vendor.companyNameEn}
                </Link>
                {vendor.city && ` · 🇺🇦 ${vendor.city}, Ukraine`}
                {vendor.yearEstablished && ` · Est. ${vendor.yearEstablished}`}
              </p>
              {product.description && (
                <p style={{ fontSize: 16, lineHeight: 1.7, color: '#cbd5e1', maxWidth: 600 }}>{product.description}</p>
              )}
            </div>
            {product.imageUrl && (
              <div style={{ borderRadius: 16, overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl} alt={product.nameEn} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export advantages strip */}
      <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '14px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#15803d' }}>
            <span>✅ EUR.1 Certificate · 0% duty to EU</span>
            <span>✅ DDP / FOB / CIF available</span>
            <span>✅ LC · T/T · CAD payment</span>
            <span>✅ Pre-shipment quality inspection</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 40, alignItems: 'start' }}>

          {/* Left */}
          <div>
            {/* Specs */}
            <div className="card" style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>📋 Product Specifications</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {[
                  { label: 'Product', value: product.nameEn },
                  { label: 'HS Code', value: product.hsCode ?? '—' },
                  { label: 'Unit of measure', value: product.unit },
                  { label: 'Min. Order Qty', value: product.minOrderQty ? `${product.minOrderQty} ${product.unit}` : 'On request' },
                  { label: 'Price', value: product.priceUsd ? `$${product.priceUsd}/${product.unit}` : 'RFQ (best FOB price)' },
                  { label: 'Origin', value: '🇺🇦 Ukraine' },
                  { label: 'Import duty EU', value: '0% (DCFTA)' },
                  { label: 'Incoterms', value: 'EXW / FOB / CIF / DDP' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>{label}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rich description */}
            {richParagraphs.length > 0 && (
              <div className="card" style={{ marginBottom: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>📄 Product Description</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {richParagraphs.map((p, i) => (
                    <p key={i} style={{ fontSize: 15, lineHeight: 1.75, color: '#374151' }}>{p}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Why Ukraine */}
            <div style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 16, padding: '28px 32px', marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>🇺🇦 Why source {product.nameEn} from Ukraine?</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                {[
                  { icon: '📜', title: '0% EU Import Duty', desc: 'DCFTA agreement — zero tariffs to all EU countries' },
                  { icon: '🏭', title: 'Direct from Manufacturer', desc: 'No middlemen — factory price with full traceability' },
                  { icon: '🔬', title: 'EU-Standard Quality', desc: 'ISO certified production, pre-shipment inspection available' },
                  { icon: '🚢', title: 'Flexible Logistics', desc: 'Road, rail, Danube river — delivery to any EU port' },
                ].map(item => (
                  <div key={item.title}>
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                    <div style={{ fontWeight: 700, fontSize: 13, marginTop: 6, marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: '#374151' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Related products */}
            {related.length > 0 && (
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>More from {vendor.companyNameEn}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                  {related.map(p => (
                    <Link key={p.id} href={`/manufacturer/${vendor.slug}/product/${p.slug ?? p.id}`}
                      style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '14px', background: '#fff', textDecoration: 'none', display: 'block', transition: 'box-shadow .15s' }}>
                      {p.imageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.nameEn} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6, marginBottom: 8 }} />
                      )}
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#111827', marginBottom: 4 }}>{p.nameEn}</div>
                      {p.hsCode && <div style={{ fontSize: 11, color: '#6b7280' }}>HS {p.hsCode}</div>}
                      <div style={{ marginTop: 8, color: '#2563eb', fontSize: 12, fontWeight: 600 }}>Get Quote →</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right — sticky CTA */}
          <div style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)', borderRadius: 16, padding: '28px 24px', marginBottom: 20, textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📋</div>
              <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>Request Best Price</div>
              <div style={{ fontSize: 12, color: '#bfdbfe', marginBottom: 6 }}>{product.nameEn}</div>
              <div style={{ fontSize: 12, color: '#93c5fd', marginBottom: 20 }}>Direct from factory · Response 24–48h</div>
              <Link
                href={`/rfq/new?vendorId=${vendor.id}&productId=${product.id}&vendorName=${encodeURIComponent(vendor.companyNameEn)}&productName=${encodeURIComponent(product.nameEn)}`}
                style={{ display: 'block', background: '#fff', color: '#2563eb', padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: 15, textDecoration: 'none', marginBottom: 10 }}
              >
                📋 Request Quote (RFQ)
              </Link>
              <div style={{ fontSize: 11, color: '#93c5fd' }}>✓ Free · ✓ No registration needed</div>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Manufacturer</h3>
              <Link href={`/manufacturer/${vendor.slug}`} style={{ display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
                  {vendor.companyNameEn[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{vendor.companyNameEn}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>🇺🇦 {vendor.city ?? 'Ukraine'}</div>
                </div>
              </Link>
            </div>

            <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a', textAlign: 'center' }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>🧮</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Calculate Import Duty</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
                {product.hsCode ? `HS ${product.hsCode} — likely 0% to EU` : 'Check exact rates for your country'}
              </div>
              <Link href={`/calculator${product.hsCode ? `?hs=${product.hsCode}` : ''}`} className="btn btn-outline btn-sm btn-block">
                Open Calculator →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

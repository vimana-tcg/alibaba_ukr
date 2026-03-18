import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import { B2B_CATEGORIES } from '@/lib/categories';

export async function generateStaticParams() {
  return B2B_CATEGORIES.map(c => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const cat = B2B_CATEGORIES.find(c => c.slug === params.slug);
  if (!cat) return {};
  return {
    title: `${cat.nameEn} from Ukraine — Corevia Flow B2B`,
    description: cat.metaDesc,
    openGraph: {
      title: `Buy ${cat.nameEn} from Ukrainian Manufacturers`,
      description: cat.metaDesc ?? '',
    },
  };
}

async function getVendorsByCategory(categorySlug: string) {
  const cat = B2B_CATEGORIES.find(c => c.slug === categorySlug);
  if (!cat) return [];
  // Map slug to category field values
  const categoryMap: Record<string, string[]> = {
    'agricultural-products': ['food'], 'sunflower-oil': ['food'], 'grain-cereals': ['food'],
    'animal-feed': ['food'], 'dairy-eggs': ['food'], 'honey-beekeeping': ['food'],
    'frozen-foods': ['food'], 'seeds-plants': ['food'],
    'metals-steel': ['metals'], 'mineral-products': ['metals'],
    'chemicals-fertilizers': ['chemicals'], 'rubber-plastics': ['chemicals'],
    'textiles-apparel': ['textiles'], 'cosmetics-personal-care': ['textiles'],
    'machinery-equipment': ['machinery'], 'automotive-parts': ['machinery'],
    'renewable-energy': ['machinery'], 'electronics': ['machinery'],
    'wood-paper': ['wood'], 'furniture-interior': ['wood'],
  };
  const cats = categoryMap[categorySlug] ?? [categorySlug.split('-')[0]];
  try {
    return prisma.vendor.findMany({
      where: {
        OR: [
          { categorySlug },
          { category: { in: cats } },
        ],
      },
      include: { certifications: true },
      take: 24,
    });
  } catch { return []; }
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const cat = B2B_CATEGORIES.find(c => c.slug === params.slug);
  if (!cat) notFound();

  const vendors = await getVendorsByCategory(params.slug);

  // Related categories (same area)
  const related = B2B_CATEGORIES.filter(c => c.slug !== params.slug).slice(0, 6);

  return (
    <div className="page">
      <div className="container">

        {/* Breadcrumb */}
        <nav style={{ fontSize: 13, color: '#6b7280', marginBottom: 24 }}>
          <Link href="/" style={{ color: '#2563eb' }}>Home</Link> →{' '}
          <Link href="/manufacturers" style={{ color: '#2563eb' }}>Manufacturers</Link> →{' '}
          <span>{cat.nameEn}</span>
        </nav>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12 }}>
            {cat.icon} {cat.nameEn} from Ukraine
          </h1>
          <p style={{ fontSize: 17, color: '#374151', maxWidth: 720, lineHeight: 1.7 }}>
            {cat.metaDesc}
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <span className="badge badge-green">🇺🇦 Ukrainian Origin</span>
            <span className="badge badge-blue">EU DCFTA — 0% duty</span>
            <span className="badge badge-gold">KYC Verified Suppliers</span>
          </div>
        </div>

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            'name': `${cat.nameEn} Manufacturers from Ukraine`,
            'description': cat.metaDesc,
            'numberOfItems': vendors.length,
          })}}
        />

        {/* Vendors grid */}
        {vendors.length > 0 ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
              {vendors.length} Verified Suppliers
            </h2>
            <div className="vendors-grid" style={{ marginBottom: 48 }}>
              {vendors.map(vendor => (
                <Link key={vendor.id} href={`/manufacturer/${vendor.slug}`} className="vendor-card">
                  <div className="vendor-card__header">
                    <div className="vendor-card__logo-placeholder">{vendor.companyNameEn[0]}</div>
                    {vendor.isVerified && <span className="verified-badge">✓</span>}
                  </div>
                  <div className="vendor-card__body">
                    <h3 className="vendor-card__name">{vendor.companyNameEn}</h3>
                    <p className="vendor-card__name-ua">{vendor.companyNameUa}</p>
                    <div className="vendor-card__meta">
                      <span>🇺🇦 Ukraine</span>
                      {vendor.yearEstablished && <span>Est. {vendor.yearEstablished}</span>}
                    </div>
                    <div className="vendor-card__certs">
                      {vendor.certifications.slice(0, 4).map(c => (
                        <span key={c.id} className="cert-chip">{c.certType}</span>
                      ))}
                    </div>
                  </div>
                  <div className="vendor-card__footer">
                    <span className="vendor-card__cta">View Profile →</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px 24px', marginBottom: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{cat.icon}</div>
            <h3 style={{ marginBottom: 8 }}>Suppliers coming soon</h3>
            <p style={{ color: '#6b7280', marginBottom: 20 }}>Be the first {cat.nameEn} supplier on Corevia Flow.</p>
            <Link href="/vendor/import" className="btn btn-primary">Import Your Website →</Link>
          </div>
        )}

        {/* CTA */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #bfdbfe', padding: '32px', textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Are you a {cat.nameEn} manufacturer?
          </h2>
          <p style={{ color: '#374151', marginBottom: 20 }}>
            Import your website in 30 seconds. AI translates your profile to 50 languages automatically.
          </p>
          <Link href="/vendor/import" className="btn btn-primary btn-lg">🤖 Import My Website Free →</Link>
        </div>

        {/* Related categories */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Browse Other Categories</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          {related.map(r => (
            <Link key={r.slug} href={`/category/${r.slug}`}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', color: '#374151', transition: 'all .15s' }}
            >
              <span>{r.icon}</span> {r.nameEn}
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

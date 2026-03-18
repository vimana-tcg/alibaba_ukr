import Link from 'next/link';
import { prisma } from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ukrainian Manufacturers — B2B Export Directory',
  description: 'Browse 120+ KYC-verified Ukrainian manufacturers. Filter by category, certification. 0% EU import duty via DCFTA. Factory-direct pricing.',
};

const CATEGORY_ICONS: Record<string, string> = {
  food: '🌾', metals: '⚙️', chemicals: '🧪', textiles: '👗',
  machinery: '🔧', wood: '🌲', electronics: '💡', construction: '🏗️',
  energy: '⚡', healthcare: '💊', automotive: '🚗', packaging: '📦',
};

const CATEGORIES = [
  { slug: 'food', label: '🌾 Food & Agri' },
  { slug: 'metals', label: '⚙️ Metals' },
  { slug: 'chemicals', label: '🧪 Chemicals' },
  { slug: 'textiles', label: '👗 Textiles' },
  { slug: 'machinery', label: '🔧 Machinery' },
  { slug: 'wood', label: '🌲 Wood' },
  { slug: 'electronics', label: '💡 Electronics' },
  { slug: 'construction', label: '🏗️ Construction' },
];

interface SearchParams { category?: string; cert_type?: string; sort?: string; page?: string; q?: string; }

async function getVendors(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.category) where.category = params.category;
  if (params.cert_type) where.certifications = { some: { certType: params.cert_type } };
  if (params.q) where.companyNameEn = { contains: params.q, mode: 'insensitive' };

  let orderBy: Record<string, unknown> = { isVerified: 'desc' };
  if (params.sort === 'established') orderBy = { yearEstablished: 'asc' };
  if (params.sort === 'name') orderBy = { companyNameEn: 'asc' };

  try {
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        select: {
          id: true, slug: true, companyNameEn: true, companyNameUa: true,
          category: true, city: true, logoUrl: true,
          yearEstablished: true, employeeCount: true,
          isVerified: true, kycStatus: true,
          certifications: { select: { id: true, certType: true }, take: 5 },
          products: { select: { imageUrl: true }, take: 1 },
          _count: { select: { products: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.vendor.count({ where }),
    ]);
    return { vendors, total, totalPages: Math.ceil(total / limit), currentPage: page };
  } catch {
    return { vendors: [], total: 0, totalPages: 0, currentPage: 1 };
  }
}

export default async function ManufacturersPage({ searchParams }: { searchParams: SearchParams }) {
  const { vendors, total, totalPages, currentPage } = await getVendors(searchParams);
  const activeCategory = searchParams.category ?? '';

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a8a)', color: '#fff', padding: '52px 0 44px' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 4, color: '#60a5fa', textTransform: 'uppercase', marginBottom: 10 }}>
                🇺🇦 Export Directory
              </p>
              <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 10 }}>
                Ukrainian Manufacturers
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 16, maxWidth: 520 }}>
                KYC-verified factories. 0% EU import duty. Factory-direct pricing.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { num: `${total}+`, label: 'Verified Suppliers' },
                { num: '50', label: 'Languages' },
                { num: '0%', label: 'EU Duty' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#60a5fa', lineHeight: 1 }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 0', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: 8, flexWrap: 'nowrap', minWidth: 'max-content' }}>
          <Link href="/manufacturers"
            style={{ padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, background: !activeCategory ? '#1d4ed8' : '#f1f5f9', color: !activeCategory ? '#fff' : '#374151', border: '1px solid transparent' }}>
            All Industries
          </Link>
          {CATEGORIES.map(c => (
            <Link key={c.slug} href={`/manufacturers?category=${c.slug}`}
              style={{ padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, background: activeCategory === c.slug ? '#1d4ed8' : '#f1f5f9', color: activeCategory === c.slug ? '#fff' : '#374151', border: '1px solid transparent' }}>
              {c.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="container" style={{ padding: '32px 24px 80px' }}>

        {/* Filters bar */}
        <form method="get" style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: 28, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '18px 20px' }}>
          {activeCategory && <input type="hidden" name="category" value={activeCategory} />}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, letterSpacing: 0.5 }}>SEARCH</label>
            <input name="q" defaultValue={searchParams.q ?? ''} placeholder="Company name…"
              style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, letterSpacing: 0.5 }}>CERTIFICATION</label>
            <select name="cert_type" defaultValue={searchParams.cert_type ?? ''}
              style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
              <option value="">Any Certification</option>
              <option value="ISO9001">ISO 9001</option>
              <option value="ISO14001">ISO 14001</option>
              <option value="HACCP">HACCP</option>
              <option value="BRC">BRC / BRCGS</option>
              <option value="GlobalGAP">GlobalG.A.P.</option>
              <option value="CE">CE Marking</option>
              <option value="Organic">Organic</option>
            </select>
          </div>
          <div style={{ flex: '1 1 140px' }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4, letterSpacing: 0.5 }}>SORT BY</label>
            <select name="sort" defaultValue={searchParams.sort ?? ''}
              style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, background: '#fff' }}>
              <option value="">Verified first</option>
              <option value="name">Name A–Z</option>
              <option value="established">Oldest first</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit"
              style={{ padding: '10px 22px', borderRadius: 10, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer' }}>
              Search
            </button>
            <Link href="/manufacturers"
              style={{ padding: '10px 16px', borderRadius: 10, background: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
              Clear
            </Link>
          </div>
        </form>

        {/* Results count */}
        <div style={{ marginBottom: 20, fontSize: 14, color: '#64748b', fontWeight: 600 }}>
          {total > 0 ? (
            <><span style={{ color: '#0f172a', fontSize: 18, fontWeight: 900 }}>{total}</span> manufacturer{total !== 1 ? 's' : ''} found</>
          ) : (
            'No manufacturers found'
          )}
          {activeCategory && (
            <span style={{ marginLeft: 8, background: '#eff6ff', color: '#2563eb', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              {CATEGORY_ICONS[activeCategory]} {activeCategory}
            </span>
          )}
        </div>

        {/* Grid */}
        {vendors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontWeight: 800, fontSize: 20, color: '#0f172a', marginBottom: 8 }}>No manufacturers found</h3>
            <p style={{ marginBottom: 24 }}>Try adjusting your filters or search query.</p>
            <Link href="/manufacturers" style={{ background: '#2563eb', color: '#fff', padding: '12px 24px', borderRadius: 10, fontWeight: 800, textDecoration: 'none' }}>Clear all filters</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {vendors.map(v => {
              const coverImg = v.products[0]?.imageUrl;
              const catIcon = CATEGORY_ICONS[v.category ?? ''] ?? '🏭';
              return (
                <Link key={v.id} href={`/manufacturer/${v.slug}`}
                  style={{ textDecoration: 'none', display: 'block', borderRadius: 20, overflow: 'hidden', background: '#fff', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,.05)', transition: 'all .2s' }}>

                  {/* Cover */}
                  <div style={{ height: 156, background: coverImg ? `url(${coverImg}) center/cover` : 'linear-gradient(135deg, #1e3a8a, #2563eb)', position: 'relative' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)' }} />
                    {v.isVerified && (
                      <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(22,163,74,0.9)', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                        ✓ KYC Verified
                      </div>
                    )}
                    {/* Logo floating */}
                    {v.logoUrl && (
                      <div style={{ position: 'absolute', bottom: -22, left: 18, width: 52, height: 52, borderRadius: 14, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.18)', overflow: 'hidden', border: '2px solid #fff' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={v.logoUrl} alt={v.companyNameEn} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: `${v.logoUrl ? '32px' : '20px'} 20px 20px` }}>
                    <div style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', marginBottom: 5, lineHeight: 1.3 }}>{v.companyNameEn}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{v.companyNameUa}</div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      <span style={{ background: '#eff6ff', color: '#2563eb', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {catIcon} {v.category ?? 'manufacturing'}
                      </span>
                      {v.city && (
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          🇺🇦 {v.city}
                        </span>
                      )}
                      {v.yearEstablished && (
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                          Est. {v.yearEstablished}
                        </span>
                      )}
                      <span style={{ background: '#f0fdf4', color: '#15803d', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {v._count.products} products
                      </span>
                    </div>

                    {/* Certs */}
                    {v.certifications.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                        {v.certifications.slice(0, 4).map(c => (
                          <span key={c.id} style={{ background: '#fefce8', color: '#92400e', border: '1px solid #fde68a', padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
                            {c.certType}
                          </span>
                        ))}
                        {v.certifications.length > 4 && (
                          <span style={{ background: '#f1f5f9', color: '#64748b', padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
                            +{v.certifications.length - 4}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1, background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff', padding: '11px', borderRadius: 10, fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
                        View Profile →
                      </div>
                      <div style={{ background: '#f1f5f9', color: '#374151', padding: '11px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700, textAlign: 'center' }}>
                        RFQ
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 48 }}>
            {currentPage > 1 && (
              <Link href={`?page=${currentPage - 1}${activeCategory ? `&category=${activeCategory}` : ''}`}
                style={{ padding: '9px 18px', borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                ← Prev
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`?page=${p}${activeCategory ? `&category=${activeCategory}` : ''}`}
                style={{ padding: '9px 16px', borderRadius: 10, fontWeight: 700, fontSize: 14, textDecoration: 'none', background: p === currentPage ? '#2563eb' : '#fff', color: p === currentPage ? '#fff' : '#374151', border: `1.5px solid ${p === currentPage ? '#2563eb' : '#e2e8f0'}` }}>
                {p}
              </Link>
            ))}
            {currentPage < totalPages && (
              <Link href={`?page=${currentPage + 1}${activeCategory ? `&category=${activeCategory}` : ''}`}
                style={{ padding: '9px 18px', borderRadius: 10, background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

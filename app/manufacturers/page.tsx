import Link from 'next/link';
import { prisma } from '@/lib/db';

interface SearchParams { category?: string; cert_type?: string; sort?: string; page?: string; }

async function getVendors(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page ?? '1'));
  const limit = 12;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (params.category) where.category = params.category;
  if (params.cert_type) {
    where.certifications = { some: { certType: params.cert_type } };
  }

  let orderBy: Record<string, unknown> = { companyNameEn: 'asc' };
  if (params.sort === 'established') orderBy = { yearEstablished: 'asc' };
  if (params.sort === 'certifications') orderBy = { certifications: { _count: 'desc' } };

  try {
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: { certifications: true },
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

export default async function ManufacturersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { vendors, total, totalPages, currentPage } = await getVendors(searchParams);

  return (
    <div className="page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">🇺🇦 Ukrainian Manufacturers</h1>
          <p className="page-subtitle">
            Browse verified Ukrainian producers ready for export. All manufacturers are KYC-verified with traceable certifications.
          </p>
        </div>

        {/* Filters */}
        <form className="filters-bar" method="get">
          <div className="form-group">
            <label>Category</label>
            <select name="category" className="form-control" defaultValue={searchParams.category ?? ''}>
              <option value="">All Categories</option>
              <option value="food">🌾 Food & Agriculture</option>
              <option value="metals">⚙️ Metals & Steel</option>
              <option value="chemicals">🧪 Chemicals</option>
              <option value="textiles">👗 Textiles</option>
              <option value="machinery">🔧 Machinery</option>
              <option value="wood">🌲 Wood & Paper</option>
            </select>
          </div>
          <div className="form-group">
            <label>Certification</label>
            <select name="cert_type" className="form-control" defaultValue={searchParams.cert_type ?? ''}>
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
          <div className="form-group">
            <label>Sort By</label>
            <select name="sort" className="form-control" defaultValue={searchParams.sort ?? 'name_asc'}>
              <option value="name_asc">Name A–Z</option>
              <option value="established">Established (oldest)</option>
              <option value="certifications">Most Certifications</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary btn-sm">Apply</button>
            <Link href="/manufacturers" className="btn btn-ghost btn-sm">Clear</Link>
          </div>
        </form>

        <div style={{ marginBottom: 20, color: '#6b7280', fontSize: 14 }}>
          {total} manufacturer{total !== 1 ? 's' : ''} found
        </div>

        {/* Grid */}
        {vendors.length === 0 ? (
          <div className="empty-state">
            <h3>No manufacturers found</h3>
            <p>Try adjusting your filters.</p>
            <Link href="/manufacturers" className="btn btn-outline" style={{ marginTop: 16 }}>Clear filters</Link>
          </div>
        ) : (
          <div className="vendors-grid">
            {vendors.map(vendor => (
              <Link key={vendor.id} href={`/manufacturer/${vendor.slug}`} className="vendor-card">
                <div className="vendor-card__header">
                  {vendor.logoUrl ? (
                    <img className="vendor-card__logo" src={vendor.logoUrl} alt={vendor.companyNameEn} />
                  ) : (
                    <div className="vendor-card__logo-placeholder">
                      {vendor.companyNameEn[0]}
                    </div>
                  )}
                  {vendor.isVerified && <span className="verified-badge" title="Verified">✓</span>}
                </div>
                <div className="vendor-card__body">
                  <h3 className="vendor-card__name">{vendor.companyNameEn}</h3>
                  <p className="vendor-card__name-ua">{vendor.companyNameUa}</p>
                  <div className="vendor-card__meta">
                    <span>🇺🇦 Ukraine</span>
                    {vendor.yearEstablished && <span>Est. {vendor.yearEstablished}</span>}
                    {vendor.employeeCount && <span>👥 {vendor.employeeCount}</span>}
                  </div>
                  <div className="vendor-card__certs">
                    {vendor.certifications.slice(0, 4).map(c => (
                      <span key={c.id} className="cert-chip">{c.certType}</span>
                    ))}
                    {vendor.certifications.length > 4 && (
                      <span className="cert-chip cert-chip-more">+{vendor.certifications.length - 4}</span>
                    )}
                  </div>
                </div>
                <div className="vendor-card__footer">
                  <span className="vendor-card__cta">View Profile →</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40 }}>
            {currentPage > 1 && (
              <Link href={`?page=${currentPage - 1}`} className="btn btn-outline btn-sm">← Prev</Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`?page=${p}`}
                className={`btn btn-sm ${p === currentPage ? 'btn-primary' : 'btn-ghost'}`}
              >
                {p}
              </Link>
            ))}
            {currentPage < totalPages && (
              <Link href={`?page=${currentPage + 1}`} className="btn btn-outline btn-sm">Next →</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

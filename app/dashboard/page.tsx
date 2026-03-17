import Link from 'next/link';
import { prisma } from '@/lib/db';

async function getDashboardData() {
  try {
    const [rfqCount, orderCount] = await Promise.all([
      prisma.rfq.count(),
      prisma.rfq.count({ where: { status: 'accepted' } }),
    ]);
    const recentRfqs = await prisma.rfq.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { vendor: true },
    });
    return { rfqCount, orderCount, recentRfqs };
  } catch {
    return { rfqCount: 0, orderCount: 0, recentRfqs: [] };
  }
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge-gray', submitted: 'badge-blue', responded: 'badge-gold',
  accepted: 'badge-green', closed: 'badge-gray',
};

export default async function DashboardPage() {
  const { rfqCount, orderCount, recentRfqs } = await getDashboardData();

  const stats = [
    { icon: '📋', value: rfqCount, label: 'Active RFQs' },
    { icon: '📦', value: orderCount, label: 'Orders' },
    { icon: '🚢', value: 0, label: 'Shipments' },
    { icon: '🏭', value: 0, label: 'Saved Vendors' },
  ];

  return (
    <div className="page">
      <div className="container">

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800 }}>Buyer Dashboard</h1>
            <p style={{ color: '#6b7280', marginTop: 4 }}>Manage your RFQs, orders and shipments</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className="badge badge-green">✅ KYC Verified</span>
            <Link href="/rfq/new" className="btn btn-primary">+ New RFQ</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {stats.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-card__icon">{s.icon}</div>
              <div className="stat-card__value">{s.value}</div>
              <div className="stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="dashboard-grid">

          {/* Active RFQs */}
          <div className="dashboard-widget dashboard-widget--wide">
            <div className="widget-header">
              <h3>Active RFQs</h3>
              <Link href="/manufacturers" className="widget-link">Browse manufacturers →</Link>
            </div>
            {recentRfqs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#6b7280' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
                <p>No RFQs yet. <Link href="/manufacturers" style={{ color: '#2563eb', fontWeight: 600 }}>Browse manufacturers →</Link></p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>RFQ #</th>
                    <th>Vendor</th>
                    <th>Destination</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRfqs.map(rfq => (
                    <tr key={rfq.id}>
                      <td style={{ fontWeight: 700, color: '#2563eb' }}>{rfq.rfqNumber}</td>
                      <td>{rfq.vendor.companyNameEn}</td>
                      <td>📍 {rfq.destinationCountry} | {rfq.incoterm}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[rfq.status] ?? 'badge-gray'}`}>
                          {rfq.status}
                        </span>
                        {rfq.status === 'responded' && (
                          <span className="badge badge-gold" style={{ marginLeft: 6 }}>⚡ Quote received!</span>
                        )}
                      </td>
                      <td style={{ color: '#6b7280', fontSize: 13 }}>{formatDate(rfq.createdAt)}</td>
                      <td>
                        <Link href={`/rfq/${rfq.id}`} className="btn btn-outline btn-sm">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Quick Actions */}
          <div className="dashboard-widget">
            <div className="widget-header"><h3>Quick Actions</h3></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: '📋', label: 'New RFQ', href: '/rfq/new', style: 'btn-primary' },
                { icon: '🏭', label: 'Browse Manufacturers', href: '/manufacturers', style: 'btn-outline' },
                { icon: '🧮', label: 'Duty Calculator', href: '/calculator', style: 'btn-outline' },
              ].map(a => (
                <Link key={a.label} href={a.href} className={`btn ${a.style}`}>
                  {a.icon} {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Shipments */}
          <div className="dashboard-widget">
            <div className="widget-header"><h3>Active Shipments</h3></div>
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#6b7280' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🚢</div>
              <p style={{ fontSize: 13 }}>No active shipments yet.</p>
            </div>
          </div>

          {/* DCFTA Info */}
          <div className="dashboard-widget" style={{ background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🇺🇦→🇪🇺</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>EU-Ukraine DCFTA</h3>
            <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 12 }}>
              Most Ukrainian goods enter the EU at <strong>0% duty</strong> under the Deep and Comprehensive Free Trade Agreement with a valid EUR.1 certificate.
            </p>
            <Link href="/calculator" className="btn btn-outline btn-sm">Calculate my savings →</Link>
          </div>

        </div>
      </div>
    </div>
  );
}

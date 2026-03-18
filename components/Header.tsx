import Link from 'next/link';
import NotificationBell from './NotificationBell';
import { prisma } from '@/lib/db';

async function getFirstUserId() {
  try {
    const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' }, select: { id: true } });
    return user?.id;
  } catch { return undefined; }
}

export default async function Header() {
  const userId = await getFirstUserId();

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#fff', borderBottom: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,.06)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 20 }}>

        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 22 }}>🇺🇦</span>
          <span style={{ fontWeight: 900, fontSize: 18, color: '#111827' }}>Corevia</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: 4 }}>Flow</span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: 2, flex: 1 }}>
          {[
            { href: '/manufacturers', label: 'Manufacturers' },
            { href: '/blog', label: '📰 Blog' },
            { href: '/calculator', label: '🧮 Duty Calc' },
            { href: '/vendor/import', label: '🤖 AI Import' },
            { href: '/crm', label: '💬 Messages' },
            { href: '/landing-lab', label: '🎨 Landing Lab' },
            { href: '/dashboard', label: 'Dashboard' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                color: '#374151', textDecoration: 'none', transition: 'background .15s',
              }}
              className="nav-link"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <NotificationBell userId={userId} />
          <Link href="/rfq/new" className="btn btn-primary btn-sm">+ New RFQ</Link>
        </div>
      </div>
    </header>
  );
}

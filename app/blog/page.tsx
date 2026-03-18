import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

export const metadata: Metadata = {
  title: 'Blog — Ukrainian Manufacturers Going Global | Corevia Flow',
  description: 'News and insights about Ukrainian manufacturers expanding to global markets. Export guides, industry news, and supplier spotlights.',
};

async function getPosts() {
  try {
    return await prisma.blogPost.findMany({
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });
  } catch { return []; }
}

export default async function BlogIndexPage() {
  const posts = await getPosts();

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', gap: 8, background: '#eff6ff', color: '#2563eb', padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
            🇺🇦 Ukrainian Export News
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>Ukrainian Manufacturers Go Global</h1>
          <p style={{ fontSize: 17, color: '#6b7280', maxWidth: 560, margin: '0 auto' }}>
            Supplier spotlights, export guides, and news from Ukrainian manufacturers entering world markets.
          </p>
        </div>

        {/* JSON-LD Blog */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: 'Corevia Flow — Ukrainian Export Blog',
          description: 'News about Ukrainian manufacturers expanding to global markets',
          blogPost: posts.slice(0, 10).map(p => ({
            '@type': 'BlogPosting',
            headline: p.titleEn,
            description: p.excerpt,
            image: p.coverImage,
            datePublished: p.publishedAt.toISOString(),
            url: `/blog/${p.slug}`,
          })),
        })}} />

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 24px', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <h3 style={{ marginBottom: 8 }}>Articles coming soon</h3>
            <p>Import a manufacturer to auto-generate the first article.</p>
            <Link href="/vendor/import" className="btn btn-primary" style={{ marginTop: 20 }}>🤖 Import Manufacturer →</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 28 }}>
            {posts.map(post => {
              const langs = Object.keys((post.translations as Record<string, unknown>) ?? {});
              const tags = post.tags?.split(',').map(t => t.trim()).filter(Boolean).slice(0, 3) ?? [];
              return (
                <Link key={post.id} href={`/blog/${post.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', border: '1.5px solid #e5e7eb', borderRadius: 14, overflow: 'hidden', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)', transition: 'box-shadow .2s, transform .2s' }}
                  className="vendor-card">
                  {post.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.coverImage} alt={post.titleEn} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: 100, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
                      🇺🇦
                    </div>
                  )}
                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                      {tags.map(tag => (
                        <span key={tag} style={{ background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h2 style={{ fontSize: 17, fontWeight: 800, lineHeight: 1.35, marginBottom: 8, color: '#111827' }}>{post.titleEn}</h2>
                    {post.excerpt && (
                      <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.55, marginBottom: 14, flex: 1 }}>
                        {post.excerpt.slice(0, 120)}…
                      </p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #f3f4f6' }}>
                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 500 }}>
                        🌐 {langs.length + 1} languages
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: 64, background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #bfdbfe', borderRadius: 16, padding: '40px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Are you a Ukrainian manufacturer?</h2>
          <p style={{ color: '#374151', marginBottom: 24 }}>Import your website in 30 seconds. We auto-generate your export profile, translate it to 50 languages, and publish an article about you.</p>
          <Link href="/vendor/import" className="btn btn-primary btn-lg">🤖 Import My Company Free →</Link>
        </div>
      </div>
    </div>
  );
}

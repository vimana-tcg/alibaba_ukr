import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

async function getPost(slug: string) {
  try { return await prisma.blogPost.findUnique({ where: { slug } }); }
  catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string; lang: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};
  const translations = (post.translations as Record<string, { title: string; excerpt: string }>) ?? {};
  const t = translations[params.lang];
  const base = process.env.NEXTAUTH_URL ?? 'https://corevia-flow.vercel.app';
  const allLangs = Object.keys(translations);
  const alternates: Record<string, string> = { en: `${base}/blog/${params.slug}` };
  allLangs.forEach(l => { alternates[l] = `${base}/blog/${params.slug}/${l}`; });
  return {
    title: t?.title ?? post.titleEn,
    description: t?.excerpt ?? post.excerpt ?? undefined,
    alternates: { languages: alternates },
    openGraph: {
      title: t?.title ?? post.titleEn,
      description: t?.excerpt ?? post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      locale: params.lang,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostLangPage({ params }: { params: { slug: string; lang: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const translations = (post.translations as Record<string, { title: string; body: string; excerpt: string }>) ?? {};
  if (!translations[params.lang]) notFound();

  const t = translations[params.lang];
  const availableLangs = Object.keys(translations);
  const tags = post.tags?.split(',').map(x => x.trim()).filter(Boolean) ?? [];
  const base = process.env.NEXTAUTH_URL ?? 'https://corevia-flow.vercel.app';

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: t.title,
        description: t.excerpt,
        image: post.coverImage,
        datePublished: post.publishedAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: { '@type': 'Organization', name: 'Corevia Flow', url: base },
        publisher: { '@type': 'Organization', name: 'Corevia Flow', url: base },
        inLanguage: params.lang,
      })}} />

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', padding: '56px 0 48px' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <nav style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
            <Link href="/" style={{ color: '#93c5fd' }}>Home</Link> →{' '}
            <Link href="/blog" style={{ color: '#93c5fd' }}>Blog</Link> →{' '}
            <Link href={`/blog/${params.slug}`} style={{ color: '#93c5fd' }}>EN</Link> →{' '}
            <span>{params.lang.toUpperCase()}</span>
          </nav>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <span style={{ background: '#2563eb', color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>🇺🇦 Ukrainian Manufacturer</span>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.2, marginBottom: 16 }}>{t.title}</h1>
          {t.excerpt && <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.6 }}>{t.excerpt}</p>}
        </div>
      </div>

      {/* Language bar */}
      <div style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', padding: '10px 0', overflowX: 'auto' }}>
        <div className="container" style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center', minWidth: 'max-content' }}>
          <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginRight: 4 }}>🌐</span>
          <Link href={`/blog/${params.slug}`}
            style={{ padding: '4px 10px', borderRadius: 6, background: '#f3f4f6', color: '#374151', fontSize: 12, fontWeight: 500, textDecoration: 'none' }}>EN</Link>
          {availableLangs.map(lang => (
            <Link key={lang} href={`/blog/${params.slug}/${lang}`}
              style={{ padding: '4px 10px', borderRadius: 6, background: lang === params.lang ? '#2563eb' : '#f3f4f6', color: lang === params.lang ? '#fff' : '#374151', fontSize: 12, fontWeight: lang === params.lang ? 700 : 500, textDecoration: 'none', flexShrink: 0 }}>
              {lang.toUpperCase()}
            </Link>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="container" style={{ maxWidth: 860, padding: '48px 24px 80px' }}>
        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverImage} alt={t.title}
            style={{ width: '100%', borderRadius: 12, marginBottom: 32, maxHeight: 360, objectFit: 'cover' }} />
        )}
        <div style={{ fontSize: 16, lineHeight: 1.8, color: '#374151' }}
          dangerouslySetInnerHTML={{ __html: (t.body || post.bodyEn)
            .replace(/<h2/g, '<h2 style="font-size:22px;font-weight:800;margin:32px 0 12px;color:#111827"')
            .replace(/<h3/g, '<h3 style="font-size:18px;font-weight:700;margin:24px 0 8px;color:#1e40af"')
            .replace(/<p>/g, '<p style="margin-bottom:16px">')
            .replace(/<ul>/g, '<ul style="margin:12px 0 16px 20px">')
            .replace(/<li>/g, '<li style="margin-bottom:6px">')
          }}
        />
        {tags.length > 0 && (
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {tags.map(tag => (
              <span key={tag} style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>#{tag}</span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <Link href={`/blog/${params.slug}`} style={{ color: '#2563eb', fontSize: 14, fontWeight: 600 }}>
            → Read original in English
          </Link>
        </div>
      </div>
    </div>
  );
}

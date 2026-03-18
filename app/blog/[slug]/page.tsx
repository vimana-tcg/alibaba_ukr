import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';

const LANG_NAMES: Record<string, string> = {
  de:'Deutsch', fr:'Français', es:'Español', it:'Italiano', pl:'Polski',
  nl:'Nederlands', pt:'Português', ro:'Română', cs:'Čeština', hu:'Magyar',
  sv:'Svenska', da:'Dansk', fi:'Suomi', sk:'Slovenčina', bg:'Български',
  hr:'Hrvatski', el:'Ελληνικά', lt:'Lietuvių', lv:'Latviešu', et:'Eesti',
  ar:'العربية', zh:'中文', ja:'日本語', ko:'한국어', hi:'हिन्दी',
  tr:'Türkçe', vi:'Tiếng Việt', th:'ไทย', id:'Indonesia', ms:'Melayu',
  fa:'فارسی', he:'עברית', uk:'Українська', ru:'Русский', ka:'ქართული',
  az:'Azərbaycanca', kk:'Қазақша', uz:'O\'zbek', mn:'Монгол', bn:'বাংলা',
  ur:'اردو', ta:'தமிழ்', te:'తెలుగు', sw:'Kiswahili', am:'አማርኛ',
  sr:'Српски', sl:'Slovenščina', mk:'Македонски', sq:'Shqip',
};

async function getPost(slug: string) {
  try {
    return await prisma.blogPost.findUnique({ where: { slug } });
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};
  const base = process.env.NEXTAUTH_URL ?? 'https://corevia-flow.vercel.app';
  const langs = Object.keys((post.translations as Record<string, unknown>) ?? {});
  const alternates: Record<string, string> = { en: `${base}/blog/${params.slug}` };
  langs.forEach(l => { alternates[l] = `${base}/blog/${params.slug}/${l}`; });
  return {
    title: post.titleEn,
    description: post.excerpt ?? undefined,
    alternates: { languages: alternates },
    openGraph: {
      title: post.titleEn,
      description: post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt.toISOString(),
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const translations = (post.translations as Record<string, { title: string; excerpt: string }>) ?? {};
  const availableLangs = Object.keys(translations);
  const tags = post.tags?.split(',').map(t => t.trim()).filter(Boolean) ?? [];
  const base = process.env.NEXTAUTH_URL ?? 'https://corevia-flow.vercel.app';

  // Build FAQ JSON-LD from article body
  const faqMatches = Array.from(post.bodyEn.matchAll(/<h3[^>]*>([^<]*)<\/h3>[^<]*<p[^>]*>([^<]*)<\/p>/g));
  const faqItems = faqMatches.slice(0, 4).map(m => ({
    '@type': 'Question',
    name: m[1].replace(/<[^>]+>/g, ''),
    acceptedAnswer: { '@type': 'Answer', text: m[2].replace(/<[^>]+>/g, '').slice(0, 300) },
  }));

  return (
    <div>
      {/* Article JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: post.titleEn,
        description: post.excerpt,
        image: post.coverImage,
        datePublished: post.publishedAt.toISOString(),
        dateModified: post.updatedAt.toISOString(),
        author: { '@type': 'Organization', name: 'Corevia Flow', url: base },
        publisher: { '@type': 'Organization', name: 'Corevia Flow', url: base },
        inLanguage: 'en',
      })}} />
      {faqItems.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems,
        })}} />
      )}

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)', color: '#fff', padding: '56px 0 48px' }}>
        <div className="container" style={{ maxWidth: 860 }}>
          <nav style={{ fontSize: 13, opacity: 0.6, marginBottom: 20 }}>
            <Link href="/" style={{ color: '#93c5fd' }}>Home</Link> →{' '}
            <Link href="/blog" style={{ color: '#93c5fd' }}>Blog</Link> →{' '}
            <span>{post.titleEn.slice(0, 40)}…</span>
          </nav>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={{ background: '#2563eb', color: '#fff', padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
              🇺🇦 Ukrainian Manufacturer
            </span>
            <span style={{ background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '3px 10px', borderRadius: 999, fontSize: 12 }}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2, marginBottom: 16, maxWidth: 740 }}>
            {post.titleEn}
          </h1>
          {post.excerpt && (
            <p style={{ fontSize: 17, color: '#cbd5e1', lineHeight: 1.6, maxWidth: 660 }}>{post.excerpt}</p>
          )}
        </div>
      </div>

      {/* Language switcher bar */}
      {availableLangs.length > 0 && (
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb', padding: '10px 0', overflowX: 'auto' }}>
          <div className="container" style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', alignItems: 'center', minWidth: 'max-content' }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, marginRight: 4, flexShrink: 0 }}>🌐 Read in:</span>
            <Link href={`/blog/${params.slug}`}
              style={{ padding: '4px 10px', borderRadius: 6, background: '#2563eb', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
              EN
            </Link>
            {availableLangs.slice(0, 30).map(lang => (
              <Link key={lang} href={`/blog/${params.slug}/${lang}`}
                style={{ padding: '4px 10px', borderRadius: 6, background: '#f3f4f6', color: '#374151', fontSize: 12, fontWeight: 500, textDecoration: 'none', flexShrink: 0 }}>
                {lang.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Article body */}
      <div className="container" style={{ maxWidth: 860, padding: '48px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 48, alignItems: 'start' }}>

          {/* Article */}
          <article>
            {post.coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.coverImage} alt={post.titleEn}
                style={{ width: '100%', borderRadius: 12, marginBottom: 32, maxHeight: 360, objectFit: 'cover' }} />
            )}
            <div
              style={{ fontSize: 16, lineHeight: 1.8, color: '#374151' }}
              dangerouslySetInnerHTML={{ __html: post.bodyEn
                .replace(/<h2/g, '<h2 style="font-size:22px;font-weight:800;margin:32px 0 12px;color:#111827"')
                .replace(/<h3/g, '<h3 style="font-size:18px;font-weight:700;margin:24px 0 8px;color:#1e40af"')
                .replace(/<p>/g, '<p style="margin-bottom:16px">')
                .replace(/<ul>/g, '<ul style="margin:12px 0 16px 20px">')
                .replace(/<li>/g, '<li style="margin-bottom:6px">')
                .replace(/<strong>/g, '<strong style="color:#111827">')
              }}
            />
            {tags.length > 0 && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid #e5e7eb' }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tags.map(tag => (
                    <span key={tag} style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Sidebar */}
          <aside style={{ position: 'sticky', top: 80 }}>
            <div style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)', borderRadius: 16, padding: '24px', marginBottom: 20, textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🤝</div>
              <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Interested in this supplier?</div>
              <div style={{ fontSize: 12, color: '#bfdbfe', marginBottom: 16 }}>Send a quote request directly</div>
              <Link href="/manufacturers"
                style={{ display: 'block', background: '#fff', color: '#2563eb', padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 14, textDecoration: 'none', marginBottom: 8 }}>
                View Supplier Profile →
              </Link>
              <Link href="/vendor/import"
                style={{ display: 'block', background: 'rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '10px', borderRadius: 10, fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
                🤖 Import Your Company Free
              </Link>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>📖 Available in {availableLangs.length + 1} languages</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Link href={`/blog/${params.slug}`}
                  style={{ padding: '3px 8px', borderRadius: 4, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                  EN
                </Link>
                {availableLangs.map(lang => (
                  <Link key={lang} href={`/blog/${params.slug}/${lang}`}
                    style={{ padding: '3px 8px', borderRadius: 4, background: '#f3f4f6', color: '#374151', fontSize: 11, fontWeight: 500, textDecoration: 'none' }}>
                    {lang.toUpperCase()}
                  </Link>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>🧮</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Calculate Import Duties</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 10 }}>Free tool — check exact rates for your country</div>
              <Link href="/calculator" className="btn btn-outline btn-sm btn-block">Open Calculator →</Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

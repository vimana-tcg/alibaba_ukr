import { MetadataRoute } from 'next';
import { prisma } from '@/lib/db';
import { B2B_CATEGORIES } from '@/lib/categories';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXTAUTH_URL ?? 'https://corevia-flow.vercel.app';

  // Static pages
  const statics: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/manufacturers`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.85 },
    { url: `${base}/calculator`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/vendor/import`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ];

  // Blog posts + language variants
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({ select: { slug: true, updatedAt: true, translations: true } });
    for (const p of posts) {
      blogPosts.push({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.75 });
      const langs = Object.keys((p.translations as Record<string, unknown>) ?? {});
      for (const lang of langs) {
        blogPosts.push({ url: `${base}/blog/${p.slug}/${lang}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 });
      }
    }
  } catch {}

  // Category pages
  const categories: MetadataRoute.Sitemap = B2B_CATEGORIES.map(c => ({
    url: `${base}/category/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // Vendor pages + language variants + product pages
  let vendors: MetadataRoute.Sitemap = [];
  try {
    const vs = await prisma.vendor.findMany({
      select: { slug: true, updatedAt: true, translations: true, products: { select: { id: true, slug: true } } },
    });
    for (const v of vs) {
      // Vendor main page
      vendors.push({ url: `${base}/manufacturer/${v.slug}`, lastModified: v.updatedAt, changeFrequency: 'weekly' as const, priority: 0.8 });
      // Language variants
      const langs = Object.keys((v.translations as Record<string, unknown>) ?? {});
      for (const lang of langs) {
        vendors.push({ url: `${base}/manufacturer/${v.slug}/${lang}`, lastModified: v.updatedAt, changeFrequency: 'weekly' as const, priority: 0.75 });
      }
      // Product pages
      for (const p of v.products) {
        const productId = p.slug ?? p.id;
        vendors.push({ url: `${base}/manufacturer/${v.slug}/product/${productId}`, lastModified: v.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 });
      }
    }
  } catch {}

  return [...statics, ...categories, ...vendors, ...blogPosts];
}

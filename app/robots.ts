import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXTAUTH_URL ?? 'https://corevia-flow.vercel.app';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/dashboard'] },
    sitemap: `${base}/sitemap.xml`,
  };
}

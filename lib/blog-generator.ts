import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANGUAGES = [
  { code: 'de', name: 'German' }, { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' }, { code: 'it', name: 'Italian' },
  { code: 'pl', name: 'Polish' }, { code: 'nl', name: 'Dutch' },
  { code: 'pt', name: 'Portuguese' }, { code: 'ro', name: 'Romanian' },
  { code: 'cs', name: 'Czech' }, { code: 'hu', name: 'Hungarian' },
  { code: 'sv', name: 'Swedish' }, { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' }, { code: 'sk', name: 'Slovak' },
  { code: 'bg', name: 'Bulgarian' }, { code: 'hr', name: 'Croatian' },
  { code: 'el', name: 'Greek' }, { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' }, { code: 'et', name: 'Estonian' },
  { code: 'ar', name: 'Arabic' }, { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' }, { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' }, { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' }, { code: 'ms', name: 'Malay' },
  { code: 'fa', name: 'Persian' }, { code: 'he', name: 'Hebrew' },
  { code: 'uk', name: 'Ukrainian' }, { code: 'ru', name: 'Russian' },
  { code: 'ka', name: 'Georgian' }, { code: 'az', name: 'Azerbaijani' },
  { code: 'kk', name: 'Kazakh' }, { code: 'uz', name: 'Uzbek' },
  { code: 'mn', name: 'Mongolian' }, { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' }, { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' }, { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharic' }, { code: 'sr', name: 'Serbian' },
  { code: 'sl', name: 'Slovenian' }, { code: 'mk', name: 'Macedonian' },
  { code: 'sq', name: 'Albanian' },
];

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

interface VendorData {
  id: string;
  companyNameEn: string;
  description: string | null;
  category: string | null;
  city: string | null;
  yearEstablished: number | null;
  employeeCount: string | null;
  logoUrl: string | null;
  slug: string;
  products: { nameEn: string; description: string | null; hsCode: string | null }[];
}

async function generateArticle(vendor: VendorData): Promise<{ title: string; body: string; excerpt: string; tags: string }> {
  const productList = vendor.products.slice(0, 8).map(p => `- ${p.nameEn}${p.hsCode ? ` (HS ${p.hsCode})` : ''}`).join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2500,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `You are an expert B2B export journalist and SEO content writer. Write a professional news/announcement article for a B2B export marketplace platform.

Write about this Ukrainian manufacturer joining the Corevia Flow platform:
- Company: ${vendor.companyNameEn}
- Description: ${vendor.description ?? 'Ukrainian manufacturer'}
- Industry: ${vendor.category ?? 'manufacturing'}
- Location: ${vendor.city ?? 'Ukraine'}
- Founded: ${vendor.yearEstablished ?? 'N/A'}
- Employees: ${vendor.employeeCount ?? 'N/A'}
- Products:
${productList}

Requirements:
1. Write in English, ~700-900 words
2. Structure with HTML: use <h2>, <h3>, <p>, <ul><li>, <strong> tags
3. SEO-optimized: include natural keywords like "buy from Ukraine", "Ukrainian manufacturer", "0% EU duty", "direct export", product names
4. Include these sections:
   - Opening announcement paragraph (hook)
   - About the company (h2)
   - Products & Export Offerings (h2) — list products with details
   - Why Source from Ukraine (h2) — DCFTA 0% duty, quality, price competitiveness
   - FAQ section (h2) with 3-4 questions buyers ask (uses FAQ schema for Google featured snippets)
   - Closing CTA paragraph
5. Naturally mention "Corevia Flow platform" as where to contact them
6. Optimized for Google, ChatGPT, Claude, Perplexity — write factually and authoritatively
7. excerpt: 2-sentence summary for meta description (max 160 chars)
8. tags: comma-separated SEO tags

Return JSON:
{
  "title": "SEO headline ~60 chars",
  "body": "full HTML article body",
  "excerpt": "160-char meta description",
  "tags": "tag1, tag2, tag3, tag4, tag5"
}`,
    }],
  });

  const text = completion.choices[0].message.content ?? '{}';
  const json = JSON.parse(text);
  return {
    title: json.title ?? `${vendor.companyNameEn} — Ukrainian Manufacturer Now Exporting Globally`,
    body: json.body ?? '',
    excerpt: json.excerpt ?? vendor.description?.slice(0, 160) ?? '',
    tags: json.tags ?? vendor.category ?? '',
  };
}

async function translateArticle(
  data: { title: string; body: string; excerpt: string },
  langs: string[]
): Promise<Record<string, { title: string; body: string; excerpt: string }>> {
  // Translate title + excerpt only (body translation is expensive; we use excerpt for meta)
  // For full body translation we do a separate call
  const langList = langs.map(l => LANGUAGES.find(x => x.code === l)?.name ?? l).join(', ');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 6000,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Translate this article title and excerpt to the following languages.
Return JSON: { "langCode": { "title": "...", "excerpt": "..." } }

Title: ${data.title}
Excerpt: ${data.excerpt}

Languages: ${langList}
Language codes: ${langs.join(', ')}`,
    }],
  });

  const result: Record<string, { title: string; body: string; excerpt: string }> = {};
  try {
    const parsed = JSON.parse(completion.choices[0].message.content ?? '{}');
    for (const [lang, t] of Object.entries(parsed)) {
      result[lang] = {
        title: (t as any).title ?? data.title,
        body: data.body, // reuse English body — full translation is optional/expensive
        excerpt: (t as any).excerpt ?? data.excerpt,
      };
    }
  } catch {}
  return result;
}

export async function generateAndSaveBlogPost(vendor: VendorData): Promise<string | null> {
  try {
    // Generate article
    const article = await generateArticle(vendor);
    const slug = `${slugify(vendor.companyNameEn)}-exports-globally-${Date.now().toString(36)}`;

    // Translate title + excerpt to all 50 languages (2 parallel batches)
    const allLangs = LANGUAGES.map(l => l.code);
    const [t1, t2] = await Promise.all([
      translateArticle(article, allLangs.slice(0, 25)),
      translateArticle(article, allLangs.slice(25)),
    ]);
    const translations = { ...t1, ...t2 };

    // Save to DB
    await prisma.blogPost.create({
      data: {
        vendorId: vendor.id,
        slug,
        titleEn: article.title,
        bodyEn: article.body,
        excerpt: article.excerpt,
        coverImage: vendor.logoUrl ?? null,
        tags: article.tags,
        translations,
      },
    });

    return slug;
  } catch (err) {
    console.error('Blog generation error:', err);
    return null;
  }
}

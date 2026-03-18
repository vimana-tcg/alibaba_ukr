import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/db';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANGUAGES = [
  { code: 'de', name: 'German' },        { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },       { code: 'it', name: 'Italian' },
  { code: 'pl', name: 'Polish' },        { code: 'nl', name: 'Dutch' },
  { code: 'pt', name: 'Portuguese' },    { code: 'ro', name: 'Romanian' },
  { code: 'cs', name: 'Czech' },         { code: 'hu', name: 'Hungarian' },
  { code: 'sv', name: 'Swedish' },       { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },       { code: 'sk', name: 'Slovak' },
  { code: 'bg', name: 'Bulgarian' },     { code: 'hr', name: 'Croatian' },
  { code: 'el', name: 'Greek' },         { code: 'lt', name: 'Lithuanian' },
  { code: 'lv', name: 'Latvian' },       { code: 'et', name: 'Estonian' },
  { code: 'ar', name: 'Arabic' },        { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'ja', name: 'Japanese' },      { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },         { code: 'tr', name: 'Turkish' },
  { code: 'vi', name: 'Vietnamese' },    { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },    { code: 'ms', name: 'Malay' },
  { code: 'fa', name: 'Persian' },       { code: 'he', name: 'Hebrew' },
  { code: 'uk', name: 'Ukrainian' },     { code: 'ru', name: 'Russian' },
  { code: 'ka', name: 'Georgian' },      { code: 'az', name: 'Azerbaijani' },
  { code: 'kk', name: 'Kazakh' },        { code: 'uz', name: 'Uzbek' },
  { code: 'mn', name: 'Mongolian' },     { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' },          { code: 'ta', name: 'Tamil' },
  { code: 'te', name: 'Telugu' },        { code: 'sw', name: 'Swahili' },
  { code: 'am', name: 'Amharic' },       { code: 'sr', name: 'Serbian' },
  { code: 'sl', name: 'Slovenian' },     { code: 'mk', name: 'Macedonian' },
  { code: 'sq', name: 'Albanian' },
];

const CATEGORY_SLUG_MAP: Record<string, string> = {
  food: 'agricultural-products',
  metals: 'metals-steel',
  chemicals: 'chemicals-fertilizers',
  textiles: 'textiles-apparel',
  machinery: 'machinery-equipment',
  wood: 'wood-paper',
  electronics: 'electronics',
  construction: 'construction-materials',
  energy: 'energy-fuels',
  healthcare: 'healthcare-pharma',
  automotive: 'automotive-parts',
  packaging: 'packaging',
};

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

// ── Image extraction: zero-dependency, works in serverless ──────────────────

async function extractImages(siteUrl: string, markdownContent: string): Promise<{
  logoUrl: string | null;
  productImages: string[];
}> {
  let logoUrl: string | null = null;
  const productImages: string[] = [];

  // 1. Fetch HTML and extract og:image / twitter:image / favicon
  try {
    const res = await fetch(siteUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CoreviaBot/1.0; +https://corevia-flow.vercel.app)' },
    });
    const html = await res.text();

    // og:image (handles both attribute orders)
    const og1 = html.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    const og2 = html.match(/content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    logoUrl = og1?.[1] ?? og2?.[1] ?? null;

    // twitter:image fallback
    if (!logoUrl) {
      const tw1 = html.match(/name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      const tw2 = html.match(/content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      logoUrl = tw1?.[1] ?? tw2?.[1] ?? null;
    }

    // apple-touch-icon / logo img fallback
    if (!logoUrl) {
      const apple = html.match(/<link[^>]+rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
      if (apple?.[1]) {
        const href = apple[1];
        logoUrl = href.startsWith('http') ? href : new URL(href, siteUrl).href;
      }
    }

    // Resolve relative URLs
    if (logoUrl && !logoUrl.startsWith('http')) {
      try { logoUrl = new URL(logoUrl, siteUrl).href; } catch { logoUrl = null; }
    }

    // Extract product images from HTML — look for large <img> tags
    const imgTags = html.matchAll(/<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp))["'][^>]*(?:width=["'](\d+)["'])?/gi);
    for (const m of imgTags) {
      if (productImages.length >= 12) break;
      const w = parseInt(m[3] ?? '999');
      if (w < 100) continue; // skip tiny icons
      try {
        const imgUrl = m[1].startsWith('http') ? m[1] : new URL(m[1], siteUrl).href;
        if (!productImages.includes(imgUrl)) productImages.push(imgUrl);
      } catch {}
    }
  } catch {}

  // 2. Extract images from Jina/Firecrawl markdown — format: ![alt](url)
  const mdImgRegex = /!\[[^\]]*\]\((https?:\/\/[^)\s]+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^)]*)?)\)/gi;
  for (const m of markdownContent.matchAll(mdImgRegex)) {
    if (productImages.length >= 12) break;
    if (!productImages.includes(m[1])) productImages.push(m[1]);
  }

  return { logoUrl, productImages };
}

// ── Scrapers ─────────────────────────────────────────────────────────────────

async function scrapeWithFirecrawl(url: string): Promise<{ markdown: string; screenshot?: string } | null> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { markdown: data.data?.markdown ?? '' };
  } catch { return null; }
}

async function scrapeWithJina(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown', 'X-With-Images-Summary': 'true' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Jina scrape failed: ${res.status}`);
  return res.text();
}

async function scrape(url: string): Promise<string> {
  const fc = await scrapeWithFirecrawl(url);
  if (fc?.markdown && fc.markdown.length > 200) return fc.markdown;
  return scrapeWithJina(url);
}

// ── GPT extraction ────────────────────────────────────────────────────────────

async function extractWithGPT(rawContent: string, url: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 3000,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `You are a B2B export platform data extractor. Extract structured company and product data from this manufacturer website content.

Return ONLY valid JSON:
{
  "companyNameEn": "Official company name in English",
  "description": "3-sentence professional B2B company description highlighting export capabilities, production volumes, key products, and quality standards",
  "category": "one of: food|metals|chemicals|textiles|machinery|wood|electronics|construction|energy|healthcare|automotive|packaging",
  "products": [
    {
      "nameEn": "Product name",
      "description": "2-3 sentence product description with technical specs, applications, and export advantages",
      "richDescription": "3 paragraphs: (1) what the product is and technical specs, (2) industrial applications and target markets, (3) why source from Ukraine — quality, pricing, DCFTA 0% duty advantage",
      "unit": "MT|KG|PCS|L|M2|M3",
      "hsCode": "6-digit HS code if determinable",
      "minOrderQty": number or null,
      "imageKeyword": "keyword to find product image on the site"
    }
  ],
  "email": "contact email if found",
  "phone": "phone number if found",
  "city": "city name if found",
  "yearEstablished": number or null,
  "employeeCount": "range like 51-200 or null",
  "certifications": ["ISO9001", "ISO14001", "HACCP", "CE", etc — only if explicitly mentioned]
}

Website URL: ${url}
Content:
${rawContent.slice(0, 10000)}`,
    }],
  });

  const text = completion.choices[0].message.content ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('GPT did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
}

// ── Translation ───────────────────────────────────────────────────────────────

async function translateWithGPT(
  data: { name: string; description: string },
  langs: string[]
): Promise<Record<string, { name: string; description: string }>> {
  const langList = langs
    .map(l => { const lang = LANGUAGES.find(x => x.code === l); return lang ? `"${l}": ${lang.name}` : null; })
    .filter(Boolean).join(', ');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 4000,
    response_format: { type: 'json_object' },
    messages: [{
      role: 'user',
      content: `Translate this B2B company profile. Return JSON: { "langCode": { "name": "...", "description": "..." } }
Company: ${data.name}
Description: ${data.description}
Translate to: ${langList}`,
    }],
  });

  const text = completion.choices[0].message.content ?? '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { url, targetLangs } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const langs = targetLangs ?? LANGUAGES.map(l => l.code);

    // Step 1: Scrape
    let rawContent: string;
    try {
      rawContent = await scrape(url);
    } catch {
      return NextResponse.json({ error: 'Failed to fetch website. Check the URL and try again.' }, { status: 422 });
    }

    // Step 2: Extract images from HTML + markdown (parallel with GPT)
    const [extracted, { logoUrl, productImages }] = await Promise.all([
      extractWithGPT(rawContent, url).catch(() => null),
      extractImages(url, rawContent),
    ]);

    if (!extracted) {
      return NextResponse.json({ error: 'Failed to parse website content. Try a different URL.' }, { status: 422 });
    }

    // Step 3: Translate (2 batches of 25)
    let translations: Record<string, { name: string; description: string }> = {};
    try {
      const [b1, b2] = await Promise.all([
        translateWithGPT({ name: extracted.companyNameEn, description: extracted.description }, langs.slice(0, 25)),
        langs.length > 25
          ? translateWithGPT({ name: extracted.companyNameEn, description: extracted.description }, langs.slice(25))
          : Promise.resolve({}),
      ]);
      translations = { ...b1, ...b2 };
    } catch {}

    // Step 4: Create vendor
    const slug = slugify(extracted.companyNameEn) + '-' + Date.now().toString(36);

    const user = await prisma.user.create({
      data: {
        email: `${slug}@imported.corevia.flow`,
        name: extracted.companyNameEn,
        role: 'vendor',
      },
    });

    const vendor = await prisma.vendor.create({
      data: {
        userId: user.id,
        companyNameEn: extracted.companyNameEn,
        companyNameUa: translations['uk']?.name ?? extracted.companyNameEn,
        slug,
        description: extracted.description,
        category: extracted.category,
        categorySlug: CATEGORY_SLUG_MAP[extracted.category] ?? null,
        email: extracted.email ?? null,
        phone: extracted.phone ?? null,
        city: extracted.city ?? null,
        yearEstablished: extracted.yearEstablished ?? null,
        employeeCount: extracted.employeeCount ?? null,
        logoUrl: logoUrl ?? null,
        sourceUrl: url,
        translations,
      },
    });

    // Step 5: Create certifications
    for (const certType of (extracted.certifications ?? []).slice(0, 10)) {
      await prisma.vendorCertification.create({
        data: { vendorId: vendor.id, certType },
      });
    }

    // Step 6: Create products with images and rich descriptions
    const products = [];
    for (const [i, p] of (extracted.products ?? []).slice(0, 20).entries()) {
      const productSlug = slugify(p.nameEn) + '-' + vendor.id.slice(-6);
      const imageUrl = productImages[i] ?? productImages[0] ?? null;

      const product = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          nameEn: p.nameEn,
          slug: productSlug,
          description: p.description ?? null,
          richDescription: p.richDescription ?? null,
          unit: p.unit ?? 'MT',
          hsCode: p.hsCode ?? null,
          minOrderQty: p.minOrderQty ?? null,
          imageUrl,
        },
      });
      products.push(product);
    }

    return NextResponse.json({
      success: true,
      vendor: { id: vendor.id, slug: vendor.slug, companyNameEn: vendor.companyNameEn },
      productsCount: products.length,
      translationsCount: Object.keys(translations).length,
      logoUrl,
      productImagesFound: productImages.length,
      profileUrl: `/manufacturer/${vendor.slug}`,
    }, { status: 201 });

  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

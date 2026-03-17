import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '@/lib/db';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 50 target languages for translation
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

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);
}

async function scrapeWithJina(url: string): Promise<string> {
  const res = await fetch(`https://r.jina.ai/${url}`, {
    headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Jina scrape failed: ${res.status}`);
  return res.text();
}

async function extractWithClaude(rawContent: string, url: string) {
  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Extract structured company information from this scraped website content.
Return ONLY valid JSON with this exact structure:
{
  "companyNameEn": "string",
  "description": "2-3 sentence professional B2B description in English",
  "category": "one of: food|metals|chemicals|textiles|machinery|wood|electronics|construction|energy|healthcare|automotive|packaging",
  "products": [
    { "nameEn": "string", "description": "string", "unit": "MT|KG|PCS|L", "hsCode": "if obvious" }
  ],
  "email": "if found",
  "phone": "if found",
  "city": "if found",
  "yearEstablished": number or null,
  "employeeCount": "e.g. 51-200 or null"
}

Website URL: ${url}
Content:
${rawContent.slice(0, 8000)}`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude did not return valid JSON');
  return JSON.parse(jsonMatch[0]);
}

async function translateWithClaude(data: { name: string; description: string }, langs: string[]): Promise<Record<string, { name: string; description: string }>> {
  const langList = langs.map(l => {
    const lang = LANGUAGES.find(x => x.code === l);
    return lang ? `"${l}": translate to ${lang.name}` : null;
  }).filter(Boolean).join('\n');

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [{
      role: 'user',
      content: `Translate this company profile to the following languages.
Return ONLY valid JSON: { "langCode": { "name": "...", "description": "..." }, ... }

Company name: ${data.name}
Description: ${data.description}

Languages to translate to:
${langList}`,
    }],
  });

  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

export async function POST(req: NextRequest) {
  try {
    const { url, targetLangs } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const langs = targetLangs ?? LANGUAGES.map(l => l.code);

    // Step 1: Scrape with Jina AI
    let rawContent: string;
    try {
      rawContent = await scrapeWithJina(url);
    } catch {
      return NextResponse.json({ error: 'Failed to fetch website. Check the URL and try again.' }, { status: 422 });
    }

    // Step 2: Extract structured data with Claude
    let extracted: Awaited<ReturnType<typeof extractWithClaude>>;
    try {
      extracted = await extractWithClaude(rawContent, url);
    } catch {
      return NextResponse.json({ error: 'Failed to parse website content. Try a different URL.' }, { status: 422 });
    }

    // Step 3: Translate to all languages with Claude
    let translations: Record<string, { name: string; description: string }> = {};
    try {
      translations = await translateWithClaude(
        { name: extracted.companyNameEn, description: extracted.description },
        langs.slice(0, 30), // translate in batches of 30
      );
      if (langs.length > 30) {
        const batch2 = await translateWithClaude(
          { name: extracted.companyNameEn, description: extracted.description },
          langs.slice(30),
        );
        translations = { ...translations, ...batch2 };
      }
    } catch {
      // translations are optional, continue without them
    }

    // Step 4: Create vendor in DB
    const slug = slugify(extracted.companyNameEn) + '-' + Date.now().toString(36);

    // Create a user for this vendor
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
        email: extracted.email ?? null,
        phone: extracted.phone ?? null,
        city: extracted.city ?? null,
        yearEstablished: extracted.yearEstablished ?? null,
        employeeCount: extracted.employeeCount ?? null,
        sourceUrl: url,
        translations,
      },
    });

    // Step 5: Create products
    const products = [];
    for (const p of (extracted.products ?? []).slice(0, 20)) {
      const product = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          nameEn: p.nameEn,
          description: p.description ?? null,
          unit: p.unit ?? 'MT',
          hsCode: p.hsCode ?? null,
        },
      });
      products.push(product);
    }

    return NextResponse.json({
      success: true,
      vendor: { id: vendor.id, slug: vendor.slug, companyNameEn: vendor.companyNameEn },
      productsCount: products.length,
      translationsCount: Object.keys(translations).length,
      profileUrl: `/manufacturer/${vendor.slug}`,
    }, { status: 201 });

  } catch (err) {
    console.error('Import error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

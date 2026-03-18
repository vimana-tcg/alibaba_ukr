import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import ExportPage from '../ExportPage';

const LANG_NAMES: Record<string, string> = {
  en:'English', de:'Deutsch', fr:'Français', es:'Español', it:'Italiano',
  pl:'Polski', nl:'Nederlands', pt:'Português', ro:'Română', cs:'Čeština',
  hu:'Magyar', sv:'Svenska', da:'Dansk', fi:'Suomi', sk:'Slovenčina',
  bg:'Български', hr:'Hrvatski', el:'Ελληνικά', lt:'Lietuvių', lv:'Latviešu',
  et:'Eesti', ar:'العربية', zh:'中文', ja:'日本語', ko:'한국어',
  hi:'हिन्दी', tr:'Türkçe', vi:'Tiếng Việt', th:'ไทย', id:'Indonesia',
  ms:'Melayu', fa:'فارسی', he:'עברית', uk:'Українська', ru:'Русский',
  ka:'ქართული', az:'Azərbaycanca', kk:'Қазақша', uz:'O\'zbek',
  mn:'Монгол', bn:'বাংলা', ur:'اردو', ta:'தமிழ்', te:'తెలుగు',
  sw:'Kiswahili', am:'አማርኛ', sr:'Српски', sl:'Slovenščina',
  mk:'Македонски', sq:'Shqip',
};

async function getVendor(slug: string) {
  try {
    return await prisma.vendor.findUnique({
      where: { slug },
      include: { certifications: true, products: true },
    });
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string; lang: string } }): Promise<Metadata> {
  const vendor = await getVendor(params.slug);
  if (!vendor) return {};

  const translations = (vendor.translations as Record<string, { name: string; description: string }>) ?? {};
  const t = translations[params.lang];
  const name = t?.name ?? vendor.companyNameEn;
  const desc = t?.description ?? vendor.description ?? '';
  const langName = LANG_NAMES[params.lang] ?? params.lang.toUpperCase();

  const base = process.env.NEXTAUTH_URL ?? 'https://corevia-flow.vercel.app';
  const allLangs = ['en', ...Object.keys(translations)];
  const alternates: Record<string, string> = {};
  alternates['en'] = `${base}/manufacturer/${params.slug}`;
  for (const l of Object.keys(translations)) {
    alternates[l] = `${base}/manufacturer/${params.slug}/${l}`;
  }

  return {
    title: `${name} — Ukrainian Manufacturer | Corevia Flow`,
    description: desc,
    alternates: { languages: alternates },
    openGraph: {
      title: `${name} — Direct Export from Ukraine`,
      description: desc,
      locale: params.lang,
      alternateLocale: allLangs.filter(l => l !== params.lang),
    },
  };
}

export default async function VendorLangPage({ params }: { params: { slug: string; lang: string } }) {
  if (!LANG_NAMES[params.lang]) notFound();

  const vendor = await getVendor(params.slug);
  if (!vendor) notFound();

  const translations = (vendor.translations as Record<string, { name: string; description: string }>) ?? {};
  const translation = translations[params.lang] ?? null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: translation?.name ?? vendor.companyNameEn,
          description: translation?.description ?? vendor.description,
          address: { '@type': 'PostalAddress', addressCountry: 'UA', addressLocality: vendor.city },
          foundingDate: vendor.yearEstablished,
          url: vendor.website,
          inLanguage: params.lang,
        })}}
      />
      <ExportPage
        vendor={vendor as any}
        initialLang={params.lang}
        initialTranslation={translation}
      />
    </>
  );
}

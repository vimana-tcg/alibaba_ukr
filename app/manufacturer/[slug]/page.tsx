import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { prisma } from '@/lib/db';
import ExportPage from './ExportPage';

async function getVendor(slug: string) {
  try {
    return await prisma.vendor.findUnique({
      where: { slug },
      include: { certifications: true, products: true },
    });
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const vendor = await getVendor(params.slug);
  if (!vendor) return {};
  const desc = vendor.description ?? `Buy directly from ${vendor.companyNameEn}, a verified Ukrainian manufacturer. 0% EU import duty. Ships to 50+ countries.`;
  return {
    title: `${vendor.companyNameEn} — Ukrainian Manufacturer | Corevia Flow`,
    description: desc,
    openGraph: {
      title: `${vendor.companyNameEn} — Direct Export from Ukraine`,
      description: desc,
      type: 'website',
    },
  };
}

export default async function VendorProfilePage({ params }: { params: { slug: string } }) {
  const vendor = await getVendor(params.slug);
  if (!vendor) notFound();

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: vendor.companyNameEn,
          description: vendor.description,
          address: { '@type': 'PostalAddress', addressCountry: 'UA', addressLocality: vendor.city },
          foundingDate: vendor.yearEstablished,
          numberOfEmployees: vendor.employeeCount,
          url: vendor.website,
        })}}
      />
      <ExportPage vendor={vendor as any} />
    </>
  );
}

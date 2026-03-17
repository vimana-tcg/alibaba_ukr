import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SEED_HS_CODES, SEED_VENDORS } from '@/lib/seed-data';

export async function POST() {
  try {
    let hsCount = 0;
    for (const hs of SEED_HS_CODES) {
      await prisma.hsCode.upsert({
        where: { hsCode: hs.hsCode },
        update: {},
        create: hs,
      });
      hsCount++;
    }

    let vendorCount = 0;
    for (const v of SEED_VENDORS) {
      const { certifications, products, ...vendorData } = v;

      const user = await prisma.user.upsert({
        where: { email: `${vendorData.slug}@demo.com` },
        update: {},
        create: {
          email: `${vendorData.slug}@demo.com`,
          name: vendorData.companyNameEn,
          role: 'vendor',
        },
      });

      const existing = await prisma.vendor.findUnique({ where: { slug: vendorData.slug } });
      if (!existing) {
        const vendor = await prisma.vendor.create({
          data: { ...vendorData, userId: user.id },
        });
        for (const cert of certifications) {
          await prisma.vendorCertification.create({ data: { ...cert, vendorId: vendor.id } });
        }
        for (const product of products) {
          await prisma.product.create({ data: { ...product, vendorId: vendor.id } });
        }
        vendorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${hsCount} HS codes and ${vendorCount} vendors`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

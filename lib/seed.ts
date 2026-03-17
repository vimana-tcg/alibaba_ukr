import { prisma } from './db';
import { SEED_HS_CODES, SEED_VENDORS } from './seed-data';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // HS Codes
  for (const hs of SEED_HS_CODES) {
    await prisma.hsCode.upsert({
      where: { hsCode: hs.hsCode },
      update: {},
      create: hs,
    });
  }
  console.log(`✅ ${SEED_HS_CODES.length} HS codes seeded`);

  // Vendors
  for (const v of SEED_VENDORS) {
    const { certifications, products, ...vendorData } = v;

    const user = await prisma.user.upsert({
      where: { email: `${vendorData.slug}@demo.com` },
      update: {},
      create: {
        email: `${vendorData.slug}@demo.com`,
        name: vendorData.companyNameEn,
        role: 'vendor',
        passwordHash: await bcrypt.hash('demo1234', 10),
      },
    });

    const vendor = await prisma.vendor.upsert({
      where: { slug: vendorData.slug },
      update: {},
      create: { ...vendorData, userId: user.id },
    });

    for (const cert of certifications) {
      await prisma.vendorCertification.create({
        data: { ...cert, vendorId: vendor.id },
      });
    }

    for (const product of products) {
      await prisma.product.create({
        data: { ...product, vendorId: vendor.id },
      });
    }
  }
  console.log(`✅ ${SEED_VENDORS.length} vendors seeded`);

  // Demo buyer
  const buyerUser = await prisma.user.upsert({
    where: { email: 'buyer@demo.com' },
    update: {},
    create: {
      email: 'buyer@demo.com',
      name: 'Hans Mueller',
      role: 'buyer',
      passwordHash: await bcrypt.hash('demo1234', 10),
    },
  });
  await prisma.buyer.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: {
      userId: buyerUser.id,
      companyName: 'Mueller Trading GmbH',
      country: 'DE',
      kycStatus: 'approved',
    },
  });
  console.log('✅ Demo buyer seeded (buyer@demo.com / demo1234)');

  console.log('\n🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

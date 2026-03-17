import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const certType = searchParams.get('cert_type');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '12'), 50);
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (certType) where.certifications = { some: { certType } };

  try {
    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: { certifications: true },
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { companyNameEn: 'asc' },
      }),
      prisma.vendor.count({ where }),
    ]);

    return NextResponse.json({ data: vendors, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

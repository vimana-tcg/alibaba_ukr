import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { slug: params.slug },
      include: { certifications: true, products: true },
    });
    if (!vendor) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(vendor);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

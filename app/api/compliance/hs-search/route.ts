import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '8'), 20);

  if (q.length < 2) return NextResponse.json([]);

  try {
    const results = await prisma.hsCode.findMany({
      where: {
        OR: [
          { hsCode: { contains: q, mode: 'insensitive' } },
          { descriptionEn: { contains: q, mode: 'insensitive' } },
          { descriptionUa: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: { hsCode: true, descriptionEn: true, descriptionUa: true, chapter: true },
    });

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

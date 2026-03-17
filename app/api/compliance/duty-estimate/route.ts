import { NextRequest, NextResponse } from 'next/server';
import { calculateDuty } from '@/lib/duty-calculator';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hsCode = searchParams.get('hs_code') ?? '';
  const origin = searchParams.get('origin') ?? 'UA';
  const destination = searchParams.get('destination') ?? 'DE';
  const value = parseFloat(searchParams.get('value') ?? '0');
  const freight = parseFloat(searchParams.get('freight') ?? '0');
  const insurance = parseFloat(searchParams.get('insurance') ?? '0');

  if (!hsCode || value <= 0) {
    return NextResponse.json({ error: 'hs_code and value are required' }, { status: 400 });
  }

  // Look up HS description
  let hsDescription = 'Unknown product';
  try {
    const hs = await prisma.hsCode.findFirst({
      where: { hsCode: { contains: hsCode.replace(/\./g, '').slice(0, 6) } },
    });
    if (hs) hsDescription = hs.descriptionEn;
  } catch {}

  const result = calculateDuty({ hsCode, hsDescription, origin, destination, value, freight, insurance });
  return NextResponse.json(result);
}

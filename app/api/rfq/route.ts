import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

function generateRfqNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RFQ-${y}${m}${d}-${rand}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vendorId, items, destinationCountry, incoterm, currency, notes } = body;

    if (!vendorId || !items?.length) {
      return NextResponse.json({ error: 'vendorId and items are required' }, { status: 400 });
    }

    // Find or create a demo buyer
    let buyer = await prisma.buyer.findFirst();
    if (!buyer) {
      const user = await prisma.user.create({
        data: { email: `demo-${Date.now()}@demo.com`, name: 'Demo Buyer', role: 'buyer' },
      });
      buyer = await prisma.buyer.create({
        data: { userId: user.id, companyName: 'Demo Company', country: destinationCountry ?? 'DE' },
      });
    }

    const rfq = await prisma.rfq.create({
      data: {
        rfqNumber: generateRfqNumber(),
        buyerId: buyer.id,
        vendorId,
        status: 'submitted',
        destinationCountry: destinationCountry ?? 'DE',
        incoterm: incoterm ?? 'EXW',
        currency: currency ?? 'USD',
        notes: notes ?? '',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        items: {
          create: items.map((item: { productName: string; hsCode?: string; quantity: number; unit: string }) => ({
            productName: item.productName,
            hsCode: item.hsCode ?? null,
            quantity: Number(item.quantity),
            unit: item.unit ?? 'MT',
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ rfqNumber: rfq.rfqNumber, id: rfq.id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 50);

  try {
    const rfqs = await prisma.rfq.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { vendor: true, items: true, responses: true },
    });
    return NextResponse.json({ data: rfqs, total: rfqs.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

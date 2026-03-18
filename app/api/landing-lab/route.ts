import { NextRequest, NextResponse } from 'next/server';
import { runLandingLab } from '@/lib/landing-lab';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      companyName?: string;
      siteUrl?: string;
      industry?: string;
      audience?: string;
      offer?: string;
      notes?: string;
    };

    const companyName = body.companyName?.trim();

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: 'Company name is required.' },
        { status: 400 },
      );
    }

    const result = await runLandingLab({
      companyName,
      siteUrl: body.siteUrl?.trim(),
      industry: body.industry?.trim(),
      audience: body.audience?.trim(),
      offer: body.offer?.trim(),
      notes: body.notes?.trim(),
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Landing lab failed.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

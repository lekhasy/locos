import { NextResponse } from 'next/server';

export function GET() {
  return NextResponse.json({ error: 'Not implemented until Story 3.3' }, { status: 501 });
}

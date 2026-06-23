import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'No URL provided' }, { status: 400 });

    const res = await fetch(url, { redirect: 'follow' });
    return NextResponse.json({ url: res.url });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to expand URL' }, { status: 500 });
  }
}

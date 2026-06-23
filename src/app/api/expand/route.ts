import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    
    if (!url || (!url.includes("maps.app.goo.gl") && !url.includes("goo.gl/maps"))) {
      return NextResponse.json({ url });
    }

    // Expand the Google Maps short link by following the HTTP redirect
    const res = await fetch(url, { redirect: "follow" });
    return NextResponse.json({ url: res.url });
    
  } catch (error) {
    console.error("Failed to expand shortlink:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

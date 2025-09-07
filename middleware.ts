import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    // Allow token-based auth via query param for environments where headers can't be set
    const expected = process.env.API_KEY;
    const token = url.searchParams.get("token");
    if (expected && token === expected) {
      return NextResponse.next();
    }
    const apiKey = request.headers.get("x-api-key");
    if (!expected || apiKey !== expected) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" }, 
      });
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};



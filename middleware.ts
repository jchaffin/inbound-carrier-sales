import { NextResponse } from "next/server";

export function middleware(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) {
    const apiKey = request.headers.get("x-api-key");
    const expected = process.env.API_KEY;
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



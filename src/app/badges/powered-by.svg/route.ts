import { NextResponse } from "next/server";

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="48" role="img" aria-label="Powered by AgentLink">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect rx="9" width="240" height="48" fill="url(#bg)"/>
  <rect rx="9" x="1" y="1" width="238" height="46" fill="none" stroke="#334155"/>
  <text x="14" y="30" fill="#e2e8f0" font-family="ui-sans-serif,system-ui,-apple-system" font-size="13" font-weight="700">Powered by AgentLink Discovery</text>
</svg>`;

export async function GET() {
  return new NextResponse(SVG, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}

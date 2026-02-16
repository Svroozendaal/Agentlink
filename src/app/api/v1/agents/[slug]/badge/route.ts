import { NextRequest, NextResponse } from "next/server";

import { getAgentDiscoveryInsights } from "@/lib/services/discovery";

function renderBadgeSvg(input: { label: string; value: string }) {
  const width = 320;
  const height = 56;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${input.label}: ${input.value}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
  </defs>
  <rect rx="10" width="${width}" height="${height}" fill="url(#bg)"/>
  <rect rx="10" x="1" y="1" width="${width - 2}" height="${height - 2}" fill="none" stroke="#334155"/>
  <text x="16" y="23" fill="#e2e8f0" font-family="ui-sans-serif,system-ui,-apple-system" font-size="12" font-weight="600">Powered by AgentLink</text>
  <text x="16" y="42" fill="#7dd3fc" font-family="ui-sans-serif,system-ui,-apple-system" font-size="14" font-weight="700">${input.value}</text>
  <circle cx="${width - 24}" cy="20" r="6" fill="#22c55e"/>
</svg>`;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const insight = await getAgentDiscoveryInsights(slug);

    const svg = renderBadgeSvg({
      label: "Discovery this week",
      value: `${insight.discoveredThisWeek} discoveries this week`,
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    const fallback = renderBadgeSvg({
      label: "Powered by AgentLink",
      value: "Dynamic discovery enabled",
    });
    return new NextResponse(fallback, {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=600",
      },
    });
  }
}

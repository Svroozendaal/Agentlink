import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const agent = await db.agentProfile.findUnique({
    where: { slug },
    select: {
      name: true,
      averageRating: true,
      reviewCount: true,
      isVerified: true,
    },
  });

  if (!agent) {
    return new NextResponse("Not found", { status: 404 });
  }

  const rating = agent.reviewCount > 0 ? agent.averageRating.toFixed(1) : "new";
  const verified = agent.isVerified ? "Verified" : "Unverified";
  const label = `AgentLink | ${escapeXml(agent.name)} | ${rating} | ${verified}`;
  const width = Math.max(380, label.length * 7);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="28" role="img" aria-label="${label}">
  <rect width="${width}" height="28" fill="#111827" rx="6"/>
  <text x="12" y="19" fill="#f9fafb" font-family="Verdana, sans-serif" font-size="12">${label}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}


import { NextResponse } from "next/server";

import { getDiscoveryFilterOptions } from "@/lib/services/search";

export async function GET() {
  const filters = await getDiscoveryFilterOptions();

  return NextResponse.json({
    data: {
      categories: filters.categories,
    },
  });
}

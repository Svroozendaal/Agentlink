import { Role } from "@prisma/client";
import type { NextRequest } from "next/server";

import { getAuthContext } from "@/lib/auth/get-auth-context";
import { AgentServiceError } from "@/lib/services/agents";

export async function requireAdmin(req: NextRequest) {
  const authContext = await getAuthContext(req);
  if (!authContext) {
    throw new AgentServiceError(401, "UNAUTHORIZED", "Authentication required");
  }

  if (authContext.user.role !== Role.ADMIN) {
    throw new AgentServiceError(403, "FORBIDDEN", "Admin access required");
  }

  return authContext;
}


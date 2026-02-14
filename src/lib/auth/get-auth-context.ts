import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";

import { authOptions } from "@/lib/auth";
import { validateApiKey } from "@/lib/auth/api-keys";

export type AuthMethod = "api-key" | "session";

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  role: Role;
}

export interface AuthContext {
  user: AuthenticatedUser;
  method: AuthMethod;
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const authorizationHeader = req.headers.get("authorization");

  if (authorizationHeader?.startsWith("Bearer ")) {
    const token = authorizationHeader.replace("Bearer ", "").trim();

    if (token.length > 0) {
      const validatedKey = await validateApiKey(token);
      if (validatedKey) {
        return {
          user: validatedKey.user,
          method: "api-key",
        };
      }
    }
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? null,
      name: session.user.name ?? null,
      image: session.user.image ?? null,
      role: session.user.role ?? Role.USER,
    },
    method: "session",
  };
}

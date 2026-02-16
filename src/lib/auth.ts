import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";

const githubClientId = process.env.GITHUB_CLIENT_ID ?? process.env.GITHUB_ID ?? "";
const githubClientSecret =
  process.env.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_SECRET ?? "";
const isProduction = process.env.NODE_ENV === "production";
const cookiePrefix = isProduction ? "__Secure-agentlink.v2" : "agentlink.v2";

if (
  process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_ID &&
  process.env.GITHUB_CLIENT_ID !== process.env.GITHUB_ID
) {
  console.warn(
    "[auth] GITHUB_CLIENT_ID and GITHUB_ID differ. Using GITHUB_CLIENT_ID for GitHub OAuth.",
  );
}

if (
  process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_SECRET &&
  process.env.GITHUB_CLIENT_SECRET !== process.env.GITHUB_SECRET
) {
  console.warn(
    "[auth] GITHUB_CLIENT_SECRET and GITHUB_SECRET differ. Using GITHUB_CLIENT_SECRET for GitHub OAuth.",
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    GitHubProvider({
      clientId: githubClientId,
      clientSecret: githubClientSecret,
    }),
  ],
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  useSecureCookies: isProduction,
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: `${cookiePrefix}.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    state: {
      name: `${cookiePrefix}.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
    nonce: {
      name: `${cookiePrefix}.nonce`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    async session({ session, user }) {
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { referralCode: true },
      });

      if (!dbUser?.referralCode) {
        const referralCode = `AL${randomBytes(4).toString("hex").toUpperCase()}`;
        await db.user.update({
          where: { id: user.id },
          data: { referralCode },
        });
      }

      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role ?? Role.USER;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

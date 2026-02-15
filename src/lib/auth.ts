import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import { randomBytes } from "crypto";

import { db } from "@/lib/db";

const githubClientId = process.env.GITHUB_ID ?? process.env.GITHUB_CLIENT_ID ?? "";
const githubClientSecret =
  process.env.GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET ?? "";

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

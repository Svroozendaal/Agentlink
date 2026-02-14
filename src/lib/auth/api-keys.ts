import { createHash, randomBytes } from "crypto";

import type { Role } from "@prisma/client";

import { db } from "@/lib/db";

const API_KEY_PREFIX = "al_";
const API_KEY_PREFIX_PREVIEW_LENGTH = 10;
const API_KEY_RANDOM_BYTES = 32;

export interface GenerateApiKeyInput {
  userId: string;
  name: string;
  scopes?: string[];
  expiresAt?: Date | null;
}

export interface GeneratedApiKey {
  id: string;
  key: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  expiresAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
}

export interface ValidApiKeyContext {
  apiKeyId: string;
  scopes: string[];
  user: ApiKeyUser;
}

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

function createPlaintextApiKey(): string {
  const random = randomBytes(API_KEY_RANDOM_BYTES).toString("hex");
  return `${API_KEY_PREFIX}${random}`;
}

export async function generateApiKey(input: GenerateApiKeyInput): Promise<GeneratedApiKey> {
  const key = createPlaintextApiKey();
  const keyHash = hashApiKey(key);
  const keyPrefix = key.slice(0, API_KEY_PREFIX_PREVIEW_LENGTH);

  const apiKey = await db.apiKey.create({
    data: {
      userId: input.userId,
      name: input.name,
      keyHash,
      keyPrefix,
      scopes: input.scopes ?? [],
      expiresAt: input.expiresAt ?? null,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return {
    id: apiKey.id,
    key,
    keyPrefix: apiKey.keyPrefix,
    name: apiKey.name,
    scopes: apiKey.scopes,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
}

export async function listApiKeysForUser(userId: string) {
  return db.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function validateApiKey(key: string): Promise<ValidApiKeyContext | null> {
  if (!key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(key);
  const now = new Date();

  const apiKey = await db.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          role: true,
        },
      },
    },
  });

  if (!apiKey) {
    return null;
  }

  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: now },
  });

  return {
    apiKeyId: apiKey.id,
    scopes: apiKey.scopes,
    user: {
      id: apiKey.user.id,
      email: apiKey.user.email,
      name: apiKey.user.name,
      image: apiKey.user.image,
      role: apiKey.user.role,
    },
  };
}

export async function revokeApiKey(id: string, userId: string): Promise<boolean> {
  const revoked = await db.apiKey.updateMany({
    where: {
      id,
      userId,
      isActive: true,
    },
    data: {
      isActive: false,
    },
  });

  return revoked.count > 0;
}

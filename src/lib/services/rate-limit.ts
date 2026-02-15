interface BucketState {
  count: number;
  resetAt: number;
}

const bucketStore = new Map<string, BucketState>();

export class RateLimitError extends Error {
  status: number;
  code: string;

  constructor(message = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
    this.status = 429;
    this.code = "RATE_LIMITED";
  }
}

function nowMs() {
  return Date.now();
}

function makeKey(bucket: string, identifier: string) {
  return `${bucket}:${identifier}`;
}

function cleanupExpired(maxSize = 5_000) {
  if (bucketStore.size < maxSize) {
    return;
  }

  const now = nowMs();
  for (const [key, value] of bucketStore.entries()) {
    if (value.resetAt <= now) {
      bucketStore.delete(key);
    }
  }
}

export function assertRateLimit(input: {
  bucket: string;
  identifier: string;
  max: number;
  windowMs: number;
}) {
  cleanupExpired();

  const key = makeKey(input.bucket, input.identifier);
  const now = nowMs();
  const existing = bucketStore.get(key);

  if (!existing || existing.resetAt <= now) {
    bucketStore.set(key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return;
  }

  if (existing.count >= input.max) {
    throw new RateLimitError();
  }

  existing.count += 1;
  bucketStore.set(key, existing);
}


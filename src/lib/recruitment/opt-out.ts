import { RecruitmentStatus } from "@prisma/client";

import { db } from "@/lib/db";
import { domainFromUrl, domainOptOutCandidates } from "@/lib/recruitment/utils";

function whereForDomain(domain: string) {
  return {
    OR: [
      { targetUrl: { contains: `://${domain}` } },
      { contactUrl: { contains: `://${domain}` } },
      { targetUrl: { contains: domain } },
      { contactUrl: { contains: domain } },
    ],
  };
}

export async function createRecruitmentOptOut(input: { domain: string; reason?: string }) {
  const normalizedDomain = domainFromUrl(input.domain);

  const record = await db.recruitmentOptOut.upsert({
    where: { domain: normalizedDomain },
    update: {
      reason: input.reason,
    },
    create: {
      domain: normalizedDomain,
      reason: input.reason,
    },
  });

  await db.recruitmentAttempt.updateMany({
    where: {
      ...whereForDomain(normalizedDomain),
      status: {
        not: RecruitmentStatus.OPTED_OUT,
      },
    },
    data: {
      status: RecruitmentStatus.OPTED_OUT,
      nextRetryAt: null,
      errorMessage: "Domain opted out from automated recruitment",
    },
  });

  return record;
}

export async function isDomainOptedOut(urlOrDomain: string) {
  const candidates = domainOptOutCandidates(urlOrDomain);
  const optOut = await db.recruitmentOptOut.findFirst({
    where: {
      domain: { in: candidates },
    },
    select: { domain: true },
  });

  return Boolean(optOut);
}

export async function checkOptOutDomain(domain: string) {
  const normalizedDomain = domainFromUrl(domain);
  const optedOut = await db.recruitmentOptOut.findUnique({
    where: { domain: normalizedDomain },
    select: { id: true },
  });

  return {
    domain: normalizedDomain,
    optedOut: Boolean(optedOut),
  };
}

export async function listOptOutDomains() {
  return db.recruitmentOptOut.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function removeOptOutDomain(domain: string) {
  const normalizedDomain = domainFromUrl(domain);

  try {
    await db.recruitmentOptOut.delete({
      where: { domain: normalizedDomain },
    });
    return true;
  } catch {
    return false;
  }
}

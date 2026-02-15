import { RecruitmentStatus } from "@prisma/client";

import { stringifyUnknown } from "@/lib/recruitment/utils";

export type ResponseConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface ResponseAnalysis {
  intent: RecruitmentStatus | "UNKNOWN";
  confidence: ResponseConfidence;
  interested: boolean;
  optedOut: boolean;
}

const INTEREST_SIGNALS = ["registered", "accepted", "thanks", "thank you", "welcome"];
const OPTOUT_SIGNALS = ["unsubscribe", "opt-out", "stop", "do not contact", "dont contact"];

function containsAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

export function analyzeResponse(response: unknown, statusCode?: number | null): ResponseAnalysis {
  const safeStatus = statusCode ?? 0;
  const responseStr = stringifyUnknown(response).toLowerCase();

  if (safeStatus === 200 || safeStatus === 201 || safeStatus === 202) {
    if (containsAny(responseStr, INTEREST_SIGNALS)) {
      return {
        intent: RecruitmentStatus.INTERESTED,
        confidence: "HIGH",
        interested: true,
        optedOut: false,
      };
    }

    return {
      intent: RecruitmentStatus.DELIVERED,
      confidence: "MEDIUM",
      interested: false,
      optedOut: false,
    };
  }

  if (safeStatus === 403 || safeStatus === 405) {
    return {
      intent: RecruitmentStatus.DECLINED,
      confidence: "MEDIUM",
      interested: false,
      optedOut: false,
    };
  }

  if (safeStatus === 410) {
    return {
      intent: RecruitmentStatus.OPTED_OUT,
      confidence: "HIGH",
      interested: false,
      optedOut: true,
    };
  }

  if (containsAny(responseStr, OPTOUT_SIGNALS)) {
    return {
      intent: RecruitmentStatus.OPTED_OUT,
      confidence: "HIGH",
      interested: false,
      optedOut: true,
    };
  }

  if (safeStatus === 404 || safeStatus >= 500) {
    return {
      intent: RecruitmentStatus.FAILED,
      confidence: "HIGH",
      interested: false,
      optedOut: false,
    };
  }

  if (safeStatus >= 400) {
    return {
      intent: RecruitmentStatus.FAILED,
      confidence: "MEDIUM",
      interested: false,
      optedOut: false,
    };
  }

  return {
    intent: "UNKNOWN",
    confidence: "LOW",
    interested: false,
    optedOut: false,
  };
}

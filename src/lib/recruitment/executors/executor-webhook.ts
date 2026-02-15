import { contactViaRest } from "@/lib/recruitment/executors/executor-rest";
import type { ContactResult } from "@/lib/recruitment/types";

export async function contactViaWebhook(targetUrl: string, payload: object): Promise<ContactResult> {
  return contactViaRest(targetUrl, payload);
}

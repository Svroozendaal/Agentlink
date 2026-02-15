import type { ContactResult } from "@/lib/recruitment/types";

export async function contactViaEmailApi(
  _recipientDomain: string,
  _payload: object,
): Promise<ContactResult> {
  return {
    success: false,
    sent: false,
    error: "EMAIL_API executor is not configured in this deployment",
  };
}

import { useState } from "react";
import { submitNetlifyForm } from "@/lib/netlifyForm";
import { trackEvent } from "@/lib/analytics";

export type SubmissionStatus = "idle" | "submitting" | "success" | "error";

/** Estado de envío compartido por los formularios comerciales: evita dobles envíos y expone el resultado. */
export function useFormSubmission(formName: string) {
  const [status, setStatus] = useState<SubmissionStatus>("idle");

  async function submit(fields: Record<string, string>) {
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      await submitNetlifyForm(formName, fields);
      setStatus("success");
      trackEvent("form_submitted", { form: formName });
    } catch {
      setStatus("error");
    }
  }

  return { status, submit, reset: () => setStatus("idle") };
}

import { useRef, useState } from "react";
import { FormSubmissionError, submitForm, type FormKind, type FormPayload } from "@/lib/formEndpoint";
import { trackEvent } from "@/lib/analytics";

export type SubmissionStatus = "idle" | "submitting" | "success" | "error";

/**
 * Estado de envío compartido por los formularios comerciales: evita dobles envíos, mide cuánto tardó la persona en
 * llenarlo (el admin descarta los envíos instantáneos) y distingue el límite de envíos de cualquier otro error.
 */
export function useFormSubmission(kind: FormKind) {
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [limited, setLimited] = useState(false);
  const startedAt = useRef(performance.now());

  async function submit(payload: FormPayload) {
    if (status === "submitting") return;
    setStatus("submitting");
    setLimited(false);
    try {
      await submitForm(kind, payload, performance.now() - startedAt.current);
      setStatus("success");
      trackEvent("form_submitted", { form: kind });
    } catch (error) {
      setLimited(error instanceof FormSubmissionError && error.status === 429);
      setStatus("error");
    }
  }

  function reset() {
    startedAt.current = performance.now();
    setStatus("idle");
  }

  return { status, limited, submit, reset };
}

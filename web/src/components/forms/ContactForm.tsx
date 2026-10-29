import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/FormField";
import { Honeypot } from "@/components/forms/Honeypot";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import {
  contactSubjectOptions,
  hasErrors,
  validateContactMessage,
  type ContactMessage,
  type FieldErrors,
} from "@/lib/validation";
import { site } from "@/config/site";

export const CONTACT_FORM_NAME = "contacto";

export function ContactForm() {
  const [values, setValues] = useState<ContactMessage>({ name: "", email: "", subject: "", message: "", consent: false });
  const [botField, setBotField] = useState("");
  const [errors, setErrors] = useState<FieldErrors<ContactMessage>>({});
  const { status, submit, reset } = useFormSubmission(CONTACT_FORM_NAME);

  function update<K extends keyof ContactMessage>(key: K, value: ContactMessage[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateContactMessage(values);
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    await submit({
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject,
      message: values.message.trim(),
      consent: "si",
      "bot-field": botField,
    });
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">
          <p className="font-medium">Mensaje enviado.</p>
          <p className="mt-1 text-text-muted">
            Te respondo a <strong className="text-text">{values.email}</strong> lo antes posible.
          </p>
        </Alert>
        <Button variant="secondary" onClick={reset} className="self-start">
          Enviar otro mensaje
        </Button>
      </div>
    );
  }

  return (
    <form name={CONTACT_FORM_NAME} onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-5">
      <Honeypot value={botField} onChange={setBotField} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TextField
          label="Nombre"
          name="name"
          autoComplete="name"
          required
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          error={errors.name}
        />
        <TextField
          label="Correo electrónico"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
        />
      </div>

      <SelectField
        label="Asunto"
        name="subject"
        required
        value={values.subject}
        onChange={(e) => update("subject", e.target.value)}
        error={errors.subject}
      >
        <option value="">Selecciona un asunto</option>
        {contactSubjectOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        label="Mensaje"
        name="message"
        required
        rows={6}
        value={values.message}
        onChange={(e) => update("message", e.target.value)}
        error={errors.message}
      />

      <CheckboxField
        name="consent"
        checked={values.consent}
        onChange={(e) => update("consent", e.target.checked)}
        error={errors.consent}
        label={
          <>
            Acepto que {site.brand.name} use estos datos solo para responder a este mensaje, según el{" "}
            <Link to="/privacidad" className="text-text underline">
              aviso de privacidad
            </Link>
            .
          </>
        }
      />

      {status === "error" && (
        <Alert variant="error">
          No se pudo enviar el mensaje. Inténtalo de nuevo o escribe directamente a{" "}
          <a href={`mailto:${site.contact.email}`} className="underline">
            {site.contact.email}
          </a>
          .
        </Alert>
      )}

      <Button type="submit" size="lg" isLoading={status === "submitting"} className="self-start">
        {status === "submitting" ? "Enviando…" : "Enviar mensaje"}
      </Button>
    </form>
  );
}

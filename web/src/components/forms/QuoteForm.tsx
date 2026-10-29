import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/FormField";
import { Honeypot } from "@/components/forms/Honeypot";
import { useFormSubmission } from "@/hooks/useFormSubmission";
import {
  budgetOptions,
  hasErrors,
  projectTypeOptions,
  timelineOptions,
  validateQuoteRequest,
  type FieldErrors,
  type QuoteRequest,
} from "@/lib/validation";
import { site } from "@/config/site";

export const QUOTE_FORM_NAME = "cotizacion";

export function QuoteForm({ products, initialProductSlug = "" }: { products: Product[]; initialProductSlug?: string }) {
  const validInitial = products.some((p) => p.slug === initialProductSlug) ? initialProductSlug : "";

  const [values, setValues] = useState<QuoteRequest>({
    name: "",
    email: "",
    company: "",
    product: validInitial,
    projectType: validInitial ? "producto-catalogo" : "",
    problem: "",
    budget: "",
    timeline: "",
    consent: false,
  });
  const [botField, setBotField] = useState("");
  const [errors, setErrors] = useState<FieldErrors<QuoteRequest>>({});
  const { status, submit, reset } = useFormSubmission(QUOTE_FORM_NAME);

  function update<K extends keyof QuoteRequest>(key: K, value: QuoteRequest[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationErrors = validateQuoteRequest(
      values,
      products.map((p) => p.slug),
    );
    setErrors(validationErrors);
    if (hasErrors(validationErrors)) return;

    await submit({
      name: values.name.trim(),
      email: values.email.trim(),
      company: values.company.trim(),
      product: values.product,
      projectType: values.projectType,
      problem: values.problem.trim(),
      budget: values.budget,
      timeline: values.timeline,
      consent: "si",
      "bot-field": botField,
    });
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <Alert variant="success">
          <p className="font-medium">Recibí tu solicitud.</p>
          <p className="mt-1 text-text-muted">
            La reviso personalmente y te respondo a <strong className="text-text">{values.email}</strong> con preguntas
            sobre el alcance o una primera propuesta. Normalmente en uno o dos días hábiles.
          </p>
        </Alert>
        <Button variant="secondary" onClick={reset} className="self-start">
          Enviar otra solicitud
        </Button>
      </div>
    );
  }

  return (
    <form name={QUOTE_FORM_NAME} onSubmit={handleSubmit} noValidate className="relative flex flex-col gap-5">
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

      <TextField
        label="Empresa o proyecto"
        name="company"
        autoComplete="organization"
        hint="Opcional."
        value={values.company}
        onChange={(e) => update("company", e.target.value)}
        error={errors.company}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField
          label="Tipo de proyecto"
          name="projectType"
          required
          value={values.projectType}
          onChange={(e) => update("projectType", e.target.value)}
          error={errors.projectType}
        >
          <option value="">Selecciona una opción</option>
          {projectTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Producto de referencia"
          name="product"
          hint="Opcional, si tu solicitud parte de un producto del catálogo."
          value={values.product}
          onChange={(e) => update("product", e.target.value)}
          error={errors.product}
        >
          <option value="">Ninguno en particular</option>
          {products.map((product) => (
            <option key={product.slug} value={product.slug}>
              {product.name}
            </option>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        label="¿Qué problema quieres resolver?"
        name="problem"
        required
        rows={6}
        hint="Cuéntame cómo lo resuelves hoy, quién lo usaría y qué te gustaría que pasara. Mínimo 20 caracteres."
        value={values.problem}
        onChange={(e) => update("problem", e.target.value)}
        error={errors.problem}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <SelectField
          label="Presupuesto orientativo"
          name="budget"
          required
          value={values.budget}
          onChange={(e) => update("budget", e.target.value)}
          error={errors.budget}
        >
          <option value="">Selecciona una opción</option>
          {budgetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Plazo deseado"
          name="timeline"
          required
          value={values.timeline}
          onChange={(e) => update("timeline", e.target.value)}
          error={errors.timeline}
        >
          <option value="">Selecciona una opción</option>
          {timelineOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
      </div>

      <CheckboxField
        name="consent"
        checked={values.consent}
        onChange={(e) => update("consent", e.target.checked)}
        error={errors.consent}
        label={
          <>
            Acepto que {site.brand.name} use estos datos solo para responder a esta solicitud, según el{" "}
            <Link to="/privacidad" className="text-text underline">
              aviso de privacidad
            </Link>
            .
          </>
        }
      />

      {status === "error" && (
        <Alert variant="error">
          No se pudo enviar la solicitud. Revisa tu conexión e inténtalo de nuevo, o escribe directamente a{" "}
          <a href={`mailto:${site.contact.email}`} className="underline">
            {site.contact.email}
          </a>
          .
        </Alert>
      )}

      {hasErrors(errors) && (
        <p role="alert" className="text-sm text-danger">
          Revisa los campos marcados antes de enviar.
        </p>
      )}

      <Button type="submit" size="lg" isLoading={status === "submitting"} className="self-start">
        {status === "submitting" ? "Enviando…" : "Enviar solicitud"}
      </Button>
    </form>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getProducts } from "@/lib/catalog";
import type { Product } from "@/types/product";
import { Container } from "@/components/ui/Container";
import { QuoteForm } from "@/components/forms/QuoteForm";
import { CheckList } from "@/components/product/InfoList";
import { Eyebrow } from "@/components/ui/SectionHeading";

const projectTypes = [
  { title: "Aplicaciones web", description: "Paneles de gestión, portales de clientes y herramientas internas." },
  { title: "Aplicaciones móviles", description: "Apps para Android e iOS conectadas a tus datos." },
  { title: "Automatizaciones", description: "Procesos repetitivos entre formularios, hojas de cálculo, correo y sistemas." },
  { title: "Integraciones con APIs", description: "Conectar tu sistema con pasarelas, servicios de terceros o software existente." },
  { title: "Adaptación de un producto", description: "Tomar un producto del catálogo y ajustarlo a tu caso." },
];

const process = [
  { title: "Me cuentas el problema", description: "Con el formulario de abajo: contexto, cómo lo resuelves hoy, presupuesto y plazo orientativos." },
  { title: "Reviso y pregunto", description: "Leo tu solicitud y, si hace falta, agendamos una llamada corta para entender el alcance real." },
  { title: "Propuesta concreta", description: "Te envío qué incluye, qué no, en qué fases, en cuánto tiempo aproximado y a qué costo." },
  { title: "Desarrollo por entregas", description: "Trabajo en entregas pequeñas que puedes revisar, en lugar de una sola entrega al final." },
];

const scope = [
  "Análisis del problema y propuesta técnica",
  "Diseño de interfaz y experiencia de uso",
  "Desarrollo, pruebas y despliegue",
  "Documentación de uso y traspaso",
  "Mantenimiento y soporte, si se acuerda",
];

export function CustomDevelopmentPage() {
  useDocumentHead({
    title: "Desarrollo a medida",
    description:
      "Aplicaciones, automatizaciones e integraciones diseñadas para tu negocio. Cuéntame el problema y recibe una propuesta con alcance, tiempos y costo.",
    path: "/desarrollo-a-medida",
  });

  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  return (
    <>
      <section>
        <Container className="pb-12 pt-14 sm:pt-20">
          <Eyebrow>Desarrollo a medida</Eyebrow>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-balance text-text sm:text-5xl">
            Software diseñado para tu caso, no al revés
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pretty text-text-muted">
            Si ningún producto del catálogo encaja, desarrollo aplicaciones, automatizaciones e integraciones a partir
            de tu problema real. No doy precios ni fechas cerradas sin entender antes el alcance: la primera respuesta
            siempre es una conversación, no una cifra.
          </p>
        </Container>
      </section>

      <section className="py-14">
        <Container>
          <h2 className="text-xl font-semibold text-text">Qué tipo de proyectos</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectTypes.map((type) => (
              <div key={type.title} className="rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-text">{type.title}</h3>
                <p className="mt-1.5 text-sm text-text-muted">{type.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-text">Cómo trabajamos</h2>
            <ol className="mt-6 flex flex-col gap-6">
              {process.map((step, index) => (
                <li key={step.title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-muted text-sm font-semibold text-brand">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-semibold text-text">{step.title}</h3>
                    <p className="mt-1 text-sm text-text-muted">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text">Alcance del servicio</h2>
            <p className="mt-2 text-sm text-text-muted">Según el proyecto, puede incluir:</p>
            <div className="mt-6">
              <CheckList items={scope} />
            </div>
          </div>
        </Container>
      </section>

      <section id="cotizar" className="py-14">
        <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-xl font-semibold text-text">Solicita una cotización</h2>
            <p className="mt-3 text-sm text-text-muted">
              Cuanto más concreto seas sobre el problema, más útil será la primera respuesta. El presupuesto y el plazo
              son orientativos: sirven para proponerte algo realista, no te comprometen a nada.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-surface/60 p-5 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-text">Qué pasa después</h3>
              <p className="mt-1.5 text-sm text-text-muted">
                Reviso la solicitud personalmente y te respondo por correo con preguntas sobre el alcance o una primera
                propuesta. No hay pagos ni compromisos en este paso.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface/80 p-6 shadow-card backdrop-blur-sm sm:p-8">
            {products ? (
              <QuoteForm products={products} initialProductSlug={searchParams.get("producto") ?? ""} />
            ) : (
              <div aria-busy="true" aria-label="Cargando formulario" className="h-96 animate-pulse rounded-md bg-bg" />
            )}
          </div>
        </Container>
      </section>
    </>
  );
}

export default CustomDevelopmentPage;

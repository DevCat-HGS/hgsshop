import { Link } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/layout/Logo";
import { allPhotos } from "@/components/product/categoryPhotos";
import { site } from "@/config/site";

const columns = [
  {
    title: "Producto",
    links: [
      { to: "/productos", label: "Catálogo" },
      { to: "/demos/devpanel", label: "Demo de DevPanel" },
      { to: "/desarrollo-a-medida", label: "Desarrollo a medida" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { to: "/contacto", label: "Contacto" },
      { to: site.owner.portfolioUrl, label: "Portafolio", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacidad", label: "Aviso de privacidad" },
      { to: "/terminos", label: "Términos del servicio" },
    ],
  },
];

const currentYear = new Date().getFullYear();
const linkClasses = "text-sm text-text-muted transition-colors hover:text-text";

/** S10 · Footer. En la portada es el destino del último scroll, tras el cierre (snap-end). */
export function Footer() {
  return (
    <footer className="relative snap-end border-t border-border bg-bg/70 backdrop-blur-sm">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent" aria-hidden="true" />
      <Container className="grid grid-cols-2 gap-10 py-16 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="col-span-2 flex flex-col gap-4 md:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-pretty text-text-muted">{site.brand.tagline}.</p>
          <a href={`mailto:${site.contact.email}`} className="text-[13px] text-text-muted transition-colors hover:text-brand">
            {site.contact.email}
          </a>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-text-subtle">{column.title}</p>
            <ul className="flex flex-col gap-2.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  {"external" in link && link.external ? (
                    <a href={link.to} target="_blank" rel="noreferrer" className={linkClasses}>
                      {link.label} ↗
                    </a>
                  ) : (
                    <Link to={link.to} className={linkClasses}>
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </Container>

      <Container className="flex flex-col gap-2 border-t border-border py-6 text-[12px] text-text-subtle sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {currentYear} {site.owner.name}
        </p>
        <p className="flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
          Catálogo en desarrollo activo
        </p>
      </Container>

      {/* Créditos de las fotografías de archivo, como piden sus licencias. */}
      <Container className="pb-8">
        <p className="max-w-5xl text-[12px] leading-relaxed text-text-subtle">
          Fotografías de archivo:{" "}
          {allPhotos.map((photo, index) => (
            <span key={photo.credit.page}>
              <a href={photo.credit.page} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text">
                {photo.credit.title}
              </a>
              {photo.credit.author ? `, ${photo.credit.author}` : ""},{" "}
              <a href={photo.credit.licenseUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-text">
                {photo.credit.license.toLowerCase()}
              </a>
              , vía Wikimedia Commons{index < allPhotos.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>
      </Container>
    </footer>
  );
}

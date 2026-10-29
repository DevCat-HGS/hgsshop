import { useEffect } from "react";
import { site } from "@/config/site";

interface DocumentHeadOptions {
  title: string;
  description: string;
  /** Ruta sin dominio, ej. "/productos/stockflow". Se usa para canonical y og:url. */
  path: string;
  image?: string;
  noindex?: boolean;
}

function setMeta(attr: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

/**
 * Actualiza título, metadescripción, canonical y Open Graph al navegar entre rutas.
 * La aplicación es una SPA sin SSR: los motores de búsqueda que no ejecutan JavaScript no verán
 * estos valores en el HTML inicial. Es una limitación real, documentada en ARCHITECTURE.md junto
 * con la mejora futura (prerenderizado o SSR) para no afirmar una indexación que no existe.
 */
export function useDocumentHead({ title, description, path, image, noindex }: DocumentHeadOptions) {
  useEffect(() => {
    const fullTitle = `${title} · ${site.brand.name}`;
    const url = `${site.url}${path}`;

    document.title = fullTitle;
    setMeta("name", "description", description);
    setMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
    setLink("canonical", url);

    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", site.brand.name);
    if (image) setMeta("property", "og:image", image);

    setMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", description);
  }, [title, description, path, image, noindex]);
}

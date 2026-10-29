// Archivo de configuración de rutas, no de componentes: el aviso de Fast Refresh no aplica aquí.
/* eslint-disable react/only-export-components */
import { lazy, Suspense, type ReactNode } from "react";
import { createBrowserRouter, Outlet, ScrollRestoration } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SpinnerIcon } from "@/components/icons";

// La portada va en el bundle inicial; el resto de páginas se descargan al visitarlas.
const CatalogPage = lazy(() => import("@/pages/CatalogPage"));
const ProductDetailPage = lazy(() => import("@/pages/ProductDetailPage"));
const DemoPage = lazy(() => import("@/pages/DemoPage"));
const CustomDevelopmentPage = lazy(() => import("@/pages/CustomDevelopmentPage"));
const ContactPage = lazy(() => import("@/pages/ContactPage"));
const PrivacyPage = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("@/pages/LegalPages").then((m) => ({ default: m.TermsPage })));

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-32 text-text-subtle" aria-busy="true" aria-label="Cargando página">
      <SpinnerIcon className="size-5" />
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<PageFallback />}>{node}</Suspense>;
}

function Root() {
  return (
    <>
      <ScrollRestoration />
      <Outlet />
    </>
  );
}

/** Mantener sincronizado con las rutas de `netlify.toml` y con `scripts/generate-sitemap.ts`. */
export const router = createBrowserRouter([
  {
    element: <Root />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: "/", element: <HomePage /> },
          { path: "/productos", element: withSuspense(<CatalogPage />) },
          { path: "/productos/:slug", element: withSuspense(<ProductDetailPage />) },
          { path: "/desarrollo-a-medida", element: withSuspense(<CustomDevelopmentPage />) },
          { path: "/contacto", element: withSuspense(<ContactPage />) },
          { path: "/privacidad", element: withSuspense(<PrivacyPage />) },
          { path: "/terminos", element: withSuspense(<TermsPage />) },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
      // Las demos son aplicaciones a pantalla completa: sin la cabecera ni el pie del sitio.
      { path: "/demos/:slug", element: withSuspense(<DemoPage />) },
    ],
  },
]);

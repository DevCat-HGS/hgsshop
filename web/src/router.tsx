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

/** Mantener sincronizado con las rutas de `netlify.toml` y `public/sitemap.xml`. */
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
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

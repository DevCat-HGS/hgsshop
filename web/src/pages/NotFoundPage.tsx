import { useLocation } from "react-router-dom";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  const { pathname } = useLocation();

  useDocumentHead({
    title: "Página no encontrada",
    description: "La página que buscas no existe o fue movida.",
    path: pathname,
    noindex: true,
  });

  return (
    <Container className="flex flex-col items-center gap-4 py-28 text-center">
      <p className="text-sm font-semibold text-brand">Error 404</p>
      <h1 className="font-display text-[length:var(--text-step-head)] text-text">Esta página no existe</h1>
      <p className="max-w-md text-base text-text">
        Puede que el enlace esté mal escrito o que el producto haya sido retirado del catálogo.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <Button to="/productos">Ir al catálogo</Button>
        <Button to="/" variant="secondary">
          Volver al inicio
        </Button>
      </div>
    </Container>
  );
}

export default NotFoundPage;

import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SiteBackground } from "@/components/background/SiteBackground";

export function Layout() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col">
      <SiteBackground />
      <a href="#main-content" className="skip-link rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-contrast">
        Saltar al contenido principal
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

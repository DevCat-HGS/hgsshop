import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";
import { MenuIcon, CloseIcon } from "@/components/icons";

const navLinks = [
  { to: "/productos", label: "Productos" },
  { to: "/desarrollo-a-medida", label: "Desarrollo a medida" },
  { to: "/contacto", label: "Contacto" },
];

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return `relative rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 ${
    isActive ? "text-text" : "text-text-muted hover:text-text"
  }`;
}

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();
  const [menuPathname, setMenuPathname] = useState(pathname);

  // Cerrar el menú móvil al navegar (también con atrás/adelante del navegador).
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors duration-200 ${
        isScrolled || isMenuOpen ? "border-border bg-bg/75 backdrop-blur-xl" : "border-transparent bg-transparent"
      }`}
    >
      <Container className="flex h-16 items-center justify-between gap-6">
        <NavLink to="/" aria-label="HGS Digital, inicio" className="rounded-md">
          <Logo />
        </NavLink>

        <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClasses}>
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && <span className="absolute inset-x-3 -bottom-[13px] h-px bg-brand" aria-hidden="true" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button to="/desarrollo-a-medida" size="sm">
            Solicitar cotización
          </Button>
        </div>

        <button
          type="button"
          className="-mr-2 rounded-md p-2 text-text md:hidden"
          aria-expanded={isMenuOpen}
          aria-controls="mobile-nav"
          aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
        </button>
      </Container>

      {isMenuOpen && (
        <nav id="mobile-nav" aria-label="Navegación principal (móvil)" className="border-t border-border md:hidden">
          <Container className="flex flex-col gap-1 py-4">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-3 text-base font-medium ${isActive ? "bg-surface text-text" : "text-text-muted"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <Button to="/desarrollo-a-medida" className="mt-3">
              Solicitar cotización
            </Button>
          </Container>
        </nav>
      )}
    </header>
  );
}

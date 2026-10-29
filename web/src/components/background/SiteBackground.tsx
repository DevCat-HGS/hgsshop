import { AmbientParticles } from "@/components/background/AmbientParticles";

/** Fondo fijo de todo el sitio: aurora azul submarina, partículas en suspensión y grano fino de película. */
export function SiteBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      <div className="aurora-blob aurora-blob--a left-[-10%] top-[-20%] h-[60vh] w-[60vw] bg-depth/70" />
      <div className="aurora-blob aurora-blob--b right-[-15%] top-[5%] h-[50vh] w-[50vw] bg-brand/[0.13]" />
      <div className="aurora-blob aurora-blob--c bottom-[-25%] left-[20%] h-[45vh] w-[45vw] bg-accent/[0.06]" />
      <div className="bg-grain absolute inset-0" />
      <AmbientParticles className="absolute inset-0" />
      {/* Viñeta inferior: mantiene el contenido legible a medida que se hace scroll. */}
      <div /* taste-skill-ignore: fondo atmosférico pedido por la marca */ className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/40 to-bg/90" />
    </div>
  );
}

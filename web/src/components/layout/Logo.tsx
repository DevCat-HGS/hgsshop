import { site } from "@/config/site";

/** Isotipo: hexágono facetado, en eco con el loader low-poly. La faceta menta es el único acento. */
export function LogoMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2 28.12 9 16 16Z" fill="#a9cbff" />
      <path d="M28.12 9v14L16 16Z" fill="#6ea8ff" />
      <path d="M28.12 23 16 30V16Z" fill="#3366a8" />
      <path d="M16 30 3.88 23 16 16Z" fill="#1d3b68" />
      <path d="M3.88 23V9L16 16Z" fill="#48d6b0" />
      <path d="M3.88 9 16 2v14Z" fill="#4178c2" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark />
      <span className="font-display text-xl text-text">
        {site.brand.shortName}
        <span className="text-text-muted"> Digital</span>
      </span>
    </span>
  );
}

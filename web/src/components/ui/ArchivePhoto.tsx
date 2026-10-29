import type { CategoryPhoto } from "@/components/product/categoryPhotos";

/**
 * Fotografía de archivo con el tratamiento único del sitio: monocromo virado al azul de la paleta
 * (luminosidad de la foto sobre Ocean Blue), para que imágenes de épocas y colores distintos se lean
 * como una serie. El pie dice qué es la foto; el crédito completo va en el footer.
 */
export function ArchivePhoto({
  photo,
  className = "",
  imgClassName = "",
  caption = false,
  eager = false,
}: {
  photo: CategoryPhoto;
  className?: string;
  imgClassName?: string;
  caption?: boolean;
  eager?: boolean;
}) {
  return (
    <figure className={`relative overflow-hidden bg-depth ${className}`}>
      <img
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={photo.alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={`size-full object-cover opacity-85 mix-blend-luminosity ${imgClassName}`}
      />
      {caption && (
        <figcaption className="absolute bottom-0 left-0 right-0 bg-bg/80 px-4 py-2.5 text-[13px] text-text-muted">{photo.caption}</figcaption>
      )}
    </figure>
  );
}

import { useEffect, useRef } from "react";
import type { ProductClip } from "@/components/product/productClips";

/** Bucle mudo, sin controles. Con movimiento reducido no arranca solo: muestra el póster y controles. */
export function ProductVideo({ clip, className = "" }: { clip: ProductClip; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const video = ref.current;
    if (!video || reducedMotion) return;
    // Solo se reproduce mientras está en pantalla: no gasta batería ni CPU fuera de vista.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });
    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <figure className={className}>
      <video
        ref={ref}
        muted
        loop
        playsInline
        preload="metadata"
        poster={clip.poster}
        width={clip.width}
        height={clip.height}
        controls={reducedMotion}
        aria-label={clip.caption}
        className="h-auto w-full rounded-sm bg-bg"
      >
        <source src={clip.webm} type="video/webm" />
        <source src={clip.mp4} type="video/mp4" />
      </video>
      <figcaption className="mt-3 text-[15px] text-text-muted">{clip.caption}</figcaption>
    </figure>
  );
}

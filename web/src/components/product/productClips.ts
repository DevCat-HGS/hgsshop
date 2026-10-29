import devpanelMp4 from "@/assets/media/devpanel-demo.mp4";
import devpanelWebm from "@/assets/media/devpanel-demo.webm";
import devpanelPoster from "@/assets/media/devpanel-demo.jpg";

/**
 * Videos reales de producto, por slug. Son grabaciones de la demo funcionando (design/scripts/
 * grabar-demo-devpanel.mjs), no animaciones hechas aparte. Viven en la capa de UI y no en src/data
 * porque son archivos que Vite empaqueta.
 */
export interface ProductClip {
  webm: string;
  mp4: string;
  poster: string;
  width: number;
  height: number;
  caption: string;
}

const clips: Partial<Record<string, ProductClip>> = {
  devpanel: {
    webm: devpanelWebm,
    mp4: devpanelMp4,
    poster: devpanelPoster,
    width: 1248,
    height: 520,
    caption: "Grabación real de la demo: crear una tarea, avanzarla y filtrar por proyecto.",
  },
};

export function clipFor(slug: string): ProductClip | undefined {
  return clips[slug];
}


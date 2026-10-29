import taskproMp4 from "@/assets/media/taskpro-demo.mp4";
import taskproWebm from "@/assets/media/taskpro-demo.webm";
import taskproPoster from "@/assets/media/taskpro-demo.jpg";

/**
 * Videos reales de producto, por slug. Son grabaciones de la demo funcionando (design/scripts/
 * grabar-demo-taskpro.mjs), no animaciones hechas aparte. Viven en la capa de UI y no en src/data
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
  taskpro: {
    webm: taskproWebm,
    mp4: taskproMp4,
    poster: taskproPoster,
    width: 1280,
    height: 720,
    caption: "Grabación real de la demo: crear una tarea, medir su tiempo y convertir las horas en una cuenta de cobro.",
  },
};

export function clipFor(slug: string): ProductClip | undefined {
  return clips[slug];
}


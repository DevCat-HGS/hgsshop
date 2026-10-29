import inventario from "@/assets/photos/inventario-tienda-1910.webp";
import agendas from "@/assets/photos/agendas-centralita-telefonica.webp";
import educacion from "@/assets/photos/educacion-meccano.webp";
import dev from "@/assets/photos/dev-eniac-1946.webp";
import automatizacion from "@/assets/photos/automatizacion-tarjetas-jacquard.webp";

/**
 * Una fotografía real del mundo de cada categoría, de archivos abiertos (dominio público, CC0 o sin
 * restricciones de copyright conocidas).
 * Muestran el oficio que el software ordena hoy, nunca el producto: por eso cada una lleva su pie de
 * foto y su crédito (footer). Fuentes y licencias: src/assets/photos/credits.json.
 */
export interface CategoryPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
  credit: { title: string; author?: string; license: string; licenseUrl: string; page: string };
}

const photos: Record<string, CategoryPhoto> = {
  "inventario-y-operaciones": {
    src: inventario,
    width: 1400,
    height: 997,
    alt: "Interior de una tienda de abarrotes de 1910, con estanterías llenas de latas y frascos hasta el techo y un mostrador de madera.",
    caption: "Tienda de abarrotes de E. J. Shantz, 1910",
    credit: {
      title: "Interior of E.J. Shantz Grocery store, Frederick Street, Berlin",
      license: "Dominio público",
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      page: "https://commons.wikimedia.org/wiki/File:Interior_of_E.J._Shantz_Grocery_store,_Frederick_Street,_Berlin.jpg",
    },
  },
  "agendas-y-clientes": {
    src: agendas,
    width: 1400,
    height: 1112,
    alt: "Hilera de operadoras con auriculares conectando llamadas en una central telefónica de Bell System, bajo un letrero de rutas a Norte y Sudamérica.",
    caption: "Operadoras de una central telefónica de Bell System",
    credit: {
      title: "Photograph of Women Working at a Bell System Telephone Switchboard",
      author: "The U.S. National Archives",
      license: "Sin restricciones de copyright conocidas",
      licenseUrl: "https://www.flickr.com/commons/usage/",
      page: "https://commons.wikimedia.org/wiki/File:Photograph_of_Women_Working_at_a_Bell_System_Telephone_Switchboard_(3660047829).jpg",
    },
  },
  educacion: {
    src: educacion,
    width: 1400,
    height: 1050,
    alt: "Caja roja de Meccano abierta, con sus piezas metálicas perforadas para construir mecanismos.",
    caption: "Juego de construcción Meccano",
    credit: {
      title: "Vintage Meccano Accessory Outfit 2a box and set pieces",
      author: "Wiki.cullin",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
      page: "https://commons.wikimedia.org/wiki/File:Vintage_Meccano_Accessory_Outfit_2a_box_and_set_pieces.jpg",
    },
  },
  "herramientas-dev": {
    src: dev,
    width: 1400,
    height: 961,
    alt: "Dos programadoras configuran el ENIAC en 1946, entre paneles de cables y conmutadores.",
    caption: "Programadoras del ENIAC, 1946",
    credit: {
      title: "Two women operating ENIAC",
      author: "Fotógrafo no identificado del Ejército de EE. UU.",
      license: "Dominio público",
      licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/",
      page: "https://commons.wikimedia.org/wiki/File:Two_women_operating_ENIAC_(full_resolution).jpg",
    },
  },
  automatizacion: {
    src: automatizacion,
    width: 1050,
    height: 1400,
    alt: "Tarjetas perforadas de un telar Jacquard encadenadas: cada fila de agujeros indica qué hilos levantar.",
    caption: "Tarjetas perforadas de un telar Jacquard",
    credit: {
      title: "Jacquard loom cards",
      author: "Robert-brook",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en",
      page: "https://commons.wikimedia.org/wiki/File:Jacquard_loom_cards.jpg",
    },
  },
};

export function photoFor(categorySlug: string): CategoryPhoto | undefined {
  return photos[categorySlug];
}

export const allPhotos = Object.values(photos);

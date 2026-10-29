import { categories } from "@/data/categories";
import { products } from "@/data/products";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";

/**
 * Única puerta de entrada al catálogo. Hoy lee de `src/data/*` (arrays estáticos); el día que
 * exista un panel administrativo con base de datos, solo este archivo cambia — ninguna página
 * importa `src/data` directamente. Las funciones son asíncronas a propósito, para que la UI ya
 * maneje el estado de carga real que tendrá cuando esto llame a una API.
 */

export interface ProductFilters {
  query?: string;
  categorySlug?: string;
  status?: Product["status"];
}

// Palabras que no ayudan a encontrar nada: "inventario para mi tienda" busca "inventario" y "tienda".
const STOPWORDS = new Set(
  "a al algo como con de del el en es esa ese esta este hay la las lo los mas mi mis muy para pero por que se sin su sus tu tus un una unos unas y ya o necesito quiero busco".split(" "),
);

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Raíz corta para que "automatizar" encuentre "automatización" y "tiendas" encuentre "tienda". Las palabras
 * cortas no pierden la "s": "pos" no debe quedar en "po".
 */
function stem(word: string): string {
  if (word.length > 6) return word.slice(0, 6);
  return word.length > 3 ? word.replace(/s$/, "") : word;
}

export function queryTerms(query: string): string[] {
  return normalize(query)
    .split(/[^a-z0-9ñ]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

/** Cuántos términos de la búsqueda aparecen en el producto (0 = no coincide). */
function relevance(product: Product, terms: string[]): number {
  const category = categories.find((c) => c.slug === product.categorySlug);
  const words = normalize(
    [product.name, product.shortDescription, product.problem, product.audience, product.features.join(" "), category?.name ?? "", category?.description ?? ""].join(" "),
  ).split(/[^a-z0-9ñ]+/);
  // Por comienzo de palabra, no por subcadena: "ia" no debe coincidir dentro de "diaria" ni "nada" en "coordinadas".
  return terms.filter((term) => words.some((word) => word.startsWith(term))).length;
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let result = [...products];

  if (filters.categorySlug) {
    result = result.filter((p) => p.categorySlug === filters.categorySlug);
  }

  if (filters.status) {
    result = result.filter((p) => p.status === filters.status);
  }

  const terms = queryTerms(filters.query ?? "");
  if (terms.length > 0) {
    // Más términos coincidentes primero; a igual relevancia se respeta el orden del catálogo.
    result = result
      .map((product) => ({ product, score: relevance(product, terms) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.product);
  }

  return Promise.resolve(result);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return Promise.resolve(products.find((p) => p.slug === slug));
}

export async function getRelatedProducts(product: Product): Promise<Product[]> {
  if (!product.relatedSlugs?.length) return Promise.resolve([]);
  const related = product.relatedSlugs
    .map((slug) => products.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));
  return Promise.resolve(related);
}

export async function getCategories(): Promise<Category[]> {
  return Promise.resolve([...categories]);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return Promise.resolve(categories.find((c) => c.slug === slug));
}


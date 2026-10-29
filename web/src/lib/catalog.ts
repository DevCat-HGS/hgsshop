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

function matchesQuery(product: Product, query: string): boolean {
  const haystack = `${product.name} ${product.shortDescription} ${product.features.join(" ")}`.toLowerCase();
  return haystack.includes(query.trim().toLowerCase());
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  let result = [...products];

  if (filters.categorySlug) {
    result = result.filter((p) => p.categorySlug === filters.categorySlug);
  }

  if (filters.status) {
    result = result.filter((p) => p.status === filters.status);
  }

  if (filters.query && filters.query.trim().length > 0) {
    result = result.filter((p) => matchesQuery(p, filters.query!));
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


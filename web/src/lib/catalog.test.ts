import { describe, expect, it } from "vitest";
import { categories } from "@/data/categories";
import { products } from "@/data/products";
import { inAppDemos } from "@/demos/registry";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";

describe("integridad del catálogo", () => {
  it("los slugs son únicos y aptos para URL", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("cada producto pertenece a una categoría existente", () => {
    const known = new Set(categories.map((c) => c.slug));
    for (const product of products) expect(known.has(product.categorySlug)).toBe(true);
  });

  it("los productos relacionados apuntan a productos existentes y no a sí mismos", () => {
    const known = new Set(products.map((p) => p.slug));
    for (const product of products) {
      for (const related of product.relatedSlugs ?? []) {
        expect(known.has(related)).toBe(true);
        expect(related).not.toBe(product.slug);
      }
    }
  });

  it("ninguna demo interna se anuncia sin estar implementada", () => {
    for (const product of products) {
      if (product.demo?.url.startsWith("/demos/")) expect(inAppDemos[product.slug]).toBeDefined();
    }
  });

  it("un producto no disponible declara al menos una limitación conocida", () => {
    for (const product of products.filter((p) => p.status !== "available")) {
      expect(product.limitations.length).toBeGreaterThan(0);
    }
  });
});

describe("búsqueda y filtros", () => {
  it("filtra por texto sin distinguir mayúsculas", async () => {
    const result = await getProducts({ query: "INVENTARIO" });
    expect(result.map((p) => p.slug)).toContain("stockflow");
  });

  it("combina categoría y estado", async () => {
    const result = await getProducts({ categorySlug: "herramientas-dev", status: "in_development" });
    expect(result.every((p) => p.categorySlug === "herramientas-dev" && p.status === "in_development")).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("entiende frases: ignora palabras vacías, acentos y variaciones", async () => {
    expect((await getProducts({ query: "inventario para mi tienda" }))[0].slug).toBe("stockflow");
    expect((await getProducts({ query: "academia de robótica" }))[0].slug).toBe("roboacademy");
    expect((await getProducts({ query: "agenda de citas" }))[0].slug).toBe("clientia");
    expect((await getProducts({ query: "automatizar reportes" })).map((p) => p.slug)).toContain("flowauto");
  });

  it("compara por comienzo de palabra, no por subcadena", async () => {
    expect(await getProducts({ query: "ia" })).toEqual([]);
    expect((await getProducts({ query: "pos" })).length).toBeLessThan(5);
  });

  it("ordena por relevancia: más términos coincidentes primero", async () => {
    const result = await getProducts({ query: "inventario pedidos tienda" });
    expect(result[0].slug).toBe("stockflow");
  });

  it("una búsqueda solo de palabras vacías no filtra nada", async () => {
    expect(await getProducts({ query: "para de la" })).toHaveLength(products.length);
  });

  it("solo coincide al inicio de una palabra", async () => {
    expect((await getProducts({ query: "nada" })).map((p) => p.slug)).not.toContain("comanda");
  });

  it("devuelve vacío cuando nada coincide", async () => {
    expect(await getProducts({ query: "zzz-sin-coincidencias" })).toEqual([]);
  });

  it("resuelve productos relacionados", async () => {
    const product = await getProductBySlug("stockflow");
    const related = await getRelatedProducts(product!);
    expect(related.map((p) => p.slug)).toEqual(product!.relatedSlugs);
  });
});

describe("formatPrice", () => {
  it("no inventa precio cuando requiere cotización", () => {
    expect(formatPrice({ type: "quote", amount: 100, currency: "USD" })).toBe("Precio bajo cotización");
  });

  it("formatea precios 'desde' con periodo", () => {
    expect(formatPrice({ type: "from", amount: 20, currency: "USD", period: "monthly" })).toMatch(/^Desde .*20.* \/ mes$/);
  });
});

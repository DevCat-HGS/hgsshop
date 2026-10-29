import { useEffect, useState } from "react";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getCategories, getProducts } from "@/lib/catalog";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { Portada } from "@/components/home/Portada";
import { Buscador } from "@/components/home/Buscador";
import { Categorias } from "@/components/home/Categorias";
import { Productos } from "@/components/home/Productos";
import { Demo } from "@/components/home/Demo";
import { Proceso } from "@/components/home/Proceso";
import { CustomDevCta } from "@/components/home/CustomDevCta";
import { HomeFaq } from "@/components/home/HomeFaq";

export function HomePage() {
  useDocumentHead({
    title: "Software a medida para negocios",
    description:
      "Catálogo de aplicaciones y herramientas de software: inventario, agendas, educación, productividad para desarrolladores y automatización. Estado real, demos y desarrollo a medida.",
    path: "/",
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
    getProducts().then(setProducts);
  }, []);

  return (
    <>
      <Portada products={products} />
      <Buscador />
      <Categorias categories={categories} products={products} />
      <Productos products={products} />
      <Demo products={products} />
      <Proceso />
      <CustomDevCta />
      <HomeFaq />
    </>
  );
}

export default HomePage;

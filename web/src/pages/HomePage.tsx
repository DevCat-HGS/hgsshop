import { useEffect, useState } from "react";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { useSlideDeck } from "@/hooks/useSlideDeck";
import { getCategories, getProducts } from "@/lib/catalog";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { Portada } from "@/components/home/Portada";
import { Buscador } from "@/components/home/Buscador";
import { Categorias } from "@/components/home/Categorias";
import { Productos } from "@/components/home/Productos";
import { Demo } from "@/components/home/Demo";
import { Proceso } from "@/components/home/Proceso";
import { Entregados } from "@/components/home/Entregados";
import { AMedida } from "@/components/home/AMedida";
import { Preguntas } from "@/components/home/Preguntas";
import { ScrollLine } from "@/components/layout/ScrollLine";

export function HomePage() {
  useDocumentHead({
    title: "Software a medida para negocios",
    description:
      "Catálogo de aplicaciones y herramientas de software: inventario, agendas, educación, productividad para desarrolladores y automatización. Estado real, demos y desarrollo a medida.",
    path: "/",
  });

  useSlideDeck();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    getCategories().then(setCategories);
    getProducts().then(setProducts);
  }, []);

  // Las ideas en exploración no existen todavía: la portada muestra lo construido y las enlaza aparte.
  const built = products.filter((p) => p.status !== "idea");
  const ideaCount = products.length - built.length;

  return (
    <>
      <Portada products={built} ideaCount={ideaCount} />
      <Buscador />
      <Categorias categories={categories} products={products} />
      <Productos products={built} ideaCount={ideaCount} />
      <Demo products={products} />
      <Proceso />
      <Entregados />
      <AMedida />
      <Preguntas />
      <ScrollLine />
    </>
  );
}

export default HomePage;

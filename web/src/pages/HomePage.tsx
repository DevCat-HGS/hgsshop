import { useEffect, useState } from "react";
import { useDocumentHead } from "@/hooks/useDocumentHead";
import { getCategories, getProducts } from "@/lib/catalog";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { Portada } from "@/components/home/Portada";
import { Buscador } from "@/components/home/Buscador";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { DemoSpotlight } from "@/components/home/DemoSpotlight";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CustomDevCta } from "@/components/home/CustomDevCta";
import { HomeFaq } from "@/components/home/HomeFaq";

const FEATURED_COUNT = 3;

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
      <CategoryGrid categories={categories} products={products} />
      <FeaturedProducts products={products.slice(0, FEATURED_COUNT)} />
      <DemoSpotlight products={products} />
      <HowItWorks />
      <CustomDevCta />
      <HomeFaq />
    </>
  );
}

export default HomePage;

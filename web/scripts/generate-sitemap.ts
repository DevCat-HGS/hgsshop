// Genera dist/sitemap.xml a partir del catálogo real (src/data), para que nunca liste un producto que
// no existe ni olvide uno nuevo. Las demos no se incluyen: son entornos de prueba marcados noindex.
// Se ejecuta con el soporte de TypeScript de Node (los archivos de datos solo tienen imports de tipos).
import { writeFileSync } from "node:fs";
import { products } from "../src/data/products.ts";
import { site } from "../src/config/site.ts";

const staticPaths = ["/", "/productos", "/desarrollo-a-medida", "/contacto", "/privacidad", "/terminos"];
const productPaths = products.map((product) => `/productos/${product.slug}`);

const urls = [...staticPaths, ...productPaths]
  .map((path) => `  <url><loc>${site.url}${path}</loc></url>`)
  .join("\n");

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(new URL("../dist/sitemap.xml", import.meta.url), xml);
console.log(`sitemap.xml: ${staticPaths.length + productPaths.length} URLs`);

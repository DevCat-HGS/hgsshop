# HGS Shop

Código público de [shop.hgsportafolio.site](https://shop.hgsportafolio.site): la tienda de servicios y soluciones de software de Harol Guerrero Salgado.

Este repositorio es un **espejo de solo lectura**. El trabajo ocurre en un repositorio privado y un bot copia aquí la parte pública con cada cambio en `main`, así que el historial es el del espejo, no el del desarrollo. Los issues y PR no se atienden aquí; para contacto, [hgsportafolio.site](https://hgsportafolio.site).

## Qué hay

| Ruta | Qué es |
| :-- | :-- |
| `web/` | La tienda: React, TypeScript, Vite y Tailwind CSS. Se despliega en Netlify. |
| `.github/workflows/ci.yml` | Lint, verificación de tipos y build en cada cambio. Las Actions están apagadas en este espejo: el workflow está para leerse. |

## Correrlo en local

```bash
cd web
npm ci
npm run dev
```

---

Public, read-only mirror of the code behind shop.hgsportafolio.site. Development happens in a private repository; a bot copies the public part here on every change.

# Arquitectura de HGS Digital

Plataforma comercial para presentar, demostrar y vender productos de software. Este documento recoge las
decisiones importantes, el estado real de cada parte y lo que falta. Si el código y este documento no
coinciden, el documento está desactualizado: corrígelo en el mismo cambio.

## Resumen

| Capa | Hoy (MVP, fase 1) | Cuándo cambia |
| :-- | :-- | :-- |
| Interfaz | React 19 + TypeScript + Vite 8, SPA | SSR/prerender si la indexación lo exige (ver SEO) |
| Estilos | Tailwind CSS 4, tokens en `src/index.css` | — |
| Rutas | `react-router-dom` 7, una ruta = un chunk | — |
| Catálogo | Datos tipados en `src/data/`, leídos solo vía `src/lib/catalog.ts` | Fase 2: base de datos + panel |
| Formularios | Netlify Forms (envío real, sin backend propio) | Fase 2: backend propio con la misma validación |
| Demos | Registro en `src/demos/registry.ts`; DevPanel corre en la app | Demos pesadas: subdominio propio |
| Analítica | Capa sin proveedor (`src/lib/analytics.ts`), no envía nada | Al elegir proveedor respetuoso con la privacidad |
| Pagos | **No existen** | Fase 4, con demanda validada |
| Despliegue | Netlify (`netlify.toml`), Base directory `web` | — |

Dependencias de runtime: `react`, `react-dom`, `react-router-dom`, `@fontsource/inter`,
`@fontsource/jetbrains-mono`. Nada más: iconos en SVG inline (`src/components/icons.tsx`) y animaciones
en CSS. Cada dependencia nueva debe justificarse aquí.

## Estructura de `src/`

```
config/site.ts          marca, dominio, contacto: la única fuente de esos valores
types/                  modelo de datos (Product, Category)
data/                   contenido del catálogo (productos, categorías, FAQ generales)
lib/catalog.ts          única puerta de entrada al catálogo (async a propósito)
lib/validation.ts       reglas de formularios, puras: reutilizables en un backend
lib/format.ts           etiquetas de estado, línea de vida, formato de precio
lib/netlifyForm.ts      envío a Netlify Forms
lib/analytics.ts        eventos comerciales, sin proveedor
hooks/                  useDocumentHead (SEO por ruta), useFormSubmission
components/ui/          sistema de diseño: Button, StatusBadge, FormField, Accordion…
components/product/     tarjeta, filtros, línea de vida, ilustraciones por categoría
components/home/        secciones de la portada
components/background/  fondo animado (aurora, partículas, retícula)
components/forms/       formularios de cotización y contacto
demos/                  demos que corren dentro de la app + su registro
boot/                   loader de arranque (CSS + retirada)
pages/                  una página por ruta
router.tsx              rutas; mantener sincronizado con netlify.toml y el sitemap
```

## Modelo de datos

`Product` (`src/types/product.ts`) está pensado para sobrevivir al paso a base de datos sin cambios de forma:

- `status`: `prototype` → `in_development` → `available`, más `quote_required` para servicios a medida.
  La interfaz se adapta al estado (CTA "Contratar" solo si está disponible, aviso de etapa si no).
- `commercialModels`: `purchase`, `subscription`, `custom`. Un producto puede admitir varios.
- `pricing`: `quote` (sin precio publicado), `fixed` o `from`, con moneda y periodo. `formatPrice` nunca
  muestra una cifra si el tipo es `quote`, aunque exista `amount`.
- `demo` opcional: URL, instrucciones, nivel de aislamiento y limitaciones. Sin `demo`, la interfaz dice
  claramente que no hay demo y ofrece una sesión guiada.
- `limitations`: obligatorio y no vacío para todo producto no disponible (lo verifica un test).
- `isSampleContent`: marca contenido ilustrativo que debe revisarse antes del lanzamiento comercial.

Las pruebas de `src/lib/catalog.test.ts` protegen la integridad: slugs únicos, categorías existentes,
relacionados válidos, ninguna demo interna anunciada sin implementar.

## Sistema visual

- **Paleta** (`docs/marca/paleta.md` en el repositorio privado): Midnight Navy `#080D18` de fondo, Deep Navy `#101B30` en
  superficies, Ocean Blue `#1D3B68` para profundidad, Ice Blue `#6EA8FF` para acciones, Emerald Mint
  `#48D6B0` solo como detalle, Cloud White `#F3F7FF` y Steel Blue `#A9B6CB` para texto. Proporción
  orientativa 75 / 20 / 5.
- **Accesibilidad del color:** el texto sobre Ice Blue es navy (`--color-brand-contrast`), no blanco: el
  blanco da ~2.4:1 y falla WCAG AA; el navy da ~8.7:1.
- **Lenguaje propio:** la honestidad sobre el estado es el diferencial, así que es el elemento visual
  central: tablero de estado en la portada, línea de vida en tarjetas y fichas, insignias con punto de
  estado. Cada categoría tiene color y motivo SVG (`categoryVisuals.tsx`).
- **Ilustraciones, no capturas falsas:** sin UI real que mostrar, se usan motivos abstractos rotulados
  "Ilustración · sin capturas reales aún". Cuando haya capturas, se cargan en `screenshots` y sustituyen
  la ilustración automáticamente.
- **Movimiento:** aurora en CSS (solo `transform`), partículas en un canvas que se pausa con la pestaña
  oculta. Con `prefers-reduced-motion` todo queda estático y el loader no se muestra.

## Loader de arranque

Origen: `docs/marca/recursos/loader-ciervo.md` en el repositorio privado (figura de ciervo low-poly, Uiverse). Se integró sin `styled-components` y con los
colores remapeados a la paleta (los 103 recorridos de los fragmentos se conservan). Está como HTML estático
en `index.html` para verse desde el primer pintado; `src/boot/dismissBootLoader.ts` lo retira cuando la app
montó y las fuentes cargaron, con un mínimo de 1,6 s medido desde el inicio de la navegación (en
conexiones lentas no añade espera). Si el JavaScript falla, una animación CSS lo retira a los 12 s; sin
JavaScript no se muestra.

Coste: su CSS (~27 KB sin comprimir) viaja en la hoja principal, que es render-blocking. Si el LCP lo
resiente, la primera palanca es bajar `MIN_VISIBLE_MS`.

## Formularios

Cotización (`/desarrollo-a-medida`) y contacto (`/contacto`). Flujo:

1. Validación en cliente con `src/lib/validation.ts` (longitudes, correo, valores de lista cerrada,
   consentimiento). Un valor de `<select>` manipulado se rechaza.
2. Envío por `fetch` a Netlify Forms. Netlify detecta los formularios en el HTML del build, por eso
   `index.html` contiene copias ocultas con los mismos nombres de campo. **Si cambias un campo en React,
   cámbialo también en `index.html`.**
3. Antispam: campo trampa `bot-field` (`netlify-honeypot`) y el filtro de spam propio de Netlify.
4. Estados: validación por campo, envío con botón bloqueado (sin dobles envíos), éxito con el siguiente
   paso explicado, error sin perder lo escrito y con el correo como alternativa.

**Limitación:** Netlify Forms no valida campos en el servidor. Hasta que exista un backend, la validación
es solo de cliente; las reglas ya son funciones puras para importarlas allí. Tampoco hay rate limiting
propio más allá del de Netlify.

## Demos

`src/demos/registry.ts` asocia un slug de producto con una demo que corre dentro de la app (cargada bajo
demanda). Una demo desplegada aparte no se registra: basta con que `product.demo.url` sea absoluta.

Criterio para elegir: demos ligeras y sin backend → dentro de la app (como DevPanel). Demos con backend,
base de datos o autenticación → despliegue propio en un subdominio (`demo-<producto>.…`), con su propia
base de datos de prueba que se reinicia, nunca compartiendo datos ni credenciales con producción.

La demo de DevPanel es 100 % local: estado de React, sin red ni almacenamiento; recargar la reinicia. Las
páginas `/demos/*` llevan `noindex` (meta y cabecera `X-Robots-Tag`) y están fuera del sitemap.

## SEO

- Título, descripción, canonical y Open Graph por ruta con `useDocumentHead`. `index.html` trae valores
  por defecto para quien no ejecuta JavaScript.
- `robots.txt` estático; `sitemap.xml` generado en el build desde `src/data` (`scripts/generate-sitemap.ts`),
  así no puede listar un producto que no existe.
- **404 reales:** `netlify.toml` solo sirve la app con 200 en las rutas conocidas; cualquier otra URL recibe
  `404.html` (copia de `index.html`) con estado 404 real.

**Limitaciones abiertas:**
- Es una SPA sin SSR. Google ejecuta JavaScript y verá títulos y contenido; otros buscadores y las
  vistas previas de redes sociales ven solo los metadatos por defecto de `index.html`. Si las fichas de
  producto deben posicionar o compartirse con vista previa propia, el siguiente paso es prerenderizar
  las rutas del catálogo en el build.
- Un slug inexistente bajo `/productos/*` responde 200 (el servidor no conoce el catálogo); la app muestra
  la página 404 con `noindex`. Se resuelve junto con el prerender.
- No hay datos estructurados (schema.org): se añadirán solo cuando haya precios y disponibilidad reales.

## Seguridad

- CSP estricta en `netlify.toml`: scripts y estilos del propio origen, sin `unsafe-inline` en scripts,
  fuentes autoalojadas (por eso Inter y JetBrains Mono van por `@fontsource` y no por Google Fonts).
  Además HSTS, `X-Frame-Options: DENY`, `nosniff`, `Permissions-Policy` y `Referrer-Policy`.
- No hay secretos en el cliente ni variables de entorno todavía; por eso no existe `.env.example`. El
  día que haya backend, sus secretos van en variables de entorno del proveedor, nunca con prefijo `VITE_`
  (todo lo `VITE_*` acaba en el bundle público).
- Los formularios piden consentimiento explícito y enlazan el aviso de privacidad, que describe lo que se
  recoge de verdad.
- El espejo público solo publica `web/` (allowlist en `.github/mirror/build.sh`) y falla si aparece un
  `server/`, `.env*`, `.pem` o `.key`.

Riesgos abiertos: validación solo de cliente; sin rate limiting propio; los textos legales son un borrador
que debe revisar un profesional antes del lanzamiento comercial.

## Analítica

`trackEvent` ya se llama en `product_viewed`, `demo_opened` y `form_submitted`, sin datos personales. Hoy
solo escribe en consola en desarrollo. Para activarla: elegir un proveedor sin cookies (Plausible, Umami…),
implementarlo en `src/lib/analytics.ts` y ampliar `script-src`/`connect-src` en la CSP solo para su dominio.

## Pruebas

- `npm test`: Vitest, unitarias de validación, catálogo y formato (`src/**/*.test.ts`).
- `npm run test:e2e`: Playwright en escritorio y móvil (`e2e/`): búsqueda, filtros en la URL, estado
  vacío, ficha de prototipo sin demo fingida, 404 con `noindex`, demo interactiva, salto de contenido con
  teclado, y los dos formularios (validación, envío, error del servidor). El POST de Netlify Forms se
  intercepta: el envío real solo se puede comprobar en un deploy preview de Netlify.

## Fases

1. **Fundamentos y MVP — hecho.** Catálogo, búsqueda, filtros, fichas por estado, demo de DevPanel,
   formularios reales, SEO base, diseño responsive y accesible, pruebas.
2. **Administración y persistencia — pendiente.** Propuesta: Supabase (PostgreSQL + Auth + Storage) por
   cubrir base de datos, autenticación y archivos con políticas RLS sin operar un servidor. El panel
   `/admin` debe autorizar en el servidor (RLS + rol de administrador), no ocultando botones. Al migrar,
   solo cambian `src/lib/catalog.ts` y el destino de los formularios. No se construyó un panel en el MVP
   porque sin backend sería un panel ficticio.
3. **Validación y lanzamiento — parcial.** Pendiente: deploy preview para verificar Netlify Forms de
   extremo a extremo, revisión legal, medición de Core Web Vitals en producción, capturas reales.
4. **Monetización — no iniciada.** Requiere elegir proveedor de pago. Regla: ninguna compra o suscripción
   se marca como pagada sin confirmación verificable del proveedor (webhook firmado procesado en el
   servidor). El modelo `commercialModels` + `pricing` ya admite licencia, suscripción y a medida.

## Despliegue y dominio

Ver `README.md` de la raíz. El dominio vive en `src/config/site.ts` (y en `index.html`, `robots.txt` y
`security.txt`, que son estáticos); al migrar a un dominio propio hay que cambiarlo en esos cuatro sitios.

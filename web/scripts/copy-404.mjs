// Netlify sirve dist/404.html con estado 404 para cualquier URL sin regla en netlify.toml. Es una copia
// de index.html para que la app arranque y muestre su propia página de error con el estado HTTP correcto.
import { copyFileSync } from "node:fs";

copyFileSync(new URL("../dist/index.html", import.meta.url), new URL("../dist/404.html", import.meta.url));

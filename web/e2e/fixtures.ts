import { test as base } from "@playwright/test";

export { expect } from "@playwright/test";

/**
 * Las demos abren un recorrido en la primera visita. Las pruebas de cada demo parten como alguien que ya lo vio,
 * para probar la app y no el recorrido (que tiene su propia prueba en demo-shell.spec.ts). Se aplica al
 * contexto, así que también cubre las pestañas nuevas que abre "Probar demo".
 */
export const test = base.extend({
  context: async ({ context }, provide) => {
    await context.addInitScript(() => {
      for (const slug of ["stockflow", "clientia", "roboacademy", "taskpro"]) {
        window.localStorage.setItem(`hgs-demo-ui:tour:${slug}`, "1");
      }
    });
    await provide(context);
  },
});

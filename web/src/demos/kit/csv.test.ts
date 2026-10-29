import { describe, expect, it } from "vitest";
import { toCsv } from "@/demos/kit/csv";

describe("toCsv", () => {
  it("usa punto y coma, coma decimal y CRLF", () => {
    expect(toCsv(["Producto", "Precio"], [["Brocha", 10.5]])).toBe("Producto;Precio\r\nBrocha;10,5");
  });

  it("escapa comillas, separadores y saltos de línea", () => {
    expect(toCsv(["Nota"], [['Dijo "hola"; luego\nse fue']])).toBe('Nota\r\n"Dijo ""hola""; luego\nse fue"');
  });

  it("deja vacías las celdas nulas", () => {
    expect(toCsv(["A", "B"], [[null, undefined]])).toBe("A;B\r\n;");
  });
});

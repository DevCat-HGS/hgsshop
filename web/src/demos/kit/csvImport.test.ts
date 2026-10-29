import { describe, expect, it } from "vitest";
import { normalizeHeader, parseCsv, parseNumber } from "@/demos/kit/csvImport";

describe("parseCsv", () => {
  it("detecta el punto y coma de Excel es-CO y quita el BOM", () => {
    expect(parseCsv("﻿Nombre;Precio\r\nBrocha;10,5\r\n")).toEqual([
      ["Nombre", "Precio"],
      ["Brocha", "10,5"],
    ]);
  });

  it("detecta la coma y respeta comillas, comillas escapadas y saltos de línea", () => {
    expect(parseCsv('Nombre,Nota\n"Pérez, Ana","Dijo ""hola""\nlinea 2"\n')).toEqual([
      ["Nombre", "Nota"],
      ["Pérez, Ana", 'Dijo "hola"\nlinea 2'],
    ]);
  });

  it("descarta filas vacías", () => {
    expect(parseCsv("a;b\n\n;\n1;2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("normalizeHeader", () => {
  it("ignora tildes, mayúsculas y lo que va entre paréntesis", () => {
    expect(normalizeHeader("  Precio de VENTA (COP) ")).toBe("precio de venta");
    expect(normalizeHeader("Categoría")).toBe("categoria");
  });
});

describe("parseNumber", () => {
  it("entiende formatos colombianos e ingleses", () => {
    expect(parseNumber("$ 1.250.000")).toBe(1250000);
    expect(parseNumber("10,5")).toBe(10.5);
    expect(parseNumber("1,250,000.75")).toBe(1250000.75);
    expect(parseNumber("42")).toBe(42);
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("")).toBeNull();
  });
});

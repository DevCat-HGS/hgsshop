import { describe, expect, it } from "vitest";
import { alignmentCenters, capacity, encodeQr, formatBits, qrSvg, reedSolomon } from "./qr";

const URL = "https://reservas.ejemplo/estudio-brisa";

/** Patrón de posición esperado (7×7) con su separador blanco alrededor. */
function finderAt(modules: boolean[][], top: number, left: number) {
  for (let dy = -1; dy <= 7; dy++) {
    for (let dx = -1; dx <= 7; dx++) {
      const y = top + dy;
      const x = left + dx;
      if (y < 0 || x < 0 || y >= modules.length || x >= modules.length) continue;
      const ring = Math.max(Math.abs(dx - 3), Math.abs(dy - 3));
      const dark = ring !== 2 && ring !== 4;
      if (modules[y][x] !== dark) return false;
    }
  }
  return true;
}

/** Lee los 15 bits de formato de la copia junto al patrón superior izquierdo. */
function readFormat(modules: boolean[][]) {
  const at = (x: number, y: number) => (modules[y][x] ? 1 : 0);
  const bits: number[] = [];
  for (let i = 0; i <= 5; i++) bits[i] = at(8, i);
  bits[6] = at(8, 7);
  bits[7] = at(8, 8);
  bits[8] = at(7, 8);
  for (let i = 9; i < 15; i++) bits[i] = at(14 - i, 8);
  return bits.reduce((acc, b, i) => acc | (b << i), 0);
}

function readFormatCopy(modules: boolean[][]) {
  const n = modules.length;
  const bits: number[] = [];
  for (let i = 0; i < 8; i++) bits[i] = modules[8][n - 1 - i] ? 1 : 0;
  for (let i = 8; i < 15; i++) bits[i] = modules[n - 15 + i][8] ? 1 : 0;
  return bits.reduce((acc, b, i) => acc | (b << i), 0);
}

describe("generador QR", () => {
  it("calcula la corrección Reed-Solomon del ejemplo de la norma (1-M)", () => {
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    expect(reedSolomon(data, 10)).toEqual([196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
  });

  it("elige la versión más pequeña y la matriz mide 4 × versión + 17", () => {
    expect(capacity(1)).toBe(14);
    expect(capacity(6)).toBe(106);
    expect(encodeQr("a").version).toBe(1);
    expect(encodeQr("x".repeat(14)).version).toBe(1);
    expect(encodeQr("x".repeat(15)).version).toBe(2);
    expect(encodeQr(URL).version).toBe(3);
    expect(encodeQr("x".repeat(106)).version).toBe(6);
    for (const text of ["a", "x".repeat(20), URL, "x".repeat(60), "x".repeat(80), "x".repeat(100)]) {
      const qr = encodeQr(text);
      expect(qr.size).toBe(qr.version * 4 + 17);
      expect(qr.modules).toHaveLength(qr.size);
      for (const row of qr.modules) expect(row).toHaveLength(qr.size);
    }
  });

  it("rechaza textos que no caben en la versión 6", () => {
    expect(() => encodeQr("x".repeat(107))).toThrow(/muy largo/);
  });

  it("dibuja los tres patrones de posición, la temporización y el módulo oscuro", () => {
    for (const text of ["a", URL, "x".repeat(100)]) {
      const { modules, size, version } = encodeQr(text);
      expect(finderAt(modules, 0, 0)).toBe(true);
      expect(finderAt(modules, 0, size - 7)).toBe(true);
      expect(finderAt(modules, size - 7, 0)).toBe(true);
      // No hay patrón de posición en la esquina inferior derecha.
      expect(finderAt(modules, size - 7, size - 7)).toBe(false);
      for (let i = 8; i < size - 8; i++) {
        expect(modules[6][i]).toBe(i % 2 === 0);
        expect(modules[i][6]).toBe(i % 2 === 0);
      }
      expect(modules[size - 8][8]).toBe(true);
      expect(modules[4 * version + 9][8]).toBe(true);
    }
  });

  it("dibuja el patrón de alineación desde la versión 2", () => {
    expect(alignmentCenters(1)).toEqual([]);
    const { modules, version } = encodeQr(URL);
    const c = alignmentCenters(version)[1];
    expect(c).toBe(22);
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) expect(modules[c + dy][c + dx]).toBe(Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  });

  it("escribe la información de formato (nivel M y máscara) en sus dos copias", () => {
    // Valor publicado en la norma para nivel M y máscara 0.
    expect(formatBits(0)).toBe(0b101010000010010);
    for (let mask = 0; mask < 8; mask++) {
      const qr = encodeQr(URL, { mask });
      expect(qr.mask).toBe(mask);
      expect(readFormat(qr.modules)).toBe(formatBits(mask));
      expect(readFormatCopy(qr.modules)).toBe(formatBits(mask));
      // Nivel M = 00 en los dos bits altos (antes de la máscara 0x5412).
      expect(((formatBits(mask) ^ 0x5412) >>> 13) & 0b11).toBe(0);
    }
  });

  it("es determinista y cambia con el contenido", () => {
    expect(encodeQr(URL)).toEqual(encodeQr(URL));
    expect(encodeQr(URL).modules).not.toEqual(encodeQr(`${URL}-2`).modules);
  });
});

describe("QR en SVG", () => {
  it("dibuja un módulo por cuadro con el margen de 4 módulos", () => {
    const qr = encodeQr(URL);
    const svg = qrSvg(URL);
    const side = qr.size + 8;
    expect(svg).toContain(`viewBox="0 0 ${side} ${side}"`);
    const dark = qr.modules.flat().filter(Boolean).length;
    expect(svg.match(/h1v1h-1z/g)).toHaveLength(dark);
    // El primer módulo oscuro es la esquina del patrón de posición superior izquierdo, desplazada por el margen.
    expect(svg).toContain('d="M4 4h1v1h-1z');
  });
});

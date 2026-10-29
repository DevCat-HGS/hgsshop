/**
 * Generador mínimo de códigos QR (ISO/IEC 18004), sin dependencias: modo byte (UTF-8), corrección de errores
 * nivel M y versiones de la 1 a la 6 (hasta 106 bytes), suficiente para una URL corta. Elige la versión más
 * pequeña que alcance y la máscara con menor penalización, como pide la norma.
 */

export interface QrCode {
  version: number;
  /** Módulos por lado: 4 × versión + 17. */
  size: number;
  mask: number;
  /** `modules[fila][columna]`: `true` = módulo oscuro. */
  modules: boolean[][];
}

/** Bloques del nivel M por versión: codewords de corrección por bloque y codewords de datos de cada bloque. */
const BLOCKS_M: Record<number, { ec: number; data: number[] }> = {
  1: { ec: 10, data: [16] },
  2: { ec: 16, data: [28] },
  3: { ec: 26, data: [44] },
  4: { ec: 18, data: [32, 32] },
  5: { ec: 24, data: [43, 43] },
  6: { ec: 16, data: [27, 27, 27, 27] },
};

export const MAX_VERSION = 6;

/** Bytes que caben en modo byte con nivel M en cada versión (4 bits de modo + 8 de longitud + 8 por byte). */
export function capacity(version: number) {
  const dataBits = BLOCKS_M[version].data.reduce((s, n) => s + n, 0) * 8;
  return Math.floor((dataBits - 12) / 8);
}

// ---------- Reed-Solomon sobre GF(256), polinomio 0x11D ----------

function gfMul(x: number, y: number) {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number) {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMul(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return result;
}

/** Codewords de corrección de errores de un bloque de datos. */
export function reedSolomon(data: number[], ecLength: number) {
  const divisor = rsDivisor(ecLength);
  const result = new Array<number>(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    for (let i = 0; i < ecLength; i++) result[i] ^= gfMul(divisor[i], factor);
  }
  return result;
}

// ---------- Codificación de los datos ----------

function dataCodewords(bytes: Uint8Array, version: number) {
  const capacityBits = BLOCKS_M[version].data.reduce((s, n) => s + n, 0) * 8;
  const bits: number[] = [];
  const put = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  put(0b0100, 4); // modo byte
  put(bytes.length, 8); // contador de caracteres (versiones 1 a 9)
  for (const b of bytes) put(b, 8);
  put(0, Math.min(4, capacityBits - bits.length)); // terminador
  put(0, (8 - (bits.length % 8)) % 8);
  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) words.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));
  for (let pad = 0xec; words.length < capacityBits / 8; pad ^= 0xec ^ 0x11) words.push(pad);
  return words;
}

/** Divide en bloques, agrega la corrección de cada uno e intercala como pide la norma. */
function interleave(words: number[], version: number) {
  const { ec, data } = BLOCKS_M[version];
  const blocks: number[][] = [];
  const ecBlocks: number[][] = [];
  let offset = 0;
  for (const count of data) {
    const block = words.slice(offset, offset + count);
    offset += count;
    blocks.push(block);
    ecBlocks.push(reedSolomon(block, ec));
  }
  const result: number[] = [];
  const longest = Math.max(...data);
  for (let i = 0; i < longest; i++) for (const b of blocks) if (i < b.length) result.push(b[i]);
  for (let i = 0; i < ec; i++) for (const b of ecBlocks) result.push(b[i]);
  return result;
}

// ---------- Matriz ----------

class Matrix {
  readonly size: number;
  readonly modules: boolean[][];
  readonly reserved: boolean[][];

  constructor(size: number) {
    this.size = size;
    this.modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
    this.reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  }

  fn(x: number, y: number, dark: boolean) {
    this.modules[y][x] = dark;
    this.reserved[y][x] = true;
  }
}

/** Centros de los patrones de alineación (versiones 2 a 6: uno solo, cerca de la esquina inferior derecha). */
export function alignmentCenters(version: number) {
  return version === 1 ? [] : [6, version * 4 + 10];
}

function drawFunctionPatterns(m: Matrix, version: number) {
  const n = m.size;
  for (let i = 0; i < n; i++) {
    m.fn(6, i, i % 2 === 0);
    m.fn(i, 6, i % 2 === 0);
  }
  // Patrones de posición con su separador blanco.
  for (const [cx, cy] of [
    [3, 3],
    [n - 4, 3],
    [3, n - 4],
  ]) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) continue;
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        m.fn(x, y, dist !== 2 && dist !== 4);
      }
    }
  }
  const centers = alignmentCenters(version);
  for (const cy of centers) {
    for (const cx of centers) {
      // Los que caerían sobre un patrón de posición no se dibujan.
      if ((cx === 6 && cy === 6) || (cx === 6 && cy === n - 7) || (cx === n - 7 && cy === 6)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m.fn(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  drawFormatBits(m, 0);
}

/** 15 bits de formato: nivel M (00) + máscara, con BCH(15,5) y la máscara fija 0x5412. */
export function formatBits(mask: number) {
  const data = (0b00 << 3) | mask;
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  return ((data << 10) | rem) ^ 0x5412;
}

function drawFormatBits(m: Matrix, mask: number) {
  const bits = formatBits(mask);
  const bit = (i: number) => ((bits >>> i) & 1) === 1;
  const n = m.size;
  for (let i = 0; i <= 5; i++) m.fn(8, i, bit(i));
  m.fn(8, 7, bit(6));
  m.fn(8, 8, bit(7));
  m.fn(7, 8, bit(8));
  for (let i = 9; i < 15; i++) m.fn(14 - i, 8, bit(i));
  for (let i = 0; i < 8; i++) m.fn(n - 1 - i, 8, bit(i));
  for (let i = 8; i < 15; i++) m.fn(8, n - 15 + i, bit(i));
  m.fn(8, n - 8, true); // módulo oscuro fijo
}

function drawCodewords(m: Matrix, codewords: number[]) {
  const n = m.size;
  let i = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // la columna de temporización no lleva datos
    for (let vert = 0; vert < n; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? n - 1 - vert : vert;
        if (!m.reserved[y][x] && i < codewords.length * 8) {
          m.modules[y][x] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
          i++;
        }
      }
    }
  }
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function applyMask(m: Matrix, mask: number) {
  for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (!m.reserved[y][x] && MASKS[mask](x, y)) m.modules[y][x] = !m.modules[y][x];
}

const FINDER_LIKE = [
  [true, false, true, true, true, false, true, false, false, false, false],
  [false, false, false, false, true, false, true, true, true, false, true],
];

/** Penalización de la norma (reglas 1 a 4): la máscara elegida es la de menor puntaje. */
export function penalty(modules: boolean[][]) {
  const n = modules.length;
  let score = 0;
  const lines: boolean[][] = [];
  for (let i = 0; i < n; i++) {
    lines.push(modules[i]);
    lines.push(modules.map((row) => row[i]));
  }
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && line[i] === line[i - 1]) run++;
      else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    for (let i = 0; i + 11 <= n; i++) if (FINDER_LIKE.some((p) => p.every((v, k) => line[i + k] === v))) score += 40;
  }
  for (let y = 0; y + 1 < n; y++) {
    for (let x = 0; x + 1 < n; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
    }
  }
  const dark = modules.reduce((s, row) => s + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5) * 10;
  return score;
}

/**
 * Codifica `text` en un QR. `mask` fuerza una máscara (para pruebas); si no, se elige la de menor penalización.
 * Lanza un error si el texto no cabe en la versión 6.
 */
export function encodeQr(text: string, options: { mask?: number } = {}): QrCode {
  const bytes = new TextEncoder().encode(text);
  let version = 1;
  while (version <= MAX_VERSION && bytes.length > capacity(version)) version++;
  if (version > MAX_VERSION) throw new Error(`El texto es muy largo para el QR (máximo ${capacity(MAX_VERSION)} bytes).`);

  const codewords = interleave(dataCodewords(bytes, version), version);
  const size = version * 4 + 17;
  const build = (mask: number) => {
    const m = new Matrix(size);
    drawFunctionPatterns(m, version);
    drawCodewords(m, codewords);
    applyMask(m, mask);
    drawFormatBits(m, mask);
    return m;
  };

  let mask = options.mask ?? -1;
  if (mask < 0) {
    let best = Infinity;
    for (let candidate = 0; candidate < 8; candidate++) {
      const score = penalty(build(candidate).modules);
      if (score < best) {
        best = score;
        mask = candidate;
      }
    }
  }
  return { version, size, mask, modules: build(mask).modules };
}

/** Código QR como SVG (sin servicios externos), con el margen blanco de 4 módulos que pide la norma. */
export function qrSvg(text: string) {
  const qr = encodeQr(text);
  const margin = 4;
  const size = qr.size + margin * 2;
  let path = "";
  qr.modules.forEach((row, y) => row.forEach((dark, x) => dark && (path += `M${x + margin} ${y + margin}h1v1h-1z`)));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

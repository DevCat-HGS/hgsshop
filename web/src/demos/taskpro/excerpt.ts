/** Texto plano para el extracto de la lista: sin marcas de markdown. */
export function plainExcerpt(source: string, max = 110) {
  const text = source
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^\s*([-*]|\d+[.)])\s+/gm, "")
    .replace(/\*\*|`/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

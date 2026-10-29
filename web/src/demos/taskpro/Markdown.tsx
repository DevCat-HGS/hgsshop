import type { ReactNode } from "react";

/**
 * Vista previa de markdown hecha a mano y segura: el texto se convierte en elementos de React, nunca en HTML
 * crudo, así que una nota no puede inyectar etiquetas ni scripts. Cubre lo que se usa en notas técnicas:
 * encabezados (#, ##, ###), **negrita**, `código en línea`, bloques ``` y listas con viñetas o numeradas.
 */
type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "code"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "para"; text: string };

const HEADING = /^(#{1,3})\s+(.*)$/;
const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;
const FENCE = /^\s*```/;

function startsBlock(line: string) {
  return FENCE.test(line) || HEADING.test(line) || BULLET.test(line) || NUMBERED.test(line);
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (FENCE.test(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++]);
      i++; // cierre (o fin del texto si quedó abierto)
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }
    const listPattern = BULLET.test(line) ? BULLET : NUMBERED.test(line) ? NUMBERED : null;
    if (listPattern) {
      const items: string[] = [];
      while (i < lines.length) {
        const item = listPattern.exec(lines[i]);
        if (!item) break;
        items.push(item[1]);
        i++;
      }
      blocks.push({ kind: "list", ordered: listPattern === NUMBERED, items });
      continue;
    }
    if (!line.trim()) {
      i++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) para.push(lines[i++].trim());
    blocks.push({ kind: "para", text: para.join(" ") });
  }
  return blocks;
}

function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((part, i) => {
      if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-semibold text-text">{part.slice(2, -2)}</strong>;
      if (part.length > 2 && part.startsWith("`") && part.endsWith("`"))
        return (
          <code key={i} className="rounded-sm font-sans bg-surface-hover px-1 py-0.5 text-[0.92em] text-brand-soft">
            {part.slice(1, -1)}
          </code>
        );
      return part;
    });
}

const headingClass: Record<number, string> = {
  1: "text-lg font-semibold text-text",
  2: "text-base font-semibold text-text",
  3: "text-sm font-semibold text-text",
};

export function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);
  if (blocks.length === 0) return <p className="text-sm text-text-subtle">La nota está vacía.</p>;
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed text-text-muted">
      {blocks.map((block, i) => {
        switch (block.kind) {
          case "heading": {
            const Tag = (["h4", "h5", "h6"] as const)[block.level - 1];
            return (
              <Tag key={i} className={headingClass[block.level]}>
                {inline(block.text)}
              </Tag>
            );
          }
          case "code":
            return (
              <pre key={i} className="overflow-x-auto font-sans rounded-md border border-border bg-bg-raised px-3 py-2.5 text-[13px] text-text">
                <code>{block.text}</code>
              </pre>
            );
          case "list": {
            const items = block.items.map((item, j) => <li key={j}>{inline(item)}</li>);
            return block.ordered ? (
              <ol key={i} className="list-decimal space-y-1 pl-5">
                {items}
              </ol>
            ) : (
              <ul key={i} className="list-disc space-y-1 pl-5">
                {items}
              </ul>
            );
          }
          default:
            return <p key={i}>{inline(block.text)}</p>;
        }
      })}
    </div>
  );
}

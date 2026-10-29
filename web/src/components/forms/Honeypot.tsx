/**
 * Campo trampa contra bots: invisible y fuera del orden de tabulación para personas, pero los bots
 * que rellenan todos los campos lo completan y Netlify descarta el envío (`netlify-honeypot` en
 * index.html). No sustituye un CAPTCHA, pero frena el spam automatizado más básico sin fricción.
 */
export function Honeypot({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div aria-hidden="true" /* taste-skill-ignore: campo trampa fuera de pantalla, no es una línea */ className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        No completes este campo
        <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" value={value} onChange={(event) => onChange(event.target.value)} />
      </label>
    </div>
  );
}

import { SearchIcon, SpinnerIcon } from "@/components/icons";

export function SearchBar({
  value,
  onChange,
  isLoading,
  placeholder = "Buscar por nombre, categoría o funcionalidad…",
}: {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-subtle" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label="Buscar productos"
        className="w-full rounded-md border border-border-strong bg-bg py-3 pl-10 pr-10 text-sm text-text placeholder:text-text-subtle focus:outline-none focus:ring-2 focus:ring-brand/40"
      />
      {isLoading && (
        <SpinnerIcon className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-text-subtle" aria-hidden="true" />
      )}
    </div>
  );
}

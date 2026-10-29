import type { Category } from "@/types/category";
import type { ProductStatus } from "@/types/product";
import { statusLabels } from "@/lib/format";

export type SortOption = "relevance" | "name-asc" | "name-desc";

const sortLabels: Record<SortOption, string> = {
  relevance: "Relevancia",
  "name-asc": "Nombre (A-Z)",
  "name-desc": "Nombre (Z-A)",
};

interface ProductFiltersProps {
  categories: Category[];
  categorySlug: string;
  onCategoryChange: (value: string) => void;
  status: ProductStatus | "";
  onStatusChange: (value: ProductStatus | "") => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
}

const selectClasses =
  "rounded-md border border-border-strong bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-brand/40";

export function ProductFilters({
  categories,
  categorySlug,
  onCategoryChange,
  status,
  onStatusChange,
  sort,
  onSortChange,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <label className="flex flex-col gap-1 text-xs font-medium text-text-subtle">
        Categoría
        <select
          value={categorySlug}
          onChange={(event) => onCategoryChange(event.target.value)}
          className={selectClasses}
        >
          <option value="">Todas</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-text-subtle">
        Estado
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ProductStatus | "")}
          className={selectClasses}
        >
          <option value="">Todos</option>
          {(Object.keys(statusLabels) as ProductStatus[]).map((key) => (
            <option key={key} value={key}>
              {statusLabels[key]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-xs font-medium text-text-subtle">
        Ordenar por
        <select value={sort} onChange={(event) => onSortChange(event.target.value as SortOption)} className={selectClasses}>
          {(Object.keys(sortLabels) as SortOption[]).map((key) => (
            <option key={key} value={key}>
              {sortLabels[key]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

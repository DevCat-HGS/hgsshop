export function Pagination({
  page,
  pageCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Paginación de resultados" className="flex items-center justify-center gap-2">
      {Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => (
        <button
          key={number}
          type="button"
          aria-current={number === page ? "page" : undefined}
          onClick={() => onPageChange(number)}
          className={`size-9 rounded-md text-sm font-semibold transition-colors duration-150 ${
            number === page ? "bg-brand text-brand-contrast" : "text-text-muted hover:bg-surface-hover"
          }`}
        >
          {number}
        </button>
      ))}
    </nav>
  );
}

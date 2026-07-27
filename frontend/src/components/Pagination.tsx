interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (total === 0) return null;

  return (
    <nav className="pagination" aria-label="Paginação dos lotes">
      <button type="button" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        <span aria-hidden="true">←</span> Anterior
      </button>
      <span aria-live="polite">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        Próxima <span aria-hidden="true">→</span>
      </button>
    </nav>
  );
}

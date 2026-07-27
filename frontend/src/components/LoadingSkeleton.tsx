export function LoadingSkeleton() {
  return (
    <div className="skeleton-list" role="status" aria-label="Carregando lotes">
      <span className="sr-only">Carregando lotes…</span>
      {[1, 2, 3, 4, 5].map((item) => (
        <div className="skeleton-row" key={item} aria-hidden="true">
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}

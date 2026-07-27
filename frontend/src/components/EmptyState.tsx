interface EmptyStateProps {
  searching: boolean;
  onClearSearch: () => void;
}

export function EmptyState({ searching, onClearSearch }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 48 48">
          <path d="M12 15.5h24M14.5 15.5v20h19v-20M19 21h10M19 27h10" />
          <path d="M17 11.5h14l2 4H15l2-4Z" />
        </svg>
      </div>
      <h3>{searching ? "Nenhum lote encontrado" : "Seu catálogo começa aqui"}</h3>
      <p>
        {searching
          ? "Tente buscar outro número ou limpe o filtro para ver todos os lotes."
          : "Cadastre o primeiro lote para começar a organizar este leilão."}
      </p>
      {searching && (
        <button className="text-button" type="button" onClick={onClearSearch}>
          Limpar busca
        </button>
      )}
    </div>
  );
}

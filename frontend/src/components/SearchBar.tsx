import { FormEvent, useState } from "react";

interface SearchBarProps {
  value: string;
  onSearch: (value: string) => void;
}

export function SearchBar({ value, onSearch }: SearchBarProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = draft.trim();
    if (normalized && !/^\d+$/.test(normalized)) {
      setError("A busca aceita somente números.");
      return;
    }
    setError("");
    onSearch(normalized);
  }

  function clear() {
    setDraft("");
    setError("");
    onSearch("");
  }

  return (
    <form className="search-form" role="search" onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor="search-lot">
        Buscar lote por número
      </label>
      <div className={`search-input ${error ? "has-error" : ""}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
        </svg>
        <input
          id="search-lot"
          value={draft}
          inputMode="numeric"
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Buscar pelo número do lote"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "search-error" : undefined}
        />
        {draft && (
          <button className="clear-search" type="button" onClick={clear} aria-label="Limpar busca">
            ×
          </button>
        )}
      </div>
      <button className="secondary-button search-button" type="submit">
        Buscar
      </button>
      {error && (
        <p className="search-error" id="search-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}

import { useEffect, useState } from "react";

import { ApiError, createLote, fetchLotes } from "./api";
import { EmptyState } from "./components/EmptyState";
import { LoadingSkeleton } from "./components/LoadingSkeleton";
import { LoteForm } from "./components/LoteForm";
import { LotesTable } from "./components/LotesTable";
import { Pagination } from "./components/Pagination";
import { SearchBar } from "./components/SearchBar";
import { Toast } from "./components/Toast";
import { DEFAULT_QUERY, readQuery, writeQuery } from "./query-state";
import type { LotesPage, QueryState, SortDirection, SortField } from "./types";

type LoadingState = "loading" | "ready" | "error";

const emptyPage: LotesPage = {
  itens: [],
  total: 0,
  pagina: 1,
  por_pagina: 10,
  total_paginas: 0,
};

const sortOptions: Array<{ value: string; label: string }> = [
  { value: "id-desc", label: "Mais recentes" },
  { value: "id-asc", label: "Mais antigos" },
  { value: "numero-asc", label: "Número crescente" },
  { value: "numero-desc", label: "Número decrescente" },
  { value: "preco-asc", label: "Menor preço" },
  { value: "preco-desc", label: "Maior preço" },
];

export function App() {
  const [query, setQuery] = useState<QueryState>(() => readQuery());
  const [page, setPage] = useState<LotesPage>(emptyPage);
  const [state, setState] = useState<LoadingState>("loading");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  function updateQuery(next: QueryState, replace = false) {
    setState("loading");
    setError("");
    setQuery(next);
    writeQuery(next, replace);
  }

  useEffect(() => {
    writeQuery(readQuery(), true);
    const handlePopState = () => {
      setState("loading");
      setError("");
      setQuery(readQuery());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!success) return;
    const timeout = window.setTimeout(() => setSuccess(""), 4500);
    return () => window.clearTimeout(timeout);
  }, [success]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLotes(query, controller.signal)
      .then((result) => {
        setPage(result);
        setState("ready");
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Não foi possível carregar os lotes.",
        );
        setState("error");
      });
    return () => controller.abort();
  }, [query, reloadKey]);

  async function handleCreate(numero: string, preco: number) {
    setSending(true);
    setSuccess("");
    try {
      await createLote(numero, preco);
      setSuccess(`O lote ${numero} já está disponível no catálogo.`);
      updateQuery(DEFAULT_QUERY);
      setReloadKey((current) => current + 1);
    } catch (requestError) {
      if (requestError instanceof ApiError) throw requestError;
      throw new Error("Não foi possível criar o lote.", { cause: requestError });
    } finally {
      setSending(false);
    }
  }

  function changePage(nextPage: number) {
    updateQuery({ ...query, pagina: nextPage });
  }

  function changePageSize(value: number) {
    updateQuery({ ...query, pagina: 1, porPagina: value });
  }

  function changeSort(value: string) {
    const [ordenar, direcao] = value.split("-") as [SortField, SortDirection];
    updateQuery({ ...query, pagina: 1, ordenar, direcao });
  }

  function changeSearch(value: string) {
    updateQuery({ ...query, pagina: 1, busca: value });
  }

  const selectedSort = `${query.ordenar}-${query.direcao}`;
  const countLabel = `${page.total} ${page.total === 1 ? "lote" : "lotes"}`;

  return (
    <div className="app-shell">
      <div className="ambient-glow ambient-glow-one" aria-hidden="true" />
      <div className="ambient-glow ambient-glow-two" aria-hidden="true" />

      <main className="page-shell">
        <header className="hero">
          <div>
            <p className="eyebrow">Gestão de leilões</p>
            <h1>Lotes do leilão</h1>
            <p className="hero-copy">
              Cadastre, consulte e organize cada oportunidade do seu catálogo.
            </p>
          </div>
        </header>

        <div className="content-grid">
          <LoteForm onSubmit={handleCreate} sending={sending} />

          <section className="panel list-panel" aria-labelledby="list-title">
            <div className="panel-heading list-heading">
              <div>
                <p className="eyebrow">Catálogo</p>
                <div className="title-with-count">
                  <h2 id="list-title">Lotes cadastrados</h2>
                  {state === "ready" && <span>{countLabel}</span>}
                </div>
              </div>
              <span className="saved-indicator">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="m5 12 4 4L19 6" />
                </svg>
                Salvo automaticamente
              </span>
            </div>

            <div className="list-toolbar">
              <SearchBar key={query.busca} value={query.busca} onSearch={changeSearch} />
              <div className="controls" aria-label="Controles da lista">
                <label>
                  <span>Ordenar</span>
                  <select value={selectedSort} onChange={(event) => changeSort(event.target.value)}>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Por página</span>
                  <select
                    value={query.porPagina}
                    onChange={(event) => changePageSize(Number(event.target.value))}
                  >
                    {[5, 10, 20].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="list-content">
              {state === "loading" && <LoadingSkeleton />}
              {state === "error" && (
                <div className="state-message error-state" role="alert">
                  <span className="error-icon" aria-hidden="true">
                    !
                  </span>
                  <h3>Não foi possível carregar o catálogo</h3>
                  <p>{error}</p>
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setState("loading");
                      setError("");
                      setReloadKey((current) => current + 1);
                    }}
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
              {state === "ready" && page.total === 0 && (
                <EmptyState searching={Boolean(query.busca)} onClearSearch={() => changeSearch("")} />
              )}
              {state === "ready" && page.total > 0 && page.itens.length === 0 && (
                <div className="state-message">
                  <h3>Nenhum lote nesta página</h3>
                  <button className="text-button" type="button" onClick={() => changePage(1)}>
                    Voltar para a primeira página
                  </button>
                </div>
              )}
              {state === "ready" && page.itens.length > 0 && <LotesTable lots={page.itens} />}
            </div>

            {state === "ready" && (
              <Pagination
                page={query.pagina}
                totalPages={page.total_paginas}
                total={page.total}
                onPageChange={changePage}
              />
            )}
          </section>
        </div>
      </main>

      {success && <Toast message={success} onDismiss={() => setSuccess("")} />}
    </div>
  );
}

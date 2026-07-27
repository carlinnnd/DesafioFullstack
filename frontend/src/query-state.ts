import type { QueryState, SortDirection, SortField } from "./types";

export const DEFAULT_QUERY: QueryState = {
  pagina: 1,
  porPagina: 10,
  ordenar: "id",
  direcao: "desc",
  busca: "",
};

const pageSizes = new Set([5, 10, 20]);
const sortFields = new Set<SortField>(["id", "numero", "preco"]);
const directions = new Set<SortDirection>(["asc", "desc"]);

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function readQuery(search = window.location.search): QueryState {
  const params = new URLSearchParams(search);
  const porPaginaCandidate = positiveInteger(params.get("por_pagina"), DEFAULT_QUERY.porPagina);
  const ordenarCandidate = params.get("ordenar") as SortField | null;
  const direcaoCandidate = params.get("direcao") as SortDirection | null;

  return {
    pagina: positiveInteger(params.get("pagina"), DEFAULT_QUERY.pagina),
    porPagina: pageSizes.has(porPaginaCandidate) ? porPaginaCandidate : DEFAULT_QUERY.porPagina,
    ordenar: ordenarCandidate && sortFields.has(ordenarCandidate) ? ordenarCandidate : DEFAULT_QUERY.ordenar,
    direcao: direcaoCandidate && directions.has(direcaoCandidate) ? direcaoCandidate : DEFAULT_QUERY.direcao,
    busca: /^\d+$/.test(params.get("busca") ?? "") ? params.get("busca")! : "",
  };
}

export function writeQuery(query: QueryState, replace = false): void {
  const params = new URLSearchParams({
    pagina: String(query.pagina),
    por_pagina: String(query.porPagina),
    ordenar: query.ordenar,
    direcao: query.direcao,
  });
  if (query.busca) params.set("busca", query.busca);
  const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
  if (replace) window.history.replaceState({}, "", nextUrl);
  else window.history.pushState({}, "", nextUrl);
}

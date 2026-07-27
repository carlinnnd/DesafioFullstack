export type SortField = "id" | "numero" | "preco";
export type SortDirection = "asc" | "desc";

export interface Lote {
  id: number;
  numero: string;
  preco: number;
}

export interface LotesPage {
  itens: Lote[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

export interface QueryState {
  pagina: number;
  porPagina: number;
  ordenar: SortField;
  direcao: SortDirection;
  busca: string;
}

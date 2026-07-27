import type { Lote, LotesPage, QueryState } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function errorMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  return "Não foi possível concluir a operação. Tente novamente.";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
    if (!response.ok) {
      const body: { detail?: unknown } = await response.json().catch(() => ({}));
      throw new ApiError(response.status, errorMessage(body.detail));
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(0, "Não foi possível conectar à API. Verifique se ela está em execução.");
  }
}

export function fetchLotes(query: QueryState, signal?: AbortSignal): Promise<LotesPage> {
  const params = new URLSearchParams({
    pagina: String(query.pagina),
    por_pagina: String(query.porPagina),
    ordenar: query.ordenar,
    direcao: query.direcao,
  });
  if (query.busca) params.set("busca", query.busca);
  return request<LotesPage>(`/lotes?${params.toString()}`, { signal });
}

export function createLote(numero: string, preco: number): Promise<Lote> {
  return request<Lote>("/lotes", {
    method: "POST",
    body: JSON.stringify({ numero, preco }),
  });
}

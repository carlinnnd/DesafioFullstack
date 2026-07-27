import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";
import { ApiError, createLote, fetchLotes } from "./api";
import type { LotesPage } from "./types";

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");
  return { ...actual, fetchLotes: vi.fn(), createLote: vi.fn() };
});

const mockedFetchLotes = vi.mocked(fetchLotes);
const mockedCreateLote = vi.mocked(createLote);

const emptyPage: LotesPage = {
  itens: [],
  total: 0,
  pagina: 1,
  por_pagina: 10,
  total_paginas: 0,
};

const lotsPage: LotesPage = {
  itens: [
    { id: 1, numero: "07", preco: 1850 },
    { id: 2, numero: "08", preco: 500 },
  ],
  total: 6,
  pagina: 1,
  por_pagina: 5,
  total_paginas: 2,
};

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/");
});

describe("App", () => {
  it("mostra a lista vazia depois do carregamento", async () => {
    mockedFetchLotes.mockResolvedValue(emptyPage);
    render(<App />);

    expect(screen.getByText("Carregando lotes…")).toBeInTheDocument();
    expect(await screen.findByText("Seu catálogo começa aqui")).toBeInTheDocument();
  });

  it("renderiza os lotes e formata valores em reais", async () => {
    mockedFetchLotes.mockResolvedValue(lotsPage);
    render(<App />);

    const lot = await screen.findByText("Lote 07");
    expect(within(lot.closest("tr")!).getByText(/R\$\s*1\.850,00/)).toBeInTheDocument();
    expect(screen.getByText("6 lotes")).toBeInTheDocument();
  });

  it("mostra erro de conexão e permite tentar novamente", async () => {
    mockedFetchLotes.mockRejectedValueOnce(new Error("API indisponível"));
    mockedFetchLotes.mockResolvedValueOnce(emptyPage);
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByText("API indisponível")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Seu catálogo começa aqui")).toBeInTheDocument();
    expect(mockedFetchLotes).toHaveBeenCalledTimes(2);
  });

  it("cria um lote e retorna à primeira página da ordenação padrão", async () => {
    mockedFetchLotes.mockResolvedValue(emptyPage);
    mockedCreateLote.mockResolvedValue({ id: 1, numero: "07", preco: 1850 });
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Seu catálogo começa aqui");

    await user.type(screen.getByLabelText("Número do lote"), "07");
    await user.type(screen.getByLabelText("Preço inicial"), "1850,00");
    await user.click(screen.getByRole("button", { name: "Adicionar lote" }));

    await waitFor(() => expect(mockedCreateLote).toHaveBeenCalledWith("07", 1850));
    expect(await screen.findByText("O lote 07 já está disponível no catálogo.")).toBeInTheDocument();
    expect(window.location.search).toBe("?pagina=1&por_pagina=10&ordenar=id&direcao=desc");
  });

  it("mantém os dados e mostra conflito quando o número já existe", async () => {
    mockedFetchLotes.mockResolvedValue(emptyPage);
    mockedCreateLote.mockRejectedValue(new ApiError(409, "Já existe um lote com este número."));
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Seu catálogo começa aqui");

    await user.type(screen.getByLabelText("Número do lote"), "01");
    await user.type(screen.getByLabelText("Preço inicial"), "20");
    await user.click(screen.getByRole("button", { name: "Adicionar lote" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Já existe um lote");
    expect(screen.getByLabelText("Número do lote")).toHaveValue("01");
  });

  it("impede caracteres não numéricos no campo de lote", async () => {
    mockedFetchLotes.mockResolvedValue(emptyPage);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Seu catálogo começa aqui");

    const numero = screen.getByLabelText("Número do lote");
    await user.type(numero, "A1-B2");

    expect(numero).toHaveValue("12");
    expect(mockedCreateLote).not.toHaveBeenCalled();
  });

  it("limita o preço ao teto enquanto o usuário digita", async () => {
    mockedFetchLotes.mockResolvedValue(emptyPage);
    render(<App />);
    await screen.findByText("Seu catálogo começa aqui");

    const preco = screen.getByLabelText("Preço inicial");
    fireEvent.change(preco, { target: { value: "10000000000" } });

    expect(preco).toHaveValue("99.999.999,99");
    expect(mockedCreateLote).not.toHaveBeenCalled();
  });

  it("atualiza paginação e ordenação na URL", async () => {
    mockedFetchLotes.mockResolvedValue(lotsPage);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Lote 07");

    await user.selectOptions(screen.getByLabelText("Por página"), "5");
    await user.selectOptions(screen.getByLabelText("Ordenar"), "preco-asc");
    await user.click(screen.getByRole("button", { name: "Próxima" }));

    expect(window.location.search).toBe("?pagina=2&por_pagina=5&ordenar=preco&direcao=asc");
    expect(mockedFetchLotes).toHaveBeenLastCalledWith(
      { pagina: 2, porPagina: 5, ordenar: "preco", direcao: "asc", busca: "" },
      expect.any(AbortSignal),
    );
  });

  it("busca por número e sincroniza o filtro com a URL", async () => {
    mockedFetchLotes.mockResolvedValue(lotsPage);
    const user = userEvent.setup();
    render(<App />);
    await screen.findByText("Lote 07");

    await user.type(screen.getByLabelText("Buscar lote por número"), "07");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(window.location.search).toContain("busca=07");
    expect(mockedFetchLotes).toHaveBeenLastCalledWith(
      { pagina: 1, porPagina: 10, ordenar: "id", direcao: "desc", busca: "07" },
      expect.any(AbortSignal),
    );
  });
});

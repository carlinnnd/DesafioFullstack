import type { Lote } from "../types";

interface LotesTableProps {
  lots: Lote[];
}

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function LotesTable({ lots }: LotesTableProps) {
  return (
    <div className="table-wrapper">
      <table>
        <caption className="sr-only">Lotes cadastrados</caption>
        <thead>
          <tr>
            <th scope="col">Número</th>
            <th scope="col">Preço inicial</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => (
            <tr key={lot.id}>
              <td data-label="Número">
                <span className="lot-badge">Lote {lot.numero}</span>
              </td>
              <td data-label="Preço inicial">
                <span className="price-value">{currencyFormatter.format(lot.preco)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

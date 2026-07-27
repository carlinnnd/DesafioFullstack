import { FormEvent, useState } from "react";

interface LoteFormProps {
  onSubmit: (numero: string, preco: number) => Promise<void>;
  sending: boolean;
}

interface FieldErrors {
  numero?: string;
  preco?: string;
  form?: string;
}

const MAX_PRICE = 99_999_999.99;
const MAX_PRICE_CENTS = "9999999999";
const decimalFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(cents: string): string {
  if (!cents) return "";
  return decimalFormatter.format(Number(cents) / 100);
}

function priceFromCents(cents: string): number {
  return Number(cents) / 100;
}

export function LoteForm({ onSubmit, sending }: LoteFormProps) {
  const [numero, setNumero] = useState("");
  const [priceCents, setPriceCents] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});

  function changeNumero(value: string) {
    setNumero(value.replace(/\D/g, ""));
    if (errors.numero) setErrors((current) => ({ ...current, numero: undefined }));
  }

  function changePrice(value: string) {
    const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
    const exceedsMaximum =
      digits.length > MAX_PRICE_CENTS.length ||
      (digits.length === MAX_PRICE_CENTS.length && digits > MAX_PRICE_CENTS);
    setPriceCents(exceedsMaximum ? MAX_PRICE_CENTS : digits);
    if (errors.preco) setErrors((current) => ({ ...current, preco: undefined }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedNumero = numero.trim();
    const preco = priceFromCents(priceCents);
    const nextErrors: FieldErrors = {};

    if (!normalizedNumero) nextErrors.numero = "Informe o número do lote.";
    else if (!/^\d+$/.test(normalizedNumero)) {
      nextErrors.numero = "O número do lote deve conter apenas dígitos.";
    }

    if (!priceCents || preco <= 0) nextErrors.preco = "Informe um preço maior que zero.";
    else if (preco > MAX_PRICE) {
      nextErrors.preco = "O preço máximo permitido é R$ 99.999.999,99.";
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    try {
      await onSubmit(normalizedNumero, preco);
      setNumero("");
      setPriceCents("");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : "Não foi possível criar o lote.";
      if (message.toLocaleLowerCase("pt-BR").includes("número")) {
        setErrors({ numero: message });
      } else {
        setErrors({ form: message });
      }
    }
  }

  return (
    <section className="panel form-panel" aria-labelledby="form-title">
      <div className="panel-heading form-heading">
        <div>
          <p className="eyebrow">Novo lote</p>
          <h2 id="form-title">Adicionar ao catálogo</h2>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="field">
          <div className="label-row">
            <label htmlFor="numero">Número do lote</label>
            <span>Somente dígitos</span>
          </div>
          <input
            id="numero"
            name="numero"
            maxLength={50}
            inputMode="numeric"
            pattern="[0-9]*"
            value={numero}
            onChange={(event) => changeNumero(event.target.value)}
            placeholder="Ex.: 07"
            aria-invalid={Boolean(errors.numero)}
            aria-describedby={errors.numero ? "numero-error" : undefined}
            autoComplete="off"
          />
          {errors.numero && (
            <p id="numero-error" className="field-error" role="alert">
              {errors.numero}
            </p>
          )}
        </div>

        <div className="field">
          <div className="label-row">
            <label htmlFor="preco">Preço inicial</label>
            <span>Máx. R$ 99.999.999,99</span>
          </div>
          <div className={`price-input ${errors.preco ? "has-error" : ""}`}>
            <span aria-hidden="true">R$</span>
            <input
              id="preco"
              name="preco"
              value={formatPrice(priceCents)}
              onChange={(event) => changePrice(event.target.value)}
              inputMode="numeric"
              placeholder="0,00"
              aria-invalid={Boolean(errors.preco)}
              aria-describedby={errors.preco ? "preco-error" : undefined}
              autoComplete="off"
            />
          </div>
          {errors.preco && (
            <p id="preco-error" className="field-error" role="alert">
              {errors.preco}
            </p>
          )}
        </div>

        {errors.form && (
          <p className="form-error" role="alert">
            {errors.form}
          </p>
        )}

        <button type="submit" className="primary-button" disabled={sending}>
          {sending ? (
            <>
              <span className="button-spinner" aria-hidden="true" />
              Adicionando…
            </>
          ) : (
            <>
              Adicionar lote
              <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>
    </section>
  );
}

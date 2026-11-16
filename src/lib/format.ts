const usd = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD" });

/** Formata em USD no padrão pt-BR, ex.: "US$ 110,00". Nunca converte para BRL. */
export function formatUSD(value: number): string {
  return usd.format(value);
}

/** "2026-11-15" → "15/11/2026" sem depender de fuso horário. */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`;
}

export const ACCOUNT_TYPE_LABEL: Record<"checking" | "savings" | "credit", string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  credit: "Cartão de crédito",
};

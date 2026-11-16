/**
 * Interpretador LOCAL de intenções (Etapa 1).
 * Não é um LLM nem um modelo conversacional: apenas palavras-chave e
 * sinônimos em português para as consultas previstas sobre a amostra local.
 */
import { REFERENCE_DATE } from "@/data/demoData";
import type { Category, TransactionFilters } from "@/services/finance/types";

export type RefusalKind = "operation" | "real-data" | "advice" | "sensitive";
export type UnsupportedKind = "currency" | "invoice";

export type IntentKind =
  | "accounts"
  | "balances"
  | "recent"
  | "category"
  | "spending"
  | "summary"
  | "help"
  | "refusal"
  | "unsupported"
  | "unknown";

export interface ParsedIntent {
  kind: IntentKind;
  category?: Category | undefined;
  refusal?: RefusalKind | undefined;
  unsupported?: UnsupportedKind | undefined;
  /** Filtros reconhecidos no próprio texto da pergunta. */
  filters: TransactionFilters;
}

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[?!.,;:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const REAL_DATA =
  /saldos? (real|reais)\b|dados reais|contas? (real|reais)\b|tempo real|real ?time|ao vivo|conect|vincul|integr(e|ar|acao)|\blog(in|ar)\b|entrar no (meu )?banco|acess(e|ar) (o |a |meu |minha )?(banco|conta)|open ?finance|banco de verdade|atualiza/;
const SENSITIVE =
  /senha|\bcpf\b|numero do cartao|\bcvv\b|upload|anex(ar|o)|envi(ar|o) (um |meu )?documento|meus documentos|credencia|\btoken\b|api ?key|chave (de api|secreta)/;
const OPERATION =
  /\bpix\b|\bted\b|transfir|transferir\b|transfere\b|(faca|fazer|faz|realiz\w*|efetu\w*|envi\w*|mand\w*|agend\w*) (uma |um |a |o )?(nova )?transferencia|\bpag(ar|ue|uem)\b|pagamento|estorn|boleto|\bsac(ar|ue)\b|\bsaque\b|deposit|emprest|(alterar|editar|mudar|ajustar|corrigir|zerar) (o |meu |os |meus )?saldo|cancel(ar|e)\b|bloque(ar|ie)|desbloque|aument(ar|e) (o |meu )?limite|\bcomprar\b/;
const ADVICE =
  /devo (investir|comprar|gastar|economizar|aplicar|pedir|pegar|guardar)|recomend|conselho|aconselh|investir|investimento|onde aplicar|vale a pena|me sugira|o que fazer com (meu|o) dinheiro/;
const CURRENCY = /\breais\b|\bbrl\b|r\$|convert|conversao|cotacao|cambio|em real\b/;
const INVOICE = /fatura|cobranca|protocolo|vencimento/;
const HELP =
  /^(oi|ola|ei|hey|bom dia|boa tarde|boa noite)\b|ajuda|\bhelp\b|o que (voce )?(faz|pode|sabe)|como (funciona|usar)|comandos|opcoes/;

const CATEGORY_PATTERNS: Array<[Category, RegExp]> = [
  ["alimentação", /aliment|comida|mercado|restaurante|refeic|\bcafe|delivery|lanche|almoco|jantar/],
  ["transporte", /transporte|\buber\b|onibus|metro|taxi|combustivel|gasolina/],
  ["transferência", /transferencia/],
  ["compras", /\bcompras\b|livraria|\blivros?\b|\bloja\b/],
  ["serviços", /servico/],
  ["receita", /receita|salario|renda\b|rendimento/],
];

const MONTHS = [
  "janeiro", "fevereiro", "marco", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function detectCategory(t: string): Category | undefined {
  for (const [cat, re] of CATEGORY_PATTERNS) if (re.test(t)) return cat;
  return undefined;
}

export function detectAccount(t: string): string | undefined {
  if (/business|empresarial|corporativo|da empresa/.test(t)) return "bc_001";
  if (/cartao|credit card/.test(t)) return "cc_001";
  if (/poupanca|\bsavings?\b/.test(t)) return "sv_001";
  if (/conta corrente|\bcorrente\b|checking/.test(t)) return "ck_001";
  return undefined;
}

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function shiftDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number) as [number, number, number];
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return iso(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

export function detectPeriod(
  t: string,
  referenceDate: string = REFERENCE_DATE,
): Pick<TransactionFilters, "startDate" | "endDate"> {
  const refYear = Number(referenceDate.slice(0, 4));

  const range = t.match(
    /de (\d{1,2})\/(\d{1,2})(?:\/(\d{4}))? (?:a|ate) (\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/,
  );
  if (range) {
    const [, d1, m1, y1, d2, m2, y2] = range;
    return {
      startDate: iso(Number(y1 ?? refYear), Number(m1), Number(d1)),
      endDate: iso(Number(y2 ?? y1 ?? refYear), Number(m2), Number(d2)),
    };
  }

  const lastDays = t.match(/ultimos (\d{1,3}) dias/);
  if (lastDays) {
    const n = Math.max(1, Number(lastDays[1]));
    return { startDate: shiftDays(referenceDate, -(n - 1)), endDate: referenceDate };
  }
  if (/ultima semana|ultimos sete dias/.test(t)) {
    return { startDate: shiftDays(referenceDate, -6), endDate: referenceDate };
  }
  if (/\bhoje\b/.test(t)) return { startDate: referenceDate, endDate: referenceDate };
  if (/\bontem\b/.test(t)) {
    const y = shiftDays(referenceDate, -1);
    return { startDate: y, endDate: y };
  }

  for (let i = 0; i < MONTHS.length; i++) {
    const re = new RegExp(`\\b${MONTHS[i]}\\b(?: de (\\d{4}))?`);
    const m = t.match(re);
    if (m) {
      const year = Number(m[1] ?? refYear);
      const lastDay = new Date(Date.UTC(year, i + 1, 0)).getUTCDate();
      return { startDate: iso(year, i + 1, 1), endDate: iso(year, i + 1, lastDay) };
    }
  }
  return {};
}

export function parseIntent(input: string): ParsedIntent {
  const t = normalize(input);
  const category = detectCategory(t);
  const accountId = detectAccount(t);
  const period = detectPeriod(t);
  const filters: TransactionFilters = {};
  if (accountId) filters.accountId = accountId;
  if (period.startDate) filters.startDate = period.startDate;
  if (period.endDate) filters.endDate = period.endDate;

  if (!t) return { kind: "help", filters: {} };
  if (REAL_DATA.test(t)) return { kind: "refusal", refusal: "real-data", filters: {} };
  if (SENSITIVE.test(t)) return { kind: "refusal", refusal: "sensitive", filters: {} };
  if (OPERATION.test(t)) return { kind: "refusal", refusal: "operation", filters: {} };
  if (ADVICE.test(t)) return { kind: "refusal", refusal: "advice", filters: {} };
  if (CURRENCY.test(t)) return { kind: "unsupported", unsupported: "currency", filters: {} };
  if (INVOICE.test(t)) return { kind: "unsupported", unsupported: "invoice", filters: {} };
  if (HELP.test(t)) return { kind: "help", filters: {} };

  const withCategory = category ? { ...filters, category } : filters;

  if (/resum|balanco|\btotal|totais|entradas e saidas|panorama|visao geral/.test(t))
    return { kind: "summary", filters: withCategory };
  if (/ultim|recent|extrato/.test(t)) return { kind: "recent", filters: withCategory };
  if (category) return { kind: "category", category, filters: withCategory };
  if (/gast|despes|consum/.test(t)) return { kind: "spending", filters };
  if (/recebi|entrada|saida|moviment/.test(t)) return { kind: "summary", filters };
  if (/saldo|limite|divida|disponivel|devendo|quanto devo|credito/.test(t))
    return { kind: "balances", filters };
  if (/transac|lancament/.test(t)) return { kind: "recent", filters };
  if (/\bcontas?\b/.test(t)) return { kind: "accounts", filters };
  return { kind: "unknown", filters: {} };
}

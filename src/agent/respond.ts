/**
 * Monta respostas estruturadas a partir do FinanceService.
 * Todo número exibido vem de um registro ou de um cálculo do serviço —
 * nenhum total é escrito à mão aqui.
 */
import { formatDate, formatUSD, plural } from "@/lib/format";
import type {
  Account,
  FinanceService,
  SampleInfo,
  SpendingSummary,
  Transaction,
  TransactionFilters,
} from "@/services/finance/types";
import { parseIntent, type IntentKind, type ParsedIntent } from "./intent";
import type { Block, ChartRow, TransactionRow } from "./types";

export const SUGGESTIONS = [
  "Mostrar minhas contas",
  "Consultar meus saldos",
  "Ver minhas últimas transações",
  "Quanto gastei com alimentação?",
  "Resumir minhas movimentações",
] as const;

export const INTERPRETER_NOTICE =
  "Fin MiniShop é um interpretador local de intenções, não um modelo de IA conversacional. Ele só responde às consultas previstas sobre a amostra fictícia.";

export interface AssistantReply {
  intent: IntentKind;
  blocks: Block[];
}

export function mergeFilters(ui: TransactionFilters, fromText: TransactionFilters): TransactionFilters {
  const out: TransactionFilters = {};
  const accountId = fromText.accountId ?? ui.accountId;
  const category = fromText.category ?? ui.category;
  const hasTextPeriod = Boolean(fromText.startDate || fromText.endDate);
  const startDate = hasTextPeriod ? fromText.startDate : ui.startDate;
  const endDate = hasTextPeriod ? fromText.endDate : ui.endDate;
  if (accountId) out.accountId = accountId;
  if (category) out.category = category;
  if (startDate) out.startDate = startDate;
  if (endDate) out.endDate = endDate;
  return out;
}

export function describeFilters(f: TransactionFilters, accounts: Account[]): string[] {
  const out: string[] = [];
  if (f.accountId) {
    const name = accounts.find((a) => a.id === f.accountId)?.name ?? f.accountId;
    out.push(`Conta: ${name}`);
  }
  if (f.category) out.push(`Categoria: ${f.category}`);
  if (f.startDate && f.endDate)
    out.push(`Período: ${formatDate(f.startDate)} a ${formatDate(f.endDate)}`);
  else if (f.startDate) out.push(`Período: a partir de ${formatDate(f.startDate)}`);
  else if (f.endDate) out.push(`Período: até ${formatDate(f.endDate)}`);
  return out;
}

function periodLabel(f: TransactionFilters, info: SampleInfo): string {
  const whole = info.range
    ? `toda a amostra (${formatDate(info.range.start)} a ${formatDate(info.range.end)})`
    : "toda a amostra";
  if (!f.startDate && !f.endDate) return whole.charAt(0).toUpperCase() + whole.slice(1);
  const from = f.startDate ? formatDate(f.startDate) : "início da amostra";
  const to = f.endDate ? formatDate(f.endDate) : "fim da amostra";
  return `${from} a ${to} (filtro)`;
}

function meta(
  info: SampleInfo,
  filters: TransactionFilters,
  accounts: Account[],
  records: string,
  period?: string,
): Block {
  return {
    type: "meta",
    source: info.sourceLabel,
    referenceDate: info.referenceDate,
    period: period ?? periodLabel(filters, info),
    records,
    filters: describeFilters(filters, accounts),
  };
}

function toRows(txs: Transaction[], accounts: Account[]): TransactionRow[] {
  return txs.map((t) => ({
    ...t,
    accountName: accounts.find((a) => a.id === t.accountId)?.name ?? t.accountId,
  }));
}

function dataNotes(txs: Transaction[]): Block[] {
  const notes = Array.from(new Set(txs.map((t) => t.dataNote).filter(Boolean))) as string[];
  return notes.map((text) => ({ type: "notice", tone: "info", text }));
}

function emptyReply(
  intent: IntentKind,
  info: SampleInfo,
  filters: TransactionFilters,
  accounts: Account[],
): AssistantReply {
  const range = info.range
    ? `A amostra cobre de ${formatDate(info.range.start)} a ${formatDate(info.range.end)}.`
    : "";
  return {
    intent,
    blocks: [
      {
        type: "notice",
        tone: "empty",
        text: `Nenhuma transação da amostra local corresponde aos filtros aplicados. ${range} Ajuste ou limpe os filtros para ver resultados.`.trim(),
      },
      meta(info, filters, accounts, "0 registros"),
      { type: "suggestions", items: [...SUGGESTIONS] },
    ],
  };
}

function hasTxFilters(f: TransactionFilters) {
  return Boolean(f.category || f.startDate || f.endDate);
}

function helpBlocks(lead: string): Block[] {
  return [
    {
      type: "text",
      text: lead,
      items: [
        "Listar as contas fictícias e seus tipos",
        "Consultar saldos (separando dinheiro, dívida e crédito disponível)",
        "Ver as 5 transações mais recentes",
        "Quanto foi gasto em uma categoria (ex.: alimentação, transporte, compras)",
        "Resumir entradas e saídas confirmadas, com pendentes à parte",
        "Usar filtros por conta, categoria e período (ex.: “em novembro”, “de 05/11 a 10/11”)",
      ],
    },
    { type: "notice", tone: "info", text: INTERPRETER_NOTICE },
    { type: "suggestions", items: [...SUGGESTIONS] },
  ];
}

const REFUSALS: Record<NonNullable<ParsedIntent["refusal"]>, { text: string; suggestions: string[] }> = {
  operation: {
    text: "Não posso fazer Pix, transferências, pagamentos, estornos, compras nem alterar saldos. O MiniShop Finance Lab é somente leitura e usa apenas dados fictícios — nenhum dinheiro é movimentado.",
    suggestions: ["Consultar meus saldos", "Ver minhas últimas transações"],
  },
  "real-data": {
    text: "Não tenho acesso a contas ou saldos reais e não me conecto a nenhum banco. Esta demonstração usa somente uma amostra local fictícia, sem atualização automática. Posso mostrar os saldos fictícios da amostra.",
    suggestions: ["Consultar meus saldos", "Mostrar minhas contas"],
  },
  advice: {
    text: "Não ofereço conselhos financeiros personalizados (investimentos, compras ou economia). Posso apenas mostrar e resumir os dados fictícios da amostra.",
    suggestions: ["Resumir minhas movimentações", "Quanto gastei com alimentação?"],
  },
  sensitive: {
    text: "Não envie senhas, documentos, números de cartão, chaves ou credenciais. Esta demonstração não aceita nem armazena dados sensíveis.",
    suggestions: ["Mostrar minhas contas"],
  },
};

const UNSUPPORTED: Record<NonNullable<ParsedIntent["unsupported"]>, { text: string; suggestions: string[] }> = {
  currency: {
    text: "Os valores da amostra estão em dólares americanos (USD). Não há cotação configurada, então não faço conversão para reais (BRL).",
    suggestions: ["Consultar meus saldos", "Resumir minhas movimentações"],
  },
  invoice: {
    text: "A amostra local não contém faturas, cobranças, vencimentos ou protocolos. Posso mostrar a dívida atual registrada nos cartões fictícios.",
    suggestions: ["Consultar meus saldos"],
  },
};

function chartRows(summary: SpendingSummary, excludeNonConsumption: boolean): ChartRow[] {
  return summary.byCategory
    .filter((c) => c.confirmedOutflow > 0 || c.pendingOutflow > 0)
    .filter((c) => !excludeNonConsumption || !summary.consumption.excludedCategories.includes(c.category))
    .map((c) => ({
      category: c.category,
      confirmed: c.confirmedOutflow,
      confirmedCount: c.confirmedCount,
      pending: c.pendingOutflow,
      pendingCount: c.pendingCount,
    }));
}

export async function respond(
  input: string,
  uiFilters: TransactionFilters,
  service: FinanceService,
): Promise<AssistantReply> {
  const parsed = parseIntent(input);
  const filters = mergeFilters(uiFilters, parsed.filters);
  const [info, accounts] = await Promise.all([service.getSampleInfo(), service.listAccounts()]);

  switch (parsed.kind) {
    case "refusal": {
      const r = REFUSALS[parsed.refusal ?? "operation"];
      return {
        intent: "refusal",
        blocks: [
          { type: "notice", tone: "limit", text: r.text },
          { type: "suggestions", items: r.suggestions },
        ],
      };
    }
    case "unsupported": {
      const u = UNSUPPORTED[parsed.unsupported ?? "invoice"];
      return {
        intent: "unsupported",
        blocks: [
          { type: "notice", tone: "limit", text: u.text },
          { type: "suggestions", items: u.suggestions },
        ],
      };
    }
    case "help":
      return {
        intent: "help",
        blocks: helpBlocks("Olá! Sou o Fin MiniShop. Com a amostra local fictícia, posso:"),
      };
    case "unknown":
      return {
        intent: "unknown",
        blocks: helpBlocks(
          "Não reconheci essa pergunta entre as consultas previstas. Não tenho acesso a bancos ou APIs — só à amostra local fictícia. Você pode pedir:",
        ),
      };

    case "accounts": {
      const list = filters.accountId ? accounts.filter((a) => a.id === filters.accountId) : accounts;
      const blocks: Block[] = [
        { type: "text", text: `Encontrei ${plural(list.length, "conta", "contas")} na amostra local:` },
        { type: "accounts", accounts: list },
        {
          type: "notice",
          tone: "info",
          text: "Os nomes das contas são inspirados no ambiente de testes (Sandbox) e não indicam vínculo com a Plaid. Todas as contas são fictícias.",
        },
      ];
      if (hasTxFilters(filters))
        blocks.push({ type: "notice", tone: "info", text: "Filtros de categoria e período não se aplicam à lista de contas." });
      blocks.push(meta(info, { accountId: filters.accountId }, accounts, plural(list.length, "conta", "contas"), "Fotografia da amostra"));
      return { intent: "accounts", blocks };
    }

    case "balances": {
      const all = await service.getBalances();
      const list = filters.accountId ? all.filter((b) => b.accountId === filters.accountId) : all;
      const cash = list.filter((b) => b.nature === "cash");
      const credit = list.filter((b) => b.nature === "credit");
      const sumC = (xs: number[]) => xs.reduce((s, v) => s + Math.round(v * 100), 0) / 100;
      const creditAvail = credit.filter((b) => b.availableBalance != null);
      const items = [];
      if (cash.length) {
        items.push({
          label: "Dinheiro em conta (saldo atual)",
          value: formatUSD(sumC(cash.map((b) => b.currentBalance))),
          hint: plural(cash.length, "conta corrente/poupança", "contas corrente/poupança"),
        });
        items.push({
          label: "Dinheiro disponível",
          value: formatUSD(sumC(cash.map((b) => b.availableBalance ?? 0))),
          hint: "Saldo disponível das mesmas contas",
          tone: "inflow" as const,
        });
      }
      if (credit.length) {
        items.push({
          label: "Dívida em cartões",
          value: formatUSD(sumC(credit.map((b) => b.currentBalance))),
          hint: plural(credit.length, "cartão", "cartões"),
          tone: "outflow" as const,
        });
        items.push({
          label: "Crédito disponível informado",
          value: formatUSD(sumC(creditAvail.map((b) => b.availableBalance ?? 0))),
          hint: `${creditAvail.length} de ${credit.length} ${credit.length === 1 ? "cartão informou" : "cartões informaram"} — é limite, não dinheiro`,
          tone: "muted" as const,
        });
      }
      const blocks: Block[] = [
        { type: "text", text: "Estes são os saldos da amostra, separados por tipo de conta:" },
        { type: "stats", label: "Resumo de saldos", items },
        { type: "balances", balances: list },
        {
          type: "notice",
          tone: "info",
          text: "Em cartões, o saldo atual é dívida e o crédito disponível é limite que ainda pode ser usado — não é dinheiro em conta. Os saldos são uma fotografia da amostra e não são recalculados a partir das transações.",
        },
      ];
      if (hasTxFilters(filters))
        blocks.push({ type: "notice", tone: "info", text: "Filtros de categoria e período não se aplicam a saldos." });
      blocks.push(meta(info, { accountId: filters.accountId }, accounts, plural(list.length, "conta", "contas"), "Fotografia da amostra"));
      return { intent: "balances", blocks };
    }

    case "recent": {
      const [top, all] = await Promise.all([
        service.listTransactions(filters, { limit: 5 }),
        service.listTransactions(filters),
      ]);
      if (top.length === 0) return emptyReply("recent", info, filters, accounts);
      const pending = top.filter((t) => t.pending).length;
      return {
        intent: "recent",
        blocks: [
          {
            type: "text",
            text: `Estas são as ${plural(top.length, "transação mais recente", "transações mais recentes")}, da mais nova para a mais antiga${pending ? ` (${plural(pending, "pendente", "pendentes")}, marcada${pending > 1 ? "s" : ""} na tabela)` : ""}:`,
          },
          { type: "transactions", caption: "Transações mais recentes (USD)", rows: toRows(top, accounts) },
          ...dataNotes(top),
          meta(info, filters, accounts, `${top.length} de ${plural(all.length, "registro", "registros")}`),
        ],
      };
    }

    case "category": {
      const cat = parsed.category!;
      const s = await service.getSpendingSummary(filters);
      if (s.totalRecords === 0) return emptyReply("category", info, filters, accounts);
      const blocks: Block[] = [];
      if (cat === "receita") {
        blocks.push({
          type: "text",
          text: `A categoria receita contém entradas, não gastos: ${formatUSD(s.confirmedInflow)} em ${plural(s.confirmedCount, "registro confirmado", "registros confirmados")}.`,
        });
      } else {
        const pendingTxt =
          s.pendingCount > 0
            ? ` Há também ${formatUSD(s.pendingOutflow)} ${s.pendingCount === 1 ? "pendente" : "pendentes"} (${plural(s.pendingCount, "registro", "registros")}), que não entram no total confirmado.`
            : " Não há transações pendentes nesta categoria.";
        blocks.push({
          type: "text",
          text: `Com ${cat}, as saídas confirmadas somam ${formatUSD(s.confirmedOutflow)} (${plural(s.confirmedCount, "registro", "registros")}).${pendingTxt}`,
        });
      }
      const items = [
        {
          label: "Saídas confirmadas",
          value: formatUSD(s.confirmedOutflow),
          hint: plural(s.transactions.filter((t) => !t.pending && t.amount > 0).length, "registro", "registros"),
          tone: "outflow" as const,
        },
        {
          label: "Pendentes (fora do total)",
          value: formatUSD(s.pendingOutflow),
          hint: plural(s.pendingCount, "registro", "registros"),
          tone: "pending" as const,
        },
      ];
      if (s.confirmedInflow > 0)
        items.push({
          label: "Entradas confirmadas",
          value: formatUSD(s.confirmedInflow),
          hint: plural(s.transactions.filter((t) => !t.pending && t.amount < 0).length, "registro", "registros"),
          tone: "inflow" as const,
        });
      blocks.push({ type: "stats", label: `Totais de ${cat}`, items });
      blocks.push({ type: "transactions", caption: `Registros usados — ${cat} (USD)`, rows: toRows(s.transactions, accounts) });
      if (cat === "transferência")
        blocks.push({
          type: "notice",
          tone: "info",
          text: "Transferências são movimentações entre contas ou de terceiros e não são somadas como consumo.",
        });
      blocks.push(...dataNotes(s.transactions));
      blocks.push(meta(info, filters, accounts, `${plural(s.totalRecords, "registro", "registros")} (${s.confirmedCount} confirmados, ${s.pendingCount} pendentes)`));
      return { intent: "category", blocks };
    }

    case "spending": {
      const s = await service.getSpendingSummary(filters);
      if (s.totalRecords === 0) return emptyReply("spending", info, filters, accounts);
      const rows = chartRows(s, true);
      const transfersOut = s.byCategory.find((c) => c.category === "transferência")?.confirmedOutflow ?? 0;
      return {
        intent: "spending",
        blocks: [
          {
            type: "text",
            text: `O consumo confirmado soma ${formatUSD(s.consumption.total)} em ${plural(s.consumption.count, "registro", "registros")}, sem contar transferências e receitas.`,
          },
          {
            type: "stats",
            label: "Consumo",
            items: [
              { label: "Consumo confirmado", value: formatUSD(s.consumption.total), hint: plural(s.consumption.count, "registro", "registros"), tone: "outflow" },
              { label: "Transferências enviadas", value: formatUSD(transfersOut), hint: "Não contam como consumo", tone: "muted" },
              { label: "Pendentes (fora do total)", value: formatUSD(s.pendingOutflow), hint: plural(s.pendingCount, "registro", "registros"), tone: "pending" },
            ],
          },
          { type: "categoryChart", caption: "Consumo confirmado por categoria (USD)", valueLabel: "Confirmado", rows },
          ...dataNotes(s.transactions.filter((t) => !s.consumption.excludedCategories.includes(t.category))),
          meta(info, filters, accounts, `${plural(s.totalRecords, "registro", "registros")} analisados`),
        ],
      };
    }

    case "summary": {
      const s = await service.getSpendingSummary(filters);
      if (s.totalRecords === 0) return emptyReply("summary", info, filters, accounts);
      const net = (Math.round(s.confirmedInflow * 100) - Math.round(s.confirmedOutflow * 100)) / 100;
      const transfersOut = s.byCategory.find((c) => c.category === "transferência")?.confirmedOutflow ?? 0;
      const range = s.recordRange ? ` entre ${formatDate(s.recordRange.start)} e ${formatDate(s.recordRange.end)}` : "";
      return {
        intent: "summary",
        blocks: [
          {
            type: "text",
            text: `Analisei ${plural(s.totalRecords, "registro", "registros")}${range}: ${plural(s.confirmedCount, "confirmado", "confirmados")} e ${plural(s.pendingCount, "pendente", "pendentes")}. Pendentes ficam fora dos totais confirmados.`,
          },
          {
            type: "stats",
            label: "Resumo das movimentações",
            items: [
              { label: "Confirmadas", value: String(s.confirmedCount), hint: "registros" },
              { label: "Pendentes", value: String(s.pendingCount), hint: `${formatUSD(s.pendingOutflow)} em saídas pendentes`, tone: "pending" },
              { label: "Entradas confirmadas", value: formatUSD(s.confirmedInflow), tone: "inflow" },
              { label: "Saídas confirmadas", value: formatUSD(s.confirmedOutflow), hint: transfersOut ? `Inclui ${formatUSD(transfersOut)} em transferências` : undefined, tone: "outflow" },
              { label: "Entradas − saídas", value: formatUSD(net), hint: "Somente confirmadas" },
              { label: "Consumo (sem transferências)", value: formatUSD(s.consumption.total), hint: plural(s.consumption.count, "registro", "registros"), tone: "muted" },
            ],
          },
          { type: "categoryChart", caption: "Saídas confirmadas por categoria (USD)", valueLabel: "Confirmado", rows: chartRows(s, false) },
          ...dataNotes(s.transactions),
          meta(info, filters, accounts, `${plural(s.totalRecords, "registro", "registros")} (${s.confirmedCount} confirmados, ${s.pendingCount} pendentes)`),
        ],
      };
    }
  }
}


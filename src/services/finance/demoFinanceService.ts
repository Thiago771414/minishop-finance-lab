import { DEMO_ACCOUNTS, DEMO_TRANSACTIONS, REFERENCE_DATE, SOURCE_LABEL } from "@/data/demoData";
import {
  CATEGORIES,
  type Account,
  type BalanceView,
  type Category,
  type CategoryTotals,
  type DateRange,
  type FinanceService,
  type ListTransactionsOptions,
  type SampleInfo,
  type SpendingSummary,
  type Transaction,
  type TransactionFilters,
} from "./types";

/** Categorias que nunca são somadas como consumo. */
export const NON_CONSUMPTION_CATEGORIES: Category[] = ["transferência", "receita"];

const toCents = (n: number) => Math.round(n * 100);
const fromCents = (c: number) => c / 100;

export function filterTransactions(
  txs: readonly Transaction[],
  f: TransactionFilters = {},
): Transaction[] {
  if (f.startDate && f.endDate && f.startDate > f.endDate) return [];
  return txs.filter(
    (t) =>
      (!f.accountId || t.accountId === f.accountId) &&
      (!f.category || t.category === f.category) &&
      (!f.startDate || t.date >= f.startDate) &&
      (!f.endDate || t.date <= f.endDate),
  );
}

export function sortByRecent(txs: readonly Transaction[]): Transaction[] {
  return [...txs].sort((a, b) =>
    a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date),
  );
}

export function dateRangeOf(txs: readonly Transaction[]): DateRange | null {
  if (txs.length === 0) return null;
  let start = txs[0]!.date;
  let end = start;
  for (const t of txs) {
    if (t.date < start) start = t.date;
    if (t.date > end) end = t.date;
  }
  return { start, end };
}

export function summarize(
  txs: readonly Transaction[],
  filters: TransactionFilters,
  referenceDate: string,
): SpendingSummary {
  type Acc = { co: number; ci: number; po: number; pi: number; cc: number; pc: number; coN: number; poN: number };
  const byCat = new Map<Category, Acc>();
  let confirmedCount = 0;
  let pendingCount = 0;
  let cIn = 0;
  let cOut = 0;
  let pIn = 0;
  let pOut = 0;
  let consCents = 0;
  let consCount = 0;

  for (const t of txs) {
    const cents = toCents(t.amount);
    const acc = byCat.get(t.category) ?? { co: 0, ci: 0, po: 0, pi: 0, cc: 0, pc: 0, coN: 0, poN: 0 };
    if (t.pending) {
      pendingCount++;
      acc.pc++;
      if (cents > 0) {
        pOut += cents;
        acc.po += cents;
        acc.poN++;
      } else {
        pIn += -cents;
        acc.pi += -cents;
      }
    } else {
      confirmedCount++;
      acc.cc++;
      if (cents > 0) {
        cOut += cents;
        acc.co += cents;
        acc.coN++;
        if (!NON_CONSUMPTION_CATEGORIES.includes(t.category)) {
          consCents += cents;
          consCount++;
        }
      } else {
        cIn += -cents;
        acc.ci += -cents;
      }
    }
    byCat.set(t.category, acc);
  }

  const byCategory: CategoryTotals[] = CATEGORIES.filter((c) => byCat.has(c))
    .map((category) => {
      const a = byCat.get(category)!;
      return {
        category,
        confirmedOutflow: fromCents(a.co),
        confirmedInflow: fromCents(a.ci),
        pendingOutflow: fromCents(a.po),
        pendingInflow: fromCents(a.pi),
        confirmedCount: a.cc,
        pendingCount: a.pc,
        confirmedOutflowCount: a.coN,
        pendingOutflowCount: a.poN,
      };
    })
    .sort((a, b) => b.confirmedOutflow - a.confirmedOutflow);

  return {
    filters: { ...filters },
    referenceDate,
    recordRange: dateRangeOf(txs),
    totalRecords: txs.length,
    confirmedCount,
    pendingCount,
    confirmedInflow: fromCents(cIn),
    confirmedOutflow: fromCents(cOut),
    pendingInflow: fromCents(pIn),
    pendingOutflow: fromCents(pOut),
    consumption: {
      total: fromCents(consCents),
      count: consCount,
      excludedCategories: [...NON_CONSUMPTION_CATEGORIES],
    },
    byCategory,
    transactions: sortByRecent(txs).map((t) => ({ ...t })),
  };
}

export function toBalanceView(a: Account): BalanceView {
  const credit = a.type === "credit";
  return {
    accountId: a.id,
    name: a.name,
    type: a.type,
    nature: credit ? "credit" : "cash",
    currentBalance: a.currentBalance,
    availableBalance: a.availableBalance,
    currentLabel: credit ? "Dívida (saldo atual)" : "Saldo atual",
    availableLabel: credit ? "Crédito disponível" : "Saldo disponível",
  };
}

export interface DemoFinanceServiceOptions {
  /** Atraso simulado em ms para exibir o estado de carregamento. */
  latencyMs?: number | undefined;
  accounts?: readonly Account[] | undefined;
  transactions?: readonly Transaction[] | undefined;
  referenceDate?: string | undefined;
}

/** Implementação local, somente leitura, sobre a amostra fictícia. */
export class DemoFinanceService implements FinanceService {
  readonly sourceLabel = SOURCE_LABEL;
  private readonly latencyMs: number;
  private readonly accounts: readonly Account[];
  private readonly transactions: readonly Transaction[];
  private readonly referenceDate: string;

  constructor(options: DemoFinanceServiceOptions = {}) {
    this.latencyMs = options.latencyMs ?? 300;
    this.accounts = options.accounts ?? DEMO_ACCOUNTS;
    this.transactions = options.transactions ?? DEMO_TRANSACTIONS;
    this.referenceDate = options.referenceDate ?? REFERENCE_DATE;
  }

  private async delay() {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
  }

  async listAccounts(): Promise<Account[]> {
    await this.delay();
    return this.accounts.map((a) => ({ ...a }));
  }

  async getBalances(): Promise<BalanceView[]> {
    await this.delay();
    return this.accounts.map(toBalanceView);
  }

  async listTransactions(
    filters: TransactionFilters = {},
    options: ListTransactionsOptions = {},
  ): Promise<Transaction[]> {
    await this.delay();
    const sorted = sortByRecent(filterTransactions(this.transactions, filters));
    const limited = options.limit != null ? sorted.slice(0, options.limit) : sorted;
    return limited.map((t) => ({ ...t }));
  }

  async getSpendingSummary(filters: TransactionFilters = {}): Promise<SpendingSummary> {
    await this.delay();
    return summarize(filterTransactions(this.transactions, filters), filters, this.referenceDate);
  }

  async getSampleInfo(): Promise<SampleInfo> {
    return {
      referenceDate: this.referenceDate,
      range: dateRangeOf(this.transactions),
      totalTransactions: this.transactions.length,
      sourceLabel: this.sourceLabel,
    };
  }
}

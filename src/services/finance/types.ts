/**
 * Contratos de leitura financeira usados pela interface.
 * A UI depende apenas de `FinanceService`; a Etapa 1 usa `DemoFinanceService`
 * (amostra local) e a Etapa 2 poderá trocar por `RemoteFinanceService`.
 * Todos os valores estão em USD. Convenção de `amount` (igual à Plaid):
 * positivo = saída, negativo = entrada.
 */

export type AccountType = "checking" | "savings" | "credit";

export const CATEGORIES = [
  "alimentação",
  "transporte",
  "transferência",
  "compras",
  "serviços",
  "receita",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Account {
  readonly id: string;
  readonly name: string;
  readonly type: AccountType;
  /** Para contas de crédito, representa a dívida atual. */
  readonly currentBalance: number;
  /** Para contas de crédito, representa o crédito disponível; null = não informado. */
  readonly availableBalance: number | null;
  readonly note: string;
  readonly currency: "USD";
}

export interface Transaction {
  readonly id: string;
  /** ISO yyyy-mm-dd */
  readonly date: string;
  readonly accountId: string;
  readonly description: string;
  readonly category: Category;
  /** Positivo = saída, negativo = entrada. */
  readonly amount: number;
  readonly pending: boolean;
  readonly currency: "USD";
  /** Observação explícita sobre o próprio registro da amostra. */
  readonly dataNote?: string | undefined;
}

export interface TransactionFilters {
  accountId?: string | undefined;
  category?: Category | undefined;
  /** ISO yyyy-mm-dd, inclusivo */
  startDate?: string | undefined;
  /** ISO yyyy-mm-dd, inclusivo */
  endDate?: string | undefined;
}

export interface DateRange {
  start: string;
  end: string;
}

export type BalanceNature = "cash" | "credit";

export interface BalanceView {
  accountId: string;
  name: string;
  type: AccountType;
  nature: BalanceNature;
  currentBalance: number;
  availableBalance: number | null;
  currentLabel: string;
  availableLabel: string;
}

export interface CategoryTotals {
  category: Category;
  confirmedOutflow: number;
  confirmedInflow: number;
  pendingOutflow: number;
  pendingInflow: number;
  confirmedCount: number;
  pendingCount: number;
  /** Registros confirmados com valor positivo (saídas). */
  confirmedOutflowCount: number;
  pendingOutflowCount: number;
}

export interface SpendingSummary {
  filters: TransactionFilters;
  referenceDate: string;
  /** Primeira e última data entre os registros usados. */
  recordRange: DateRange | null;
  totalRecords: number;
  confirmedCount: number;
  pendingCount: number;
  confirmedInflow: number;
  confirmedOutflow: number;
  pendingInflow: number;
  pendingOutflow: number;
  /** Saídas confirmadas que não são transferências nem receitas. */
  consumption: { total: number; count: number; excludedCategories: Category[] };
  byCategory: CategoryTotals[];
  /** Registros usados no cálculo, do mais recente ao mais antigo. */
  transactions: Transaction[];
}

export interface SampleInfo {
  referenceDate: string;
  range: DateRange | null;
  totalTransactions: number;
  sourceLabel: string;
}

export interface ListTransactionsOptions {
  limit?: number | undefined;
}

export interface FinanceService {
  readonly sourceLabel: string;
  listAccounts(): Promise<Account[]>;
  getBalances(): Promise<BalanceView[]>;
  listTransactions(
    filters?: TransactionFilters,
    options?: ListTransactionsOptions,
  ): Promise<Transaction[]>;
  getSpendingSummary(filters?: TransactionFilters): Promise<SpendingSummary>;
  getSampleInfo(): Promise<SampleInfo>;
}

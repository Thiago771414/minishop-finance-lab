/**
 * CONTRATO RESERVADO PARA A ETAPA 2 — NÃO IMPLEMENTADO.
 *
 * Arquitetura pretendida (futura):
 *   UI → backend autenticado → Plaid Sandbox (accounts/get, transactions/get com
 *   paginação) → agregações no backend → UI.
 *
 * Nesta Etapa 1 não existe backend, segredo, Plaid, Pluggy, MCP nem Lovable Cloud.
 * Qualquer chamada lança erro para deixar explícito que não há dados remotos.
 */
import type {
  Account,
  BalanceView,
  FinanceService,
  ListTransactionsOptions,
  SampleInfo,
  SpendingSummary,
  Transaction,
  TransactionFilters,
} from "./types";

const notImplemented = () =>
  new Error("RemoteFinanceService não está implementado na Etapa 1 (somente amostra local).");

export class RemoteFinanceService implements FinanceService {
  readonly sourceLabel = "Backend autenticado (Etapa 2 — não implementado)";

  async listAccounts(): Promise<Account[]> {
    throw notImplemented();
  }
  async getBalances(): Promise<BalanceView[]> {
    throw notImplemented();
  }
  async listTransactions(
    _filters?: TransactionFilters,
    _options?: ListTransactionsOptions,
  ): Promise<Transaction[]> {
    throw notImplemented();
  }
  async getSpendingSummary(_filters?: TransactionFilters): Promise<SpendingSummary> {
    throw notImplemented();
  }
  async getSampleInfo(): Promise<SampleInfo> {
    throw notImplemented();
  }
}

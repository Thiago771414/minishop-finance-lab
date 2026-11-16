/**
 * Amostra sintética criada para o MiniShop Finance Lab.
 * Nenhum registro corresponde a clientes, contas ou instituições reais,
 * e nada aqui é resposta de uma API. Valores em USD.
 * Convenção de `amount`: positivo = saída, negativo = entrada.
 */
import type { Account, Transaction } from "@/services/finance/types";

export const REFERENCE_DATE = "2026-11-15";
export const SOURCE_LABEL = "Amostra local";

export const DEMO_ACCOUNTS: readonly Account[] = Object.freeze(
  [
    {
      id: "ck_001",
      name: "Plaid Checking — Demo",
      type: "checking",
      currentBalance: 110.0,
      availableBalance: 100.0,
      note: "Conta corrente",
      currency: "USD",
    },
    {
      id: "sv_001",
      name: "Plaid Saving — Demo",
      type: "savings",
      currentBalance: 210.0,
      availableBalance: 200.0,
      note: "Poupança",
      currency: "USD",
    },
    {
      id: "cc_001",
      name: "Plaid Credit Card — Demo",
      type: "credit",
      currentBalance: 410.0,
      availableBalance: null,
      note: "Saldo atual é dívida",
      currency: "USD",
    },
    {
      id: "bc_001",
      name: "Plaid Business Credit Card — Demo",
      type: "credit",
      currentBalance: 5020.0,
      availableBalance: 4980.0,
      note: "Dívida + crédito disponível, não dinheiro em conta",
      currency: "USD",
    },
  ].map((a) => Object.freeze(a as Account)),
);

export const DEMO_TRANSACTIONS: readonly Transaction[] = Object.freeze(
  [
    { id: "tx01", date: "2026-11-13", accountId: "ck_001", description: "Mercado Central (exemplo)", category: "alimentação", amount: 32.4, pending: false },
    { id: "tx02", date: "2026-11-12", accountId: "ck_001", description: "Transporte Urbano (exemplo)", category: "transporte", amount: 8.5, pending: false },
    { id: "tx03", date: "2026-11-11", accountId: "ck_001", description: "Transferência recebida (exemplo)", category: "transferência", amount: -180.0, pending: false },
    { id: "tx04", date: "2026-11-10", accountId: "cc_001", description: "Café Bairro (exemplo)", category: "alimentação", amount: 12.8, pending: false },
    { id: "tx05", date: "2026-11-09", accountId: "cc_001", description: "Livraria (exemplo)", category: "compras", amount: 45.0, pending: false },
    { id: "tx06", date: "2026-11-08", accountId: "ck_001", description: "Alimentação Delivery (exemplo)", category: "alimentação", amount: 25.3, pending: false },
    {
      id: "tx07", date: "2026-11-07", accountId: "sv_001", description: "Transferência para poupança (exemplo)", category: "transferência", amount: 100.0, pending: false,
      dataNote: "Na amostra, “Transferência para poupança” (tx07) tem valor positivo na conta poupança e, pela convenção usada, conta como saída de sv_001.",
    },
    { id: "tx08", date: "2026-11-06", accountId: "ck_001", description: "Serviços (exemplo)", category: "serviços", amount: 40.0, pending: false },
    { id: "tx09", date: "2026-11-05", accountId: "cc_001", description: "Refeição pendente (exemplo)", category: "alimentação", amount: 18.0, pending: true },
    { id: "tx10", date: "2026-11-04", accountId: "ck_001", description: "Salário fictício (exemplo)", category: "receita", amount: -250.0, pending: false },
  ].map((t) => Object.freeze({ ...t, currency: "USD" } as Transaction)),
);

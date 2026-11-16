import { describe, expect, it } from "vitest";

import { DEMO_TRANSACTIONS } from "@/data/demoData";
import { DemoFinanceService } from "@/services/finance/demoFinanceService";
import { formatUSD } from "@/lib/format";

const service = new DemoFinanceService({ latencyMs: 0 });
const plain = (s: string) => s.replace(/\u00a0/g, " ");

describe("Regras financeiras da amostra local", () => {
  it("lista 4 contas", async () => {
    expect(await service.listAccounts()).toHaveLength(4);
  });

  it("formata USD em pt-BR como US$ 110,00", () => {
    expect(plain(formatUSD(110))).toBe("US$ 110,00");
    expect(plain(formatUSD(5020))).toBe("US$ 5.020,00");
  });

  it("separa dívida e crédito disponível nos cartões", async () => {
    const balances = await service.getBalances();
    const cc = balances.find((b) => b.accountId === "cc_001")!;
    const bc = balances.find((b) => b.accountId === "bc_001")!;
    const ck = balances.find((b) => b.accountId === "ck_001")!;
    expect(cc.nature).toBe("credit");
    expect(cc.currentLabel).toBe("Dívida (saldo atual)");
    expect(cc.availableBalance).toBeNull();
    expect(bc.availableLabel).toBe("Crédito disponível");
    expect(bc.availableBalance).toBe(4980);
    expect(ck.nature).toBe("cash");
    expect(ck.availableLabel).toBe("Saldo disponível");
  });

  it("retorna as 5 transações mais recentes em ordem decrescente", async () => {
    const top = await service.listTransactions({}, { limit: 5 });
    expect(top.map((t) => t.id)).toEqual(["tx01", "tx02", "tx03", "tx04", "tx05"]);
  });

  it("alimentação: US$ 70,50 confirmados e US$ 18,00 pendentes à parte", async () => {
    const s = await service.getSpendingSummary({ category: "alimentação" });
    expect(s.confirmedOutflow).toBe(70.5);
    expect(s.pendingOutflow).toBe(18);
    expect(s.confirmedCount).toBe(3);
    expect(s.pendingCount).toBe(1);
  });

  it("resumo: 9 confirmadas, 1 pendente, entradas 430 e saídas 264", async () => {
    const s = await service.getSpendingSummary();
    expect(s.confirmedCount).toBe(9);
    expect(s.pendingCount).toBe(1);
    expect(s.confirmedInflow).toBe(430);
    expect(s.confirmedOutflow).toBe(264);
  });

  it("consumo não soma transferências (264 − 100 = 164)", async () => {
    const s = await service.getSpendingSummary();
    expect(s.consumption.total).toBe(164);
    expect(s.consumption.count).toBe(6);
  });

  it("filtros recalculam totais sem alterar os dados originais", async () => {
    const before = JSON.stringify(DEMO_TRANSACTIONS);
    const s = await service.getSpendingSummary({
      accountId: "ck_001",
      startDate: "2026-11-08",
      endDate: "2026-11-13",
    });
    expect(s.totalRecords).toBe(4);
    expect(s.confirmedOutflow).toBe(66.2);
    expect(s.confirmedInflow).toBe(180);
    s.transactions[0]!.description;
    expect(JSON.stringify(DEMO_TRANSACTIONS)).toBe(before);
    expect((await service.getSpendingSummary()).totalRecords).toBe(10);
  });

  it("período sem dados retorna zero registros", async () => {
    const s = await service.getSpendingSummary({ startDate: "2026-10-01", endDate: "2026-10-31" });
    expect(s.totalRecords).toBe(0);
  });
});

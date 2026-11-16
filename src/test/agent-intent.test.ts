import { describe, expect, it } from "vitest";

import { parseIntent } from "@/agent/intent";
import { respond, SUGGESTIONS } from "@/agent/respond";
import { DemoFinanceService } from "@/services/finance/demoFinanceService";

const service = new DemoFinanceService({ latencyMs: 0 });
const text = (blocks: unknown) => JSON.stringify(blocks).replace(/\\u00a0|\u00a0/g, " ");

describe("Interpretador local de intenções", () => {
  it("mapeia as cinco sugestões para as intenções previstas", () => {
    expect(SUGGESTIONS.map((s) => parseIntent(s).kind)).toEqual([
      "accounts",
      "balances",
      "recent",
      "category",
      "summary",
    ]);
  });

  it.each(["faça um Pix", "qual meu saldo real?", "conecte ao meu banco"])(
    "recusa com transparência: %s",
    async (q) => {
      expect(parseIntent(q).kind).toBe("refusal");
      const r = await respond(q, {}, service);
      expect(r.blocks.some((b) => b.type === "notice" && b.tone === "limit")).toBe(true);
      expect(r.blocks.some((b) => b.type === "stats" || b.type === "transactions")).toBe(false);
    },
  );

  it("pergunta desconhecida recebe ajuda, não dados", async () => {
    const r = await respond("qual a previsão do tempo?", {}, service);
    expect(r.intent).toBe("unknown");
    expect(r.blocks.some((b) => b.type === "transactions")).toBe(false);
  });

  it("resposta de alimentação mostra US$ 70,50 e US$ 18,00 pendentes", async () => {
    const r = await respond("Quanto gastei com alimentação?", {}, service);
    const t = text(r.blocks);
    expect(t).toContain("US$ 70,50");
    expect(t).toContain("US$ 18,00");
  });

  it("filtro digitado no texto restringe por conta", async () => {
    const r = await respond("alimentação no cartão de crédito", {}, service);
    const t = text(r.blocks);
    expect(t).toContain("US$ 12,80");
    expect(t).toContain("US$ 18,00");
  });

  it("filtros da interface sem resultados geram estado vazio", async () => {
    const r = await respond("Resumir minhas movimentações", { startDate: "2026-10-01", endDate: "2026-10-31" }, service);
    expect(r.blocks.some((b) => b.type === "notice" && b.tone === "empty")).toBe(true);
  });
});

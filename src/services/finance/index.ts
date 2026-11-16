import { DemoFinanceService } from "./demoFinanceService";
import type { FinanceService } from "./types";

export * from "./types";

/** Etapa 1: sempre a amostra local. Na Etapa 2, trocar aqui pelo RemoteFinanceService. */
export function createFinanceService(): FinanceService {
  return new DemoFinanceService();
}

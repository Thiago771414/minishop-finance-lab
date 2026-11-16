import type { Account, BalanceView, Category, Transaction } from "@/services/finance/types";

export type StatTone = "default" | "inflow" | "outflow" | "pending" | "muted";

export interface StatItem {
  label: string;
  value: string;
  hint?: string | undefined;
  tone?: StatTone | undefined;
}

export interface TransactionRow extends Transaction {
  accountName: string;
}

export interface ChartRow {
  category: Category;
  confirmed: number;
  confirmedCount: number;
  pending: number;
  pendingCount: number;
}

export type Block =
  | { type: "text"; text: string; items?: string[] | undefined }
  | { type: "accounts"; accounts: Account[] }
  | { type: "balances"; balances: BalanceView[] }
  | { type: "transactions"; caption: string; rows: TransactionRow[] }
  | { type: "stats"; label: string; items: StatItem[] }
  | { type: "categoryChart"; caption: string; valueLabel: string; rows: ChartRow[] }
  | { type: "notice"; tone: "info" | "limit" | "empty"; text: string }
  | {
      type: "meta";
      source: string;
      referenceDate: string;
      period: string;
      records: string;
      filters: string[];
    }
  | { type: "suggestions"; items: string[] };

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  createdAt: string;
  text?: string | undefined;
  blocks?: Block[] | undefined;
  error?: string | undefined;
  retryText?: string | undefined;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

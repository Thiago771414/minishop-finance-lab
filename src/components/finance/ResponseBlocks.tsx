import { CircleSlash, Info, ShieldAlert } from "lucide-react";

import type { Block, ChartRow, StatTone, TransactionRow } from "@/agent/types";
import { Button } from "@/components/ui/button";
import { ACCOUNT_TYPE_LABEL, formatDate, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Account, BalanceView } from "@/services/finance/types";

const toneClass: Record<StatTone, string> = {
  default: "text-foreground",
  inflow: "text-inflow",
  outflow: "text-foreground",
  pending: "text-pending",
  muted: "text-muted-foreground",
};

function TableShell({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card scrollbar-thin">
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <caption className="border-b bg-surface px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {caption}
        </caption>
        {children}
      </table>
    </div>
  );
}

const th = "px-3 py-2 text-left text-xs font-semibold text-muted-foreground";
const thNum = "px-3 py-2 text-right text-xs font-semibold text-muted-foreground";
const td = "px-3 py-2 align-top";
const tdNum = "px-3 py-2 text-right align-top font-mono tabular-nums";

function AccountsBlock({ accounts }: { accounts: Account[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2" aria-label="Contas da amostra">
      {accounts.map((a) => {
        const credit = a.type === "credit";
        return (
          <li key={a.id} className="rounded-lg border bg-card p-4 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold leading-tight">{a.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {ACCOUNT_TYPE_LABEL[a.type]} · <span className="font-mono">{a.id}</span>
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  credit ? "bg-secondary text-secondary-foreground" : "bg-inflow-soft text-inflow",
                )}
              >
                {credit ? "Crédito" : "Dinheiro"}
              </span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">{credit ? "Dívida (saldo atual)" : "Saldo atual"}</dt>
                <dd className="font-mono tabular-nums font-medium">{formatUSD(a.currentBalance)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">{credit ? "Crédito disponível" : "Saldo disponível"}</dt>
                <dd className="font-mono tabular-nums font-medium">
                  {a.availableBalance == null ? (
                    <span className="font-sans text-xs font-normal text-muted-foreground">Não informado na amostra</span>
                  ) : (
                    formatUSD(a.availableBalance)
                  )}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">{a.note}</p>
          </li>
        );
      })}
    </ul>
  );
}

function BalancesBlock({ balances }: { balances: BalanceView[] }) {
  return (
    <TableShell caption="Saldos por conta (USD)">
      <thead>
        <tr className="border-b">
          <th scope="col" className={th}>Conta</th>
          <th scope="col" className={th}>Natureza</th>
          <th scope="col" className={thNum}>Saldo atual / dívida</th>
          <th scope="col" className={thNum}>Disponível / crédito</th>
        </tr>
      </thead>
      <tbody>
        {balances.map((b) => (
          <tr key={b.accountId} className="border-b last:border-0">
            <th scope="row" className={cn(td, "text-left font-medium")}>
              {b.name}
              <span className="block text-xs font-normal text-muted-foreground">{ACCOUNT_TYPE_LABEL[b.type]}</span>
            </th>
            <td className={td}>{b.nature === "cash" ? "Dinheiro em conta" : "Dívida de cartão"}</td>
            <td className={tdNum}>
              <span className="block font-sans text-[11px] text-muted-foreground">{b.currentLabel}</span>
              {formatUSD(b.currentBalance)}
            </td>
            <td className={tdNum}>
              <span className="block font-sans text-[11px] text-muted-foreground">{b.availableLabel}</span>
              {b.availableBalance == null ? (
                <span className="font-sans text-xs text-muted-foreground">Não informado</span>
              ) : (
                formatUSD(b.availableBalance)
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}

function TransactionsBlock({ caption, rows }: { caption: string; rows: TransactionRow[] }) {
  return (
    <TableShell caption={caption}>
      <thead>
        <tr className="border-b">
          <th scope="col" className={th}>Data</th>
          <th scope="col" className={th}>Descrição</th>
          <th scope="col" className={th}>Conta</th>
          <th scope="col" className={th}>Categoria</th>
          <th scope="col" className={thNum}>Valor</th>
          <th scope="col" className={th}>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((t) => {
          const inflow = t.amount < 0;
          return (
            <tr key={t.id} className="border-b last:border-0">
              <td className={cn(td, "whitespace-nowrap font-mono tabular-nums")}>{formatDate(t.date)}</td>
              <th scope="row" className={cn(td, "text-left font-medium")}>{t.description}</th>
              <td className={cn(td, "text-muted-foreground")}>{t.accountName}</td>
              <td className={td}>{t.category}</td>
              <td className={cn(tdNum, "whitespace-nowrap", inflow ? "text-inflow" : "text-foreground")}>
                <span className="block font-sans text-[11px] text-muted-foreground">{inflow ? "Entrada" : "Saída"}</span>
                {formatUSD(Math.abs(t.amount))}
              </td>
              <td className={td}>
                <span
                  className={cn(
                    "inline-block rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    t.pending ? "border-dashed border-pending text-pending" : "border-transparent bg-secondary text-secondary-foreground",
                  )}
                >
                  {t.pending ? "Pendente" : "Confirmada"}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableShell>
  );
}

function StatsBlock({ label, items }: { label: string; items: Extract<Block, { type: "stats" }>["items"] }) {
  return (
    <section aria-label={label}>
      <dl className="grid grid-cols-2 gap-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 shadow-soft">
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className={cn("mt-1 font-mono text-lg font-semibold tabular-nums", toneClass[s.tone ?? "default"])}>
              {s.value}
            </dd>
            {s.hint ? <dd className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</dd> : null}
          </div>
        ))}
      </dl>
    </section>
  );
}

function CategoryChartBlock({ caption, valueLabel, rows }: { caption: string; valueLabel: string; rows: ChartRow[] }) {
  const max = Math.max(...rows.map((r) => r.confirmed), 0.01);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border bg-card p-4 shadow-soft" aria-hidden="true">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{caption}</p>
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.category} className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-2 text-sm">
              <span className="truncate">{r.category}</span>
              <span className="h-3 overflow-hidden rounded-full bg-surface">
                <span
                  className="block h-full rounded-full bg-primary"
                  style={{ width: `${Math.max(2, (r.confirmed / max) * 100)}%` }}
                />
              </span>
              <span className="font-mono text-xs tabular-nums">{formatUSD(r.confirmed)}</span>
            </li>
          ))}
        </ul>
      </div>
      <TableShell caption={`${caption} — tabela`}>
        <thead>
          <tr className="border-b">
            <th scope="col" className={th}>Categoria</th>
            <th scope="col" className={thNum}>{valueLabel}</th>
            <th scope="col" className={thNum}>Saídas confirmadas (registros)</th>
            <th scope="col" className={thNum}>Pendente (fora do total)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.category} className="border-b last:border-0">
              <th scope="row" className={cn(td, "text-left font-medium")}>{r.category}</th>
              <td className={tdNum}>{formatUSD(r.confirmed)}</td>
              <td className={tdNum}>{r.confirmedCount}</td>
              <td className={cn(tdNum, "text-pending")}>
                {r.pendingCount ? `${formatUSD(r.pending)} (${r.pendingCount})` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </TableShell>
    </div>
  );
}

function NoticeBlock({ tone, text }: { tone: "info" | "limit" | "empty"; text: string }) {
  const Icon = tone === "limit" ? ShieldAlert : tone === "empty" ? CircleSlash : Info;
  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border px-3 py-2.5 text-sm",
        tone === "limit" && "border-primary/30 bg-primary-soft text-primary-deep",
        tone === "empty" && "border-dashed bg-surface text-foreground",
        tone === "info" && "bg-surface text-muted-foreground",
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}

function MetaBlock(b: Extract<Block, { type: "meta" }>) {
  return (
    <div className="rounded-md border-t pt-2 text-[11px] leading-relaxed text-muted-foreground">
      <p>
        <span className="font-semibold">Fonte:</span> {b.source} (dados fictícios) ·{" "}
        <span className="font-semibold">Referência:</span> {formatDate(b.referenceDate)} ·{" "}
        <span className="font-semibold">Período:</span> {b.period} ·{" "}
        <span className="font-semibold">Registros usados:</span> {b.records}
      </p>
      {b.filters.length ? (
        <ul className="mt-1 flex flex-wrap gap-1" aria-label="Filtros aplicados">
          {b.filters.map((f) => (
            <li key={f} className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">{f}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ResponseBlocks({
  blocks,
  onSuggestion,
  disabled,
}: {
  blocks: Block[];
  onSuggestion: (text: string) => void;
  disabled?: boolean | undefined;
}) {
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "text":
            return (
              <div key={i} className="text-[15px] leading-relaxed">
                <p>{b.text}</p>
                {b.items ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {b.items.map((it) => <li key={it}>{it}</li>)}
                  </ul>
                ) : null}
              </div>
            );
          case "accounts":
            return <AccountsBlock key={i} accounts={b.accounts} />;
          case "balances":
            return <BalancesBlock key={i} balances={b.balances} />;
          case "transactions":
            return <TransactionsBlock key={i} caption={b.caption} rows={b.rows} />;
          case "stats":
            return <StatsBlock key={i} label={b.label} items={b.items} />;
          case "categoryChart":
            return <CategoryChartBlock key={i} caption={b.caption} valueLabel={b.valueLabel} rows={b.rows} />;
          case "notice":
            return <NoticeBlock key={i} tone={b.tone} text={b.text} />;
          case "meta":
            return <MetaBlock key={i} {...b} />;
          case "suggestions":
            return (
              <div key={i} className="flex flex-wrap gap-2" role="group" aria-label="Consultas sugeridas">
                {b.items.map((s) => (
                  <Button key={s} variant="chip" size="sm" disabled={disabled} onClick={() => onSuggestion(s)}>
                    {s}
                  </Button>
                ))}
              </div>
            );
        }
      })}
    </div>
  );
}

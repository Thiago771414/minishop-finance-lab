import { SlidersHorizontal, X } from "lucide-react";
import { useId, useState } from "react";

import { describeFilters } from "@/agent/respond";
import { Button } from "@/components/ui/button";
import { CATEGORIES, type Account, type Category, type TransactionFilters } from "@/services/finance/types";

const field =
  "h-9 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring";

export function FilterBar({
  filters,
  onChange,
  accounts,
}: {
  filters: TransactionFilters;
  onChange: (f: TransactionFilters) => void;
  accounts: Account[];
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const labels = describeFilters(filters, accounts);
  const invalid = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);

  const set = (patch: Partial<TransactionFilters>) => {
    const next: TransactionFilters = { ...filters };
    for (const [k, v] of Object.entries(patch) as Array<[keyof TransactionFilters, string | undefined]>) {
      if (v) (next as Record<string, string>)[k] = v;
      else delete next[k];
    }
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={() => setOpen((o) => !o)}
        >
          <SlidersHorizontal />
          Filtros{labels.length ? ` (${labels.length})` : ""}
        </Button>
        {labels.length ? (
          <>
            <ul className="flex flex-wrap gap-1" aria-label="Filtros ativos para as próximas perguntas">
              {labels.map((l) => (
                <li key={l} className="rounded-full bg-primary-soft px-2 py-0.5 text-xs text-primary-deep">
                  {l}
                </li>
              ))}
            </ul>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange({})}>
              <X />
              Limpar
            </Button>
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Sem filtros: toda a amostra</span>
        )}
      </div>

      {open ? (
        <fieldset id={`${id}-panel`} className="grid grid-cols-2 gap-2 rounded-lg border bg-surface p-3 sm:grid-cols-4">
          <legend className="sr-only">Filtros por conta, categoria e período</legend>
          <label className="col-span-2 space-y-1 text-xs font-medium text-muted-foreground sm:col-span-1">
            Conta
            <select
              className={field}
              value={filters.accountId ?? ""}
              onChange={(e) => set({ accountId: e.target.value || undefined })}
            >
              <option value="">Todas</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="col-span-2 space-y-1 text-xs font-medium text-muted-foreground sm:col-span-1">
            Categoria
            <select
              className={field}
              value={filters.category ?? ""}
              onChange={(e) => set({ category: (e.target.value || undefined) as Category | undefined })}
            >
              <option value="">Todas</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            De
            <input
              type="date"
              className={field}
              value={filters.startDate ?? ""}
              onChange={(e) => set({ startDate: e.target.value || undefined })}
            />
          </label>
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            Até
            <input
              type="date"
              className={field}
              value={filters.endDate ?? ""}
              onChange={(e) => set({ endDate: e.target.value || undefined })}
            />
          </label>
          <p className="col-span-2 text-[11px] text-muted-foreground sm:col-span-4" role={invalid ? "alert" : undefined}>
            {invalid
              ? "A data inicial é posterior à final — nenhuma transação será encontrada."
              : "Os filtros valem para as próximas perguntas e não alteram os dados originais da amostra."}
          </p>
        </fieldset>
      ) : null}
    </div>
  );
}

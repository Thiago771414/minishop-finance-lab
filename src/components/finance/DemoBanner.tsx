import { FlaskConical } from "lucide-react";

import { formatDate } from "@/lib/format";

export function DemoBanner({ referenceDate }: { referenceDate: string }) {
  return (
    <div
      role="note"
      aria-label="Aviso de demonstração"
      className="border-b border-warning-border bg-warning px-3 py-1.5 text-warning-foreground"
    >
      <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-center text-[11px] sm:text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold tracking-wide">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          DEMONSTRAÇÃO • DADOS FICTÍCIOS • FONTE: AMOSTRA LOCAL
        </span>
        <span className="font-medium">
          Data de referência: <time dateTime={referenceDate}>{referenceDate}</time>
          <span className="sr-only"> ({formatDate(referenceDate)})</span>
        </span>
      </p>
    </div>
  );
}

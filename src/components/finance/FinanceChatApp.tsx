import { AlertTriangle, History, Plus, RotateCcw, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { respond, SUGGESTIONS } from "@/agent/respond";
import type { ChatMessage, Conversation } from "@/agent/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { REFERENCE_DATE } from "@/data/demoData";
import { useConversations } from "@/hooks/useConversations";
import { createFinanceService, type Account, type TransactionFilters } from "@/services/finance";

import { Composer, type ComposerHandle } from "./Composer";
import { ConversationHistory } from "./ConversationHistory";
import { DemoBanner } from "./DemoBanner";
import { FilterBar } from "./FilterBar";
import { ResponseBlocks } from "./ResponseBlocks";

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function titleFrom(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  return t.length > 48 ? `${t.slice(0, 47)}…` : t;
}

export function FinanceChatApp() {
  const service = useMemo(() => createFinanceService(), []);
  const { conversations, create, appendMessage, removeMessage, remove, clear } = useConversations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const composerRef = useRef<ComposerHandle>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    service.listAccounts().then(setAccounts).catch(() => setAccounts([]));
  }, [service]);

  const active: Conversation | undefined = conversations.find((c) => c.id === activeId);
  const messages = active?.messages ?? [];
  const busy = pendingId !== null;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages.length, pendingId]);

  const runAssistant = useCallback(
    async (convId: string, text: string, snapshot: TransactionFilters) => {
      setPendingId(convId);
      try {
        const reply = await respond(text, snapshot, service);
        appendMessage(convId, { id: newId(), role: "assistant", createdAt: new Date().toISOString(), blocks: reply.blocks });
      } catch {
        appendMessage(convId, {
          id: newId(),
          role: "assistant",
          createdAt: new Date().toISOString(),
          error: "Não foi possível consultar a amostra local. Nenhum dado foi alterado.",
          retryText: text,
        });
      } finally {
        setPendingId(null);
      }
    },
    [service, appendMessage],
  );

  const send = useCallback(
    (raw: string): boolean => {
      const text = raw.trim();
      if (!text || busy) return false;
      const now = new Date().toISOString();
      let convId = active?.id;
      if (!convId) {
        convId = newId();
        create({ id: convId, title: titleFrom(text), createdAt: now, updatedAt: now, messages: [] });
        setActiveId(convId);
      }
      const userMsg: ChatMessage = { id: newId(), role: "user", createdAt: now, text };
      appendMessage(convId, userMsg);
      void runAssistant(convId, text, filters);
      return true;
    },
    [active?.id, busy, create, appendMessage, runAssistant, filters],
  );

  const retry = (msg: ChatMessage) => {
    if (!active || !msg.retryText || busy) return;
    removeMessage(active.id, msg.id);
    void runAssistant(active.id, msg.retryText, filters);
  };

  const newConversation = () => {
    setActiveId(null);
    setHistoryOpen(false);
    requestAnimationFrame(() => composerRef.current?.focus());
  };

  const history = (
    <ConversationHistory
      conversations={conversations}
      activeId={activeId}
      onNew={newConversation}
      onSelect={(id) => {
        setActiveId(id);
        setHistoryOpen(false);
      }}
      onDelete={(id) => {
        remove(id);
        if (id === activeId) setActiveId(null);
      }}
      onClear={() => {
        clear();
        setActiveId(null);
      }}
    />
  );

  return (
    <div className="flex h-dvh flex-col bg-background">
      <DemoBanner referenceDate={REFERENCE_DATE} />

      <header className="flex items-center gap-2 border-b bg-card px-3 py-2.5 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir histórico de conversas"
          onClick={() => setHistoryOpen(true)}
        >
          <History />
        </Button>
        <div className="flex size-9 items-center justify-center rounded-lg bg-brand text-primary-foreground shadow-soft" aria-hidden="true">
          <Wallet className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold leading-tight">Fin MiniShop</h1>
          <p className="truncate text-xs text-muted-foreground">MiniShop Finance Lab · laboratório educacional</p>
        </div>
        <Button variant="outline" size="sm" onClick={newConversation} aria-label="Nova conversa">
          <Plus />
          <span className="hidden sm:inline">Nova conversa</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 border-r bg-sidebar lg:block">{history}</aside>
        <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
          <SheetContent side="left" className="w-[85vw] max-w-xs bg-sidebar p-0">
            <SheetTitle className="sr-only">Histórico de conversas</SheetTitle>
            <SheetDescription className="sr-only">Conversas de demonstração salvas neste navegador.</SheetDescription>
            <div className="h-full pt-8">{history}</div>
          </SheetContent>
        </Sheet>

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <div
              role="log"
              aria-live="polite"
              aria-label="Mensagens da conversa"
              className="mx-auto w-full max-w-3xl space-y-5 px-3 py-5 sm:px-6"
            >
              {messages.length === 0 && !busy ? (
                <section className="rounded-xl border bg-card p-5 shadow-soft sm:p-6">
                  <h2 className="text-lg font-semibold">Olá! Sou o Fin MiniShop.</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Consulto contas, saldos e transações de um banco fictício, usando apenas uma amostra local em dólares
                    (USD). Não movimento dinheiro, não acesso contas reais e não dou conselhos financeiros.
                  </p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comece por aqui</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <Button key={s} variant="chip" className="h-auto justify-start whitespace-normal py-2.5 text-left" onClick={() => send(s)}>
                        {s}
                      </Button>
                    ))}
                  </div>
                </section>
              ) : null}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-[15px] text-primary-foreground shadow-soft">
                      <span className="sr-only">Você: </span>
                      {m.text}
                    </p>
                  </div>
                ) : (
                  <article key={m.id} className="flex gap-2.5" aria-label="Resposta do Fin MiniShop">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden="true">
                      <Wallet className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {m.error ? (
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-card px-3 py-2.5 text-sm" role="alert">
                          <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
                          <span className="flex-1">{m.error}</span>
                          <Button size="sm" variant="outline" onClick={() => retry(m)} disabled={busy}>
                            <RotateCcw />
                            Tentar novamente
                          </Button>
                        </div>
                      ) : (
                        <ResponseBlocks blocks={m.blocks ?? []} onSuggestion={send} disabled={busy} />
                      )}
                    </div>
                  </article>
                ),
              )}

              {busy && pendingId === activeId ? (
                <div className="flex items-center gap-2.5" role="status">
                  <div className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-primary" aria-hidden="true">
                    <Wallet className="size-4" />
                  </div>
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    Consultando a amostra local
                    <span className="flex gap-1" aria-hidden="true">
                      <span className="size-1.5 rounded-full bg-primary animate-fin-dot" />
                      <span className="size-1.5 rounded-full bg-primary animate-fin-dot [animation-delay:150ms]" />
                      <span className="size-1.5 rounded-full bg-primary animate-fin-dot [animation-delay:300ms]" />
                    </span>
                  </p>
                </div>
              ) : null}
              <div ref={endRef} />
            </div>
          </div>

          <div className="border-t bg-background/95 px-3 pb-3 pt-2 sm:px-6">
            <div className="mx-auto w-full max-w-3xl space-y-2">
              {messages.length > 0 ? (
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin" role="group" aria-label="Consultas sugeridas">
                  {SUGGESTIONS.map((s) => (
                    <Button key={s} variant="chip" size="sm" disabled={busy} onClick={() => send(s)}>
                      {s}
                    </Button>
                  ))}
                </div>
              ) : null}
              <FilterBar filters={filters} onChange={setFilters} accounts={accounts} />
              <Composer ref={composerRef} onSend={send} busy={busy} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { MessageSquare, Plus, Trash2 } from "lucide-react";

import type { Conversation } from "@/agent/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function ConversationHistory({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onClear,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <nav aria-label="Histórico de conversas" className="flex h-full flex-col">
      <div className="p-3">
        <Button variant="brand" className="w-full" onClick={onNew}>
          <Plus />
          Nova conversa
        </Button>
      </div>
      <h2 className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        Histórico neste navegador
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 scrollbar-thin">
        {conversations.length === 0 ? (
          <p className="px-2 py-3 text-sm text-muted-foreground">Nenhuma conversa salva ainda.</p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={c.id === activeId ? "true" : undefined}
                  className={cn(
                    "flex min-w-0 flex-1 items-start gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-sidebar-accent",
                    c.id === activeId && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                  )}
                >
                  <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate">{c.title}</span>
                    <span className="block text-[11px] text-muted-foreground">{formatWhen(c.updatedAt)}</span>
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground"
                  aria-label={`Excluir conversa “${c.title}”`}
                  onClick={() => onDelete(c.id)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="space-y-2 border-t p-3">
        {conversations.length > 0 ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Trash2 />
                Apagar histórico
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Apagar todo o histórico?</AlertDialogTitle>
                <AlertDialogDescription>
                  As conversas salvas neste navegador serão removidas. Os dados fictícios da amostra não mudam.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onClear}>Apagar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        <p className="text-[11px] leading-snug text-muted-foreground">
          Salvo só neste navegador, com dados fictícios. Fin MiniShop é um interpretador local de intenções — não é uma IA
          conversacional e não acessa bancos.
        </p>
      </div>
    </nav>
  );
}

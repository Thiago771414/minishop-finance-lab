import { useCallback, useEffect, useState } from "react";

import type { ChatMessage, Conversation } from "@/agent/types";

/** Somente conversas de demonstração; nenhum segredo ou credencial é salvo. */
export const HISTORY_STORAGE_KEY = "minishop-finance-lab:conversas:v1";
export const MAX_CONVERSATIONS = 20;

function isConversation(x: unknown): x is Conversation {
  if (!x || typeof x !== "object") return false;
  const c = x as Record<string, unknown>;
  return typeof c["id"] === "string" && typeof c["title"] === "string" && Array.isArray(c["messages"]);
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) setConversations(parsed.filter(isConversation));
      }
    } catch {
      /* histórico corrompido: começa vazio */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)),
      );
    } catch {
      /* armazenamento indisponível: segue só em memória */
    }
  }, [conversations, loaded]);

  const create = useCallback((conv: Conversation) => {
    setConversations((prev) => [conv, ...prev].slice(0, MAX_CONVERSATIONS));
  }, []);

  const appendMessage = useCallback((id: string, msg: ChatMessage) => {
    setConversations((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;
      const updated = { ...target, messages: [...target.messages, msg], updatedAt: msg.createdAt };
      return [updated, ...prev.filter((c) => c.id !== id)];
    });
  }, []);

  const removeMessage = useCallback((id: string, messageId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clear = useCallback(() => setConversations([]), []);

  return { conversations, loaded, create, appendMessage, removeMessage, remove, clear };
}

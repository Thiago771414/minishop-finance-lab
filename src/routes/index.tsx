import { createFileRoute } from "@tanstack/react-router";

import { FinanceChatApp } from "@/components/finance/FinanceChatApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fin MiniShop — MiniShop Finance Lab (demonstração)" },
      {
        name: "description",
        content:
          "Assistente financeiro educacional em formato de chat com dados fictícios de demonstração em USD. Sem acesso a bancos reais.",
      },
      { property: "og:title", content: "Fin MiniShop — MiniShop Finance Lab" },
      {
        property: "og:description",
        content: "Chat educacional para consultar contas, saldos e transações de um banco fictício.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinanceChatApp,
});

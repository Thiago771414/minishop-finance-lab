# MiniShop Finance Lab — Agente Financeiro Educacional

> **Projeto final do bootcamp DIO / Bradesco — “Levando o Banco para Onde o Cliente Já Está: Um Agente Financeiro com MCP”.**  
> **Demonstração educacional:** dados sintéticos, armazenados localmente no aplicativo. **Não acessa bancos reais, não executa transações e não possui integração Plaid ativa no site.**

**[Acessar aplicativo publicado](https://minisprout-money-lab.lovable.app/)** · **[Repositório GitHub](https://github.com/Thiago771414/minishop-finance-lab)** · **[Especificação enviada ao Lovable](PROMPT_LOVABLE_ETAPA_1.md)** · **[Evidência das consultas ao Sandbox](EVIDENCIA_PLAID_SANDBOX.md)**

## 1. Problema e contexto

O desafio propõe levar a consulta financeira até onde o cliente já está. Escolhi o contexto de uma loja digital fictícia, o **MiniShop**, e criei o **MiniShop Finance Lab**: um laboratório independente em que o visitante faz perguntas em português sobre contas, saldos e movimentações de demonstração.

**Não existe integração com o checkout, pagamentos ou pedidos reais do MiniShop.** A experiência foi construída para ensinar os conceitos de APIs financeiras, MCP, interpretação de intenções e apresentação responsável dos dados.

## 2. O que o aplicativo faz

- Chat em português, com cinco sugestões clicáveis e consultas digitadas reconhecidas por um **interpretador local de intenções** (não há LLM conversacional conectado ao app).
- Lista **quatro contas fictícias** e separa saldo em dinheiro, dívida de cartão e crédito disponível.
- Exibe as **cinco transações mais recentes** da amostra, com valor, categoria, conta e situação.
- Resume entradas, saídas e consumo por categoria, mantendo as transações pendentes separadas.
- Permite filtrar os registros por **conta, categoria e período**, recalculando os totais sem alterar os registros originais.
- Suporta nova conversa, histórico local no navegador, Enter para enviar, Shift+Enter para quebra de linha e estados de carregamento, erro e resultado vazio.
- Recusa operações de escrita como Pix, transferências, pagamentos e estornos; também não simula saldos reais nem aconselhamento financeiro.
- Interface responsiva, com a indicação persistente **“DEMONSTRAÇÃO • DADOS FICTÍCIOS • FONTE: AMOSTRA LOCAL”**.

**Aplicação publicada:** [minisprout-money-lab.lovable.app](https://minisprout-money-lab.lovable.app/)

## 3. Origem dos dados — não confundir os dois ambientes

| Ambiente | Função | Resultado demonstrado | Acessado pelo site? |
|---|---|---|---|
| Amostra local em `src/data/demoData.ts` | Alimenta o chat publicado | 4 contas e 10 transações sintéticas | **Sim** |
| Pluggy Docs MCP no Codex | Consultar documentação e referência dos endpoints | Ferramentas `list_specs`, `list_endpoints` e `get_api_endpoint` responderam | **Não** |
| MCP Plaid + Python + Plaid Sandbox REST | Criar um Item fictício e consultar respostas da API | 14 contas e 16 transações confirmadas, no teste de 18/08 a 15/11/2026 | **Não** |
| Backend remoto da aplicação | Integração futura e protegida com a Plaid | Não implementado | **Não** |

O uso de um servidor MCP no **Codex** não o conecta automaticamente ao **Lovable**. A documentação da Pluggy foi utilizada como referência; a API Plaid Sandbox forneceu dados fictícios para uma validação separada. O chat público continua usando apenas a amostra local, **não dados recuperados em tempo real**.

## 4. Exemplo de consistência financeira da interface

Dados locais de referência: **15/11/2026**, moeda **USD**; os totais abaixo são calculados a partir dos registros de `src/data/demoData.ts`.

| Indicador | Valor |
|---|---:|
| Contas demonstrativas | 4 |
| Transações confirmadas | 9 |
| Transações pendentes | 1 |
| Entradas confirmadas | **US$ 430,00** |
| Saídas confirmadas (incluindo transferência) | **US$ 264,00** |
| Consumo confirmado (excluindo transferências) | **US$ 164,00** |
| Alimentação confirmada | **US$ 70,50** |
| Alimentação pendente, não incluída no total confirmado | **US$ 18,00** |

A convenção usada é **valor positivo = saída; valor negativo = entrada**. Transferência não deve ser somada automaticamente ao consumo. O saldo devedor de um cartão é dívida; o crédito disponível **não é** dinheiro em conta. Os valores mantêm a moeda USD, sem conversão não verificada para reais.

## 5. Arquitetura e tecnologias

**Frontend:** React, TypeScript, TanStack Start/Router, Vite, Tailwind CSS, componentes Radix UI e Recharts; projeto gerado e publicado com Lovable.

```text
Visitante
  └── Chat Fin MiniShop (Lovable)
       └── Interpretador de intenções local (src/agent)
            └── FinanceService (contrato tipado)
                 └── DemoFinanceService (src/services/finance)
                      └── demoData.ts: amostra local fictícia
```

O contrato `RemoteFinanceService` está reservado para uma **Etapa 2 futura**, mas não está implementado. Numa eventual evolução: `frontend → backend autenticado → Plaid Sandbox → cálculo/normalização → resposta`; credenciais sempre protegidas no servidor.

## 6. MCP Pluggy e Plaid Sandbox: configuração e validação

### Pluggy — somente documentação

No Codex, adicione um servidor MCP chamado `pluggy` com transporte **Streamable HTTP** e URL:

`https://mcp.pluggy.ai/mcp`

Para consultar a documentação usada no exercício, não é necessária chave. Teste listando o grupo `Transaction` e confira se o Codex realmente realizou uma chamada de ferramenta. A consulta identificou as operações `GET /v2/transactions`, `GET /transactions/{id}`, `PATCH /transactions/{id}` e a listagem legada `GET /transactions` (descontinuada).

### Plaid — Sandbox, nunca produção

No Windows 11, instale o `uv` se necessário, verifique `uv --version` e localize o `uvx.exe` com `(Get-Command uvx).Source`. No Codex, configure um servidor MCP `plaid` do tipo **STDIO**:

- **Comando:** caminho local do `uvx.exe` (não copie o caminho de outro computador).
- **Argumento:** `mcp-server-plaid`.
- **Variáveis de ambiente privadas:** `PLAID_CLIENT_ID` e `PLAID_SECRET` obtidas em *Plaid Dashboard → Keys → Sandbox*.
- **Ambiente da API REST:** exclusivamente `https://sandbox.plaid.com`.

O MCP permitiu consultar documentação e criar o Item de teste. Como ele não oferecia ferramentas diretas para ler contas/transações, um script Python executou as operações REST `POST /sandbox/public_token/create`, `POST /item/public_token/exchange`, `POST /accounts/get` e `POST /transactions/get`, incluindo paginação. Os tokens foram mantidos em memória durante o processo.

**Resultado da consulta de teste:** First Platypus Bank (`ins_109508`), período inclusivo **18/08/2026–15/11/2026**, **14 contas, 16 transações confirmadas, zero pendentes**, entradas **US$ 504,22**, saídas **US$ 11.149,46**. Esses totais incluem pagamentos e transferências e **não representam consumo pessoal real**. Ver [registro de evidências](EVIDENCIA_PLAID_SANDBOX.md).

**Segurança:** não versionar `config.toml` preenchido, Client ID, Sandbox secret, `access_token`, arquivos `.env` com segredos ou capturas de tela que os revelem. O repositório público contém somente código e documentação demonstrativa.

## 7. Especificação e adaptações em relação à aula

A especificação usada no Lovable está em **[PROMPT_LOVABLE_ETAPA_1.md](PROMPT_LOVABLE_ETAPA_1.md)** e adapta o roteiro das páginas 25–28 do guia da DIO. Além do chat bancário proposto na aula, esta versão:

1. leva a demonstração ao contexto de uma **loja digital fictícia**, em vez de reproduzir a marca do exemplo do instrutor;
2. adiciona **filtros combináveis por conta, categoria e intervalo de datas**;
3. calcula os totais a partir de uma fonte de dados única e separa **consumo de movimentações/transferências**;
4. documenta explicitamente a diferença entre **MCP consultado pelo Codex, dados Sandbox retornados pela API e amostra local publicada**;
5. aplica recusas de ações financeiras reais e distingue limites de crédito de recursos disponíveis.

A implementação permaneceu na **Etapa 1**, por decisão de escopo e segurança. A Etapa 2, com backend autenticado e acesso remoto, não foi criada.

## 8. Testes e evidências

O Lovable informou **19 testes automatizados aprovados** e **12 verificações de aceite na prévia**. O código contém testes com Vitest em `src/test/`, entre eles:

- validação de valores e convenção de sinais;
- quatro contas, cinco transações recentes e filtros sem mutação dos dados;
- alimentação confirmada/pendente, resumo e consumo sem transferências;
- interpretação das sugestões, limitação para perguntas desconhecidas e recusa de Pix/saldos reais.

Para executar localmente:

```bash
npm install
npm run test
npm run dev
```

O comando `npm run test` executa o conjunto de testes do repositório; resultados futuros devem ser conferidos na máquina em que forem executados. O site público está em **[minisprout-money-lab.lovable.app](https://minisprout-money-lab.lovable.app/)**. Os resultados do Sandbox foram fornecidos por execução separada no Codex/Python e registrados no arquivo de evidências, sem inclusão de credenciais.

## 9. Limitações e evolução futura

- O chat atual é um **interpretador local de intenções**, e não um LLM com ferramentas conectadas ao site.
- A amostra é **sintética e estática**; não há autenticação de cliente, acesso a contas pessoais, movimentação financeira ou atualização em tempo real.
- A integração com a Plaid no app requer backend, gestão de segredos, controle de acesso por sessão e validação de segurança antes de qualquer uso compartilhado.
- Não há ligação entre a Plaid Sandbox internacional e o Open Finance brasileiro de produção; em produção seriam necessários consentimento, segurança e requisitos regulatórios aplicáveis.
- Próxima evolução proposta: implementar um backend seguro que consulte dados exclusivamente de testes e mantenha a separação entre demonstração e conexão ativa.

## 10. Referências

- [Desafio DIO — material disponibilizado no bootcamp Bradesco](https://www.dio.me/)
- [Documentação da Pluggy](https://docs.pluggy.ai/)
- [Pluggy MCP](https://mcp.pluggy.ai/mcp)
- [Plaid Sandbox](https://plaid.com/docs/sandbox/)
- [Documentação Plaid](https://plaid.com/docs/)
- [Lovable](https://lovable.dev/)

---

**Trabalho educacional e independente.** Plaid e Pluggy são citadas exclusivamente como fontes técnicas da demonstração; não há vínculo comercial nem uso de informações financeiras pessoais.

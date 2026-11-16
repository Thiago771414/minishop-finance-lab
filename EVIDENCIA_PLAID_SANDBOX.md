# Evidência de integração — Plaid Sandbox (DIO / Bradesco)

> **Execução confirmada em 15/11/2026**, a partir do resultado do Codex apresentado pelo autor. São **dados fictícios** da API Plaid Sandbox, não dados bancários pessoais. Este documento contém apenas resumos e registros demonstrativos; nenhum identificador secreto, `access_token`, Client ID ou Secret.
>
> **Limite da evidência:** comprova consultas feitas no ambiente local com Codex/Python. **Não comprova** conexão do aplicativo Lovable à Plaid; a primeira versão do app utiliza amostra local independente.

## 1. Integrações validadas

- **Pluggy Docs MCP:** ferramentas `list_specs`, `list_endpoints` e `get_api_endpoint` responderam à consulta documental do grupo `Transaction`.
- **Plaid Sandbox MCP:** consulta de documentação executada e criação de Item de Sandbox com o produto `transactions` realizada.
- **Python + Plaid Sandbox REST:** depois de corrigir a limitação de ferramentas do MCP, foi criado um novo Item fictício com tokens utilizados somente na memória do processo. O script executou as consultas REST e produziu tabelas e agregações.

| Validação | Resultado |
|---|---|
| Ambiente | Somente `https://sandbox.plaid.com` |
| Instituição | First Platypus Bank (`ins_109508`) |
| Período inclusivo | 18/08/2026 a 15/11/2026 (90 dias) |
| Contas consultadas | 14 |
| Transações | 16 confirmadas; 0 pendentes |
| Paginação | 1 página, todos os registros retornados |
| Fluxo de endpoints | `POST /sandbox/public_token/create` → `POST /item/public_token/exchange` → `POST /accounts/get` → `POST /transactions/get` |

## 2. Contas consultadas (USD)

| Conta | Tipo | Saldo atual (ativo) | Dívida atual | Disponível / crédito |
|---|---|---:|---:|---|
| Plaid Checking | Conta corrente | 110,00 | — | 100,00 |
| Plaid Saving | Poupança | 210,00 | — | 200,00 |
| Plaid CD | Depósito a prazo | 1.000,00 | — | Não informado |
| Plaid Credit Card | Cartão | — | 410,00 | Não informado |
| Plaid Money Market | Money market | 43.200,00 | — | 43.200,00 |
| Plaid IRA | Previdência | 320,76 | — | Não informado |
| Plaid 401k | Previdência | 23.631,9805 | — | Não informado |
| Plaid Student Loan | Financiamento estudantil | — | 65.262,00 | Não informado |
| Plaid Mortgage | Financiamento imobiliário | — | 56.302,06 | Não informado |
| Plaid HSA | Conta de saúde | 6.009,00 | — | 6.009,00 |
| Plaid Cash Management | Gestão de caixa | 12.060,00 | — | 12.060,00 |
| Plaid Auto Loan | Financiamento de veículo | — | 23.211,33 | Não informado |
| Plaid Home Equity Line of Credit | Crédito com garantia imobiliária | — | 13.500,50 | 47.647,50 de crédito |
| Plaid Business Credit Card | Cartão empresarial | — | 5.020,00 | 4.980,00 de crédito |

**Notas:** saldos de cartão e financiamento representam dívidas; limite de crédito não é dinheiro depositado. Valores provenientes de `/accounts/get` não são garantia de atualização em tempo real. `Não informado` corresponde a ausência de valor (`null`). O valor de 401k foi preservado com a precisão retornada.

## 3. Cinco transações mais recentes exibidas

| Data | Conta | Descrição | Entrada (USD) | Saída (USD) | Status |
|---|---|---|---:|---:|---|
| 10/11/2026 | Saving | CREDIT CARD 3333 PAYMENT *// | — | 25,00 | Confirmada |
| 10/11/2026 | Checking | Uber 063015 SF\*\*POOL\*\* | — | 5,40 | Confirmada |
| 09/11/2026 | Money Market | ACH Electronic CreditGUSTO PAY 123456 | — | 5.850,00 | Confirmada |
| 09/11/2026 | CD | CD DEPOSIT .INITIAL. | — | 1.000,00 | Confirmada |
| 08/11/2026 | Checking | United Airlines | 500,00 | — | Confirmada |

A API não informou horários das operações; itens da mesma data não comprovam ordem intradiária. Esta tabela mostra **5 de 16** transações, não todas as linhas consultadas.

## 4. Totalização das 16 transações confirmadas

| Indicador | Valor (USD) |
|---|---:|
| Entradas | 504,22 |
| Saídas | 11.149,46 |
| Entradas menos saídas | -10.645,24 |
| Pendentes | 0 |

**Convenção da Plaid:** valores **positivos são saídas** e negativos são entradas. Esses totais incluem transferências e pagamentos, portanto não devem ser chamados automaticamente de renda, consumo ou prejuízo.

## 5. Três observações fundamentadas

1. **Concentração:** `ACH Electronic CreditGUSTO PAY 123456` (09/11) foi de US$ 5.850,00, ou **52,47%** das saídas confirmadas. O nome do estabelecimento não altera o sinal retornado pela API.
2. **Recorrência na amostra:** McDonald's, Starbucks e KFC somaram **US$ 516,33** em três registros. Duas transações Uber, em 24/10 e 10/11, somaram **US$ 11,73**. Essas repetições não comprovam um hábito ou assinatura real.
3. **Entradas:** United Airlines (08/11), **US$ 500,00**, e `INTRST PYMNT` (05/11), **US$ 4,22**, correspondem às entradas confirmadas do período.

## 6. Escopo e próximos passos

- [x] Consulta de documentação Pluggy via MCP.
- [x] Preparação de Item fictício com MCP Plaid.
- [x] Leitura autenticada da API de testes por script Python e resumo sem segredos.
- [ ] Interface Lovable criada, testada e publicada.
- [ ] Sincronização do código com GitHub e inclusão de evidências da interface.
- [ ] Integração direta Lovable → backend → Plaid (opcional, **não concluída na Etapa 1**).

A Etapa 1 do Lovable usa sua **própria amostra local sintética** e não deve declarar que exibe essas 16 transações consultadas pelo Codex. Para conectar dados reais do Sandbox ao app, será necessário backend seguro e tratamento adequado de segredos e acesso.

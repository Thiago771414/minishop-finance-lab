# MiniShop Finance Lab

# Especificação para o Lovable — MiniShop Finance Lab (DIO Bradesco)




> **Como usar:** cole TODO o conteúdo deste documento como UM pedido no modo Chat do Lovable. Peça primeiro que o Lovable identifique ambiguidades, riscos e faça um plano. Só autorize a implementação depois de revisar as dúvidas. Este documento implementa a Etapa 1 do guia, não afirma integrar a Plaid em tempo real.




## 1. Objetivo e cenário




Crie uma aplicação web responsiva chamada **MiniShop Finance Lab**, um assistente financeiro educacional em formato de chat, pensado como uma demonstração opcional dentro do ecossistema de uma loja virtual MiniShop. **Este é um laboratório independente; não existe integração real com o checkout, com pagamentos ou com os pedidos MiniShop.**




O usuário já está no contexto de uma loja digital e pode consultar contas, saldos e transações de **um banco fictício** enquanto avalia suas finanças. Todas as contas, nomes e transações são sintéticos e não correspondem a clientes reais. Use a marca original "MiniShop Finance Lab"; não crie uma instituição bancária real nem afirme afiliação com Pluggy/Plaid.




O produto deve responder em **português brasileiro**, usar **USD nos dados** e não converter para BRL sem uma cotação explicitamente configurada. Não oferecer conselhos financeiros personalizados, operações bancárias nem movimentação de dinheiro.




## 2. Escopo de entrega — Etapa 1 primeiro




Implemente agora somente **um frontend funcional com dados locais de demonstração**, sem solicitar nenhuma credencial. Construa uma interface orientada à conversa (NÃO uma landing page) com React + TypeScript, layout adaptado a mobile e desktop, boa acessibilidade de teclado, cores legíveis e identidade visual simples. Usar paleta azul-petróleo, branco e cinza, com um destaque âmbar discreto para aviso de demonstração.




Exibir sempre no topo: **"DEMONSTRAÇÃO • DADOS FICTÍCIOS • FONTE: AMOSTRA LOCAL"** e a data de referência `2026-11-15` dos dados gerados nesta amostra. Não usar o selo "conectado à Plaid" ou "em tempo real".




Crie:

- Cabeçalho e nome do assistente "Fin MiniShop";

- Uma área de mensagens com mensagens do usuário e respostas do agente;

- Sugestões clicáveis: "Mostrar minhas contas", "Consultar meus saldos", "Ver minhas últimas transações", "Quanto gastei com alimentação?", "Resumir minhas movimentações";

- Campo de mensagem fixo, botão enviar, Enter para enviar e Shift+Enter para quebra de linha;

- Bloqueio de mensagens vazias; estados de carregamento, erro e resultado vazio;

- Botão de nova conversa e histórico das conversas no navegador (somente dados demonstrativos; sem usar segredos e sem acesso a contas reais);

- Respostas com tabelas acessíveis, cartões e gráfico simples por categoria quando pertinente; se não for possível fazer um gráfico acessível, priorize uma tabela;

- Filtros explícitos por conta, categoria e período: esta é a **melhoria autoral em relação ao exemplo-base do instrutor**.




## 3. Dados locais — fonte única e explícita




Não copie ou declare como consulta real as 14 contas e 48 transações do instrutor. Use somente a seguinte **amostra sintética criada para este projeto**, sem atribuir esses dados a respostas da API. Guardar os registros em `src/data/demoData.ts` ou estrutura equivalente e a lógica de consulta em uma camada de serviços separada, substituível por uma integração de backend futura.




Contas de exemplo (USD):




| id | nome | tipo | saldoAtual | saldoDisponivel | observacao |

|---|---|---|---:|---:|---|

| ck_001 | Plaid Checking — Demo | checking | 110.00 | 100.00 | Conta corrente |

| sv_001 | Plaid Saving — Demo | savings | 210.00 | 200.00 | Poupança |

| cc_001 | Plaid Credit Card — Demo | credit | 410.00 | null | Saldo atual é dívida |

| bc_001 | Plaid Business Credit Card — Demo | credit | 5020.00 | 4980.00 | Dívida + crédito disponível, não dinheiro em conta |




Transações sintéticas, TODAS EM USD (campo `amount` segue a convenção da Plaid: **positivo = saída**, **negativo = entrada**):




| id | date | accountId | description | category | amount | pending |

|---|---|---|---|---|---:|---|

| tx01 | 2026-11-13 | ck_001 | Mercado Central (exemplo) | alimentação | 32.40 | false |

| tx02 | 2026-11-12 | ck_001 | Transporte Urbano (exemplo) | transporte | 8.50 | false |

| tx03 | 2026-11-11 | ck_001 | Transferência recebida (exemplo) | transferência | -180.00 | false |

| tx04 | 2026-11-10 | cc_001 | Café Bairro (exemplo) | alimentação | 12.80 | false |

| tx05 | 2026-11-09 | cc_001 | Livraria (exemplo) | compras | 45.00 | false |

| tx06 | 2026-11-08 | ck_001 | Alimentação Delivery (exemplo) | alimentação | 25.30 | false |

| tx07 | 2026-11-07 | sv_001 | Transferência para poupança (exemplo) | transferência | 100.00 | false |

| tx08 | 2026-11-06 | ck_001 | Serviços (exemplo) | serviços | 40.00 | false |

| tx09 | 2026-11-05 | cc_001 | Refeição pendente (exemplo) | alimentação | 18.00 | true |

| tx10 | 2026-11-04 | ck_001 | Salário fictício (exemplo) | receita | -250.00 | false |




**Verificações para os cálculos**, considerando todos os registros e excluindo pendentes dos totais confirmados:

- Confirmadas: 9; pendentes: 1.

- Alimentação confirmada: USD 70.50 (32.40 + 12.80 + 25.30); pendente: USD 18.00, discriminada à parte.

- Saídas confirmadas: USD 264.00 (todas as transações positivas confirmadas, incluindo transferência); entradas confirmadas: USD 430.00 (valores absolutos das duas negativas).

- Ao falar em "consumo", não somar transferências automaticamente como compras/consumo. Exibir a categoria e a quantidade de registros usados.




Esses totais são parte de testes de consistência; calcule programaticamente a partir dos registros e não codifique resultados isolados nas respostas do chat.




## 4. Comportamento do agente no modo demonstração




Não alegue um modelo de IA integrado se não houver integração real. Na Etapa 1, implemente um **interpretador de intenção local** para as consultas previstas (contas, saldo por conta, cinco transações recentes, alimentação, totais, categoria/período, ajuda). Pode usar correspondência de intenção e sinônimos em português; documente que não é um LLM conversacional integrado.




Regras obrigatórias:

- Basear toda resposta num cálculo ou registro da fonte local.

- Distinguir `saldo atual`, `saldo disponível`, `dívida` e `crédito disponível` por tipo de conta.

- Formatar corretamente USD em padrão pt-BR (`US$ 110,00`), nunca como R$ sem conversão.

- Positivo = saída, negativo = entrada; transações pendentes não entram nos totais confirmados.

- Informar data de referência, intervalo e total de registros usados quando resumir dados.

- Se não houver dados suficientes, dizer exatamente a limitação e sugerir apenas consultas possíveis.

- Não inventar transferências, valores, instituições, faturas, cobranças, números de protocolo ou previsão de atualização.

- Não habilitar pagamentos, transferências, estornos, edição de saldo, login bancário, upload de documentos sensíveis ou conexão a contas reais.

- Consultas desconhecidas devem receber ajuda transparente, não um texto livre que simule acesso à API.




## 5. Arquitetura preparada para Etapa 2 (NÃO implementar agora)




Organizar o código de forma que a interface utilize funções assíncronas e interfaces tipadas de leitura (`listAccounts`, `getBalances`, `listTransactions`, `getSpendingSummary`) implementadas por um `DemoFinanceService`. Reservar o contrato de um `RemoteFinanceService` futuro, mas **não escrever backend, não configurar Plaid, Pluggy, MCP, Lovable Cloud nem segredos nesta primeira etapa**.




Na Etapa 2 futura, a arquitetura pretendida seria `UI → backend autenticado → Plaid Sandbox (accounts/get, transactions/get com paginação) → agregações no backend → UI`. O MCP da Pluggy é usado separadamente para consulta de documentação; o MCP da Plaid no Codex permite preparar um Sandbox, mas não conecta automaticamente o Lovable à Plaid.




## 6. Testes de aceite




Teste no browser do Lovable:

1. Sugestão "Mostrar minhas contas" retorna 4 contas;

2. "Consultar meus saldos" distingue dinheiro, dívida e limites de crédito;

3. "Ver minhas últimas transações" exibe 5 linhas ordenadas da mais recente para a mais antiga;

4. "Quanto gastei com alimentação?" retorna US$ 70,50 confirmados, com US$ 18,00 pendentes separadamente;

5. "Resumir minhas movimentações" retorna 9 confirmadas e 1 pendente; entradas confirmadas US$ 430,00 e saídas confirmadas US$ 264,00;

6. Filtrar por categoria, conta e período não muda os dados originais e recalcula os totais;

7. Solicitar "faça um Pix", "qual meu saldo real?" ou "conecte ao meu banco" recebe recusa/limitação transparente;

8. Envio por Enter, quebra de linha com Shift+Enter, vazio bloqueado;

9. Nova conversa e histórico funcionam no navegador;

10. A UI continua utilizável em 360px de largura e em desktop;

11. Não há nenhum segredo ou chave no código frontend, no console ou no armazenamento do browser;

12. O selo "DADOS FICTÍCIOS" está sempre visível.




## 7. Fluxo solicitado ao Lovable




**Primeiro, NO MODO CHAT, sem escrever código:** faça uma revisão da especificação, apresente um plano objetivo e informe pontos de possível ambiguidade. Não solicite credenciais nem use serviços pagos sem autorização. **Depois que eu aprovar explicitamente a implementação**, crie a Etapa 1 e apresente a prévia. Ao final, indique claramente o que funciona e o que permanece pendente da Etapa 2. Não publique automaticamente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d1c71c49-a285-5b36-bc91-ba35afdd8226).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

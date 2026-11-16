# Plano — MiniShop Finance Lab (Etapa 1)

## Revisão da especificação

A especificação é clara e implementável só no navegador, sem nenhuma credencial. Antes de escrever o código, estes são os pontos ambíguos e a decisão que proponho para cada um:

1. **Nomes das contas com "Plaid".** "Plaid Checking — Demo" contradiz a regra de não sugerir afiliação com a Plaid. **Proposta:** usar os nomes exatamente como na tabela e mostrar, nos cartões de contas, a nota "nome inspirado no Sandbox; sem vínculo com a Plaid". Alternativa: renomear para "Conta Corrente — Demo" etc.
2. **tx07 "Transferência para poupança" (sv_001, +100,00).** Pela convenção, valor positivo significa saída *da poupança*, o que contradiz a descrição. O total de saídas de US$ 264,00 depende desse lançamento. **Proposta:** manter o dado como está e mostrar uma observação de que, nesta amostra, o lançamento conta como saída de sv_001.
3. **Saldos x transações.** Os saldos são uma fotografia e não se reconciliam com as transações. **Proposta:** nunca calcular saldo a partir das transações e avisar isso quando o usuário perguntar.
4. **Cartões de crédito.**
   - cc_001: dívida de US$ 410,00, crédito disponível "não informado" (null).
   - bc_001: dívida de US$ 5.020,00 e crédito disponível de US$ 4.980,00.
   - Não vou calcular um limite total porque ele não existe na fonte.
5. **"Consumo" x "saídas".** Saídas confirmadas são US$ 264,00. Consumo sem transferências dá US$ 164,00. As duas respostas sempre dizem quais categorias e quantos registros foram usados.
6. **Filtros (conta, categoria, período).** **Proposta:** uma barra de filtros acima do campo de mensagem.
   - Opções: conta, categoria, data inicial e final, e "limpar".
   - Os filtros valem para as próximas perguntas e aparecem como etiquetas em cada resposta.
   - Os dados originais nunca mudam; os totais são recalculados sobre a cópia filtrada.
   - Também vou reconhecer filtros digitados no texto, como "alimentação no cartão de crédito".
7. **Período padrão.** Sem filtro, a resposta usa toda a amostra (2026-11-04 a 2026-11-13) e informa o intervalo e a data de referência 2026-11-15.
8. **Últimas transações.** São as 5 mais recentes, incluindo pendentes com um selo "pendente". Nesta amostra, nenhuma das 5 está pendente.
9. **Histórico.** Fica salvo só no navegador (localStorage), com as conversas de demonstração e no máximo 20 conversas. Inclui opção de apagar o histórico. Nenhuma chave ou segredo é armazenado.
10. **Gráfico.** Barras horizontais simples por categoria, sempre acompanhadas de uma tabela acessível equivalente. A tabela é a fonte principal para leitores de tela.

## O que será construído

- **Topo fixo:** selo âmbar "DEMONSTRAÇÃO • DADOS FICTÍCIOS • FONTE: AMOSTRA LOCAL", data de referência 2026-11-15 e o nome "Fin MiniShop".
- **Chat:** mensagens do usuário e do assistente; respostas com cartões de contas, tabelas, gráfico e totais.
- **Sugestões clicáveis:** as 5 pedidas.
- **Campo de mensagem fixo:**
  - Enter envia e Shift+Enter quebra a linha.
  - Mensagem vazia é bloqueada.
  - Estados de carregamento ("consultando amostra local…"), erro e resultado vazio.
- **Navegação:** barra lateral com "Nova conversa" e histórico; em celular ela vira uma gaveta. Funciona em 360px.
- **Visual:** azul-petróleo, branco e cinza, com âmbar só no aviso de demonstração. Foco visível pelo teclado e contraste adequado.
- **Ajuda e recusas transparentes:**
  - Pix, transferência, pagamento, "saldo real" e "conecte ao meu banco" recebem uma recusa clara.
  - Perguntas desconhecidas recebem uma resposta de ajuda com as consultas possíveis.
  - O sistema nunca simula acesso a API.
- **Aviso:** um texto informa que o assistente é um interpretador local de intenções, não uma IA conversacional.

## Detalhes técnicos

- `src/data/demoData.ts`: as 4 contas e 10 transações, exatamente como na especificação.
- `src/services/finance/types.ts`: interface `FinanceService` com `listAccounts`, `getBalances`, `listTransactions(filtros)` e `getSpendingSummary(filtros)`, todas assíncronas.
- `DemoFinanceService`: implementação local com um pequeno atraso simulado.
- `RemoteFinanceService`: apenas um contrato/esqueleto que lança "não implementado na Etapa 1". Sem backend, sem Lovable Cloud, sem Plaid, Pluggy ou MCP.
- `src/agent/intent.ts`: interpretador por palavras-chave e sinônimos em pt-BR, sem acentos e sem distinção de maiúsculas. Intenções: contas, saldos, recentes, gasto por categoria, resumo, ajuda, recusa e desconhecida.
- `src/agent/respond.ts`: monta respostas estruturadas a partir dos resultados do serviço; nenhum total é escrito à mão.
- `src/lib/format.ts`: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD' })`, que gera "US$ 110,00".
- Histórico em `localStorage`, com hidratação segura para SSR.
- Tela única em `/`, com head() em pt-BR.
- **Testes (vitest), um por regra:**
  - 4 contas;
  - 5 recentes em ordem decrescente;
  - alimentação US$ 70,50 confirmada + US$ 18,00 pendente;
  - 9 confirmadas e 1 pendente; entradas US$ 430,00 e saídas US$ 264,00;
  - consumo sem transferências;
  - filtros não alteram a fonte;
  - recusa para Pix/conexão;
  - formato US$.
- **Verificação no navegador (Playwright):** os 12 testes de aceite, incluindo 360px e desktop, e conferência de que não há chaves no localStorage nem no console.

## Pendente para a Etapa 2 (não será feito agora)

Fluxo previsto: backend autenticado → Plaid Sandbox (`accounts/get`, `transactions/get` com paginação) → agregações no servidor → `RemoteFinanceService` na interface. O plano também não inclui IA conversacional real, segredos ou publicação.

# hero_financ

Dashboard de finanças pessoais que roda **100% no navegador**. Importa extratos OFX, categoriza gastos, acompanha a reserva na caixinha e organiza lembretes de contas a pagar — sem backend, sem Open Finance e sem enviar dados para servidor.

Inspirado em apps como o Pierre, mas pensado para quem prefere controlar os próprios arquivos localmente.

---

## Funcionalidades

### Aba Extrato
- Importação de arquivos **OFX** (testado com extratos do Nubank)
- Carregamento automático de arquivos em `public/contas/`
- Cards de resumo: entradas, saídas, sobra do fluxo, média diária
- Painel da **caixinha/reserva** (depósitos e resgates RDB)
- Gráfico de fluxo de caixa mensal
- Gráfico de gastos por categoria
- Insights automáticos (maior categoria, assinaturas, gastos repetidos, comparativo mensal)
- Tabela de transações com busca e filtros
- Filtro por mês ou intervalo de datas

### Aba Lembretes
- Controle de contas fixas e parceladas por mês
- Três visualizações: **tabela**, **cards** e **quadros** (kanban)
- Edição inline, adicionar/remover linhas, criar novos meses
- Histórico de alterações
- Cruzamento automático com o extrato (“detectado no extrato”)
- Exportar e importar JSON para backup

---

## Como funciona

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  Arquivos .ofx  │────▶│  Parser OFX      │────▶│  Categorização      │
│  (upload/pasta) │     │  (ofxParser.ts)  │     │  (categorizer.ts)   │
└─────────────────┘     └──────────────────┘     └──────────┬──────────┘
                                                            │
┌─────────────────┐     ┌──────────────────┐                ▼
│  localStorage   │◀───▶│  Lembretes       │     ┌─────────────────────┐
│  (navegador)    │     │  (remindersDb)   │     │  Analytics + UI     │
└─────────────────┘     └──────────────────┘     │  (gráficos, cards)  │
         ▲                      │                └─────────────────────┘
         │                      │
         │              matchRemindersWithTransactions()
         └──────────────────────┘
```

1. **Extratos** — os arquivos OFX são lidos no cliente, parseados e transformados em transações com categoria e flag de movimentação interna (ex.: caixinha, pagamento de fatura).
2. **Caixinha** — movimentações como “Aplicação RDB” e “Resgate RDB” são identificadas e exibidas separadamente do fluxo do dia a dia.
3. **Lembretes** — ficam no `localStorage` do navegador. Na primeira visita, a app tenta carregar `public/data/reminders-seed.json`.
4. **Cruzamento** — lembretes são comparados com transações do extrato por descrição e valor para sinalizar o que já foi pago.

> **Privacidade:** nenhum dado financeiro sai da sua máquina. Extratos e lembretes reais **não** devem ser commitados no Git (veja [Dados locais](#dados-locais-não-versionados)).

---

## Requisitos

- **Node.js** 20+ (recomendado)
- **npm** 10+

---

## Como rodar

### 1. Clonar e instalar

```bash
git clone https://github.com/dantonissler/hero_financ.git
cd hero_financ
npm install
```

### 2. Configurar dados locais

Os extratos e o seed de lembretes são **pessoais** e ficam fora do repositório.

**Extratos OFX**

```bash
mkdir -p public/contas
cp /caminho/para/seus/extratos/*.ofx public/contas/
npm run sync-contas   # gera public/contas/manifest.json
```

**Lembretes (opcional)**

```bash
cp public/data/reminders-seed.example.json public/data/reminders-seed.json
# edite o JSON com suas contas ou comece vazio pela interface
```

### 3. Subir o servidor de desenvolvimento

```bash
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173).

O script `predev` copia automaticamente OFX de `../contas/` (se existir) e atualiza o manifest.

### 4. Build de produção

```bash
npm run build
npm run preview   # preview local do build em dist/
```

Para publicar em GitHub Pages, Netlify ou Vercel, use a pasta `dist/` gerada pelo build.

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (Vite) |
| `npm run build` | Type-check + build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Lint com oxlint |
| `npm run sync-contas` | Copia OFX de `../contas/` e gera `manifest.json` |

---

## Dados locais (não versionados)

O `.gitignore` exclui arquivos com dados pessoais:

| Caminho | Conteúdo |
|---------|----------|
| `public/contas/*.ofx` | Extratos bancários |
| `public/contas/manifest.json` | Lista de OFX (gerado automaticamente) |
| `public/data/reminders-seed.json` | Seed de lembretes com seus dados |

O repositório inclui apenas:
- `public/contas/.gitkeep` — mantém a pasta
- `public/data/reminders-seed.example.json` — modelo vazio para copiar

**Backup dos lembretes:** use o botão **Exportar JSON** na aba Lembretes ou copie o conteúdo do `localStorage` (chave `finance-dashboard-reminders-db`).

---

## Estrutura do projeto

```
hero_financ/
├── public/
│   ├── contas/              # OFX locais (gitignored)
│   └── data/
│       └── reminders-seed.example.json
├── scripts/
│   └── update-manifest.mjs  # gera manifest.json dos OFX
├── src/
│   ├── components/          # UI (gráficos, tabelas, abas)
│   ├── hooks/               # useRemindersDb
│   ├── lib/
│   │   ├── ofxParser.ts     # leitura de OFX
│   │   ├── categorizer.ts   # regras de categoria
│   │   ├── analytics.ts     # métricas e insights
│   │   ├── caixinha.ts      # detecção da reserva
│   │   ├── remindersDb.ts   # CRUD + localStorage
│   │   └── reminderMatcher.ts
│   ├── App.tsx
│   └── types.ts
├── index.html
└── package.json
```

---

## Stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 8](https://vite.dev/)
- [Recharts](https://recharts.org/) — gráficos
- Parser OFX próprio (sem dependências de backend)

---

## Limitações conhecidas

- OFX testado principalmente com **Nubank**; outros bancos podem exigir ajustes no parser.
- Categorização baseada em **regras fixas** por palavra-chave (não há IA nem regras editáveis na UI ainda).
- Lembretes ficam no **navegador** — limpar cache ou trocar de dispositivo apaga os dados (use export JSON).
- Não há suporte a fatura de cartão separada do extrato da conta.

---

## Roadmap (ideias)

- [ ] Regras de categorização editáveis na interface
- [ ] Suporte a cartão de crédito (fatura separada)
- [ ] Exportar relatório PDF
- [ ] Comparar múltiplas contas

---

## Contribuindo

Issues e pull requests são bem-vindos. Ao contribuir:

1. Não commite extratos OFX, planilhas ou seeds com dados reais.
2. Rode `npm run lint` e `npm run build` antes de abrir o PR.
3. Descreva no PR o que mudou e como testar.

---

## Autor

**Danton Issler** — [github.com/dantonissler](https://github.com/dantonissler)

---

## Aviso

Este projeto é uma ferramenta pessoal de organização financeira. **Não constitui aconselhamento financeiro.** Use por sua conta e risco e mantenha seus dados sensíveis fora do controle de versão.

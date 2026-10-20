# Mint Newsletter — Planejamento

Newsletter de inteligência de mercado para o time MINT, focada em **tudo que pode mexer
em preço, produção, oferta ou demanda de pneus no Brasil e na América do Sul** — de
notícias locais (Anfavea, antidumping, greve em porto) a eventos globais (guerra,
fechamento de estreito, safra de borracha na Tailândia).

> Status: **Fase 0 concluída** — decisões fechadas (seção 8). Próximo passo: Fase 1,
> edição piloto.

---

## 1. Objetivo e princípio editorial

- **Objetivo:** em poucos minutos de leitura, o time sabe *o que aconteceu*, *por que
  importa para pneu* e *para que lado empurra* (preço ↑/↓, produção, demanda, oferta).
- **Princípio:** notícia sem "e daí?" não entra. Todo item precisa responder:
  1. Qual variável do mercado de pneus ele afeta?
  2. Em que direção e em que horizonte (imediato / 1–3 meses / 6+ meses)?
  3. Qual a confiança (fato confirmado vs. rumor/projeção)?
- **Regra de ouro anti-alucinação:** toda afirmação tem link de fonte. Sem fonte, não
  publica. Números são copiados da fonte, não "lembrados" pelo modelo.

## 2. Mapa de drivers (o que monitorar)

A newsletter é organizada por *cadeia causal*, não por veículo de notícia.

| Bloco | Drivers | Por que afeta pneu |
|---|---|---|
| **Matérias-primas** | Borracha natural (SGX TSR20, SICOM, preço Tailândia/Indonésia/Costa do Marfim), borracha sintética (butadieno, SBR), negro de fumo, petróleo (Brent), aço (steel cord), nylon/poliéster | ~50–70% do custo de produção de um pneu é matéria-prima |
| **Macro & câmbio** | BRL/USD, ARS, CLP, Selic, IPCA/IPP, PIB, crédito | Insumos e importados são dolarizados; juros afetam venda de veículos e frota |
| **Logística & geopolítica** | Estreitos (Ormuz, Malaca, Bab el-Mandeb/Mar Vermelho), Canal do Panamá, frete de contêiner (SCFI/Drewry WCI), portos (Santos, Paranaguá), guerras, sanções | Borracha e pneus importados vêm majoritariamente da Ásia; frete e prazo mexem em custo e disponibilidade |
| **Política comercial & regulação** | Antidumping/Gecex-Camex (pneus chineses etc.), TEC/Mercosul, tarifas EUA/UE, EUDR (regulamento anti-desmatamento da UE para borracha), Inmetro, reforma tributária, Reciclanip/descarte | Muda o preço do importado e a competitividade da produção local |
| **Demanda** | Produção/vendas de veículos (Anfavea), vendas de pneus (ANIP), reposição, frete rodoviário (ABCR), safra/agro (máquinas e caminhões), mineração (OTR), diesel | Montadora (OE) + reposição + segmentos (carga, agro, OTR) |
| **Oferta & indústria** | Abertura/fechamento/expansão de fábricas (Brasil e LatAm), greves, paradas, M&A, preços anunciados pelos fabricantes, entrada de marcas asiáticas, importações por NCM 4011/4012 (ComexStat) | Capacidade local e concorrência |
| **Clima & choques** | El Niño/La Niña no Sudeste Asiático, doenças nas seringueiras, enchentes, energia | Oferta de borracha natural e operação de fábricas |

Esse mapa vira a **taxonomia** que os agentes usam para classificar cada notícia.

## 3. Formato da edição (proposta)

1. **Radar da semana** — 3 a 5 bullets: o que mais importa, com seta de impacto.
2. **Painel de indicadores** — tabela curta com variação semanal: borracha natural,
   Brent, BRL/USD, frete de contêiner, (depois) importações de pneus.
3. **Análises por bloco** — uma seção por bloco do mapa acima, só quando houver notícia
   relevante. Cada item: título · 2–4 linhas de resumo · *"Impacto em pneu:"* · fonte.
4. **Brasil & América do Sul** — destaque regional (Argentina, Chile, Colômbia, Peru…).
5. **No radar / acompanhar** — eventos agendados (decisão Gecex, dados Anfavea, OPEP…)
   e follow-ups de edições anteriores.

Cada item recebe uma ficha estruturada (que é o que os agentes produzem):

```
titulo, resumo, fonte_url, data, bloco, regiao,
variavel_afetada: preco|producao|demanda|oferta|custo,
direcao: alta|baixa|incerto, horizonte: imediato|curto|medio,
magnitude: 1-3, confianca: confirmado|provavel|rumor
```

## 4. Arquitetura de agentes

Construída em cima do que já existe no repo (`harness/`, `loops/`, `memory/`).

```
                ┌──────────────────────────┐
                │  Orquestrador (editor-chefe)│  harness/ — define período, pauta, dispara agentes
                └─────────────┬────────────┘
     ┌───────────┬───────────┼───────────┬───────────┬───────────┐
     ▼           ▼           ▼           ▼           ▼           ▼
 Matérias-   Macro &     Logística & Comércio &   Demanda    Oferta &      ← "scouts" (subagentes
 primas      câmbio      geopolítica regulação               indústria       em harness/agents.py,
                                                                             WebSearch/WebFetch)
     └───────────┴───────────┼───────────┴───────────┴───────────┘
                             ▼
                ┌──────────────────────────┐
                │ Analista de impacto       │  deduplica, classifica na taxonomia,
                │                           │  pontua impacto, cruza com edições passadas (memory/)
                └─────────────┬────────────┘
                              ▼
                ┌──────────────────────────┐
                │ Redator (PT-BR)           │  escreve a edição no formato da seção 3
                └─────────────┬────────────┘
                              ▼
                ┌──────────────────────────┐
                │ Revisor / checador        │  confere cada número e link contra a fonte;
                │                           │  loop plan→act→review (loops/) até "DONE"
                └─────────────┬────────────┘
                              ▼
                       Publicação (rascunho → aprovação humana → envio)
```

- **Scouts** só pesquisam e devolvem fichas (como o `claude-code-tracker` já faz: não
  escrevem arquivo). Modelo mais barato/rápido.
- **Analista, Redator, Revisor** usam o modelo mais forte.
- **Coletor de dados** (não-LLM, Python puro): busca indicadores em APIs públicas —
  Banco Central (SGS/PTAX), ComexStat (importação NCM 4011), e cotações quando houver
  fonte acessível. Números do painel vêm daqui, nunca do texto gerado.
- **Memória:** cada edição publicada é salva em `newsletter/editions/` e indexada por
  `memory/retrieval.py`, para o analista saber o que já foi noticiado e fazer follow-up.
- **Humano no loop:** a edição sempre sai como rascunho; você aprova antes de enviar.

## 5. Fontes (lista inicial, a validar)

- **Setor:** ANIP, Anfavea, ABR (reforma de pneus), Reciclanip, Tire Business, European
  Rubber Journal, Rubber News, ANRPC, IRSG.
- **Notícias:** Valor Econômico, Reuters, Bloomberg Línea, Folha/Estadão (economia),
  Automotive Business, Infobae/La Nación (Argentina), Diario Financiero (Chile).
- **Oficiais/dados:** Banco Central (SGS), MDIC/ComexStat, Gecex/Camex (DOU), IBGE,
  ANP (diesel), EIA/OPEP (petróleo).
- Paywall: resumimos a partir do que é acessível e sempre linkamos; nada de copiar texto.
- Sem dados próprios nem fontes pagas: só fontes abertas com credibilidade mínima
  (grandes veículos, associações setoriais, órgãos oficiais). Blog/rede social só como
  pista, nunca como fonte final.

## 6. Roadmap

| Fase | Entrega | Critério de pronto |
|---|---|---|
| **0. Planejamento** *(agora)* | Este documento + decisões da seção 8 | Escopo, público, periodicidade e formato fechados |
| **1. Edição piloto manual** | Edição #0 feita numa sessão do Claude Code, com os papéis acima simulados por prompt | Time MINT lê e dá feedback; ajustamos formato e taxonomia |
| **2. Pipeline de agentes** | Scouts + analista + redator + revisor em Python (`newsletter/`), saída em Markdown/HTML | Gera uma edição com 1 comando (`uv run python -m newsletter.run`), toda afirmação com fonte, testes com pytest |
| **3. Dados e painel** | Coletor de indicadores (BCB, ComexStat, cotações) + gráficos simples | Painel com números verificáveis e série histórica |
| **4. Distribuição e agenda** | Execução agendada semanal + gatilho de alerta extraordinário; PDF gerado e anexado a um rascunho de e-mail | Edição chega pronta para aprovação no dia combinado |
| **5. Qualidade contínua** | Feedback do time por item (útil/não útil), ajuste de fontes e pesos | Métricas de leitura/feedback guiando a pauta |

Fase 1 é deliberadamente manual: valida o *conteúdo* antes de investir na automação.

## 7. Estrutura prevista no repo

```
newsletter/
  PLAN.md            ← este arquivo
  taxonomy.py        ← blocos, variáveis, escala de impacto (fase 2)
  agents.py          ← scouts, analista, redator, revisor (fase 2)
  sources.yaml       ← fontes e palavras-chave por bloco (fase 2)
  data/              ← coletores de indicadores (fase 3)
  run.py             ← orquestrador (fase 2)
  editions/          ← edições publicadas, em Markdown (memória)
  tests/
```

## 8. Decisões tomadas

| Tema | Decisão |
|---|---|
| **Nome** | Mint Newsletter (provisório) |
| **Público** | Time MINT + algumas pessoas da empresa de fora da equipe. Uso interno: tom técnico mas acessível a quem não é da área |
| **Periodicidade** | Semanal + **alertas extraordinários** para eventos grandes (ex.: fechamento de estreito, antidumping novo, parada de fábrica relevante) |
| **Segmento** | Todos os pneus, sem recorte |
| **Países** | Toda a América do Sul, com notícias que afetem direta ou indiretamente (inclui eventos globais) |
| **Formato** | Página em estilo **jornal**, exportável em **PDF**, para encaminhar por e-mail |
| **Dados/fontes** | Nenhum dado próprio nem assinatura paga — só fontes abertas confiáveis |

### Formato e mecânica de envio (proposta)

- A edição é gerada como **HTML com layout de jornal** (cabeçalho com nome/data/número
  da edição, colunas, manchete, painel de indicadores) e CSS de impressão em A4.
- O **PDF é gerado automaticamente** a partir desse HTML (Chromium/Playwright, já
  disponível no ambiente) — mesmo visual na tela e no papel.
- Cada edição também pode ser publicada como **artefato** (página privada no claude.ai)
  para leitura na tela.
- Envio: começar simples — você baixa o PDF e encaminha. Depois (Fase 4), criar
  automaticamente um **rascunho no Gmail** com o PDF anexado e a lista de destinatários,
  para você só revisar e clicar em enviar.
- Alerta extraordinário: formato curto (1 página), mesmo visual, marcado como "ALERTA".

# Design system IM v1 — Inteligência de Mercado · Indicadores

Padrão visual comum a todos os painéis do projeto. Origem: o redesign editorial do Painel ANFAVEA
(papel, tinta, filetes finos e um único vermelhão de destaque; Fraunces + Inter Tight + IBM Plex Mono).

## Arquivos
- `im-ds.css` — tokens (claro/escuro), ponte para os tokens do tipo Dashboard (`--color-*`, `--cds-*`,
  `--font-anthropic-*`) e componentes `.im-*`. Tudo escopado em `.im`.
- `im-ds.js` — `window.IM`: `IM.colors()` (paleta categórica do tema), `IM.tok(name)`, `IM.isDark()`,
  `IM.bar(host, currentId)` (barra de navegação do projeto) e `IM.links` (URLs).

## Páginas do projeto
| id | Página | URL |
|---|---|---|
| hub | Hub | https://claude.ai/artifact/V1bVorfGMvbgGWoQbHjA1r |
| overall | Overall Michelin | https://claude.ai/artifact/BLaQZRNXjzwTWnfyC96Qf9 |
| anfavea | Autoveículos (ANFAVEA) | https://claude.ai/artifact/BFjv7uaNAb6ZKscpYy2Y1m |
| anp | Combustíveis (ANP) | https://claude.ai/artifact/5zCFL7zy2UTQxKTgj4Lk5P |
| abcr | Fluxo pedagiado (ABCR) | https://claude.ai/artifact/4QNxE4hMyDfYFqYGQHaAQ4 |
| pim | Produção industrial (IBGE PIM-PF) | https://claude.ai/artifact/FBhGpvwfJWYiW2esC4Pb8J |

## Regras de composição
1. Raiz da página: `<div class="im ...">`. Primeiro filho: `<div id="im-bar"></div>` + `IM.bar(el, '<id>')`.
2. Cabeçalho `.im-mast`: `.im-eyebrow` (fonte · cobertura · último mês), `.im-title` (com uma palavra em `<em>` no vermelhão), `.im-dek` (a conclusão em uma frase).
3. Abas `.im-tabs` (sublinhado vermelhão), filtros como selects sublinhados e `.im-seg`.
4. Números `.im-kpis/.im-kpi` (Fraunces 44px, deltas em mono, verde/vermelho só para variação).
5. Cartões `.im-card`: filete de tinta de 2px no topo com marca vermelhão de 56px à esquerda, sem caixa nem sombra; título `.im-h3`, nota `.im-note`.
6. Gráficos: texto de eixo em mono 11px muted, grade `--grid`, séries por `IM.colors()` seguindo a entidade; uma série em destaque (vermelhão) e o resto `--s-muted`. Sem seleção, barras em tinta (`--fg`), nunca todas em vermelhão.
7. Entidades fixas no projeto (nunca a cor do destaque, índice 1): leves/passeio = `IM.colors()[0]`, pesados/carga = `[3]`, total = `[2]`.
7. Tooltip `.im-tt` (vidro), rodapé `.im-foot` com fonte e data de atualização.

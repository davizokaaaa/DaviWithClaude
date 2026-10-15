# Brief comum — aplicar o design system IM a um dashboard existente

Você vai re-estilizar UM dashboard do projeto "Inteligência de Mercado · Indicadores" para o design system IM v1.
Leia primeiro: /home/user/DaviWithClaude/projects/inteligencia-mercado/design-system/README.md, im-ds.css e im-ds.js (mesma pasta).
Referência visual viva do padrão: o painel ANFAVEA (cópia local em
/tmp/claude-0/-home-user-DaviWithClaude/f24afbc6-bbe6-5ec7-8c99-aa8a46112d0a/scratchpad/dash/anfavea/index.html), classes .av-*.

## Como o dashboard funciona (tipo "Dashboard" do claude.ai)
- O conteúdo vive no banco do artifact. Use a ferramenta `ArtifactData` (carregue com ToolSearch "select:ArtifactData").
- A página é o documento `files/index.html` → campo `text` (o arquivo inteiro). Outros arquivos `files/<nome>` são carregados por
  `<link href="<nome>">` ou `<script src="<nome>">` dentro do index.html.
- Escreva com UMA chamada `action:"batch"` contendo:
  1. `set` em `files/im-ds.css` com `{text: <conteúdo de im-ds.css>}` (doc novo, sem if_version; se já existir, leia e use if_version)
  2. `set` em `files/im-ds.js` com `{text: <conteúdo de im-ds.js>}` (idem)
  3. `update` em `files/index.html` com `{text: <novo html>}` e `if_version` = a versão atual (leia com `get` antes).
  Use `file_path` apontando para JSON local `{"text": "..."}` (gere com python json.dump) em vez de colar texto inline.
- Regras do tipo: não use seletores `body`, `html` nem tags soltas; tudo sob a classe raiz. Sem <iframe>, <form>, <meta>, atributos on…=.
  Scripts rodam em ordem, cada um no seu escopo; o `<script src="im-ds.js">` deve vir ANTES dos scripts da página.
  `<a href target="_blank" rel="noopener">` para links externos é ok.
- NÃO renderize, não faça screenshot, não abra browser/Playwright (regra do tipo). A checagem é ler o próprio código com cuidado
  e rodar `node --check` nos blocos <script> extraídos (sintaxe).

## O que mudar (só apresentação; dados intactos)
- PRESERVE 100% da lógica de dados: todos os `data-source`, `data-field`, `data-where`, `data-row-key`, `dash.calc`, `dash.loader`,
  `dash.onData`, `dash.setParams`, `dash.setLink`, ids de abas/seções/cartões, textos analíticos. Não toque nos datasets.
- Adicione a classe `im` à div raiz da página (mantendo a classe antiga se o CSS depende dela) e, como primeiro filho,
  `<div id="im-bar"></div>`; num script após im-ds.js chame `IM.bar(document.getElementById('im-bar'), '<ID>')`.
- Adicione `<link rel="stylesheet" href="im-ds.css">` no topo.
- Reescreva o <style> da página para o visual IM: masthead (eyebrow em caixa alta espaçada, título Fraunces grande com uma
  palavra em <em> itálico vermelhão, dek serifado com a conclusão), abas com sublinhado vermelhão, filtros com selects sublinhados,
  KPIs em faixa com divisórias finas (Fraunces 44px), cartões com filete de 2px de tinta no topo (sem caixa/fundo/sombra/raio),
  tooltip de vidro, tabelas em mono, rodapé `.im-foot` com fonte. Pode usar as classes .im-* diretamente ou mapear as classes
  existentes para os mesmos valores — o resultado visual deve ser idêntico ao padrão.
- Cores de séries: troque usos de `dash.colors[i]` por `IM.colors()[i]` (lido a cada desenho, para seguir o tema).
  Cor de destaque/“série atual” = `IM.tok('--accent')`, demais = `var(--s-muted)`. Positivo/negativo = `--up`/`--down`.
  Rampas de heatmap: `--heat-lo` → `--heat-hi` (via IM.tok + d3.interpolateRgb).
- Texto de eixos: mono 11px muted. Gridlines `--grid`.
- Responsivo até ~400px; nada de largura fixa.
- Mantenha o tamanho do index.html < 240 KB.

Ao terminar, responda com: o que mudou, a nova versão do files/index.html, e qualquer risco que encontrou.

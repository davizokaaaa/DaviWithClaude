# ANFAVEA – Autoveículos (2023+)

Coleta automática de **todos** os dados da seção *Autoveículos* da
[Central de Dados da ANFAVEA](https://anfavea.com.br/site/central-de-dados/), com
agregação mensal desde jan/2023, e relatório consolidado.

**Relatório:** [`relatorio/RELATORIO.md`](relatorio/RELATORIO.md) ·
**Planilha:** [`relatorio/relatorio_anfavea_autoveiculos.xlsx`](relatorio/relatorio_anfavea_autoveiculos.xlsx) ·
**Base longa:** [`relatorio/base_autoveiculos.csv`](relatorio/base_autoveiculos.csv)

## O que é coletado

| Série | Aberturas | Desde |
|---|---|---|
| Produção, Emplacamento, Exportação | Automóveis, Comerciais leves, Caminhões, Ônibus | 2023-01 |
| Produção, Emplacamento, Exportação | Caminhões por subsegmento (semileves, leves, médios, semipesados, pesados) | 2023-01 |
| Emplacamento | Por combustível, por categoria | 2023-01 |
| Emplacamento | Nacional × importado, por categoria | 2023-01 |
| Emplacamento | Empresa × marca × procedência, por categoria | **2026-01** (limite da fonte) |

## Como funciona

A Central de Dados monta as tabelas via `POST /site/wp-admin/admin-ajax.php`
(`action=anfavea_dashboard1`) com um nonce público embutido na página.
`scripts/collect.py` reproduz essas consultas e salva `data/raw/*.json` (resposta bruta) e
`data/csv/*.csv`; `scripts/build_report.py` consolida tudo em `relatorio/`.

```bash
pip install -r requirements.txt
python scripts/collect.py --inicio 2023-01      # precisa de acesso a anfavea.com.br
python scripts/build_report.py                   # offline, a partir de data/csv
```

O workflow `.github/workflows/anfavea.yml` roda os dois passos no GitHub Actions e commita o
resultado (em push, manualmente ou diariamente quando estiver no branch padrão).

Base longa: `consulta, tipo_dado, categoria, subsegmento, combustivel, procedencia, empresa,
marca, periodo (AAAA-MM), valor`. Filtre por `consulta` para não somar aberturas diferentes
da mesma série.

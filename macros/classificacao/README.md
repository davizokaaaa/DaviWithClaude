# Macro de Classificação de Mercadorias (VBA)

Macro original monolítica separada em módulos `.bas` para facilitar
correções e alterações pontuais.

## Módulos

| Módulo | Responsabilidade |
|---|---|
| `modConfig.bas` | Constantes globais (caminho da Tabela de Referência, nome da coluna adquirente, flag de diagnóstico). |
| `modPlanilha.bas` | Utilitários genéricos de planilha: localizar/criar coluna por cabeçalho, normalizar texto de cabeçalho, achar última linha usada. |
| `modDicionarios.bas` | Dicionários fixos: montadoras (OE), marcas ANIP, lista legada de padrões de GEOBOX. |
| `modReferencia.bas` | Abre e lê a Tabela de Referência externa (abas `Referencia`, `MarcasExtras`/`MarcasExtra`, `ExcecoesMarca`, `ExcecoesGama`) e monta os dicionários de apoio (`CarregarTabelaReferencia`, `ObterSegmentoELpPorDimensao`). |
| `modMarca.bas` | Extração da coluna MARCA (`ExtrairMarca`, `BuscarMarcaConhecida`). |
| `modGama.bas` | Extração da coluna GAMA (`ExtrairGama`) — checa abreviações (aba `ExcecoesGama`, ex: "PTNZ" → "POTENZA") antes de buscar o nome completo conhecido. |
| `modDimensao.bas` | Normalização de formatação de medida e extração de DIMENSÃO/ARO (`ExtrairDimensao`, `NormalizarFormatacaoBasica`, `NormalizarTextoDimensao`, `ExtrairAro`). |
| `modDimensaoExtenso.bas` | Reconhecimento de medida escrita por extenso em laudos (`ExtrairDimensaoPorExtenso`) — só acrescenta candidatos ao texto de busca de `modDimensao`, isolado para evoluir/reverter padrões novos sem risco à extração já validada. |
| `modClassificacaoRegras.bas` | Regras de negócio de LP: fallback por SEGMENTO (`DeduzirLp`) e a regra do ARO ".5" forçando LP="PL" (`AroTerminaEmMeio`). |
| `modMain.bas` | `Sub ClassificarTudo` — orquestrador: lê colunas de entrada, carrega a Tabela de Referência, aplica as extrações/regras linha a linha e grava as colunas de saída. É a macro que se executa (Alt+F8 → `ClassificarTudo`). |

## Ordem de dependência

`modMain` depende de todos os outros. Os demais não dependem de
`modMain`, mas `modReferencia` e `modDimensao` compartilham
`NormalizarFormatacaoBasica` (definida em `modDimensao.bas`), e
`modDimensao` depende de `modDimensaoExtenso`
(`ExtrairDimensaoPorExtenso`).

## Como importar no Excel

1. Abra o arquivo `.xlsm` no Excel.
2. `Alt+F11` para abrir o Editor VBA.
3. Se já existir um módulo único com a macro antiga, remova-o (botão
   direito no módulo → **Remover Modxx**, escolha "Não" para não
   exportar).
4. **Arquivo → Importar Arquivo…** e selecione, um de cada vez, todos os
   `.bas` desta pasta (a ordem não importa para importação, o VBA resolve
   as referências entre módulos automaticamente).
5. Salve o arquivo mantendo a extensão `.xlsm`.
6. Rode `ClassificarTudo` com a planilha de dados como aba ativa.

## Observações

- As constantes em `modConfig.bas` (`REF_FILE_PATH`, `COL_ADQUIRENTE_NOME`,
  `MOSTRAR_DIAGNOSTICO_REFERENCIA`) são o primeiro lugar a checar/editar
  para qualquer ajuste de ambiente.
- A lógica de negócio (marca, dimensão, LP/segmento) ficou isolada nos
  módulos temáticos correspondentes — mude ali sem precisar tocar no
  orquestrador (`modMain`), a menos que a mudança afete a ordem/gravação
  das colunas.

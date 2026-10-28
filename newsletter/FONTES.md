# Fontes dos indicadores MINT para a newsletter

Data deste documento: 23/10/2026.

## 1. Para que serve este documento

Este é um guia de consulta para quem vai escrever a newsletter com base na planilha de Indicadores MINT (Michelin). Para cada aba, ele diz de onde vem o dado, como citar a fonte, a que período o dado se refere e quando deve sair o próximo número. Tudo o que não está documentado nos arquivos do projeto aparece como "não documentado" ou "a confirmar". Nenhuma data de divulgação foi inventada: onde só existe a recorrência registrada na planilha, isso está dito.

Observações de leitura:
- "Recorrência da planilha" é o dia do mês em que o time MINT espera olhar a fonte (consta no ÍNDICE da planilha). Não é, necessariamente, o calendário oficial da instituição.
- "Observado em 20/10/2026" indica o último mês que a fonte tinha publicado quando foi consultada.
- Os valores históricos da planilha só recebem meses novos. Se a fonte revisar um mês antigo, a planilha não é corrigida (ver seção 5).

## 2. Tabela-resumo

Situação: "Automático" = leitura da fonte e gravação na planilha já testadas; "Quase pronto" = pronto, falta confirmar um mês; "Manual/pendente" = sem rotina de atualização.

| Aba | Indicador (o que mede) | Fonte | Frequência | Defasagem típica / quando sai | Unidade | Situação |
|---|---|---|---|---|---|---|
| Serviços | Volume de serviços prestados no Brasil, total e transportes | IBGE (PMS, SIDRA 8688) | Mensal | 40 a 45 dias; observado ago/26 em 20/10 | Número-índice (2022=100); variação acumulada no ano em % | Automático |
| Varejo | Receita nominal de vendas do comércio varejista | IBGE (PMC, SIDRA 8880) | Mensal | Cerca de 45 dias; observado ago/26 em 20/10 | Número-índice (2022=100); variação acumulada no ano em % | Automático |
| PIB | PIB trimestral por setor, a preços correntes | IBGE (Contas Nacionais Trimestrais, SIDRA 1846) | Trimestral | Cerca de 2 meses após o fim do trimestre; observado 2T26 | R$ milhões | Automático |
| IPCA | Inflação oficial (geral e transportes) e expectativa de mercado | IBGE (SIDRA 7060) e Banco Central (Focus) | Mensal (IPCA); semanal (Focus) | IPCA do mês anterior, por volta do dia 10 a 13; observado set/26 | % | Automático |
| Exportação Soja | Embarques mensais de soja em grão do Brasil | ANEC | Mensal (relatório semanal) | Mês fechado, até cerca de 1 mês; gravado set/26 | Toneladas | Automático |
| Produção Asfalto | Produção nacional de asfalto das refinarias | ANP | Mensal | Cerca de 1 a 2 meses; observado ago/26 em 20/10 | m³ | Automático |
| Produção Industrial | Produção física da indústria (geral, extrativa, transformação, alimentos) | IBGE (PIM-PF, SIDRA 8888) | Mensal | Cerca de 40 dias; observado ago/26 | Número-índice (2022=100); variação acumulada no ano em % | Automático |
| Fluxo Pedagiado | Fluxo de veículos leves e pesados em rodovias com pedágio | ABCR (Índice ABCR, Melhores Rodovias) | Mensal | Cerca de 10 dias após o mês; observado set/26 em 20/10 | Índice (1999=100) | Automático |
| OE PL e TC | Licenciamento e produção de caminhões pesados e ônibus | ANFAVEA (Central de Dados) | Mensal | Até cerca de 3 semanas após o mês; observado set/26 | Veículos | Automático |
| 2R - BIKE | Produção de bicicletas no Polo Industrial de Manaus | ABRACICLO | Mensal | Dia 11 a 15 do mês seguinte (irregular); observado set/26 | Unidades | Automático (texto de press release) |
| 2R - MOTO | Produção de motocicletas no Polo Industrial de Manaus | ABRACICLO | Mensal | Dia 11 a 15 do mês seguinte (irregular); observado set/26 | Unidades | Automático (texto de press release) |
| Fertilizantes | Entregas de fertilizantes ao mercado | ANDA | Mensal | Cerca de 2,5 a 3 meses; observado jul/26 | Toneladas | Automático |
| Intenção de Consumo das Famílias | Índice de intenção de consumo das famílias e componentes | CNC | Mensal | No próprio mês, entre os dias 19 e 25; observado set/26 | Pontos (0 a 200) | Automático |
| Índices de Confiança | Confiança de consumidor, indústria, comércio, serviços, construção e empresarial; incerteza; utilização da capacidade | FGV IBRE | Mensal | No próprio mês (últimos dias); ICE e incerteza no 1º dia do mês seguinte | Pontos; utilização em % | Automático |
| Safra Brasil - Área | Área plantada de grãos por levantamento da safra | CONAB | Mensal (12 levantamentos por safra) | Mês do próprio levantamento, por volta do dia 9 a 15 | Mil hectares | Automático |
| Safra Brasil - Produção | Produção de grãos por levantamento; blocos de inverno e de cana | CONAB | Mensal (grãos); 4 por safra (cana) | Grãos: mesmo mês; cana: abr, ago, nov, abr | Mil toneladas | Automático (grãos testado; cana aguarda teste) |
| Socioeconômico | PIB per capita, Gini e pobreza de 7 países | Banco Mundial (WDI e PIP) | Anual | Atraso de 1 a 2 anos conforme o indicador e o país | mil US$ (PPP); índice 0 a 100; % | Automático (aguarda teste no Excel) |
| Consumo Combustível (derivados) | Vendas de diesel, gasolina C e etanol hidratado | ANP | Mensal | Cerca de 1 a 2 meses; planilha em ago/26, ANP sem set/26 em 20/10 | m³ | Quase pronto |
| Consumo Combustível Segmentado | Vendas de diesel por segmento de cliente | ANP | Mensal | Idem derivados | m³ | Quase pronto |
| Safra Área vs Produção | Série histórica de área e produção de soja, milho e algodão | CONAB e Ministério da Agricultura | Anual (fechamento de safra) | Depende do fechamento da safra | Mil ha e mil t | Manual/pendente |
| Safra - Evolução | Evolução da colheita, exportação e processamento de soja | CONAB, ANEC e ABIOVE | Mensal | Não documentado | Mil t e % | Manual/pendente |
| Safra Cultivado x Semeado | Progresso de plantio e colheita | CONAB (Progresso de Safra) | Mensal (dado semanal na fonte) | Não documentado | % da área | Manual/pendente |
| Safra - Preço e Rentabilidade | Preços de soja, milho, algodão etc. e custo e margem de produção | CONAB, B3, CEPEA, IMEA e outras | Mensal | Não documentado | R$, US$ e % | Manual/pendente |
| Commodities | Preços de cobre, minério de ferro, prata, petróleo, soja, milho, algodão, fertilizante e dólar | Business Insider, CEPEA, Notícias Agrícolas, CONAB, Index Mundi e outras | Mensal | Não documentado | Varia por coluna | Manual/pendente |
| TEUS | Movimentação de contêineres nos portos | ANTAQ | Mensal | Não medida; fonte não testada | TEU | Manual/pendente (parada em mar/25) |

## 3. Uma seção por aba

Em todas as seções, "Link para o leitor" é a página oficial onde o leitor pode conferir o dado. Os textos de citação são sugestões; ajuste ao padrão editorial da newsletter.

### Indicadores automáticos (17)

#### 3.1 Serviços
- O que mede: índice de volume de serviços no Brasil (2022 = 100), com o total, alimentação e os segmentos de transporte (rodoviário de cargas e de passageiros, outros terrestres, aquaviário, aéreo, armazenagem e correio). A planilha traz também a variação acumulada no ano em relação ao mesmo período do ano anterior.
- Instituição e tabela: IBGE, Pesquisa Mensal de Serviços (PMS), tabela SIDRA 8688. Usa-se o índice de volume (não a receita nominal).
- Link para o leitor: https://sidra.ibge.gov.br/tabela/8688
- Frequência e calendário: mensal. A recorrência da planilha é o dia 15; a fonte indica 40 a 45 dias de defasagem. Calendário oficial do IBGE: a confirmar.
- Referência temporal: dado do mês de referência com cerca de 1,5 mês de atraso. Observado em 20/10/2026: agosto/2026.
- Unidade e apresentação: número-índice com 5 casas na fonte, exibido sem casas; variação acumulada com 1 casa, em pontos percentuais.
- Citação sugerida: "Fonte: IBGE, Pesquisa Mensal de Serviços (PMS), tabela 8688 (volume de serviços, base 2022 = 100)."
- Cuidados: o IBGE revisa meses anteriores (por exemplo, o total de abril/24 diferiu entre a planilha e a fonte atual); a planilha não reescreve meses já lançados, então um número antigo da planilha pode diferir do site do IBGE. Alimentação e subsegmentos de transporte só têm dado numérico a partir de 2022. "Serviços total" é o nome da planilha para o "Total" do IBGE.

#### 3.2 Varejo
- O que mede: índice de receita nominal de vendas do comércio varejista no Brasil (2022 = 100) e variação acumulada no ano.
- Instituição e tabela: IBGE, Pesquisa Mensal de Comércio (PMC), tabela SIDRA 8880, categoria "receita nominal" (não o volume de vendas).
- Link para o leitor: https://sidra.ibge.gov.br/tabela/8880
- Frequência e calendário: mensal. A recorrência não consta no ÍNDICE; a fonte indica cerca de 45 dias de defasagem. Data exata: a confirmar.
- Referência temporal: mês de referência com cerca de 1,5 mês de atraso. Observado em 20/10/2026: agosto/2026.
- Unidade e apresentação: número-índice com 5 casas (exibido sem casas); variação acumulada com 1 casa em pontos percentuais.
- Citação sugerida: "Fonte: IBGE, Pesquisa Mensal de Comércio (PMC), tabela 8880 (receita nominal de vendas no varejo, base 2022 = 100)."
- Cuidados: o indicador é receita nominal, isto é, não desconta a inflação. Há revisões do IBGE em meses antigos (jan a jun/26 diferem levemente da fonte atual) e a planilha mantém o valor original. Não há demandante registrado no ÍNDICE para esta aba (a confirmar).

#### 3.3 PIB
- O que mede: PIB trimestral do Brasil a preços correntes, por setor: agropecuária, indústria (total, extrativa, transformação, eletricidade/gás/água/esgoto, construção), serviços (total, comércio, transporte/armazenagem/correio), consumo das famílias e consumo da administração pública.
- Instituição e tabela: IBGE, Contas Nacionais Trimestrais, tabela SIDRA 1846, variável "Valores a preços correntes".
- Link para o leitor: https://sidra.ibge.gov.br/tabela/1846
- Frequência e calendário: trimestral. A recorrência da planilha é o dia 5; a fonte indica divulgação normalmente no início de março, junho, setembro e dezembro.
- Referência temporal: trimestre encerrado cerca de 2 meses antes. Observado em 20/10/2026: 2º trimestre de 2026 (divulgado em 01/09/2026). O 3º trimestre deve sair no início de dezembro (estimativa a partir do padrão).
- Unidade e apresentação: R$ milhões, números inteiros, uma linha por trimestre ("1Q 2026", "2Q 2026").
- Citação sugerida: "Fonte: IBGE, Contas Nacionais Trimestrais, tabela 1846 (valores a preços correntes)."
- Cuidados: são valores correntes, sem ajuste sazonal e sem encadeamento; não servem para falar de crescimento real. A soma dos subsetores não fecha com o total (há outros itens e arredondamento). O IBGE revisa trimestres anteriores. Há uma dúvida aberta sobre o rótulo de uma tabela de apoio da aba ("1Q 24 vs 1Q 23"); conferir antes de citar comparações dessa tabela.

#### 3.4 IPCA
- O que mede: variação mensal e acumulada em 12 meses do IPCA (índice geral e grupo Transportes) e a mediana das expectativas de mercado para a inflação (Focus).
- Instituição e tabela: IBGE, SIDRA tabela 7060 (variáveis "variação mensal" e "acumulada em 12 meses"); Banco Central do Brasil, Relatório Focus (expectativas anuais de IPCA).
- Links para o leitor: https://sidra.ibge.gov.br/tabela/7060 e https://www.bcb.gov.br/publicacoes/focus
- Frequência e calendário: IPCA mensal; a recorrência da planilha é o dia 13 e a spec da fonte observou divulgação por volta do dia 10 (data oficial: a confirmar). O Focus é divulgado semanalmente, às segundas-feiras.
- Referência temporal: o IPCA de um mês sai no mês seguinte. Observado em 20/10/2026: setembro/2026 (geral 0,82% no mês e 4,58% em 12 meses; Transportes 0,89% e 3,94%). O Focus de 16/10/2026 trazia mediana de 5,22% para 2026 e 4,32% para 2027.
- Unidade e apresentação: % com 2 casas.
- Citação sugerida: "Fonte: IBGE, IPCA (SIDRA, tabela 7060); expectativas: Banco Central do Brasil, Relatório Focus (mediana)."
- Cuidados: o bloco Focus da planilha não é atualizado automaticamente (a macro só mostra a mediana mais recente como aviso) e o significado das colunas C18 e D18 (ambas 2026) está em aberto; para citar o Focus, consulte direto o Banco Central. A diferença entre as duas "bases de cálculo" do Focus não está documentada; a planilha usa a base 0. O grupo Transportes foi completado até o último mês da fonte.

#### 3.5 Exportação Soja
- O que mede: volume mensal de soja em grão exportado pelo Brasil.
- Instituição e publicação: ANEC (Associação Nacional dos Exportadores de Cereais), relatório "Exportações Acumuladas" por semana, em PDF, tabela "Monthly shipments", coluna Soybean.
- Link para o leitor: https://anec.com.br (seção de estatísticas)
- Frequência e calendário: relatório semanal; a recorrência da planilha é o dia 1. O mês em andamento aparece marcado com asterisco e é parcial.
- Referência temporal: a planilha usa o último mês fechado (o anterior ao marcado com asterisco). Gravado em outubro/2026: setembro/2026 = 7.113.782 t. O número de outubro fecha em novembro.
- Unidade e apresentação: toneladas, com separador de milhar, tal como no PDF.
- Citação sugerida: "Fonte: ANEC, relatório de exportações acumuladas (embarques mensais de soja)."
- Cuidados: nunca usar o mês marcado com asterisco (parcial). A origem desta aba aparece como ABIOVE no ÍNDICE da planilha, mas o dado vem da ANEC (correção do ÍNDICE pendente). A ANEC pode revisar números anteriores.

#### 3.6 Produção Asfalto
- O que mede: produção nacional mensal de asfalto, somando todas as refinarias.
- Instituição e publicação: ANP, dados abertos de processamento de petróleo e produção de derivados (arquivo "produção de derivados de petróleo por refinaria", produto ASFALTO).
- Link para o leitor: https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos/processamento-de-petroleo-e-producao-de-derivados
- Frequência e calendário: mensal; recorrência da planilha dia 1. Dia exato de publicação pela ANP: não documentado.
- Referência temporal: observado em 20/10/2026: agosto/2026 (245.439 m³).
- Unidade e apresentação: metros cúbicos (m³), inteiro e truncado, com separador de milhar (por pedido da equipe: a fonte traz casas decimais, por exemplo 245.439,53).
- Citação sugerida: "Fonte: ANP, Produção de derivados de petróleo por refinaria (asfalto), dados abertos."
- Cuidados: o valor da planilha é truncado, não arredondado. A ANP revisa números passados. Há um registro de que a planilha pode preencher buracos antigos em meses vazios (ponto técnico não corrigido).

#### 3.7 Produção Industrial
- O que mede: produção física da indústria brasileira: indústria geral, indústrias extrativas, indústrias de transformação e fabricação de produtos alimentícios.
- Instituição e tabela: IBGE, Pesquisa Industrial Mensal - Produção Física (PIM-PF), tabela SIDRA 8888.
- Link para o leitor: https://sidra.ibge.gov.br/tabela/8888
- Frequência e calendário: mensal; recorrência da planilha dia 14. Calendário oficial: a confirmar.
- Referência temporal: observado: agosto/2026.
- Unidade e apresentação: número-índice (2022 = 100) exibido como inteiro; variação acumulada no ano em %, com 1 casa.
- Citação sugerida: "Fonte: IBGE, Pesquisa Industrial Mensal - Produção Física (PIM-PF), tabela 8888."
- Cuidados: a planilha guarda o índice arredondado para inteiro (padrão dos meses recentes); o IBGE divulga mais casas. Revisões do IBGE não são refletidas em meses já lançados.

#### 3.8 Fluxo Pedagiado
- O que mede: índice do fluxo de veículos leves e pesados em rodovias pedagiadas do Brasil (série dessazonalizada e série original; a série original não tem total).
- Instituição e publicação: ABCR (Associação Brasileira de Concessionárias de Rodovia), Índice ABCR, publicado pelo portal Melhores Rodovias em arquivo Excel mensal.
- Link para o leitor: https://melhoresrodovias.org.br/indice-abcr_2/
- Frequência e calendário: mensal; recorrência da planilha dia 10.
- Referência temporal: observado em 20/10/2026: setembro/2026 (cerca de 20 dias de defasagem). Série a partir de 2019 na planilha.
- Unidade e apresentação: índice com base 1999 = 100, sem arredondamento.
- Citação sugerida: "Fonte: ABCR, Índice ABCR de fluxo de veículos pedagiados (Melhores Rodovias)."
- Cuidados: a ABCR revisa números anteriores. Só Brasil. Diferenciar sempre "dessazonalizado" de "original" ao comentar variações.

#### 3.9 OE PL e TC
- O que mede: emplacamentos (licenciamento) e produção de caminhões pesados e de ônibus no Brasil. A aba é a base de OE (montadoras) e PL (veículos pesados).
- Instituição e publicação: ANFAVEA, Central de Dados. O emplacamento da ANFAVEA vem de Renavam/Senatran, como diz a própria página.
- Link para o leitor: https://anfavea.com.br/site/central-de-dados/
- Frequência e calendário: mensal; recorrência da planilha dia 8; a fonte publica até cerca de 3 semanas após o fechamento do mês. Licenciamento e produção podem ter último mês diferente.
- Referência temporal: observado em 20/10/2026: setembro/2026 para produção e emplacamento. Valores gravados de produção em set/26: 5.965 caminhões pesados e 1.425 ônibus.
- Unidade e apresentação: veículos (unidades), inteiros.
- Citação sugerida: "Fonte: ANFAVEA, Central de Dados (produção e emplacamento de caminhões pesados e ônibus)."
- Cuidados: a Central de Dados diz que as informações estão sujeitas a revisão (por exemplo, ônibus em agosto/26 foi 2.088 na planilha e 2.023 na fonte atual). O arquivo Excel mensal da ANFAVEA deixou de ser publicado; a leitura usa um mecanismo interno do site que não é uma API documentada e pode mudar. Se falhar, o procedimento é manual pela Central de Dados. A FENABRAVE não é necessária. O rótulo "heay truck" na planilha é um erro de digitação histórico (heavy truck = caminhão pesado).

#### 3.10 2R - BIKE
- O que mede: produção mensal de bicicletas no Polo Industrial de Manaus (PIM).
- Instituição e publicação: ABRACICLO (Associação Brasileira dos Fabricantes de Motocicletas, Ciclomotores, Motonetas, Bicicletas e Similares). O número mensal só existe no texto dos press releases (não há planilha ou API).
- Link para o leitor: https://abraciclo.com.br/press-release
- Frequência e calendário: mensal. Releases observados entre os dias 11 e 15 do mês seguinte (agosto/26 saiu só em 24/09). Calendário oficial: não documentado.
- Referência temporal: observado em 20/10/2026: setembro/2026 = 35.914 unidades (acumulado jan a set: 272.018).
- Unidade e apresentação: unidades, inteiro.
- Citação sugerida: "Fonte: ABRACICLO, press release de produção de bicicletas (Polo Industrial de Manaus)."
- Cuidados: dependência de texto de press release; o número do mês é lido do texto e validado pelo acumulado do ano. Se o texto mudar, a leitura pode falhar e o número é digitado à mão. A ABRACICLO pode retificar meses anteriores (na moto, maio teve diferença de 16 unidades). A aba tem uma célula de projeção (fonte vermelha) que deve ser trocada pelo valor real quando sair.

#### 3.11 2R - MOTO
- O que mede: produção mensal de motocicletas no Polo Industrial de Manaus (PIM).
- Instituição e publicação: ABRACICLO, press release mensal (texto).
- Link para o leitor: https://abraciclo.com.br/press-release
- Frequência e calendário: mensal; releases observados entre os dias 11 e 15 do mês seguinte (agosto/26 saiu em 24/09). Calendário oficial: não documentado.
- Referência temporal: observado em 20/10/2026: setembro/2026 = 186.758 unidades (acumulado jan a set: 1.645.034).
- Unidade e apresentação: unidades, inteiro.
- Citação sugerida: "Fonte: ABRACICLO, press release de produção de motocicletas (Polo Industrial de Manaus)."
- Cuidados: o release com o dado de moto nem sempre traz o mês no título (em setembro estava num texto sobre revisão de projeções). Os valores vêm de press release, não de tabela de dados; a ABRACICLO tem painel Power BI, mas ele não é utilizável pela rotina. O mês de junho (130.875) foi bem abaixo dos vizinhos na série observada; confira no release antes de comentar variações.

#### 3.12 Fertilizantes
- O que mede: entregas de fertilizantes ao mercado brasileiro (toneladas de produto), mês a mês e por ano.
- Instituição e publicação: ANDA (Associação Nacional para Difusão de Adubos), "Principais Indicadores do Setor de Fertilizantes" (PDF anual) e planilha mensal de indicadores de mercado.
- Link para o leitor: https://anda.org.br/recursos/#pesquisa-setorial
- Frequência e calendário: mensal; recorrência da planilha dia 10, mas a defasagem real é de cerca de 2,5 a 3 meses. Calendário oficial: não documentado.
- Referência temporal: observado em 20/10/2026: julho/2026 (arquivo de 02/10/2026). A rotina gravou novembro/2025 a julho/2026 e criou a coluna de 2026.
- Unidade e apresentação: toneladas de produto, inteiros com separador de milhar.
- Citação sugerida: "Fonte: ANDA, Principais Indicadores do Setor de Fertilizantes (fertilizantes entregues ao mercado)."
- Cuidados: a ANDA revisa meses antigos (por exemplo, agosto/25 e janeiro/25 diferem da fonte atual); a planilha mantém o valor original. Os links dos arquivos mudam todo mês; a página "Recursos" é o ponto estável. O gráfico da aba é ajustado à mão a cada ano.

#### 3.13 Intenção de Consumo das Famílias
- O que mede: Índice de Intenção de Consumo das Famílias (ICF) e seus componentes: emprego atual, renda atual, nível de consumo atual, perspectiva profissional, perspectiva de consumo, acesso ao crédito e momento para duráveis.
- Instituição e publicação: CNC (Confederação Nacional do Comércio de Bens, Serviços e Turismo), Pesquisa de Intenção de Consumo das Famílias (PEIC/ICF), publicada no Portal do Comércio com um arquivo de série histórica.
- Link para o leitor: https://portaldocomercio.org.br (post da pesquisa do mês; o link citado na aba está quebrado e o endereço definitivo por edição é a confirmar)
- Frequência e calendário: mensal; recorrência da planilha dia 25; publicações observadas entre os dias 19 e 25 do próprio mês (exceções: abril/26 saiu em 05/05).
- Referência temporal: dado do mesmo mês da divulgação. Último publicado e gravado: setembro/2026 (ICF 104,5; divulgado em 23/09). Outubro/26 é esperado entre 20 e 25/10 (a confirmar).
- Unidade e apresentação: pontos, escala de 0 a 200 (100 é o limiar), com casas completas.
- Citação sugerida: "Fonte: CNC, Pesquisa de Intenção de Consumo das Famílias (ICF)."
- Cuidados: a CNC revisa o histórico a cada edição (ajuste sazonal reestimado), então números de edições antigas na planilha podem diferir do arquivo atual. O título da aba diz "sem ajuste", mas os dados batem com a série "com ajuste sazonal"; qual vale está em aberto com o responsável pela planilha. Cite sempre a série como "com ajuste sazonal" apenas depois dessa confirmação.

#### 3.14 Índices de Confiança
- O que mede: índices de confiança do consumidor (ICC), da indústria (ICI), do comércio (ICOM), de serviços (ICS), da construção (ICST) e empresarial (ICE); Indicador de Incerteza da Economia (IIE-Br); e nível de utilização da capacidade instalada (NUCI) da indústria e da construção.
- Instituição e publicação: FGV IBRE (Instituto Brasileiro de Economia), por press releases em PDF de cada sondagem. A série histórica completa está atrás de login (FGV Dados é produto licenciado).
- Link para o leitor: https://portalibre.fgv.br/press-releases (calendário de divulgação: https://portalibre.fgv.br/calendario-de-divulgacao)
- Frequência e calendário: mensal; recorrência da planilha dia 1. Em setembro/26: ICC em 24/09, ICST em 25/09, ICI em 28/09, ICS e ICOM em 29/09, IIE-Br em 30/09, ICE em 01/10. Outubro/26 é esperado entre ~24/10 e ~01/11.
- Referência temporal: o índice do mês é divulgado nos últimos dias do próprio mês. Último gravado: setembro/2026.
- Unidade e apresentação: pontos com 1 casa (série dessazonalizada, primeira coluna do release); NUCI em %.
- Citação sugerida: "Fonte: FGV IBRE, Sondagens e Indicadores de Confiança (séries dessazonalizadas)."
- Cuidados: a FGV revisa valores passados quando reestima o ajuste sazonal. A coluna do ICE (empresarial) mistura série dessazonalizada e original em meses antigos (pergunta aberta). O NUCI da construção só aparece no texto do release e sua origem na planilha não foi identificada; o NUCI da indústria está parado desde mai/26 na planilha e tem preenchimento manual. Os gráficos da aba não incluem a coluna do mês mais recente. Há dúvida aberta sobre a licença de uso automatizado dos dados da FGV; até a resposta, o procedimento segue com os PDFs públicos.

#### 3.15 Safra Brasil - Área
- O que mede: área plantada de grãos (soja, milho 1ª/2ª/3ª safra, arroz, feijão, algodão, amendoim, girassol, gergelim, mamona, sorgo e culturas de inverno como trigo, cevada, aveia, canola, centeio e triticale), a cada levantamento da CONAB. A aba também traz um bloco de cana-de-açúcar por região e UF.
- Instituição e publicação: CONAB (Companhia Nacional de Abastecimento), Boletim da Safra de Grãos (planilha "previsão de safra por produto", aba Área) e Boletim da Safra de Cana-de-Açúcar.
- Links para o leitor: https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/safra-de-graos/boletim-da-safra-de-graos/boletim-da-safra-de-graos (grãos) e https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias/safras/safra-de-cana-de-acucar/arquivos-boletins/boletim-da-safra-de-cana-de-acucar (cana)
- Frequência e calendário: grãos: 12 levantamentos por safra, o 1º em outubro e o 12º em setembro; publicação por volta do dia 9 a 15 do mês (o 1º levantamento 26/27 saiu em ~15/10/2026). Recorrência da planilha: dia 10. Cana: 4 levantamentos por safra (abril, agosto, novembro e abril do ano seguinte); em abril saem dois arquivos.
- Referência temporal: o levantamento tem o mesmo mês da publicação. Último gravado: 1º levantamento da safra 2026/27 (outubro/2026). Na cana, o último publicado é o 2º levantamento 2026/27 (agosto/2026); o 3º é esperado em novembro/2026.
- Unidade e apresentação: mil hectares. As colunas são levantamentos sucessivos de uma safra; a planilha guarda a coluna "mês atual" de cada levantamento. A safra é identificada como "25/26", "26/27" etc.
- Citação sugerida: "Fonte: CONAB, Acompanhamento da Safra Brasileira de Grãos, [N]º levantamento, safra [AAAA/AA]." Para cana: "Fonte: CONAB, Acompanhamento da Safra Brasileira de Cana-de-Açúcar, [N]º levantamento, safra [AAAA/AA]."
- Cuidados: a CONAB revisa os números de levantamentos anteriores, por isso diferenças em valores já lançados são revisões e não erro (decisão do projeto: não corrigir). Os números são estimativas, não resultados finais, até a safra fechar. No 1º levantamento de uma safra nova, a comparação "mês anterior" não existe e a safra anterior vem revisada. As fórmulas de variação do bloco novo (26/27) ainda dependem de regra a definir; a regra da cana é: último levantamento da safra atual dividido pelo 4º levantamento da safra anterior, menos 1. A cana (blocos de 4 levantamentos por safra) está pronta, mas aguarda teste no Excel. Os links escritos na própria aba de cana estão desatualizados.

#### 3.16 Safra Brasil - Produção
- O que mede: produção de grãos (mesmas culturas da aba de área; algodão em caroço e em pluma separados) e de culturas de inverno, a cada levantamento da CONAB, mais o bloco de cana-de-açúcar por região e UF.
- Instituição e publicação: CONAB, Boletim da Safra de Grãos (planilha "previsão de safra por produto", aba Produção) e Boletim da Safra de Cana-de-Açúcar.
- Links para o leitor: os mesmos da seção 3.15.
- Frequência e calendário: iguais aos da seção 3.15.
- Referência temporal: iguais aos da seção 3.15. Último gravado: 1º levantamento da safra 2026/27 (outubro/2026).
- Unidade e apresentação: mil toneladas.
- Citação sugerida: "Fonte: CONAB, Acompanhamento da Safra Brasileira de Grãos, [N]º levantamento, safra [AAAA/AA]." Para cana: igual à da seção 3.15.
- Cuidados: valem os mesmos da seção 3.15. Em particular: o total "BRASIL" da produção exclui a pluma de algodão (para não duplicar); o bloco de inverno de produção está parcialmente desalinhado em levantamentos antigos (mantido como está); as fórmulas de variação (U73:U77 da aba) comparam hoje com a safra 24/25 e a regra de "mesmo mês do ano anterior" está em aberto; nos rótulos antigos da cana, as datas parecem defasadas em um ano (a planilha foi reorganizada pelo responsável em 23/10/2026).

#### 3.17 Socioeconômico
- O que mede: painel comparativo de 7 países (Colômbia, Peru, Chile, Brasil, Argentina, Estados Unidos e França) com PIB per capita (PPP), índice de Gini e taxa de pobreza.
- Instituição e base: Banco Mundial. PIB per capita: World Development Indicators (WDI), indicador NY.GDP.PCAP.PP.CD (PIB per capita, PPP, US$ correntes internacionais). Gini e pobreza: Poverty and Inequality Platform (PIP), linha de pobreza de US$ 2,15 por dia (PPP de 2017).
- Links para o leitor: https://pip.worldbank.org/poverty-calculator (PIP); página pública do WDI: não documentada (a base é consultada pela API https://api.worldbank.org)
- Frequência e calendário: anual; recorrência da planilha dia 10. O PIP tem versões em março e setembro (última: 22/09/2026); o PIB per capita sai de julho a outubro para o ano anterior.
- Referência temporal: ano de referência, que varia por país e indicador. Em 20/10/2026: PIB per capita de 2025 para todos os 7 países; Gini e pobreza de 2024 (França: 2023). Atraso de 1,5 a 2 anos para Gini e pobreza; o Chile só tem pesquisa em anos pares.
- Unidade e apresentação: PIB per capita em mil US$ (valor do WDI dividido por 1.000), 2 casas; Gini em escala de 0 a 100, 2 casas; pobreza em % da população, 2 casas.
- Citação sugerida: "Fonte: Banco Mundial, World Development Indicators (PIB per capita, PPP) e Poverty and Inequality Platform (Gini e pobreza a US$ 2,15/dia, PPP 2017); ano de referência indicado por país."
- Cuidados: sempre informar o ano de cada dado, pois os países têm anos diferentes. A linha de pobreza de US$ 2,15 (PPP 2017) é a que a planilha usa; o indicador de pobreza padrão do WDI hoje é US$ 3,00 (PPP 2021) e não é comparável. A Argentina não tem dado nacional no PIP, então a planilha usa o dado urbano (cite como "dado urbano"). Os valores históricos da planilha misturavam anos e versões diferentes; esta aba, diferentemente das demais, sobrescreve o valor existente quando o dado novo difere. A rotina está pronta mas aguarda o teste no Excel.

### Indicadores quase prontos (2)

#### 3.18 Consumo Combustível (derivados)
- O que mede: volume de vendas de óleo diesel, gasolina C e etanol hidratado no Brasil, e as somas "gasolina + etanol" e "gasolina + etanol base 100" (gasolina + etanol × 0,7, equivalência definida pela planilha).
- Instituição e base: ANP (Agência Nacional do Petróleo, Gás Natural e Biocombustíveis), dados abertos de vendas de derivados de petróleo e biocombustíveis.
- Link para o leitor: https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos (conjunto de vendas de combustíveis)
- Frequência e calendário: mensal; recorrência da planilha dia 1. Dia de publicação pela ANP: não documentado.
- Referência temporal: em 20/10/2026 a ANP ainda não tinha publicado setembro/26; o último mês gravado e disponível era agosto/2026 (diesel 6.161.373 m³). Setembro/26 será gravado quando a ANP publicar.
- Unidade e apresentação: metros cúbicos (m³), inteiros na exibição (a fonte tem casas decimais).
- Citação sugerida: "Fonte: ANP, Vendas de combustíveis derivados de petróleo e etanol (dados abertos); gasolina C e etanol hidratado."
- Cuidados: "base 100" é uma conta da planilha, não um dado da ANP. A ANP revisa números passados. Situação "quase pronto": a gravação dos derivados ainda não foi exercitada em produção; o diesel por segmento já foi.

#### 3.19 Consumo Combustível Segmentado
- O que mede: vendas de óleo diesel por segmento de cliente: consumidor final, posto revendedor e TRR (transportador revendedor retalhista), mais o total geral.
- Instituição e base: ANP, dados abertos de vendas de combustíveis por segmento.
- Link para o leitor: https://www.gov.br/anp/pt-br/centrais-de-conteudo/dados-abertos (conjunto de vendas por segmento)
- Frequência e calendário: mensal; mesma situação da seção 3.18.
- Referência temporal: série a partir de 2019 na planilha. Último gravado: agosto/2026 (consumidor final 1.627.437 m³; posto revendedor 3.624.949 m³; TRR 908.987 m³).
- Unidade e apresentação: m³.
- Citação sugerida: "Fonte: ANP, Vendas de combustíveis por segmento (óleo diesel), dados abertos."
- Cuidados: o total geral da planilha é a soma dos três segmentos. A ANP revisa meses anteriores. Há um ponto técnico aberto sobre uma célula de apoio da aba (usada em gráfico) que ainda precisa ser preenchida à mão.

### Indicadores pendentes (6)

Estas abas não têm rotina de atualização. As informações abaixo vêm do mapeamento da planilha e dos links escritos nas próprias abas; não foram testadas contra a fonte. Antes de citar, confirme o dado diretamente na instituição.

#### 3.20 Safra Área vs Produção
- O que mede: série histórica de área plantada e produção (e participação percentual) de soja, milho e algodão, por safra, desde 2003/04.
- Instituição: CONAB (série histórica das safras); projeção do Ministério da Agricultura e Pecuária (indicado na aba).
- Link para o leitor: https://www.conab.gov.br/info-agro/safras/serie-historica-das-safras (link escrito na aba; endereço antigo, a confirmar)
- Frequência e calendário: semestral segundo o ROADMAP (recorrência dia 15). Sem atualização há cerca de 370 dias em 20/10/2026 (parada em 2024/25).
- Referência temporal: por safra; a última linha (2024/25*) é preliminar. Não existe ainda linha para 2025/26.
- Unidade: mil hectares e mil toneladas; percentuais de variação.
- Citação sugerida: "Fonte: CONAB, Série histórica das safras de grãos." Se usar a projeção: "Ministério da Agricultura e Pecuária (projeção)."
- Cuidados: a aba é derivada das abas Safra Brasil - Área e Produção (fórmulas entre abas), e mistura referências a levantamentos e a safra fechada (a confirmar). O asterisco indica safra em andamento. A aba também contém uma safra rotulada "2023/25", provável erro de digitação. A produção por levantamento da CONAB é revisada ao longo da safra.

#### 3.21 Safra - Evolução
- O que mede: evolução mensal da colheita de soja, exportação e processamento, com saldo "volume não utilizado" e acumulados do ano.
- Instituição: CONAB (colheita e produção), ANEC (exportação, vinda da aba Exportação Soja) e ABIOVE (processamento, link https://abiove.org.br/estatisticas/).
- Link para o leitor: https://abiove.org.br/estatisticas/ (ABIOVE); demais fontes nas seções 3.5, 3.15 e 3.22.
- Frequência e calendário: mensal (recorrência da planilha dia 1). Está parada desde o início de 2025 (completa até jun/2025). Qual tabela da ABIOVE traz o "processamento" mensal: a confirmar.
- Referência temporal: mês de referência; defasagem não documentada.
- Unidade: mil toneladas e percentuais.
- Citação sugerida: "Fonte: CONAB (colheita e produção), ANEC (exportações) e ABIOVE (processamento)."
- Cuidados: quase tudo é fórmula que depende de outras abas (Safra Cultivado x Semeado, Safra Produção e Exportação Soja); só o processamento da ABIOVE é digitado. Se as abas de origem estiverem desatualizadas, esta também estará. Observe a coluna de referência de produção, que aponta para levantamentos diferentes em linhas diferentes (a confirmar).

#### 3.22 Safra Cultivado x Semeado
- O que mede: progresso da semeadura e da colheita (percentual da área) de soja, milho 1ª e 2ª safra, algodão e arroz, medido no primeiro dia de cada mês.
- Instituição: CONAB, Acompanhamento das Lavouras, "Progresso de Safra" (plantio e colheita).
- Link para o leitor: https://www.gov.br/conab/pt-br/atuacao/informacoes-agropecuarias (a página exata de "Progresso de safra" está escrita na aba e deve ser copiada de lá; a confirmar)
- Frequência e calendário: a CONAB publica semanalmente; a aba quer o valor do 1º dia do mês (qual semana vale: a confirmar). Recorrência da planilha: dia 1. Parada em maio/2025.
- Referência temporal: situação do campo no 1º dia do mês.
- Unidade: fração/percentual da área (0% a 100%).
- Citação sugerida: "Fonte: CONAB, Acompanhamento das Lavouras (Progresso de Safra)."
- Cuidados: fora da janela de safra a planilha grava 0, vazio ou "-" de formas mistas; interprete com cuidado. O valor do primeiro dia do mês é uma escolha da planilha, não uma divulgação oficial da CONAB.

#### 3.23 Safra - Preço e Rentabilidade
- O que mede: preços de soja, milho, algodão, etanol hidratado, açúcar e algodão em pluma (base 100 em 2021), preço da soja na B3, custo de produção e margem líquida por praça, e uma série de "tire market" comparada à soja.
- Instituição: várias. CONAB (custos de produção e rentabilidade, https://portaldeinformacoes.conab.gov.br/custos-de-producao-rentabilidade-evolucao.html), B3 (cotação da soja), CEPEA/ESALQ (soja, https://www.cepea.esalq.usp.br/br/indicador/soja.aspx), IMEA (valor ponderado convencional) e Notícias Agrícolas (milho). A origem do "tire market": não documentada.
- Frequência e calendário: mensal na planilha (recorrência dia 1); parada há cerca de 2 anos em alguns blocos. Defasagem: não documentada.
- Referência temporal: por mês; os blocos de custo incluem projeções por fórmula (por exemplo, até "set/25*").
- Unidade: R$, US$, % e índice base 100.
- Citação sugerida: citar a instituição específica de cada série (por exemplo, "Fonte: CEPEA/ESALQ, Indicador da soja Paranaguá" ou "Fonte: CONAB, Custos de produção").
- Cuidados: mistura fontes e metodologias; parte dos valores é projeção por fórmula com o dólar; as datas da coluna de custo têm saltos fora de sequência. Não há rotina de atualização prevista; tratar como material de contexto, não como dado corrente.

#### 3.24 Commodities
- O que mede: preços mensais (último dia útil) de cobre, minério de ferro, prata, petróleo Brent, soja (R$/saca e US$/bushel), milho, algodão, fertilizante (00-18-18) e dólar, com comparativos anuais e valores padronizados.
- Instituição: várias. Business Insider (cobre, prata, Brent), MarketIndex (minério de ferro), CEPEA/ESALQ (soja Paranaguá), Notícias Agrícolas (milho e algodão), CONAB (fertilizante, MT), Index Mundi e outras.
- Links para o leitor: https://markets.businessinsider.com/commodities, https://www.cepea.esalq.usp.br/br/indicador/soja.aspx, https://www.noticiasagricolas.com.br/cotacoes/, https://www.marketindex.com.au/iron-ore, https://www.conab.gov.br/info-agro/precos, https://www.indexmundi.com/pt/pre%E7os-de-mercado/
- Frequência e calendário: mensal (recorrência dia 1). Último mês completo: janeiro/2026; fevereiro/26 está parcial; cobre e minério de ferro foram preenchidos adiante até setembro/26.
- Referência temporal: valor do último dia útil do mês (rótulo da coluna; a regra "fechamento ou média" é a confirmar).
- Unidade: varia por coluna (US$ por tonelada, US$ por barril, R$ por saca, R$ por dólar etc.).
- Citação sugerida: citar a fonte da coluna correspondente, e não a aba como um todo.
- Cuidados: cada coluna tem fonte e metodologia diferentes, e algumas das páginas são de leitura instável. Há datas irregulares em meses recentes. Os valores padronizados e o resumo anual são atualizados à mão. Não há rotina automática prevista.

#### 3.25 TEUS
- O que mede: movimentação de contêineres nos portos brasileiros, em TEU (unidade equivalente a um contêiner de 20 pés), portos públicos e privados somados, com variação mensal.
- Instituição: ANTAQ (Agência Nacional de Transportes Aquaviários), Estatístico Aquaviário.
- Link para o leitor: https://web3.antaq.gov.br/ea/sense/movconteiner.html (painel citado na aba); base de dados para download: https://web3.antaq.gov.br/ea/sense/download.html
- Frequência e calendário: mensal (atualização mensal segundo o inventário de bases da ANTAQ). Defasagem: não medida. Recorrência da planilha: dia 1. A aba parou em março/2025.
- Referência temporal: os atributos de mês e ano usam a data de desatracação da embarcação (documentação oficial do Estatístico Aquaviário 2026).
- Unidade: TEU, com até 2 casas decimais na planilha.
- Citação sugerida: "Fonte: ANTAQ, Estatístico Aquaviário (movimentação de contêineres em TEU)."
- Cuidados: a fonte não foi testada (o endereço da ANTAQ não respondeu nos testes). Não se sabe quais filtros reproduzem o total da planilha (março/25 aparece como 1.214.144 em uma célula e 1.255.857 em outra tabela de apoio). O painel é dinâmico e protegido contra acesso automatizado. A aba foi pulada por decisão do responsável, pois não é certo que ainda seja usada.

## 4. Calendário aproximado do mês

Só entram datas documentadas. A coluna "Base" indica se vem da recorrência da planilha, de observação em 2026 ou da regra da fonte.

| Período do mês | O que costuma sair | Base |
|---|---|---|
| Dia 1 (início) | Referência de recorrência da planilha para ANP (combustível, asfalto), ANEC (soja), FGV (índices de confiança), ANTAQ, preços e algumas abas da CONAB | Recorrência da planilha |
| Início do mês, até cerca do dia 5 | PIB trimestral (março, junho, setembro e dezembro) | Recorrência da planilha (dia 5) e regra da fonte |
| Por volta do dia 8 | OE PL e TC (ANFAVEA) | Recorrência da planilha |
| Dias 9 a 15 | CONAB: levantamento mensal de grãos (por exemplo, 1º lev. 26/27 em ~15/10) | Observado |
| Dia 10 | IPCA (observado por volta do dia 10), fluxo pedagiado (ABCR), fertilizantes (ANDA, referência de planilha; dado real com 2,5 a 3 meses de atraso), Banco Mundial (anual) | Recorrência da planilha e observado |
| Dias 11 a 15 (irregular) | ABRACICLO (bicicletas e motocicletas); em agosto/26 saiu só em 24/09 | Observado |
| Dias 13 a 15 | IPCA (dia 13 na planilha), produção industrial (dia 14), serviços (dia 15) | Recorrência da planilha |
| Dias 19 a 25 | CNC: Intenção de Consumo das Famílias (do próprio mês) | Observado |
| Últimos dias do mês | FGV IBRE: confiança do consumidor (~dia 24), construção (~25), indústria (~28), serviços e comércio (~29); incerteza (~30) e ICE (1º do mês seguinte) | Observado (setembro/26) |
| Semanal | Relatório da ANEC (embarques de soja); Focus do Banco Central (segundas-feiras); Progresso de Safra da CONAB | Regra da fonte |
| Abril, agosto, novembro | CONAB: levantamentos de cana-de-açúcar (3º lev. 26/27 esperado em novembro/2026) | Regra da fonte |
| Março, junho, setembro, dezembro | PIB trimestral do IBGE | Regra da fonte |

Serviços (PMS) e Varejo (PMC) seguem a regra de cerca de 40 a 45 dias após o mês de referência e a data exata no calendário do IBGE é a confirmar. Para ANP (combustíveis e asfalto) e CONAB (progresso de safra), o dia de publicação não está documentado.

## 5. Observações gerais

- Só meses novos entram. A planilha acrescenta o mês seguinte ao último lançado e nunca reescreve meses antigos, mesmo quando a fonte os revisa. Por isso, se a newsletter cita uma série histórica, confirme o número recente (último ou penúltimo mês) diretamente na instituição, pois as fontes IBGE, ANP, ABCR, ANEC, ANFAVEA, ANDA, CNC, FGV e CONAB revisam dados passados. A única exceção é a aba Socioeconômico, que sobrescreve o valor quando o dado novo muda.
- "Atualizado em" mostra o último dado novo gravado. A data da aba (célula "Atualizado em") só muda quando houve gravação de dado novo; "sem novidade" não altera a data. Portanto, uma data antiga pode significar apenas que a fonte ainda não publicou. A posição da célula varia de aba para aba.
- O que ainda não foi validado:
  - Testados na rede da fonte real, mas ainda não confirmados no Excel: SOCIOECONOMICO e cana-de-açúcar (nas abas Safra Brasil - Área e Produção).
  - Parcialmente testado: Consumo Combustível (diesel por segmento gravou; derivados aguardam a ANP publicar setembro/26).
  - Não testado contra a fonte: TEUS (acesso à ANTAQ falhou); abas pendentes (3.20 a 3.25) mapeadas apenas pelo layout da planilha.
  - Ainda sem teste de repetição: a leitura de ABRACICLO e FGV depende da redação e do layout de press releases e PDFs, que mudam; o resultado dos meses de outubro/26 em diante só será conhecido na próxima rodada.
  - A virada de ano (criação das linhas de 2027) será testada em novembro de 2026.
- Respostas pendentes do responsável pela planilha que afetam a leitura editorial: série com ou sem ajuste sazonal no ICF; ICE dessazonalizado ou original; regra das variações da Safra; significado dos campos Focus; origem do NUCI da construção; se as abas Abimaq Colheitadeiras, RentabilidadeSoja e Soja American x Soja Brasileira (sem fonte registrada, fora deste guia) ainda são usadas.
- Fora do escopo desta newsletter e deste guia: Feriados, COVID, Apple Mobility, Fontes informações diversas, Indicadores IHS (assinatura), B2B ON e B2C - DR (derivada da IHS), Abimaq Colheitadeiras, RentabilidadeSoja e Soja American x Soja Brasileira.

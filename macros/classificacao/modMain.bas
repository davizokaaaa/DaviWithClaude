Attribute VB_Name = "modMain"
Option Explicit

' ==========================================================================
' MODULO: modMain
' Sub principal ClassificarTudo — orquestra a leitura das colunas de
' entrada, o carregamento da Tabela de Referência (modReferencia) e a
' aplicação das extrações/regras (modMarca, modDimensao,
' modClassificacaoRegras, modDicionarios) linha a linha, gravando nas
' colunas de saída.
'
' Depende dos demais módulos deste projeto:
'   modConfig, modPlanilha, modDicionarios, modReferencia,
'   modMarca, modDimensao, modClassificacaoRegras
'
' Colunas de ENTRADA (precisam já existir na planilha, vêm de fora):
'   - DESCRIÇÃODA MERCADORIA
'   - PROVÁVEL ADQUIRENTE (nome configurável em modConfig.COL_ADQUIRENTE_NOME)
'
' Colunas de SAÍDA (a macro cria sozinha se não existirem, nesta ordem
' quando precisar criar mais de uma): LP, TIPO PRODUTO, MARCA, GAMA, ANIP,
' RT/OE, DIMENSÃO (ou GEOBOX), ARO
'
' Ver regras de extração detalhadas nos comentários de cada módulo
' correspondente (modMarca, modDimensao, modClassificacaoRegras,
' modReferencia).
'
' PREMISSAS A CONFIRMAR:
'   1) RT/OE usa a coluna "PROVÁVEL ADQUIRENTE" como nome do comprador.
'      Se for outra coluna, troque modConfig.COL_ADQUIRENTE_NOME.
'   2) O arquivo de referência se chama "Tabela_Referencia.xlsx" e fica no
'      caminho definido em modConfig.REF_FILE_PATH. Dentro dele:
'        - aba "Referencia" (obrigatória): colunas GEOBOX, GAMA, MARCA, LP, SEGMENTO
'        - aba "MarcasExtras" (opcional): coluna MARCA — marcas extras somadas
'          à busca, sem precisar mexer no código
'        - aba "ExcecoesMarca" (opcional): colunas PADRAO_ENCONTRADO_NA_DESCRICAO
'          e MARCA_CORRETA — checadas antes de tudo na extração de MARCA
'        - aba "ExcecoesGama" (opcional): mesmo modelo da "ExcecoesMarca",
'          mas pra abreviações de GAMA (ex: "PTNZ" -> "POTENZA")
' ==========================================================================

Sub ClassificarTudo()

    Dim ws As Worksheet
    Dim lastRow As Long, i As Long
    Dim colDescricao As Long, colAdquirente As Long
    Dim colRtOe As Long, colTipoProduto As Long, colAro As Long, colAnip As Long
    Dim colLp As Long, colMarca As Long, colDimensao As Long, colGama As Long

    Set ws = ActiveSheet

    ' --- Colunas de ENTRADA: precisam existir (a macro não pode inventar) ---
    colDescricao = LocalizarColuna(ws, "DESCRIÇÃODA MERCADORIA")
    colAdquirente = LocalizarColuna(ws, COL_ADQUIRENTE_NOME)

    If colDescricao = 0 Or colAdquirente = 0 Then

        Dim msgFaltantes As String
        msgFaltantes = "Não encontrei a(s) seguinte(s) coluna(s) de ENTRADA no cabeçalho (linha 1):" & vbCrLf & vbCrLf
        If colDescricao = 0 Then msgFaltantes = msgFaltantes & "- DESCRIÇÃODA MERCADORIA" & vbCrLf
        If colAdquirente = 0 Then msgFaltantes = msgFaltantes & "- " & COL_ADQUIRENTE_NOME & vbCrLf

        msgFaltantes = msgFaltantes & vbCrLf & "Cabeçalhos encontrados na linha 1:" & vbCrLf
        Dim lastColDiag As Long, cDiag As Long
        lastColDiag = ws.Cells(1, ws.Columns.Count).End(xlToLeft).Column
        For cDiag = 1 To lastColDiag
            msgFaltantes = msgFaltantes & "[" & cDiag & "] """ & CStr(ws.Cells(1, cDiag).Value) & """" & vbCrLf
        Next cDiag

        MsgBox msgFaltantes, vbCritical
        Exit Sub
    End If

    ' --- Colunas de SAÍDA: a macro cria sozinha se ainda não existirem.        ---
    ' --- Ordem de criação (quando faltar mais de uma): LP, TIPO PRODUTO,      ---
    ' --- MARCA, GAMA, ANIP, RT/OE, DIMENSÃO, ARO — nessa sequência.           ---
    colLp = LocalizarOuCriarColuna(ws, "LP")
    colTipoProduto = LocalizarOuCriarColuna(ws, "TIPO PRODUTO")
    colMarca = LocalizarOuCriarColuna(ws, "MARCA")
    colGama = LocalizarOuCriarColuna(ws, "GAMA")
    colAnip = LocalizarOuCriarColuna(ws, "ANIP")
    colRtOe = LocalizarOuCriarColuna(ws, "RT/OE")
    colDimensao = LocalizarColunaAlternativasOuCriar(ws, Array("DIMENSÃO", "GEOBOX"), "DIMENSÃO")
    colAro = LocalizarOuCriarColuna(ws, "ARO")

    ' --- Carrega dicionários auxiliares ---
    Dim dicMontadoras As Object, dicAnip As Object, dicExcecoesMarca As Object
    Set dicMontadoras = CarregarMontadoras()
    Set dicAnip = CarregarMarcasAnip()

    Dim dicPadroesLegado As Object
    Set dicPadroesLegado = CarregarPadroesGeoboxLegado()

    Dim dicSegPorGeobox As Object, dicLpPorGeobox As Object
    Dim arrMarcas() As String
    Dim dicGeoboxPorMarca As Object, dicGeoboxGlobalUnicos As Object
    Dim dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, dicExcecoesGama As Object
    Dim dicMarcaPorGama As Object
    Dim diagnosticoRef As String

    ' --- Pergunta se a base é de BR/MIN (Beyond Road/Mineração). Essas LPs   ---
    ' --- têm GEOBOX e GAMA próprios, sem interseção com as demais LPs — se  ---
    ' --- for BR/MIN, a Tabela de Referência é filtrada só para essas duas   ---
    ' --- LPs, pra não carregar o resto da Referência à toa nessa base.      ---
    Dim somenteMinBr As Boolean
    somenteMinBr = (MsgBox("Esta base é de BR/MIN (Beyond Road / Mineração)?" & vbCrLf & vbCrLf & _
                           "Se SIM, a Tabela de Referência será filtrada para considerar apenas as LP ""MIN"" e ""BR"".", _
                           vbYesNo + vbQuestion, "Tipo de base") = vbYes)

    If Not CarregarTabelaReferencia(dicSegPorGeobox, dicLpPorGeobox, arrMarcas, _
                                     dicGeoboxPorMarca, dicGeoboxGlobalUnicos, dicExcecoesMarca, _
                                     dicGamasPorMarca, dicGamaGlobalUnicos, dicMarcaPorGama, dicExcecoesGama, _
                                     somenteMinBr, diagnosticoRef) Then
        MsgBox "Não foi possível abrir a Tabela de Referência em:" & vbCrLf & REF_FILE_PATH, vbCritical
        Exit Sub
    End If

    If MOSTRAR_DIAGNOSTICO_REFERENCIA Then
        MsgBox "DIAGNÓSTICO DA TABELA DE REFERÊNCIA:" & vbCrLf & vbCrLf & diagnosticoRef, vbInformation
    End If

    lastRow = UltimaLinhaEntreColunas(ws, Array(colDescricao, colAdquirente))

    If lastRow < 2 Then
        MsgBox "Nenhuma linha de dados encontrada abaixo do cabeçalho." & vbCrLf & vbCrLf & _
               "Planilha ativa: """ & ws.Name & """" & vbCrLf & _
               "Última linha com dado em DESCRIÇÃODA MERCADORIA (coluna " & colDescricao & "): " & _
               ws.Cells(ws.Rows.Count, colDescricao).End(xlUp).Row & vbCrLf & vbCrLf & _
               "Confira se a aba ativa é a correta e se essa coluna tem dados.", vbExclamation
        Exit Sub
    End If

    Dim marca As String, dimensaoBruta As String, dimensaoFinal As String
    Dim descricao As String, adquirente As String
    Dim aro As String, segmento As String, rtOe As String, anip As String

    Dim qtdSegmentoPreenchido As Long, qtdSegmentoVazio As Long
    Dim qtdDimensaoVazia As Long
    Dim amostraVazios As String
    qtdSegmentoPreenchido = 0
    qtdSegmentoVazio = 0
    qtdDimensaoVazia = 0
    amostraVazios = ""

    For i = 2 To lastRow

        descricao = UCase(Trim(CStr(ws.Cells(i, colDescricao).Value)))
        adquirente = UCase(Trim(CStr(ws.Cells(i, colAdquirente).Value)))

        ' --- MARCA: extraída da descrição (nome conhecido na Tabela de Referência) ---
        marca = ExtrairMarca(descricao, arrMarcas, dicExcecoesMarca)

        ' --- GAMA: extraída da descrição (exceções/abreviações primeiro,   ---
        ' --- depois nome completo conhecido na Tabela de Referência). Se   ---
        ' --- a MARCA não foi encontrada, ExtrairGama também tenta          ---
        ' --- descobrir a marca a partir da gama achada (gama é tratada    ---
        ' --- como praticamente exclusiva de uma marca) — por isso "marca" ---
        ' --- é passada ByRef e pode voltar preenchida daqui.              ---
        Dim gamaLinha As String
        gamaLinha = ExtrairGama(descricao, marca, dicGamasPorMarca, dicGamaGlobalUnicos, dicMarcaPorGama, dicExcecoesGama)
        ws.Cells(i, colGama).Value = gamaLinha
        ws.Cells(i, colMarca).Value = marca

        ' --- DIMENSÃO: extraída da descrição (medida conhecida na Tabela de Referência) ---
        dimensaoBruta = ExtrairDimensao(descricao, marca, dicGeoboxPorMarca, dicGeoboxGlobalUnicos, dicPadroesLegado)

        ' --- DIMENSÃO: substitui todo e qualquer hífen por "R" antes de gravar ---
        dimensaoFinal = Replace(dimensaoBruta, "-", "R")
        ws.Cells(i, colDimensao).Value = dimensaoFinal

        ' --- RT/OE ---
        rtOe = "RT"
        Dim chaveM As Variant
        For Each chaveM In dicMontadoras.Keys
            If InStr(1, adquirente, chaveM, vbTextCompare) > 0 Then
                rtOe = "OE"
                Exit For
            End If
        Next chaveM
        ws.Cells(i, colRtOe).Value = rtOe

        ' --- ARO (a partir da DIMENSÃO já com hífen convertido) ---
        aro = ExtrairAro(dimensaoFinal)
        ws.Cells(i, colAro).Value = aro

        ' --- ANIP ---
        anip = "Importado"
        If dicAnip.Exists(marca) Then anip = "ANIP"
        ws.Cells(i, colAnip).Value = anip

        ' --- TIPO PRODUTO e LP: busca direto pela DIMENSÃO na Tabela de     ---
        ' --- Referência (aba "Referencia"). SEGMENTO e LP são votações     ---
        ' --- independentes (maioria dos valores não vazios daquele         ---
        ' --- GEOBOX); se achou SEGMENTO, o LP é deduzido dele (TC/PL/BR).  ---
        ' --- Usa a DIMENSÃO BRUTA (antes do hífen->R) porque é essa forma  ---
        ' --- que bate exatamente com o GEOBOX gravado na Tabela.           ---
        Dim lp As String
        ObterSegmentoELpPorDimensao dimensaoBruta, dicSegPorGeobox, dicLpPorGeobox, segmento, lp
        ws.Cells(i, colTipoProduto).Value = segmento

        ' --- Diagnóstico: conta preenchidos/vazios e guarda uma amostra ---
        If Len(dimensaoBruta) = 0 Then
            qtdDimensaoVazia = qtdDimensaoVazia + 1
        End If
        If Len(segmento) > 0 Then
            qtdSegmentoPreenchido = qtdSegmentoPreenchido + 1
        Else
            qtdSegmentoVazio = qtdSegmentoVazio + 1
            Dim existeNaTabela As Boolean
            existeNaTabela = dicSegPorGeobox.Exists(dimensaoBruta)
            amostraVazios = amostraVazios & "Linha " & i & ": DIMENSÃO=""" & dimensaoBruta & _
                            """ (existe no mapa de SEGMENTO? " & IIf(existeNaTabela, "SIM", "NÃO")
            If dicLpPorGeobox.Exists(dimensaoBruta) Then
                amostraVazios = amostraVazios & " | LP votado: """ & CStr(dicLpPorGeobox(dimensaoBruta)) & """"
            End If
            amostraVazios = amostraVazios & ")" & vbCrLf
        End If

        ' --- LP: se a Tabela não trouxe LP pra essa dimensão, cai no      ---
        ' --- fallback de deduzir pelo SEGMENTO; por fim, ARO terminado    ---
        ' --- em ".5" sempre força "PL", independente do que veio antes.   ---
        If Len(lp) = 0 Then lp = DeduzirLp(segmento)
        If AroTerminaEmMeio(aro) Then lp = "PL"
        ws.Cells(i, colLp).Value = lp

    Next i

    ' --- Joga a lista completa de linhas vazias numa aba auxiliar, mais    ---
    ' --- fácil de ler/copiar do que uma caixa de mensagem gigante.        ---
    Dim wsDiagVazios As Worksheet
    On Error Resume Next
    Application.DisplayAlerts = False
    ThisWorkbook.Sheets("Diagnostico_Vazios").Delete
    Application.DisplayAlerts = True
    On Error GoTo 0
    Set wsDiagVazios = ThisWorkbook.Sheets.Add(After:=ThisWorkbook.Sheets(ThisWorkbook.Sheets.Count))
    wsDiagVazios.Name = "Diagnostico_Vazios"
    wsDiagVazios.Cells(1, 1).Value = "LINHA"
    wsDiagVazios.Cells(1, 2).Value = "DIMENSAO"
    wsDiagVazios.Cells(1, 3).Value = "EXISTE_NA_TABELA"
    wsDiagVazios.Cells(1, 4).Value = "SEGMENTO_GUARDADO"
    wsDiagVazios.Cells(1, 5).Value = "LP_GUARDADO"

    Dim linhaDiag As Long
    linhaDiag = 2
    Dim linhaTexto As Variant
    For Each linhaTexto In Split(amostraVazios, vbCrLf)
        If Len(Trim(CStr(linhaTexto))) > 0 Then
            wsDiagVazios.Cells(linhaDiag, 1).Value = linhaTexto
            linhaDiag = linhaDiag + 1
        End If
    Next linhaTexto

    MsgBox "Classificação concluída com sucesso!" & vbCrLf & _
           "Linhas processadas: " & (lastRow - 1) & vbCrLf & vbCrLf & _
           "--- DIAGNÓSTICO TIPO PRODUTO ---" & vbCrLf & _
           "GEOBOX únicos com SEGMENTO mapeado: " & dicSegPorGeobox.Count & vbCrLf & _
           "GEOBOX únicos com LP mapeado: " & dicLpPorGeobox.Count & vbCrLf & _
           "Linhas com DIMENSÃO vazia (não deu pra nem tentar buscar): " & qtdDimensaoVazia & vbCrLf & _
           "Linhas com TIPO PRODUTO preenchido: " & qtdSegmentoPreenchido & vbCrLf & _
           "Linhas com TIPO PRODUTO vazio: " & qtdSegmentoVazio & vbCrLf & vbCrLf & _
           "Lista completa das linhas vazias foi para a aba ""Diagnostico_Vazios"".", vbInformation

End Sub

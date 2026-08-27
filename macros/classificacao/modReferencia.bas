Attribute VB_Name = "modReferencia"
Option Explicit

' ==========================================================================
' MODULO: modReferencia
' Carrega a Tabela de Referência externa (arquivo REF_FILE_PATH, ver
' modConfig) com as abas "Referencia", "MarcasExtras"/"MarcasExtra" e
' "ExcecoesMarca", e monta os dicionários usados nas demais etapas.
' ==========================================================================

' ==========================================================================
' Carrega a Tabela de Referência (arquivo externo) e monta:
'   dicSegPorGeobox      : chave GEOBOX -> SEGMENTO mais frequente entre os
'                          valores NÃO VAZIOS daquele GEOBOX na aba
'                          "Referencia" (linhas com Segmento vazio não
'                          entram na votação)
'   dicLpPorGeobox       : chave GEOBOX -> LP mais frequente entre os
'                          valores NÃO VAZIOS daquele GEOBOX — votação
'                          totalmente independente da de Segmento
'   arrMarcas()          : array de marcas únicas, ordenado da mais longa p/ mais curta
'   dicGeoboxPorMarca    : chave MARCA -> Collection de GEOBOX únicos daquela marca
'   dicGeoboxGlobalUnicos: chave GEOBOX -> True (todos os geobox únicos, p/ busca ampla)
'   dicGamasPorMarca     : chave MARCA -> Collection de GAMA únicas daquela marca
'   dicGamaGlobalUnicos  : chave GAMA -> True (todas as gamas únicas, p/ busca ampla)
'   dicMarcaPorGama      : chave GAMA -> MARCA dona daquela gama (1ª encontrada na
'                          Referência) — usado pra "descobrir" a marca a partir da
'                          gama quando a marca não foi lida na descrição
'   dicExcecoesGama      : chave PADRÃO ABREVIADO -> GAMA correta (aba "ExcecoesGama",
'                          ex: "PTNZ" -> "POTENZA"), checada antes da busca normal
'
' somenteMinBr: quando True, ignora (não entra em nenhum dicionário) qualquer
' linha da aba "Referencia" cuja LP não seja "MIN" ou "BR". Usado pra bases de
' Beyond Road (MIN/BR têm GEOBOX e GAMA próprios, sem interseção com as
' demais LPs) — evita carregar o resto da Referência à toa nesse caso.
' ==========================================================================
Function CarregarTabelaReferencia(ByRef dicSegPorGeobox As Object, ByRef dicLpPorGeobox As Object, _
                                   ByRef arrMarcas() As String, ByRef dicGeoboxPorMarca As Object, _
                                   ByRef dicGeoboxGlobalUnicos As Object, ByRef dicExcecoesMarca As Object, _
                                   ByRef dicGamasPorMarca As Object, ByRef dicGamaGlobalUnicos As Object, _
                                   ByRef dicMarcaPorGama As Object, ByRef dicExcecoesGama As Object, _
                                   ByVal somenteMinBr As Boolean, ByRef diagnostico As String) As Boolean

    On Error GoTo ErroAbrir

    Dim wbRef As Workbook
    Dim wasOpen As Boolean
    Dim wbName As String
    wbName = Mid(REF_FILE_PATH, InStrRev(REF_FILE_PATH, "\") + 1)

    ' Reaproveita se já estiver aberto, senão abre
    On Error Resume Next
    Set wbRef = Workbooks(wbName)
    On Error GoTo ErroAbrir
    If wbRef Is Nothing Then
        Set wbRef = Workbooks.Open(REF_FILE_PATH, ReadOnly:=True)
        wasOpen = False
    Else
        wasOpen = True
    End If

    diagnostico = "Arquivo usado: " & wbRef.FullName & vbCrLf
    diagnostico = diagnostico & "Já estava aberto antes de rodar a macro? " & IIf(wasOpen, "SIM (reaproveitou a instância já aberta)", "Não (abriu agora)") & vbCrLf
    diagnostico = diagnostico & "Abas encontradas no arquivo: "
    Dim wsDiag As Worksheet
    For Each wsDiag In wbRef.Sheets
        diagnostico = diagnostico & """" & wsDiag.Name & """; "
    Next wsDiag
    diagnostico = diagnostico & vbCrLf

    Dim wsRef As Worksheet
    Set wsRef = wbRef.Sheets("Referencia")

    Set dicGeoboxPorMarca = CreateObject("Scripting.Dictionary")
    Set dicGeoboxGlobalUnicos = CreateObject("Scripting.Dictionary")
    Set dicGamasPorMarca = CreateObject("Scripting.Dictionary")
    Set dicGamaGlobalUnicos = CreateObject("Scripting.Dictionary")
    Set dicMarcaPorGama = CreateObject("Scripting.Dictionary")

    ' dicVotosSegPorGeo / dicVotosLpPorGeo: chave GEOBOX -> Dictionary(valor -> contagem).
    ' Votações independentes: uma conta SEGMENTO, a outra conta LP, cada
    ' uma ignorando linhas onde o próprio valor está vazio.
    Dim dicVotosSegPorGeo As Object, dicVotosLpPorGeo As Object
    Set dicVotosSegPorGeo = CreateObject("Scripting.Dictionary")
    Set dicVotosLpPorGeo = CreateObject("Scripting.Dictionary")

    Dim dicMarcasUnicas As Object
    Set dicMarcasUnicas = CreateObject("Scripting.Dictionary")

    ' Usa a maior "última linha com dado" entre as 5 colunas (Geobox, Marca,
    ' Gama, LP, Segmento) em vez de só a coluna A. Uma linha só com Marca
    ' preenchida (sem Geobox) precisa ser lida do mesmo jeito — se olhássemos
    ' só a coluna A, o laço pararia antes de chegar nela.
    Dim lastRowRef As Long, i As Long
    lastRowRef = 1
    Dim colRef As Long, ultimaLinhaColRef As Long
    For colRef = 1 To 5
        ultimaLinhaColRef = wsRef.Cells(wsRef.Rows.Count, colRef).End(xlUp).Row
        If ultimaLinhaColRef > lastRowRef Then lastRowRef = ultimaLinhaColRef
    Next colRef

    Dim geo As String, gama As String, marcaRef As String, lp As String, seg As String
    Dim qtdLinhasIgnoradasMinBr As Long
    qtdLinhasIgnoradasMinBr = 0

    ' --- Lê as 5 colunas de uma vez só num array em memória. Evita milhares de ---
    ' --- chamadas COM individuais (wsRef.Cells) numa base grande — cada uma é ---
    ' --- uma exposição a queda de conexão (ex: sync do OneDrive/SharePoint no ---
    ' --- meio da leitura, causando erro -2147417848 "_Default do Range falhou"). ---
    Dim arrRef As Variant
    arrRef = wsRef.Range(wsRef.Cells(2, 1), wsRef.Cells(lastRowRef, 5)).Value

    For i = 2 To lastRowRef
        geo = UCase(Trim(CStr(arrRef(i - 1, 1))))             ' GEOBOX
        geo = NormalizarFormatacaoBasica(geo)                 ' mesma normalização usada na busca
        marcaRef = UCase(Trim(CStr(arrRef(i - 1, 2))))        ' MARCA
        gama = UCase(Trim(CStr(arrRef(i - 1, 3))))            ' GAMA (não usada na busca de segmento/LP)
        lp = UCase(Trim(CStr(arrRef(i - 1, 4))))              ' LP
        seg = UCase(Trim(CStr(arrRef(i - 1, 5))))             ' SEGMENTO

        ' --- Base BR/MIN: ignora qualquer linha que não seja MIN ou BR ---
        If somenteMinBr Then
            If lp <> "MIN" And lp <> "BR" Then
                qtdLinhasIgnoradasMinBr = qtdLinhasIgnoradasMinBr + 1
                GoTo ProximaLinhaRef
            End If
        End If

        ' --- Vota SEGMENTO e LP separadamente para esse GEOBOX, cada um só ---
        ' --- quando o próprio valor não está vazio (linha em branco numa  ---
        ' --- delas não conta como voto nem "suja" a outra votação).       ---
        Dim subVotos As Object

        If Len(geo) > 0 And Len(seg) > 0 Then
            If Not dicVotosSegPorGeo.Exists(geo) Then
                dicVotosSegPorGeo.Add geo, CreateObject("Scripting.Dictionary")
            End If
            Set subVotos = dicVotosSegPorGeo(geo)
            If subVotos.Exists(seg) Then
                subVotos(seg) = subVotos(seg) + 1
            Else
                subVotos.Add seg, 1
            End If
        End If

        If Len(geo) > 0 And Len(lp) > 0 Then
            If Not dicVotosLpPorGeo.Exists(geo) Then
                dicVotosLpPorGeo.Add geo, CreateObject("Scripting.Dictionary")
            End If
            Set subVotos = dicVotosLpPorGeo(geo)
            If subVotos.Exists(lp) Then
                subVotos(lp) = subVotos(lp) + 1
            Else
                subVotos.Add lp, 1
            End If
        End If

        If Len(marcaRef) > 0 Then
            If Not dicMarcasUnicas.Exists(marcaRef) Then dicMarcasUnicas.Add marcaRef, True

            If Not dicGeoboxPorMarca.Exists(marcaRef) Then
                dicGeoboxPorMarca.Add marcaRef, New Collection
            End If
            Dim jaExisteGeo As Boolean, geoExistente As Variant
            jaExisteGeo = False
            For Each geoExistente In dicGeoboxPorMarca(marcaRef)
                If CStr(geoExistente) = geo Then jaExisteGeo = True: Exit For
            Next geoExistente
            If Not jaExisteGeo And Len(geo) > 0 Then dicGeoboxPorMarca(marcaRef).Add geo

            If Not dicGamasPorMarca.Exists(marcaRef) Then
                dicGamasPorMarca.Add marcaRef, New Collection
            End If
            Dim jaExisteGama As Boolean, gamaExistente As Variant
            jaExisteGama = False
            For Each gamaExistente In dicGamasPorMarca(marcaRef)
                If CStr(gamaExistente) = gama Then jaExisteGama = True: Exit For
            Next gamaExistente
            If Not jaExisteGama And Len(gama) > 0 Then dicGamasPorMarca(marcaRef).Add gama
        End If

        If Len(geo) > 0 Then
            If Not dicGeoboxGlobalUnicos.Exists(geo) Then dicGeoboxGlobalUnicos.Add geo, True
        End If

        If Len(gama) > 0 Then
            If Not dicGamaGlobalUnicos.Exists(gama) Then dicGamaGlobalUnicos.Add gama, True

            ' Gama é tratada como praticamente exclusiva de uma marca — a
            ' primeira marca encontrada pra essa gama na Referência "ganha"
            ' o dicionário reverso (ignora linhas com marca vazia).
            If Len(marcaRef) > 0 And Not dicMarcaPorGama.Exists(gama) Then
                dicMarcaPorGama.Add gama, marcaRef
            End If
        End If

ProximaLinhaRef:
    Next i

    ' --- Monta dicSegPorGeobox e dicLpPorGeobox: para cada GEOBOX, fica com ---
    ' --- o valor NÃO VAZIO mais votado (maioria) em cada votação, cada uma ---
    ' --- totalmente independente da outra. Em empate, fica com o primeiro  ---
    ' --- encontrado (ordem de leitura da aba "Referencia").                ---
    Set dicSegPorGeobox = MontarDicMaioriaPorGeobox(dicVotosSegPorGeo)
    Set dicLpPorGeobox = MontarDicMaioriaPorGeobox(dicVotosLpPorGeo)

    diagnostico = diagnostico & "Última linha lida na aba ""Referencia"": " & lastRowRef & vbCrLf
    diagnostico = diagnostico & "Modo BR/MIN ativado? " & IIf(somenteMinBr, "SIM (só LP=MIN ou LP=BR)", "Não") & vbCrLf
    If somenteMinBr Then
        diagnostico = diagnostico & "Linhas da Referência ignoradas (LP diferente de MIN/BR): " & qtdLinhasIgnoradasMinBr & vbCrLf
    End If
    diagnostico = diagnostico & "Total de GEOBOX únicos com SEGMENTO mapeado: " & dicSegPorGeobox.Count & vbCrLf
    diagnostico = diagnostico & "Total de GEOBOX únicos com LP mapeado: " & dicLpPorGeobox.Count & vbCrLf
    If wasOpen Then
        diagnostico = diagnostico & vbCrLf & "ATENÇÃO: o arquivo já estava aberto e foi reaproveitado. " & _
                      "Se os números acima parecerem baixos demais, FECHE o arquivo Tabela_Referencia.xlsx " & _
                      "no Excel (sem salvar) e rode a macro de novo — ele será reaberto do zero, com a versão mais recente salva." & vbCrLf
    End If

    ' --- Soma marcas extras da aba "MarcasExtras" (aceita variação sem "s"
    ' final: "MarcasExtra") ---
    Dim wsMarcasExtras As Worksheet
    Set wsMarcasExtras = Nothing
    On Error Resume Next
    Set wsMarcasExtras = wbRef.Sheets("MarcasExtras")
    If wsMarcasExtras Is Nothing Then Set wsMarcasExtras = wbRef.Sheets("MarcasExtra")
    On Error GoTo ErroAbrir

    Dim qtdMarcasExtrasLidas As Long
    qtdMarcasExtrasLidas = 0

    If Not wsMarcasExtras Is Nothing Then
        Dim lastRowExtras As Long, j As Long, mExtra As String
        lastRowExtras = wsMarcasExtras.Cells(wsMarcasExtras.Rows.Count, "A").End(xlUp).Row
        Dim arrExtras As Variant
        If lastRowExtras >= 2 Then arrExtras = wsMarcasExtras.Range(wsMarcasExtras.Cells(2, 1), wsMarcasExtras.Cells(lastRowExtras, 1)).Value
        For j = 2 To lastRowExtras
            If lastRowExtras = 2 Then
                mExtra = UCase(Trim(CStr(arrExtras(1, 1))))
            Else
                mExtra = UCase(Trim(CStr(arrExtras(j - 1, 1))))
            End If
            If Len(mExtra) > 0 Then
                If Not dicMarcasUnicas.Exists(mExtra) Then dicMarcasUnicas.Add mExtra, True
                qtdMarcasExtrasLidas = qtdMarcasExtrasLidas + 1
            End If
        Next j
        diagnostico = diagnostico & "Aba de marcas extras encontrada (""" & wsMarcasExtras.Name & """). Última linha: " & lastRowExtras & _
                      ". Marcas lidas (linha 2 até " & lastRowExtras & "): " & qtdMarcasExtrasLidas & vbCrLf
    Else
        diagnostico = diagnostico & "Nenhuma aba ""MarcasExtras"" ou ""MarcasExtra"" encontrada nesse arquivo." & vbCrLf
    End If

    ' --- Carrega exceções de marca da aba "ExcecoesMarca" (se existir) ---
    Set dicExcecoesMarca = CreateObject("Scripting.Dictionary")
    Dim wsExcecoes As Worksheet
    Set wsExcecoes = Nothing
    On Error Resume Next
    Set wsExcecoes = wbRef.Sheets("ExcecoesMarca")
    On Error GoTo ErroAbrir

    Dim qtdExcecoesLidas As Long
    qtdExcecoesLidas = 0

    If Not wsExcecoes Is Nothing Then
        Dim lastRowExc As Long, padrao As String, marcaCorreta As String
        lastRowExc = wsExcecoes.Cells(wsExcecoes.Rows.Count, "A").End(xlUp).Row
        Dim arrExcMarca As Variant
        If lastRowExc >= 2 Then arrExcMarca = wsExcecoes.Range(wsExcecoes.Cells(2, 1), wsExcecoes.Cells(lastRowExc, 2)).Value
        For j = 2 To lastRowExc
            If lastRowExc = 2 Then
                padrao = UCase(Trim(CStr(arrExcMarca(1, 1))))
                marcaCorreta = UCase(Trim(CStr(arrExcMarca(1, 2))))
            Else
                padrao = UCase(Trim(CStr(arrExcMarca(j - 1, 1))))
                marcaCorreta = UCase(Trim(CStr(arrExcMarca(j - 1, 2))))
            End If
            If Len(padrao) > 0 And Len(marcaCorreta) > 0 Then
                If Not dicExcecoesMarca.Exists(padrao) Then dicExcecoesMarca.Add padrao, marcaCorreta
                qtdExcecoesLidas = qtdExcecoesLidas + 1
            End If
        Next j
        diagnostico = diagnostico & "Aba ""ExcecoesMarca"" encontrada. Última linha: " & lastRowExc & _
                      ". Exceções lidas (linha 2 até " & lastRowExc & "): " & qtdExcecoesLidas & vbCrLf
    Else
        diagnostico = diagnostico & "Aba ""ExcecoesMarca"" NÃO encontrada nesse arquivo." & vbCrLf
    End If

    ' --- Carrega exceções/abreviações de GAMA da aba "ExcecoesGama" (se existir) ---
    ' Mesmo modelo da "ExcecoesMarca": coluna A = padrão abreviado como
    ' aparece na descrição (ex: "PTNZ"), coluna B = GAMA correta (ex:
    ' "POTENZA"). Checada antes da busca normal por GAMA em ExtrairGama.
    Set dicExcecoesGama = CreateObject("Scripting.Dictionary")
    Dim wsExcecoesGama As Worksheet
    Set wsExcecoesGama = Nothing
    On Error Resume Next
    Set wsExcecoesGama = wbRef.Sheets("ExcecoesGama")
    On Error GoTo ErroAbrir

    Dim qtdExcecoesGamaLidas As Long
    qtdExcecoesGamaLidas = 0

    If Not wsExcecoesGama Is Nothing Then
        Dim lastRowExcGama As Long, padraoGama As String, gamaCorreta As String
        lastRowExcGama = wsExcecoesGama.Cells(wsExcecoesGama.Rows.Count, "A").End(xlUp).Row
        Dim arrExcGama As Variant
        If lastRowExcGama >= 2 Then arrExcGama = wsExcecoesGama.Range(wsExcecoesGama.Cells(2, 1), wsExcecoesGama.Cells(lastRowExcGama, 2)).Value
        For j = 2 To lastRowExcGama
            If lastRowExcGama = 2 Then
                padraoGama = UCase(Trim(CStr(arrExcGama(1, 1))))
                gamaCorreta = UCase(Trim(CStr(arrExcGama(1, 2))))
            Else
                padraoGama = UCase(Trim(CStr(arrExcGama(j - 1, 1))))
                gamaCorreta = UCase(Trim(CStr(arrExcGama(j - 1, 2))))
            End If
            If Len(padraoGama) > 0 And Len(gamaCorreta) > 0 Then
                If Not dicExcecoesGama.Exists(padraoGama) Then dicExcecoesGama.Add padraoGama, gamaCorreta
                qtdExcecoesGamaLidas = qtdExcecoesGamaLidas + 1
            End If
        Next j
        diagnostico = diagnostico & "Aba ""ExcecoesGama"" encontrada. Última linha: " & lastRowExcGama & _
                      ". Exceções lidas (linha 2 até " & lastRowExcGama & "): " & qtdExcecoesGamaLidas & vbCrLf
    Else
        diagnostico = diagnostico & "Aba ""ExcecoesGama"" NÃO encontrada nesse arquivo (abreviações de GAMA não serão reconhecidas)." & vbCrLf
    End If

    diagnostico = diagnostico & "Total de marcas únicas na busca (Referencia + MarcasExtras): " & dicMarcasUnicas.Count

    ' --- Monta arrMarcas ordenado da mais longa para a mais curta ---
    ReDim arrMarcas(0 To dicMarcasUnicas.Count - 1)
    Dim k As Long
    k = 0
    Dim chaveMarca As Variant
    For Each chaveMarca In dicMarcasUnicas.Keys
        arrMarcas(k) = CStr(chaveMarca)
        k = k + 1
    Next chaveMarca

    Dim a As Long, b As Long, temp As String
    For a = LBound(arrMarcas) To UBound(arrMarcas) - 1
        For b = a + 1 To UBound(arrMarcas)
            If Len(arrMarcas(b)) > Len(arrMarcas(a)) Then
                temp = arrMarcas(a)
                arrMarcas(a) = arrMarcas(b)
                arrMarcas(b) = temp
            End If
        Next b
    Next a

    If Not wasOpen Then wbRef.Close SaveChanges:=False

    CarregarTabelaReferencia = True
    Exit Function

ErroAbrir:
    CarregarTabelaReferencia = False
End Function

' ==========================================================================
' Recebe um dicionário de votos (chave GEOBOX -> Dictionary(valor -> contagem),
' montado ignorando valores vazios) e devolve um dicionário simples
' chave GEOBOX -> valor mais votado (maioria). Em empate, fica com o
' primeiro valor encontrado (ordem de leitura da aba "Referencia").
' ==========================================================================
Function MontarDicMaioriaPorGeobox(dicVotosPorGeo As Object) As Object
    Dim dicResultado As Object
    Set dicResultado = CreateObject("Scripting.Dictionary")

    Dim geoKey As Variant, valorIter As Variant
    Dim subVotos As Object
    Dim melhorValor As String, melhorContagem As Long

    For Each geoKey In dicVotosPorGeo.Keys
        Set subVotos = dicVotosPorGeo(geoKey)
        melhorValor = ""
        melhorContagem = 0
        For Each valorIter In subVotos.Keys
            If subVotos(valorIter) > melhorContagem Then
                melhorContagem = subVotos(valorIter)
                melhorValor = CStr(valorIter)
            End If
        Next valorIter
        dicResultado.Add CStr(geoKey), melhorValor
    Next geoKey

    Set MontarDicMaioriaPorGeobox = dicResultado
End Function

' ==========================================================================
' Retorna, para uma DIMENSÃO (GEOBOX) já extraída, o SEGMENTO e a LP.
' Não depende de MARCA nem de achar a GAMA no texto — é busca direta por
' DIMENSÃO. Regra de prioridade do LP:
'   1) Se achou SEGMENTO pra essa dimensão, LP = DeduzirLp(segmento)
'      (TC para PC/REC/COM, PL para TLD/PPL/BUS, BR para DM).
'   2) Se DeduzirLp não souber mapear esse segmento (retornou ""), ou se
'      não achou SEGMENTO nenhum, usa a votação independente de LP
'      (dicLpPorGeobox) — maioria dos valores de LP não vazios daquele
'      GEOBOX na Tabela de Referência.
' Se a DIMENSÃO não estiver cadastrada em nenhum dos dois dicionários,
' retorna "" para os dois. DeduzirLp vem de modClassificacaoRegras.bas.
' ==========================================================================
Sub ObterSegmentoELpPorDimensao(dimensao As String, dicSegPorGeobox As Object, dicLpPorGeobox As Object, _
                                 ByRef segmentoOut As String, ByRef lpOut As String)
    segmentoOut = ""
    lpOut = ""

    If Len(dimensao) = 0 Then Exit Sub

    If dicSegPorGeobox.Exists(dimensao) Then segmentoOut = CStr(dicSegPorGeobox(dimensao))

    Dim lpVotado As String
    lpVotado = ""
    If dicLpPorGeobox.Exists(dimensao) Then lpVotado = CStr(dicLpPorGeobox(dimensao))

    If Len(segmentoOut) > 0 Then
        lpOut = DeduzirLp(segmentoOut)
        If Len(lpOut) = 0 Then lpOut = lpVotado
    Else
        lpOut = lpVotado
    End If
End Sub

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
' ==========================================================================
Function CarregarTabelaReferencia(ByRef dicSegPorGeobox As Object, ByRef dicLpPorGeobox As Object, _
                                   ByRef dicLpPorMarca As Object, _
                                   ByRef arrMarcas() As String, ByRef dicGeoboxPorMarca As Object, _
                                   ByRef dicGeoboxGlobalUnicos As Object, ByRef dicExcecoesMarca As Object, _
                                   ByRef diagnostico As String) As Boolean

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

    ' dicVotosSegPorGeo / dicVotosLpPorGeo: chave GEOBOX -> Dictionary(valor -> contagem).
    ' Votações independentes: uma conta SEGMENTO, a outra conta LP, cada
    ' uma ignorando linhas onde o próprio valor está vazio.
    Dim dicVotosSegPorGeo As Object, dicVotosLpPorGeo As Object
    Set dicVotosSegPorGeo = CreateObject("Scripting.Dictionary")
    Set dicVotosLpPorGeo = CreateObject("Scripting.Dictionary")

    ' dicVotosLpPorMarca: chave MARCA -> Dictionary(valor LP -> contagem).
    ' Fallback de LP quando o GEOBOX da linha não bate com nada cadastrado
    ' (não achou SEGMENTO nem LP por GEOBOX) — usa a LP mais votada para a
    ' marca já identificada, ignorando linhas com LP vazia.
    Dim dicVotosLpPorMarca As Object
    Set dicVotosLpPorMarca = CreateObject("Scripting.Dictionary")

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

    For i = 2 To lastRowRef
        geo = UCase(Trim(CStr(wsRef.Cells(i, 1).Value)))     ' GEOBOX
        geo = NormalizarFormatacaoBasica(geo)                 ' mesma normalização usada na busca
        marcaRef = UCase(Trim(CStr(wsRef.Cells(i, 2).Value))) ' MARCA
        gama = UCase(Trim(CStr(wsRef.Cells(i, 3).Value)))    ' GAMA (não usada na busca de segmento/LP)
        lp = UCase(Trim(CStr(wsRef.Cells(i, 4).Value)))       ' LP
        seg = UCase(Trim(CStr(wsRef.Cells(i, 5).Value)))      ' SEGMENTO

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

        If Len(marcaRef) > 0 And Len(lp) > 0 Then
            If Not dicVotosLpPorMarca.Exists(marcaRef) Then
                dicVotosLpPorMarca.Add marcaRef, CreateObject("Scripting.Dictionary")
            End If
            Set subVotos = dicVotosLpPorMarca(marcaRef)
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
        End If

        If Len(geo) > 0 Then
            If Not dicGeoboxGlobalUnicos.Exists(geo) Then dicGeoboxGlobalUnicos.Add geo, True
        End If
    Next i

    ' --- Monta dicSegPorGeobox e dicLpPorGeobox: para cada GEOBOX, fica com ---
    ' --- o valor NÃO VAZIO mais votado (maioria) em cada votação, cada uma ---
    ' --- totalmente independente da outra. Em empate, fica com o primeiro  ---
    ' --- encontrado (ordem de leitura da aba "Referencia").                ---
    Set dicSegPorGeobox = MontarDicMaioriaPorGeobox(dicVotosSegPorGeo)
    Set dicLpPorGeobox = MontarDicMaioriaPorGeobox(dicVotosLpPorGeo)
    Set dicLpPorMarca = MontarDicMaioriaPorGeobox(dicVotosLpPorMarca)

    diagnostico = diagnostico & "Última linha lida na aba ""Referencia"": " & lastRowRef & vbCrLf
    diagnostico = diagnostico & "Total de GEOBOX únicos com SEGMENTO mapeado: " & dicSegPorGeobox.Count & vbCrLf
    diagnostico = diagnostico & "Total de GEOBOX únicos com LP mapeado: " & dicLpPorGeobox.Count & vbCrLf
    diagnostico = diagnostico & "Total de MARCAS únicas com LP mapeado (fallback): " & dicLpPorMarca.Count & vbCrLf
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
        For j = 2 To lastRowExtras
            mExtra = UCase(Trim(CStr(wsMarcasExtras.Cells(j, 1).Value)))
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
        For j = 2 To lastRowExc
            padrao = UCase(Trim(CStr(wsExcecoes.Cells(j, 1).Value)))
            marcaCorreta = UCase(Trim(CStr(wsExcecoes.Cells(j, 2).Value)))
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
' SEGMENTO nunca depende de MARCA — é busca direta por DIMENSÃO. Regra de
' prioridade do LP:
'   1) Se achou SEGMENTO pra essa dimensão, LP = DeduzirLp(segmento)
'      (TC para PC/REC/COM, PL para TLD/PPL/BUS, BR para DM).
'   2) Se DeduzirLp não souber mapear esse segmento (retornou ""), ou se
'      não achou SEGMENTO nenhum, usa a votação independente de LP
'      (dicLpPorGeobox) — maioria dos valores de LP não vazios daquele
'      GEOBOX na Tabela de Referência.
'   3) Se nem assim achou LP (GEOBOX extraído não bate com nada cadastrado
'      — grafia diferente, medida faltando na Referência etc.), cai no
'      fallback por MARCA: usa a LP mais votada para a marca já
'      identificada na linha (dicLpPorMarca), ignorando linhas com LP
'      vazia. NÃO aplica esse fallback quando o ARO termina em ".5", pois
'      esse caso já tem regra própria (força PL) aplicada depois em
'      modMain — não faz sentido a maioria da marca disputar com ela.
' DeduzirLp e AroTerminaEmMeio vêm de modClassificacaoRegras.bas.
' ==========================================================================
Sub ObterSegmentoELpPorDimensao(dimensao As String, marca As String, aro As String, _
                                 dicSegPorGeobox As Object, dicLpPorGeobox As Object, dicLpPorMarca As Object, _
                                 ByRef segmentoOut As String, ByRef lpOut As String)
    segmentoOut = ""
    lpOut = ""

    If Len(dimensao) > 0 Then
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
    End If

    If Len(lpOut) = 0 And Len(marca) > 0 And Not AroTerminaEmMeio(aro) Then
        If dicLpPorMarca.Exists(marca) Then lpOut = CStr(dicLpPorMarca(marca))
    End If
End Sub

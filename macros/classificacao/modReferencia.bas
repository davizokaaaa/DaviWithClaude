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
'   dicSegLpPorGeobox    : chave GEOBOX -> Array(SEGMENTO, LP) — combinação
'                          mais frequente (maioria) quando o mesmo GEOBOX
'                          aparece em mais de uma linha da aba "Referencia"
'   arrMarcas()          : array de marcas únicas, ordenado da mais longa p/ mais curta
'   dicGeoboxPorMarca    : chave MARCA -> Collection de GEOBOX únicos daquela marca
'   dicGeoboxGlobalUnicos: chave GEOBOX -> True (todos os geobox únicos, p/ busca ampla)
' ==========================================================================
Function CarregarTabelaReferencia(ByRef dicSegLpPorGeobox As Object, _
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

    ' dicVotosPorGeo: chave GEOBOX -> Dictionary("SEGMENTO|LP" -> contagem).
    ' Usado para achar a combinação (SEGMENTO, LP) mais frequente por GEOBOX.
    Dim dicVotosPorGeo As Object
    Set dicVotosPorGeo = CreateObject("Scripting.Dictionary")

    Dim dicMarcasUnicas As Object
    Set dicMarcasUnicas = CreateObject("Scripting.Dictionary")

    Dim lastRowRef As Long, i As Long
    lastRowRef = wsRef.Cells(wsRef.Rows.Count, "A").End(xlUp).Row

    Dim geo As String, gama As String, marcaRef As String, lp As String, seg As String

    For i = 2 To lastRowRef
        geo = UCase(Trim(CStr(wsRef.Cells(i, 1).Value)))     ' GEOBOX
        geo = NormalizarFormatacaoBasica(geo)                 ' mesma normalização usada na busca
        gama = UCase(Trim(CStr(wsRef.Cells(i, 2).Value)))    ' GAMA (não usada na busca de segmento/LP)
        marcaRef = UCase(Trim(CStr(wsRef.Cells(i, 3).Value))) ' MARCA
        lp = UCase(Trim(CStr(wsRef.Cells(i, 4).Value)))       ' LP
        seg = UCase(Trim(CStr(wsRef.Cells(i, 5).Value)))      ' SEGMENTO

        ' --- Vota (SEGMENTO, LP) para esse GEOBOX, se houver algo pra votar ---
        If Len(geo) > 0 And (Len(seg) > 0 Or Len(lp) > 0) Then
            Dim chaveVoto As String
            chaveVoto = seg & "|" & lp

            If Not dicVotosPorGeo.Exists(geo) Then
                dicVotosPorGeo.Add geo, CreateObject("Scripting.Dictionary")
            End If

            Dim subVotos As Object
            Set subVotos = dicVotosPorGeo(geo)

            If subVotos.Exists(chaveVoto) Then
                subVotos(chaveVoto) = subVotos(chaveVoto) + 1
            Else
                subVotos.Add chaveVoto, 1
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

    ' --- Monta dicSegLpPorGeobox: para cada GEOBOX, fica com a combinação  ---
    ' --- (SEGMENTO, LP) que teve mais votos (maioria). Em empate, fica     ---
    ' --- com a primeira encontrada (ordem de leitura da aba "Referencia"). ---
    Set dicSegLpPorGeobox = CreateObject("Scripting.Dictionary")
    Dim geoKey As Variant, chaveVotoIter As Variant
    Dim melhorChaveVoto As String, melhorContagem As Long
    For Each geoKey In dicVotosPorGeo.Keys
        Set subVotos = dicVotosPorGeo(geoKey)
        melhorChaveVoto = ""
        melhorContagem = 0
        For Each chaveVotoIter In subVotos.Keys
            If subVotos(chaveVotoIter) > melhorContagem Then
                melhorContagem = subVotos(chaveVotoIter)
                melhorChaveVoto = CStr(chaveVotoIter)
            End If
        Next chaveVotoIter

        Dim partesVoto() As String
        partesVoto = Split(melhorChaveVoto, "|")
        dicSegLpPorGeobox.Add CStr(geoKey), Array(partesVoto(0), partesVoto(1))
    Next geoKey

    diagnostico = diagnostico & "Última linha lida na aba ""Referencia"": " & lastRowRef & vbCrLf
    diagnostico = diagnostico & "Total de GEOBOX únicos mapeados (SEGMENTO/LP direto por dimensão): " & dicSegLpPorGeobox.Count & vbCrLf
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
' Retorna, para uma DIMENSÃO (GEOBOX) já extraída, o SEGMENTO e a LP
' cadastrados na Tabela de Referência (dicSegLpPorGeobox, montado por
' CarregarTabelaReferencia com a combinação mais frequente quando a mesma
' DIMENSÃO aparece em mais de uma linha da aba "Referencia"). Não depende
' de MARCA nem de achar a GAMA no texto — é busca direta por DIMENSÃO.
' Se a DIMENSÃO não estiver cadastrada, retorna "" para os dois.
' ==========================================================================
Sub ObterSegmentoELpPorDimensao(dimensao As String, dicSegLpPorGeobox As Object, _
                                 ByRef segmentoOut As String, ByRef lpOut As String)
    segmentoOut = ""
    lpOut = ""

    If Len(dimensao) = 0 Then Exit Sub
    If Not dicSegLpPorGeobox.Exists(dimensao) Then Exit Sub

    Dim par As Variant
    par = dicSegLpPorGeobox(dimensao)
    segmentoOut = CStr(par(0))
    lpOut = CStr(par(1))
End Sub

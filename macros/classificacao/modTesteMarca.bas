Attribute VB_Name = "modTesteMarca"
Option Explicit

' ==========================================================================
' MODULO: modTesteMarca
' Macro de TESTE, isolada da macro principal (ClassificarTudo, em modMain) —
' não lê nem grava nenhuma coluna/variável dela. Busca de MARCA reformulada
' do zero, "seca":
'   1) Exceções/apelidos (dicExcecoesMarca, aba "ExcecoesMarca") — igual
'      sempre foi em modMarca.ExtrairMarca, substring livre (lista curada
'      manualmente, baixo risco de colisão).
'   2) Se não bater exceção, procura cada marca conhecida (arrMarcas,
'      Referência + MarcasExtras) como PALAVRA ISOLADA direto na descrição
'      — sem GAMA, sem substring livre. Fica com a primeira que bater
'      (arrMarcas já vem ordenado do nome mais longo pro mais curto, então
'      a primeira que bater já é a mais longa/específica).
' Escreve o resultado numa coluna própria ("MARCA (TESTE PALAVRA SECA)") e
' não mexe em nenhuma outra coluna da planilha.
' ==========================================================================
Sub TestarMarcaCega()

    Dim ws As Worksheet
    Set ws = ActiveSheet

    Dim colDescricao As Long
    colDescricao = LocalizarColuna(ws, "DESCRIÇÃODA MERCADORIA")
    If colDescricao = 0 Then
        MsgBox "Não encontrei a coluna ""DESCRIÇÃODA MERCADORIA"" no cabeçalho (linha 1).", vbCritical
        Exit Sub
    End If

    Dim lastRow As Long
    lastRow = ws.Cells(ws.Rows.Count, colDescricao).End(xlUp).Row
    If lastRow < 2 Then
        MsgBox "Nenhuma linha de dados encontrada abaixo do cabeçalho.", vbExclamation
        Exit Sub
    End If

    Dim colResultado As Long
    colResultado = LocalizarOuCriarColuna(ws, "MARCA (TESTE PALAVRA SECA)")

    ' --- Carrega a Tabela de Referência (precisa pra montar arrMarcas) —    ---
    ' --- mesmo carregamento da macro principal, só que aqui só usamos o    ---
    ' --- resultado pra MARCA, ignorando o resto.                          ---
    Dim dicSegPorGeobox As Object, dicLpPorGeobox As Object
    Dim arrMarcas() As String
    Dim dicGeoboxPorMarca As Object, dicGeoboxGlobalUnicos As Object
    Dim dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, dicExcecoesGama As Object
    Dim dicMarcaPorGama As Object, dicExcecoesMarca As Object
    Dim diagnosticoRef As String

    ' Mesma pergunta da macro principal — mantém o filtro de fonte BR/MIN
    ' (STORM/Dicionário WW/Input manual) ligado nessa etapa também.
    Dim somenteMinBr As Boolean
    somenteMinBr = (MsgBox("Esta base é de BR/MIN (Beyond Road / Mineração)?" & vbCrLf & vbCrLf & _
                           "Se SIM, a busca de GEOBOX será restrita à coluna ""Base de referência""" & vbCrLf & _
                           "(STORM 40117090, 40118090, 40119090, 40129090, Dicionário WW e Input manual), igual à macro principal." & vbCrLf & _
                           "A busca de MARCA continua na Referência inteira.", _
                           vbYesNo + vbQuestion, "Tipo de base (teste)") = vbYes)

    If Not CarregarTabelaReferencia(dicSegPorGeobox, dicLpPorGeobox, arrMarcas, _
                                     dicGeoboxPorMarca, dicGeoboxGlobalUnicos, dicExcecoesMarca, _
                                     dicGamasPorMarca, dicGamaGlobalUnicos, dicMarcaPorGama, dicExcecoesGama, _
                                     somenteMinBr, diagnosticoRef) Then
        MsgBox "Não foi possível abrir a Tabela de Referência em:" & vbCrLf & REF_FILE_PATH, vbCritical
        Exit Sub
    End If

    Dim calcAnterior As XlCalculation
    calcAnterior = Application.Calculation
    On Error GoTo Finally
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    Dim i As Long, qtdAchou As Long
    qtdAchou = 0

    For i = 2 To lastRow
        If i Mod 500 = 0 Or i = lastRow Then
            Application.StatusBar = "Testando MARCA (palavra seca): linha " & i & " de " & lastRow
            DoEvents
        End If

        Dim descricao As String, marcaAchada As String
        descricao = UCase(Trim(CStr(ws.Cells(i, colDescricao).Value)))

        marcaAchada = ""
        Dim chaveExc As Variant
        For Each chaveExc In dicExcecoesMarca.Keys
            If InStr(1, descricao, CStr(chaveExc), vbTextCompare) > 0 Then
                marcaAchada = CStr(dicExcecoesMarca(chaveExc))
                Exit For
            End If
        Next chaveExc

        If Len(marcaAchada) = 0 Then
            marcaAchada = BuscarMarcaPalavraSeca(descricao, arrMarcas)
        End If

        ws.Cells(i, colResultado).Value = marcaAchada
        If Len(marcaAchada) > 0 Then qtdAchou = qtdAchou + 1
    Next i

    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False

    MsgBox "Teste de MARCA (palavra seca) concluído." & vbCrLf & vbCrLf & _
           "Linhas testadas: " & (lastRow - 1) & vbCrLf & _
           "Marca encontrada: " & qtdAchou & " (" & Format(qtdAchou / (lastRow - 1), "0%") & ")" & vbCrLf & vbCrLf & _
           "Resultado na coluna ""MARCA (TESTE PALAVRA SECA)"".", vbInformation
    Exit Sub

Finally:
    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False
    MsgBox "O teste parou por causa de um erro: " & vbCrLf & vbCrLf & Err.Description, vbCritical
End Sub

' ==========================================================================
' True se o caractere for uma letra A-Z (maiúscula ou minúscula). String
' vazia (posição fora do texto — início/fim) conta como "não é letra", ou
' seja, já é fronteira válida.
' ==========================================================================
Private Function EhLetra(c As String) As Boolean
    If Len(c) = 0 Then
        EhLetra = False
        Exit Function
    End If
    Dim cu As String
    cu = UCase(c)
    EhLetra = (cu >= "A" And cu <= "Z")
End Function

' ==========================================================================
' True se o trecho imediatamente ANTES de posAchada for a palavra "MARCA"
' colada (sem espaço/pontuação no meio) — ex: "MODELO T510, MARCATRELLEBORG,
' INDICE...". Aqui "MARCA" é claramente um rótulo, não uma palavra que
' colide por acaso (como "AGRI" em "AGRICOLA") — então esse caso específico
' é aceito mesmo com letra colada, sem abrir mão da proteção geral.
' ==========================================================================
Private Function PrecedidoPorRotuloMarca(texto As String, posAchada As Long) As Boolean
    Const ROTULO As String = "MARCA"
    Dim inicioRotulo As Long
    inicioRotulo = posAchada - Len(ROTULO)
    If inicioRotulo < 1 Then
        PrecedidoPorRotuloMarca = False
        Exit Function
    End If
    PrecedidoPorRotuloMarca = (UCase(Mid(texto, inicioRotulo, Len(ROTULO))) = ROTULO)
End Function

' ==========================================================================
' True se o trecho imediatamente DEPOIS de posDepois for um dos rótulos de
' campo conhecidos (LARGURA, SERIE, TAMANHO, PEDIDO, ITEM, FATURA, DIMENSAO,
' ARO) colado direto, sem separador — ex: "...MARCA: MICHELINLARGURA: 650",
' "...MARCA JUNGHEINRICHPEDIDO: 065034". Igual à ideia do rótulo "MARCA" à
' esquerda: esses nomes só aparecem colados como próximo campo do formulário,
' não colidem por acaso (diferente de "GRI" em "AGRICOLA"), então esse caso
' é aceito mesmo com letra colada à direita.
' ==========================================================================
Private Function SeguidoPorRotuloCampo(texto As String, posDepois As Long) As Boolean
    Static arrRotulos As Variant
    arrRotulos = Array("LARGURA", "SERIE", "TAMANHO", "PEDIDO", "ITEM", "FATURA", "DIMENSAO", "ARO", _
                        "REGISTRO", "MODELO", "COR", "CARGA", "INDICE", "REF", "NCM", "DIAMETRO", "DESIGNACAO")

    Dim j As Long
    For j = LBound(arrRotulos) To UBound(arrRotulos)
        Dim rotulo As String
        rotulo = arrRotulos(j)
        If posDepois + Len(rotulo) - 1 <= Len(texto) Then
            If UCase(Mid(texto, posDepois, Len(rotulo))) = rotulo Then
                SeguidoPorRotuloCampo = True
                Exit Function
            End If
        End If
    Next j
    SeguidoPorRotuloCampo = False
End Function

' ==========================================================================
' Procura, dentro do texto, a PRIMEIRA marca de arrMarcas (já ordenado do
' nome mais longo pro mais curto) que aparece como PALAVRA ISOLADA — sem
' regex: pra cada ocorrência (InStr, varrendo TODAS, não só a primeira),
' olha o caractere logo antes e logo depois e só aceita se nenhum dos dois
' for outra LETRA colada (dígito, espaço, pontuação, início/fim de texto
' contam como separador válido — ex: "MRL" em "MRL7.50-16" é aceito porque
' "7" não é letra; "GRI" dentro de "AGRICOLA" continua rejeitado porque "A"
' e "C" são letras), EXCETO quando o lado esquerdo for a palavra "MARCA"
' colada (ver PrecedidoPorRotuloMarca) ou o lado direito for um rótulo de
' campo conhecido colado (LARGURA, SERIE, TAMANHO, PEDIDO, ITEM, FATURA,
' DIMENSAO, ARO — ver SeguidoPorRotuloCampo). Retorna "" se nenhuma marca bater.
' ==========================================================================
Private Function BuscarMarcaPalavraSeca(texto As String, arrMarcas() As String) As String
    Dim i As Long
    For i = LBound(arrMarcas) To UBound(arrMarcas)
        Dim cand As String
        cand = arrMarcas(i)
        If Len(cand) > 0 Then
            Dim posBusca As Long, posAchada As Long
            posBusca = 1
            Do
                posAchada = InStr(posBusca, texto, cand, vbTextCompare)
                If posAchada = 0 Then Exit Do

                Dim charAntes As String, charDepois As String
                If posAchada > 1 Then
                    charAntes = Mid(texto, posAchada - 1, 1)
                Else
                    charAntes = ""
                End If

                Dim posDepois As Long
                posDepois = posAchada + Len(cand)
                If posDepois <= Len(texto) Then
                    charDepois = Mid(texto, posDepois, 1)
                Else
                    charDepois = ""
                End If

                Dim ladoEsquerdoOk As Boolean, ladoDireitoOk As Boolean
                ladoEsquerdoOk = (Not EhLetra(charAntes)) Or PrecedidoPorRotuloMarca(texto, posAchada)
                ladoDireitoOk = (Not EhLetra(charDepois)) Or SeguidoPorRotuloCampo(texto, posDepois)

                If ladoEsquerdoOk And ladoDireitoOk Then
                    BuscarMarcaPalavraSeca = cand
                    Exit Function
                End If

                posBusca = posAchada + 1 ' tenta a próxima ocorrência dessa mesma marca
            Loop
        End If
    Next i
    BuscarMarcaPalavraSeca = ""
End Function

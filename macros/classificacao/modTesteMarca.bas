Attribute VB_Name = "modTesteMarca"
Option Explicit

' ==========================================================================
' MODULO: modTesteMarca
' Macro de TESTE, isolada da macro principal (ClassificarTudo, em modMain) —
' não lê nem grava nenhuma coluna/variável dela. Busca de MARCA reformulada
' do zero, "seca": procura cada marca conhecida (arrMarcas, Referência +
' MarcasExtras) como PALAVRA ISOLADA (limite \b nos dois lados) direto na
' descrição — sem exceções, sem GAMA, sem substring livre. Fica com a
' primeira que bater (arrMarcas já vem ordenado do nome mais longo pro mais
' curto, então a primeira que bater já é a mais longa/específica). Escreve
' o resultado numa coluna própria ("MARCA (TESTE PALAVRA SECA)") e não mexe
' em nenhuma outra coluna da planilha.
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
        marcaAchada = BuscarMarcaPalavraSeca(descricao, arrMarcas)
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
' Escapa caracteres especiais de regex num texto literal (pra usar como
' padrão exato dentro de \b...\b, sem que "." "+" "(" etc. sejam
' interpretados como metacaracteres).
' ==========================================================================
Private Function EscaparRegexTeste(texto As String) As String
    Dim especiais As String
    especiais = "\^$.|?*+()[]{}"

    Dim resultado As String, i As Long, c As String
    resultado = ""
    For i = 1 To Len(texto)
        c = Mid(texto, i, 1)
        If InStr(especiais, c) > 0 Then
            resultado = resultado & "\" & c
        Else
            resultado = resultado & c
        End If
    Next i
    EscaparRegexTeste = resultado
End Function

' ==========================================================================
' Procura, dentro do texto, a PRIMEIRA marca de arrMarcas (já ordenado do
' nome mais longo pro mais curto) que aparece como PALAVRA ISOLADA — \b nos
' dois lados, sem substring livre. Retorna "" se nenhuma bater.
' ==========================================================================
Private Function BuscarMarcaPalavraSeca(texto As String, arrMarcas() As String) As String
    Static regex As Object
    If regex Is Nothing Then
        Set regex = CreateObject("VBScript.RegExp")
        regex.Global = False
        regex.IgnoreCase = True
    End If

    Dim i As Long
    For i = LBound(arrMarcas) To UBound(arrMarcas)
        If Len(arrMarcas(i)) > 0 Then
            regex.Pattern = "\b" & EscaparRegexTeste(arrMarcas(i)) & "\b"
            If regex.Test(texto) Then
                BuscarMarcaPalavraSeca = arrMarcas(i)
                Exit Function
            End If
        End If
    Next i
    BuscarMarcaPalavraSeca = ""
End Function

Attribute VB_Name = "modTesteMarca"
Option Explicit

' ==========================================================================
' MODULO: modTesteMarca
' Macro de TESTE, isolada da macro principal (ClassificarTudo, em modMain) —
' não lê nem grava nenhuma coluna/variável dela. Roda SÓ a extração de
' MARCA (modMarca.ExtrairMarca, a função de produção de verdade — não uma
' cópia) linha a linha, sem GEOBOX/GAMA/TIPO PRODUTO/etc., pra dar uma
' resposta rápida sobre a busca CEGA de marca (exceções + procura direta na
' descrição) sem esperar a macro inteira (que numa base BR/MIN grande passa
' de 10 minutos). Escreve o resultado numa coluna própria
' ("MARCA (TESTE CEGO)") e não mexe em nenhuma outra coluna da planilha.
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
    colResultado = LocalizarOuCriarColuna(ws, "MARCA (TESTE CEGO)")

    ' --- Carrega a Tabela de Referência (precisa pra montar arrMarcas e     ---
    ' --- dicExcecoesMarca) — mesmo carregamento da macro principal, só que  ---
    ' --- aqui só usamos o resultado pra MARCA, ignorando o resto.           ---
    Dim dicSegPorGeobox As Object, dicLpPorGeobox As Object
    Dim arrMarcas() As String
    Dim dicGeoboxPorMarca As Object, dicGeoboxGlobalUnicos As Object
    Dim dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, dicExcecoesGama As Object
    Dim dicMarcaPorGama As Object, dicExcecoesMarca As Object
    Dim diagnosticoRef As String

    ' BR/MIN fixo aqui: este teste existe pra validar a busca CEGA de marca
    ' nesse modo (sem a descoberta "de trás pra frente" via GAMA).
    Dim somenteMinBr As Boolean
    somenteMinBr = True

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
            Application.StatusBar = "Testando MARCA (cega): linha " & i & " de " & lastRow
            DoEvents
        End If

        Dim descricao As String, marcaAchada As String
        descricao = UCase(Trim(CStr(ws.Cells(i, colDescricao).Value)))
        marcaAchada = ExtrairMarca(descricao, arrMarcas, dicExcecoesMarca)
        ws.Cells(i, colResultado).Value = marcaAchada
        If Len(marcaAchada) > 0 Then qtdAchou = qtdAchou + 1
    Next i

    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False

    MsgBox "Teste de MARCA cega concluído." & vbCrLf & vbCrLf & _
           "Linhas testadas: " & (lastRow - 1) & vbCrLf & _
           "Marca encontrada: " & qtdAchou & " (" & Format(qtdAchou / (lastRow - 1), "0%") & ")" & vbCrLf & vbCrLf & _
           "Resultado na coluna ""MARCA (TESTE CEGO)"".", vbInformation
    Exit Sub

Finally:
    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False
    MsgBox "O teste parou por causa de um erro: " & vbCrLf & vbCrLf & Err.Description, vbCritical
End Sub

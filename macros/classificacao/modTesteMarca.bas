Attribute VB_Name = "modTesteMarca"
Option Explicit

' ==========================================================================
' MODULO: modTesteMarca
' Macro de TESTE, isolada da macro principal (ClassificarTudo, em modMain) —
' não lê nem grava nenhuma coluna/variável dela. Testa uma ordem diferente
' pra MARCA, reaproveitando as funções de produção de verdade (não cópias):
'   1) modGama.ExtrairGama primeiro — se achar GAMA e essa GAMA tiver uma
'      MARCA dona conhecida (dicMarcaPorGama), usa essa marca.
'   2) Se a busca por GAMA não resolveu a marca, cai na busca CEGA de marca
'      (modMarca.ExtrairMarca — exceções + substring livre na descrição).
' Sem GEOBOX/TIPO PRODUTO/etc., pra dar resposta rápida sem esperar a macro
' inteira (que numa base BR/MIN grande passa de 10 minutos). Escreve o
' resultado numa coluna própria ("MARCA (TESTE GAMA->CEGA)") e não mexe em
' nenhuma outra coluna da planilha.
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
    colResultado = LocalizarOuCriarColuna(ws, "MARCA (TESTE GAMA->CEGA)")

    ' --- Carrega a Tabela de Referência (precisa pra montar arrMarcas e     ---
    ' --- dicExcecoesMarca) — mesmo carregamento da macro principal, só que  ---
    ' --- aqui só usamos o resultado pra MARCA, ignorando o resto.           ---
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
                           "A busca de MARCA continua na Referência inteira, sempre cega (sem descoberta via GAMA).", _
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
            Application.StatusBar = "Testando MARCA (cega): linha " & i & " de " & lastRow
            DoEvents
        End If

        Dim descricao As String, marcaAchada As String, gamaAchada As String
        descricao = UCase(Trim(CStr(ws.Cells(i, colDescricao).Value)))

        ' --- Passo 1: acha GAMA primeiro; se tiver marca dona conhecida, ---
        ' --- ExtrairGama já preenche marcaAchada (ByRef) sozinha.        ---
        marcaAchada = ""
        gamaAchada = ExtrairGama(descricao, marcaAchada, dicGamasPorMarca, dicGamaGlobalUnicos, dicMarcaPorGama, dicExcecoesGama, somenteMinBr)

        ' --- Passo 2: se a GAMA não resolveu a marca, cai na busca cega. ---
        If Len(marcaAchada) = 0 Then
            marcaAchada = ExtrairMarca(descricao, arrMarcas, dicExcecoesMarca)
        End If

        ws.Cells(i, colResultado).Value = marcaAchada
        If Len(marcaAchada) > 0 Then qtdAchou = qtdAchou + 1
    Next i

    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False

    MsgBox "Teste de MARCA (GAMA -> cega) concluído." & vbCrLf & vbCrLf & _
           "Linhas testadas: " & (lastRow - 1) & vbCrLf & _
           "Marca encontrada: " & qtdAchou & " (" & Format(qtdAchou / (lastRow - 1), "0%") & ")" & vbCrLf & vbCrLf & _
           "Resultado na coluna ""MARCA (TESTE GAMA->CEGA)"".", vbInformation
    Exit Sub

Finally:
    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False
    MsgBox "O teste parou por causa de um erro: " & vbCrLf & vbCrLf & Err.Description, vbCritical
End Sub

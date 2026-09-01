Attribute VB_Name = "modTesteMatchExato"
Option Explicit

' ==========================================================================
' MODULO: modTesteMatchExato
' Macro de TESTE, totalmente isolada da macro principal (ClassificarTudo,
' em modMain) — não usa nenhuma variável ou coluna dela, não é chamada por
' ela e não é chamada dela. Serve só para medir, numa base de teste, quantas
' linhas já têm o GEOBOX batendo por DE-PARA CEGO: match LITERAL do valor
' exatamente como está cadastrado na Tabela de Referência dentro da
' descrição CRUA, sem nenhuma normalização (nem maiúscula, nem espaço, nem
' vírgula->ponto, nada). Escreve o resultado numa coluna própria
' ("DIMENSÃO (TESTE EXATO)") e não mexe em nenhuma outra coluna da planilha.
' ==========================================================================
Sub TestarMatchExatoGeobox()

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
    colResultado = LocalizarOuCriarColuna(ws, "DIMENSÃO (TESTE EXATO)")

    Dim somenteMinBr As Boolean
    somenteMinBr = (MsgBox("Esta base é de BR/MIN (Beyond Road / Mineração)?" & vbCrLf & vbCrLf & _
                           "Se SIM, a Tabela de Referência será filtrada pela coluna ""Base de referência"" " & _
                           "(STORM 40117090, 40118090, 40119090, 40129090 e Dicionário WW), igual à macro principal.", _
                           vbYesNo + vbQuestion, "Tipo de base (teste)") = vbYes)

    ' --- Carrega só o dicionário de GEOBOX da Referência — nada mais. ---
    Dim dicSegPorGeobox As Object, dicLpPorGeobox As Object
    Dim arrMarcas() As String
    Dim dicGeoboxPorMarca As Object, dicGeoboxGlobalUnicos As Object
    Dim dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, dicExcecoesGama As Object
    Dim dicMarcaPorGama As Object, dicExcecoesMarca As Object
    Dim dicGeoboxTokenParaOriginal As Object
    Dim diagnosticoRef As String

    If Not CarregarTabelaReferencia(dicSegPorGeobox, dicLpPorGeobox, arrMarcas, _
                                     dicGeoboxPorMarca, dicGeoboxGlobalUnicos, dicExcecoesMarca, _
                                     dicGamasPorMarca, dicGamaGlobalUnicos, dicMarcaPorGama, dicExcecoesGama, _
                                     dicGeoboxTokenParaOriginal, somenteMinBr, diagnosticoRef) Then
        MsgBox "Não foi possível abrir a Tabela de Referência em:" & vbCrLf & REF_FILE_PATH, vbCritical
        Exit Sub
    End If

    Dim calcAnterior As XlCalculation
    calcAnterior = Application.Calculation
    On Error GoTo Finally
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    Application.EnableEvents = False

    Dim i As Long, qtdBateu As Long
    qtdBateu = 0

    For i = 2 To lastRow
        If i Mod 100 = 0 Or i = lastRow Then
            Application.StatusBar = "Testando match exato: linha " & i & " de " & lastRow
            DoEvents
        End If

        Dim resultado As String
        resultado = ExtrairDimensaoExata(CStr(ws.Cells(i, colDescricao).Value), dicGeoboxGlobalUnicos)
        ws.Cells(i, colResultado).Value = resultado
        If Len(resultado) > 0 Then qtdBateu = qtdBateu + 1
    Next i

    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False

    MsgBox "Teste de match exato concluído." & vbCrLf & vbCrLf & _
           "Linhas testadas: " & (lastRow - 1) & vbCrLf & _
           "Bateram sem nenhuma normalização: " & qtdBateu & _
           " (" & Format(qtdBateu / (lastRow - 1), "0%") & ")" & vbCrLf & vbCrLf & _
           "Resultado na coluna ""DIMENSÃO (TESTE EXATO)"".", vbInformation
    Exit Sub

Finally:
    Application.ScreenUpdating = True
    Application.Calculation = calcAnterior
    Application.EnableEvents = True
    Application.StatusBar = False
    MsgBox "O teste parou por causa de um erro: " & vbCrLf & vbCrLf & Err.Description, vbCritical
End Sub

' ==========================================================================
' Match LITERAL do valor exatamente como cadastrado na Referência, dentro da
' descrição crua — sem nenhuma transformação, EXCETO remover espaços dos
' dois lados antes de comparar (só isso: sem maiúscula, sem vírgula->ponto,
' sem mexer em traço/barra). Fica a mais longa em caso de mais de uma bater.
' O valor GRAVADO continua sendo o original da Referência (com espaço, se
' tiver) — a remoção de espaço é só para efeito da COMPARAÇÃO.
' ==========================================================================
Private Function ExtrairDimensaoExata(descricaoCrua As String, dicGeoboxGlobalUnicos As Object) As String
    Dim descricaoSemEspaco As String
    descricaoSemEspaco = Replace(descricaoCrua, " ", "")

    Dim melhor As String, melhorLen As Long
    melhor = ""
    melhorLen = 0

    Dim chaveG As Variant
    For Each chaveG In dicGeoboxGlobalUnicos.Keys
        Dim geoSemEspaco As String
        geoSemEspaco = Replace(CStr(chaveG), " ", "")

        If Len(geoSemEspaco) > melhorLen Then
            If InStr(1, descricaoSemEspaco, geoSemEspaco, vbTextCompare) > 0 Then
                melhorLen = Len(geoSemEspaco)
                melhor = CStr(chaveG)
            End If
        End If
    Next chaveG

    ExtrairDimensaoExata = melhor
End Function

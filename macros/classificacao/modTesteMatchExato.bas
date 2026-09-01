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
                           "Se SIM, a busca de GEOBOX será restrita à coluna ""Base de referência""" & vbCrLf & _
                           "(STORM 40117090, 40118090, 40119090, 40129090, Dicionário WW e Input manual), igual à macro principal." & vbCrLf & _
                           "A busca de MARCA e GAMA continua na Referência inteira.", _
                           vbYesNo + vbQuestion, "Tipo de base (teste)") = vbYes)

    ' --- Carrega só o dicionário de GEOBOX da Referência — nada mais. ---
    Dim dicSegPorGeobox As Object, dicLpPorGeobox As Object
    Dim arrMarcas() As String
    Dim dicGeoboxPorMarca As Object, dicGeoboxGlobalUnicos As Object
    Dim dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, dicExcecoesGama As Object
    Dim dicMarcaPorGama As Object, dicExcecoesMarca As Object
    Dim diagnosticoRef As String

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
' Remove zero(s) à direita depois do ponto decimal — só isso, pra "17.50" e
' "17.5" (ou "20.0" e "20") serem tratados como o mesmo número na
' COMPARAÇÃO. Não mexe em nada que não seja decimal (não afeta "50" sozinho,
' só ".50" depois de um ponto).
' ==========================================================================
Private Function NormalizarZerosDecimais(valor As String) As String
    Static regexZeroFinal As Object, regexPontoZero As Object
    If regexZeroFinal Is Nothing Then
        Set regexZeroFinal = CreateObject("VBScript.RegExp")
        regexZeroFinal.Global = True
        regexZeroFinal.Pattern = "(\.\d*[1-9])0+"
        Set regexPontoZero = CreateObject("VBScript.RegExp")
        regexPontoZero.Global = True
        regexPontoZero.Pattern = "\.0+"
    End If

    Dim resultado As String
    resultado = regexZeroFinal.Replace(valor, "$1")   ' "17.50" -> "17.5", "17.500" -> "17.5"
    resultado = regexPontoZero.Replace(resultado, "")  ' "20.0" -> "20", "20.00" -> "20"

    NormalizarZerosDecimais = resultado
End Function

' ==========================================================================
' Match LITERAL do valor exatamente como cadastrado na Referência, dentro da
' descrição crua — sem nenhuma outra transformação, EXCETO: trocar vírgula
' por ponto (decimal), remover zero à direita depois do ponto decimal
' (".50"/".5" tratados iguais), e testar o espaço de DUAS formas (espaço
' pode ser um separador decorativo, tipo "175/75 R13", OU pode estar no
' lugar de uma barra que faltou, tipo "520 85 R42" -> "520/85R42"):
'   1) espaço removido ("520 85 R42" -> "52085R42")
'   2) espaço virando "/" ("520 85 R42" -> "520/85/R42")
' Sem maiúscula, sem mexer em traço. Fica a mais longa em caso de mais de uma
' bater, entre as duas variantes. O valor GRAVADO continua sendo o original
' da Referência (com espaço/vírgula/zero, se tiver) — as trocas são só para
' efeito da COMPARAÇÃO.
' ==========================================================================
Private Function ExtrairDimensaoExata(descricaoCrua As String, dicGeoboxGlobalUnicos As Object) As String
    Dim descricaoComPonto As String
    descricaoComPonto = Replace(descricaoCrua, ",", ".")
    descricaoComPonto = NormalizarZerosDecimais(descricaoComPonto)

    Dim descricaoSemEspaco As String, descricaoEspacoViraBarra As String
    descricaoSemEspaco = Replace(descricaoComPonto, " ", "")
    descricaoEspacoViraBarra = Replace(descricaoComPonto, " ", "/")

    Dim melhor As String, melhorLen As Long
    melhor = ""
    melhorLen = 0

    Dim chaveG As Variant
    For Each chaveG In dicGeoboxGlobalUnicos.Keys
        Dim geoComPonto As String
        geoComPonto = Replace(CStr(chaveG), ",", ".")
        geoComPonto = NormalizarZerosDecimais(geoComPonto)

        Dim geoSemEspaco As String
        geoSemEspaco = Replace(geoComPonto, " ", "")

        If Len(geoSemEspaco) > melhorLen Then
            If InStr(1, descricaoSemEspaco, geoSemEspaco, vbTextCompare) > 0 _
               Or InStr(1, descricaoEspacoViraBarra, geoSemEspaco, vbTextCompare) > 0 Then
                melhorLen = Len(geoSemEspaco)
                melhor = CStr(chaveG)
            End If
        End If
    Next chaveG

    ExtrairDimensaoExata = melhor
End Function

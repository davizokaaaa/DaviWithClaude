Attribute VB_Name = "ExtrairGeobox"
Option Explicit

' ============================================================
' CONFIGURACAO - ajuste aqui se mudar caminho/nomes
' ============================================================
Const CAMINHO_REFERENCIA As String = "C:\Users\E125949\OneDrive - MFP Michelin\Área de Trabalho\Teste importados\Tabela_Referencia.xlsx"
Const ABA_REFERENCIA As String = "Referencia"
Const COL_REF_GEOBOX As Long = 1   ' coluna A da aba Referencia

' Coluna de origem, na planilha de dados, com o texto bruto
Const COL_DADOS_DESCRICAO As String = "H"   ' Descrição da mercadoria
Const NOME_COLUNA_NOVA As String = "Geobox"

' ============================================================
' MACRO PRINCIPAL
' Le a coluna H (Descrição da mercadoria) da planilha ativa.
' Para cada linha, verifica se algum valor da coluna A da
' Tabela_Referencia (aba Referencia) aparece EXATAMENTE (como
' substring, sem alterar o texto de nenhum dos dois lados) dentro
' do texto da coluna H. Se encontrar, escreve esse valor numa
' coluna nova chamada "Geobox", criada logo apos a ultima coluna
' com dados. Se nao encontrar nenhum, deixa a celula em branco.
' ============================================================
Sub PreencherColunaGeobox()
    Dim wsDados As Worksheet
    Dim wbRef As Workbook
    Dim wsRef As Worksheet
    Dim jaEstavaAberta As Boolean

    Dim listaGeobox() As String
    Dim ultimaLinhaRef As Long
    Dim i As Long, j As Long, n As Long

    Dim colNovaNum As Long
    Dim ultimaLinhaDados As Long
    Dim texto As String
    Dim achou As String
    Dim tmp As String

    Set wsDados = ActiveSheet

    ' --- Abre (ou reaproveita) a planilha de referencia ---
    jaEstavaAberta = False
    On Error Resume Next
    Set wbRef = Workbooks("Tabela_Referencia.xlsx")
    On Error GoTo 0
    If Not wbRef Is Nothing Then
        jaEstavaAberta = True
    Else
        Set wbRef = Workbooks.Open(CAMINHO_REFERENCIA, ReadOnly:=True)
    End If

    Set wsRef = wbRef.Sheets(ABA_REFERENCIA)

    ' --- Carrega os valores da coluna A da referencia numa lista ---
    ultimaLinhaRef = wsRef.Cells(wsRef.Rows.Count, COL_REF_GEOBOX).End(xlUp).Row
    n = 0
    ReDim listaGeobox(1 To ultimaLinhaRef) ' tamanho maximo possivel

    For i = 2 To ultimaLinhaRef ' linha 1 = cabecalho
        tmp = Trim(CStr(wsRef.Cells(i, COL_REF_GEOBOX).Value))
        If tmp <> "" Then
            n = n + 1
            listaGeobox(n) = tmp
        End If
    Next i
    ReDim Preserve listaGeobox(1 To n)

    If Not jaEstavaAberta Then wbRef.Close SaveChanges:=False

    ' --- Ordena a lista do texto MAIS LONGO para o MAIS CURTO ---
    ' (evita que um valor curto "case" por engano dentro de um mais especifico)
    Dim a As Long, b As Long
    For a = 1 To n - 1
        For b = a + 1 To n
            If Len(listaGeobox(b)) > Len(listaGeobox(a)) Then
                tmp = listaGeobox(a)
                listaGeobox(a) = listaGeobox(b)
                listaGeobox(b) = tmp
            End If
        Next b
    Next a

    ' --- Cria a coluna nova "Geobox" logo apos a ultima coluna com dados ---
    colNovaNum = wsDados.Cells(1, wsDados.Columns.Count).End(xlToLeft).Column + 1
    wsDados.Cells(1, colNovaNum).Value = NOME_COLUNA_NOVA

    ' --- Percorre a coluna H e procura match exato dentro do texto ---
    ultimaLinhaDados = wsDados.Cells(wsDados.Rows.Count, COL_DADOS_DESCRICAO).End(xlUp).Row

    For i = 2 To ultimaLinhaDados
        texto = CStr(wsDados.Range(COL_DADOS_DESCRICAO & i).Value)
        achou = ""

        For j = 1 To n
            If InStr(1, texto, listaGeobox(j), vbBinaryCompare) > 0 Then
                achou = listaGeobox(j)
                Exit For
            End If
        Next j

        wsDados.Cells(i, colNovaNum).Value = achou
    Next i

    MsgBox "Concluido! " & (ultimaLinhaDados - 1) & " linhas processadas.", vbInformation
End Sub

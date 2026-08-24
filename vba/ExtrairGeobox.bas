Attribute VB_Name = "ExtrairGeobox"
Option Explicit

' Extrai a "geobox" (medida do pneu, ex: 175/65R14 82T) de um texto
' que mistura descricao, marca, modelo, familia, certificado, registro etc.
'
' Uso na planilha:
'   =ExtrairGeobox(A1)
'
' Padrao reconhecido:
'   BANDA/SERIE[Z]R ARO[.5] [PR opcional] [indice de carga/velocidade opcional]
'   Ex: 175/65R14 82T
'       215/55ZR17 98W
'       215/75R17.5 16PR 127/124M
'       205/40ZR17 84W
'
' Limitacao conhecida: formatos com indice de carga e simbolo de velocidade
' separados por espaco (ex: "225/65 R16 C 112/110 R") retornam apenas a
' parte "225/65 R16" - revisar manualmente esses casos.

Function ExtrairGeobox(ByVal texto As String) As String
    Dim re As Object
    Dim m As Object

    Set re = CreateObject("VBScript.RegExp")
    re.Global = False
    re.IgnoreCase = True
    re.Pattern = "\d{3}\s?/\s?\d{2,3}\s?Z?R\s?\d{2}(?:\.\d)?(?:\s+\d{1,3}PR)?(?:\s+\d{2,3}(?:/\d{2,3})?[A-Z]{1,3})?"

    If re.Test(texto) Then
        Set m = re.Execute(texto)
        ExtrairGeobox = Trim(m(0).Value)
    Else
        ExtrairGeobox = ""
    End If

    Set m = Nothing
    Set re = Nothing
End Function

' Variante que preenche em lote uma coluna de destino a partir de uma
' coluna de origem, na mesma planilha ativa.
' colOrigem/colDestino: letras da coluna, ex: "A", "B"
' linhaInicial: primeira linha com dados (pule cabecalho)
Sub PreencherGeoboxColuna(colOrigem As String, colDestino As String, linhaInicial As Long)
    Dim ws As Worksheet
    Dim ultimaLinha As Long
    Dim i As Long

    Set ws = ActiveSheet
    ultimaLinha = ws.Cells(ws.Rows.Count, colOrigem).End(xlUp).Row

    For i = linhaInicial To ultimaLinha
        ws.Range(colDestino & i).Value = ExtrairGeobox(ws.Range(colOrigem & i).Value)
    Next i
End Sub

Attribute VB_Name = "modMarca"
Option Explicit

' ==========================================================================
' MODULO: modMarca
' Extração da coluna MARCA a partir da DESCRIÇÃODA MERCADORIA.
' ==========================================================================

' ==========================================================================
' Extrai a MARCA: 1) checa primeiro o dicionário de EXCEÇÕES (erros de
' digitação/apelidos conhecidos, ex: "MGNUM" -> "MAGNUM", "X WORKS" ->
' "MICHELIN") — igual fazia a macro legada, antes de qualquer outra coisa.
' 2) Se não bater nenhuma exceção, busca cega na descrição inteira por
' qualquer marca conhecida (arrMarcas, que reúne as marcas da Tabela de
' Referência + da aba "MarcasExtras"/"MarcasExtra", da mais longa p/ mais
' curta — ver modReferencia.CarregarTabelaReferencia).
' 3) Se não achar nada, retorna "".
' ==========================================================================
Function ExtrairMarca(descricao As String, arrMarcas() As String, dicExcecoesMarca As Object) As String

    Dim chaveExc As Variant
    For Each chaveExc In dicExcecoesMarca.Keys
        If InStr(1, descricao, CStr(chaveExc), vbTextCompare) > 0 Then
            ExtrairMarca = dicExcecoesMarca(chaveExc)
            Exit Function
        End If
    Next chaveExc

    ExtrairMarca = BuscarMarcaConhecida(descricao, arrMarcas)

End Function

' ==========================================================================
' Procura, dentro de um texto, qual marca conhecida (arrMarcas, já ordenado
' da mais longa p/ mais curta) aparece. Retorna "" se nenhuma for encontrada.
' ==========================================================================
Function BuscarMarcaConhecida(texto As String, arrMarcas() As String) As String
    Dim i As Long
    For i = LBound(arrMarcas) To UBound(arrMarcas)
        If Len(arrMarcas(i)) > 0 Then
            If InStr(1, texto, arrMarcas(i), vbTextCompare) > 0 Then
                BuscarMarcaConhecida = arrMarcas(i)
                Exit Function
            End If
        End If
    Next i
    BuscarMarcaConhecida = ""
End Function

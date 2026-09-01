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
'
' somenteMinBr: em BR/MIN, a busca cega (passo 2) exige LIMITE DE PALAVRA —
' uma marca curta (ex: "GRI") só conta se aparecer como token isolado, não
' colada dentro de outra palavra (ex: "GRI" dentro de "AGRICOLA" NÃO conta
' mais). Fora de BR/MIN, mantém o comportamento antigo (substring livre),
' sem risco de mudar resultado que já estava certo em outras bases.
' ==========================================================================
Function ExtrairMarca(descricao As String, arrMarcas() As String, dicExcecoesMarca As Object, _
                       Optional somenteMinBr As Boolean = False) As String

    Dim chaveExc As Variant
    For Each chaveExc In dicExcecoesMarca.Keys
        If InStr(1, descricao, CStr(chaveExc), vbTextCompare) > 0 Then
            ExtrairMarca = dicExcecoesMarca(chaveExc)
            Exit Function
        End If
    Next chaveExc

    If somenteMinBr Then
        ExtrairMarca = BuscarMarcaConhecidaComLimite(descricao, arrMarcas)
    Else
        ExtrairMarca = BuscarMarcaConhecida(descricao, arrMarcas)
    End If

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

' ==========================================================================
' Escapa caracteres especiais de regex num texto literal (pra usar como
' padrão exato dentro de \b...\b, sem que "." "+" "(" etc. sejam
' interpretados como metacaracteres).
' ==========================================================================
Private Function EscaparRegex(texto As String) As String
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
    EscaparRegex = resultado
End Function

' ==========================================================================
' Mesma busca de BuscarMarcaConhecida, mas exigindo LIMITE DE PALAVRA (\b)
' nos dois lados — evita que uma marca curta bata só por estar colada dentro
' de outra palavra (ex: "GRI" dentro de "AGRICOLA"). Usada só em modo
' BR/MIN (ver ExtrairMarca).
' ==========================================================================
Function BuscarMarcaConhecidaComLimite(texto As String, arrMarcas() As String) As String
    Static regex As Object
    If regex Is Nothing Then
        Set regex = CreateObject("VBScript.RegExp")
        regex.Global = False
        regex.IgnoreCase = True
    End If

    Dim i As Long
    For i = LBound(arrMarcas) To UBound(arrMarcas)
        If Len(arrMarcas(i)) > 0 Then
            regex.Pattern = "\b" & EscaparRegex(arrMarcas(i)) & "\b"
            If regex.Test(texto) Then
                BuscarMarcaConhecidaComLimite = arrMarcas(i)
                Exit Function
            End If
        End If
    Next i
    BuscarMarcaConhecidaComLimite = ""
End Function

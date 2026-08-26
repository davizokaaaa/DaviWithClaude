Attribute VB_Name = "modGama"
Option Explicit

' ==========================================================================
' MODULO: modGama
' Extração da coluna GAMA a partir da DESCRIÇÃODA MERCADORIA.
' Mesmo modelo de modMarca.bas: exceções/abreviações primeiro (aba
' "ExcecoesGama" — ex: "PTNZ" -> "POTENZA", "TRNZ" -> "TURANZA"), depois
' busca cega pelo nome completo da gama na descrição.
' ==========================================================================

' ==========================================================================
' Extrai a GAMA: 1) checa primeiro o dicionário de EXCEÇÕES/abreviações
' (dicExcecoesGama, aba "ExcecoesGama") — cobre siglas curtas que a macro
' não teria como adivinhar sozinha. 2) Se não bater nenhuma exceção, busca
' primeiro só entre as GAMAS conhecidas DAQUELA marca (mais rápido e mais
' preciso — evita, por ex., uma gama de outro fabricante bater por
' coincidência). 3) Se não achar assim, faz busca ampla em todas as gamas
' conhecidas de todas as marcas. 4) Se não achar nada, retorna "".
' ==========================================================================
Function ExtrairGama(descricao As String, marca As String, _
                      dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, _
                      dicExcecoesGama As Object) As String

    Dim chaveExc As Variant
    For Each chaveExc In dicExcecoesGama.Keys
        If InStr(1, descricao, CStr(chaveExc), vbTextCompare) > 0 Then
            ExtrairGama = dicExcecoesGama(chaveExc)
            Exit Function
        End If
    Next chaveExc

    If Len(marca) > 0 Then
        If dicGamasPorMarca.Exists(marca) Then
            Dim gamaCand As Variant
            For Each gamaCand In dicGamasPorMarca(marca)
                If Len(CStr(gamaCand)) > 0 Then
                    If InStr(1, descricao, CStr(gamaCand), vbTextCompare) > 0 Then
                        ExtrairGama = CStr(gamaCand)
                        Exit Function
                    End If
                End If
            Next gamaCand
        End If
    End If

    Dim chaveG As Variant
    For Each chaveG In dicGamaGlobalUnicos.Keys
        If InStr(1, descricao, CStr(chaveG), vbTextCompare) > 0 Then
            ExtrairGama = CStr(chaveG)
            Exit Function
        End If
    Next chaveG

    ExtrairGama = ""
End Function

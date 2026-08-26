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
' Normaliza texto SÓ para efeito de comparação (nunca é gravado): remove
' espaço, barra, hífen e ponto, e coloca em maiúsculas. Resolve casos como
' catálogo com "FORZA H/T2" (barra, sem espaço antes do "2") vs. descrição
' com "FORZA HT 2" (sem barra, com espaço) — sem essa normalização, a
' comparação por substring exata nunca bateria, mesmo sendo claramente a
' mesma gama. Aplicada nos dois lados (descrição e valor do catálogo) antes
' de qualquer InStr — a gama GRAVADA continua sendo a forma original do
' catálogo, nunca a normalizada.
' ==========================================================================
Private Function NormalizarParaComparacao(texto As String) As String
    Dim resultado As String
    resultado = UCase(texto)
    resultado = Replace(resultado, " ", "")
    resultado = Replace(resultado, "/", "")
    resultado = Replace(resultado, "-", "")
    resultado = Replace(resultado, ".", "")
    NormalizarParaComparacao = resultado
End Function

' ==========================================================================
' Extrai a GAMA: 1) checa primeiro o dicionário de EXCEÇÕES/abreviações
' (dicExcecoesGama, aba "ExcecoesGama") — cobre siglas curtas que a macro
' não teria como adivinhar sozinha. 2) Se não bater nenhuma exceção e a
' MARCA já foi identificada, busca primeiro só entre as GAMAS conhecidas
' DAQUELA marca (mais rápido e mais preciso — evita, por ex., uma gama de
' outro fabricante bater por coincidência). 3) Se não achar assim (ou se a
' marca nem foi identificada), faz busca ampla em todas as gamas
' conhecidas de todas as marcas. 4) Se não achar nada, retorna "".
' Todas as comparações (exceto exceções, que já costumam ser siglas exatas)
' são feitas via NormalizarParaComparacao, tolerando diferença de espaço/
' barra/hífen/ponto entre o texto do catálogo e o da descrição.
'
' GAMA é tratada como praticamente exclusiva de uma marca: sempre que ela é
' descoberta (em qualquer um dos passos acima) e a MARCA da linha ainda
' está vazia, a marca é preenchida também (ByRef) com a dona daquela gama
' (dicMarcaPorGama, montado em modReferencia a partir da própria Tabela de
' Referência) — cobre o caso de uma marca não ter sido lida na descrição,
' mas a gama (mais específica) sim.
' ==========================================================================
Function ExtrairGama(descricao As String, ByRef marca As String, _
                      dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, _
                      dicMarcaPorGama As Object, dicExcecoesGama As Object) As String

    Dim descNorm As String
    descNorm = NormalizarParaComparacao(descricao)

    Dim chaveExc As Variant
    For Each chaveExc In dicExcecoesGama.Keys
        If InStr(1, descricao, CStr(chaveExc), vbTextCompare) > 0 Then
            ExtrairGama = dicExcecoesGama(chaveExc)
            If Len(marca) = 0 And dicMarcaPorGama.Exists(ExtrairGama) Then
                marca = CStr(dicMarcaPorGama(ExtrairGama))
            End If
            Exit Function
        End If
    Next chaveExc

    If Len(marca) > 0 Then
        If dicGamasPorMarca.Exists(marca) Then
            Dim gamaCand As Variant
            For Each gamaCand In dicGamasPorMarca(marca)
                If Len(CStr(gamaCand)) > 0 Then
                    If InStr(1, descNorm, NormalizarParaComparacao(CStr(gamaCand)), vbTextCompare) > 0 Then
                        ExtrairGama = CStr(gamaCand)
                        Exit Function
                    End If
                End If
            Next gamaCand
        End If
    End If

    ' --- Busca cega em todas as gamas conhecidas — roda mesmo com marca   ---
    ' --- vazia (é justamente o caso que resolve: marca não identificada). ---
    Dim chaveG As Variant
    For Each chaveG In dicGamaGlobalUnicos.Keys
        If InStr(1, descNorm, NormalizarParaComparacao(CStr(chaveG)), vbTextCompare) > 0 Then
            ExtrairGama = CStr(chaveG)
            If Len(marca) = 0 And dicMarcaPorGama.Exists(ExtrairGama) Then
                marca = CStr(dicMarcaPorGama(ExtrairGama))
            End If
            Exit Function
        End If
    Next chaveG

    ExtrairGama = ""
End Function

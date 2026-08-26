Attribute VB_Name = "modGama"
Option Explicit

' ==========================================================================
' MODULO: modGama
' Extração da coluna GAMA a partir da DESCRIÇÃODA MERCADORIA.
' Mesmo modelo de modMarca.bas: exceções/abreviações primeiro (aba
' "ExcecoesGama" — ex: "PTNZ" -> "POTENZA", "TRNZ" -> "TURANZA"), depois
' busca pelo nome completo (ou por palavra-chave) da gama na descrição.
' ==========================================================================

' ==========================================================================
' Normaliza texto SÓ para efeito de comparação (nunca é gravado): remove
' espaço, barra, hífen e ponto, e coloca em maiúsculas.
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
' Conta quantas PALAVRAS de um nome de gama (candidato) aparecem na
' descrição já normalizada. Quebra o candidato em palavras por espaço, "/",
' "-" e "." (ex: "FORZA H/T2" -> "FORZA", "H", "T2") e ignora palavras
' curtas demais (< 4 caracteres) pra não confiar num match tipo "AT" ou
' "H" sozinho, que apareceria em qualquer texto por acaso.
' ==========================================================================
Private Function ContarPalavrasBatendo(candidato As String, descNorm As String) As Long
    Dim texto As String
    texto = candidato
    texto = Replace(texto, "/", " ")
    texto = Replace(texto, "-", " ")
    texto = Replace(texto, ".", " ")

    Dim palavras() As String
    palavras = Split(texto, " ")

    Dim contagem As Long, p As Variant
    contagem = 0
    For Each p In palavras
        If Len(CStr(p)) >= 4 Then
            If InStr(1, descNorm, NormalizarParaComparacao(CStr(p)), vbTextCompare) > 0 Then
                contagem = contagem + 1
            End If
        End If
    Next p
    ContarPalavrasBatendo = contagem
End Function

' ==========================================================================
' Varre uma lista de candidatos de GAMA (Collection ou array de chaves de
' Dictionary) e devolve o que tiver MAIS palavras batendo na descrição
' (desempate: nome de gama mais longo). Devolve "" se nenhum candidato
' teve nenhuma palavra batendo.
' ==========================================================================
Private Function BuscarGamaPorPalavraChave(candidatos As Variant, descNorm As String) As String
    Dim melhorGama As String, melhorPontuacao As Long, melhorLen As Long
    melhorGama = ""
    melhorPontuacao = 0
    melhorLen = 0

    Dim item As Variant
    For Each item In candidatos
        Dim cand As String
        cand = CStr(item)
        If Len(cand) > 0 Then
            Dim pontos As Long
            pontos = ContarPalavrasBatendo(cand, descNorm)
            If pontos > 0 Then
                If pontos > melhorPontuacao Or (pontos = melhorPontuacao And Len(cand) > melhorLen) Then
                    melhorPontuacao = pontos
                    melhorGama = cand
                    melhorLen = Len(cand)
                End If
            End If
        End If
    Next item

    BuscarGamaPorPalavraChave = melhorGama
End Function

' ==========================================================================
' Extrai a GAMA em camadas, da mais confiável pra mais permissiva:
'   1) Exceções/abreviações (dicExcecoesGama, aba "ExcecoesGama").
'   2) Nome completo da gama (normalizado contra espaço/barra/hífen/ponto),
'      primeiro só entre as gamas DAQUELA marca, depois busca ampla.
'   3) Se não achou nada assim, cai numa busca por PALAVRA-CHAVE: quebra
'      cada gama conhecida em palavras e vê se pelo menos uma (>= 4
'      caracteres) aparece na descrição — primeiro só nas gamas da marca já
'      identificada, depois busca ampla. Mais permissivo, mas escala melhor
'      que ficar caçando exceção de pontuação linha por linha; se overmatch
'      demais em algum caso real, dá pra restringir de volta esse passo.
' Se nada bateu em nenhuma camada, retorna "".
'
' GAMA é tratada como praticamente exclusiva de uma marca: sempre que ela é
' descoberta (em qualquer camada acima) e a MARCA da linha ainda está
' vazia, a marca é preenchida também (ByRef) com a dona daquela gama
' (dicMarcaPorGama, montado em modReferencia a partir da própria Tabela de
' Referência).
' ==========================================================================
Function ExtrairGama(descricao As String, ByRef marca As String, _
                      dicGamasPorMarca As Object, dicGamaGlobalUnicos As Object, _
                      dicMarcaPorGama As Object, dicExcecoesGama As Object) As String

    Dim descNorm As String
    descNorm = NormalizarParaComparacao(descricao)

    ' --- Camada 1: exceções/abreviações ---
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

    ' --- Camada 2: nome completo (normalizado), marca conhecida primeiro ---
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

    ' --- Camada 2: nome completo (normalizado), busca ampla ---
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

    ' --- Camada 3: palavra-chave, marca conhecida primeiro ---
    Dim resultadoPalavra As String
    If Len(marca) > 0 Then
        If dicGamasPorMarca.Exists(marca) Then
            resultadoPalavra = BuscarGamaPorPalavraChave(dicGamasPorMarca(marca), descNorm)
            If Len(resultadoPalavra) > 0 Then
                ExtrairGama = resultadoPalavra
                Exit Function
            End If
        End If
    End If

    ' --- Camada 3: palavra-chave, busca ampla ---
    resultadoPalavra = BuscarGamaPorPalavraChave(dicGamaGlobalUnicos.Keys, descNorm)
    If Len(resultadoPalavra) > 0 Then
        ExtrairGama = resultadoPalavra
        If Len(marca) = 0 And dicMarcaPorGama.Exists(ExtrairGama) Then
            marca = CStr(dicMarcaPorGama(ExtrairGama))
        End If
        Exit Function
    End If

    ExtrairGama = ""
End Function

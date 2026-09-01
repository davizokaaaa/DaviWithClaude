Attribute VB_Name = "modClassificacaoRegras"
Option Explicit

' ==========================================================================
' MODULO: modClassificacaoRegras
' Regras de negocio "puras" de classificacao: deducao de LP a partir do
' SEGMENTO e a regra de ARO terminado em ".5" forcando LP="PL".
' (RT/OE e ANIP ficam direto no orquestrador por serem checagens simples
' de uma linha só contra um dicionário; ObterSegmentoELpPorDimensao está
' em modReferencia por depender da Tabela de Referência carregada.)
' ==========================================================================

' ==========================================================================
' Deduz a LP a partir do SEGMENTO (TIPO PRODUTO):
'   TLD, PPL -> PL
'   PC, REC, COM -> TC
'   Qualquer outro caso (incl. vazio) -> vazio
' ==========================================================================
Function DeduzirLp(segmento As String) As String

    Select Case UCase(Trim(segmento))
        Case "TLD", "PPL", "BUS"
            DeduzirLp = "PL"
        Case "PC", "REC", "COM"
            DeduzirLp = "TC"
        Case "DM"
            DeduzirLp = "BR"
        Case Else
            DeduzirLp = ""
    End Select

End Function

' ==========================================================================
' Verifica se o ARO termina em ".5" (ex: R17.5, R19.5, R22.5, R24.5) —
' regra que força LP = "PL", independente do que o SEGMENTO indicaria.
' ==========================================================================
Function AroTerminaEmMeio(aro As String) As Boolean
    AroTerminaEmMeio = (Right(Trim(aro), 2) = ".5")
End Function

' ==========================================================================
' Override de LP a partir do TIPO PRODUTO (SEGMENTO) — SÓ pra bases BR/MIN
' (chamado de modMain só quando somenteMinBr = True). O LP vindo da Tabela
' de Referência/dedução normal pode vir incompatível com o TIPO PRODUTO
' nessa base; essa regra tem prioridade final sobre tudo o que veio antes
' (busca por GEOBOX, DeduzirLp, regra do ARO ".5").
'   AG, CL, CO, COLHEITADEIRA, COLHEITADEIRA/HPT, COMPACT, DM, FLORESTAL,
'   HPT, IMPLEMENTO, INDUS, INFRA, LPT, MH, MILITAR, MPT, PÁ CARREGADEIRA,
'   PNEUMÁTICO, PORTOS, PORTS, PULVERIZADOR, SÓLIDO -> "BR"
'   MIN -> "MIN"
'   Qualquer outro TIPO PRODUTO (incl. vazio) -> "" (não força nada, mantém
'   o LP que já tinha sido determinado antes desta regra).
' ==========================================================================
Function DeduzirLpBrMin(segmento As String) As String
    Static dicSegmentosBr As Object
    If dicSegmentosBr Is Nothing Then
        Set dicSegmentosBr = CreateObject("Scripting.Dictionary")
        dicSegmentosBr.Add "AG", True
        dicSegmentosBr.Add "CL", True
        dicSegmentosBr.Add "CO", True
        dicSegmentosBr.Add "COLHEITADEIRA", True
        dicSegmentosBr.Add "COLHEITADEIRA/HPT", True
        dicSegmentosBr.Add "COMPACT", True
        dicSegmentosBr.Add "DM", True
        dicSegmentosBr.Add "FLORESTAL", True
        dicSegmentosBr.Add "HPT", True
        dicSegmentosBr.Add "IMPLEMENTO", True
        dicSegmentosBr.Add "INDUS", True
        dicSegmentosBr.Add "INFRA", True
        dicSegmentosBr.Add "LPT", True
        dicSegmentosBr.Add "MH", True
        dicSegmentosBr.Add "MILITAR", True
        dicSegmentosBr.Add "MPT", True
        dicSegmentosBr.Add "PÁ CARREGADEIRA", True
        dicSegmentosBr.Add "PNEUMÁTICO", True
        dicSegmentosBr.Add "PORTOS", True
        dicSegmentosBr.Add "PORTS", True
        dicSegmentosBr.Add "PULVERIZADOR", True
        dicSegmentosBr.Add "SÓLIDO", True
    End If

    Dim segNorm As String
    segNorm = UCase(Trim(segmento))

    If segNorm = "MIN" Then
        DeduzirLpBrMin = "MIN"
    ElseIf dicSegmentosBr.Exists(segNorm) Then
        DeduzirLpBrMin = "BR"
    Else
        DeduzirLpBrMin = ""
    End If
End Function

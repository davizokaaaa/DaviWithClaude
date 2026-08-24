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

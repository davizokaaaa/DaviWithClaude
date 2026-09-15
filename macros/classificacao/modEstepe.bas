Attribute VB_Name = "modEstepe"
Option Explicit

' ==========================================================================
' MODULO: modEstepe
' Classificação da coluna ESTEPE/LCV a partir da DESCRIÇÃODA MERCADORIA —
' portado da macro legada "estepe()", que rodava sozinha e escrevia numa
' coluna fixa (T) a partir da coluna H. Aqui reaproveita o texto já lido e
' normalizado (UCase+Trim) pelo laço principal de modMain.ClassificarTudo,
' em vez de reler/reprocessar a célula — mais rápido e sem depender de
' posição fixa de coluna.
' ==========================================================================

' ==========================================================================
' Lista de (padrão -> resultado), na MESMA ordem de prioridade da macro
' legada (primeiro match vence, igual ao ElseIf original): ESTEPE antes de
' CAMPEONATO/COMPETIÇÃO, e essas antes das medidas específicas de LCV.
' Montada uma única vez (Static) em vez de recriada a cada linha.
' ==========================================================================
Function ClassificarEstepe(textoNorm As String) As String
    Static padroes() As Variant
    Static totalPadroes As Long

    If totalPadroes = 0 Then
        padroes = Array( _
            Array("ESTEPE", "ESTEPE"), _
            Array("CAMPEONATO", "CAMPEONATO"), _
            Array("COMPETICAO", "COMPETICAO"), _
            Array("225/65 R16 C", "LCV"), _
            Array("BANDA: 225, SÉRIE: 75R, ARO: 16C", "LCV"), _
            Array("BANDA: 205, SÉRIE: 75R, ARO: 16C", "LCV"), _
            Array("CODIFICAÇÃO 16C", "LCV"), _
            Array("225/75R16C", "LCV"), _
            Array("205/75R16C", "LCV"), _
            Array("195/75R16C", "LCV"), _
            Array("215/65R16C", "LCV"), _
            Array("195/65R16C", "LCV") _
        )
        totalPadroes = UBound(padroes) - LBound(padroes) + 1
    End If

    Dim i As Long
    For i = LBound(padroes) To UBound(padroes)
        If InStr(1, textoNorm, CStr(padroes(i)(0)), vbTextCompare) > 0 Then
            ClassificarEstepe = CStr(padroes(i)(1))
            Exit Function
        End If
    Next i

    ClassificarEstepe = ""
End Function

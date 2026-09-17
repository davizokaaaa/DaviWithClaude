Attribute VB_Name = "AtualizarANIP"
' Macro para o botao "Atualizar ANIP" na planilha.
' Ajuste PYTHON_EXE e SCRIPT_PATH para os caminhos reais na sua maquina.

Sub AtualizarANIP()
    Dim pythonExe As String
    Dim scriptPath As String
    Dim comando As String

    pythonExe = "C:\Bib\Prod\Miniforge3\python.exe"
    scriptPath = "C:\Users\E125949\OneDrive - MFP Michelin\Scripts\ANIP Report\anip_report.py"

    ThisWorkbook.Save ' garante que nao ha alteracoes pendentes antes de o script reabrir o arquivo

    comando = """" & pythonExe & """ """ & scriptPath & """"

    MsgBox "Atualizando dados do ANIP... isso pode levar alguns segundos." & vbCrLf & _
           "Clique OK e aguarde a planilha recarregar.", vbInformation

    Shell comando, vbNormalFocus

    MsgBox "Script disparado. Quando ele terminar, feche e reabra a planilha " & _
           "(ou va em Arquivo > Recarregar) para ver os dados atualizados.", vbInformation
End Sub

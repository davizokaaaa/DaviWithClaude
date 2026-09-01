Attribute VB_Name = "modConfig"
Option Explicit

' ==========================================================================
' MODULO: modConfig
' Constantes de configuracao global da macro de classificacao.
' ==========================================================================

Public Const REF_FILE_PATH As String = "C:\Users\E125949\OneDrive - MFP Michelin\Área de Trabalho\Teste importados\Tabela_Referencia.xlsx"
Public Const COL_ADQUIRENTE_NOME As String = "PROVÁVEL ADQUIRENTE"
Public Const MOSTRAR_DIAGNOSTICO_REFERENCIA As Boolean = True ' mude para False depois de confirmar que está lendo certo

' Quando True, cria uma coluna extra "DIMENSÃO (TESTE EXATO)" com um DE-PARA
' cego: match LITERAL do valor exato cadastrado na Referência dentro da
' descrição crua (sem nenhuma normalização — nem maiúscula, nem espaço, nem
' vírgula->ponto). Serve só pra medir quantas linhas já batem sem qualquer
' tratamento, sem afetar a coluna DIMENSÃO real (essa continua usando toda a
' extração normal). Desligue (False) depois de rodar o teste.
Public Const MODO_TESTE_MATCH_EXATO As Boolean = True

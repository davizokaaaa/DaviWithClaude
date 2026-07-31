# Central de Atividades (Artifact + Drive + Routine)

## Arquitetura

- **Fonte de verdade**: `central-atividades.json` no Google Drive do usuário. O conector Drive não expõe uma ferramenta de atualização in-place, só `create_file` — cada gravação cria uma nova versão; leitores sempre buscam por título (`search_files`, query `title = 'central-atividades.json'`) e pegam a mais recente por `modifiedTime`/`createdTime`.
- **UI**: Artifact publicado (`central-atividades.html`, favicon 🗂️), capability `mcp` declarada para o conector "Google Drive" (`search_files`, `create_file`, `download_file_content`). Roda inteiramente client-side, sem backend.
- **Execução autônoma**: Routine (trigger) `Central de Atividades — execução autônoma`, cron diário (`0 12 * * *`, ~meio-dia UTC), vinculada por self-bind à sessão que tem o conector Drive conectado — não a `create_new_session_on_fire`, porque triggers criados via MCP tool nesta org não conseguem carregar connectors para sessões novas (`connectors` param indisponível para a org; sessões fresh-per-fire nascem sem `mcp__Google_Drive__*`). O self-bind reaproveita os conectores já concedidos à sessão persistente.
- **Loop de execução**: para cada atividade `autonoma: true` e pendente, a Routine roda um ciclo executor → crítico (via Agent tool) até aprovação ou um teto de 5 rounds; grava progresso/resultado de volta no JSON e faz commit de um snapshot em `notes/activity-log/<data>.json`.

## Limitações conhecidas

- Sem ferramenta de update/delete no Drive: versões antigas do JSON se acumulam (aceitável, funciona como histórico bruto).
- Self-bind depende da sessão persistente continuar existindo e mantendo o conector Drive válido; se a sessão expirar ou o conector for revogado, a Routine para de funcionar silenciosamente até reconexão.
- Trigger IDs: `trig_01BujLwkZMrRMj6eduRZbT9X`.

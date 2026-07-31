# Agent SDK — aprendizados

## Autenticação

Neste ambiente, `claude-agent-sdk` (Python) não precisa de `ANTHROPIC_API_KEY` separada — ele invoca o `claude` CLI local, que já está autenticado. Fora deste ambiente (ex: produção, CI sem Claude Code instalado), será necessário configurar autenticação explícita.

## Trust dialog

Rodar `query()` fora de uma sessão interativa do Claude Code gera este aviso:

```
Ignoring N permissions.allow entries from .claude/settings.json: this workspace
has not been trusted. Run Claude Code interactively here once and accept the
trust dialog, or set projects["<path>"].hasTrustDialogAccepted: true in
~/.claude.json.
```

As regras de `allow` do `settings.json` são ignoradas até o workspace ser "trusted". Isso não impede a execução (o `canUseTool` callback / permission mode ainda se aplica), só significa que os atalhos de allow não valem enquanto isso.

## Loop básico

O menor harness possível: `query(prompt=..., options=ClaudeAgentOptions(...))` é um generator assíncrono que emite `SystemMessage` → `AssistantMessage` (com tool calls, se houver) → `UserMessage` (resultado de tools) → repete → `ResultMessage` final. Ver `harness/basic_loop.py`.

## Testes de integração

Testes que chamam a API de verdade custam tempo e dinheiro — marcados com `@pytest.mark.integration` e excluídos por padrão via `addopts = "-m 'not integration'"` no `pyproject.toml`. Rodar com `uv run pytest -m integration` quando necessário.

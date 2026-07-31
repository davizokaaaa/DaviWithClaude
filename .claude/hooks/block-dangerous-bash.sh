#!/usr/bin/env bash
# PreToolUse hook: denies destructive shell commands regardless of permission mode.
# Reads the tool call JSON from stdin, checks the Bash command string against a denylist.

set -euo pipefail

input=$(cat)
command=$(echo "$input" | jq -r '.tool_input.command // empty')

deny_patterns=(
  'rm[[:space:]]+-rf[[:space:]]+/'
  'rm[[:space:]]+-rf[[:space:]]+\*'
  'git[[:space:]]+push[[:space:]]+.*--force'
  'git[[:space:]]+reset[[:space:]]+--hard'
  ':\(\)\{.*\|.*&.*\};'
)

for pattern in "${deny_patterns[@]}"; do
  if echo "$command" | grep -qE "$pattern"; then
    jq -n --arg reason "Blocked by block-dangerous-bash.sh: command matches denylist pattern ($pattern)" \
      '{hookSpecificOutput: {permissionDecision: "deny", permissionDecisionReason: $reason}}'
    exit 0
  fi
done

exit 0

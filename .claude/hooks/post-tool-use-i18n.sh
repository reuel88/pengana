#!/usr/bin/env bash
# PostToolUse hook: reminds Claude to propagate translations after editing source locale files.

set -euo pipefail

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')

if [ -z "$file_path" ]; then
  exit 0
fi

# Only trigger for en-US or en-AU locale files
if [[ "$file_path" =~ packages/i18n/src/locales/(en-US|en-AU)/ ]]; then
  namespace=$(basename "$file_path")
  source_locale="${BASH_REMATCH[1]}"

  cat <<EOF
{
  "additionalContext": "TRANSLATION REQUIRED: You just edited the source locale file '${source_locale}/${namespace}'. You MUST now propagate these changes to the same namespace file in ALL target locales: ar, es, fr, ko, pt-BR, ru, tl, vi, zh$([ "$source_locale" = "en-US" ] && echo ", en-AU" || echo ", en-US"). Translation guidelines: (1) Preserve all interpolation variables like {{name}} exactly as-is. (2) Use natural, native-sounding phrasing for each language — avoid literal word-for-word translation. (3) Preserve the JSON structure and key names exactly. (4) Only translate the values, never the keys. (5) For RTL languages (ar), ensure text direction is handled by the i18n framework — just provide the translated string. IMPORTANT: Launch the i18n-translation-auditor agent IN THE BACKGROUND (run_in_background: true) so your current work is not blocked."
}
EOF
fi

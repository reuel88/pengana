# Codex Instructions

After making any code or config changes, before sending the final response, run these commands from the repo root in order:

1. `pnpm check`
2. `pnpm check-types`
3. `pnpm test`

If a command fails:
- do not ignore it
- report the failure clearly in the final response
- include the failing command and the relevant error summary
- only skip a command if the user explicitly tells you to skip it

Do not run these commands for planning-only, review-only, or explanation-only turns that do not change files.

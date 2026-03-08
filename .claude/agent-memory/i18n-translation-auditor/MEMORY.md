# i18n Translation Auditor Memory

## File Structure
- Location: `packages/i18n/src/locales/{locale}/{namespace}.json`
- Format: JSON with tab indentation, no trailing commas
- Base language: `en-US`
- Locales: ar, en-AU, en-US, es, fr, ko, pt-BR, ru, tl, vi, zh
- Namespaces: auth, common, dashboard, errors, notifications, onboarding, organization, sync, todos

## Interpolation Pattern
- Uses `{{variable}}` syntax (i18next-style)
- Examples: `{{name}}`, `{{org}}`, `{{role}}`, `{{email}}`

## Terminology Conventions
- Korean: use "멤버" (not "구성원") for "member" throughout
- Tagalog: use "Nabigong..." pattern for "Failed to..." error messages (not "Hindi na-...")
- en-AU: uses British spelling ("Organisation", "cancelled")
- Spanish: uses informal "tu" form ("Estas seguro")
- French: uses formal "vous" form ("Etes-vous sur")

## Quality Notes by Locale
- ar: Good quality, natural Arabic
- en-AU: Proper British/Australian spelling applied consistently
- es: Good quality, consistent register
- fr: Good quality, proper "vous" form
- ko: Watch for 멤버 vs 구성원 inconsistency (fixed in organization.json)
- pt-BR: Good quality, natural Brazilian Portuguese
- ru: Good quality, natural Russian
- tl: Watch for unnatural error message patterns (fixed in organization.json)
- vi: Good quality, natural Vietnamese
- zh: Good quality, natural Simplified Chinese

## Known Gaps
- None currently — all namespaces have translations for all locales

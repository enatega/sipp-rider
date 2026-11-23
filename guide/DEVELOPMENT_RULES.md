# Enatega Deliveries Rider App Development Rules

These rules define the baseline architecture for this app and keep it aligned with EnategaSuperApp patterns.

## 1. Structure
- Keep shared app-wide code under src.
- Keep feature-specific modules in dedicated folders when features are introduced.
- Keep navigation definitions in src/navigation.

## 2. Reusability
- Reuse src/components/Text.tsx and src/components/Image.tsx for base UI primitives.
- Add new shared primitives to src/components instead of duplicating logic in screens.

## 3. Theming
- All colors should come from src/theme/colors.ts.
- Typography tokens should come from src/theme/typography.ts.
- Read theme values via useAppTheme().

## 4. Localization
- All user-facing strings should be in src/localization.
- Keep English and French translations in sync.
- Do not hardcode display strings in screens/components.

## 5. Type Safety
- Use explicit props types for every component.
- Avoid any unless unavoidable and documented.

## 6. File Hygiene
- Keep files focused and small.
- Remove unused imports and dead code quickly.

## 7. Extending This Baseline
- When adding Deliveries Store or Deliveries Rider business features, create feature folders and keep shared pieces in src.
- Keep naming consistent with EnategaSuperApp (ThemeProvider, LocalizationProvider, RootNavigator).

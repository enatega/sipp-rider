# Enatega Deliveries Rider App Agent Development Guide

This file defines mandatory engineering conventions for all future work in this app.
Agents must follow these rules before adding new features or refactoring.

## 1) Project Architecture (Current Source of Truth)
Use this structure and do not invent parallel patterns:

- src/api
- src/auth
- src/components
- src/hooks
- src/localization
- src/navigation
- src/providers
- src/screens
- src/theme

### Folder Responsibilities
- src/api: API client, API config, service modules, request/response types, query keys.
- src/auth: session persistence and auth context/provider.
- src/components: reusable presentational building blocks.
- src/hooks: TanStack Query hooks and reusable business hooks.
- src/localization: i18n setup and translation dictionaries.
- src/navigation: Root/Auth/Main navigators, nav types, navigation theme helper.
- src/providers: app-level providers (TanStack Query provider, etc).
- src/screens: screen composition only (minimal logic).
- src/theme: theme provider + tokens (colors, typography, theme builder).

## 2) Navigation Convention
- Keep Auth and Main stacks in separate files:
  - src/navigation/AuthNavigator.tsx
  - src/navigation/MainNavigator.tsx
- Root navigator must only handle:
  - auth-state-based stack switching
  - navigation theme binding
  - startup loading fallback
- Do not place large screen logic inside navigators.

## 3) Session and Auth Convention
- Session is token-driven, not boolean-only.
- Persist session via src/auth/authSession.ts.
- AuthProvider is the single source of truth for session state.
- Use TanStack mutations for login/logout flows.
- Update auth query cache consistently after auth mutations.

## 4) API + TanStack Convention
- All network calls go through src/api/apiClient.ts.
- Feature services belong in src/api/*Service.ts files.
- Query keys must be centralized in src/api/queryKeys.ts.
- Screens should call hooks from src/hooks, not raw service methods.
- Avoid inline fetch/axios calls in screens/components.

## 5) Clean Code Rules (Mandatory)
- Keep files focused and small.
- Do not create "god files" with mixed UI, API, business logic, and helpers.
- Split responsibilities into separate files early.
- One component per file for screen-level and reusable UI components.
- If file size grows and becomes hard to scan, split immediately.

### Practical Limits
- Prefer keeping files around <= 200 lines.
- If a screen exceeds this, extract:
  - subcomponents to src/components or feature component files
  - logic into hooks in src/hooks
  - API concerns into src/api services

## 6) Reusability Rules
- Before creating a new component, check if an existing component can be reused.
- Promote repeated UI patterns into src/components.
- Promote repeated logic into src/hooks.
- Reuse theme tokens and localization keys; do not hardcode visual/text constants repeatedly.

## 7) UI Rules
- No hardcoded colors in screens/components; use theme tokens.
- No hardcoded user-facing strings in components/screens; use localization.
- Keep screen files compositional and declarative.

## 8) Type Safety Rules
- No untyped payloads for API responses in services.
- Define and use explicit request/response types.
- Avoid any; if unavoidable, isolate and document why.

## 9) Naming and Consistency
- Use clear names: *Service, *Provider, *Navigator, use*Mutation/use*Query.
- Keep naming aligned with existing project conventions.
- Do not add alternate naming styles for the same pattern.

## 10) Agent Workflow Rules
Before submitting changes, always verify:
1. Architecture and folder conventions are respected.
2. No duplicated logic that should be reusable.
3. No oversized mixed-responsibility files.
4. Types are explicit and compile.
5. npm run typecheck passes.

## 11) Implementation Priority Order
When building new features, follow this order:
1. types + service layer (src/api)
2. query/mutation hooks (src/hooks)
3. session/state integration (src/auth if needed)
4. reusable UI components
5. screen composition
6. navigation wiring

These rules are mandatory for all contributors and agents working on this app.

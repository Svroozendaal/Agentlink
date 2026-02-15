# Agent: Frontend

Responsible for page composition, component architecture, UX behavior, and presentation-layer consistency.

## Role And Responsibilities
Use this agent when:
- adding or editing pages/components,
- improving forms and interaction flows,
- fixing responsive/layout issues,
- updating app-level documentation pages.

## Rules
### Component Strategy
1. Default to server components; use client components only when needed.
2. Keep components focused and composable.
3. Prefer typed props and explicit interfaces.

### UX And Accessibility
1. Keep semantic HTML and keyboard-accessible interactions.
2. Preserve clear loading/error states.
3. Keep mobile and desktop behavior consistent.

### Styling
1. Use Tailwind utilities and existing design language.
2. Avoid one-off style drift; keep UI patterns coherent across routes.

## Patterns
### Page-level composition
- Fetch server data in page or service calls.
- Delegate repeated rendering into components under `src/components/*`.
- Keep metadata and canonical behavior aligned for public SEO pages.

### Form flows
- Validate inputs on both client and server boundaries.
- Present actionable error states.
- Keep optimistic behavior conservative unless data model guarantees support it.

## Quality Check
- [ ] Route works on mobile and desktop.
- [ ] Accessibility baseline is preserved.
- [ ] Error/loading states are present.
- [ ] UI copy and behavior match backend contracts.

## Self-Improvement
After each task, identify:
- repeated UI patterns to extract,
- confusing interactions to simplify,
- pages requiring better discoverability/metadata.

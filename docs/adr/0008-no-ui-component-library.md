# ADR-0008: Build UI components in-house instead of adopting a library

- **Status:** Accepted
- **Date:** 2026-05-12
- **Deciders:** Victor Pozzan
- **Tags:** frontend, design-system, ui

## Context and Problem Statement

Centavo needs UI components (buttons, inputs, modals, tables, cards). The Angular ecosystem offers mature component libraries (Angular Material, PrimeNG, Taiga UI, ng-bootstrap) that ship dozens of polished components. We need to decide whether to adopt one or build a small set of components in-house.

## Considered Options

- Option A: Angular Material
- Option B: PrimeNG
- Option C: Build a small, project-specific component set with SCSS + design tokens

## Decision Outcome

**Chosen option:** "Build in-house", because the project's component needs are narrow, design tokens give us full visual control, and demonstrating the ability to design and implement components from scratch is more valuable for a portfolio than wiring up a third-party library.

### Positive Consequences

- Full visual control — the app looks like Centavo, not like a generic Material app
- No transitive dependency on a library's release cadence and breaking changes
- Smaller bundle size (no unused components shipped)
- Demonstrates SCSS, accessibility, and component design skills directly in the codebase

### Negative Consequences

- More upfront work — every component must be built and tested
- Accessibility responsibilities (focus management, ARIA, keyboard navigation) fall on us
- Limited to the components we actually build (no instant access to date pickers, autocompletes, etc.)
- Easier to ship inconsistencies if we don't enforce conventions

## Pros and Cons of the Options

### Option A: Angular Material

- ✅ Mature, accessibility-first
- ✅ Comprehensive component set
- ❌ Strong Material Design opinions that fight custom branding
- ❌ Bundle size larger than what a small app needs
- ❌ Theming system is powerful but verbose

### Option B: PrimeNG

- ✅ Largest component catalog in the Angular ecosystem
- ✅ Multiple visual themes
- ❌ Mixed accessibility track record
- ❌ Heavier bundle and styling overrides can be invasive
- ❌ Visual identity often skews toward "PrimeNG demo" aesthetic

### Option C: Build in-house (chosen)

- ✅ Full design control via design tokens (CSS variables)
- ✅ Pay only for what we ship
- ✅ Portfolio value: demonstrates frontend craft, not library configuration
- ❌ More work upfront
- ❌ Accessibility burden on the developer

## Scope of in-house components

Components built in-house:

- Buttons (primary, secondary, ghost, danger)
- Form controls (input, select, textarea, checkbox)
- Cards
- Modals
- Tables (with mobile card fallback)
- Badges and chips
- Toasts

If we need a date picker or autocomplete later and the cost of building it in-house outweighs the benefits, we may adopt a single targeted library (e.g., `@ng-select/ng-select`) for that specific use case rather than a full UI suite.

## Links

- ADR-0006: Signals for state management — related modernization decision
- [Material Design vs. custom design tokens — discussion](https://material.angular.io/guide/theming)
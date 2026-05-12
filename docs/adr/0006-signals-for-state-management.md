# ADR-0006: Signals for state management in Angular frontend

- **Status:** Accepted
- **Date:** 2026-05-12
- **Deciders:** Victor Pozzan
- **Tags:** frontend, angular, state-management

## Context and Problem Statement

The Angular frontend needs a reactivity primitive for component-local state, derived state across components, and the bridge between async HTTP results and the UI.

Historically, Angular relied on RxJS Subjects/BehaviorSubjects for this. Angular 16+ introduced Signals as a first-class reactivity primitive, and Angular 20 made signals the recommended pattern for most application state.

## Considered Options

- Option A: RxJS BehaviorSubject + async pipe
- Option B: Signals as primary state, RxJS for HTTP and event streams
- Option C: External state library (NgRx, NGXS, Akita)

## Decision Outcome

**Chosen option:** "Signals as primary state, RxJS for HTTP and event streams", because it aligns with the direction Angular itself is moving and reduces boilerplate compared to BehaviorSubject pipes.

Pattern adopted:

- Component-local UI state → signals
- Derived state → `computed()`
- HTTP requests and event streams → RxJS Observables
- Bridge between Observable and signal → `.subscribe()` calling `signal.set()`, or `toSignal()` for declarative pipelines

### Positive Consequences

- Less boilerplate (`signal()` + `set()` vs. `BehaviorSubject` + `next()` + `async` pipe)
- Synchronous reads — `this.user()` instead of subscribing
- Better integration with Angular's change detection (especially with zoneless)
- Aligns with the framework's recommended direction

### Negative Consequences

- Team members familiar with RxJS-heavy codebases need to adapt
- Some patterns (debounce, retry, complex async flows) still belong in RxJS — mixed paradigm
- Library ecosystem still catching up

## Pros and Cons of the Options

### Option A: RxJS BehaviorSubject + async pipe

- ✅ Familiar to anyone who learned Angular before 2024
- ✅ Mature ecosystem and tooling
- ❌ Verbose for simple state (subject + observable + async pipe)
- ❌ Memory leaks if `takeUntil` is forgotten
- ❌ Requires Zone.js for change detection — slower

### Option B: Signals primary + RxJS for streams (chosen)

- ✅ Modern, framework-recommended
- ✅ Less verbose for simple state
- ✅ Pairs naturally with zoneless change detection
- ❌ Smaller pool of community examples (yet)
- ❌ Requires clarity on when to use signal vs Observable

### Option C: External state library

- ✅ Strong patterns for large, complex applications
- ✅ Powerful debugging tools (Redux DevTools)
- ❌ Significant boilerplate (actions, reducers, effects, selectors)
- ❌ Overkill for an app with 4 main domains and no cross-cutting state
- ❌ Adds a learning curve unrelated to the project's domain

## Links

- [Angular Signals guide](https://angular.dev/guide/signals)
- [RxJS interop with signals](https://angular.dev/ecosystem/rxjs-interop)
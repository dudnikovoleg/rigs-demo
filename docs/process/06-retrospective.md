# Retrospective

What would be done differently next time — including the things that cost
time unnecessarily.

- **No architecture-standards file at planning time.** Conventions like "one
  file = one component", naming, and where UI state lives were never written
  down, so some of them had to be asserted late, during the cleanup review
  ([`360b433`](https://github.com/dudnikovoleg/rigs-demo/commit/360b433)), instead of being enforced from slice 1.
- **Deeper stack knowledge would have helped.** Framework choices leaned on
  the agent: React + Vite was picked over Next.js because the demo needs no
  SEO/SSR, and the backend (Express + SQLite) likewise followed the agent's
  defaults.
- **What clearly worked and would be kept:** one session per slice with a
  Session Brief, the file-list guardrail in the slice prompt, and manual
  verify per slice — no cross-slice regression survived to the review phase,
  and every review finding was cosmetic or local rather than structural.

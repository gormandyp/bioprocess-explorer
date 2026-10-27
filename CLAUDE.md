# CLAUDE.md

Notes for AI assistants working in this repo.

## Who and why

- Owner: Preston, UF chemical engineering undergraduate (Biomolecular Engineering minor). Beginner in web development; comfortable with basic Python.
- Preston asked for a short plain-language explanation of each step while building (new concept, file, library, equation), with simple analogies.
- Explain every new tool, command or dependency in one plain line. Don't assume git or terminal knowledge.
- Describe AI help accurately. The footer says "built by Preston with AI assistance (Claude)". Never claim results are validated beyond what the tests and the cited data show.
- Balance Bench (by Dr. Logan Morton) is the style and quality reference. It is not Preston's work; never attribute it to Preston.

## Structure

- One self-contained HTML file per process step (`bioreactor.html`, `protein-a-capture.html`). No build step, no frameworks. CSS is copied between pages on purpose (no shared files yet; milestone 3 may add them).
- In each page, the **first** `<script>` block is the model engine: no DOM access, exposes one global (`BRX` for the bioreactor, `PAX` for Protein A). The test file extracts that block with a regex, so keep it first and keep `<script>` followed by a newline.
- External scripts load only from a CDN with a pinned version (3Dmol.js 2.5.5 from jsDelivr).
- Colors are CSS variables on `:root`, with dark-mode overrides for `prefers-color-scheme` and `data-theme="dark"`. The 3D viewer reads `--mol-*` variables.

## Rules for the science

- Every number on the page needs a source, or a visible "assumed" or "fitted" tag in the parameter table (`SOURCES`, `RESINS`, `CHECKS` in the engine).
- Track units explicitly. Capacities are per mL of packed resin; concentrations in mg/mL (= g/L).
- If you change a solver or a parameter, rerun the fit (`fitDe` → `DE_FIT`, `fitBeta` → `BETA_FIT`) and update the constant; the tests check that they match.
- Pages pass values by URL query (`protein-a-capture.html?C0=1.5`). Keep the receiving page clamping to its slider range.
- Concept tool, not a homework solver (UF honor code).

## Tests

```bash
node test/model.test.js
node test/bioreactor.test.js
```

All checks must pass before committing. Add a test for any new model behaviour, preferably against a hand calculation or a known limit.

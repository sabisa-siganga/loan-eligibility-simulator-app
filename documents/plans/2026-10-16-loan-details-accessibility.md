# Screen 1 (Loan details) accessibility plan

**Target:** WCAG 2.2 AA per [Frontend Requirements §13](../Loan_Eligibility_Simulator_Frontend_Requirements.md)  
**Scope:** Loan details screen + journey shell used on that step  
**Related backlog:** [2026-10-15-accessibility-corrections.md](./2026-10-15-accessibility-corrections.md)

---

## Audit findings

| Severity | Issue | WCAG | Where |
| --- | --- | --- | --- |
| High | Purpose group labelled by product heading, not purpose prompt | 1.3.1, 4.1.2 | `LoanProductSection` |
| High | Purpose radio focus indicator is colour-only border change; native outline removed | 2.4.7, 2.4.11 | `PurposeCard.module.scss` |
| High | No skip link to main content | 2.4.1 | `JourneyLayout` |
| High | “How it works” help control missing (required) | §13 / §18.3 | `AppHeader` |
| Medium | Loan details not a real `<form>`; Enter does not submit | 3.2.2 / keyboard UX | `LoanDetailsScreen` |
| Medium | Currency / “months” suffixes `aria-hidden` — AT misses units | 1.3.1 | `MoneyInput`, `WholeNumberInput` |
| Medium | Accordion button name omits description (`aria-labelledby` heading only) | 2.4.6 | `LoanProductSection` |
| Medium | Dialog does not restore focus to opener | 2.4.3 | `Dialog` |
| Low | No automated axe regression on screen 1 | §13 tooling | tests |
| Note | Validation focus-first-invalid already works | — | keep |
| Note | Landmarks (`main`, labelled `nav`) largely OK | — | keep |

Out of scope for this pass (tracked in the system backlog): full token contrast audit, jsx-a11y lint, screens 2–3, slider polish.

---

## Approach (chosen)

**Incremental shell + screen-1 fixes** — fix naming/focus/form semantics and required help, add axe smoke test. Avoid redesigning the accordion visual pattern.

Alternatives considered:

1. **Full redesign of purpose UI as native fieldset-only** — cleaner, but larger visual/regression risk.  
2. **Tooling-only first** — good long-term, does not meet “fix screen 1” now.  
3. **Chosen: targeted corrections** — smallest change that clears High/Medium issues on screen 1 while matching existing components.

---

## Implementation tasks

### 1. Purpose group semantics
- Label radiogroup from purpose legend (`aria-labelledby` → legend id).
- Set `aria-required` and `aria-invalid` when a purpose error is shown.
- Keep `aria-describedby` wired to purpose `ErrorText`.

### 2. Purpose card focus visible
- Apply shared `focus-ring` on `:focus-within` (not colour-only border).
- Keep selected/hover styles distinct from focus.

### 3. Journey shell
- Skip link as first focusable control → `#main-content`.
- `main` gets `id="main-content"` and `tabIndex={-1}` for programmatic focus.

### 4. How it works
- Header control opens `Dialog` with requirements §18.3 content.
- Keyboard operable; focus moves into dialog; Escape/Close restores focus to the opener (`Dialog` fix).

### 5. Form semantics on Loan details
- Wrap screen in `<form noValidate>` with submit handler.
- Summary Continue is `type="submit"`.
- On mount (and when arriving on step), move focus to the screen `h1`.

### 6. Unit announcements
- Stop hiding currency / months from AT (remove `aria-hidden`, or associate via `aria-describedby`).

### 7. Accordion description
- `aria-describedby` on product header button pointing at description text.

### 8. Regression tests
- Component/screen tests for radiogroup name, skip link, How it works, form submit via Enter.
- Add `vitest-axe` smoke: Loan details default state has no serious/critical violations.

---

## Review checklist (self-review)

- [x] Findings map to WCAG / requirements §13  
- [x] No speculative redesign  
- [x] Tests describe behaviour  
- [x] Dialog focus restore shared (helps How it works)  
- [x] Screens 2–3 left for later backlog items  

---

## Exit criteria

- [x] Keyboard-only path: skip → expand product → choose purpose → amount/term → Continue  
- [x] Purpose errors announced and associated with the purpose group  
- [x] Visible non-colour-only focus on purpose cards  
- [x] How it works opens/closes with focus restore  
- [x] `vitest-axe` smoke passes on Loan details  
- [x] Existing Loan details unit tests still pass  

## Implementation status

Implemented 2026-10-16. Manual SR / 200% zoom / high-contrast sign-off still required per requirements §13 (automation alone is not compliance).

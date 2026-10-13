# Loan Eligibility Simulator: Frontend Requirements

Version: 2.3, confirmed requirements and selected designs
Date: 8 October 2026
Scope: Frontend only

This document replaces the earlier discussion draft. It records the decisions agreed during screen-by-screen review. Bank examples inform the experience, but these are demo rules, not a bank's lending policy.

## 1. Goal and scope

Help a user understand whether a personal loan fits their entered monthly budget. Explain repayments, borrowing costs, money left and each failed eligibility rule.

Build the interface, local calculations, validation, state handling, mock service states, accessibility and tests. No backend, real credit check, real application, account creation or approval. Do not collect names, ID numbers, contact details or documents.

Start with personal loans. Keep the product configuration extensible for future loan types, but do not show a product picker while there is only one product.

All screens use simple English. Remove visible demo/simulation badges, disclaimers and generated-score source labels. Keep the app name, estimated-result wording, budget warnings and cost exclusions. Developer documentation retains the frontend-only and random-score assumptions.

## 2. Product settings

| Setting | Value |
| --- | --- |
| Currency | South African rand, R |
| Amount | R5,000 to R300,000 |
| Repayment term | 6 to 60 whole months |
| Example annual rate | 12.5% |
| Explore-rate range | 10.5% to 18.5% |
| Purpose options | Debt consolidation, home improvement, education, medical, other |

Purpose is descriptive only. It does not change the interest rate, repayment, limits or eligibility. Debt consolidation does not remove existing repayments from the calculation.

Fees and insurance are excluded for now. Display: "This estimate includes interest but excludes fees and insurance." Do not describe the payment as all-inclusive.

Vehicle finance from the supplied sample is future scope, not an implemented product.

## 3. Screen 1: Loan details and landing screen

The app opens directly on this screen. No separate marketing page or sign-up.

Initial values: loan amount R5,000 (displayed as 5000.00 when not editing), repayment term 6 months, example annual rate 12.5%. Both sliders start at their minimum. Purpose is unselected and personal/budget fields are empty. Cancel, Start again and reload clear user entries, results, errors and any generated credit score, then restore these loan defaults.

Header: app name and How it works. Progress: Loan details, Your budget, Your result.

Heading: "See how a loan could fit your budget". Brief supporting copy explains exploring repayments and checking the budget.

Required fields:

- Loan amount (R) *, with a number input and linked slider.
- Repayment term (months) *, with a number input and linked slider.
- Loan purpose *, with a select field and no preselected purpose.

Show estimated monthly repayment, total repayment and total interest using the example rate. Add an expandable cost breakdown and optional Explore interest rate control, clearly labelled as an example rate rather than an offer.

No affordability result yet. Display: "Affordability has not been checked yet."

Primary action: Continue to your budget. Validate the current step before moving on. On desktop, place loan inputs and estimate side by side; stack them on mobile.

## 4. Screen 2: Your budget

Show a compact summary of the selected amount and term. Group fields into Your monthly budget, Your circumstances and Your credit score.

| Field | Required behaviour |
| --- | --- |
| Monthly take-home income (R) * | Exact amount after tax and payslip deductions. Whole rands entered by user, not a range. |
| Monthly living expenses (R) * | Living costs such as food, rent and transport. Exclude debt repayments. Zero allowed. |
| Existing monthly debt repayments (R) * | Monthly repayments, not outstanding balances. Zero allowed. |
| Age (years) * | Whole number. Valid ages outside the eligibility band can receive a policy result. |
| Employment status * | Employed, self-employed, unemployed, retired. |
| Employment duration (months) * | Required only for employed users. Actual value entered by user. |
| Months running the business * | Employment-duration equivalent for self-employed users. Actual value entered by user. |
| Income source * | Required only for unemployed or retired users. |
| Months receiving this income * | Required only for the six-month income-source group below. |
| Credit score * | Required unless the user selects I don't know my credit score. Whole number from 300 to 850. |

Expenses and debt help text includes: "Enter 0 if you have none." Rent belongs under living expenses. Home-loan repayments belong under debt. Count each cost once.

Back keeps entries and returns to Screen 1. Cancel clears the journey and returns to Screen 1. Primary action: Check estimated eligibility.

### Employment and income-source fields

| Status or source | Fields and rule |
| --- | --- |
| Employed | Show duration. Minimum 3 months employed. |
| Self-employed | Show business duration. Minimum 3 months running the business. |
| Unemployed or retired | Hide and ignore employment duration. Show required income source. Status alone does not reject. |
| Pension income | No income-duration minimum in this demo. Income, age and budget checks still apply. |
| Rental income, investment payouts, maintenance or other income | Show required Months receiving this income. Minimum 6 months. Other checks still apply. |
| No income | Set monthly income to 0.00 and read-only. Hide income duration. Allow result explaining rejection. |

Income-source options: pension, rental income, investment payouts, maintenance, other income, no income. Selecting a source is not proof of income or automatic eligibility. No document upload is required.

Changing away from No income makes income editable and requires an entry. Hidden fields and their errors cannot affect submission or calculations. Do not silently fill a duration with the policy minimum.

### Credit-score choices

- Manual score: the user enters their known score.
- I don't know my credit score: hide the manual score field and show an optional checkbox labelled "Check my credit score."
- Unknown plus demo checkbox selected: on checking eligibility, choose one random score from 450, 550, 650, 750, 820. No real bureau is contacted.
- Unknown plus demo checkbox not selected: continue with a budget-only estimate using the chosen example rate. Never invent a score.
- Keep the demo score stable when navigating back, adjusting the loan or retrying a technical error.
- Cancel, Start again and reload clear the score. A new requested demo check makes a fresh random selection, which may repeat the previous score.
- An unused manual or demo score must not silently affect a budget-only estimate.

## 5. Input rules and validation

All applicable data-entry fields are required and show *. Above the form show "* Required field". Hidden conditional fields are not required. Optional controls such as the demo-check checkbox remain optional.

Validate on blur: when the user leaves a field, show an error immediately below it if needed. Do not show errors on untouched fields at first load. Once an error appears, update it as the user corrects the value.

Continue stays clickable. On click, validate all fields in that step, show field errors and focus the first invalid field. An error summary may supplement field errors but must not override this focus behaviour.

### Number and money entry

- Age, credit score and duration/term fields accept digits only and whole numbers.
- Money fields accept whole-rand digits only while editing. No letters, signs, currency symbols, separators or user-entered decimal point.
- Money labels show (R). The input itself does not contain the currency symbol.
- On blur, format a valid money value with .00, for example 25000 becomes 25000.00.
- On focus, show the whole number again for editing. Keep the numeric value unchanged.
- Empty remains empty; never convert it to zero automatically, except the explicit No income behaviour.
- Computed money displays two decimal places and may contain cents.
- Sliders and paired number inputs stay in sync. Do not silently clamp an invalid typed value.
- Use a numeric mobile keyboard. Handle typing and pasted input, without preventing normal editing/navigation keys.
- Invalid pasted content should be explained, not silently turned into a different amount.
- Future text fields may contain letters, spaces, numbers and special characters. No arbitrary letters-only restriction.

### Input error versus eligibility failure

Missing values, unsupported formats and amount/term outside product limits block progression. Credit scores outside 300 to 850 are field errors.

Valid low income, short duration, age outside the policy band, or expenses above income are scenarios that can proceed to Screen 3. Show an immediate explanatory note if appropriate, but do not force the user to change a truthful value to qualify.

## 6. Calculation model

Use a fixed annual interest rate with monthly amortised repayments, no fees or insurance.

For principal P, monthly rate r = annual percentage / 100 / 12, and whole-month term n:

Monthly payment = P × r / (1 − (1 + r)^(-n)). At zero interest, payment = P / n.

Total repayment = payment × number of months. Total interest = total repayment − loan amount. Display money to two decimal places. Keep one consistent rounding policy and avoid building totals from separately rounded display strings. If a schedule is added later, reconcile the last payment and totals.

Money left each month = monthly take-home income − living expenses − existing debt repayments − proposed monthly loan repayment.

For a negative balance, show Monthly shortfall and the positive shortfall magnitude. Do not clamp the underlying calculation to zero.

Share of income spent on debt repayments = (existing monthly debt repayments + proposed repayment) / take-home income × 100. This ratio is information only, with no separate rejection cutoff. At zero income show "Cannot calculate without income".

Do not display the supplied loan-to-income ratio: its meaning is undefined. Do not copy the sample response figures into normal results; several supplied figures do not agree with the sample's budget and amortisation assumptions.

## 7. Score-based annual interest rates

| Credit score | Annual rate |
| --- | --- |
| 300 to 499 | 18.5% |
| 500 to 599 | 16.5% |
| 600 to 699 | 12.5% |
| 700 to 799 | 11.5% |
| 800 to 850 | 10.5% |

These are fictional demo bands. Apply the same mapping to manual and demo scores. A low score does not cause automatic rejection in this model; the rate changes repayment and affordability.

Once a score is available, its rate replaces the Screen 1 example rate. Explain the change and recalculate all costs and budget figures together. Without a score, keep the selected example rate and label the result budget-only.

Any Explore-rate what-if control on results must be labelled as an example scenario, not silently overwrite the score-based rate. Provide a way to restore the base rate.

## 8. Eligibility rules and buffer

A scenario must pass all applicable rules:

- Age 18 to 65 inclusive.
- Monthly income at least R5,000.
- At least 3 months employment/business duration when applicable.
- At least 6 months receiving other income when applicable.
- No income rejects.
- Loan amount and term within the product limits, enforced by input validation.
- Money left after the proposed repayment is not negative.

| Money left | Budget outcome |
| --- | --- |
| Below R0 | Reject because repayment exceeds budget. |
| R0 to R999.99 | Pass the budget check, show Tight budget warning and allow continuation. |
| R1,000 or more | Pass the budget check without the low-buffer warning. |

The R1,000 buffer is a warning threshold, not a required reserve or automatic rejection rule. A warning does not override another failed rule. Use a consistent money-rounding rule at the boundary so the status and displayed balance do not contradict one another.

Show every failed eligibility check, not just the first. Group overlapping no-income and minimum-income explanations where useful while making the failed rules understandable.

## 9. Screen 3: Your result

Display:

1. Estimated eligible or Not eligible, with text and an icon. Use the explanation Your details meet the eligibility rules when applicable.
2. Every relevant reason and any Tight budget warning.
3. Monthly repayment, annual rate, loan amount and term.
4. Total repayment and total interest, with expandable cost detail.
5. Money left each month or Monthly shortfall.
6. Budget breakdown: income, living expenses, existing debt repayments, new repayment, remaining amount.
7. Share of income spent on debt repayments, clearly explained.
8. Credit score and its value. Do not show Demo score or another generated-score source label. Manual entry may say Entered by you. Without a score show No credit score used and the example rate. Explain the rate effect without demo wording.
9. Adjust the loan, Edit your details and Start again.

Show fees/insurance exclusion near the figures. No simulation limitation badges or footers.

Do not include approval percentages, risk labels, personalised maximum or recommended amounts. R300,000 is the product limit, not a personalised offer.

### Adjust and edit

Adjust amount and term directly on Screen 3. Keep financial entries and credit score unchanged. For valid values update costs, remaining money, warnings and eligibility together. When typed adjustment input is invalid, show the error and do not present a previous result as matching the invalid value.

Explain: "A longer term can lower monthly repayments but increase total interest."

Edit your details returns to Screen 2 with entries preserved. Recheck after editing. A rejected user may adjust the loan and try again; explain when changing the loan cannot fix income, age or duration failures.

Start again clears inputs, errors, results and demo score, then returns to Screen 1. Cancel and reload have the same reset effect. Retain no financial draft across reloads.

## 10. Loading, errors and state

While an eligibility request runs, show Checking… with a loading indicator and prevent duplicate clicks. A technical failure keeps entries and the demo score, explains the problem and offers Try again. Never turn a technical failure into a rejection.

Local calculation changes need no fake waiting time. Mock async states can use a short controlled delay. Technical-error demonstrations belong in development/test controls, not random failures for ordinary users.

Guard against stale responses: only a response matching the current journey and inputs may update the screen. Cancel or reset invalidates any pending work.

Keep raw form text separate from validated values. Derive results from one shared model. Hidden stale values must not influence policy. Invalid mock response data produces a controlled error rather than NaN, infinity or a crash.

## 11. Theme and responsive design

Use a Capitec-inspired light theme with the app's own name and no Capitec logo. Primary blue #2F70EF main buttons, sliders, links and selected controls, restrained red accents, white cards, light grey backgrounds, dark readable text and generous spacing.

Use text and icons alongside green eligible, amber warning and red rejection states. Use the confirmed primary token #2F70EF. Choose supporting states with contrast checks. This is an inspired palette, not an official bank token set.

All tasks work on mobile, tablet and desktop, including 320px-wide screens. Use stacked layouts on mobile. Avoid clipped forms, page-wide horizontal scrolling and fixed-height sections that hide content. Make long forms scroll naturally.

## 12. Interactions and motion

| Interaction | Behaviour |
| --- | --- |
| Buttons/controls | Hover, visible focus, pressed and disabled states. |
| Screen transitions | Short smooth transition, then focus to the new heading. |
| Conditional fields | Smooth reveal without stealing focus; if a focused field is removed, move focus sensibly. |
| Validation | Inline feedback without shaking or flashing. |
| Sliders | Immediate estimates, paired precise inputs and keyboard support. |
| Checking | Loading status and repeat-click prevention. |
| Result changes | Correct figures appear immediately, with a brief subtle highlight. |
| Expandable costs | Smooth open/close and clear expanded state. |

Aim for subtle 150 to 250 ms transitions. Respect reduced motion by removing unnecessary movement. Do not animate money counting up to its correct value. State changes must remain understandable without animation. Do not flash or announce every slider tick to a screen reader.

## 13. Accessibility

Visible connected labels and programmatic required states accompany the asterisks. Associate helper text and errors with fields. Use a logical keyboard order, visible focus, accessible select/slider/accordion states and result/loading announcements.

Keep text readable at 200% zoom. Aim for 44px touch targets on main controls. Target WCAG 2.2 AA contrast and interaction requirements, with manual checks as well as automated scans. Do not claim compliance from an automated result alone.

## 14. Frontend engineering

Use TypeScript for form values, validated input, product settings, rate bands, policy results and mock responses.

Separate reusable UI controls, form handling, calculation functions, eligibility rules, journey state and local mock services. Centralise formatting and thresholds. Avoid a single component containing the whole app, duplicate derived state and unnecessary state libraries.

The supplied API endpoints are local service boundaries, not backend implementation:

- products: local product configuration.
- validation-rules: required fields, number formats and product limits; distinguish policy thresholds.
- calculate-rate: shared demo rate selection and amortisation.
- eligibility: shared calculation and all applicable policy results.

Clarify existingDebt as monthly repayments, allow absent/nullable credit score, and add conditional incomeSource and incomeDuration fields. Employment duration is absent when it does not apply. Keep result reasons structured. Omit unsupported likelihood/risk/recommendation fields from the displayed model.

Keep entered financial data in memory. Do not send it to a server, put it in URLs, save it in local storage or log it. Explain that reload clears entered details without demo/simulation wording. The app must work without a backend or remote font loading successfully.

## 15. Tests and acceptance checks

| Area | Required coverage |
| --- | --- |
| Repayment calculation | Independent expected example, zero interest, total interest/repayment and consistent rounding. |
| Eligibility | Every applicable rule and all failures shown together. Test just below, at and above thresholds. |
| Buffer | Negative reject, zero warning, just below R1,000 warning, exactly R1,000 no warning. |
| Rates | Each credit band boundary; same manual/demo rules; no score uses example rate. |
| Conditional fields | Status/source switching, required fields, hidden errors/values ignored, no-income read-only behaviour. |
| Demo score | Only requested unknown-score users receive one; each list value supported; edits/retries keep it; reset allows fresh draw. |
| Number input | Typing/paste, required empty versus zero, whole-rand entry, blur .00 and focus editing. |
| Form feedback | Blur checks, correction feedback, clickable Continue and first-invalid-field focus. |
| Navigation | Back/Edit preserve; Cancel/Start again/reload clear. |
| Adjustments | All result figures and warnings update together; invalid values do not imply a current result. |
| Async errors | Duplicate clicks, retry preserving entries/score, malformed response, stale response after reset. |
| Accessibility | Keyboard journey, labels, focus, announcements, reduced motion, contrast and zoom. |
| Responsive | Mobile/tablet/desktop, long messages, large amounts, no content clipping. |

Whole journeys: eligible, tight budget, shortfall, manual score, unknown with demo, budget-only, pension, other income below six months, no income, technical failure/retry.

Completion includes build/type checks, meaningful unit and interaction tests, run/test instructions and plain-English demo assumptions. Tests must verify behaviour rather than merely repeat the implementation.

## 16. Design deliverables and deferred work

Create finished visual screen designs, not wireframes: colours, typography, spacing, controls, selected/input states, sample figures and responsive layout guidance. Use a consistent style across Loan details, Your budget and Your result. Include conditional, warning, rejection, loading and error variants in subsequent design refinement. The three original-layout designs reattached on 8 October 2026 are the selected visual references. The later left-aligned Plan your personal loan redesign is not selected. Follow the selected images for layout and the requirements for logic, exact amounts, missing states and accessibility. See section 18.

Deferred: more loan products, fees/insurance, full payment schedule, personalised maximum/recommended loan amounts, saved scenarios, persistent drafts, exports and real banking integrations.

## 17. Research references

Bank research informs product decisions; it does not mean the demo reproduces a complete lending model.

- Capitec credit requirements: https://www.capitecbank.co.za/personal/credit/how-to-qualify-for-credit/
- Capitec other-income route: https://www.capitecbank.co.za/personal/credit/credit-for-multiple-income-earners/
- Nedbank application requirements: https://personal.nedbank.co.za/borrow/personal-loans/ready-to-apply.html
- Nedbank affordability FAQ: https://personal.nedbank.co.za/borrow/personal-loans/faq.html

The three-month employment rule, R5,000 minimum and age band originate in the supplied sample. The six-month other-income rule is a selected demo adaptation from the Capitec route. No-duration pension and R1,000 warning buffer are explicitly demo choices.

### Visible copy refinements

- No demo or simulation wording in badges, helpers, checkboxes or footer disclaimers. The app name Loan Eligibility Simulator stays.
- Buffer note: Below the R1,000 buffer.
- Credit helper: Your score affects the interest rate and monthly repayment.
- Rate explanation: Your score sets the annual rate to [rate]%.
- Privacy helper: Your information stays on this device.
- Keep estimated eligibility, cost exclusions, warnings and all underlying random-score, eligibility, reset and privacy behaviour.



## 18. Selected visual references

The user selected the first design family, including the later colour and wording updates, rather than the alternative frontend-design concept.

| Screen | Selected attachment | Layout to retain |
| --- | --- | --- |
| 1: Loan details | Loan eligibility simulator interface in blue.png | Header, circular three-step progress, centred title, loan form on the left, repayment summary and Continue on the right. |
| 2: Your budget | Loan eligibility budget check screen.png | Same header/progress, centred heading and loan summary, grouped form on the left, Why we ask panel on the right, Back/Cancel/Check actions below. |
| 3: Your result | Loan Eligibility Simulator Mockup.png | Same header/progress, centred status, full-width warning when applicable, loan summary and adjustments on the left, monthly budget and credit score on the right. |

Use primary blue **#2F70EF** from the requirement, not a colour sampled from generated image pixels. Preserve the light background, white rounded panels, field styling, restrained dividers and shared spacing. Supporting colours must meet contrast requirements. Use consistent icon-library icons, not emoji or a screenshot pasted into the working interface.

Do not use the later Plan your personal loan concept, its underlined-text progress or its oversized amount-entry treatment as implementation references.

### What the images do and do not establish

The images show filled example states, not an instruction to prefill someone's personal information. Age, income, expenses, debt, employment status, duration and credit score must not be automatically populated with example values. Purpose starts unselected. The calculator starts with R5,000 and 6 months. These are editable loan defaults, not personal information.

Slider position must reflect the actual value and range, even when the generated mock shows an inaccurate thumb position. For R50,000 within R5,000 to R300,000, the thumb is about 15.25% along the track. For 24 months within 6 to 60, it is 33.33%. Numeric fields remain the precise-entry alternative.

Do not copy tiny text, fixed image dimensions or fixed panel heights if they prevent readable or responsive content. The source images are desktop references. Mobile uses a single column, full-width controls and natural scrolling, retaining the same content order and visual language.

Only show Tight budget when the remaining balance is non-negative and below R1,000. The shown result is one valid example, not the only result layout. Hide the warning for a comfortable balance. For a negative budget, show the rejection and monthly shortfall. Other failed policy rules must also be explained even if the budget itself fits.

Entered by you appears only for a manually entered score. A generated score shows Credit score and its value, without a generated/demo source label. Without a score, show No credit score used and the rate assumption rather than the example value 650.

### Required states absent from the chosen screenshots

These behaviours are already in scope and must use the selected visual style:

- Empty required fields and field errors on blur.
- Correcting an error and submission focusing the first invalid field.
- Employed and self-employed duration labels.
- Unemployed/retired income source and conditional six-month field.
- Pension with no duration field.
- No income with read-only 0.00 and a rejection result.
- Unknown credit score with the optional Check my credit score checkbox.
- Unknown credit score without a requested check, producing the budget-only result.
- Checking status, disabled repeat submission and technical-error retry.
- Eligible without a warning, eligible with Tight budget, and rejected with all applicable reasons.
- Expanded cost breakdown and Explore interest rate controls.
- Amount/term adjustment, changed rate explanation and invalid adjustment input.
- Hover, focus, pressed and disabled states.
- Mobile/tablet layouts, zoom and reduced-motion behaviour.

These additional states have requirements but do not yet have separate finished design images. Do not claim the three desktop references visually cover every state.

### How it works content

The header's How it works control opens accessible help explaining the three steps: choose the loan, enter your budget and circumstances, then review or adjust the result. Explain take-home income, avoiding duplicate debt costs, the effect of interest and term, the fees/insurance exclusion, and that refreshing clears details. Keep the agreed visible wording without adding demo/simulation badges or a real Apply action. The help control must work and be keyboard accessible; do not leave it as a decorative link.

## 19. Checked example for design and calculation review

Use this example in tests and visual review, not as assumed user information:

| Input | Value |
| --- | --- |
| Loan amount | R50,000 |
| Term | 24 months |
| Purpose | Home improvement |
| Monthly income | R15,000 |
| Living expenses | R10,000 |
| Existing monthly debt repayments | R1,800 |
| Age | 35 |
| Employment status | Employed |
| Employment duration | 24 months |
| Manually entered score | 650 |

| Expected display | Value |
| --- | --- |
| Annual rate | 12.5% |
| Monthly repayment | R2,365.37 |
| Total repayment | R56,768.77 |
| Total interest | R6,768.77 |
| Money left each month | R834.63 |
| Share of income spent on debt repayments | 27.8% |
| Status | Estimated eligible |
| Warning | Tight budget |

Compute totals from the unrounded amortisation result before rounding for display. The rounded monthly amount multiplied by 24 may differ from the displayed total by a few cents. Do not independently hardcode these figures or introduce fees to force agreement.

## 20. Remaining implementation choices

The functional rules and visual direction are agreed. These details have not been selected and must not be presented as prior user decisions:

- Framework, form library, styling approach and test tooling.
- Exact font, supporting colour tokens and hover/focus shades, chosen to match the selected designs and accessibility requirements.
- Whether a result-screen Explore interest rate control is included; Screen 1 exploration remains part of the agreed design.

A full repayment schedule and export remain deferred. Do not add backend work, real bureau calls or a lender application flow while completing the frontend.

# Product accordion on Loan Details

Approved design (Approach A). Not committed unless requested.

## Behaviour

- Product headers are exclusive accordion triggers. Opening product B closes A. Re-clicking the open header does nothing.
- Collapsed: header + description.
- Expanded: purpose radios.
- Expanded + purpose selected for that product: Required amount + Term.
- Switching products clears product/purpose/amount/term and the rate quote; credit scores stay.
- Expand state is local UI (`expandedProductId`). Journey commit remains `selectPurpose`.
- On purpose validation failure with nothing useful focused: expand first product (or keep current expand) and focus the first purpose radio.

## Implementation notes

- `clearLoanSelection` in `journeySlice` clears loan choice + quote.
- `LoanProductSection` owns header button (`aria-expanded` / `aria-controls`) and conditional panel.
- `LoanDetailsScreen` owns expand state, clear-on-switch, and purpose-error expand/focus.

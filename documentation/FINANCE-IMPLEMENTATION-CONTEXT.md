# Finance Module — Implementation Context

> **Purpose:** Track progress, architecture decisions, and folder explanations while building the frontend finance module.
> **Backend contract:** `AUTH-FINANCE-GUIDE.md`
> **Task spec:** `./FINANCE-MODULE-FRONTEND-TASK.md`
> **Scope:** Finance module implementation — progress tracked against Section 26 (Implementation Order) and Section 25 (Acceptance Criteria). Section 27 requires this log.

---

## Backend Finance Contract (Summary — verified against AUTH-FINANCE-GUIDE.md)

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8082` |
| Finance prefix | `/api/v1/finance` |
| Master data | `GET /api/v1/finance/master` (transaction types, purposes + subcategories, statuses, wallet types, loan directions, currencies) |
| Response envelope | `{ success, code, message, data, timestamp }` |
| Wallets | `GET/POST/PUT/DELETE /api/v1/finance/wallets`; DELETE = soft close (`status: CLOSED`) |
| Wallet types | `GET/POST/PUT/DELETE /api/v1/finance/wallet-types` |
| Transactions | `GET /transactions` (mode filters), `GET /transactions/{id}`, `POST /transactions`, `GET /transactions/{id}/ledger` — **no edit/delete** (not in guide) |
| Budgets | `GET/POST/PUT/DELETE /api/v1/finance/budgets` filtered by `month` (`YYYY-MM`) |
| Loan users | `GET/POST/PUT/DELETE /api/v1/finance/loan-users` + `GET /loan-users/{id}/history` |
| Dates | `transactionDate` is LocalDateTime ISO — client sends `'YYYY-MM-DDT00:00:00'` |
| Response codes | `transactionTypeCode`, `transactionPurposeCode`, `subcategoryCode`, `walletTypeCode`, `purposeCode`, `alertLevel` |

---

## Architecture Decisions (Section 24)

| Decision | Why |
|----------|-----|
| Standalone components + signals only | Angular 20 default; no NgRx; fine-grained reactivity without boilerplate |
| Lazy routes behind `authGuard` | `''` → finance shell → per-feature route arrays; small initial bundle |
| ONE config-driven transaction module | New transaction type = new entry in `transaction-types.config.ts`, no new pages/forms (§25) |
| Strict layering | `pages → services → api → dto/models` mirrors backend controller/service/repository; `api/` holds endpoint constants ONLY |
| Same design system as Auth | `btn-primary-gradient`, `form-control-lg-custom`, `--pfm-*` tokens, `ToastService`, `APP_CONFIG` reused — no new design language |
| One `TransactionService` | All finance signals (master data, wallets, transactions, budgets, loan users, wallet types) + CRUD; `afterMutation()` reloads; unified `handleError` → toast |

---

## Folder Structure (final)

```
src/app/
├── core/
│   ├── constants/finance-routes.constants.ts   # route paths + route-data mode keys
│   ├── config/menu.config.ts                   # sidebar menu (lazy routes)
│   ├── services/layout.service.ts              # sidebar collapse state (persisted)
│   └── layout/app-layout/                      # app-layout + sidebar + top-navbar + click-outside directive
├── shared/components/                          # full library (§25 list)
│   ├── page-header, summary-card, stat-card
│   ├── loading-overlay, empty-state, error-state, no-data
│   ├── modal, confirm-dialog, delete-dialog, drawer, dropdown
│   ├── search-bar, filter-panel, data-table
│   ├── currency-input, amount-input, date-range-picker
│   ├── wallet-selector, purpose-selector
│   └── ... (pipes, directives, utils, validators)
├── features/
│   ├── transaction/
│   │   ├── api/transaction.api.ts              # endpoint constants ONLY
│   │   ├── dto/                                # 1:1 backend DTOs (envelope + finance DTOs + projections)
│   │   ├── models/                             # TransactionMode, PageState, FilterState
│   │   ├── constants/                          # mode labels, PURPOSE_CODES_BY_TYPE, LOAN_DIRECTION_CODES, badge/alert classes
│   │   ├── config/                             # transaction-types / form-fields / table-columns configs
│   │   ├── services/transaction.service.ts     # ONE service for the whole module
│   │   ├── pages/                              # transaction-list, transaction-form, detail + ledger drawers
│   │   └── transaction.routes.ts               # /income /expense /loan /transfer /transactions + /create
│   ├── dashboard/                              # dashboard.component (+ scss)
│   ├── wallet/                                 # wallet-list + wallet-form (modal)
│   ├── budget/                                 # budget-list + budget-form (modal)
│   ├── report/                                 # report-list (aggregations + CSV, no new APIs)
│   └── settings/                               # settings + wallet-type-form + loan-user-form
└── finance.routes.ts                           # shell; maps the 6 feature route arrays
```

---

## Implementation Log (Section 26)

| Step | Status | Notes |
|------|--------|-------|
| 1. Finance shell | ✅ | top navbar + collapsible sidebar + content; collapse persists; responsive |
| 2. Shared batch 1 | ✅ | page-header, summary/stat-card, loading-overlay, empty/error/no-data, modal, confirm/delete-dialog, drawer, dropdown |
| 3. Shared batch 2 | ✅ | search-bar, filter-panel, data-table (columns/actions/pagination/CSV/sticky header/skeleton), currency-input, amount-input, date-range-picker |
| 4. Transaction foundation | ✅ | api/, dto/, models/, constants/, TransactionService + master/wallets/transactions/budgets/loan-users/wallet-types signals; wallet-selector + purpose-selector |
| 5. Transaction config | ✅ | types / form fields / table columns configs |
| 6. Transaction pages | ✅ | mode-driven list + form pages + all 20 routes (`/income` `/expense` `/loan` `/transfer` `/transactions` + `/create` per mode) |
| 7. Extras | ✅ | detail drawer, ledger view, loan-user auto-create via backend, CSV export |
| 8. Dashboard | ✅ | balance/income/expense/savings cards, budget progress + alerts, recent transactions, quick actions, wallet summary bars, monthly trend, subtle animations |
| 9. Wallets | ✅ | list/create/edit/close (soft close), wallet types respected |
| 10. Budgets | ✅ | `YYYY-MM` month selector, limits, NORMAL/WARNING/EXCEEDED alert badges, CRUD |
| 11. Reports | ✅ | client-side aggregations + CSV export only |
| 12. Settings | ✅ | wallet types CRUD, loan users CRUD + history drawer, profile + logout |
| 13. LOAN flow | ✅ | borrower + RECEIVABLE/PAYABLE direction; person auto-creation through backend |
| 14. Acceptance pass | ✅ | `npm run build` clean (0 errors / 0 warnings) |
| 15. Sidebar redesign | ✅ | `sidebar-item.component.ts` gained its own `styleUrl` (view encapsulation previously left nav links unstyled/blue-underlined); new `sidebar-item.component.scss` (nav rows, active amber pill + left bar, hover, chevron rotation, red-tint logout) + rewritten `sidebar.component.scss` (navy gradient, faint trend-line SVG backdrop, brand divider, Settings+Logout pinned bottom via `nth-last-child(2)`, 264px width); new `--pfm-sidebar-*` tokens in `styles.scss`; Reports icon → `bi-bar-chart-line`; verified via headless Chrome |
| 16. Dark theme (finance shell) | ✅ | `.app-shell` scoped dark-theme partial in `styles.scss` overrides `--pfm-*` + Bootstrap `--bs-*` vars (body/card/border/badge-subtle/progress/focus/link/form-select) → every component inside the shell inherits dark automatically; auth pages keep light `:root` defaults. Content backdrop: navy gradient + amber/blue orbs + faint grid + trend-line SVG (`app-layout.component.scss`). Top navbar `#101a2e` + dark dropdown. Semantic tokens (`--pfm-text-*`, `--pfm-card-border`, `--pfm-input-*`, `--pfm-success/danger/warning/info` + tints, `--pfm-table-header-*`, `--pfm-row-hover`, `--pfm-skeleton-*`, `--pfm-overlay-bg`, `--pfm-primary-icon`) added in `:root`; 16 shared components converted from hardcoded colors to tokens; amber focus ring on dark inputs; ghost `.btn-outline-primary`; dark table headers/rows/skeletons |

---

## Key Implementation Details

- **Master data** loaded once from `/api/v1/finance/master` and drives every type/purpose/status selector; `wallet-types` (mutable) reload via `afterMutation()`.
- **Transaction form** is one reactive form; fields appear per type config (`purposeId`, `subcategoryId`, `walletId`, `sourceWalletId`/`destinationWalletId`, `personName`, `directionId`, `merchant`). Uses shared `currency-input`, `wallet-selector`, `purpose-selector` (CVA), `differentWalletsValidator()` for TRANSFER, `lowBalanceHint()` for EXPENSE, sends `statusId: COMPLETED`.
- **Tables** are one reusable `data-table` configured per page (`buildTransactionColumns`), with sort, paginate, search, CSV export, sticky header, skeleton/empty states.
- **Modal `open`/`close`** uses `model()` (two-way `[(open)]`) — input signals were too rigid for `onOpen` flows.
- **Currency formatting** `formatAmount(value)` (single arg) — the two-arg overload is NOT the correct signature.
- **Auth integration:** `authInterceptor` injects the bearer token; `/api/v1/finance/master` added to `AUTH_PUBLIC_ENDPOINTS` in `features/auth/api/auth.api.ts` (note: backend SecurityConfig `PUBLIC_URLS` only lists auth/docs — verify at runtime).
- **Error handling:** unified `handleError` → `ToastService` + typed `ApiErrorShape` `{ message, code, status }`; loading/flags per mutation (`isSaving`, `deletingLoading`, `loading` per entity).

---

## Remaining / Watch Items

- [ ] Runtime smoke test login → `/dashboard` against running backend (all green builds; backend not assumed running here)
- [ ] Verify backend allows unauthenticated `/api/v1/finance/master` (if not, move the request behind the auth token)
- [ ] Budget/dashboard CSV + table exit behaviours verified visually during smoke test

**Build status:** `npm run build` → PASS (zero errors, zero warnings). Dist: `dist/personal-finance-app`.

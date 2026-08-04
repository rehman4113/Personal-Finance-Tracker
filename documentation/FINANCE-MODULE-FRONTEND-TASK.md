# Personal Finance Manager — Finance Module Frontend Task

> **Project:** Personal Finance Manager (Frontend)
> **Role:** Senior Angular 20 Enterprise Architect, UI/UX Designer & Frontend Engineer
> **Scope:** COMPLETE Finance module (post-login application). Auth module already exists.

---

## 0. Hard Constraints (Non-Negotiable)

1. **The Auth module is the design system for the whole application.** Every Finance screen MUST follow the exact same visual language (buttons, cards, inputs, radius, spacing, typography, animations, shadows, hovers, focus, transitions, loading, toasts). **DO NOT redesign the application.**
2. Use **ONLY** the backend APIs, request/response DTOs, validation rules, response format, and business logic defined in `AUTH-FINANCE-GUIDE.md` (in this folder).
3. **Never invent APIs. Never rename APIs. Never change request/response contracts.**
4. All responses use the standard `ApiResponse` envelope: `{ success, code, message, data, timestamp }`. Finance prefix: `/api/v1/finance`.
5. **This is NOT a CRUD application** — it is a reusable enterprise finance application:
   - No duplicate pages, forms, tables, or services.
   - Everything must be **configuration-driven** whenever possible.
6. Do **NOT** start coding immediately — design the architecture and explain every decision first (recorded in §4–§6 and the implementation context file), then build **one feature at a time**.

---

## 1. Project Stack

| Technology | Usage |
|-----------|-------|
| Angular 20 | Core framework (standalone component architecture) |
| TypeScript | Strict mode |
| Standalone Components | No `NgModule` boilerplate |
| Bootstrap 5 | Layout, grid, cards, utilities |
| Bootstrap Icons | All icons |
| SCSS | Variables, mixins, nesting — same tokens as Auth (`src/styles.scss`) |
| Angular Signals | All state (no NgRx unless absolutely necessary) |
| Reactive Forms | All forms, reusable validators, inline validation |
| Angular Router | Lazy-loaded feature routes |
| HttpClient | Backend calls (interceptor already handles JWT/401/errors) |
| JWT | Access (15 min) + refresh (7 days) — handled by existing auth module |

### Backend (contract only, already built)
- Java 21, Spring Boot 4, Spring Security 7, JWT, PostgreSQL — do not touch; consume as-is.

---

## 2. Goal

Design and build the **complete Finance module** — the post-login application shell (top navbar, collapsible left sidebar, main content) plus Dashboard, Transactions (config-driven, one reusable module), Wallets, Budgets, Reports, and Settings — as a reusable, configuration-driven, enterprise-grade frontend that reuses the Auth design system.

---

## 3. Expected Output & Deliverables

1. **Architecture explanation first** — why this structure is chosen.
2. **Complete folder structure** — the full tree.
3. **Explanation of EVERY folder** — why it exists, what is stored inside, when it is used.
4. **Reusable strategy** — how duplication is avoided (one transaction module, shared components).
5. **Configuration-driven approach** — how one page/form/table/service serves Income, Expense, Loan, Transfer, All Transactions via configuration.
6. **Shared component strategy** — the shared UI library.
7. **Routing strategy** — lazy-loaded features, nested routes.
8. **Layout strategy** — top navbar + collapsible sidebar + content.
9. **Dashboard design.**
10. Then generate **ONE feature at a time** — never the whole module in one response; every decision explained with a short WHY.

---

## 4. Architecture Overview (Explained)

### 4.1 Why Feature-Per-Folder + Lazy Loading?
Same as Auth: each feature (`dashboard`, `transaction`, `wallet`, `budget`, `report`, `settings`) is a self-contained lazy-loaded unit. Smaller initial bundle, clear ownership, and features can be added/removed without touching the shell.

### 4.2 Why ONE Reusable Transaction Module (Not 5 Pages)?
The prompt is explicit: do NOT create Income/Expense/Loan/Wallet-Transfer/All-Transactions pages. Income, Expense, Loan, Transfer and All Transactions are **the same page, same filters, same table, same service — different configuration** (`mode = INCOME | EXPENSE | LOAN | TRANSFER | ALL`). This is Open/Closed Principle: adding a new transaction type = adding a config entry, zero new pages.

### 4.3 Why Configuration-Driven UI?
Transaction form fields, table columns, filters, and actions vary by type. Keeping these in config files (`transaction-types.config.ts`, `transaction-form.config.ts`, `transaction-table.config.ts`) means business changes are one-line edits and non-developers can maintain them. No conditional spaghetti inside components.

### 4.4 Why Signals for State?
All dashboard/finance state (wallets, transactions, budgets, master data, loading flags) is shared, high-frequency data — ideal for signals exposed from feature services. NgRx is NOT introduced unless a need truly demands it.

### 4.5 Why Shared Components for Everything Repeated?
Data tables, filter panels, search bars, dialogs, amount inputs, currency formatting, empty/error states appear in multiple features. Each lives once in `shared/components`, configured via inputs, so no feature re-implements them.

### 4.6 Why Auth Design System Is Reused?
Consistency = product quality. The Auth module already defines tokens, form styles, toast/error handling, the interceptor, and loading UX. Finance extends that system; it never forks it.

### 4.7 Layering (Same Mental Model as Auth)
```
pages (routes) → services (state + logic) → api (endpoints) → dto/models (data shapes)
shared/components & config → reusable UI and rules
```
- Pages own routes and orchestration — no business logic.
- Services own business logic + signals state; never build URLs.
- `api/` owns endpoint constants only.
- `config/` owns the mode/table/form/menu configuration.
- DTOs mirror backend JSON 1:1.

---

## 5. Complete Folder Structure

```
src/app/
├── core/                                # App-wide infrastructure (loads once)
│   ├── layout/
│   │   └── app-layout/                  # Top navbar + collapsible sidebar + router-outlet
│   │       ├── app-layout.component.ts
│   │       ├── top-navbar/              # Brand, collapse toggle, user menu, logout
│   │       ├── sidebar/                 # Config-driven menu, nested submenus, collapse state
│   │       └── (scss per component)
│   ├── config/
│   │   └── menu.config.ts               # Sidebar menu definition (config-driven)
│   ├── services/                        # App-wide (toast, theme) — reused from auth if present
│   ├── models/                          # Shared models (AuthenticatedUser etc. — from auth)
│   └── constants/                       # Shared constants (routes, storage keys)
│
├── shared/
│   ├── components/                      # Truly reusable UI (see §14)
│   │   ├── data-table/                  # Configurable table: columns/actions/pagination/export
│   │   ├── filter-panel/                # Configurable filter bar
│   │   ├── search-bar/                  # Debounced search input
│   │   ├── page-header/                 # Title + subtitle + actions slot
│   │   ├── summary-card/                # Balance/income/expense/savings cards
│   │   ├── stat-card/                   # Small statistic tile
│   │   ├── confirm-dialog/              # Confirm action modal
│   │   ├── delete-dialog/               # Confirm-delete modal (danger)
│   │   ├── drawer/                      # Right-side slide-over (details, forms)
│   │   ├── modal/                       # Generic modal wrapper
│   │   ├── dropdown/                    # Generic dropdown menu
│   │   ├── currency-input/              # Money input (decimal, thousand separators)
│   │   ├── amount-input/                # Plain numeric amount input
│   │   ├── date-range-picker/           # From/to date pickers
│   │   ├── wallet-selector/             # Wallet dropdown (from wallets signal)
│   │   ├── purpose-selector/            # Purpose dropdown (filtered by transaction type)
│   │   ├── loading-overlay/             # Full-area spinner overlay
│   │   ├── empty-state/                 # Beautiful empty illustration + message + CTA
│   │   ├── error-state/                 # Error message + retry
│   │   └── no-data/                     # Compact "no rows" for tables
│   ├── validators/                      # Generic validators (amount, currency, required-if)
│   ├── pipes/                           # currency, date, transaction-type label
│   └── directives/                      # (if needed) e.g., autofocus, click-outside
│
├── features/                            # Lazy-loaded features
│   ├── dashboard/
│   │   ├── pages/dashboard/             # Summary cards, charts, recent transactions, quick actions
│   │   ├── services/dashboard.service.ts# Aggregations over transactions/wallets/budgets
│   │   ├── components/                  # wallet-summary, monthly-trend (chart components)
│   │   └── dashboard.routes.ts
│   ├── transaction/                     # ONE reusable module for ALL transaction types
│   │   ├── api/transaction.api.ts       # Endpoint constants ONLY
│   │   ├── config/
│   │   │   ├── transaction-types.config.ts  # INCOME/EXPENSE/LOAN/TRANSFER/ALL mode defs
│   │   │   ├── transaction-form.config.ts   # Per-mode field maps
│   │   │   └── transaction-table.config.ts  # Per-mode columns/filters/actions
│   │   ├── dto/                         # Request/response DTOs matching backend
│   │   ├── models/                      # Transaction, WalletEntry, FilterState, PageState
│   │   ├── pages/transaction-list/      # Reusable list page (mode via route data)
│   │   ├── pages/transaction-form/      # Reusable create/edit form (mode via config)
│   │   ├── components/                  # transaction-detail-drawer, ledger-view, loan-user-form
│   │   ├── services/transaction.service.ts
│   │   ├── validators/                  # transaction.validators.ts
│   │   ├── constants/transaction.constants.ts
│   │   └── transaction.routes.ts        # /transactions, /income, /expense, /loan, /transfer
│   ├── wallet/
│   │   ├── api/, dto/, models/, config/, pages/, components/, services/
│   │   └── wallet.routes.ts             # /wallets
│   ├── budget/
│   │   ├── api/, dto/, models/, pages/, services/
│   │   └── budget.routes.ts             # /budgets
│   ├── report/
│   │   ├── api/, dto/, models/, pages/, services/
│   │   └── report.routes.ts             # /reports
│   ├── settings/
│   │   ├── api/, dto/, pages/, components/, services/
│   │   └── settings.routes.ts           # /settings (wallet types, loan users, profile)
│   └── finance.routes.ts                # Shell route: AppLayout + lazy children + AuthGuard
│
└── app.routes.ts                        # Root routes: '' → finance shell (protected), auth routes
```

---

## 6. Folder-by-Folder Explanation (WHY / WHAT / WHEN)

### 6.1 `core/layout/app-layout/`
- **WHY:** The Finance module needs a persistent application shell (navbar + sidebar + content). It is the post-login counterpart of `auth-layout`.
- **WHAT:** `AppLayoutComponent` = top navbar (brand, sidebar toggle, user menu with logout) + collapsible `SidebarComponent` + `<router-outlet>`.
- **WHEN:** Mounted by the finance shell route; never re-created during navigation.

### 6.2 `core/config/menu.config.ts`
- **WHY:** The sidebar must be config-driven (icons, labels, nested items, routes) so adding a menu entry is a data change, not a template change.
- **WHAT:** `NAV_MENU: NavItem[]` — Dashboard, Finance (nested: Transactions, Income, Expenses, Loan, Wallet Transfer), Wallets, Budgets, Reports, Settings, Logout.
- **WHEN:** Consumed by `SidebarComponent`; **Finance submenu collapses automatically when the sidebar is collapsed.**

### 6.3 `core/services/`
- **WHY:** App-wide services used by all features (toast, error formatting) — reused from the Auth module where they already exist.
- **WHAT:** Toast service (if already signal-based in core), any shared API error mapper.
- **WHEN:** Injected anywhere.

### 6.4 `shared/components/`
- **WHY:** Components used by multiple features must not be duplicated (see §14 for the full list).
- **WHAT:** Data table, filter panel, search bar, page header, summary/stat cards, confirm/delete dialogs, drawer, modal, dropdown, currency/amount inputs, date range picker, wallet/purpose selectors, loading overlay, empty/error/no-data states.
- **WHEN:** Imported by any feature's standalone component.

### 6.5 `features/transaction/` (the core of this task)
- **WHY:** One reusable module serves ALL transaction screens — same page, filters, table, service; different configuration. This is the anti-duplication heart of the app.
- **WHAT:**
  - `api/transaction.api.ts` — endpoint constants only.
  - `config/` — mode definitions, per-mode form field maps, per-mode table column/filter/action maps.
  - `dto/` — `CreateTransactionRequest`, `TransactionResponse`, `WalletEntryDto`, `MasterDataResponse`, etc. mirroring the guide 1:1.
  - `models/` — frontend shapes: `Transaction`, `WalletEntry`, `TransactionMode`, `TransactionFilter`, `PageState`.
  - `pages/transaction-list/` — the ONE list page (mode from route data).
  - `pages/transaction-form/` — the ONE create form (fields per mode from config).
  - `components/` — transaction detail drawer, ledger view, loan-user inline form.
  - `services/transaction.service.ts` — ONE service: fetch master data, wallets, create/list transactions, loan users.
  - `validators/` — amount > 0, required-if per mode, date validators.
  - `constants/` — routes, storage keys, messages.
  - `transaction.routes.ts` — `/transactions`, `/income`, `/expense`, `/loan`, `/transfer` all resolve to the same components with different `mode` route data.
- **WHEN:** Every menu item under "Finance" navigates here.

### 6.6 `features/wallet/`
- **WHY:** Wallets are a separate concern (account management) but reuse shared table/form components.
- **WHAT:** Wallet list (name, type, currency, currentBalance, status), create/edit form (wallet type selector from master data), close (soft-delete) with confirm dialog.
- **WHEN:** Accessed from the Wallets menu item and via `wallet-selector` inside transaction forms.

### 6.7 `features/budget/`
- **WHY:** Monthly spending limits with alert levels — distinct domain, shares table/stat components.
- **WHAT:** Month picker, budget list with progress bars + `NORMAL`/`WARNING`/`EXCEEDED` badges, create/edit/delete.
- **WHEN:** Accessed from the Budgets menu item; budget status also appears on the Dashboard.

### 6.8 `features/report/`
- **WHY:** Aggregated views. Backend exposes no report API — reports are **client-side aggregations** over `GET /transactions` (plus wallets/budgets). No new backend calls.
- **WHAT:** Monthly income vs expense, expense by purpose/category, wallet balance summary, CSV export.
- **WHEN:** Accessed from the Reports menu item.

### 6.9 `features/settings/`
- **WHY:** Account-level management.
- **WHAT:** Wallet types CRUD (system defaults read-only; custom types editable), loan users management (list/create/edit/history — the Loan feature's people records), profile display (auth user).
- **WHEN:** Accessed from the Settings menu item.

### 6.10 `features/dashboard/`
- **WHY:** The landing page after login — an aggregate of everything, but owns no CRUD.
- **WHAT:** Current balance, income, expense, savings summary cards; budget status; recent transactions; quick actions (New Income/Expense/Transfer/Loan); charts (wallet summary, monthly trend); subtle card animations.
- **WHEN:** Default route after login.

### 6.11 `features/finance.routes.ts`
- **WHY:** Single protected shell route group for the Finance module.
- **WHAT:** `path: ''` → `AppLayoutComponent`, `canActivate: [authGuard]`, lazy children for dashboard/transaction/wallet/budget/report/settings.
- **WHEN:** Referenced from `app.routes.ts`; the auth module routes remain untouched.

### 6.12 Folders Considered But Rejected
| Folder | Why rejected |
|--------|--------------|
| `features/finance/` flat everything | Too big for one feature folder; per-domain features (`transaction`, `wallet`, ...) keep lazy-loading and ownership clean |
| NgRx store | Signals suffice at this scale; NgRx only if state complexity demands it |
| `shared/directives/` in every feature | Keep generic directives in `shared/` only |
| Per-mode pages (`income/`, `expense/`, ...) | The core requirement is ONE config-driven transaction module — separate pages are forbidden |

---

## 7. Application Layout

- Post-login shell: **Top Navbar / Left Sidebar / Main Content**.
- **Top navbar:** brand + wallet icon (same visual language as auth brand), sidebar collapse toggle, user name/email, logout (uses existing `AuthenticationService.logout()`).
- **Sidebar:** professional finance style, icons + labels, smooth animations, **nested menus**, **collapsed state persisted** (localStorage).
  - Collapsed → only icons remain, menu text disappears, submenus collapse automatically, content area expands automatically.
- **Responsive:** desktop (full sidebar), tablet (collapsible/overlay), mobile (off-canvas drawer style with backdrop).
- Main content: padded container, page header + content, consistent with auth spacing tokens.

---

## 8. Sidebar & Menu Configuration

| Menu item | Route | Icon (suggested) | Notes |
|-----------|-------|------------------|-------|
| Dashboard | `/dashboard` | `bi-speedometer2` | |
| Transactions | (parent) | `bi-list-ul` | Nested submenu — expands/collapses with rotating chevron |
| ├ All Transactions | `/transactions` | `bi-list-check` | mode = ALL |
| ├ Income | `/income` | `bi-arrow-down-circle` | mode = INCOME |
| ├ Expenses | `/expense` | `bi-arrow-up-circle` | mode = EXPENSE |
| ├ Loans | `/loan` | `bi-cash-coin` | mode = LOAN |
| └ Wallet Transfers | `/transfer` | `bi-arrow-left-right` | mode = TRANSFER |
| Wallets | `/wallets` | `bi-wallet` | |
| Budgets | `/budgets` | `bi-pie-chart` | |
| Reports | `/reports` | `bi-bar-chart-line` | |
| Settings | `/settings` | `bi-gear` | Pinned to sidebar bottom, divider above |
| Logout | (action) | `bi-box-arrow-right` | Pinned below Settings; danger-red hover tint |

**Configuration:** `NavItem { label; icon; route?; children?: NavItem[]; action?: 'logout' }` — rendered recursively; children auto-collapse when the sidebar collapses.

**Sidebar visual design (implemented Aug 3, 2026):** navy gradient (`--pfm-sidebar-bg-start → --pfm-sidebar-bg-end`), faint amber trend-line SVG backdrop (opacity ~6%), brand block with divider, amber/gold active pill (`rgba(255,209,102,.14)`) + left accent bar + amber icon/text, hover `rgba(255,255,255,.08)`, `#B8C4D9` resting text, 10px-radius full-width nav rows, `--pfm-sidebar-nav-padding` 24px container padding, Settings + Logout pinned to the bottom via `app-sidebar-item:nth-last-child(2) { margin-top: auto }` with a divider, Logout red-tint hover, chevron rotation on the Transactions parent, 264px fixed width, off-canvas drawer ≤767.98px. **Nav-row styles live in `sidebar-item.component.scss`** (own `styleUrl` — view encapsulation previously left links unstyled).

---

## 9. Transaction Module — Configuration-Driven Modes

### 9.1 Route → Mode Mapping
| URL | mode | Meaning |
|-----|------|---------|
| `/income` | `INCOME` | Salary, freelance, pocket money, gift, other income |
| `/expense` | `EXPENSE` | Food, mobile, travel, utilities, health, education, etc. |
| `/loan` | `LOAN` | Loan transactions (RECEIVABLE/PAYABLE + borrower) |
| `/transfer` | `TRANSFER` | Wallet-to-wallet transfer |
| `/transactions` | `ALL` | All transactions, all filters |

All routes resolve to the **same** `TransactionListPage` / `TransactionFormPage` with `mode` from route data → the page reads its mode configuration.

### 9.2 Mode Configuration Shape (`transaction-types.config.ts`)
```ts
export interface TransactionModeConfig {
  mode: TransactionMode;            // 'INCOME' | 'EXPENSE' | 'LOAN' | 'TRANSFER' | 'ALL'
  title: string;                    // 'Income' | 'Expense' | ...
  pageHeaderIcon: string;
  transactionTypeId?: number;       // 1..4 from master data (undefined for ALL)
  subcategoryId?: number;           // for LOAN: 10 RECEIVABLE / 11 PAYABLE selectable
  purposesFor: 'income' | 'expense' | 'transfer' | 'loan' | 'all';  // which purposes to offer
  form: TransactionFormConfig;      // see §10
  table: TransactionTableConfig;    // see §11
  canCreate: boolean;               // ALL mode can create any type via type selector
}
```

---

## 10. Transaction Form (ONE Reusable Form)

Fields appear according to transaction type — everything driven by `transaction-form.config.ts`.

| Mode | Shown fields | Hidden / N/A |
|------|--------------|--------------|
| INCOME | Purpose (income purposes), Amount, Wallet (`walletId`), Date, Merchant, Description/Notes | Transfer wallets, Borrower |
| EXPENSE | Purpose (expense purposes), Amount, Wallet (`walletId`), Date, Merchant, Subcategory (if applicable), Description/Notes | Transfer wallets, Borrower |
| LOAN | Borrower (`personName` — auto-creates loan user), Direction (`transactionSubcategoryId`: RECEIVABLE "I gave money" / PAYABLE "I received money"), Amount, Wallet, Date, Description | Merchant |
| TRANSFER | From Wallet (`sourceWalletId`), To Wallet (`destinationWalletId`), Amount, Date, Description | Merchant, Borrower, Purpose (fixed WALLET_TRANSFER) |
| ALL | Type selector (INCOME/EXPENSE/LOAN/TRANSFER) + the fields of the selected type | — |

**Field map shape:** `fields: { name; label; controlType: 'input'|'select'|'currency'|'date'|'textarea'|'wallet'|'purpose'|'subcategory'; options?; required; hiddenFor?: mode[] }[]`.

**Validation rules (client mirrors the guide; server is authoritative):**
- Amount required, > 0 (currency input).
- Wallet required for INCOME/EXPENSE/LOAN; source + destination required for TRANSFER.
- Sum of wallet entry amounts must equal `totalAmount` (single entry per wallet for income/expense/loan; two entries for transfer — the form builds `walletEntries` automatically).
- Expense: client-side hint when wallet `currentBalance < amount` (server enforces and returns the error).
- LOAN: `personName` required; direction (subcategory 10 or 11) required; wallet balance check for RECEIVABLE (money leaves your wallet).
- Reactive forms, reusable validators, inline validation, loading state, submit disabled while request in flight (same as auth).

---

## 11. Transaction Table (ONE Reusable Table)

**Columns configured by transaction type** (`transaction-table.config.ts`):

| Column | INCOME | EXPENSE | LOAN | TRANSFER | ALL |
|--------|:---:|:---:|:---:|:---:|:---:|
| Date | ✔ | ✔ | ✔ | ✔ | ✔ |
| Type badge | | | | | ✔ |
| Purpose | ✔ | ✔ | | ✔ (WALLET_TRANSFER) | ✔ |
| Merchant / Borrower | ✔ merchant | ✔ merchant | ✔ borrower | | ✔ |
| Wallet(s) | ✔ | ✔ | ✔ | From → To | ✔ |
| Amount (+/− sign) | ✔ | ✔ | ✔ | ✔ | ✔ |
| Status badge | ✔ | ✔ | ✔ | ✔ | ✔ |
| Actions (view/ledger) | ✔ | ✔ | ✔ | ✔ | ✔ |

- **Filters configurable:** date range, wallet, purpose, status; search; per-mode defaults (e.g., `/income` filters `transactionTypeId = INCOME`).
- **Actions configurable:** View detail (drawer), View ledger (drawer — `GET /transactions/{id}/ledger`).
- **Pagination reusable:** client-side page-state (no backend pagination parameters in the guide) — default page size, page indicator, total count.
- **Search reusable:** debounced input filtering the loaded list.
- **Export reusable:** client-side CSV export of the current filtered set.
- **Sticky table header; skeleton rows while loading; beautiful empty state; no-data compact state.**
- **NOTE:** the guide exposes NO delete/update endpoints for transactions — do NOT add delete/edit actions (no invented APIs).

---

## 12. Transaction Service & API Layer

- **`TransactionService`** (ONE service): signals for `masterData`, `wallets`, `transactions` (per mode/filter), `budgets`, `loanUsers`, `isLoading`; methods: `loadMasterData()`, `loadWallets()`, `loadTransactions(filter)`, `createTransaction(request)`, `loadTransaction(id)`, `loadLedger(id)`, `loadBudgets(month)`, `createBudget/update/delete`, `loadLoanUsers()`, `createLoanUser()`, `loadLoanHistory(id)`.
- **`api/transaction.api.ts`** — endpoint constants ONLY, matching the guide exactly (§13).

---

## 13. Backend Contract Summary (from AUTH-FINANCE-GUIDE.md — use exactly)

Base: `http://localhost:8082`, prefix `/api/v1/finance`, envelope `ApiResponse<T>`.

### 13.1 Master Data (public, no auth)
- `GET /api/v1/finance/master` → `{ walletTypes: [{id, code, name, active}], transactionTypes: [{id, code}], transactionPurposes: [{id, code, name, type}], transactionStatuses: [{id, code}] }`

### 13.2 Wallets
| Method | Endpoint |
|--------|----------|
| `GET` | `/api/v1/finance/wallets` (list, includes `currentBalance`) |
| `POST` | `/api/v1/finance/wallets` — `{ walletTypeId, walletName, currency?, initialBalance?, accountNumber?, description? }` |
| `GET` | `/api/v1/finance/wallets/{id}` |
| `PUT` | `/api/v1/finance/wallets/{id}` |
| `DELETE` | `/api/v1/finance/wallets/{id}` — soft close (status `CLOSED`) |
| `GET`/`POST` | `/api/v1/finance/wallets/types` (+ `{id}` GET/PUT/DELETE; system defaults cannot be modified/deleted; `code` uppercase unique per user) |

### 13.3 Transactions
| Method | Endpoint |
|--------|----------|
| `POST` | `/api/v1/finance/transactions` — `{ transactionTypeId, transactionPurposeId, transactionSubcategoryId?, transactionStatusId, totalAmount, transactionDate, description?, referenceNumber?, notes?, personName?, walletEntries: [...] }` |
| `GET` | `/api/v1/finance/transactions` (list all user transactions) |
| `GET` | `/api/v1/finance/transactions/{id}` |
| `GET` | `/api/v1/finance/transactions/{id}/ledger` — immutable entries `{ id, transactionId, walletId, debit, credit, balanceAfter, remarks, createdAt }` |
| `GET` | `/api/v1/finance/transaction-details` / `{id}` / `/by-history/{historyId}` |

**Wallet entries by type:** INCOME/EXPENSE/LOAN → `{ walletId, amount, merchant? }`; TRANSFER → `{ sourceWalletId, destinationWalletId, amount }`.

**Validation (server):** Income adds amount; Expense subtracts (balance must be sufficient); Transfer debits source / credits destination (source balance sufficient); sum of entries = `totalAmount`; all wallets must belong to the user.

**Master data IDs (seed):** types: 1 INCOME, 2 EXPENSE, 3 TRANSFER, 4 LOAN. Purposes: INCOME 1–5 (SALARY, FREELANCE, POCKET_MONEY, GIFT, OTHER_INCOME); EXPENSE 6–17 (FOOD_CAMPUS, FOOD_OUTSIDE, MOBILE, TRAVEL_HOME, TRAVEL_COMMUTE, UTILITIES, CLOTHING, HEALTH, EDUCATION, ENTERTAINMENT, GROCERIES, MISC); TRANSFER 18 (WALLET_TRANSFER); LOAN 19 (LOAN). Loan subcategories: 10 RECEIVABLE, 11 PAYABLE. Statuses: 1 PENDING, 2 COMPLETED, 3 FAILED, 4 REVERSED. **Fetch IDs from `/master` — never hardcode.**

### 13.4 Loans
- `POST /api/v1/finance/loan-users` — `{ fullName, contactNumber?, notes? }` → `{ id, userId, fullName, contactNumber, uniqueKey, currentAmount, loanStatus (RECEIVABLE|PAYABLE|CLOSED), notes, createdAt, updatedAt }`
- `GET /api/v1/finance/loan-users`, `GET/PUT .../{id}`, `GET .../{id}/history` (audit trail).
- Loan transactions: standard `POST /transactions` with `transactionTypeId: 4`, `transactionSubcategoryId: 10|11`, `personName` (auto-creates the loan user). System auto-updates `currentAmount`/`loanStatus` and handles overpayment status reversal.

### 13.5 Budgets
- `POST /api/v1/finance/budgets` — `{ transactionPurposeId (EXPENSE purpose), monthlyLimit, month "YYYY-MM", warningThreshold? (1–100, default 80) }`
- `GET /api/v1/finance/budgets?month=YYYY-MM`, `GET/PUT/DELETE .../{id}`
- Response data: `{ id, purposeCode, purposeName, monthlyLimit, month, warningThreshold, totalSpent, remaining, usagePercentage, alertLevel: NORMAL|WARNING|EXCEEDED }` (WARNING = usage ≥ threshold, EXCEEDED = ≥ 100%).

### 13.6 Shared Expenses (out of the sidebar scope — implement only if explicitly requested later)
- `POST /api/v1/finance/shared-expenses`, `PUT .../{expenseId}/settle/{memberId}`, `GET ...` / `{id}`.

---

## 14. Reusable Components (shared/components — MUST exist, no duplicates)

| Component | Behavior |
|-----------|----------|
| `data-table` | Configurable columns/actions; sticky header; sorting; pagination; skeleton loading; no-data state |
| `filter-panel` | Configurable filters (date range, wallet, purpose, status); reset |
| `search-bar` | Debounced text search input |
| `page-header` | Icon + title + subtitle + action slot (e.g., "Add Income" button) |
| `summary-card` | Big value card (current balance, income, expense, savings) with icon + trend accent |
| `stat-card` | Compact statistic tile (budget usage, wallet count) |
| `confirm-dialog` | Reusable confirm action modal |
| `delete-dialog` | Danger confirm modal |
| `drawer` | Right slide-over panel (transaction details, ledger, quick forms) |
| `modal` | Generic modal wrapper |
| `dropdown` | Generic menu dropdown |
| `currency-input` | Money input: digits + separators, 2 decimals, prefix (PKR) |
| `amount-input` | Numeric amount input |
| `date-range-picker` | From/to date inputs |
| `wallet-selector` | Wallet options from wallet service signals |
| `purpose-selector` | Purpose options filtered by transaction type from master data |
| `loading-overlay` | Full-content spinner overlay |
| `empty-state` | Illustration + message + optional CTA |
| `error-state` | Message + retry button |
| `no-data` | Compact "no rows" for tables |

**Rule:** every feature composes these; no feature re-implements them.

---

## 15. Dashboard

- **Summary cards (animate subtly on load):** Current Balance (sum of active wallet `currentBalance`), Income (this month), Expense (this month), Savings (income − expense).
- **Budget status:** budgets for the current month with progress bars + alert badges.
- **Recent transactions:** latest 5–10 (reuse `data-table` in compact mode).
- **Quick actions:** buttons to open `/income`, `/expense`, `/transfer`, `/loan` (route links).
- **Charts (client-side, Bootstrap/CSS or lightweight SVG — no new backend APIs):** Wallet Summary (per-wallet balance bars), Monthly Trend (income vs expense by month from `GET /transactions`).
- Minimal, premium, professional; large whitespace; soft shadows; rounded cards; responsive grid.

---

## 16. Wallets Feature

- List (reuse `data-table`): name, type (code), currency, `currentBalance`, status badge (ACTIVE/CLOSED), description.
- Create/Edit (reuse form patterns): wallet type selector (from master data `walletTypes`), name, currency (default PKR), initial balance (create only), account number (unique per user+type), description.
- Close wallet = `DELETE /wallets/{id}` behind a `confirm-dialog` (soft close, status CLOSED).
- System wallet types (e.g., CASH) shown read-only.

---

## 17. Budgets Feature

- Month picker (`YYYY-MM`), default current month.
- List: purpose name, monthly limit, `totalSpent`, `remaining`, progress bar, `alertLevel` badge (NORMAL/WARNING/EXCEEDED).
- Create/Edit: EXPENSE purpose selector, monthly limit, warning threshold (1–100, default 80).
- Delete behind `delete-dialog`.

---

## 18. Reports Feature

- Client-side aggregations over `GET /transactions` (plus wallets + budgets) — **no new backend APIs**:
  - Monthly income vs expense (bar chart + table).
  - Expense by purpose/category (pie/donut or horizontal bars).
  - Wallet balance summary.
  - CSV export of aggregated data (reuse export utility).
- Reuse `stat-card`, `data-table`, `date-range-picker`.

---

## 19. Settings Feature

- **Wallet Types:** list system + custom types; create/edit/delete custom types (`/wallets/types` CRUD); system defaults read-only.
- **Loan Users:** list, create (`fullName`, `contactNumber`, `notes`), edit, view history (`/loan-users/{id}/history`).
- **Profile:** display auth user (name/email from `AuthenticationService.currentUser`), logout.

---

## 20. Design System (Reuse Auth EXACTLY)

Same visual language as the Auth module — **do not create another design language**:
- Same buttons, cards, inputs, border radius, spacing, typography, shadows, hover/focus effects, transitions, loading spinners, toasts.
- All tokens already live in `src/styles.scss` (`--pfm-*`); add new finance tokens there — never hardcode inline.
- Auth components (toast, validators, submit button patterns) reused where applicable.

### 20.1 Dark Theme (Finance Shell — implemented Aug 3, 2026)

The post-login finance shell is dark-themed while Auth pages keep the light design system. Implemented as a **scoped dark-theme partial in `src/styles.scss`** — a `.app-shell { ... }` block that overrides the shared `--pfm-*` tokens **and** Bootstrap 5.3 CSS variables (`--bs-body-bg/color`, `--bs-card-bg`, `--bs-border-color`, `--bs-*-bg-subtle`/`--bs-*-text-emphasis` for badges, `--bs-progress-bg`, `--bs-focus-ring-color`, `--bs-link-color`, `--bs-form-select-bg-img`) so every utility/component inside the shell inherits the theme automatically — no per-page dark colors.

| Token group | Dark value | Purpose |
|-------------|-----------|---------|
| `--pfm-bg-gradient-start/end` | `#0b1120` / `#111827` | Page surface (blue-toned navy) |
| `--pfm-card-bg` / `--pfm-card-border` | `#161f32` / `rgba(255,255,255,0.08)` | Elevated cards/panels + 1px border |
| `--pfm-text-primary/muted/faint` | `#e6edf7` / `#9fb0c9` / `#7c8ba5` | Light gray-blue text ladder (WCAG AA) |
| `--pfm-panel-accent` | `#ffd166` | Amber accent: focus ring, icons, active CTAs |
| `--pfm-success/danger/warning/info` (+`-tint`) | `#4ade80/#f87171/#fbbf24/#38bdf8` at `rgba(...,0.14)` bg | Tinted status pills readable on dark |
| `--pfm-input-bg/input-border` | `#1b2540` / `rgba(255,255,255,0.12)` | Form controls (filter bar, pickers, search) |
| `--pfm-table-header-bg/text` | `#131c30` / `#9fb0c9` | Dark table header, uppercase gray-blue labels |
| `--pfm-shadow(-card)` | black-based glows | Soft shadow instead of flat drop-shadow |
| `--pfm-row-hover/divider/skeleton-*` | white-alpha variants | Row hover, divider lines, shimmer skeletons |

- **Content backdrop** (`app-layout.component.scss`): layered backgrounds — amber + blue radial orbs (opacity ~5%), faint 28px grid (`rgba(255,255,255,0.022)`), low-opacity upward trend-line SVG, over a 160° navy gradient.
- **Controls:** dark inputs with amber focus ring (`box-shadow 0 0 0 .25rem var(--pfm-focus-ring)`), light select chevron + dark option list, `.btn-outline-primary` → light ghost (blue-tinted border, hover fill), `.btn-primary-gradient` stays navy.
- **Badges/tables:** Bootstrap `bg-*-subtle text-*` and custom badge classes all resolve through the overridden `--bs-*` vars → tinted pills with bright semantic text. Table rows get `rgba(255,255,255,0.06)` dividers + `--pfm-row-hover`.
- **Top navbar:** `#101a2e` surface, light text, avatar amber ring, dark dropdown panel (`--pfm-card-bg` + border), red-tint logout hover.
- **Empty/error/no-data states:** muted `--pfm-text-faint` icons/text, amber empty-state art on dark gradient — never gray-on-white.
- **Shared components** (summary/stat-card, data-table, filter-panel, search-bar, dropdown, modal, drawer, confirm-dialog, page-header, form-header, currency-input, loading-overlay) converted from hardcoded light colors to the semantic tokens — auth pages render the `:root` light defaults, finance pages the `.app-shell` dark overrides.

### 20.2 Theming Rules
1. Never hardcode colors inside feature page SCSS — use `--pfm-*` tokens (dark overrides live in the `.app-shell` block).
2. New shared components must use tokens only, with a light default in `:root` so Auth stays intact.
3. Amber `--pfm-panel-accent` is the single accent: active nav, focus rings, key highlights.

---

## 21. Forms & Validation

- Reactive Forms everywhere; reusable validators (amount, currency, required-if, date).
- Inline validation via the existing `validation-messages` pattern.
- Loading state + disabled submit while API calls are in flight.
- Server `ApiResponse` messages shown inline/toast first; fall back to network/global messages (existing interceptor already handles 401 refresh and network errors).

---

## 22. State Management

- **Angular Signals only** — feature services expose signals; no NgRx unless absolutely necessary (see §4.4).

---

## 23. Error Handling

| Scenario | Behavior |
|----------|----------|
| Backend validation errors | Show `ApiResponse.message` + code inline / toast |
| 401 | Existing interceptor: refresh once → retry; on failure logout + redirect to login |
| Network errors | Toast "Cannot reach server" (existing interceptor) |
| Loading | Skeleton loaders / shimmer / loading overlay |
| Empty data | Beautiful `empty-state` / `no-data` components |
| API failure on load | `error-state` with retry |

---

## 24. Code Quality Requirements

- **SOLID** — SRP per file; Open/Closed via configuration (new transaction type = new config, no new pages); interfaces for DTOs.
- **No duplicated code** — one transaction module, shared components, shared services, config-driven everything.
- Enterprise naming: feature-first files (`transaction-list.page.ts`, `transaction.service.ts`), clean folder structure.
- Strict TypeScript; standalone components; lazy routes; signals.
- Readable for a backend developer: mirror backend terminology (controller → page, service → service, DTO → DTO, `api/` → repository layer, `config/` → application.properties).

---

## 25. Acceptance Criteria

- [ ] Application shell: top navbar + collapsible left sidebar + main content; sidebar collapse shows only icons, hides submenus, persists state; responsive (desktop/tablet/mobile)
- [ ] Same design system as Auth (tokens, components, toasts, loading) — no new design language
- [ ] NO separate Income/Expense/Loan/Transfer/All pages — ONE config-driven transaction module
- [ ] `/income`, `/expense`, `/loan`, `/transfer`, `/transactions` all render the SAME page/table/service with different `mode` config
- [ ] One reusable transaction form; fields appear per type (income source, merchant, borrower, from/to wallet)
- [ ] One TransactionService; no duplicate services; endpoint constants only in `api/`
- [ ] All APIs/DTOs match AUTH-FINANCE-GUIDE.md exactly; no invented/renamed endpoints; no delete/edit on transactions (not in the guide)
- [ ] Master data loaded from `/api/v1/finance/master` and used for all type/purpose/status IDs
- [ ] Table: configurable columns/filters/actions, pagination, search, CSV export, sticky header, skeleton loading
- [ ] Shared components exist and are used: data-table, filter-panel, search-bar, page-header, summary-card, stat-card, confirm-dialog, delete-dialog, drawer, modal, dropdown, currency-input, amount-input, date-range-picker, wallet-selector, purpose-selector, loading-overlay, empty-state, error-state, no-data
- [ ] Dashboard: balance/income/expense/savings cards, budget status, recent transactions, quick actions, wallet summary + monthly trend charts, subtle animations
- [ ] Wallets: list/create/edit/close; wallet types respected
- [ ] Budgets: month selector, limits, progress, NORMAL/WARNING/EXCEEDED alerts, CRUD
- [ ] Reports: client-side aggregations + CSV export; no new backend APIs
- [ ] Settings: wallet types CRUD, loan users CRUD + history, profile
- [ ] LOAN flow: borrower + RECEIVABLE/PAYABLE direction; loan user auto-creation works through the backend
- [ ] Forms: reactive, reusable validators, inline validation, loading, disabled submit
- [ ] Signals only; no NgRx
- [ ] `npm run build` clean; no console errors; responsive on mobile/tablet/desktop

---

## 26. Suggested Implementation Order

1. Scaffold finance shell: `core/layout/app-layout` (top navbar + sidebar + content) + `core/config/menu.config.ts` + `finance.routes.ts` wired into `app.routes.ts` behind `authGuard`
2. Shared components batch 1: `page-header`, `summary-card`, `stat-card`, `loading-overlay`, `empty-state`, `error-state`, `no-data`, `modal`, `confirm-dialog`, `delete-dialog`, `drawer`, `dropdown`
3. Shared components batch 2: `search-bar`, `filter-panel`, `data-table` (columns/actions/pagination/export), `currency-input`, `amount-input`, `date-range-picker`
4. Transaction foundation: `api/`, `dto/`, `models/`, `constants/`, `TransactionService` + master-data/wallets/transactions signals; `wallet-selector`, `purpose-selector`
5. Transaction config: `transaction-types.config.ts`, `transaction-form.config.ts`, `transaction-table.config.ts`
6. Transaction pages: list page (mode-driven) + form page (mode-driven) + `transaction.routes.ts` (`/income`, `/expense`, `/loan`, `/transfer`, `/transactions`)
7. Transaction extras: detail drawer, ledger view, loan-user inline form, CSV export
8. Dashboard feature (summary cards, budget status, recent transactions, quick actions, charts)
9. Wallets feature (list/create/edit/close + types)
10. Budgets feature (month selector, alerts, CRUD)
11. Reports feature (client-side aggregations + export)
12. Settings feature (wallet types, loan users, profile) + final review against §25 acceptance criteria

---

## 27. Progress Log

> Progress is tracked in `FINANCE-IMPLEMENTATION-CONTEXT.md` (created when implementation starts). Follow the same pattern as the Auth module: update the log after each completed step, verify with `npm run build` and headless-Chrome checks, and record runtime fixes.

# Personal Finance Manager — Frontend (Auth Module)

Angular 20 frontend for the Personal Finance Manager application.
This repository currently implements the **Authentication module only** (login, register, session management).
The Finance module (wallets, transactions, budgets, loans, shared expenses) is **out of scope** for now.

> Backend contract: `../documentation/AUTH-FINANCE-GUIDE.md` — Spring Boot 4 backend running at `http://localhost:8082`.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ (LTS recommended) |
| npm | 10+ |
| Backend | Personal Finance Manager API running on `http://localhost:8082` |

---

## Quick Start

```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the development server
npm start
```

Open your browser at **`http://localhost:4200`**. The app auto-reloads on file changes.

> **Important:** the login/register calls will only work while the backend is running on `http://localhost:8082`.
> Base URL is configurable in `src/app/core/config/app.config.ts`.

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server (`ng serve`) → `http://localhost:4200` |
| `npm run build` | Production build → output in `dist/personal-finance-app` |
| `npm run watch` | Build in watch mode (development configuration) |
| `npm test` | Run unit tests via Karma (`ng test`) |

---

## Pages

| Route | Description | Guard |
|-------|-------------|-------|
| `/login` | Sign in with email + password, "Remember me" (session vs persistent storage), forgot-password link | `GuestGuard` |
| `/register` | Create account: first/last name, gmail-only email, country code + phone, password with live strength + checklist, confirm password | `GuestGuard` |
| `/forgot-password` | Placeholder (no backend API exists in current scope) | `GuestGuard` |
| `/home` | Protected stub landing page with logout (placeholder for the future finance dashboard) | `AuthGuard` |

---

## Feature Overview (Auth Module)

- **Standalone components** (Angular 20, no `NgModule`), lazy-loaded feature routes.
- **Signals** for auth state (`currentUser`, `isAuthenticated`, `isLoading`) and toasts.
- **JWT flow** (contract from `AUTH-FINANCE-GUIDE.md`):
  - Login → stores `accessToken` (15 min) + `refreshToken` (7 days) + user profile.
  - HTTP interceptor attaches `Authorization: Bearer <accessToken>` to every protected request (public endpoints `/login`, `/register`, `/refresh` are skipped).
  - On a 401 the interceptor **auto-refreshes once** (single-flight — concurrent 401s share one refresh call), stores the rotated token pair and retries the original request.
  - If refresh fails → local sign-out + redirect to `/login`.
  - Logout sends the **refresh token** in the `Authorization` header (backend contract) and clears local state.
- **Validation rules** (reactive forms + reusable validators): first name (alphabets, 2–100), last name (optional, ≤100), email (valid + `@gmail.com` only), phone (digits, 10–15), password (8–100, uppercase/lowercase/digit/special), confirm password (must match).
- **Error handling:** backend `ApiResponse.message` shown inline + toast; friendly fallbacks for network/offline and mapped error codes (`AUTH-401-001`, `AUTH-409-001`, etc.).

### Reusable Components

`password-input` (show/hide + strength + checklist), `country-code-dropdown`, `phone-number-input`, `submit-button` (loading state), `form-header`, `loading-spinner`, `validation-messages` — all standalone and reused by the login/register pages.

---

## Folder Structure

```
src/app/
├── core/                     # App-wide infrastructure
│   ├── components/toast-container/
│   ├── pages/home/           # Home stub
│   ├── interceptors/auth.interceptor.ts
│   ├── layout/auth-layout/
│   ├── services/toast.service.ts
│   ├── models/               # User, TokenInfo, AuthenticatedUser
│   ├── constants/            # Storage keys, app routes
│   └── config/               # API base URL
├── shared/                   # Cross-feature reusable UI
│   └── components/           # form-header, submit-button, loading-spinner, validation-messages
├── features/auth/            # Auth feature (lazy-loaded)
│   ├── api/                  # Endpoint constants only
│   ├── dto/                  # Request/response DTOs mirroring backend 1:1
│   ├── models/               # Frontend business models
│   ├── interfaces/           # Feature-local type contracts
│   ├── services/             # AuthenticationService (state + logic)
│   ├── pages/                # login, register, forgot-password
│   ├── components/           # password-input, country-code-dropdown, phone-number-input
│   ├── validators/           # auth.validators, confirm-password.validator
│   ├── guards/               # auth.guard, guest.guard
│   ├── constants/            # Storage keys, routes, regex, messages
│   ├── config/               # Country codes, password rules
│   ├── utils/                # token.utils, password.utils
│   └── auth.routes.ts        # Lazy auth routes
└── app.routes.ts             # Root routes
```

---

## Tech Stack

Angular 20 · TypeScript (strict) · Standalone Components · Angular Router (lazy) · Reactive Forms · HttpClient + functional interceptors · Signals · SCSS · Bootstrap 5 · Bootstrap Icons · JWT (access + rotating refresh token)

---

## Related Docs

- `AUTH-MODULE-FRONTEND-TASK.md` — full task specification (architecture, folder explanations, acceptance criteria).
- `AUTH-IMPLEMENTATION-CONTEXT.md` — implementation progress log and decisions.
- Backend guide: `../documentation/AUTH-FINANCE-GUIDE.md` — complete API contract (auth + future finance module).

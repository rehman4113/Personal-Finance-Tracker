# Personal Finance Tracker

Personal finance tracking application — a Spring Boot REST API (`backend/`) with an
Angular 20 single-page app (`frontend/`). Features include wallets, transactions
(income/expense/transfer/loan), budgets, reports, and loan tracking.

## Repository structure

```
Personal-Finance-Tracker/
├── backend/       — Spring Boot 4 application (Java, PostgreSQL, Flyway, JWT auth)
├── frontend/      — Angular 20 application (Chart.js, Bootstrap 5)
├── documentation/ — project docs (API contract, task specs, progress logs)
├── README.md
└── .gitignore
```

## Backend (Spring Boot)

- Requires PostgreSQL running locally (see `backend/src/main/resources/application.yaml`
  for the **local dev** configuration — localhost credentials only).
- Schema is managed by Flyway (`backend/src/main/resources/db/migration`).

```bash
cd backend
./mvnw clean package        # or: mvnw.cmd on Windows — builds backend/target/*.jar
./mvnw spring-boot:run      # local dev server on http://localhost:8082
```

Full API contract: `documentation/AUTH-FINANCE-GUIDE.md`.

## Frontend (Angular)

- The Angular dev server proxies API calls to `http://localhost:8082`
  (configured in `frontend/src/app/core/config/app.config.ts`).

```bash
cd frontend
npm install
npm start                   # dev server on http://localhost:4200
```

Frontend docs live in `frontend/README.md`.

## Production deployment

Activate the production profile externally (never hardcoded):

```
SPRING_PROFILES_ACTIVE=prod
```

The `backend/src/main/resources/application-prod.yml` replaces hardcoded values with
environment variables. Required in the deployment environment:

| Variable      | Purpose                        | Example                     |
|---------------|--------------------------------|-----------------------------|
| `DB_URL`      | JDBC connection URL            | `jdbc:postgresql://host:5432/db` |
| `DB_USERNAME` | Database user                  | —                           |
| `DB_PASSWORD` | Database password              | —                           |
| `JWT_SECRET`  | JWT signing secret             | any long random string      |

Optional overrides (defaults shown in `application-prod.yml`): `PORT`, `DDL_AUTO`,
`SHOW_SQL`, `JWT_ACCESS_EXPIRATION_MS`, `JWT_REFRESH_EXPIRATION_MS`.

> **Note:** the local dev config (`application.yaml`) contains localhost-only database
> credentials used solely for local development and is committed as-is.

> **Note:** CORS allowed origins are still hardcoded to `http://localhost:4200` in
> `SecurityConfig.java`; externalize before serving a deployed frontend.
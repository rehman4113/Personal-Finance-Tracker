# Personal Finance Manager — Complete API Usage Guide

> **Stack:** Java 21, Spring Boot 4.0.7, Spring Security 7, Spring Data JPA, PostgreSQL, Flyway, JWT  
> **Base URL:** `http://localhost:8082`  
> **Auth Prefix:** `/api/v1/auth`  
> **Finance Prefix:** `/api/v1/finance`

---

## Table of Contents

1. [Getting Started — Authentication Flow](#1-getting-started--authentication-flow)
   - [1.1 Register a New User](#11-register-a-new-user)
   - [1.2 Login](#12-login)
   - [1.3 Using the Access Token](#13-using-the-access-token)
   - [1.4 Refresh Token](#14-refresh-token)
   - [1.5 Logout](#15-logout)
2. [Master Data (Reference Data)](#2-master-data)
3. [Wallet Management](#3-wallet-management)
   - [3.1 Wallet Types](#31-wallet-types)
   - [3.2 Wallets](#32-wallets)
4. [Transactions (Income / Expense / Transfer)](#4-transactions)
   - [4.1 Create Transaction](#41-create-transaction)
   - [4.2 Retrieve Transactions](#42-retrieve-transactions)
   - [4.3 Transaction Details](#43-transaction-details)
5. [Shared Expenses & Bill Splitting](#5-shared-expenses--bill-splitting)
6. [Loan Management](#6-loan-management)
7. [Budget Management](#7-budget-management)
8. [Ledger](#8-ledger)
9. [Complete User Journey Example](#9-complete-user-journey-example)
10. [Error Codes Reference](#10-error-codes-reference)
11. [Builder Pattern & Builder APIs](#11-builder-pattern--builder-apis)

---

## 1. Getting Started — Authentication Flow

Every API call (except auth and master data) requires a **JWT access token** in the `Authorization` header.

### 1.1 Register a New User

**Endpoint:** `POST /api/v1/auth/register`

Creates a new user account. Password is automatically BCrypt-encoded.

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "securePass123"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Registration successful",
  "data": {
    "userId": 3,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "message": "Registration successful"
  },
  "timestamp": "2026-07-24T16:00:00"
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| `firstName` | Required, 1–100 chars |
| `lastName` | Optional, max 100 chars |
| `email` | Required, valid email format |
| `password` | Required, 6–100 chars |

---

### 1.2 Login

**Endpoint:** `POST /api/v1/auth/login`

Authenticates the user and returns a JWT access token + refresh token.

```json
{
  "email": "john.doe@example.com",
  "password": "securePass123"
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
    "refreshToken": "eyJhbGciOiJIUzM4NCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "userId": 3,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "status": "ACTIVE",
      "emailVerified": false
    }
  },
  "timestamp": "2026-07-24T16:00:00"
}
```

**Token Details:**
- **Access Token:** Expires in 15 minutes (900 seconds). Contains `userId` and `email` in claims.
- **Refresh Token:** Expires in 7 days. Stored in database with `revoked` flag.
- **Token Type:** Always `Bearer`.

---

### 1.3 Using the Access Token

Every protected API call **must** include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzM4NCJ9...
```

The authenticated user is automatically resolved via `@AuthenticationPrincipal UserPrincipal currentUser` in every controller — you never pass `userId` manually.

**What the JWT Contains:**
- `sub` — user email
- `userId` — user's database ID
- `iat` — issued at timestamp
- `exp` — expiration timestamp

---

### 1.4 Refresh Token

**Endpoint:** `POST /api/v1/auth/refresh`

When the access token expires, use the refresh token to get a new pair. The old refresh token is revoked (rotation).

```json
{
  "refreshToken": "eyJhbGciOiJIUzM4NCJ9..."
}
```

**Response `200 OK`:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Token refreshed",
  "data": {
    "accessToken": "eyJhbGciOiJIUzM4NCJ9...",
    "refreshToken": "eyJhbGciOiJIUzM4NCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 900
  },
  "timestamp": "2026-07-24T16:00:00"
}
```

**Important:** The old refresh token is revoked immediately. This is **token rotation** — only the new refresh token can be used next time.

---

### 1.5 Logout

**Endpoint:** `POST /api/v1/auth/logout`

Revokes the refresh token. The access token is not blacklisted (it will expire naturally).

**Header:** `Authorization: Bearer <refreshToken>`

**Response `200 OK`:**
```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Logout successful",
  "data": {
    "message": "Logout successful"
  },
  "timestamp": "2026-07-24T16:00:00"
}
```

---

## 2. Master Data

**Endpoint:** `GET /api/v1/finance/master`

Returns all reference data needed to create transactions. **Public** — no auth required.

```json
{
  "success": true,
  "data": {
    "walletTypes": [
      { "id": 1, "code": "CASH", "name": "Cash", "active": true },
      { "id": 2, "code": "BANK", "name": "Bank Account", "active": true }
    ],
    "transactionTypes": [
      { "id": 1, "code": "INCOME" },
      { "id": 2, "code": "EXPENSE" },
      { "id": 3, "code": "TRANSFER" },
      { "id": 4, "code": "LOAN" }
    ],
    "transactionPurposes": [
      { "id": 1, "code": "SALARY", "name": "Salary", "type": "INCOME" },
      { "id": 6, "code": "FOOD_CAMPUS", "name": "Food Campus", "type": "EXPENSE" },
      { "id": 18, "code": "WALLET_TRANSFER", "name": "Wallet Transfer", "type": "TRANSFER" }
    ],
    "transactionStatuses": [
      { "id": 1, "code": "PENDING" },
      { "id": 2, "code": "COMPLETED" },
      { "id": 3, "code": "FAILED" }
    ]
  }
}
```

**Why you need this first:** Every transaction requires correct `transactionTypeId`, `transactionPurposeId`, and `transactionStatusId`. Fetch master data to know the valid IDs.

---

## 3. Wallet Management

### 3.1 Wallet Types

Wallet types categorize your wallets (Cash, Bank, Easypaisa, JazzCash, etc.).

#### Create Wallet Type

**Endpoint:** `POST /api/v1/finance/wallets/types`

```json
{
  "code": "CRYPTO",
  "name": "Crypto Wallet",
  "description": "Bitcoin and crypto assets"
}
```

**Rules:**
- `code` is stored in uppercase and must be unique per user
- System defaults (`CASH`) cannot be modified or deleted
- User-created types can be edited and deleted

#### List Wallet Types

**Endpoint:** `GET /api/v1/finance/wallets/types`

Returns system defaults (`userId = null`) + your custom types.

#### Get / Update / Delete

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/finance/wallets/types/{id}` | Get by ID |
| `PUT` | `/api/v1/finance/wallets/types/{id}` | Update name/description |
| `DELETE` | `/api/v1/finance/wallets/types/{id}` | Delete custom type |

---

### 3.2 Wallets

Wallets are your actual financial accounts. Each wallet has a real-time `currentBalance`.

#### Create Wallet

**Endpoint:** `POST /api/v1/finance/wallets`

```json
{
  "walletTypeId": 1,
  "walletName": "Daily Cash",
  "currency": "PKR",
  "initialBalance": 5000.00,
  "accountNumber": null,
  "description": "Physical cash wallet"
}
```

**Rules:**
- `walletTypeId` must reference a valid wallet type
- `accountNumber` must be unique per user + wallet type combination
- `currency` defaults to `PKR` if omitted
- `initialBalance` defaults to `0` if omitted
- Wallet is created with status `ACTIVE`

#### List Wallets

**Endpoint:** `GET /api/v1/finance/wallets`

#### Get Single Wallet

**Endpoint:** `GET /api/v1/finance/wallets/{id}`

#### Update Wallet

**Endpoint:** `PUT /api/v1/finance/wallets/{id}`

#### Close (Soft Delete) Wallet

**Endpoint:** `DELETE /api/v1/finance/wallets/{id}`

Sets wallet status to `CLOSED`. Transactions can no longer use this wallet.

---

## 4. Transactions

Transactions represent **Income**, **Expense**, or **Transfer** events. Each transaction links to wallet entries that update wallet balances.

**Prerequisites:** You need:
- A wallet (with sufficient balance for expenses/transfers)
- Master data IDs for type, purpose, status

### 4.1 Create Transaction

**Endpoint:** `POST /api/v1/finance/transactions`

#### Example: Record Income

```json
{
  "transactionTypeId": 1,
  "transactionPurposeId": 1,
  "transactionStatusId": 2,
  "totalAmount": 50000.00,
  "transactionDate": "2026-07-24T09:00:00",
  "description": "July internship salary",
  "referenceNumber": "SAL-001",
  "notes": "Monthly salary",
  "walletEntries": [
    {
      "walletId": 2,
      "amount": 50000.00,
      "merchant": "Tech Corp"
    }
  ]
}
```

#### Example: Record Expense

```json
{
  "transactionTypeId": 2,
  "transactionPurposeId": 7,
  "transactionSubcategoryId": 1,
  "transactionStatusId": 2,
  "totalAmount": 850.00,
  "transactionDate": "2026-07-24T13:00:00",
  "description": "Lunch with friends",
  "notes": "Pizza Hut",
  "walletEntries": [
    {
      "walletId": 1,
      "amount": 850.00,
      "merchant": "Pizza Hut"
    }
  ]
}
```

#### Example: Transfer Between Wallets

```json
{
  "transactionTypeId": 3,
  "transactionPurposeId": 18,
  "transactionStatusId": 2,
  "totalAmount": 2000.00,
  "transactionDate": "2026-07-24T11:00:00",
  "description": "Transfer for mobile load",
  "walletEntries": [
    {
      "sourceWalletId": 2,
      "destinationWalletId": 3,
      "amount": 2000.00
    }
  ]
}
```

**Validation Rules:**
| Scenario | Rule |
|----------|------|
| **Income** | `walletId` is required. Amount is added to wallet balance. |
| **Expense** | `walletId` is required. Wallet `currentBalance` must be >= amount. Amount is subtracted. |
| **Transfer** | `sourceWalletId` & `destinationWalletId` are required. Source balance must be sufficient. Source is debited, destination is credited. |
| **All** | Sum of all entry amounts must equal `totalAmount`. All wallets must belong to the authenticated user. |

**Master Data IDs Reference:**
| Type | Purpose ID | Purpose Code |
|------|-----------|--------------|
| INCOME (1) | 1 | SALARY |
| INCOME (1) | 2 | FREELANCE |
| INCOME (1) | 3 | POCKET_MONEY |
| INCOME (1) | 4 | GIFT |
| INCOME (1) | 5 | OTHER_INCOME |
| EXPENSE (2) | 6 | FOOD_CAMPUS |
| EXPENSE (2) | 7 | FOOD_OUTSIDE |
| EXPENSE (2) | 8 | MOBILE |
| EXPENSE (2) | 9 | TRAVEL_HOME |
| EXPENSE (2) | 10 | TRAVEL_COMMUTE |
| EXPENSE (2) | 11 | UTILITIES |
| EXPENSE (2) | 12 | CLOTHING |
| EXPENSE (2) | 13 | HEALTH |
| EXPENSE (2) | 14 | EDUCATION |
| EXPENSE (2) | 15 | ENTERTAINMENT |
| EXPENSE (2) | 16 | GROCERIES |
| EXPENSE (2) | 17 | MISC |
| TRANSFER (3) | 18 | WALLET_TRANSFER |
| LOAN (4) | 19 | LOAN |

**Loan Subcategory IDs (for LOAN type only):**
| Subcategory ID | Code | Description |
|:---:|------|-------------|
| 10 | RECEIVABLE | You gave money (they owe you) — reduces wallet balance |
| 11 | PAYABLE | You received money (you owe them) — increases wallet balance |

**Status IDs:** 1=PENDING, 2=COMPLETED, 3=FAILED, 4=REVERSED

### 4.2 Retrieve Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/finance/transactions` | List all user transactions |
| `GET` | `/api/v1/finance/transactions/{id}` | Get single transaction |
| `GET` | `/api/v1/finance/transactions/{id}/ledger` | Get ledger entries for a transaction |

### 4.3 Transaction Details

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/finance/transaction-details` | List all transaction details |
| `GET` | `/api/v1/finance/transaction-details/{id}` | Get detail by ID |
| `GET` | `/api/v1/finance/transaction-details/by-history/{historyId}` | Get details for a specific transaction |

---

## 5. Shared Expenses & Bill Splitting

Create a shared expense (e.g., hostel electricity bill) and split it among roommates.

### Create Shared Expense

**Endpoint:** `POST /api/v1/finance/shared-expenses`

#### Equal Split (4 members)

```json
{
  "totalAmount": 4000.00,
  "description": "July Electricity Bill",
  "splitType": "EQUAL",
  "numMembers": 4,
  "expenseDate": "2026-07-10T12:00:00"
}
```

Each person gets `4000 / 4 = 1000.00` share. Members are auto-named "Member 1", "Member 2", etc.

#### Manual Split

```json
{
  "totalAmount": 6000.00,
  "description": "Grocery Share",
  "splitType": "MANUAL",
  "expenseDate": "2026-07-15T18:00:00",
  "members": [
    { "memberName": "Ali", "shareAmount": 2000.00 },
    { "memberName": "Ahmed", "shareAmount": 1500.00 },
    { "memberName": "Sara", "shareAmount": 2500.00 }
  ]
}
```

### Settle a Member

**Endpoint:** `PUT /api/v1/finance/shared-expenses/{expenseId}/settle/{memberId}`

Marks the member's share as `settled = true` with the current date.

### Retrieve

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/finance/shared-expenses` | List all shared expenses |
| `GET` | `/api/v1/finance/shared-expenses/{id}` | Get with member shares |

---

## 6. Loan Management

Track loans with a **running balance model**. Each person has one record (`loan_user`) with a single `currentAmount` and `loanStatus`. All transactions automatically update balances and flip between `RECEIVABLE` / `PAYABLE` on overpayment.

### 6.1 How It Works

- **Loan Users** — A record per person (`/api/v1/finance/loan-users`). Created separately from transactions.
- **Loan Transactions** — Use the **same** `/api/v1/finance/transactions` endpoint with:
  - `transactionTypeId` = 4 (LOAN)
  - `transactionSubcategoryId` = 10 (RECEIVABLE) or 11 (PAYABLE)
- When a LOAN transaction is created, the system **automatically**:
  1. Saves Transaction History
  2. Saves Transaction Details (updates wallet balance)
  3. Updates the Loan User's `currentAmount` and `loanStatus`
  4. Saves Loan History (complete audit trail)
  5. Creates a Ledger Entry

### 6.2 Loan Status Meanings

| Status | Meaning |
|--------|---------|
| `RECEIVABLE` | They owe you (you gave money) |
| `PAYABLE` | You owe them (they gave you money) |
| `CLOSED` | Settled — no outstanding balance |

### 6.3 Create a Loan User (Separate API)

Creates a person record. No financial impact.

**Endpoint:** `POST /api/v1/finance/loan-users`

```json
{
  "fullName": "Ahmed Khan",
  "contactNumber": "03001234567",
  "notes": "Friend from university"
}
```

**Response `201 Created`:**
```json
{
  "success": true,
  "message": "Loan user created",
  "data": {
    "id": 1,
    "userId": 1,
    "fullName": "Ahmed Khan",
    "contactNumber": "03001234567",
    "uniqueKey": "AHMED_KHAN_03001234567",
    "currentAmount": 0.00,
    "loanStatus": "CLOSED",
    "notes": "Friend from university",
    "createdAt": "2026-07-24T16:00:00",
    "updatedAt": "2026-07-24T16:00:00"
  }
}
```

### 6.4 Record a Loan Transaction

Use the standard **create transaction** API with LOAN type. The person is looked up by `personName` — if not found, a loan user is auto-created.

#### Give a Loan (RECEIVABLE — money leaves your wallet)

```json
{
  "transactionTypeId": 4,
  "transactionPurposeId": 19,
  "transactionSubcategoryId": 10,
  "transactionStatusId": 2,
  "totalAmount": 500.00,
  "transactionDate": "2026-07-24T10:00:00",
  "description": "Gave Ahmed emergency cash",
  "personName": "Ahmed Khan",
  "walletEntries": [
    {
      "walletId": 1,
      "amount": 500.00
    }
  ]
}
```

After this:
- Wallet 1 balance decreases by 500
- Ahmed's `currentAmount` = 500, `loanStatus` = `RECEIVABLE` (he owes you)

#### Receive Payment (PAYABLE — money enters your wallet)

When Ahmed pays back:

```json
{
  "transactionTypeId": 4,
  "transactionPurposeId": 19,
  "transactionSubcategoryId": 11,
  "transactionStatusId": 2,
  "totalAmount": 200.00,
  "transactionDate": "2026-07-25T10:00:00",
  "description": "Ahmed returned partial payment",
  "personName": "Ahmed Khan",
  "walletEntries": [
    {
      "walletId": 1,
      "amount": 200.00
    }
  ]
}
```

After this:
- Wallet 1 balance increases by 200
- Ahmed's `currentAmount` = 300, `loanStatus` = `RECEIVABLE` (still owes you)

### 6.5 Overpayment — Automatic Status Reversal

If Ahmed pays back more than he owes:

**State before:** Receivable = 300 (he owes you)

**Payment:** RECEIVABLE transaction of 500

After:
- System calculates: 300 - 500 = -200 (overpayment)
- Ahmed's `currentAmount` = 200, `loanStatus` = `PAYABLE` (now **you owe him**)

This works both ways — if you owe someone and overpay them, status flips to `RECEIVABLE`.

### 6.6 Loan History

Every loan transaction is recorded in `loan_history` with previous/current amounts and statuses.

**Endpoint:** `GET /api/v1/finance/loan-users/{id}/history`

```json
{
  "data": [
    {
      "id": 1,
      "loanUserId": 1,
      "transactionHistoryId": 11,
      "transactionDetailId": 11,
      "amount": 500.00,
      "previousAmount": 0.00,
      "currentAmount": 500.00,
      "previousStatus": "CLOSED",
      "currentStatus": "RECEIVABLE",
      "transactionType": "RECEIVABLE",
      "remarks": "Gave Ahmed emergency cash",
      "createdAt": "2026-07-24T10:00:00"
    },
    {
      "id": 2,
      "loanUserId": 1,
      "transactionHistoryId": 12,
      "transactionDetailId": 12,
      "amount": 200.00,
      "previousAmount": 500.00,
      "currentAmount": 300.00,
      "previousStatus": "RECEIVABLE",
      "currentStatus": "RECEIVABLE",
      "transactionType": "PAYABLE",
      "remarks": "Ahmed returned partial payment",
      "createdAt": "2026-07-25T10:00:00"
    }
  ]
}
```

### 6.7 Manage Loan Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/finance/loan-users` | Create a loan user |
| `GET` | `/api/v1/finance/loan-users` | List all loan users |
| `GET` | `/api/v1/finance/loan-users/{id}` | Get loan user details |
| `PUT` | `/api/v1/finance/loan-users/{id}` | Update name/contact |
| `GET` | `/api/v1/finance/loan-users/{id}/history` | Get loan history |

### 6.8 Scenario Examples

| Scenario | Transaction Type | Subcategory | Effect on Loan User |
|----------|-----------------|-------------|-------------------|
| You give Ahmed 500 | LOAN (4) | RECEIVABLE (10) | Amount = 500, Status = RECEIVABLE |
| Ahmed returns 200 | LOAN (4) | PAYABLE (11) | Amount = 300, Status = RECEIVABLE |
| Ahmed returns 500 (overpay) | LOAN (4) | PAYABLE (11) | Amount = 200, Status = PAYABLE |
| You owe Sara 500, pay 1000 | LOAN (4) | RECEIVABLE (10) | Amount = 500, Status = RECEIVABLE |

---

## 7. Budget Management

Set monthly spending limits per expense purpose. The system tracks actual spending against limits.

### Create Budget

**Endpoint:** `POST /api/v1/finance/budgets`

```json
{
  "transactionPurposeId": 7,
  "monthlyLimit": 2000.00,
  "month": "2026-07",
  "warningThreshold": 80
}
```

- `transactionPurposeId` must be an EXPENSE type purpose
- `month` format: `YYYY-MM`
- `warningThreshold`: percentage (1–100), defaults to 80

### Response

```json
{
  "data": {
    "id": 1,
    "purposeCode": "FOOD_OUTSIDE",
    "purposeName": "Food Outside",
    "monthlyLimit": 2000.00,
    "month": "2026-07",
    "warningThreshold": 80,
    "totalSpent": 850.00,
    "remaining": 1150.00,
    "usagePercentage": 43,
    "alertLevel": "NORMAL"
  }
}
```

**Alert Levels:**
| Level | Condition |
|-------|-----------|
| `NORMAL` | Usage < warningThreshold |
| `WARNING` | Usage >= warningThreshold |
| `EXCEEDED` | Usage >= 100% |

### Retrieve

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/finance/budgets` | List budgets for a month (`?month=2026-07`) |
| `GET` | `/api/v1/finance/budgets/{id}` | Get single budget |
| `PUT` | `/api/v1/finance/budgets/{id}` | Update limit/threshold |
| `DELETE` | `/api/v1/finance/budgets/{id}` | Delete budget |

---

## 8. Ledger

The ledger is an **immutable record** of every wallet balance change. Ledger entries are created automatically during transactions.

**Endpoint:** `GET /api/v1/finance/transactions/{id}/ledger`

Returns all ledger entries for a specific transaction.

```json
{
  "data": [
    {
      "id": 1,
      "transactionId": 1,
      "userId": 3,
      "walletId": 2,
      "debit": 0.00,
      "credit": 50000.00,
      "balanceAfter": 98500.00,
      "remarks": "Salary credited from Tech Corp",
      "createdAt": "2026-07-24T09:00:00"
    }
  ]
}
```

**Ledger Rules:**
- Entries are **never updated or deleted** (append-only)
- For INCOME: `debit = 0`, `credit = amount`
- For EXPENSE: `debit = amount`, `credit = 0`
- For TRANSFER: two entries — debit from source, credit to destination

---

## 9. Complete User Journey Example

Here is a step-by-step workflow for a new user:

### Step 1: Register

```bash
curl -X POST http://localhost:8082/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Ali","lastName":"Khan","email":"ali@example.com","password":"pass123"}'
```

### Step 2: Login

```bash
curl -X POST http://localhost:8082/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@example.com","password":"pass123"}'
```

Save the `accessToken` and `refreshToken` from the response.

### Step 3: Fetch Master Data

```bash
curl http://localhost:8082/api/v1/finance/master
```

Note the IDs: wallet types, transaction types, purposes, statuses.

### Step 4: Create a Wallet

```bash
curl -X POST http://localhost:8082/api/v1/finance/wallets \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"walletTypeId":1,"walletName":"Daily Cash","currency":"PKR","initialBalance":5000}'
```

### Step 5: Record Income

```bash
curl -X POST http://localhost:8082/api/v1/finance/transactions \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionTypeId":1,"transactionPurposeId":1,"transactionStatusId":2,
    "totalAmount":50000,"transactionDate":"2026-07-24T09:00:00",
    "description":"Salary","referenceNumber":"SAL-001",
    "walletEntries":[{"walletId":1,"amount":50000,"merchant":"Tech Corp"}]
  }'
```

### Step 6: Record an Expense

```bash
curl -X POST http://localhost:8082/api/v1/finance/transactions \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionTypeId":2,"transactionPurposeId":7,"transactionStatusId":2,
    "totalAmount":850,"transactionDate":"2026-07-24T13:00:00",
    "description":"Lunch","walletEntries":[{"walletId":1,"amount":850,"merchant":"Pizza Hut"}]
  }'
```

### Step 7: Set Budget

```bash
curl -X POST http://localhost:8082/api/v1/finance/budgets \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"transactionPurposeId":7,"monthlyLimit":5000,"month":"2026-07"}'
```

### Step 8: Check Budget Status

```bash
curl "http://localhost:8082/api/v1/finance/budgets?month=2026-07" \
  -H "Authorization: Bearer <accessToken>"
```

### Step 9: Create a Shared Expense

```bash
curl -X POST http://localhost:8082/api/v1/finance/shared-expenses \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"totalAmount":3000,"description":"Electricity","splitType":"EQUAL","numMembers":3,"expenseDate":"2026-07-10T12:00:00"}'
```

### Step 10: Create a Loan User

```bash
curl -X POST http://localhost:8082/api/v1/finance/loan-users \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Ahmed Khan","contactNumber":"03001234567"}'
```

### Step 11: Record a Loan Transaction

```bash
curl -X POST http://localhost:8082/api/v1/finance/transactions \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "transactionTypeId":4,"transactionPurposeId":19,"transactionSubcategoryId":10,
    "transactionStatusId":2,"totalAmount":500.00,"transactionDate":"2026-07-24T10:00:00",
    "description":"Gave Ahmed emergency cash","personName":"Ahmed Khan",
    "walletEntries":[{"walletId":1,"amount":500.00}]
  }'
```

### Step 12: View Loan History

```bash
curl http://localhost:8082/api/v1/finance/loan-users/1/history \
  -H "Authorization: Bearer <accessToken>"
```

### Step 13: View Ledger

```bash
curl http://localhost:8082/api/v1/finance/transactions/1/ledger \
  -H "Authorization: Bearer <accessToken>"
```

### Step 14: Refresh Token (when access token expires)

```bash
curl -X POST http://localhost:8082/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken>"}'
```

### Step 15: Logout

```bash
curl -X POST http://localhost:8082/api/v1/auth/logout \
  -H "Authorization: Bearer <refreshToken>"
```

---

## 10. Error Codes Reference

### Auth Errors

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH-404-001` | 404 | User not found |
| `AUTH-401-001` | 401 | Invalid email or password |
| `AUTH-409-001` | 409 | Email already registered |
| `AUTH-401-002` | 401 | Refresh token has expired |
| `AUTH-401-003` | 401 | Invalid refresh token |
| `AUTH-403-001` | 403 | Account is disabled |
| `AUTH-403-002` | 403 | Account is locked |
| `AUTH-401-004` | 401 | Invalid JWT token |
| `AUTH-401-005` | 401 | JWT token has expired |
| `AUTH-401-006` | 401 | Authentication required |
| `AUTH-403-003` | 403 | Access denied |

### Finance Errors

| Code | HTTP | Description |
|------|------|-------------|
| `FIN-404-001` | 404 | Wallet not found |
| `FIN-404-002` | 404 | Wallet type not found |
| `FIN-400-001` | 400 | Cannot delete system default wallet type |
| `FIN-400-002` | 400 | Cannot modify system default wallet type |
| `FIN-409-001` | 409 | Wallet type code already exists |
| `FIN-409-002` | 409 | Duplicate wallet (same type + account number) |
| `FIN-404-010` | 404 | Transaction not found |
| `FIN-400-010` | 400 | Invalid amount |
| `FIN-400-011` | 400 | Insufficient wallet balance |
| `FIN-400-012` | 400 | Invalid transaction |
| `FIN-404-020` | 404 | Budget not found |
| `FIN-409-020` | 409 | Duplicate budget (same purpose + month) |
| `FIN-404-030` | 404 | Loan not found |
| `FIN-404-031` | 404 | Loan user not found |
| `FIN-409-030` | 409 | Duplicate loan (same counterparty + type) |
| `FIN-404-032` | 404 | Loan installment not found |
| `FIN-400-030` | 400 | Installment already paid |
| `FIN-404-040` | 404 | Ledger entry not found |
| `FIN-404-050` | 404 | Shared expense not found |
| `FIN-404-051` | 404 | Shared expense member not found |

### Global Errors

| Code | HTTP | Description |
|------|------|-------------|
| `GLOBAL-500-001` | 500 | Internal server error |
| `GLOBAL-400-001` | 400 | Invalid request |
| `GLOBAL-400-002` | 400 | Validation failed |
| `GLOBAL-404-001` | 404 | Resource not found |
| `GLOBAL-403-001` | 403 | Access denied |
| `GLOBAL-409-001` | 409 | Resource already exists |
| `GLOBAL-400-003` | 400 | Required header is missing |

### Standard API Response Format

```json
{
  "success": true,
  "code": "SUCCESS",
  "message": "Operation successful",
  "data": { },
  "timestamp": "2026-07-24T16:00:00"
}
```

On error:

```json
{
  "success": false,
  "code": "AUTH-401-001",
  "message": "Invalid email or password",
  "data": null,
  "timestamp": "2026-07-24T16:00:00"
}
```

---

## 11. Builder Pattern & Builder APIs

### 11.1 What Is "Builder"?

In this project, **"Builder"** refers to the **Lombok Builder pattern** (`@Builder` annotation) used for object construction. Instead of multi-argument constructors or setters, every entity, request DTO, response DTO, and the standard `ApiResponse` wrapper is created with a generated fluent builder, e.g. `Entity.builder().field(value).build()`.

**Where builders are used:**
- **Entities (JPA)** — services construct new records via builders before persisting (e.g., `User.builder()`, `Wallet.builder()`, `LoanHistory.builder()`).
- **Request DTOs** — marked `@Builder` for consistency; Spring/Jackson binds JSON directly.
- **Response DTOs** — services and controllers assemble responses via builders (e.g., `WalletResponse.builder()`).
- **`ApiResponse`** (`com.rehman.finance.response`) — the single wrapper used by every endpoint; its static factories `success(...)` are builder-based.

Because the builder pattern builds the request/response objects behind **every** endpoint, all APIs in this project are **builder APIs** — **36 in total (4 auth + 32 finance)**.

### 11.2 Auth Module — What the Builder Is & Its APIs

The auth module uses the builder pattern for user, token, and security objects:

| Category | Builder classes |
|----------|-----------------|
| Entities | `User`, `RefreshToken` |
| Security | `UserPrincipal` |
| Request DTOs | `RegistrationRequest`, `LoginRequest`, `RefreshTokenRequest` |
| Response DTOs | `RegisterResponse`, `LoginResponse`, `RefreshTokenResponse`, `LogoutResponse`, `UserProfileResponse` |

**Builder APIs (4):**

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | `POST /api/v1/auth/register` | Creates a new user account; password is BCrypt-encoded automatically |
| 2 | `POST /api/v1/auth/login` | Authenticates email/password and issues a JWT access token + refresh token |
| 3 | `POST /api/v1/auth/refresh` | Issues a new token pair using the refresh token; the old refresh token is revoked (rotation) |
| 4 | `POST /api/v1/auth/logout` | Revokes the refresh token and ends the session |

### 11.3 Finance Module — Builder Usage & APIs

The finance module uses the builder pattern for all wallet, transaction, loan, budget, expense, and ledger objects:

| Category | Builder classes |
|----------|-----------------|
| Entities (16) | `WalletType`, `Wallet`, `TransactionType`, `TransactionStatus`, `TransactionPurpose`, `TransactionSubcategory`, `TransactionHistory`, `TransactionDetails`, `SharedExpense`, `SharedExpenseMember`, `ReceiptAttachment`, `LoanUser`, `LoanInstallment`, `LoanHistory`, `LedgerEntry`, `BudgetLimit` |
| Request DTOs (8) | `WalletTypeRequest`, `WalletRequest`, `TransactionRequest` (+ inner `WalletEntry`), `SharedExpenseRequest`, `MemberShareRequest`, `LoanUserRequest`, `InstallmentRequest`, `BudgetRequest` |
| Response DTOs (12) | `WalletTypeResponse`, `WalletResponse`, `TransactionResponse` (+ inner `WalletEntryResponse`), `TransactionDetailResponse`, `SharedExpenseResponse`, `MemberShareResponse`, `LoanUserResponse`, `LoanHistoryResponse`, `LedgerEntryResponse`, `BudgetResponse`, `InstallmentResponse`, `MasterDataResponse` (+ inner `SimpleMasterItem`, `PurposeWithSubcategories`) |

**Builder APIs (32)** grouped by domain:

**Master Data (1)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 1 | `GET /api/v1/finance/master` | Public reference data (wallet types, transaction types, purposes, statuses) — no auth required |

**Wallet Types (5)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 2 | `POST /api/v1/finance/wallets/types` | Create a custom wallet type (code stored uppercase, unique per user) |
| 3 | `GET /api/v1/finance/wallets/types` | List system defaults + the user's custom wallet types |
| 4 | `GET /api/v1/finance/wallets/types/{id}` | Get a single wallet type |
| 5 | `PUT /api/v1/finance/wallets/types/{id}` | Update a custom wallet type's name/description (system defaults are protected) |
| 6 | `DELETE /api/v1/finance/wallets/types/{id}` | Delete a custom wallet type (system defaults cannot be deleted) |

**Wallets (5)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 7 | `POST /api/v1/finance/wallets` | Create a wallet with an opening balance and live `currentBalance` |
| 8 | `GET /api/v1/finance/wallets/{id}` | Get a single wallet with its current balance |
| 9 | `GET /api/v1/finance/wallets` | List all of the user's wallets |
| 10 | `PUT /api/v1/finance/wallets/{id}` | Update wallet details (name, description, currency, account number) |
| 11 | `DELETE /api/v1/finance/wallets/{id}` | Soft-close a wallet (`CLOSED`) so no further transactions can use it |

**Transactions (4)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 12 | `POST /api/v1/finance/transactions` | Records an income/expense/transfer/loan — updates wallet balances, loan balances, budget usage, and writes ledger entries in one flow |
| 13 | `GET /api/v1/finance/transactions/{id}` | Get a single transaction with its wallet entries |
| 14 | `GET /api/v1/finance/transactions` | List all of the user's transactions |
| 15 | `GET /api/v1/finance/transactions/{id}/ledger` | Get the immutable balance-change audit trail (ledger entries) of a transaction |

**Transaction Details (3)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 16 | `GET /api/v1/finance/transaction-details/{id}` | Get one wallet-level detail row of a transaction |
| 17 | `GET /api/v1/finance/transaction-details` | List all wallet-level detail rows for the user |
| 18 | `GET /api/v1/finance/transaction-details/by-history/{historyId}` | Get all detail rows belonging to a specific transaction |

**Shared Expenses (4)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 19 | `POST /api/v1/finance/shared-expenses` | Create a shared expense and split it among members (EQUAL or MANUAL split) |
| 20 | `GET /api/v1/finance/shared-expenses/{id}` | Get a shared expense with its member shares |
| 21 | `GET /api/v1/finance/shared-expenses` | List all of the user's shared expenses |
| 22 | `PUT /api/v1/finance/shared-expenses/{expenseId}/settle/{memberId}` | Mark a member's share as settled with the current date |

**Loan Users (5)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 23 | `POST /api/v1/finance/loan-users` | Create a person record (no financial impact) used for loan tracking |
| 24 | `GET /api/v1/finance/loan-users/{id}` | Get a loan user with current amount and loan status |
| 25 | `GET /api/v1/finance/loan-users` | List all of the user's loan users |
| 26 | `PUT /api/v1/finance/loan-users/{id}` | Update a loan user's name/contact |
| 27 | `GET /api/v1/finance/loan-users/{id}/history` | Get the complete audit trail of amount/status changes (loan history) |

**Budgets (5)**

| # | Endpoint | Purpose |
|---|----------|---------|
| 28 | `POST /api/v1/finance/budgets` | Set a monthly spending limit for an expense purpose |
| 29 | `GET /api/v1/finance/budgets/{id}` | Get a budget with total spent, remaining, usage %, and alert level |
| 30 | `GET /api/v1/finance/budgets?month=YYYY-MM` | List the user's budgets for a specific month |
| 31 | `PUT /api/v1/finance/budgets/{id}` | Update the monthly limit or warning threshold |
| 32 | `DELETE /api/v1/finance/budgets/{id}` | Delete a budget |

### 11.4 Builder API Count Summary

| Module | Builder APIs | Builder-based classes |
|--------|:---:|:---:|
| Auth | 4 | 11 |
| Finance | 32 | 36 |
| Shared wrapper | — | `ApiResponse` (1) |
| **Total** | **36** | **48** |
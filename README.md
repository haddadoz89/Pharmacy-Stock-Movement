# 💊 Pharmacy Stock Movement

A Node.js / Express / MongoDB app to manage pharmacy inventory and stock transactions with role-based access, import/export functionality, and reporting.

---

##  📖 Overview

Pharmacy Stock Movement is designed for the Ministry of Health to:

Track medication catalog entries

Record stock transactions per health center

Automatically maintain store balances

View stock movement history

Search and export expiry dates

Manage users with roles and health center assignments

Generate Excel reports

Import and export data via Excel

Enforce strict role-based access

---

##  👥 User Stories
- As a user, I want to sign in and out securely.

- As Head of Pharmacy, I want to manage all health centers.

- As Head of Pharmacy, I want to add, edit, delete, and bulk-import medication catalog.

- As Head of Pharmacy, I want to manage users and assign them health centers.

- As Head of Pharmacy, I want to see and filter expiry dates for any health center.

- As Head of Pharmacy, I want to generate Excel expiry and transaction reports for all centers.

- As a Senior Pharmacy user, I want to see and filter data for my entire region.

- As Senior Pharmacy, I want to choose any health center in my region to view transactions.

- As regular pharmacy users, I want to see and manage transactions only for my assigned health center.

- As any user, I want to add, edit, delete, and import stock transactions for my health center.

- As a user, I want store balance to calculate automatically.

- As a user, I want to search expiry dates between two dates and see only available stock.

- As a user, I want to export expiry date search results to Excel.

- As a user, I want to see and edit remarks on transactions.

- As a user, I want the UI to be responsive, with loading indicators for large file imports.

---

## 🎯 Features

✅ User authentication with roles
✅ User management (by Head of Pharmacy)
✅ Medication catalog management (add / edit / delete / import via Excel)
✅ Stock transaction management (add / edit / delete / import via Excel)
✅ Expiry date search between two dates
✅ Filter expiry by health center or region (role-based)
✅ Export expiry search results to Excel
✅ Remarks field for transactions
✅ Reports module to generate Excel transaction reports with filters
✅ Role-based data visibility:
    - Head of Pharmacy: All health centers
    - Senior Pharmacy: Region only
    - Others: Own health center only
        ✅ Loading modal while importing large Excel files

---

## ⚙️ Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose
- **Views:** EJS templates
- **Session:** express-session
- **Forms:** method-override
- **File Upload:** multer
- **Excel Processing:** xlsx
- **Logging:** morgan
- **Password Hashing:** bcrypt

---

## Setup Instructions

1. **Clone this repo:**
    ```bash
    git clone https://github.com/haddadoz89/Pharmacy-Stock-Movement.git
    ```

2. **Install dependencies:**
    ```bash
    npm install
    ```

3. **Add your `.env` file:**
    ```env
    MONGODB_URI=<YOUR-MONGODB-URI>
    SESSION_SECRET=<YOUR-SESSION-SECRET>
    PORT=<YOUR-PORT>
    ```

4. **Install nodemon (if you don't have it already):**
    ```bash
    npm install -g nodemon
    ```

5. **Run the app with nodemon:**
    ```bash
    nodemon server.js
    ```

---
## Project Structure
```
Pharmacy-Stock-Movement/
│
├── server.js
├── package.json
├── .env
│
├── /controllers
│   ├── auth.js
│   ├── medications.js
│   ├── transactions.js
│   ├── expiry.js
│   ├── reports.js
│   ├── catalogImport.js
│   ├── users.js
│   └── transactionImport.js
│
├── /models
│   ├── user.js
│   ├── healthCenter.js
│   ├── medicationCatalog.js
│   └── medicationTransaction.js
│
├── /middleware
│   ├── is-signed-in.js
│   └── pass-user-to-view.js
│
└── /views
   ├── index.ejs
   ├── /auth
   │   └── sign-in.ejs
   ├── /medications
   │   ├── index.ejs
   │   ├── show.ejs
   │   ├── new.ejs
   │   ├── edit.ejs
   │   └── import.ejs
   ├── /transactions
   │   ├── new.ejs
   │   ├── edit.ejs
   │   └── import.ejs
   ├── /users
   │   ├── new.ejs
   │   ├── edit.ejs
   │   └── index.ejs
   ├── /expiry
   │   └── form.ejs
   ├── /reports
   │   └── form.ejs
   └── /partials
       └── _navbar.ejs

```
---
## Data Models

### User
- username
- password
- position (role)
- healthCenter (ref)
- active (Boolean)

### HealthCenter
- healthCenterName
- region

### MedicationCatalog
- codeNumber (unique)
- itemName

### MedicationTransaction
- codeNumber (ref)
- date
- qtyIn
- qtyOut
- counterStock
- storeBalance
- expiry (array of expiryDate, lotNumber)
- orderNumber
- remarks
- enteredBy (ref)
- healthCenter (ref)

---

## Routes Overview

- `/auth` – Sign In / Logout
- `/medications` – List / Add / Edit / Delete / Import
- `/transactions` – Add / Edit / Delete / Import
- `/expiry-check` – Search / Export
- `/reports` – View / Export
- `/users` – Manage Users (Head of Pharmacy only)

---

## ERD

[ERD Link]( https://lucid.app/lucidchart/4264f55d-f7fe-4d72-8e2a-f24cb57dc84a/edit?viewport_loc=-453%2C-96%2C3980%2C1710%2C0_0&invitationId=inv_316b028f-b953-496d-9cad-dbfa87296ac0)

---

## Future Improvements

- Export reports to PDF
- Add email notifications
- Audit logs for all changes
- Add stock adjustment support

---

## Authors

- Mohammed Hassan Jassim
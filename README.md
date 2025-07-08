# 💊 Pharmacy Stock Movement

A Node.js / Express / MongoDB app to manage pharmacy inventory and stock transactions with role-based access.

---

##  Overview

Pharmacy Stock Movement is designed for the Ministry of Health to:

- Track medication catalog entries
- Record stock transactions per health center
- Keep store balances updated automatically
- Search for expiry dates
- Import and export data with Excel
- Control access by user role

---

##  User Stories

- As a user, I want to sign in and out to protect my account.
- As a new user, I want to register with my role and health center.
- As the Head of Pharmacy, I want to manage all health centers.
- As the Head of Pharmacy, I want to add, edit, delete, and import medications.
- As a user (except Head), I want to add, edit, delete, and import transactions for my health center.
- As the Head of Pharmacy, I want to view all transactions.
- As a Senior Pharmacy user, I want to see transactions in my region.
- As other users, I want to see transactions in my health center.
- As a user, I want store balance to calculate automatically.
- As a user, I want to search expiry dates between two dates.
- As a user, I want to export expiry date results to Excel.

---

## Features

- User authentication with roles
- Medication catalog (add/edit/delete/import)
- Stock transactions (add/edit/delete/import)
- Automatic store balance
- Expiry date search and export to Excel
- Role-based access:
  - Head: All health centers
  - Senior: Region only
  - Others: Own health center only

---

## Tech Stack

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

## 📦 Data Models

### User
- username
- password
- position (role)
- healthCenter (ref)

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
- enteredBy (ref)
- healthCenter (ref)

---

## 🗺️ Routes Overview

- `/auth` – Sign In / Sign Up / Logout
- `/medications` – List / Add / Edit / Delete / Import
- `/transactions` – Add / Edit / Delete / Import
- `/expiry-check` – Search / Export

---

## 📑 ERD

[ERD Link]( https://lucid.app/lucidchart/4264f55d-f7fe-4d72-8e2a-f24cb57dc84a/edit?viewport_loc=-453%2C-96%2C3980%2C1710%2C0_0&invitationId=inv_316b028f-b953-496d-9cad-dbfa87296ac0)

---

## ✅ Future Improvements

- Export reports to PDF
- Add CSS for better styling

---

## 👥 Authors

- Mohammed Hassan Jassim
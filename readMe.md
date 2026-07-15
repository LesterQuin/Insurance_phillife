# Financial Insurance System API Documentation

## Overview

This API manages the lifecycle of Financial Insurance Applications, including creation, updates, rate management, and retrieval.

## Getting Started with Docker

You can run this application inside a Docker container. This automatically configures the Node.js environment and all required system dependencies (like Chromium/fonts for Puppeteer PDF generation).

### Prerequisites

1. Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
2. Ensure you have your `.env` file configured in the root directory.

### How to Run

- **Start the application in the background (Detached Mode):**
  ```bash
  docker compose up -d
  ```
- **Verify the application is active:**
  Open `http://localhost:5000/api/hello` in your browser.
- **Stop the application:**
  ```bash
  docker compose down
  ```
- **Rebuild the container (after updating code or package.json):**
  ```bash
  docker compose up -d --build
  ```

---

## Authentication

Routes marked with **Auth Required** expect a valid Bearer Token in the header.

- **Header:** `Authorization: Bearer <your_token>`

---

## Application Endpoints

### 1. Create Application

Creates a new financial insurance application proposal.

- **URL:** `/create`
- **Method:** `POST`
- **Auth Required:** Yes
- **Body Constraints:** Validated by `validateFinancialApplication`.
- **Example Body:**
  ```json
  {
    "group_name": "Example Corp",
    "business_nature": "Technology",
    "number_of_lives": 50,
    "business_address": "123 Main St",
    "contact_number": "09171234567",
    "email": "contact@example.com",
    "contact_person_firstname": "John",
    "contact_person_lastname": "Doe",
    "designation": "Manager",
    "plan_id": 2,
    "type_of_proposal_id": 31,
    "coverage_type_id": 33,
    "uniform_coverage_amount": 500000,
    "riders": [{ "rider_id": 3, "amount": 50000 }]
  }
  ```

### 2. Update Application

Updates details of an existing application.

- **URL:** `/:id`
- **Method:** `PUT`
- **URL Params:** `id` (Integer) - The Application ID.
- **Auth Required:** Yes
- **Body:** JSON object containing fields to update. Fields are optional, but if provided, must adhere to validation rules.

### 3. List Applications

Retrieves a list of all applications in the system.

- **URL:** `/list`
- **Method:** `GET`
- **Auth Required:** No
- **Success Response:** Array of application objects containing summary details (ID, Group Name, Status, Date Created).

### 4. Get Application by ID

Retrieves the full details of a specific application, including riders, payment terms, and coverage rankings.

- **URL:** `/:id`
- **Method:** `GET`
- **URL Params:** `id` (Integer)
- **Auth Required:** No

---

# Group Lookups API Documentation

## Overview

This API retrieves lookup data (dropdown options) for various forms and classifications.

### 1. Get All Lookups

Retrieves all lookup data grouped by category.

- **URL:** `/`
- **Method:** `GET`
- **Auth Required:** No

### 2. Get Lookups by Category

Retrieves lookup items for a specific category.

- **URL:** `/category/:category_name`
- **Method:** `GET`
- **Auth Required:** No
- **Supported Categories:**
  - `GROUP_CLASSIFICATION`
  - `BUSINESS_TYPE`
  - `TYPE_OF_GROUP`
  - `MODE_OF_PAYMENT`
  - `AGE_PROFILE`
  - `TYPE_OF_PROPOSAL`
  - `COVERAGE_TYPE`
  - `COVERAGE_MULTIPLIER`
  - `LOAN_AMOUNT_TYPE`
  - `PAYMENT_TERM`
  - `PAYMENT_YEAR`

### 3. Get Lookup by ID

Retrieves a specific lookup item by its ID.

- **URL:** `/name/:id`
- **Method:** `GET`
- **URL Params:** `id` (Integer)
- **Auth Required:** No

---

# Group Riders API Documentation

## Overview

This API retrieves insurance riders associated with products.

### 1. Get All Riders

Retrieves a list of all riders grouped by product.

- **URL:** `/`
- **Method:** `GET`
- **Auth Required:** No

### 2. Get Riders by Product

Retrieves riders associated with a specific product name or acronym.

- **URL:** `/product/:productName`
- **Method:** `GET`
- **Description:** Can accept dynamic product names or specific acronyms like `GCLI`, `GYRT`, `GPA`.
- **Auth Required:** No

### 5. Delete Application

Permanently removes an application from the database.

- **URL:** `/:id`
- **Method:** `DELETE`
- **URL Params:** `id` (Integer)
- **Auth Required:** No

---

## Rate Management Endpoints

### 6. Save/Update Rates

Inputs or updates the premium rates for borrower age brackets associated with an application.

- **URL:** `/rates/:id`
- **Method:** `POST` or `PUT`
- **URL Params:** `id` (Integer) - The Application ID.
- **Auth Required:** Yes
- **Validation:**
  - Checks if `application_id` exists.
  - Verifies that age brackets (e.g., `65-67`) are enabled in the application boolean flags before allowing rates insertion.
- **Example Body:**
  ```json
  {
    "18-64": [
      { "term_or_months": "6 months", "rate": 1.25 },
      { "term_or_months": "12 months", "rate": 2.5 }
    ],
    "65-67": [{ "term_or_months": "6 months", "rate": 1.5 }],
    "71-74": [{ "term_or_age": "71 age", "rate": 12.0 }]
  }
  ```

---

## Miscellaneous Endpoints

### 7. View Prototype Plan

Retrieves details for a specific prototype plan.

- **URL:** `/prototype-plans/:id/view`
- **Method:** `GET`
- **URL Params:** `id` (Integer)
- **Auth Required:** No

### 8. Get Template

Retrieves template information associated with an application (likely for document generation).

- **URL:** `/template/:id`
- **Method:** `GET`
- **URL Params:** `id` (Integer)
- **Auth Required:** No

---

## Enums / Lookups (Reference)

Common IDs used in payloads:

- **Plan IDs:**
  - `1`: Group Credit Life Insurance (GCLI)
  - `2`: Group Yearly Renewable Term (GYRT)
  - `3`: Group Personal Accident (GPA)

- **Coverage Type IDs:**
  - `32`: Level Ranking
  - `33`: Uniform Coverage
  - `34`: Salary Ranking

# User Management API Documentation

## Overview

This API manages user authentication, profile updates, and administrative tasks for user accounts.

---

## Authentication & Profile Endpoints

### 1. Register User

Registers a new user in the system.

- **URL:** `/register`
- **Method:** `POST`
- **Auth Required:** No
- **Body Constraints:** Validated by `validateRegister`.
- **Example Body:**
  ```json
  {
    "firstname": "Jane",
    "lastname": "Doe",
    "email": "jane.doe@gmail.com",
    "role_id": 2,
    "department_id": 1,
    "location_id": 1,
    "phoneNumber": "09170000000"
  }
  ```

### 2. Login

User login to receive access tokens.

- **URL:** `/login`
- **Method:** `POST`
- **Auth Required:** No
- **Body:** `{"email": "...", "password": "..."}`

### 3. Verify OTP

Verifies the One-Time Password sent to email.

- **URL:** `/verify-otp`
- **Method:** `POST`
- **Body:** `{"email": "...", "otp": "123456"}`

### 4. Resend OTP

Resends the OTP to the user's email.

- **URL:** `/resend-otp`
- **Method:** `POST`
- **Body:** `{"email": "..."}`

### 5. Reset Password

Initiates or completes password reset.

- **URL:** `/reset-password`
- **Method:** `POST`
- **Body:** `{"email": "...", "newPassword": "..."}`

### 6. Logout

Logs out the user.

- **URL:** `/logout`
- **Method:** `POST`
- **Body:** `{"email": "..."}`

### 7. Refresh Token

Refreshes the access token using a refresh token.

- **URL:** `/refresh-token`
- **Method:** `POST`
- **Body:** `{"refreshToken": "..."}`

### 8. Update Profile

Updates the logged-in user's profile information.

- **URL:** `/update-profile`
- **Method:** `PUT`
- **Auth Required:** Yes
- **Body:** JSON object with fields to update (firstname, lastname, phoneNumber, etc.).

---

## Super Admin Endpoints

### 9. Update User (Admin)

Allows a super admin to update another user's details.

- **URL:** `/admin/update-user/:userId`
- **Method:** `PUT`
- **URL Params:** `userId` (Integer)
- **Auth Required:** Yes (Super Admin Role)

### 10. Deactivate Account

Deactivates a specific user account.

- **URL:** `/deactivate/:userId`
- **Method:** `PUT`
- **URL Params:** `userId` (Integer)
- **Auth Required:** Yes (Super Admin Role)

### 11. Activate Account

Activates a specific user account.

- **URL:** `/activate/:userId`
- **Method:** `PUT`
- **URL Params:** `userId` (Integer)
- **Auth Required:** Yes (Super Admin Role)

### 12. Get User Details

Retrieves detailed information about a specific user.

- **URL:** `/:userId`
- **Method:** `GET`
- **URL Params:** `userId` (Integer)
- **Auth Required:** Yes (Super Admin Role)

- **Method:** `GET`
- **URL Params:** `userId` (Integer)
- **Auth Required:** Yes (Super Admin Role)

---

# Group Lookups API Documentation

## Overview

This API retrieves lookup data (dropdown options) for various forms and classifications.

### 1. Get All Lookups

Retrieves all lookup data grouped by category.

- **URL:** `/`
- **Method:** `GET`
- **Auth Required:** No

### 2. Get Lookups by Category

Retrieves lookup items for a specific category.

- **URL:** `/category/:category_name`
- **Method:** `GET`
- **Auth Required:** No
- **Supported Categories:**
  - `GROUP_CLASSIFICATION`
  - `BUSINESS_TYPE`
  - `TYPE_OF_GROUP`
  - `MODE_OF_PAYMENT`
  - `AGE_PROFILE`
  - `TYPE_OF_PROPOSAL`
  - `COVERAGE_TYPE`
  - `COVERAGE_MULTIPLIER`
  - `LOAN_AMOUNT_TYPE`
  - `PAYMENT_TERM`
  - `PAYMENT_YEAR`

### 3. Get Lookup by ID

Retrieves a specific lookup item by its ID.

- **URL:** `/name/:id`
- **Method:** `GET`
- **URL Params:** `id` (Integer)
- **Auth Required:** No

---

# Group Riders API Documentation

## Overview

This API retrieves insurance riders associated with products.

### 1. Get All Riders

Retrieves a list of all riders grouped by product.

- **URL:** `/`
- **Method:** `GET`
- **Auth Required:** No

### 2. Get Riders by Product

Retrieves riders associated with a specific product name or acronym.

- **URL:** `/product/:productName`
- **Method:** `GET`
- **Description:** Can accept dynamic product names or specific acronyms like `GCLI`, `GYRT`, `GPA`.
- **Auth Required:** No

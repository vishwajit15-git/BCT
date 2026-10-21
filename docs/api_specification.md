# MediChain API Specification (REST)

**Course:** SPPU BE Computer Engineering (2019 Pattern)  
**Subject:** Blockchain Technologies (BCT) Mini-Project  
**Base URL:** `http://localhost:5000/api`

---

## 1. Authentication Endpoints

### `POST /api/auth/register`
Creates a new patient or doctor account with a hashed password (bcrypt) and linked Ethereum wallet address.
- **Access:** Public
- **Request Body (JSON):**
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "Password123!",
    "role": "patient",
    "walletAddress": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    "specialization": "Cardiology (doctor only)",
    "licenseNumber": "DOC-1234 (doctor only)"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account registered successfully.",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### `POST /api/auth/login`
Authenticates existing users and returns a JWT token.
- **Access:** Public
- **Request Body (JSON):**
  ```json
  {
    "email": "jane@example.com",
    "password": "Password123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "token": "eyJhbGciOi...",
    "user": { ... }
  }
  ```

### `GET /api/auth/me`
Fetches current authenticated profile from JWT.
- **Access:** Private (Bearer Token)
- **Response (200 OK):** User object without password.

---

## 2. Medical Record Endpoints

### `POST /api/records`
Uploads a medical PDF report. The backend computes its SHA-256 hash (`0x...` bytes32), encrypts the bytes with authenticated AES-256-GCM, stores the `.enc` file off-chain, and creates the pending record in MongoDB.
- **Access:** Private (Role: `patient`)
- **Headers:** `Content-Type: multipart/form-data`
- **Form Fields:**
  - `document`: PDF file binary (max 10MB)
  - `title`: String
  - `recordType`: `lab_report` | `prescription` | `diagnostic_imaging` | `discharge_summary` | `consultation_note` | `other`
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Medical record encrypted and prepared for blockchain registration.",
    "record": {
      "recordId": "0x4a7f...",
      "title": "Blood Work",
      "recordType": "lab_report",
      "documentHash": "0x9f83...",
      "originalFilename": "report.pdf",
      "fileSize": 104288,
      "createdAt": "2026-10-20T18:00:00.000Z",
      "onChainConfirmed": false
    }
  }
  ```

### `PATCH /api/records/:id/confirm`
Confirms the on-chain MetaMask transaction hash once `contract.registerRecord(...)` has been mined.
- **Access:** Private (Record Owner only)
- **Request Body (JSON):**
  ```json
  { "txHash": "0x123456..." }
  ```

### `GET /api/records/mine`
Returns records owned by the patient, or records currently permitted to the doctor on-chain.
- **Access:** Private (Authenticated User)

### `GET /api/records/:id`
Fetches record metadata. Verifies on-chain consent if requested by a doctor.
- **Access:** Private (Owner or Doctor with on-chain permission)

### `GET /api/records/:id/download`
Validates on-chain access, decrypts the AES-256-GCM file in memory, and streams the decrypted PDF to the client.
- **Access:** Private (Owner or Doctor with on-chain permission)
- **Response:** Binary PDF stream (`Content-Type: application/pdf`).

### `POST /api/records/:id/verify`
Performs cryptographic integrity audit:
1. Decrypts stored file bytes in memory.
2. Recomputes SHA-256 hash.
3. Queries `MedicalRecords.sol.verifyDocumentHash(recordId, computedHash)`.
4. Returns `STATUS: VERIFIED` or `STATUS: TAMPERED`.
- **Access:** Private (Owner or Doctor with on-chain permission)

---

## 3. Access & Audit Endpoints

### `GET /api/access/:recordId?doctor=0x...`
Checks whether a specified doctor currently has active permission on-chain to access a record.
- **Access:** Private (Owner or Doctor)

### `GET /api/audit/:recordId`
Queries the blockchain node for all `RecordRegistered`, `AccessGranted`, and `AccessRevoked` events emitted for that specific record ID.
- **Access:** Private (Owner or Doctor)

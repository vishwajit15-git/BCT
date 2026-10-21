# MediChain 🏥⛓️

> **SPPU BE Computer Engineering (2019 Pattern)**  
> **Course:** Blockchain Technologies (BCT) — Mini-Project  
> **Topic:** Decentralized Medical Record Management System with Zero-Knowledge On-Chain Hashes, Authenticated AES-256-GCM Encryption, and Patient-Governed Access Control.

---

## 📌 Project Overview

MediChain is a full-stack decentralized healthcare application engineered to resolve critical vulnerabilities in Electronic Health Records (EHR): single points of failure, unauthorized tampering, data leaks, and patient disempowerment.

### Core Architectural Principles
1. **Zero Personal Health Information (PHI) On-Chain**: Patient names, medical conditions, prescription contents, diagnosis text, and encryption keys are strictly excluded from the blockchain state and event logs.
2. **Authenticated Off-Chain Storage**: Medical documents (PDFs only) are encrypted at rest using **authenticated AES-256-GCM** with a 32-byte secret key and random 96-bit initialization vectors.
3. **Immutable On-Chain Verification**: The smart contract (`MedicalRecords.sol`) holds only the 32-byte Record ID, patient wallet address, and cryptographic SHA-256 document hash.
4. **Patient-Governed Access Control**: Patients maintain cryptographic ownership of their records and grant or revoke doctor consultation permissions on-chain via MetaMask.

---

## 📂 Monorepo Structure

```text
BCT/
├── client/                     # React 18, Vite 5, Tailwind CSS, ethers.js v6
│   ├── public/                 # Static clinical icons & logos
│   ├── src/
│   │   ├── components/         # Layout, WalletButton, ProtectedRoute
│   │   ├── context/            # AuthContext (JWT/User) & Web3Context (MetaMask)
│   │   ├── contracts/          # MedicalRecords.json (ABI & artifacts)
│   │   ├── pages/              # Login, Register, Patient, Doctor, Upload, Detail, Access, History
│   │   ├── services/           # Axios API client
│   │   └── index.css           # Mayo Clinic design system & Tailwind directives
│   └── vite.config.js
├── server/                     # Node.js, Express.js REST API, Mongoose, crypto
│   ├── src/
│   │   ├── config/             # MongoDB connection with resilient retry
│   │   ├── controllers/        # authController, recordController
│   │   ├── middleware/         # JWT authentication & role-based authorization
│   │   ├── models/             # User (bcrypt), MedicalRecord
│   │   ├── routes/             # auth, records, access, audit, health
│   │   ├── services/           # blockchain.js (ethers.js v6 contract interop)
│   │   ├── utils/              # crypto.js (AES-256-GCM & SHA-256)
│   │   └── index.js            # Express server entry point
│   ├── uploads/                # Encrypted off-chain .enc files (never plain PDFs)
│   └── test-api.js             # Automated API & security verification suite
├── blockchain/                 # Solidity 0.8.24, Hardhat, Ethers.js v6
│   ├── contracts/              # MedicalRecords.sol
│   ├── scripts/                # deploy.js
│   ├── test/                   # MedicalRecords.test.js (23 Chai unit tests)
│   └── hardhat.config.js       # Chain ID 1337 / Paris EVM target
├── docs/                       # Architecture, API specifications, and contract docs
├── package.json                # Workspace orchestration scripts
├── .env.example                # Root environment template
└── .gitignore                  # Unified git ignore rules
```

---

## 🚀 Installation & Setup Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node.js v24.13.1)
- **npm**: v9+ (tested on npm v11.8.0)
- **MetaMask Extension** installed in your browser
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017`) or MongoDB Atlas URI (server runs with or without MongoDB)

---

### 2. Install All Dependencies

From the project root:
```bash
npm run install:all
```

---

### 3. Environment Configuration

Copy the `.env.example` templates to `.env` in `server/` and `client/`:

#### Server `.env` (`server/.env`)
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/medichain
JWT_SECRET=medichain_secure_jwt_secret_sppu_2026_bct_key
FILE_ENCRYPTION_KEY=6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b
CLIENT_ORIGIN=http://localhost:3000
CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
RPC_URL=http://127.0.0.1:8545
```

#### Client `.env` (`client/.env`)
```ini
VITE_API_URL=http://localhost:5000/api
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RPC_URL=http://127.0.0.1:8545
VITE_CONTRACT_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_CHAIN_ID=1337
```

---

## 🔄 Recommended Startup Order

To run MediChain locally, open 3 terminals:

### Terminal 1 — Blockchain Local Node
Starts the local EVM node with 20 pre-funded test accounts:
```bash
npm run blockchain:node
# or: cd blockchain && npx hardhat node
```

### Terminal 2 — Deploy Contract (if not already deployed)
Deploys `MedicalRecords.sol` and prints the contract address:
```bash
npm run blockchain:deploy:local
# or: cd blockchain && npx hardhat run scripts/deploy.js --network localhost
```

### Terminal 3 — Backend API Server
Runs Express on `http://localhost:5000`:
```bash
npm run server
# or: cd server && npm run dev
```

### Terminal 4 — Frontend Client
Runs Vite development server on `http://localhost:3000`:
```bash
npm run client
# or: cd client && npm run dev
```

---

## 🧪 Comprehensive Verification & Test Commands

### 1. Smart Contract Unit Tests (23 Tests)
Verifies record registration, impersonation prevention, doctor access grant/revoke, document hash verification, zero-address rejection, and events:
```bash
npm run blockchain:test
```

### 2. Backend API & Security Tests (25 Tests)
Verifies user registration, bcrypt login, JWT verification, AES-256-GCM encrypted PDF upload, SHA-256 hash calculation, on-chain confirmation, 403 unauthorized access enforcement, and document decryption:
```bash
npm run test:server
# or: cd server && node test-api.js
```

### 3. Run All Tests
```bash
npm run test:all
```

### 4. Client Production Build
```bash
npm run build --prefix client
```

---

## 🏥 College Project Demonstration Workflow (Viva / Review)

1. **MetaMask Setup**:
   - Add Network: RPC `http://127.0.0.1:8545`, Chain ID `1337`, Currency `ETH`.
   - Import Hardhat Account #0 (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) or Account #1 (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`).

2. **Patient Registration & Login**:
   - Go to `http://localhost:3000/register`.
   - Select **Patient** role, click **Use Connected MetaMask**, and create an account.
   - Go to `http://localhost:3000/upload` and upload a sample medical PDF report.
   - Click **Encrypt & Register on Blockchain**.
   - Approve the transaction in MetaMask (`contract.registerRecord(recordId, documentHash)`).
   - Once confirmed, view the confirmed Block Number and Transaction Hash!

3. **Integrity Audit**:
   - Open the record details (`/records/:id`).
   - Click **Verify On-Chain Integrity**:
     - The server decrypts the AES-256-GCM file in memory, recomputes the SHA-256 hash, queries `MedicalRecords.sol.verifyDocumentHash(recordId, computedHash)`, and displays the green **STATUS: VERIFIED** badge.

4. **Doctor Consultation & Access Control**:
   - Register a second account at `/register` with role **Doctor** (using a different wallet, e.g. Hardhat Account #2 `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`).
   - Login as Doctor. Notice that the patient's record is **not visible** and direct download returns **403 Forbidden**.
   - Log back in as Patient, go to `/access`, select the record, paste the Doctor's wallet address, and click **Sign & Grant Access (MetaMask)**.
   - Log in as Doctor: the record is now unlocked and can be decrypted and downloaded!
   - Patient goes back to `/access` and clicks **Sign & Revoke Access (MetaMask)**: future access and downloads are instantly denied!

5. **Audit Trail**:
   - Visit `/history` to review the chronological on-chain event ledger for all `RecordRegistered`, `AccessGranted`, and `AccessRevoked` events.

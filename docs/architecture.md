# MediChain System Architecture

**Course:** SPPU BE Computer Engineering (2019 Pattern)  
**Subject:** Blockchain Technologies (BCT) Mini-Project  
**Project:** MediChain — Decentralized Medical Record Management System

---

## 1. Executive Summary

MediChain is a decentralized healthcare management platform engineered to resolve core issues in traditional electronic health records (EHR): data silos, unauthorized record tampering, single points of failure, and patient disempowerment.

By separating the **immutable validation layer (Blockchain)** from the **high-throughput application layer (Node/Express/MongoDB)**, MediChain delivers enterprise performance while ensuring verifiable cryptographic integrity.

---

## 2. High-Level Architecture Diagram

```
+--------------------------------------------------------------------------+
|                               Client Tier                                |
|  - React 18 + Vite SPA                                                   |
|  - Tailwind CSS Modern Healthcare Dark UI                                |
|  - ethers.js v6 (Web3 Provider & Signer / MetaMask)                      |
+---------------------+------------------------------+---------------------+
                      |                              |
                      | HTTP / REST                  | JSON-RPC (eth_call,
                      | (Metadata, Auth, Health)     |  sendTransaction)
                      v                              v
+---------------------+--------------+  +------------+---------------------+
|              Server Tier           |  |           Blockchain Tier        |
|  - Node.js & Express.js REST API   |  |  - Ethereum EVM / Hardhat Node   |
|  - Security: Helmet, CORS, Morgan  |  |  - MedicalRecords.sol (v0.8.24)  |
|  - Non-blocking MongoDB Connection |  |  - Immutable audit trail         |
|  - Off-chain cache & sync engine   |  |  - Patient ownership mappings    |
+---------------------+--------------+  +----------------------------------+
                      |
                      v
+---------------------+--------------+
|            Database Tier           |
|  - MongoDB (Mongoose ODM)          |
|  - User profiles, role metadata    |
|  - Off-chain indexed records       |
+------------------------------------+
```

---

## 3. Tier Responsibilities

### 3.1 Client Tier (`client/`)
- **Technology:** React 18, Vite, Tailwind CSS, Lucide icons, ethers.js v6.
- **Role:** Presents an intuitive healthcare dashboard for doctors, patients, and hospital administrators.
- **Key Capabilities:**
  - MetaMask integration for cryptographic signing.
  - Asynchronous query of Express API health and blockchain state.
  - Client-side data rendering with accessible dark-mode UI.

### 3.2 Server Tier (`server/`)
- **Technology:** Express.js 4, Node.js (ES Modules), Mongoose 8.
- **Role:** Intermediary layer managing off-chain business logic, fast search indexing, and health diagnostics.
- **Resilience Design:** The server starts up independently of database availability (non-blocking connection with exponential backoff / retry) allowing stateless endpoints such as `/api/health` to remain operational.

### 3.3 Blockchain Tier (`blockchain/`)
- **Technology:** Solidity 0.8.24, Hardhat, ethers.js v6, Hardhat Toolbox.
- **Contract:** `MedicalRecords.sol`
- **Role:** Immutable ledger recording record cryptographic hashes (IPFS CID / SHA-256), timestamp, owner, patient address, and record categorization. Prevents historical manipulation.

---

## 4. Data Flow: Record Registration (Preview for Phase 2)

1. **Doctor Action:** Doctor authenticates on the portal and inputs patient medical record details or uploads a document.
2. **Cryptographic Hashing:** The document is hashed (SHA-256 or IPFS CID generated).
3. **Smart Contract Transaction:** Doctor triggers `addRecord(patientAddress, dataHash, recordType)` via MetaMask.
4. **Block Confirmation & Event:** EVM mines the block and emits `RecordAdded(recordId, patient, addedBy, dataHash, recordType, timestamp)`.
5. **Off-Chain Synchronization:** Express API catches the event or receives the receipt to store cached metadata in MongoDB for high-speed indexing.

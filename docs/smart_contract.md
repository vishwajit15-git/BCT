# Smart Contract Specification: MedicalRecords.sol (Phase 2)

**Course:** SPPU BE Computer Engineering (2019 Pattern)  
**Subject:** Blockchain Technologies (BCT)  
**Project:** MediChain — Decentralized Medical Record Management System  
**Solidity Version:** `^0.8.24` (EVM target: `paris`)  
**Hardhat Version:** `^2.22.15` with `@nomicfoundation/hardhat-toolbox` and `ethers.js v6`

---

## 1. Overview & Privacy Principles

`MedicalRecords.sol` is an on-chain registry for verifiable healthcare documentation.

### Zero-Knowledge & Privacy Constraints
To comply with HIPAA, GDPR, and medical ethical guidelines:
- **No confidential medical documents or personal data are stored on-chain.**
- Personal identifiers (patient names, phone numbers, email addresses), clinical diagnoses, treatment notes, medical imaging, and encryption keys are strictly excluded from the blockchain state and event logs.
- The contract stores only:
  - `recordId` (`bytes32` cryptographic identifier)
  - `patient` (`address` Ethereum wallet)
  - `documentHash` (`bytes32` SHA-256 / IPFS CID cryptographic digest)
  - `timestamp` (`uint256` block timestamp)
  - `status` (`enum RecordStatus { None, Active, Revoked }`)

---

## 2. Data Structures & Enums

### `RecordStatus` Enum
```solidity
enum RecordStatus {
    None,     // 0: Record does not exist
    Active,   // 1: Record registered and valid
    Revoked   // 2: Record marked inactive / revoked
}
```

### `Record` Struct
```solidity
struct Record {
    bytes32 recordId;       // Unique bytes32 record identifier
    address patient;        // Patient wallet address (owner)
    bytes32 documentHash;   // SHA-256 / IPFS hash of off-chain record
    uint256 timestamp;      // Block timestamp at time of registration
    RecordStatus status;    // Active (1) or Revoked (2)
}
```

---

## 3. Contract Functions & Access-Control Rules

| Function | Type | Access Rule | Description |
|---|---|---|---|
| `registerRecord(bytes32 recordId, bytes32 documentHash)` | State-changing | Any patient | Registers a new record for `msg.sender`. Rejects duplicate IDs, zero IDs, and zero hashes. |
| `registerRecordForPatient(bytes32 recordId, address patient, bytes32 documentHash)` | State-changing | Only designated patient (`msg.sender == patient`) | Explicit registration that rejects third-party impersonation. |
| `grantAccess(bytes32 recordId, address doctor)` | State-changing | Record Owner only (`record.patient == msg.sender`) | Grants permission for a specific doctor to access the specified record. |
| `revokeAccess(bytes32 recordId, address doctor)` | State-changing | Record Owner only (`record.patient == msg.sender`) | Revokes permission for a specific doctor from the specified record. |
| `verifyDocumentHash(bytes32 recordId, bytes32 documentHash)` | View | Public | Compares candidate document hash against on-chain hash. Returns `true` on match, `false` otherwise. |
| `hasAccess(bytes32 recordId, address doctor)` | View | Public | Returns `true` if `doctor` has been granted access or is the record owner. Rejects zero address. |
| `getRecord(bytes32 recordId)` | View | Public | Returns `(recordId, patient, documentHash, timestamp, status)` metadata. |
| `getPatientRecordIds(address patient)` | View | Public | Returns array of `bytes32` record IDs registered by that patient. |
| `totalRecords()` | View | Public | Returns total count of registered records. |
| `deployer()` | View | Public | Returns the contract deployer address. |

---

## 4. Events Specification

All events emit minimal necessary identifiers with indexed fields for high-efficiency Web3 filtering:

```solidity
event RecordRegistered(
    bytes32 indexed recordId,
    address indexed patient,
    bytes32 documentHash,
    uint256 timestamp
);

event AccessGranted(
    bytes32 indexed recordId,
    address indexed patient,
    address indexed doctor,
    uint256 timestamp
);

event AccessRevoked(
    bytes32 indexed recordId,
    address indexed patient,
    address indexed doctor,
    uint256 timestamp
);
```

---

## 5. Frontend & Backend Integration Guide

### 5.1 Obtaining the ABI
Hardhat outputs the compiled ABI at:
```text
blockchain/artifacts/contracts/MedicalRecords.sol/MedicalRecords.json
```
To import the ABI in the client or backend:
```javascript
import MedicalRecordsArtifact from '../../blockchain/artifacts/contracts/MedicalRecords.sol/MedicalRecords.json'
const abi = MedicalRecordsArtifact.abi
```

### 5.2 Contract Address Configuration Strategy
- **Local Development**: When deploying via `npx hardhat run scripts/deploy.js --network localhost`, the deployed address is printed to the console.
- **Client Configuration**: Place in `client/.env`:
  ```ini
  VITE_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
  VITE_RPC_URL=http://127.0.0.1:8545
  ```
- **Backend Configuration**: Place in `server/.env`:
  ```ini
  CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
  RPC_URL=http://127.0.0.1:8545
  ```
- **Dynamic Connection with ethers.js v6**:
  ```javascript
  import { ethers } from 'ethers'

  const provider = new ethers.BrowserProvider(window.ethereum)
  const signer = await provider.getSigner()
  const contract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, abi, signer)

  // Example: Patient registers record
  const tx = await contract.registerRecord(recordId, documentHash)
  await tx.wait()
  ```

---

## 6. Security & Revert Messages Reference

| Condition | Revert Message |
|---|---|
| Zero record ID provided | `"MedicalRecords: invalid record ID"` |
| Zero document hash provided | `"MedicalRecords: invalid document hash"` |
| Zero patient address provided | `"MedicalRecords: invalid patient address"` |
| Caller tries to register for another patient | `"MedicalRecords: caller is not the patient"` |
| Duplicate record ID attempted | `"MedicalRecords: duplicate record ID"` |
| Accessing non-existent record | `"MedicalRecords: record does not exist"` |
| Non-owner tries to grant/revoke access | `"MedicalRecords: caller is not record owner"` |
| Zero doctor address provided | `"MedicalRecords: invalid doctor address"` |
| Patient grants access to themselves | `"MedicalRecords: patient already has owner access"` |

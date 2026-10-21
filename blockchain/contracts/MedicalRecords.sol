// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MedicalRecords
 * @author MediChain Team — SPPU BE Computer Engineering (2019 Pattern)
 * @notice Decentralized, patient-controlled medical record registry.
 *
 * Requirements:
 *  - Record registration by patient wallet with unique record ID and bytes32 document hash.
 *  - Rejection of duplicate record IDs, invalid hashes, and zero addresses.
 *  - Strict patient-controlled access control (grant/revoke access per doctor per record).
 *  - Record verification: compare document hashes and verify doctor permissions.
 *  - No confidential personal data (names, diagnoses, medical content, keys) stored on-chain.
 *  - Event logging for auditability: RecordRegistered, AccessGranted, AccessRevoked.
 */
contract MedicalRecords {
    // ── Enums & Structs ──────────────────────────────────────────────────────

    enum RecordStatus {
        None,     // 0: Record does not exist
        Active,   // 1: Record registered and valid
        Revoked   // 2: Record marked inactive / revoked
    }

    struct Record {
        bytes32 recordId;
        address patient;
        bytes32 documentHash;
        uint256 timestamp;
        RecordStatus status;
    }

    // ── State Variables ──────────────────────────────────────────────────────

    /// @notice Deployer / administrative address
    address public deployer;

    /// @notice Total count of records registered
    uint256 public totalRecords;

    /// @dev recordId => Record struct
    mapping(bytes32 => Record) private records;

    /// @dev patient address => array of record IDs owned by that patient
    mapping(address => bytes32[]) private patientRecords;

    /// @dev recordId => doctor address => access granted status
    mapping(bytes32 => mapping(address => bool)) private recordPermissions;

    // ── Events ───────────────────────────────────────────────────────────────

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

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyRecordOwner(bytes32 recordId) {
        require(records[recordId].status != RecordStatus.None, "MedicalRecords: record does not exist");
        require(records[recordId].patient == msg.sender, "MedicalRecords: caller is not record owner");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        deployer = msg.sender;
    }

    // ── Internal Helpers ─────────────────────────────────────────────────────

    function _register(
        bytes32 recordId,
        address patient,
        bytes32 documentHash
    ) internal returns (bool) {
        require(recordId != bytes32(0), "MedicalRecords: invalid record ID");
        require(documentHash != bytes32(0), "MedicalRecords: invalid document hash");
        require(patient != address(0), "MedicalRecords: invalid patient address");
        require(records[recordId].status == RecordStatus.None, "MedicalRecords: duplicate record ID");

        records[recordId] = Record({
            recordId: recordId,
            patient: patient,
            documentHash: documentHash,
            timestamp: block.timestamp,
            status: RecordStatus.Active
        });

        patientRecords[patient].push(recordId);
        totalRecords++;

        emit RecordRegistered(recordId, patient, documentHash, block.timestamp);
        return true;
    }

    // ── Record Registration (Patient-initiated) ──────────────────────────────

    /**
     * @notice Register a new medical record for the calling patient wallet.
     * @param recordId      Unique bytes32 identifier for the record.
     * @param documentHash  Cryptographic SHA-256 hash or IPFS multihash digest.
     */
    function registerRecord(
        bytes32 recordId,
        bytes32 documentHash
    ) external returns (bool) {
        return _register(recordId, msg.sender, documentHash);
    }

    /**
     * @notice Explicit registration requiring caller to match the designated patient wallet.
     *         Rejects any attempt by another wallet to register a record on behalf of another patient.
     * @param recordId      Unique bytes32 identifier for the record.
     * @param patient       The patient wallet address (must equal msg.sender).
     * @param documentHash  Cryptographic SHA-256 hash or IPFS multihash digest.
     */
    function registerRecordForPatient(
        bytes32 recordId,
        address patient,
        bytes32 documentHash
    ) external returns (bool) {
        require(patient != address(0), "MedicalRecords: invalid patient address");
        require(msg.sender == patient, "MedicalRecords: caller is not the patient");
        return _register(recordId, patient, documentHash);
    }

    // ── Patient-Controlled Access Management ─────────────────────────────────

    /**
     * @notice Grant a doctor wallet permission to access a specific medical record.
     * @dev Only the patient who owns the record can grant access.
     * @param recordId Unique identifier of the record.
     * @param doctor   Wallet address of the doctor being granted access.
     */
    function grantAccess(
        bytes32 recordId,
        address doctor
    ) external onlyRecordOwner(recordId) {
        require(doctor != address(0), "MedicalRecords: invalid doctor address");
        require(doctor != msg.sender, "MedicalRecords: patient already has owner access");

        recordPermissions[recordId][doctor] = true;

        emit AccessGranted(recordId, msg.sender, doctor, block.timestamp);
    }

    /**
     * @notice Revoke a doctor's permission to access a specific medical record.
     * @dev Only the patient who owns the record can revoke access.
     * @param recordId Unique identifier of the record.
     * @param doctor   Wallet address of the doctor being revoked.
     */
    function revokeAccess(
        bytes32 recordId,
        address doctor
    ) external onlyRecordOwner(recordId) {
        require(doctor != address(0), "MedicalRecords: invalid doctor address");

        recordPermissions[recordId][doctor] = false;

        emit AccessRevoked(recordId, msg.sender, doctor, block.timestamp);
    }

    // ── Verification & View Functions ────────────────────────────────────────

    /**
     * @notice Verify if a supplied document hash matches the immutable hash on-chain.
     * @param recordId      The record ID to verify.
     * @param documentHash  The hash of the off-chain document to verify against on-chain hash.
     * @return matches      True if the supplied hash matches the registered hash, false otherwise.
     */
    function verifyDocumentHash(
        bytes32 recordId,
        bytes32 documentHash
    ) external view returns (bool matches) {
        require(records[recordId].status != RecordStatus.None, "MedicalRecords: record does not exist");
        require(documentHash != bytes32(0), "MedicalRecords: invalid document hash");

        return records[recordId].documentHash == documentHash;
    }

    /**
     * @notice Check whether a given doctor address currently has permission to view a record.
     * @param recordId The record ID.
     * @param doctor   The doctor wallet address.
     * @return allowed True if doctor has permission or is the record owner, false otherwise.
     */
    function hasAccess(
        bytes32 recordId,
        address doctor
    ) external view returns (bool allowed) {
        require(records[recordId].status != RecordStatus.None, "MedicalRecords: record does not exist");
        require(doctor != address(0), "MedicalRecords: invalid doctor address");

        // The record patient always has access to their own record
        if (records[recordId].patient == doctor) {
            return true;
        }

        return recordPermissions[recordId][doctor];
    }

    /**
     * @notice Retrieve non-confidential record metadata.
     * @param recordId Unique record identifier.
     */
    function getRecord(
        bytes32 recordId
    ) external view returns (
        bytes32 id,
        address patient,
        bytes32 documentHash,
        uint256 timestamp,
        RecordStatus status
    ) {
        require(records[recordId].status != RecordStatus.None, "MedicalRecords: record does not exist");
        Record storage r = records[recordId];
        return (r.recordId, r.patient, r.documentHash, r.timestamp, r.status);
    }

    /**
     * @notice Retrieve all record IDs registered by a specific patient address.
     * @param patient Patient wallet address.
     */
    function getPatientRecordIds(
        address patient
    ) external view returns (bytes32[] memory) {
        require(patient != address(0), "MedicalRecords: invalid patient address");
        return patientRecords[patient];
    }
}

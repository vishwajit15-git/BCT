// test/MedicalRecords.test.js
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { anyValue } = require('@nomicfoundation/hardhat-chai-matchers/withArgs')

describe('MedicalRecords (Phase 2)', function () {
  let contract
  let deployer
  let patient1
  let patient2
  let doctor1
  let doctor2
  let attacker

  // Synthetic test data
  const recordId1 = ethers.id('RECORD_SPPU_2026_001')
  const recordId2 = ethers.id('RECORD_SPPU_2026_002')
  const validHash1 = ethers.keccak256(ethers.toUtf8Bytes('synthetic-ehr-payload-alpha'))
  const validHash2 = ethers.keccak256(ethers.toUtf8Bytes('synthetic-ehr-payload-beta'))
  const wrongHash = ethers.keccak256(ethers.toUtf8Bytes('synthetic-tampered-payload'))
  const zeroHash = ethers.ZeroHash
  const zeroAddress = ethers.ZeroAddress

  beforeEach(async function () {
    ;[deployer, patient1, patient2, doctor1, doctor2, attacker] = await ethers.getSigners()
    const MedicalRecordsFactory = await ethers.getContractFactory('MedicalRecords')
    contract = await MedicalRecordsFactory.deploy()
    await contract.waitForDeployment()
  })

  // ── 1. Patient can register a valid record ────────────────────────────────
  describe('1. Record Registration', function () {
    it('allows a patient to register a valid record', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)

      expect(await contract.totalRecords()).to.equal(1)

      const [id, patient, docHash, timestamp, status] = await contract.getRecord(recordId1)
      expect(id).to.equal(recordId1)
      expect(patient).to.equal(patient1.address)
      expect(docHash).to.equal(validHash1)
      expect(timestamp).to.be.gt(0)
      expect(status).to.equal(1) // RecordStatus.Active

      const patientRecordIds = await contract.getPatientRecordIds(patient1.address)
      expect(patientRecordIds).to.deep.equal([recordId1])

      // Record owner always has permission to access their own record
      expect(await contract.hasAccess(recordId1, patient1.address)).to.be.true
    })
  })

  // ── 2. Duplicate record registration is rejected ──────────────────────────
  describe('2. Duplicate Record Rejection', function () {
    it('rejects duplicate record registration with the same record ID', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)

      // Same patient attempting to register the same ID again
      await expect(
        contract.connect(patient1).registerRecord(recordId1, validHash1)
      ).to.be.revertedWith('MedicalRecords: duplicate record ID')

      // Different patient attempting to hijack or reuse the same ID
      await expect(
        contract.connect(patient2).registerRecord(recordId1, validHash2)
      ).to.be.revertedWith('MedicalRecords: duplicate record ID')
    })
  })

  // ── 3. A different wallet cannot register a record as another patient ─────
  describe('3. Patient Impersonation Prevention', function () {
    it('rejects registration when caller is not the designated patient', async function () {
      await expect(
        contract.connect(attacker).registerRecordForPatient(recordId1, patient1.address, validHash1)
      ).to.be.revertedWith('MedicalRecords: caller is not the patient')
    })

    it('attributes the record strictly to msg.sender when registered directly', async function () {
      await contract.connect(attacker).registerRecord(recordId1, validHash1)
      const record = await contract.getRecord(recordId1)
      expect(record.patient).to.equal(attacker.address)
      expect(record.patient).to.not.equal(patient1.address)
    })
  })

  // ── 4. The record owner can grant access to a doctor ──────────────────────
  describe('4. Grant Doctor Access', function () {
    it('allows the record owner to grant access to a doctor', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)

      // Initially doctor has no access
      expect(await contract.hasAccess(recordId1, doctor1.address)).to.be.false

      // Patient grants access
      await contract.connect(patient1).grantAccess(recordId1, doctor1.address)

      // Access is now granted
      expect(await contract.hasAccess(recordId1, doctor1.address)).to.be.true
      // Other doctors still do not have access (record-specific permission)
      expect(await contract.hasAccess(recordId1, doctor2.address)).to.be.false
    })
  })

  // ── 5. The record owner can revoke access ─────────────────────────────────
  describe('5. Revoke Doctor Access', function () {
    it('allows the record owner to revoke previously granted access', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)
      await contract.connect(patient1).grantAccess(recordId1, doctor1.address)
      expect(await contract.hasAccess(recordId1, doctor1.address)).to.be.true

      // Revoke access
      await contract.connect(patient1).revokeAccess(recordId1, doctor1.address)

      // Access is now revoked
      expect(await contract.hasAccess(recordId1, doctor1.address)).to.be.false
    })
  })

  // ── 6. Unauthorized wallet cannot modify another patient's permissions ───
  describe('6. Unauthorized Permission Modification', function () {
    beforeEach(async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)
    })

    it('prevents an arbitrary wallet from granting access', async function () {
      await expect(
        contract.connect(attacker).grantAccess(recordId1, doctor1.address)
      ).to.be.revertedWith('MedicalRecords: caller is not record owner')
    })

    it('prevents a doctor from self-granting access to a patient record', async function () {
      await expect(
        contract.connect(doctor1).grantAccess(recordId1, doctor1.address)
      ).to.be.revertedWith('MedicalRecords: caller is not record owner')
    })

    it('prevents an unauthorized wallet from revoking access', async function () {
      await contract.connect(patient1).grantAccess(recordId1, doctor1.address)
      await expect(
        contract.connect(attacker).revokeAccess(recordId1, doctor1.address)
      ).to.be.revertedWith('MedicalRecords: caller is not record owner')
    })
  })

  // ── 7. Correct document hash verifies successfully ────────────────────────
  describe('7. Document Hash Verification (Success)', function () {
    it('verifies successfully when supplied document hash matches registered hash', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)

      const isMatch = await contract.verifyDocumentHash(recordId1, validHash1)
      expect(isMatch).to.be.true
    })
  })

  // ── 8. Different document hash fails verification ─────────────────────────
  describe('8. Document Hash Verification (Mismatch)', function () {
    it('returns false when supplied document hash does not match registered hash', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)

      const isMatch = await contract.verifyDocumentHash(recordId1, wrongHash)
      expect(isMatch).to.be.false
    })
  })

  // ── 9. Invalid hashes and zero addresses are rejected ─────────────────────
  describe('9. Invalid Input & Zero Address Rejection', function () {
    beforeEach(async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)
    })

    it('rejects registration with zero hash', async function () {
      await expect(
        contract.connect(patient1).registerRecord(recordId2, zeroHash)
      ).to.be.revertedWith('MedicalRecords: invalid document hash')
    })

    it('rejects registration with zero record ID', async function () {
      await expect(
        contract.connect(patient1).registerRecord(zeroHash, validHash2)
      ).to.be.revertedWith('MedicalRecords: invalid record ID')
    })

    it('rejects explicit registration with zero patient address', async function () {
      await expect(
        contract.connect(patient1).registerRecordForPatient(recordId2, zeroAddress, validHash2)
      ).to.be.revertedWith('MedicalRecords: invalid patient address')
    })

    it('rejects granting access to zero address', async function () {
      await expect(
        contract.connect(patient1).grantAccess(recordId1, zeroAddress)
      ).to.be.revertedWith('MedicalRecords: invalid doctor address')
    })

    it('rejects revoking access from zero address', async function () {
      await expect(
        contract.connect(patient1).revokeAccess(recordId1, zeroAddress)
      ).to.be.revertedWith('MedicalRecords: invalid doctor address')
    })

    it('rejects hasAccess check for zero address', async function () {
      await expect(
        contract.hasAccess(recordId1, zeroAddress)
      ).to.be.revertedWith('MedicalRecords: invalid doctor address')
    })

    it('rejects verifyDocumentHash with zero hash', async function () {
      await expect(
        contract.verifyDocumentHash(recordId1, zeroHash)
      ).to.be.revertedWith('MedicalRecords: invalid document hash')
    })

    it('rejects getPatientRecordIds for zero address', async function () {
      await expect(
        contract.getPatientRecordIds(zeroAddress)
      ).to.be.revertedWith('MedicalRecords: invalid patient address')
    })

    it('rejects queries for non-existent records', async function () {
      await expect(
        contract.getRecord(recordId2)
      ).to.be.revertedWith('MedicalRecords: record does not exist')

      await expect(
        contract.verifyDocumentHash(recordId2, validHash1)
      ).to.be.revertedWith('MedicalRecords: record does not exist')

      await expect(
        contract.hasAccess(recordId2, doctor1.address)
      ).to.be.revertedWith('MedicalRecords: record does not exist')
    })
  })

  // ── 10. Events are emitted correctly ──────────────────────────────────────
  describe('10. Event Emissions', function () {
    it('emits RecordRegistered event on registration', async function () {
      await expect(contract.connect(patient1).registerRecord(recordId1, validHash1))
        .to.emit(contract, 'RecordRegistered')
        .withArgs(recordId1, patient1.address, validHash1, anyValue)
    })

    it('emits AccessGranted event on granting permission', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)

      await expect(contract.connect(patient1).grantAccess(recordId1, doctor1.address))
        .to.emit(contract, 'AccessGranted')
        .withArgs(recordId1, patient1.address, doctor1.address, anyValue)
    })

    it('emits AccessRevoked event on revoking permission', async function () {
      await contract.connect(patient1).registerRecord(recordId1, validHash1)
      await contract.connect(patient1).grantAccess(recordId1, doctor1.address)

      await expect(contract.connect(patient1).revokeAccess(recordId1, doctor1.address))
        .to.emit(contract, 'AccessRevoked')
        .withArgs(recordId1, patient1.address, doctor1.address, anyValue)
    })
  })
})

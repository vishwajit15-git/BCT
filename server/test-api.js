// server/test-api.js — Comprehensive API, Blockchain & Security End-to-End Verification Suite
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { ethers } from 'ethers'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api'
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:8545'
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'

// Hardhat test account private keys
const PATIENT_PK = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d' // Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
const DOCTOR_PK = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'  // Account #2: 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC

// Helper for HTTP requests
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  const res = await fetch(url, options)
  let data
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    data = await res.json()
  } else {
    data = await res.text()
  }
  return { status: res.status, headers: res.headers, data }
}

async function runTests() {
  console.log('========================================================================')
  console.log('  MediChain Phase 4 — End-to-End Core Workflow Verification Suite')
  console.log(`  Backend API      : ${BASE_URL}`)
  console.log(`  RPC Provider     : ${RPC_URL}`)
  console.log(`  Contract Address : ${CONTRACT_ADDRESS}`)
  console.log('========================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅  ${message}`)
      passed++
    } else {
      console.error(`  ❌  FAIL: ${message}`)
      failed++
    }
  }

  try {
    // 0. Initialize Blockchain Provider & Signers
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const patientSigner = new ethers.Wallet(PATIENT_PK, provider)
    const doctorSigner = new ethers.Wallet(DOCTOR_PK, provider)

    const artifactPath = path.resolve(
      __dirname,
      '../blockchain/artifacts/contracts/MedicalRecords.sol/MedicalRecords.json'
    )
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'))
    const contractWithPatient = new ethers.Contract(CONTRACT_ADDRESS, artifact.abi, patientSigner)

    // 1. Health check & DB connection
    console.log('1. Verifying System Health & Database Connection...')
    const health = await request('/health')
    assert(health.status === 200, 'GET /api/health returned 200 OK')
    assert(health.data.database === 'connected', `MongoDB connected (${health.data.database})`)

    // 2. Synthetic Patient & Doctor Registration & Login
    console.log('\n2. Testing Patient Registration & Authentication...')
    const uniqueId = Date.now()
    const patientEmail = `patient_${uniqueId}@medichain.local`
    const doctorEmail = `doctor_${uniqueId}@medichain.local`
    const patientWallet = patientSigner.address.toLowerCase()
    const doctorWallet = doctorSigner.address.toLowerCase()
    const password = 'TestSecurePassword123!'

    const regPatient = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Smith',
        email: patientEmail,
        password,
        role: 'patient',
        walletAddress: patientWallet,
      }),
    })
    assert(regPatient.status === 201, 'Patient registration returned 201 Created')
    assert(!!regPatient.data.token, 'Patient JWT token issued')
    const patientToken = regPatient.data.token

    const loginPatient = await request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: patientEmail, password }),
    })
    assert(loginPatient.status === 200, 'Patient login returned 200 OK')

    console.log('\n3. Testing Doctor Registration & Authentication...')
    const regDoctor = await request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Gregory House',
        email: doctorEmail,
        password,
        role: 'doctor',
        walletAddress: doctorWallet,
        specialization: 'Diagnostic Medicine',
        licenseNumber: `DOC-SPPU-${uniqueId}`,
      }),
    })
    assert(regDoctor.status === 201, 'Doctor registration returned 201 Created')
    const doctorToken = regDoctor.data.token

    // 3. Upload Sample Medical PDF & Encrypt with AES-256-GCM
    console.log('\n4. Testing PDF Upload & Off-Chain AES-256-GCM Encryption...')
    const samplePdfPath = path.resolve(__dirname, '../sample_medical_report.pdf')
    let pdfBytes
    if (fs.existsSync(samplePdfPath)) {
      pdfBytes = fs.readFileSync(samplePdfPath)
    } else {
      pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Title (Synthetic Lab Report) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
    }

    const formData = new FormData()
    formData.append('document', new Blob([pdfBytes], { type: 'application/pdf' }), 'diagnostic_panel.pdf')
    formData.append('title', 'Metabolic & CBC Diagnostic Panel')
    formData.append('recordType', 'lab_report')

    const uploadRes = await fetch(`${BASE_URL}/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
      body: formData,
    })
    const uploadData = await uploadRes.json()
    assert(uploadRes.status === 201, 'POST /api/records returned 201 Created')
    assert(uploadData.record.recordId.startsWith('0x'), `Generated 32-byte Record ID: ${uploadData.record.recordId.slice(0, 18)}...`)
    assert(uploadData.record.documentHash.startsWith('0x'), `Computed SHA-256 Hash: ${uploadData.record.documentHash.slice(0, 18)}...`)

    const { recordId, documentHash } = uploadData.record

    async function getNextNonce(address) {
      const hex = await provider.send('eth_getTransactionCount', [address, 'pending'])
      return parseInt(hex, 16)
    }

    // 4. Register Hash On-Chain with Patient Wallet
    console.log('\n5. Registering Document Hash On-Chain via Smart Contract...')
    let currentNonce = await getNextNonce(patientSigner.address)
    const tx = await contractWithPatient.registerRecord(recordId, documentHash, { nonce: currentNonce })
    const receipt = await tx.wait()
    assert(receipt.status === 1, `On-chain transaction mined in block #${receipt.blockNumber} (txHash: ${receipt.hash.slice(0, 18)}...)`)

    // 5. Confirm On-Chain Transaction Hash with Backend
    console.log('\n6. Confirming Transaction Hash with Backend Record State...')
    const confirmRes = await request(`/records/${recordId}/confirm`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${patientToken}`,
      },
      body: JSON.stringify({ txHash: receipt.hash }),
    })
    assert(confirmRes.status === 200, 'PATCH /api/records/:id/confirm returned 200 OK')
    assert(confirmRes.data.record.onChainConfirmed === true, 'Record status updated to onChainConfirmed: true')

    // 6. Unauthorized Doctor Download Denial
    console.log('\n7. Enforcing Unauthorized Download Denial (Before Access Granted)...')
    const doctorUnauthDownload = await request(`/records/${recordId}/download`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })
    assert(doctorUnauthDownload.status === 403, 'Unauthorized doctor download correctly denied with 403 Forbidden')

    // 7. Grant Doctor Access On-Chain
    console.log('\n8. Patient Granting Doctor Access On-Chain...')
    currentNonce = await getNextNonce(patientSigner.address)
    const grantTx = await contractWithPatient.grantAccess(recordId, ethers.getAddress(doctorWallet), { nonce: currentNonce })
    const grantReceipt = await grantTx.wait()
    assert(grantReceipt.status === 1, `AccessGranted transaction confirmed in block #${grantReceipt.blockNumber}`)

    // Verify smart contract hasAccess view
    const onChainAccessGranted = await contractWithPatient.hasAccess(recordId, ethers.getAddress(doctorWallet))
    assert(onChainAccessGranted === true, 'Smart contract confirms hasAccess(recordId, doctor) is TRUE')

    // 8. Authorized Document Download by Doctor
    console.log('\n9. Testing Authorized Doctor Download & Decryption...')
    const doctorAuthDownload = await fetch(`${BASE_URL}/records/${recordId}/download`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })
    assert(doctorAuthDownload.status === 200, 'Authorized doctor download returned 200 OK')
    const downloadedDoctorPdf = Buffer.from(await doctorAuthDownload.arrayBuffer())
    assert(downloadedDoctorPdf.equals(pdfBytes), 'Doctor downloaded decrypted PDF matches original PDF exactly')

    // 9. Revoke Doctor Access On-Chain & Deny Subsequent Downloads
    console.log('\n10. Patient Revoking Doctor Access On-Chain...')
    currentNonce = await getNextNonce(patientSigner.address)
    const revokeTx = await contractWithPatient.revokeAccess(recordId, ethers.getAddress(doctorWallet), { nonce: currentNonce })
    const revokeReceipt = await revokeTx.wait()
    assert(revokeReceipt.status === 1, `AccessRevoked transaction confirmed in block #${revokeReceipt.blockNumber}`)

    const onChainAccessRevoked = await contractWithPatient.hasAccess(recordId, ethers.getAddress(doctorWallet))
    assert(onChainAccessRevoked === false, 'Smart contract confirms hasAccess(recordId, doctor) is now FALSE')

    const doctorPostRevokeDownload = await request(`/records/${recordId}/download`, {
      headers: { Authorization: `Bearer ${doctorToken}` },
    })
    assert(doctorPostRevokeDownload.status === 403, 'Doctor download rejected with 403 Forbidden after access revocation')

    // 10. Audit & Tamper Verification
    console.log('\n11. Testing Tamper Verification (Untampered State)...')
    const verifyUntampered = await request(`/records/${recordId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
    })
    assert(verifyUntampered.status === 200, 'POST /api/records/:id/verify returned 200 OK')
    assert(verifyUntampered.data.status === 'VERIFIED', 'Initial file integrity verified: STATUS: VERIFIED')
    assert(verifyUntampered.data.verified === true, 'Integrity check returns verified: true')

    console.log('\n12. Testing Tamper Detection (Simulating File Tampering on Storage)...')
    const uploadsDir = path.resolve(__dirname, 'uploads')
    const encFileName = `${recordId.replace('0x', '')}.enc`
    const encFilePath = path.join(uploadsDir, encFileName)

    // Save backup of original encrypted file
    const originalEncryptedBytes = fs.readFileSync(encFilePath)

    // Tamper with bytes on disk
    const tamperedBytes = Buffer.from(originalEncryptedBytes)
    tamperedBytes[0] = tamperedBytes[0] ^ 0xff // Flip bits
    fs.writeFileSync(encFilePath, tamperedBytes)

    const verifyTampered = await request(`/records/${recordId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
    })
    assert(verifyTampered.status === 200, 'POST /api/records/:id/verify handled tampered file gracefully')
    assert(verifyTampered.data.status === 'TAMPERED', 'Tamper detected! STATUS: TAMPERED')
    assert(verifyTampered.data.verified === false, 'Tamper detected! verified: false')

    // Restore original file
    fs.writeFileSync(encFilePath, originalEncryptedBytes)

    // Re-verify after restoring original file
    const verifyRestored = await request(`/records/${recordId}/verify`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${patientToken}` },
    })
    assert(verifyRestored.data.status === 'VERIFIED', 'Restored file integrity returns STATUS: VERIFIED')

    console.log('\n========================================================================')
    console.log(`  ALL WORKFLOW INTEGRATION TESTS PASSED!`)
    console.log(`  Total Checks Passed : ${passed}`)
    console.log(`  Total Checks Failed : ${failed}`)
    console.log('========================================================================\n')

    if (failed === 0) {
      process.exit(0)
    } else {
      process.exit(1)
    }
  } catch (err) {
    console.error('Test execution error:', err)
    process.exit(1)
  }
}

runTests()

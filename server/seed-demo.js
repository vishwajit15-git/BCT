// server/seed-demo.js
import fs from 'fs'
import path from 'path'
import { ethers } from 'ethers'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE = 'http://localhost:5000/api'
const RPC = 'http://127.0.0.1:8545'
const CONTRACT = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

async function seed() {
  console.log('Seeding Demo Healthcare Accounts & On-Chain Records...')

  // 1. Patient
  const pEmail = 'aditi.patient@medichain.org'
  const pPass = 'PatientPass123!'
  const pWallet = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  const pPriv = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'

  let pLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: pEmail, password: pPass })
  }).then(r => r.json())

  if (!pLogin.token) {
    console.log('Registering patient...')
    await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Aditi Deshmukh',
        email: pEmail,
        password: pPass,
        role: 'patient',
        walletAddress: pWallet
      })
    })

    pLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: pEmail, password: pPass })
    }).then(r => r.json())
  }
  console.log('Patient Token obtained:', !!pLogin.token)

  // 2. Doctor
  const dEmail = 'rajesh.doctor@medichain.org'
  const dPass = 'DoctorPass123!'
  const dWallet = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'

  let dLogin = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: dEmail, password: dPass })
  }).then(r => r.json())

  if (!dLogin.token) {
    console.log('Registering doctor...')
    await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Rajesh Sharma, MD',
        email: dEmail,
        password: dPass,
        role: 'doctor',
        walletAddress: dWallet,
        specialization: 'Interventional Cardiology',
        licenseNumber: 'MCI-PUN-2024-88491'
      })
    })

    dLogin = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: dEmail, password: dPass })
    }).then(r => r.json())
  }
  console.log('Doctor Token obtained:', !!dLogin.token)

  // 3. Upload Sample PDF
  const pdfPath = path.resolve(__dirname, '../sample_medical_report.pdf')
  const pdfBytes = fs.readFileSync(pdfPath)
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })

  const fd = new FormData()
  fd.append('title', 'Comprehensive Lipid & Cardiac Biomarker Panel')
  fd.append('recordType', 'lab_report')
  fd.append('document', blob, 'cardiac_biomarker_panel.pdf')

  const uploadRes = await fetch(`${BASE}/records`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${pLogin.token}` },
    body: fd
  }).then(r => r.json())

  console.log('Uploaded Record:', uploadRes.record?.recordId)
  const recordId = uploadRes.record.recordId
  const docHash = uploadRes.record.documentHash

  // 4. Register on-chain
  const provider = new ethers.JsonRpcProvider(RPC)
  const signer = new ethers.Wallet(pPriv, provider)
  const abi = [
    'function registerRecord(bytes32 recordId, bytes32 documentHash) external returns (bool)',
    'function grantAccess(bytes32 recordId, address doctor) external',
    'function hasAccess(bytes32 recordId, address doctor) external view returns (bool)'
  ]
  const contract = new ethers.Contract(CONTRACT, abi, signer)

  const tx1 = await contract.registerRecord(recordId, docHash)
  const r1 = await tx1.wait()
  console.log('Mined on-chain registration block:', r1.blockNumber, 'tx:', r1.hash)

  // 5. Confirm on backend
  const cRes = await fetch(`${BASE}/records/${recordId}/confirm`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${pLogin.token}`
    },
    body: JSON.stringify({ txHash: r1.hash })
  }).then(r => r.json())
  console.log('Confirmed on backend:', cRes.success)

  // 6. Grant doctor access with fresh nonce
  const nonce = await provider.getTransactionCount(signer.address, 'latest')
  const tx2 = await contract.grantAccess(recordId, dWallet, { nonce })
  const r2 = await tx2.wait()
  console.log('Mined access grant block:', r2.blockNumber, 'tx:', r2.hash)

  const hasAccess = await contract.hasAccess(recordId, dWallet)
  console.log('Verified Doctor Has Access On-Chain:', hasAccess)

  console.log('\n=== DEMO ACCOUNTS READY ===')
  console.log('Patient:  aditi.patient@medichain.org / PatientPass123!')
  console.log('Doctor:   rajesh.doctor@medichain.org / DoctorPass123!')
  console.log('Record ID:', recordId)
}

seed().catch(console.error)

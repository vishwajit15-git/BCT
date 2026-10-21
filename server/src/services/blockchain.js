import { ethers } from 'ethers'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let cachedContract = null
let cachedAbi = null

/**
 * Loads the compiled MedicalRecords contract ABI from the Hardhat artifact.
 */
export function getContractAbi() {
  if (cachedAbi) return cachedAbi

  // Resolve path to the compiler artifact in blockchain/
  const artifactPath = path.resolve(
    __dirname,
    '../../../blockchain/artifacts/contracts/MedicalRecords.sol/MedicalRecords.json'
  )

  if (fs.existsSync(artifactPath)) {
    const raw = fs.readFileSync(artifactPath, 'utf8')
    const parsed = JSON.parse(raw)
    cachedAbi = parsed.abi
    return cachedAbi
  }

  throw new Error(`Smart contract artifact not found at ${artifactPath}. Please run: npm run blockchain:compile`)
}

/**
 * Instantiates an ethers Contract instance connected to the configured RPC provider.
 */
export function getContract() {
  const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545'
  const contractAddress = process.env.CONTRACT_ADDRESS

  if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('CONTRACT_ADDRESS is not properly configured in server environment.')
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl)
  const abi = getContractAbi()
  return new ethers.Contract(contractAddress, abi, provider)
}

/**
 * Checks whether a given wallet address has permission to view a record on-chain.
 * @param {string} recordId - 0x-prefixed 32-byte record ID
 * @param {string} requesterWallet - Ethereum wallet address
 * @returns {Promise<boolean>}
 */
export async function checkOnChainAccess(recordId, requesterWallet) {
  try {
    const contract = getContract()
    const cleanAddress = ethers.getAddress(requesterWallet.trim())
    const allowed = await contract.hasAccess(recordId, cleanAddress)
    return allowed === true
  } catch (err) {
    console.error(`Blockchain checkOnChainAccess error for record ${recordId}:`, err.message)
    // If the contract reverts (e.g. record does not exist on-chain or invalid address), deny access
    return false
  }
}

/**
 * Verifies if candidate document hash matches the immutable hash on-chain.
 * @param {string} recordId - 0x-prefixed 32-byte record ID
 * @param {string} documentHash - 0x-prefixed 32-byte SHA-256 hash
 * @returns {Promise<boolean>}
 */
export async function verifyOnChainHash(recordId, documentHash) {
  try {
    const contract = getContract()
    const matches = await contract.verifyDocumentHash(recordId, documentHash)
    return matches === true
  } catch (err) {
    console.error(`Blockchain verifyOnChainHash error for record ${recordId}:`, err.message)
    return false
  }
}

/**
 * Retrieves non-confidential record metadata from the smart contract.
 * @param {string} recordId - 0x-prefixed 32-byte record ID
 */
export async function getOnChainRecordMetadata(recordId) {
  try {
    const contract = getContract()
    const record = await contract.getRecord(recordId)
    return {
      recordId: record[0],
      patient: record[1],
      documentHash: record[2],
      timestamp: Number(record[3]),
      status: Number(record[4]), // 1 = Active, 2 = Revoked
    }
  } catch (err) {
    console.error(`Blockchain getRecord error for ${recordId}:`, err.message)
    return null
  }
}

/**
 * Queries on-chain audit events for a specific record.
 * @param {string} recordId - 0x-prefixed 32-byte record ID
 */
export async function getRecordAuditEvents(recordId) {
  try {
    const contract = getContract()
    const provider = contract.runner

    // Filter events matching the recordId
    const registeredFilter = contract.filters.RecordRegistered(recordId)
    const grantedFilter = contract.filters.AccessGranted(recordId)
    const revokedFilter = contract.filters.AccessRevoked(recordId)

    const [regEvents, grantEvents, revokeEvents] = await Promise.all([
      contract.queryFilter(registeredFilter, 0, 'latest'),
      contract.queryFilter(grantedFilter, 0, 'latest'),
      contract.queryFilter(revokedFilter, 0, 'latest'),
    ])

    const auditLog = []

    for (const ev of regEvents) {
      const block = await provider.getBlock(ev.blockNumber)
      auditLog.push({
        event: 'RecordRegistered',
        recordId: ev.args[0],
        patient: ev.args[1],
        documentHash: ev.args[2],
        timestamp: Number(ev.args[3]),
        txHash: ev.transactionHash,
        blockNumber: ev.blockNumber,
        blockTimestamp: block ? block.timestamp : null,
      })
    }

    for (const ev of grantEvents) {
      const block = await provider.getBlock(ev.blockNumber)
      auditLog.push({
        event: 'AccessGranted',
        recordId: ev.args[0],
        patient: ev.args[1],
        doctor: ev.args[2],
        timestamp: Number(ev.args[3]),
        txHash: ev.transactionHash,
        blockNumber: ev.blockNumber,
        blockTimestamp: block ? block.timestamp : null,
      })
    }

    for (const ev of revokeEvents) {
      const block = await provider.getBlock(ev.blockNumber)
      auditLog.push({
        event: 'AccessRevoked',
        recordId: ev.args[0],
        patient: ev.args[1],
        doctor: ev.args[2],
        timestamp: Number(ev.args[3]),
        txHash: ev.transactionHash,
        blockNumber: ev.blockNumber,
        blockTimestamp: block ? block.timestamp : null,
      })
    }

    // Sort chronologically by blockNumber / timestamp
    auditLog.sort((a, b) => a.blockNumber - b.blockNumber || a.timestamp - b.timestamp)
    return auditLog
  } catch (err) {
    console.error(`Blockchain audit log query error for ${recordId}:`, err.message)
    return []
  }
}

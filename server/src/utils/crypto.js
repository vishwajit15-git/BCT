import crypto from 'crypto'

/**
 * Derives or validates a 32-byte (256-bit) encryption key from the environment variable.
 */
function getEncryptionKey() {
  const envKey = process.env.FILE_ENCRYPTION_KEY
  if (!envKey) {
    throw new Error('FILE_ENCRYPTION_KEY environment variable is not defined.')
  }
  // If hex string of 64 chars, convert from hex; otherwise sha256 hash it to 32 bytes
  if (envKey.length === 64 && /^[0-9a-fA-F]+$/.test(envKey)) {
    return Buffer.from(envKey, 'hex')
  }
  return crypto.createHash('sha256').update(envKey).digest()
}

/**
 * Computes the SHA-256 hash of a buffer formatted as a 0x-prefixed 32-byte hex string (bytes32).
 * @param {Buffer} buffer - File or data buffer
 * @returns {string} 0x-prefixed 64-hex-character string
 */
export function calculateSHA256(buffer) {
  const hash = crypto.createHash('sha256').update(buffer).digest('hex')
  return '0x' + hash
}

/**
 * Generates a random 32-byte record ID formatted as a 0x-prefixed hex string (bytes32).
 * @returns {string} 0x-prefixed 64-hex-character string
 */
export function generateRecordId() {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  return '0x' + randomBytes
}

/**
 * Encrypts a buffer using authenticated AES-256-GCM.
 * @param {Buffer} buffer - Plaintext data buffer
 * @returns {{ encryptedData: Buffer, iv: string, authTag: string }}
 */
export function encryptBuffer(buffer) {
  const key = getEncryptionKey()
  const iv = crypto.randomBytes(12) // Standard 96-bit IV for GCM

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encryptedData = Buffer.concat([cipher.update(buffer), cipher.final()])
  const authTag = cipher.getAuthTag()

  return {
    encryptedData,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
  }
}

/**
 * Decrypts a buffer using authenticated AES-256-GCM.
 * Throws an error if the authTag does not match or the data has been altered.
 * @param {Buffer} encryptedBuffer - Ciphertext data buffer
 * @param {string} ivHex - Initialization vector in hex
 * @param {string} authTagHex - 16-byte authentication tag in hex
 * @returns {Buffer} Decrypted plaintext buffer
 */
export function decryptBuffer(encryptedBuffer, ivHex, authTagHex) {
  const key = getEncryptionKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)

  const decryptedData = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])
  return decryptedData
}

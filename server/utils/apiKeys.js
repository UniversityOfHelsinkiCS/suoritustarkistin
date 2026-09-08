/**
 * Tokens are 32 bytes of CSPRNG output, so a plain SHA-256 is the right store: no
 * dictionary to grind, and auth stays one indexed lookup rather than a comparison against
 * every key on file. The plaintext is returned once and never stored or logged.
 */
const crypto = require('crypto')

const logger = require('@server/utils/logger')
const db = require('../models/index')

const TOKEN_PREFIX = 'suotar_'

const MOOCFI_CLIENT = 'moocfi'
const DISPLAY_PREFIX_LENGTH = TOKEN_PREFIX.length + 6

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

const generateToken = () => `${TOKEN_PREFIX}${crypto.randomBytes(32).toString('base64url')}`

// Returns [record, token]. The token is the only copy.
const createApiKey = async ({ name, client, createdById, expiresAt = null }) => {
  const token = generateToken()

  const apiKey = await db.api_keys.create({
    name,
    client,
    createdById,
    expiresAt,
    tokenHash: hashToken(token),
    prefix: token.slice(0, DISPLAY_PREFIX_LENGTH)
  })

  return [apiKey, token]
}

// Throttled so authenticating a busy caller stays a read.
const LAST_USED_THROTTLE_MS = 5 * 60 * 1000

const touchLastUsed = async (apiKey) => {
  const now = new Date()
  if (apiKey.lastUsedAt && now - apiKey.lastUsedAt < LAST_USED_THROTTLE_MS) return

  // Failing to record a timestamp must never fail an otherwise valid request.
  await db.api_keys.update({ lastUsedAt: now }, { where: { id: apiKey.id } }).catch((error) => {
    logger.info({ message: 'Could not record API key use', apiKeyId: apiKey.id, error: error.message })
  })
}

const resolveApiKey = async (token, client) => {
  if (!token || typeof token !== 'string') return null

  const apiKey = await db.api_keys.findOne({ where: { tokenHash: hashToken(token), client } })
  if (!apiKey || !apiKey.active) return null

  await touchLastUsed(apiKey)
  return apiKey
}

module.exports = {
  TOKEN_PREFIX,
  MOOCFI_CLIENT,
  DISPLAY_PREFIX_LENGTH,
  LAST_USED_THROTTLE_MS,
  hashToken,
  generateToken,
  createApiKey,
  resolveApiKey
}

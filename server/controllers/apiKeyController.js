const logger = require('@server/utils/logger')
const { createApiKey } = require('@server/utils/apiKeys')
const db = require('../models/index')

const handleDatabaseError = (res, error) => {
  logger.error(error.message)
  return res.status(500).json({ error: error.toString() })
}

// The hash is the stored secret's only form; it never leaves the server.
const PUBLIC_ATTRIBUTES = [
  'id',
  'name',
  'client',
  'prefix',
  'createdById',
  'revokedById',
  'revokedAt',
  'expiresAt',
  'lastUsedAt',
  'createdAt'
]

const serialize = (apiKey) => ({
  ...apiKey.get({ plain: true }),
  active: apiKey.active
})

const getApiKeys = async (_req, res) => {
  try {
    const apiKeys = await db.api_keys.findAll({
      attributes: PUBLIC_ATTRIBUTES,
      include: [
        { model: db.users, as: 'createdBy', attributes: ['id', 'name'] },
        { model: db.users, as: 'revokedBy', attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'DESC']]
    })
    return res.status(200).json(apiKeys.map(serialize))
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}

// The only response that ever carries the token.
const addApiKey = async (req, res) => {
  const { name, client, expiresAt } = req.body

  if (!name || !client) return res.status(400).json({ error: 'Name and client are required' })

  try {
    const [apiKey, token] = await createApiKey({
      name,
      client,
      expiresAt: expiresAt || null,
      createdById: req.user.id
    })

    logger.info({ message: 'API key created', apiKeyId: apiKey.id, client, user: req.user.name })
    return res.status(201).json({ apiKey: serialize(apiKey), token })
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}

// Soft delete; re-revoking keeps the original timestamp.
const revokeApiKey = async (req, res) => {
  try {
    const apiKey = await db.api_keys.findByPk(req.params.id)
    if (!apiKey) return res.status(404).json({ error: 'API key not found' })

    if (!apiKey.revokedAt) {
      await apiKey.update({ revokedAt: new Date(), revokedById: req.user.id })
      logger.info({ message: 'API key revoked', apiKeyId: apiKey.id, user: req.user.name })
    }

    return res.status(200).json(serialize(apiKey))
  } catch (error) {
    return handleDatabaseError(res, error)
  }
}

module.exports = { getApiKeys, addApiKey, revokeApiKey }

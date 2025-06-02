// utils/middleware.js
const logger = require('./logger')

const requestLogger = (request, response, next) => {
  logger.info('Method:', request.method)
  logger.info('Path:  ', request.path)
  logger.info('Body:  ', request.body)
  logger.info('---')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

const tokenExtractor = (request, response, next) => {
  const authorization = request.get('authorization')
  if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
    request.token = authorization.substring(7) // Assign token to request.token
  } else {
    request.token = null // Ensure request.token is null if no token
  }
  next() // Pass control to the next middleware/route handler
}
const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  } else if (error.name === 'MongoServerError' && error.code === 11000) {
    const field = Object.keys(error.keyValue)[0]
    return response.status(400).json({ error: `expected \`${field}\` to be unique` })
  } else if (error.name === 'JsonWebTokenError') {
    return response.status(401).json({ error: 'token missing or invalid' })
  } else if (error.name === 'TokenExpiredError') {
    return response.status(401).json({
      error: 'token expired'
    })
  }

  // For other unhandled errors
  if (!response.headersSent) {
    response.status(500).json({ error: 'something went wrong internally', details: error.message });
  } else {
    next(error); // If headers sent, must delegate
  }
}

module.exports = {
  requestLogger,    // <<< EXPORT IT
  unknownEndpoint,
  tokenExtractor,  // <<< EXPORT IT
  errorHandler
}
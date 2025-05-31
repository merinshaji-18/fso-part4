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

const errorHandler = (error, request, response, next) => {
  logger.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  } else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }
  // Add other specific error handling if needed

  // For other errors, pass them to the default Express error handler
  // or send a generic 500 error.
  // For now, let's send a generic message for unhandled errors.
  // If you want Express's default handler, just call next(error) without a response.
  if (!response.headersSent) {
    response.status(500).json({ error: 'something went wrong' })
  }
  // next(error) // Use this if you want Express's default handler for unhandled errors
}

module.exports = {
  requestLogger,
  unknownEndpoint,
  errorHandler
}
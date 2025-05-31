// app.js
const config = require('./utils/config')
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const blogsRouter = require('./controllers/blogs')

logger.info('connecting to', config.MONGODB_URI)

mongoose.connect(config.MONGODB_URI)
  .then(() => {
    logger.info('connected to MongoDB')
  })
  .catch((error) => {
    logger.error('error connection to MongoDB:', error.message)
  })

app.use(express.json()) // Middleware to parse JSON bodies
app.use(middleware.requestLogger) // Request logger middleware

// Mount the blogs router
app.use('/api/blogs', blogsRouter)

// Middleware for unknown endpoints (should be after routes)
app.use(middleware.unknownEndpoint)
// Error handling middleware (should be the last middleware)
app.use(middleware.errorHandler)

module.exports = app
// app.js
const config = require('./utils/config')
const express = require('express')
require('express-async-errors') 
const app = express()
const mongoose = require('mongoose')
const logger = require('./utils/logger')
const middleware = require('./utils/middleware')
const blogsRouter = require('./controllers/blogs')
const usersRouter = require('./controllers/users') 
const loginRouter = require('./controllers/login')

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
app.use(middleware.tokenExtractor)

// Mount the blogs router
app.use('/api/blogs',middleware.userExtractor, blogsRouter)
app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
// Middleware for unknown endpoints (should be after routes)
app.use(middleware.unknownEndpoint)
// Error handling middleware (should be the last middleware)
app.use(middleware.errorHandler)

module.exports = app
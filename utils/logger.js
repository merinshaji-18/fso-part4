// utils/logger.js
const info = (...params) => {
    if (process.env.NODE_ENV !== 'test') { // Don't log during tests
      console.log(...params)
    }
  }
  
  const error = (...params) => {
    if (process.env.NODE_ENV !== 'test') { // Don't log errors during tests either if handled
      console.error(...params)
    }
  }
  
  module.exports = {
    info, error
  }
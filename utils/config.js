// utils/config.js
require('dotenv').config()

const PORT = process.env.PORT
// Select MONGODB_URI based on NODE_ENV
const MONGODB_URI = process.env.NODE_ENV === 'test'
  ? process.env.TEST_MONGODB_URI // Use a separate test DB URI
  : process.env.MONGODB_URI     // Use the regular DB URI

module.exports = {
  MONGODB_URI,
  PORT
}
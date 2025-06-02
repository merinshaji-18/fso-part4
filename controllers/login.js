// controllers/login.js
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/user') // We need the User model

loginRouter.post('/', async (request, response) => {
  const { username, password } = request.body // ES6 destructuring

  const user = await User.findOne({ username }) // Find user by username

  const passwordCorrect = user === null // Check if user exists
    ? false // If no user, password can't be correct
    : await bcrypt.compare(password, user.passwordHash) // Compare provided password with stored hash

  if (!(user && passwordCorrect)) { // If user not found OR password incorrect
    return response.status(401).json({ // 401 Unauthorized
      error: 'invalid username or password'
    })
  }

  // If username and password are correct, create a token
  const userForToken = {
    username: user.username,
    id: user._id, // Include user's MongoDB ID in the token
  }

  // Sign the token with the secret from .env
  // Token will expire in 1 hour (60*60 seconds) - good practice
  const token = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 60 * 60 } // Token expires in 1 hour
  )

  // Send back the token, username, and name
  response
    .status(200) // 200 OK
    .send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter
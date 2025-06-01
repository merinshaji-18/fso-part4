// controllers/users.js
const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

// POST - Create a new user
usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  // For 4.16: Basic password validation (do this before hashing)
  if (!password || password.length < 3) {
    return response.status(400).json({
      error: 'password must be at least 3 characters long'
    })
  }

  const saltRounds = 10 // Cost factor for hashing
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  const savedUser = await user.save()
  response.status(201).json(savedUser)
})

// GET - Get all users
usersRouter.get('/', async (request, response) => {
  // For 4.17: Populate blogs later
  const users = await User.find({}).populate('blogs', { url: 1, title: 1, author: 1, id: 1 })
  response.json(users)
})

module.exports = usersRouter
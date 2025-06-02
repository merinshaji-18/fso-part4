// controllers/users.js
const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body

  // --- Start of Validations ---
  if (!username) { // Username presence is handled by Mongoose 'required'
    return response.status(400).json({ error: 'username is required' })
  }
  if (username.length < 3) { // Username length handled by Mongoose 'minlength'
    return response.status(400).json({ error: 'username must be at least 3 characters long' })
  }

  if (!password) {
    return response.status(400).json({ error: 'password is required' })
  }
  if (password.length < 3) {
    return response.status(400).json({
      error: 'password must be at least 3 characters long'
    })
  }
  // --- End of Validations ---

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  // Mongoose 'save' will now trigger schema validations (required, minlength for username, unique for username)
  const savedUser = await user.save() // This can throw ValidationError
  response.status(201).json(savedUser)
})

usersRouter.get('/', async (request, response) => {
  const users = await User
    .find({})
    .populate('blogs', { url: 1, title: 1, author: 1, likes: 1, id: 1 }) // Populate blog details

  response.json(users)
})

module.exports = usersRouter
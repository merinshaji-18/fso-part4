// tests/user_api.test.js
const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt') // For creating users in beforeEach
const app = require('../app')
const helper = require('./test_helper') // You might need to adjust this if not used yet
const User = require('../models/user')

const api = supertest(app)

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({}) // Clear users

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', name: 'Superuser', passwordHash })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb() // Assuming usersInDb is in your test_helper

    const newUser = {
      username: 'mshaji',
      name: 'Merin Shaji',
      password: 'apassword',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('users are returned as json', async () => {
    await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)
  })

  test('all users are returned', async () => {
    const response = await api.get('/api/users')
    const usersInDb = await helper.usersInDb()
    assert.strictEqual(response.body.length, usersInDb.length)
  })

  test('a specific username is within the returned users', async () => {
    const response = await api.get('/api/users')
    const usernames = response.body.map(u => u.username)
    assert(usernames.includes('root'))
  })
})

// Close Mongoose connection after all tests in this file are run
after(async () => {
  await mongoose.connection.close()
})
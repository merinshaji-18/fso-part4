// tests/user_api.test.js
const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const bcrypt = require('bcrypt')
const app = require('../app')
const helper = require('./test_helper') // Assuming this is used or will be used. If not, can be removed.
const User = require('../models/user')
const Blog = require('../models/blog')

const api = supertest(app)

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', name: 'Superuser', passwordHash })
    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await User.find({})

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

    const usersAtEnd = await User.find({})
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
    const usersInDbCurrently = await User.find({}) // Get current count from DB
    assert.strictEqual(response.body.length, usersInDbCurrently.length)
  })

  test('a specific username is within the returned users', async () => {
    const response = await api.get('/api/users')
    const usernames = response.body.map(u => u.username)
    assert(usernames.includes('root'))
  })


  // --- VALIDATION TESTS for User Creation ---
  describe('creation of a new user (validation)', () => {
    test('fails with status 400 if username is too short (less than 3 chars)', async () => {
      const usersAtStart = await User.find({})
      const newUser = {
        username: 'mj', // Too short
        name: 'Merin J',
        password: 'validpassword'
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      // ADD THIS LINE TO DEBUG:
      console.log('ACTUAL ERROR (short username):', result.body.error);

      assert(
        result.body.error.includes('Username must be at least 3 characters long') ||
        result.body.error.includes('is shorter than the minimum allowed length (3)') ||
        result.body.error.includes('username must be at least 3 characters long') // Controller message
      )

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('fails with status 400 if username is not provided', async () => {
      const usersAtStart = await User.find({})
      const newUser = {
        // username: missing
        name: 'No Username',
        password: 'validpassword'
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      // console.log('ACTUAL ERROR (no username):', result.body.error); // Optional debug
      assert(
        result.body.error.includes('username is required') || // Controller message
        result.body.error.includes('Path `username` is required') // Mongoose message
      )

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('fails with status 400 if password is too short (less than 3 chars)', async () => {
      const usersAtStart = await User.find({})
      const newUser = {
        username: 'validuser',
        name: 'Short Password',
        password: 'pw' // Too short
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      // console.log('ACTUAL ERROR (short password):', result.body.error); // Optional debug
      assert(result.body.error.includes('password must be at least 3 characters long'))

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('fails with status 400 if password is not provided', async () => {
      const usersAtStart = await User.find({})
      const newUser = {
        username: 'nopassuser',
        name: 'No Password'
        // password: missing
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      // console.log('ACTUAL ERROR (no password):', result.body.error); // Optional debug
      assert(result.body.error.includes('password is required'))

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })

    test('fails with status 400 if username is not unique', async () => {
      const usersAtStart = await User.find({})
      const newUser = {
        username: 'root', // Already exists from beforeEach
        name: 'Another Root',
        password: 'validpassword'
      }

      const result = await api
        .post('/api/users')
        .send(newUser)
        .expect(400)
        .expect('Content-Type', /application\/json/)

      // console.log('ACTUAL ERROR (duplicate username):', result.body.error); // Optional debug
      assert(
        result.body.error.includes('expected `username` to be unique') || // mongoose-unique-validator like message
        result.body.error.includes('to be unique') || // More general unique message
        result.body.error.includes('E11000 duplicate key error') || // Raw mongo error (less ideal)
        result.body.error.includes('User validation failed: username: Error, expected `username` to be unique.') // Specific mongoose-unique-validator
      )

      const usersAtEnd = await User.find({})
      assert.strictEqual(usersAtEnd.length, usersAtStart.length)
    })
  })
})
// tests/user_api.test.js
// ... (imports and existing beforeEach for user creation)

describe('when there is initially one user and some blogs in db', () => {
  let initialUser;
  beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({}) // Clear blogs too

    const passwordHash = await bcrypt.hash('sekret', 10)
    initialUser = new User({ username: 'root', name: 'Superuser', passwordHash, blogs: [] })
    await initialUser.save()

    // Create some blogs for this user
    const blog1 = new Blog({ title: 'User Blog 1', author: 'Root Author', url: 'url1', likes: 1, user: initialUser._id })
    const blog2 = new Blog({ title: 'User Blog 2', author: 'Root Author', url: 'url2', likes: 2, user: initialUser._id })
    await blog1.save()
    await blog2.save()

    initialUser.blogs = [blog1._id, blog2._id]
    await initialUser.save()
  })

  test('all users are returned and include their blogs', async () => { // Modified test
    const response = await api
      .get('/api/users')
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.length, 1) // We created one user
    const user = response.body[0]
    assert.strictEqual(user.username, 'root')
    assert.ok(Array.isArray(user.blogs), 'User should have a blogs array')
    assert.strictEqual(user.blogs.length, 2, 'User should have 2 blogs populated')
    assert.ok(user.blogs[0].title, 'Populated blog should have a title')
    assert.ok(user.blogs[0].id, 'Populated blog should have an id')
  })
  // ... other user GET tests ...
})
// ... (user creation validation tests) ...
// --- NEW Describe block for Login API ---
describe('login API', () => {
  beforeEach(async () => {
    // Ensure a clean state and a known user for login tests
    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('testpass', 10)
    const user = new User({ username: 'testlogin', name: 'Login User', passwordHash })
    await user.save()
  })

  test('succeeds with correct credentials', async () => {
    const credentials = {
      username: 'testlogin',
      password: 'testpass',
    }

    const response = await api
      .post('/api/login')
      .send(credentials)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    assert.ok(response.body.token, 'Response should contain a token')
    assert.strictEqual(response.body.username, 'testlogin')
    assert.strictEqual(response.body.name, 'Login User') // Assuming 'Login User' is the name
  })

  test('fails with status 401 and proper message for wrong username', async () => {
    const credentials = {
      username: 'wronguser',
      password: 'testpass',
    }

    const response = await api
      .post('/api/login')
      .send(credentials)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.error, 'invalid username or password')
    assert.strictEqual(response.body.token, undefined, 'Token should not be returned on failure')
  })

  test('fails with status 401 and proper message for wrong password', async () => {
    const credentials = {
      username: 'testlogin',
      password: 'wrongpassword',
    }

    const response = await api
      .post('/api/login')
      .send(credentials)
      .expect(401)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.error, 'invalid username or password')
    assert.strictEqual(response.body.token, undefined, 'Token should not be returned on failure')
  })
})
after(async () => {
  await mongoose.connection.close()
})
// tests/blog_api.test.js
const { test, describe, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app') // Your main Express app
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app) // Wrapper for making HTTP requests

// Initialize the database before each test
beforeEach(async () => {
  await Blog.deleteMany({}) // Clear the Blogs collection
  // console.log('cleared test database')

  // Simpler way to insert initial blogs using Mongoose's insertMany
  await Blog.insertMany(helper.initialBlogs)
  // console.log('inserted initial blogs')

  // Alternative using Promise.all (more verbose but shows another way)
  // const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
  // const promiseArray = blogObjects.map(blog => blog.save())
  // await Promise.all(promiseArray)
})

describe('when there are initially some blogs saved', () => {
  test('blogs are returned as json', async () => {
    // console.log('entered test: blogs are returned as json')
    await api
      .get('/api/blogs')
      .expect(200) // Expect HTTP status 200 OK
      .expect('Content-Type', /application\/json/) // Expect Content-Type header to be application/json
  })

  test('all initial blogs are returned', async () => {
    const response = await api.get('/api/blogs')
    assert.strictEqual(response.body.length, helper.initialBlogs.length)
  })

  test('a specific blog title is within the returned blogs', async () => {
    const response = await api.get('/api/blogs')
    const titles = response.body.map(r => r.title)
    assert(titles.includes('React patterns'), 'Should contain "React patterns"')
  })
})


// Close the database connection after all tests have run
after(async () => {
  await mongoose.connection.close()
})
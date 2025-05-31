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
  await Blog.insertMany(helper.initialBlogs)
})

describe('when there are initially some blogs saved (GET operations)', () => { // Renamed slightly for clarity
  test('blogs are returned as json', async () => {
    await api
      .get('/api/blogs')
      .expect(200)
      .expect('Content-Type', /application\/json/)
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

  // Test for Exercise 4.9 (Verify 'id' property)
  test('the unique identifier property of blogs is named id', async () => {
    const response = await api.get('/api/blogs')
    const blogs = response.body

    assert(blogs.length > 0, 'Should have at least one blog to test')

    for (const blog of blogs) {
      assert.ok(Object.prototype.hasOwnProperty.call(blog, 'id'), `Blog should have an 'id' property. Blog: ${JSON.stringify(blog)}`)
      assert.strictEqual(Object.prototype.hasOwnProperty.call(blog, '_id'), false, `Blog should not have an '_id' property. Blog: ${JSON.stringify(blog)}`)
    }
  })
})

describe('addition of a new blog (POST operations)', () => { // Renamed slightly for clarity
  test('succeeds with valid data', async () => {
    const newBlog = {
      title: 'A Brand New Blog Post',
      author: 'Test Author',
      url: 'http://example.com/newblog',
      likes: 15
    }

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1)

    const titles = blogsAtEnd.map(b => b.title)
    assert(titles.includes('A Brand New Blog Post'), 'The new blog title should be in the database')
  })

  // Tests for Exercise 4.10 / 4.12 (Validating missing title/url)
  test('fails with status code 400 if title is missing', async () => {
    const newBlogWithoutTitle = {
      author: 'Anonymous',
      url: 'http://example.com/notitle',
      likes: 5
    }

    await api
      .post('/api/blogs')
      .send(newBlogWithoutTitle)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length, 'Blog count should not increase if title is missing')
  })

  test('fails with status code 400 if url is missing', async () => {
    const newBlogWithoutUrl = {
      title: 'A Blog With No URL',
      author: 'Anonymous',
      likes: 5
    }

    await api
      .post('/api/blogs')
      .send(newBlogWithoutUrl)
      .expect(400)

    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length, 'Blog count should not increase if URL is missing')
  })

  // Test for Exercise 4.11 (Default likes to 0)
  test('if likes property is missing, it defaults to 0', async () => {
    const newBlogWithoutLikes = {
      title: 'Blog With No Likes Property',
      author: 'Author Missing Likes',
      url: 'http://example.com/nolikesprop'
    }

    const response = await api
      .post('/api/blogs')
      .send(newBlogWithoutLikes)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    assert.strictEqual(response.body.likes, 0, 'Likes should default to 0 in the response')

    const blogsAtEnd = await helper.blogsInDb()
    const addedBlog = blogsAtEnd.find(blog => blog.title === 'Blog With No Likes Property')
    assert.ok(addedBlog, 'The new blog should be found in the database')
    assert.strictEqual(addedBlog.likes, 0, 'Likes should default to 0 in the database')
  })
})

// You might want to add describe blocks for DELETE, PUT operations later

after(async () => {
  await mongoose.connection.close()
})
// tests/blog_api.test.js
const { test, describe, after, beforeEach } = require('node:test') // Ensure all are imported
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app') // Your main Express app
const helper = require('./test_helper')
const Blog = require('../models/blog')

const api = supertest(app) // Wrapper for making HTTP requests

// Initialize the database before each test in this file
beforeEach(async () => {
  await Blog.deleteMany({}) // Clear the Blogs collection
  // More robust way to insert initial data, ensuring Mongoose hooks/validations run
  const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
  const promiseArray = blogObjects.map(blog => blog.save())
  await Promise.all(promiseArray)
})

describe('when there are initially some blogs saved (GET operations)', () => {
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

describe('addition of a new blog (POST operations)', () => {
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

  test('fails with status code 400 if title is missing', async () => {
    const newBlogWithoutTitle = { author: 'Anonymous', url: 'http://example.com/notitle', likes: 5 }
    await api
      .post('/api/blogs')
      .send(newBlogWithoutTitle)
      .expect(400)
    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length, 'Blog count should not increase if title is missing')
  })

  test('fails with status code 400 if url is missing', async () => {
    const newBlogWithoutUrl = { title: 'A Blog With No URL', author: 'Anonymous', likes: 5 }
    await api
      .post('/api/blogs')
      .send(newBlogWithoutUrl)
      .expect(400)
    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length, 'Blog count should not increase if URL is missing')
  })

  test('if likes property is missing, it defaults to 0', async () => {
    const newBlogWithoutLikes = { title: 'Blog With No Likes Property', author: 'Author Missing Likes', url: 'http://example.com/nolikesprop' }
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

// ************************************************
// ** NEW: Describe block for DELETE operations (Exercise 4.13) **
// ************************************************
describe('deletion of a blog (DELETE operations)', () => {
  test('succeeds with status code 204 if id is valid', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0] // Take the first blog from the initial set to delete

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .expect(204) // Expect 204 No Content for successful deletion

    const blogsAtEnd = await helper.blogsInDb()
    // Check that the number of blogs has decreased by one
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1)

    // Check that the deleted blog's title is no longer present
    const titlesAtEnd = blogsAtEnd.map(b => b.title)
    assert(!titlesAtEnd.includes(blogToDelete.title), 'Deleted blog title should not be in the list')
  })

  test('does nothing and returns 204 if id does not exist but is valid format', async () => {
    const validNonexistingId = await helper.nonExistingId() // Get a validly formatted ID that's not in DB
    const blogsAtStart = await helper.blogsInDb()

    await api
      .delete(`/api/blogs/${validNonexistingId}`)
      .expect(204) // DELETE is idempotent, so 204 is fine even if resource wasn't there

    const blogsAtEnd = await helper.blogsInDb()
    // The number of blogs should not have changed
    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length, 'Number of blogs should not change for non-existing ID')
  })

  test('fails with status code 400 if id is invalid (malformatted)', async () => {
    const invalidId = '12345thisisnotanobjectid' // Clearly not a valid MongoDB ObjectId

    await api
      .delete(`/api/blogs/${invalidId}`)
      .expect(400) // Expect 400 Bad Request (due to Mongoose CastError caught by errorHandler)

    const blogsAtStart = await helper.blogsInDb() // Check count hasn't changed
    const blogsAtEnd = await helper.blogsInDb()
    assert.strictEqual(blogsAtEnd.length, blogsAtStart.length, 'Number of blogs should not change for invalid ID')
  })
})
// ************************************************
// ** END OF NEW DELETE Describe block           **
// ************************************************


// You might want to add describe blocks for PUT operations later for Exercise 4.14

describe('updating a blog (PUT operations)', () => {
  test('succeeds with valid data (updating likes)', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0] // Take the first blog to update

    const newLikes = blogToUpdate.likes + 5
    const updateData = {
      likes: newLikes
    }

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updateData)
      .expect(200)
      .expect('Content-Type', /application\/json/)

    // Check that the returned blog has the updated likes
    assert.strictEqual(response.body.id, blogToUpdate.id)
    assert.strictEqual(response.body.likes, newLikes)

    // Verify in the database as well
    const blogAtEnd = await Blog.findById(blogToUpdate.id)
    assert.ok(blogAtEnd, 'Blog should still exist in DB')
    assert.strictEqual(blogAtEnd.likes, newLikes, 'Likes in DB should be updated')
  })

  test('fails with status 404 if id does not exist', async () => {
    const validNonexistingId = await helper.nonExistingId()
    const updateData = {
      likes: 100
    }

    await api
      .put(`/api/blogs/${validNonexistingId}`)
      .send(updateData)
      .expect(404)
  })

  test('fails with status 400 if id is invalid (malformatted)', async () => {
    const invalidId = '12345thisisnotanobjectid'
    const updateData = {
      likes: 100
    }

    await api
      .put(`/api/blogs/${invalidId}`)
      .send(updateData)
      .expect(400)
  })

  test('can update other fields if implemented in controller (e.g., title)', async () => {
    // This test assumes your PUT controller can handle updating title.
    // If it only handles 'likes', this test will fail or need adjustment.
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const updatedInfo = {
      title: 'UPDATED: ' + blogToUpdate.title,
      likes: blogToUpdate.likes + 1 // Also update likes to ensure it's a valid update
    }

    // IF YOUR CONTROLLER IS MODIFIED TO ACCEPT TITLE UPDATES:
    // const controllerModifiedToAcceptTitle = true; // Set to false if not
    // if (controllerModifiedToAcceptTitle) {
      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .send(updatedInfo)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      assert.strictEqual(response.body.title, updatedInfo.title)
      assert.strictEqual(response.body.likes, updatedInfo.likes)

      const blogInDb = await Blog.findById(blogToUpdate.id)
      assert.strictEqual(blogInDb.title, updatedInfo.title)
    // } else {
    //   console.warn('Skipping title update test as controller might not support it yet.');
    //   assert.ok(true); // Pass the test trivially if not testing this feature
    // }
  })

  // Optional: Test for validation if you add Mongoose schema validations for 'likes'
  // e.g., if 'likes' must be a non-negative number
  test('fails with status 400 if likes is not a number (if validation exists)', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToUpdate = blogsAtStart[0]

    const invalidUpdateData = {
      likes: "not a number"
    }

    // This relies on Mongoose schema validation for 'likes' being a Number
    // and your errorHandler catching the ValidationError.
    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(invalidUpdateData)
      .expect(400)
  })
})
// ************************************************
// ** END OF NEW PUT Describe block              **
// ************************************************

after(async () => {
  await mongoose.connection.close()
})
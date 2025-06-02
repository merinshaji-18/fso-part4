// tests/blog_api.test.js
const { test, describe, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const supertest = require('supertest');
const app = require('../app');
const helper = require('./test_helper');
const Blog = require('../models/blog');
const User = require('../models/user');
const bcrypt = require('bcrypt');

const api = supertest(app);

// This will be the main beforeEach for most blog API tests,
// especially those requiring authentication or a consistent starting state.
describe('Blog API (most tests run with an initial user and blogs)', () => {
  let token; // To store the token for authenticated requests
  let userId;  // To store the ID of the test user
  let initialBlogsInDb; // To store the blogs created in beforeEach

  beforeEach(async () => {
    // Clear database
    await Blog.deleteMany({});
    await User.deleteMany({});

    // Create a test user
    const passwordHash = await bcrypt.hash('testpassword', 10);
    const user = new User({ username: 'blogtestuser', name: 'Blog Test User', passwordHash });
    const savedUser = await user.save();
    userId = savedUser._id.toString();

    // Log in the user to get a token
    token = await helper.loginAndGetToken(api, 'blogtestuser', 'testpassword');

    // Create initial blogs associated with this user
    const blogsToCreate = helper.initialBlogs.map(blog => ({ ...blog, user: userId }));
    
    // Save blogs and collect their saved versions
    const savedBlogsPromises = blogsToCreate.map(blogData => {
      const blog = new Blog(blogData);
      return blog.save();
    });
    initialBlogsInDb = await Promise.all(savedBlogsPromises); // These are the Mongoose documents

    // Update user's blogs array
    savedUser.blogs = initialBlogsInDb.map(b => b._id);
    await savedUser.save();
  });

  describe('GET /api/blogs (when blogs exist)', () => {
    test('blogs are returned as json and contain user info', async () => {
      const response = await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/);

      assert(response.body.length > 0, 'Should return some blogs');
      assert.strictEqual(response.body.length, helper.initialBlogs.length, 'Should return all initial blogs');
      
      response.body.forEach(blog => {
        assert.ok(blog.id, 'Blog should have an id property');
        assert.strictEqual(blog._id, undefined, 'Blog should not have an _id property');
        assert.ok(blog.user, 'Blog should have user property');
        assert.ok(blog.user.id, 'User in blog should have an id');
        assert.strictEqual(blog.user.username, 'blogtestuser', 'User username should match test user');
      });
    });

    test('a specific blog title is within the returned blogs', async () => {
      const response = await api.get('/api/blogs');
      const titles = response.body.map(r => r.title);
      assert(titles.includes('React patterns'), 'Should contain "React patterns" if it was in initialBlogs');
    });
  });

  describe('POST /api/blogs (creation)', () => {
    test('succeeds with valid data and a valid token', async () => {
      const newBlogData = {
        title: 'Authenticated Blog Post',
        author: 'Authored Test Author',
        url: 'http://example.com/authblog',
        likes: 25
      };

      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlogData)
        .expect(201)
        .expect('Content-Type', /application\/json/);

      const blogsAfterPost = await helper.blogsInDb();
      assert.strictEqual(blogsAfterPost.length, initialBlogsInDb.length + 1);

      const createdBlog = response.body;
      assert.strictEqual(createdBlog.title, newBlogData.title);
      assert.ok(createdBlog.user, 'Saved blog should have user property');
      assert.strictEqual(createdBlog.user.id, userId, 'Blog should be associated with the logged-in user');

      const userInDb = await User.findById(userId);
      assert(userInDb.blogs.map(b => b.toString()).includes(createdBlog.id));
    });

    test('fails with status 401 Unauthorized if token is not provided', async () => {
      const newBlogData = { title: 'Blog Without Token', author: 'No Token', url: 'http://no.token', likes: 5 };
      const result = await api
        .post('/api/blogs')
        .send(newBlogData)
        .expect(401)
        .expect('Content-Type', /application\/json/);
      assert(result.body.error.includes('token missing or invalid'));
      const blogsAfterPost = await helper.blogsInDb();
      assert.strictEqual(blogsAfterPost.length, initialBlogsInDb.length);
    });

    test('fails with status 401 Unauthorized if token is invalid', async () => {
      const newBlogData = { title: 'Blog With Invalid Token', author: 'Invalid', url: 'http://invalid.token', likes: 10 };
      const invalidToken = 'Bearer 12345thisisnotavalidtoken54321';
      const result = await api
        .post('/api/blogs')
        .set('Authorization', invalidToken)
        .send(newBlogData)
        .expect(401)
        .expect('Content-Type', /application\/json/);
      assert(result.body.error.includes('token missing or invalid'));
      const blogsAfterPost = await helper.blogsInDb();
      assert.strictEqual(blogsAfterPost.length, initialBlogsInDb.length);
    });

    test('fails with status code 400 if title is missing (with valid token)', async () => {
      const newBlogData = { author: 'Anonymous', url: 'http://example.com/notitle', likes: 5 };
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlogData)
        .expect(400);
      const blogsAfterPost = await helper.blogsInDb();
      assert.strictEqual(blogsAfterPost.length, initialBlogsInDb.length);
    });
    
    test('fails with status code 400 if url is missing (with valid token)', async () => {
      const newBlogData = { title: 'A Blog With No URL', author: 'Anonymous', likes: 5 };
      await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlogData)
        .expect(400);
      const blogsAfterPost = await helper.blogsInDb();
      assert.strictEqual(blogsAfterPost.length, initialBlogsInDb.length);
    });

    test('if likes property is missing, it defaults to 0 (with valid token)', async () => {
      const newBlogData = { title: 'Blog With No Likes Prop', author: 'Test', url: 'http://example.com/nolikes' };
      const response = await api
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token}`)
        .send(newBlogData)
        .expect(201)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(response.body.likes, 0);
      const blogsAfterPost = await helper.blogsInDb();
      const addedBlog = blogsAfterPost.find(b => b.title === newBlogData.title);
      assert.ok(addedBlog);
      assert.strictEqual(addedBlog.likes, 0);
    });
  });

  describe('DELETE /api/blogs/:id', () => {
    test('succeeds with status code 204 if id is valid and blog belongs to user (or no auth check yet)', async () => {
      // Note: For 4.21, this test will need to ensure the token matches the blog's user.
      // For now, we assume any valid token can delete, or the DELETE route is not yet protected by user ownership.
      const blogToDelete = initialBlogsInDb[0];
      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`) // Add token if DELETE is protected
        .expect(204);
      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, initialBlogsInDb.length - 1);
      const titles = blogsAtEnd.map(b => b.title);
      assert(!titles.includes(blogToDelete.title));
    });

 test('delete fails with 401 if no token is provided (if DELETE is protected)', async () => {
    const blogToDelete = initialBlogsInDb[0];
    await api
    .delete(`/api/blogs/${blogToDelete.id}`)
    .expect(401); 
});

    test('delete fails with 400 if id is invalid (malformatted)', async () => {
      const invalidId = '12345thisisnotanobjectid';
      await api
        .delete(`/api/blogs/${invalidId}`)
        .set('Authorization', `Bearer ${token}`) // Add token if DELETE is protected
        .expect(400);
    });
  });

  describe('PUT /api/blogs/:id (updating)', () => {
    test('succeeds updating likes with valid data and token', async () => {
      const blogToUpdate = initialBlogsInDb[0];
      const newLikes = blogToUpdate.likes + 5;
      const updateData = { likes: newLikes };

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`) // Add token if PUT is protected
        .send(updateData)
        .expect(200)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(response.body.likes, newLikes);
      const blogInDb = await Blog.findById(blogToUpdate.id);
      assert.strictEqual(blogInDb.likes, newLikes);
    });
    // ... Add more PUT tests: 404 for non-existing ID, 400 for invalid ID,
    // ... 401 if no token (if PUT is protected),
    // ... updating other fields (if controller supports it).
  });
describe('DELETE /api/blogs/:id', () => {
    test('succeeds with status code 204 if id is valid and blog is deleted by its creator', async () => {
      // initialBlogsInDb is an array of Mongoose documents from beforeEach, created by 'userId'
      const blogToDelete = initialBlogsInDb[0]; // This blog was created by 'userId' / 'blogtestuser'

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`) // Use the token of the creator
        .expect(204);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, initialBlogsInDb.length - 1);

      const deletedBlogInDb = await Blog.findById(blogToDelete.id);
      assert.strictEqual(deletedBlogInDb, null, 'Blog should be null in DB after deletion');

      // Verify it's removed from the user's blogs array
      const user = await User.findById(userId);
      assert(!user.blogs.map(b => b.toString()).includes(blogToDelete.id.toString()), "Deleted blog's ID should be removed from user's blogs array");
    });

    // THIS TEST IS NOW UNCOMMENTED AND SHOULD PASS
    test('delete fails with 401 if no token is provided', async () => {
        const blogToDelete = initialBlogsInDb[0];
        await api
          .delete(`/api/blogs/${blogToDelete.id}`)
          // No Authorization header
          .expect(401);

        const blogsAtEnd = await helper.blogsInDb();
        assert.strictEqual(blogsAtEnd.length, initialBlogsInDb.length, 'Blog count should not change if delete fails due to no token');
    });

    test('delete fails with 401 if token is invalid', async () => {
        const blogToDelete = initialBlogsInDb[0];
        const invalidToken = 'Bearer 123thisisnotvalid';
        await api
          .delete(`/api/blogs/${blogToDelete.id}`)
          .set('Authorization', invalidToken)
          .expect(401); // Expecting 'token missing or invalid' from errorHandler

        const blogsAtEnd = await helper.blogsInDb();
        assert.strictEqual(blogsAtEnd.length, initialBlogsInDb.length);
    });

    test('delete fails with 401 if a different authenticated user tries to delete a blog', async () => {
      // Create a second user and their token
      const otherPasswordHash = await bcrypt.hash('otherpass', 10);
      const otherUser = new User({ username: 'otheruser', name: 'Other User', passwordHash: otherPasswordHash });
      await otherUser.save();
      const otherToken = await helper.loginAndGetToken(api, 'otheruser', 'otherpass');

      const blogToDelete = initialBlogsInDb[0]; // This blog belongs to 'blogtestuser' (userId)

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${otherToken}`) // Use other user's token
        .expect(401); // Or 403 if you prefer to distinguish "not authorized" from "not authenticated"

      // Ensure blog was not deleted
      const blogStillExists = await Blog.findById(blogToDelete.id);
      assert.ok(blogStillExists, 'Blog should still exist as it was not deleted by its creator');
      assert.strictEqual(blogStillExists.id, blogToDelete.id.toString());
    });

    test('delete returns 404 if blog id does not exist (with valid token)', async () => {
      const validNonexistingId = await helper.nonExistingId();
      await api
        .delete(`/api/blogs/${validNonexistingId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404); // Controller now explicitly returns 404
    });

    test('delete fails with 400 if id is invalid (malformatted)', async () => {
      const invalidId = '12345thisisnotanobjectid';
      await api
        .delete(`/api/blogs/${invalidId}`)
        .set('Authorization', `Bearer ${token}`) // Needs a token to pass initial checks if any
        .expect(400);
    });
  });

}); // End of main describe block for Blog API


after(async () => {
  await mongoose.connection.close();
});
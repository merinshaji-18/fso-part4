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
    
    const savedBlogsPromises = blogsToCreate.map(blogData => {
      const blog = new Blog(blogData);
      return blog.save();
    });
    initialBlogsInDb = await Promise.all(savedBlogsPromises);

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
      // Assuming 'React patterns' is one of the titles in helper.initialBlogs
      const expectedTitle = helper.initialBlogs.find(b => b.title === 'React patterns') ? 'React patterns' : helper.initialBlogs[0]?.title;
      if (expectedTitle) {
        assert(titles.includes(expectedTitle), `Should contain "${expectedTitle}" if it was in initialBlogs`);
      } else {
        assert.ok(true, "Skipping title check as initialBlogs might be empty or not contain 'React patterns'");
      }
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
    test('succeeds with status code 204 if id is valid and blog is deleted by its creator', async () => {
      const blogToDelete = initialBlogsInDb[0]; 
      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${token}`) 
        .expect(204);

      const blogsAtEnd = await helper.blogsInDb();
      assert.strictEqual(blogsAtEnd.length, initialBlogsInDb.length - 1);

      const deletedBlogInDb = await Blog.findById(blogToDelete.id);
      assert.strictEqual(deletedBlogInDb, null, 'Blog should be null in DB after deletion');

      const user = await User.findById(userId);
      assert(!user.blogs.map(b => b.toString()).includes(blogToDelete.id.toString()), "Deleted blog's ID should be removed from user's blogs array");
    });

    test('delete fails with 401 if no token is provided', async () => {
        const blogToDelete = initialBlogsInDb[0];
        await api
          .delete(`/api/blogs/${blogToDelete.id}`)
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
          .expect(401); 

        const blogsAtEnd = await helper.blogsInDb();
        assert.strictEqual(blogsAtEnd.length, initialBlogsInDb.length);
    });

    test('delete fails with 401 if a different authenticated user tries to delete a blog', async () => {
      const otherPasswordHash = await bcrypt.hash('otherpass', 10);
      const otherUser = new User({ username: 'otheruser', name: 'Other User', passwordHash: otherPasswordHash });
      await otherUser.save();
      const otherToken = await helper.loginAndGetToken(api, 'otheruser', 'otherpass');

      const blogToDelete = initialBlogsInDb[0]; 

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .set('Authorization', `Bearer ${otherToken}`) 
        .expect(401); 

      const blogStillExists = await Blog.findById(blogToDelete.id);
      assert.ok(blogStillExists, 'Blog should still exist as it was not deleted by its creator');
    });

    test('delete returns 404 if blog id does not exist (with valid token)', async () => {
      const validNonexistingId = await helper.nonExistingId();
      await api
        .delete(`/api/blogs/${validNonexistingId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    test('delete fails with 400 if id is invalid (malformatted)', async () => {
      const invalidId = '12345thisisnotanobjectid';
      await api
        .delete(`/api/blogs/${invalidId}`)
        .set('Authorization', `Bearer ${token}`) 
        .expect(400);
    });
  });

  describe('PUT /api/blogs/:id (updating)', () => {
    test('succeeds updating likes with valid data and token', async () => {
      // For PUT to be protected by token, userExtractor must be applied to PUT routes
      // and the controller must check for request.user.
      // For now, assuming PUT might not be fully protected by user ownership yet.
      const blogToUpdate = initialBlogsInDb[0];
      const newLikes = blogToUpdate.likes + 5;
      const updateData = { likes: newLikes };

      const response = await api
        .put(`/api/blogs/${blogToUpdate.id}`)
        .set('Authorization', `Bearer ${token}`) // Sending token, assuming PUT will require it
        .send(updateData)
        .expect(200)
        .expect('Content-Type', /application\/json/);
      assert.strictEqual(response.body.likes, newLikes);
      const blogInDb = await Blog.findById(blogToUpdate.id);
      assert.strictEqual(blogInDb.likes, newLikes);
    });
    // TODO: Add more PUT tests:
    // - 404 for non-existing ID (with token)
    // - 400 for invalid ID (with token)
    // - 401 if no token is provided (if PUT route is protected)
    // - 401 if token is invalid (if PUT route is protected)
    // - (Optional) Updating other fields and testing ownership if PUT allows more and is user-restricted
  });

}); // End of main describe block for Blog API

after(async () => {
  await mongoose.connection.close();
});
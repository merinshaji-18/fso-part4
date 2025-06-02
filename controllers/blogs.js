// controllers/blogs.js
const blogsRouter = require('express').Router();
// jwt is NOT directly needed here anymore if userExtractor and global errorHandler handle JWT errors
const Blog = require('../models/blog');
const User = require('../models/user');

// GET all blogs
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1, id: 1 });
  response.json(blogs);
});

// POST a new blog
blogsRouter.post('/', async (request, response, next) => { // userExtractor runs before this
  const body = request.body;
  const user = request.user;

  // console.log('CONTROLLER POST /api/blogs - body:', body); // Keep for debugging if needed
  // console.log('CONTROLLER POST /api/blogs - request.user from userExtractor:', user ? user.username : 'No user');

  if (!user) {
    // This is hit if userExtractor couldn't set a user (no token, bad token which global handler didn't catch first, or valid token but user not in DB)
    // The global errorHandler should ideally catch JsonWebTokenError for bad tokens and send { error: 'token missing or invalid' }
    // This controller message is for the case where request.user is null for other reasons.
    // To make the tests pass with the current error messages, let's align it.
    // A more nuanced approach would be for errorHandler to always send the 'token missing or invalid' for JWT issues.
    console.error('CONTROLLER POST /api/blogs - ERROR: No authenticated user found.');
    return response.status(401).json({ error: 'token missing or invalid' }); // ALIGNED MESSAGE
  }

  if (!body.title || !body.url) {
    console.error('CONTROLLER POST /api/blogs - ERROR: title or url missing');
    return response.status(400).json({ error: 'title or url missing' });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined ? 0 : body.likes,
    user: user._id
  });
  // console.log('CONTROLLER POST /api/blogs - Blog object BEFORE save:', JSON.stringify(blog.toObject(), null, 2));

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  
  const populatedBlog = await Blog.findById(savedBlog._id).populate('user', { username: 1, name: 1, id: 1 });
  response.status(201).json(populatedBlog);
});

// DELETE a blog
blogsRouter.delete('/:id', async (request, response, next) => { // userExtractor runs before this
  const user = request.user;
  const blogIdToDelete = request.params.id;

  // console.log('CONTROLLER DELETE /api/blogs/:id - request.user from userExtractor:', user ? user.username : 'No user');

  if (!user) {
    console.error('CONTROLLER DELETE /api/blogs/:id - ERROR: No authenticated user.');
    return response.status(401).json({ error: 'token missing or invalid' }); // ALIGNED MESSAGE
  }

  const blog = await Blog.findById(blogIdToDelete);

  if (!blog) {
    return response.status(404).json({ error: 'blog not found' });
  }

  if (blog.user.toString() !== user._id.toString()) {
    return response.status(401).json({ error: 'only the creator can delete a blog' });
  }

  await Blog.findByIdAndDelete(blogIdToDelete);
  // Only attempt to modify user if the user object is valid
  if (user && user.blogs) {
      user.blogs = user.blogs.filter(b => b.toString() !== blogIdToDelete.toString());
      await user.save();
  }
  response.status(204).end();
});

// PUT (update) a blog
blogsRouter.put('/:id', async (request, response, next) => { // Added next, assuming userExtractor might be used later
  const user = request.user; // For future protection, not strictly used in this version yet
  const body = request.body;
  const blogToUpdate = {};

  // For now, let's assume PUT also requires authentication like POST and DELETE
  // This check would be needed if userExtractor is applied to PUT routes.
  // If PUT is public for now, this check can be omitted or adjusted.
  if (!user && (body.likes !== undefined || body.title !== undefined)) { // Example: if any update requires auth
     console.error('CONTROLLER PUT /api/blogs - ERROR: No authenticated user.');
     return response.status(401).json({ error: 'token missing or invalid' });
  }


  if (body.title !== undefined) blogToUpdate.title = body.title;
  if (body.author !== undefined) blogToUpdate.author = body.author;
  if (body.url !== undefined) blogToUpdate.url = body.url;
  if (body.likes !== undefined) blogToUpdate.likes = body.likes;

  if (Object.keys(blogToUpdate).length === 0 && !request.body.hasOwnProperty('likes')) { // Ensure likes can be set to 0
    return response.status(400).json({ error: 'no update data provided' });
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    blogToUpdate,
    { new: true, runValidators: true, context: 'query' }
  );

  if (updatedBlog) {
    const populatedBlog = await Blog.findById(updatedBlog._id).populate('user', { username: 1, name: 1, id: 1 });
    response.json(populatedBlog);
  } else {
    response.status(404).end();
  }
});

module.exports = blogsRouter; // Only ONE module.exports at the VERY END
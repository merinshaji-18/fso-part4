// controllers/blogs.js
const blogsRouter = require('express').Router();
const jwt = require('jsonwebtoken');
const Blog = require('../models/blog');
const User = require('../models/user'); // Make sure this is required

// GET all blogs - already populating user
blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({})
    .populate('user', { username: 1, name: 1, id: 1 });
  response.json(blogs);
});

// POST a new blog - uses request.token from middleware
blogsRouter.post('/', async (request, response, next) => { // Added 'next' for explicit error handling
  const body = request.body;
  const token = request.token; // Provided by tokenExtractor middleware

  console.log('POST /api/blogs - body:', body);
  console.log('POST /api/blogs - request.token from middleware:', token);
  console.log('POST /api/blogs - process.env.SECRET:', process.env.SECRET);

  let decodedToken;
  try {
    // If token is null (no auth header or malformed) or invalid, jwt.verify will throw an error
    decodedToken = jwt.verify(token, process.env.SECRET);
    console.log('POST /api/blogs - decodedToken (after try-verify):', decodedToken);
  } catch (error) {
    console.error('POST /api/blogs - ERROR during jwt.verify:', error.name, error.message);
    return next(error); // Pass error to global error handler (which should send 401)
  }

  // This check is a good safeguard, though jwt.verify should throw if token is bad or ID is missing
  if (!decodedToken || !decodedToken.id) {
    console.error('POST /api/blogs - ERROR: Decoded token invalid or missing ID (should have been caught by verify)');
    return response.status(401).json({ error: 'token missing or invalid (controller check)' });
  }

  const user = await User.findById(decodedToken.id);
  console.log('POST /api/blogs - user from token:', user ? user.username : 'USER NOT FOUND');

  if (!user) {
    console.error('POST /api/blogs - ERROR: User from token not found in DB');
    // This case implies a valid token for a user that no longer exists.
    return response.status(401).json({ error: 'user for token not found' });
  }

  if (!body.title || !body.url) {
    console.error('POST /api/blogs - ERROR: title or url missing');
    return response.status(400).json({ error: 'title or url missing' });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined ? 0 : body.likes,
    user: user._id // Associate blog with the user from the token
  });
  console.log('POST /api/blogs - Blog object BEFORE save:', JSON.stringify(blog.toObject(), null, 2));

  const savedBlog = await blog.save(); // Mongoose validations run here
  console.log('POST /api/blogs - blog saved:', savedBlog.id);

  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();
  console.log('POST /api/blogs - user updated with new blog');

  const populatedBlog = await Blog.findById(savedBlog._id).populate('user', { username: 1, name: 1, id: 1 });
  console.log('POST /api/blogs - responding with populated blog');
  response.status(201).json(populatedBlog);
});

// MODIFIED DELETE ROUTE
blogsRouter.delete('/:id', async (request, response, next) => { // Added next
  const token = request.token; // From tokenExtractor middleware
  console.log('DELETE /api/blogs/:id - request.token from middleware:', token);
  console.log('DELETE /api/blogs/:id - process.env.SECRET:', process.env.SECRET);

  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.SECRET);
    console.log('DELETE /api/blogs/:id - decodedToken (after try-verify):', decodedToken);
  } catch (error) {
    console.error('DELETE /api/blogs/:id - ERROR during jwt.verify:', error.name, error.message);
    return next(error); // Pass to global error handler -> 401
  }

  if (!decodedToken || !decodedToken.id) {
    console.error('DELETE /api/blogs/:id - ERROR: Decoded token invalid or missing ID');
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const blogIdToDelete = request.params.id;
  const blog = await Blog.findById(blogIdToDelete);

  if (!blog) {
    // If blog doesn't exist, it's effectively "deleted" from the perspective of this user,
    // or you might prefer to return 404. A 204 is also acceptable as the state is achieved.
    // For consistency with trying to delete something that's not there, let's go with 204 or 404.
    // Let's be explicit with 404 if it was never there.
    console.log(`DELETE /api/blogs/:id - Blog with id ${blogIdToDelete} not found.`);
    return response.status(404).json({ error: 'blog not found' });
  }

  // Check if the blog's user matches the token's user ID
  // blog.user stores the ObjectId of the user.
  if (blog.user.toString() !== decodedToken.id.toString()) {
    console.error('DELETE /api/blogs/:id - ERROR: User not authorized to delete this blog.');
    return response.status(401).json({ error: 'only the creator can delete a blog' });
    // Alternatively, 403 Forbidden could be used if user is authenticated but not authorized.
  }

  // If all checks pass, proceed with deletion
  await Blog.findByIdAndDelete(blogIdToDelete);

  // Also remove the blog from the user's list of blogs (optional but good for data consistency)
  const user = await User.findById(decodedToken.id);
  if (user) {
    user.blogs = user.blogs.filter(b => b.toString() !== blogIdToDelete.toString());
    await user.save();
    console.log(`DELETE /api/blogs/:id - Removed blog ${blogIdToDelete} from user ${user.username}'s list.`);
  }

  console.log(`DELETE /api/blogs/:id - Blog ${blogIdToDelete} deleted successfully.`);
  response.status(204).end();
});


// PUT (update) a blog
blogsRouter.put('/:id', async (request, response) => {
  const body = request.body;
  const blogToUpdate = {};

  if (body.title !== undefined) blogToUpdate.title = body.title;
  if (body.author !== undefined) blogToUpdate.author = body.author;
  if (body.url !== undefined) blogToUpdate.url = body.url;
  if (body.likes !== undefined) blogToUpdate.likes = body.likes;

  // Token protection will be added if needed for updates later
  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    blogToUpdate,
    { new: true, runValidators: true, context: 'query' }
  );

  if (updatedBlog) {
    response.json(updatedBlog);
  } else {
    response.status(404).end();
  }
});

module.exports = blogsRouter;
// controllers/blogs.js
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
// const User = require('../models/user') // For later when adding user association
// const jwt = require('jsonwebtoken') // For later when adding auth

// ... (GET and POST routes remain) ...
blogsRouter.get('/', async (request, response) => { // Make existing routes async/await
  const blogs = await Blog.find({})//.populate('user', { username: 1, name: 1 }) // Populate later
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => { // Make existing routes async/await
  const body = request.body

  // For now, let's assume a fixed user until auth is implemented
  // const decodedToken = jwt.verify(request.token, process.env.SECRET)
  // if (!request.token || !decodedToken.id) {
  //   return response.status(401).json({ error: 'token missing or invalid' })
  // }
  // const user = await User.findById(decodedToken.id)
  // For now, no user association:
  // const user = await User.findOne() // TEMP: get first user for now, replace with auth

  if (!body.title || !body.url) {
    return response.status(400).json({
      error: 'title or url missing'
    })
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined ? 0 : body.likes,
    // user: user._id // Associate with user later
  })

  const savedBlog = await blog.save()
  // user.blogs = user.blogs.concat(savedBlog._id) // Add to user's blogs later
  // await user.save() // Save user later

  response.status(201).json(savedBlog)
})


// NEW DELETE ROUTE
blogsRouter.delete('/:id', async (request, response) => {
  // Later, add logic to ensure only the creator can delete
  // const blog = await Blog.findById(request.params.id)
  // const decodedToken = jwt.verify(request.token, process.env.SECRET)
  // if (!request.token || !decodedToken.id) {
  //   return response.status(401).json({ error: 'token missing or invalid' })
  // }
  // if (blog.user.toString() !== decodedToken.id.toString()) {
  //   return response.status(401).json({ error: 'only the creator can delete a blog' })
  // }

  await Blog.findByIdAndDelete(request.params.id)
  response.status(204).end()
})

// controllers/blogs.js
blogsRouter.put('/:id', async (request, response) => {
  const body = request.body;

  // Create an update object, only including fields that are present in the body
  const blogToUpdate = {};
  if (body.title !== undefined) {
    blogToUpdate.title = body.title;
  }
  if (body.author !== undefined) { // If you want to allow author updates
    blogToUpdate.author = body.author;
  }
  if (body.url !== undefined) { // If you want to allow URL updates
    blogToUpdate.url = body.url;
  }
  if (body.likes !== undefined) {
    blogToUpdate.likes = body.likes;
  }

  // Check if there's anything to update
  if (Object.keys(blogToUpdate).length === 0) {
    // If body was empty or contained no fields we handle,
    // you could return 400 or just return the existing blog.
    // For now, let's assume an update always intends to change something.
    // If not, Mongoose findByIdAndUpdate with an empty update object
    // will just return the original document if {new: true} is set.
  }

  const updatedBlog = await Blog.findByIdAndUpdate(
    request.params.id,
    blogToUpdate, // Use the more comprehensive update object
    { new: true, runValidators: true, context: 'query' }
  );

  if (updatedBlog) {
    response.json(updatedBlog);
  } else {
    response.status(404).end();
  }
});
module.exports = blogsRouter
// controllers/blogs.js
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', (request, response, next) => {
  Blog.find({})
    .then(blogs => {
      response.json(blogs)
    })
    .catch(error => next(error)) // Pass errors to the error handler middleware
})

blogsRouter.post('/', (request, response, next) => {
  const body = request.body

  // Basic validation: check if title or url is missing
  if (!body.title || !body.url) {
    return response.status(400).json({
      error: 'title or url missing'
    })
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes === undefined ? 0 : body.likes // Ensure likes defaults to 0 if not provided
  })

  blog.save()
    .then(savedBlog => {
      response.status(201).json(savedBlog)
    })
    .catch(error => next(error)) // Pass errors to the error handler middleware
})

module.exports = blogsRouter
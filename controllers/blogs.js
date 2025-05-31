// controllers/blogs.js
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({})
  response.json(blogs)
})

blogsRouter.post('/', async (request, response) => {
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
    likes: body.likes // Ensure likes defaults to 0 if not provided
  })

  const savedBlog = await blog.save()
  response.status(201).json(savedBlog) // Ensure status 201
})

module.exports = blogsRouter
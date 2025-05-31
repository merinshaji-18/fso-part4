// index.js
require('dotenv').config() // Load environment variables from .env file
const express = require('express')
const mongoose = require('mongoose')

const app = express()

const blogSchema = mongoose.Schema({
  title: String,
  author: String,
  url: String,
  likes: Number,
})

const Blog = mongoose.model('Blog', blogSchema)

const mongoUrl = process.env.MONGODB_URI
console.log('connecting to', mongoUrl)

mongoose.connect(mongoUrl)
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.error('error connection to MongoDB:', error.message)
  })

app.use(express.json()) // Middleware to parse JSON bodies

app.get('/api/blogs', (request, response) => {
  Blog.find({}).then((blogs) => {
    response.json(blogs)
  })
})

app.post('/api/blogs', (request, response) => {
  const blog = new Blog(request.body)

  blog.save().then((result) => {
    response.status(201).json(result)
  })
  .catch(error => { // Basic error handling for save
    console.error('Error saving blog:', error.message)
    response.status(400).json({ error: error.message })
  })
})

const PORT = process.env.PORT || 3003 // Use port from .env or default to 3003
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
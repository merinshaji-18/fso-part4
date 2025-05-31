// tests/test_helper.js
const Blog = require('../models/blog') // Assuming your Blog model is in models/blog.js

const initialBlogs = [
  {
    title: 'React patterns',
    author: 'Michael Chan',
    url: 'https://reactpatterns.com/',
    likes: 7
  },
  {
    title: 'Go To Statement Considered Harmful',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
    likes: 5
  },
  {
    title: 'Canonical string reduction',
    author: 'Edsger W. Dijkstra',
    url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
    likes: 12
  }
]

// Function to get a non-existing ID (useful for testing 404s)
const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon', url: 'someurl' })
  await blog.save()
  await Blog.findByIdAndDelete(blog._id) // Use Blog model to delete

  return blog._id.toString()
}

// Function to get all blogs currently in the test database
const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON()) // Use toJSON to get the transformed object (with 'id')
}

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb
}
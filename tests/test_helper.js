// tests/test_helper.js
const Blog = require('../models/blog')
const User = require('../models/user') // We'll need this later, add it now

const initialBlogs = [
  {
    title: "React patterns",
    author: "Michael Chan",
    url: "https://reactpatterns.com/",
    likes: 7
  },
  {
    title: "Go To Statement Considered Harmful",
    author: "Edsger W. Dijkstra",
    url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html",
    likes: 5
  },
  {
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12
  }
]

// Function to get a non-existing ID (valid format, but not in DB)
const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon', url: 'someurl' })
  await blog.save()
  await blog.deleteOne() // Use deleteOne() instead of remove()
  return blog._id.toString()
}

// Function to get all blogs currently in the database
const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON()) // Use toJSON to get the transformed object
}

// Function to get all users in the database (for later exercises)
const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}
const loginAndGetToken = async (api, username, password) => {
  const response = await api
    .post('/api/login')
    .send({ username, password })
  return response.body.token
}
module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  loginAndGetToken,
  usersInDb
}
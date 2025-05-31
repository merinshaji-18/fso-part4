// models/blog.js
const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Added required for title and url
  author: String,
  url: { type: String, required: true },
  likes: { type: Number, default: 0 } // Added default for likes
})

// Transform _id to id and remove __v
blogSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('Blog', blogSchema)
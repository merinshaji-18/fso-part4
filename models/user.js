// models/user.js
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator') // Require it

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'], // Custom message
    unique: true, // Mongoose-unique-validator will use this
    minlength: [3, 'Username must be at least 3 characters long'] // Custom message
  },
  name: String,
  passwordHash: {
    type: String,
    required: true // Password hash is always required internally
  },
  blogs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog'
    }
  ],
})

// Apply the uniqueValidator plugin to userSchema
userSchema.plugin(uniqueValidator, { message: 'Error, expected {PATH} to be unique.' }) // Custom message for unique

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
// models/user.js
const mongoose = require('mongoose')
// const uniqueValidator = require('mongoose-unique-validator') // For 4.16

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensures usernames are unique at the database level
    minlength: 3   // For 4.16
  },
  name: String,
  passwordHash: { // Store the hashed password
    type: String,
    required: true
  },
  blogs: [ // Array of blog ids created by this user
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog'
    }
  ],
})

// Apply the uniqueValidator plugin to userSchema for 4.16
// userSchema.plugin(uniqueValidator)

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // The passwordHash should not be revealed
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
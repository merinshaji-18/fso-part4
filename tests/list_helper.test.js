// tests/list_helper.test.js
const { test, describe } = require('node:test') // Import test and describe
const assert = require('node:assert')           // Import assert for making assertions
const listHelper = require('../utils/list_helper') // Import the module we want to test

// Test case for the dummy function
test('dummy returns one', () => {
  const blogs = [] // Create an empty array as an argument for dummy, though it's not used by dummy

  const result = listHelper.dummy(blogs) // Call the dummy function
  assert.strictEqual(result, 1)        // Assert that the result is strictly equal to 1
})
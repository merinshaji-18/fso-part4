// utils/list_helper.js
const dummy = (blogs) => {
    return 1
  }
  
  const totalLikes = (blogs) => {
    // If the blogs array is empty, reduce on an empty array with no initial value would error.
    // So, we handle it by ensuring an initial value of 0 for the sum.
    const reducer = (sum, item) => {
      return sum + item.likes
    }
  
    return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0)
  }
  
  module.exports = {
    dummy,
    totalLikes // Add totalLikes here
  }
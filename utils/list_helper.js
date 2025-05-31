// utils/list_helper.js
const dummy = (blogs) => {
    return 1
  }
  
  const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
      return sum + item.likes
    }
    return blogs.length === 0 ? 0 : blogs.reduce(reducer, 0)
  }
  
  const favoriteBlog = (blogs) => {
    // Handle empty list case
    if (!blogs || blogs.length === 0) {
      return null // Or undefined, or you could throw an error
    }
  
    // Use reduce to find the blog with the most likes
    // The initial value for the accumulator 'mostLiked' is the first blog in the array.
    const mostLiked = blogs.reduce((currentFavorite, blogItem) => {
      return blogItem.likes > currentFavorite.likes ? blogItem : currentFavorite
    }, blogs[0]) // Initialize with the first blog
  
    return mostLiked
  }
  
  module.exports = {
    dummy,
    totalLikes,
    favoriteBlog // Add favoriteBlog here
  }
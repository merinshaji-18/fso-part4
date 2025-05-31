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
  const mostBlogs = (blogs) => {
    // Handle empty list
    if (!blogs || blogs.length === 0) {
      return null
    }
  
    // 1. Count blogs per author
    const authorCounts = {} // An object to store counts like { 'Author Name': count }
    blogs.forEach(blog => {
      if (blog.author) { // Ensure author exists
        authorCounts[blog.author] = (authorCounts[blog.author] || 0) + 1
      }
    })
    // At this point, authorCounts might be:
    // { 'Michael Chan': 1, 'Edsger W. Dijkstra': 2, 'Robert C. Martin': 3 }
  
    // If no authors were found (e.g., all blogs missing author field)
    if (Object.keys(authorCounts).length === 0) {
      return null;
    }
  
    // 2. Find the author with the highest count
    let topAuthor = ''
    let maxBlogs = 0
  
    for (const author in authorCounts) {
      if (authorCounts[author] > maxBlogs) {
        maxBlogs = authorCounts[author]
        topAuthor = author
      }
    }
  
    return {
      author: topAuthor,
      blogs: maxBlogs
    }
  }
  
  module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs // Add mostBlogs here
  }
 
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

const mostLikes = (blogs) => {
    // Handle empty list
    if (!blogs || blogs.length === 0) {
      return null
    }
  
    // 1. Calculate total likes per author
    const likesByAuthor = {} // Object to store total likes: { 'Author Name': totalLikes }
    blogs.forEach(blog => {
      if (blog.author) { // Ensure author exists
        likesByAuthor[blog.author] = (likesByAuthor[blog.author] || 0) + (blog.likes || 0)
      }
    })
    // At this point, likesByAuthor might be:
    // { 'Michael Chan': 7, 'Edsger W. Dijkstra': 17, 'Robert C. Martin': 12 }
  
    // If no authors were found (or no blogs with likes)
    if (Object.keys(likesByAuthor).length === 0) {
        return null;
    }
  
    // 2. Find the author with the highest total likes
    let topAuthor = ''
    // Initialize maxLikes to a value lower than any possible like count (e.g., -1)
    // to correctly handle authors with 0 total likes if they are the "max" among others with negative or no likes.
    // However, since likes are non-negative, 0 is fine if we assume at least one author or return null for no authors.
    let maxLikes = -1
  
    for (const author in likesByAuthor) {
      if (likesByAuthor[author] > maxLikes) {
        maxLikes = likesByAuthor[author]
        topAuthor = author
      }
    }
  
    // If maxLikes remained -1 (meaning no authors or no likes at all), return null
    // This check is a bit redundant if Object.keys(likesByAuthor).length === 0 handles it,
    // but can be a safeguard.
    if (topAuthor === '') {
        return null;
    }
  
    return {
      author: topAuthor,
      likes: maxLikes
    }
  }
  
  module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes // Add mostLikes here
  }
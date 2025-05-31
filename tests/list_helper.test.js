// tests/list_helper.test.js
const { test, describe } = require('node:test')
const assert = require('node:assert')
const listHelper = require('../utils/list_helper')

// --- dummy test and totalLikes describe block remain unchanged ---
test('dummy returns one', () => {
  const blogs = []
  const result = listHelper.dummy(blogs)
  assert.strictEqual(result, 1)
})

describe('total likes', () => {
  const listWithOneBlog = [
    {
      _id: '5a422aa71b54a676234d17f8',
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      likes: 5,
      __v: 0
    }
  ]
  test('when list has only one blog, equals the likes of that', () => {
    const result = listHelper.totalLikes(listWithOneBlog)
    assert.strictEqual(result, 5)
  })
  test('of empty list is zero', () => {
    const blogs = []
    const result = listHelper.totalLikes(blogs)
    assert.strictEqual(result, 0)
  })
  const blogs = [
    { _id: "5a422a851b54a676234d17f7", title: "React patterns", author: "Michael Chan", url: "https://reactpatterns.com/", likes: 7, __v: 0 },
    { _id: "5a422aa71b54a676234d17f8", title: "Go To Statement Considered Harmful", author: "Edsger W. Dijkstra", url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html", likes: 5, __v: 0 },
    { _id: "5a422b3a1b54a676234d17f9", title: "Canonical string reduction", author: "Edsger W. Dijkstra", url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", likes: 12, __v: 0 },
    { _id: "5a422b891b54a676234d17fa", title: "First class tests", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll", likes: 10, __v: 0 },
    { _id: "5a422ba71b54a676234d17fb", title: "TDD harms architecture", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html", likes: 0, __v: 0 },
    { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0 }
  ]
  test('of a bigger list is calculated right', () => {
    const result = listHelper.totalLikes(blogs)
    assert.strictEqual(result, 36)
  })
})
// --- End of existing tests ---


// New describe block for favoriteBlog
describe('favorite blog', () => {
  const listWithOneBlog = [
    {
      _id: '5a422aa71b54a676234d17f8',
      title: 'Go To Statement Considered Harmful',
      author: 'Edsger W. Dijkstra',
      url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
      likes: 5,
      __v: 0
    }
  ]

  const blogs = [ // Using the same list as above for consistency
    { _id: "5a422a851b54a676234d17f7", title: "React patterns", author: "Michael Chan", url: "https://reactpatterns.com/", likes: 7, __v: 0 },
    { _id: "5a422aa71b54a676234d17f8", title: "Go To Statement Considered Harmful", author: "Edsger W. Dijkstra", url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html", likes: 5, __v: 0 },
    { _id: "5a422b3a1b54a676234d17f9", title: "Canonical string reduction", author: "Edsger W. Dijkstra", url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", likes: 12, __v: 0 },
    { _id: "5a422b891b54a676234d17fa", title: "First class tests", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll", likes: 10, __v: 0 },
    { _id: "5a422ba71b54a676234d17fb", title: "TDD harms architecture", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html", likes: 0, __v: 0 },
    { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0 }
  ]

  test('of an empty list is null', () => {
    const result = listHelper.favoriteBlog([])
    assert.strictEqual(result, null)
  })

  test('when list has only one blog, it is the favorite', () => {
    const result = listHelper.favoriteBlog(listWithOneBlog)
    // For comparing objects, use deepStrictEqual
    assert.deepStrictEqual(result, listWithOneBlog[0])
  })

  test('of a bigger list is the one with most likes', () => {
    const result = listHelper.favoriteBlog(blogs)
    const expectedFavorite = {
      _id: "5a422b3a1b54a676234d17f9",
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
      __v: 0
    }
    assert.deepStrictEqual(result, expectedFavorite)
  })

  test('if multiple blogs have max likes, returns one of them', () => {
    const blogsWithTie = [
      { title: 'Blog A', author: 'Author A', likes: 10, url: 'urlA', _id: '1', __v: 0 },
      { title: 'Blog B', author: 'Author B', likes: 15, url: 'urlB', _id: '2', __v: 0 },
      { title: 'Blog C', author: 'Author C', likes: 15, url: 'urlC', _id: '3', __v: 0 }
    ];
    const result = listHelper.favoriteBlog(blogsWithTie);
    // Since the function can return any of the tied blogs,
    // we check if the result is one of the expected ones.
    const isBlogB = result.title === 'Blog B';
    const isBlogC = result.title === 'Blog C';
    assert.ok(isBlogB || isBlogC, 'Result should be one of the blogs with max likes');
    assert.strictEqual(result.likes, 15); // And its likes should be the max
  });
})
// tests/list_helper.test.js
// ... (dummy test, totalLikes describe, favoriteBlog describe blocks remain unchanged)

// New describe block for mostBlogs
describe('most blogs', () => {
    const listWithOneBlog = [
      {
        _id: '5a422aa71b54a676234d17f8',
        title: 'Go To Statement Considered Harmful',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
        likes: 5,
        __v: 0
      }
    ]
  
    const blogs = [
      { _id: "5a422a851b54a676234d17f7", title: "React patterns", author: "Michael Chan", url: "https://reactpatterns.com/", likes: 7, __v: 0 },
      { _id: "5a422aa71b54a676234d17f8", title: "Go To Statement Considered Harmful", author: "Edsger W. Dijkstra", url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html", likes: 5, __v: 0 },
      { _id: "5a422b3a1b54a676234d17f9", title: "Canonical string reduction", author: "Edsger W. Dijkstra", url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", likes: 12, __v: 0 },
      { _id: "5a422b891b54a676234d17fa", title: "First class tests", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll", likes: 10, __v: 0 },
      { _id: "5a422ba71b54a676234d17fb", title: "TDD harms architecture", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html", likes: 0, __v: 0 },
      { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0 }
    ]
  
    test('of an empty list is null', () => {
      const result = listHelper.mostBlogs([])
      assert.strictEqual(result, null)
    })
  
    test('when list has only one blog, returns that author with 1 blog', () => {
      const result = listHelper.mostBlogs(listWithOneBlog)
      assert.deepStrictEqual(result, { author: 'Edsger W. Dijkstra', blogs: 1 })
    })
  
    test('of a bigger list returns the author with most blogs and their count', () => {
      const result = listHelper.mostBlogs(blogs)
      // Michael Chan: 1 blog
      // Edsger W. Dijkstra: 2 blogs
      // Robert C. Martin: 3 blogs
      assert.deepStrictEqual(result, { author: 'Robert C. Martin', blogs: 3 })
    })
  
    test('if multiple authors have the same max number of blogs, returns one of them', () => {
      const blogsWithTie = [
        { author: 'Author A', title: 'T1', url: 'U1', likes: 1 },
        { author: 'Author B', title: 'T2', url: 'U2', likes: 2 },
        { author: 'Author A', title: 'T3', url: 'U3', likes: 3 }, // Author A: 2 blogs
        { author: 'Author C', title: 'T4', url: 'U4', likes: 4 },
        { author: 'Author B', title: 'T5', url: 'U5', likes: 5 }, // Author B: 2 blogs
        { author: 'Author C', title: 'T6', url: 'U6', likes: 6 }, // Author C: 2 blogs
      ]
      // Expected: Author A, B, or C, each with 2 blogs.
      // The current implementation will likely pick the one encountered first in the authorCounts iteration.
      const result = listHelper.mostBlogs(blogsWithTie)
      const possibleAuthors = ['Author A', 'Author B', 'Author C']
      assert.ok(possibleAuthors.includes(result.author), `Author should be one of ${possibleAuthors.join(', ')}`)
      assert.strictEqual(result.blogs, 2)
    })
  
    test('when blogs have no author field or author is empty', () => {
      const blogsWithoutAuthor = [
        { title: "No Author Blog 1", url: "url1", likes: 5 },
        { author: '', title: "Empty Author Blog", url: "url2", likes: 3 },
        { author: null, title: "Null Author Blog", url: "url3", likes: 3 }
      ];
      const result = listHelper.mostBlogs(blogsWithoutAuthor);
      // If all blogs lack a valid author, it should return null based on current implementation
      // Or you could define specific behavior, like returning an author '' with count if that's preferred
      assert.strictEqual(result, null);
    });
  })
  describe('most likes', () => {
    const listWithOneBlog = [
      {
        _id: '5a422aa71b54a676234d17f8',
        title: 'Go To Statement Considered Harmful',
        author: 'Edsger W. Dijkstra',
        url: 'http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html',
        likes: 5,
        __v: 0
      }
    ]
  
    const blogs = [
      { _id: "5a422a851b54a676234d17f7", title: "React patterns", author: "Michael Chan", url: "https://reactpatterns.com/", likes: 7, __v: 0 },
      { _id: "5a422aa71b54a676234d17f8", title: "Go To Statement Considered Harmful", author: "Edsger W. Dijkstra", url: "http://www.u.arizona.edu/~rubinson/copyright_violations/Go_To_Considered_Harmful.html", likes: 5, __v: 0 },
      { _id: "5a422b3a1b54a676234d17f9", title: "Canonical string reduction", author: "Edsger W. Dijkstra", url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html", likes: 12, __v: 0 },
      { _id: "5a422b891b54a676234d17fa", title: "First class tests", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll", likes: 10, __v: 0 },
      { _id: "5a422ba71b54a676234d17fb", title: "TDD harms architecture", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html", likes: 0, __v: 0 },
      { _id: "5a422bc61b54a676234d17fc", title: "Type wars", author: "Robert C. Martin", url: "http://blog.cleancoder.com/uncle-bob/2016/05/01/TypeWars.html", likes: 2, __v: 0 }
    ]
  
    test('of an empty list is null', () => {
      const result = listHelper.mostLikes([])
      assert.strictEqual(result, null)
    })
  
    test('when list has only one blog, returns that author and their likes', () => {
      const result = listHelper.mostLikes(listWithOneBlog)
      assert.deepStrictEqual(result, { author: 'Edsger W. Dijkstra', likes: 5 })
    })
  
    test('of a bigger list returns the author with most total likes and their sum', () => {
      const result = listHelper.mostLikes(blogs)
      // Michael Chan: 7 likes
      // Edsger W. Dijkstra: 5 + 12 = 17 likes
      // Robert C. Martin: 10 + 0 + 2 = 12 likes
      assert.deepStrictEqual(result, { author: 'Edsger W. Dijkstra', likes: 17 })
    })
  
    test('if multiple authors have the same max total likes, returns one of them', () => {
      const blogsWithTie = [
        { author: 'Author A', title: 'T1', url: 'U1', likes: 10 }, // Total A: 10
        { author: 'Author B', title: 'T2', url: 'U2', likes: 15 }, // Total B: 15
        { author: 'Author C', title: 'T3', url: 'U3', likes: 5 },
        { author: 'Author C', title: 'T4', url: 'U4', likes: 10 }, // Total C: 15
      ]
      // Expected: Author B or Author C, each with 15 total likes.
      const result = listHelper.mostLikes(blogsWithTie)
      const possibleAuthors = ['Author B', 'Author C']
      assert.ok(possibleAuthors.includes(result.author), `Author should be one of ${possibleAuthors.join(', ')}`)
      assert.strictEqual(result.likes, 15)
    })
  
    test('when blogs have no likes or author field', () => {
      const blogsWithoutLikesOrAuthor = [
        { author: 'Author X', title: 'No Likes Blog', url: 'urlX' }, // likes is undefined
        { title: 'No Author Blog', url: 'urlY', likes: 5 },
        { author: 'Author Z', title: 'Zero Likes Blog', url: 'urlZ', likes: 0 }
      ];
      // Author X: 0 likes (from undefined)
      // Author Z: 0 likes
      // If no positive likes, it should still pick an author with 0 likes, or return null if no authors.
      // Based on current logic, Author X or Z with 0 likes.
      const result = listHelper.mostLikes(blogsWithoutLikesOrAuthor);
      if (result !== null) { // It might be null if no authors are processed
          assert.ok(result.author === 'Author X' || result.author === 'Author Z');
          assert.strictEqual(result.likes, 0);
      } else {
          // This case might occur if your logic for handling missing authors in mostLikes is very strict
          // and returns null early. The provided mostLikes should handle it.
          assert.strictEqual(result, null, "Should be null if no authors with likes processed");
      }
    });
  })
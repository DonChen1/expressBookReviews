const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ 
    return !users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ 
    return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // if (!isValid(username)) {
    //     return res.status(400).json({ message: "Invalid username" });
    // }

    if (authenticatedUser(username, password)) {
        //let token = req.session.authorization['accessToken'];
        const token = jwt.sign({ username }, "access", { expiresIn: '1h' });
        req.session.authorization = { accessToken: token };
        return res.json({ token });
    } else {
        return res.status(401).json({ message: "Invalid username or password" });
    }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const { isbn } = req.params;
  const reviewContent = req.query.review; 
  
  const token = req.session.authorization['accessToken'];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

    // Verify the token
  jwt.verify(token, 'access', (err, decoded) => {
    if (err) {
        console.error("Token verification error:", err);
      return res.status(500).json({ message: "Failed to authenticate token" });
    }

    const username = decoded.username;

    // Check if the book exists
    if (!books[isbn]) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Initialize reviews array if it doesn't exist
    if (!books[isbn].reviews) {
      books[isbn].reviews = [];
    }

    console.log("Current reviews before addition:", books[isbn].reviews);

    // Check if the user has already reviewed this book
    const existingReviewIndex = books[isbn].reviews.findIndex(r => r.user === username);

    if (existingReviewIndex !== -1) {
      // User already has a review, update it
      books[isbn].reviews[existingReviewIndex].review = reviewContent;
      return res.json({ message: "Review updated successfully", reviews: books[isbn].reviews });
    } else {
      // New review, add it to the array
      books[isbn].reviews.push({ reviews: reviewContent ,user: username});
      return res.json({ message: "Review added successfully", reviews: books[isbn].reviews });
    }
  });
  
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
    const { isbn } = req.params;
    const token = req.session.authorization?.['accessToken'];

    if (!token) {
        return res.status(403).json({ message: "No token provided" });
    }

    // Verify the token
    jwt.verify(token, 'access', (err, decoded) => {
        if (err) {
            console.error("Token verification error:", err);
            return res.status(500).json({ message: "Failed to authenticate token" });
        }

        const username = decoded.username;

        // Check if the book exists
        if (!books[isbn]) {
            return res.status(404).json({ message: "Book not found" });
        }

        // Initialize reviews array if it doesn't exist
        if (!books[isbn].reviews) {
            return res.status(404).json({ message: "No reviews found for this book" });
        }

        // Find the review index for the user
        const reviewIndex = books[isbn].reviews.findIndex(r => r.user === username);

        if (reviewIndex === -1) {
            // No review found for the user
            return res.status(404).json({ message: "Review not found for this user" });
        }

        // Delete the review
        books[isbn].reviews.splice(reviewIndex, 1);

        return res.json({
            message: "Review deleted successfully",
            reviews: books[isbn].reviews // Return the updated list of reviews
        });
    });
});


module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;

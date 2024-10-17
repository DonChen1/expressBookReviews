const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Both username and password are required!" });
    }
  
    if (users.find(user => user.username === username)) {
      return res.status(400).json({ message: "User already exists" });
    }
  
    users.push({ username, password });
    return res.status(201).json({ message: "User registered successfully" });
});

const getBooks = async () => {
    return new Promise((resolve, reject) => {
       
        setTimeout(() => {
            resolve(books);
        }, 100); 
    });
};

// Get the book list available in the shop
public_users.get('/',async (req, res) =>{
    try {
        const booksData = await getBooks(); // the promise
        return res.json(booksData); 
    } catch (error) {
        console.error("Error fetching books:", error.message);
        return res.status(500).json({ message: "Failed to fetch books" });
    }
});


const fetchBookByISBN = async (isbn) => {
    return new Promise((resolve, reject) => {
        const book = books[isbn];
        if (book) {
            resolve(book); 
        } else {
            reject(new Error("Book not found")); 
        }
    });
};
// Get book details based on ISBN
public_users.get('/isbn/:isbn',async (req, res) => {
  const isbn = req.params.isbn;
  try {
    const bookDetails = await fetchBookByISBN(isbn); 
    return res.json(bookDetails); 
} catch (error) {
    console.error("Error fetching book details:", error.message);
    return res.status(404).json({ message: "Book not found" });
}
 });
  

 const fetchBooksByAuthor = async (author) => {
    return new Promise((resolve, reject) => {
        const results = Object.values(books).filter(book => book.author.toLowerCase() === author.toLowerCase());
        if (results.length > 0) {
            resolve(results); 
        } else {
            reject(new Error("No books found for this author")); 
        }
    });
};
// Get book details based on author
public_users.get('/author/:author',async (req, res) =>{
    const author = req.params.author;
    try {
        const booksByAuthor = await fetchBooksByAuthor(author); 
        return res.json(booksByAuthor); 
    } catch (error) {
        console.error("Error fetching books by author:", error.message);
        return res.status(404).json({ message: "No books found for this author" });
    }
});

const fetchBooksByTitle = async (title) => {
    return new Promise((resolve, reject) => {
        const results = Object.values(books).filter(book => book.title.toLowerCase().includes(title.toLowerCase()));
        if (results.length > 0) {
            resolve(results); 
        } else {
            reject(new Error("No books found with this title")); 
        }
    });
};

// Get all books based on title
public_users.get('/title/:title',async (req, res) =>{
    const title = req.params.title;
    try {
        const booksByTitle = await fetchBooksByTitle(title); 
        return res.json(booksByTitle); 
    } catch (error) {
        console.error("Error fetching books by title:", error.message);
        return res.status(404).json({ message: "No books found with this title" });
    }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
    const isbn = req.params.isbn;
    const book = books[isbn];
    if (book && book.reviews) {
      return res.send(JSON.stringify(book.reviews, null, 4));
    }
    return res.status(404).json({ message: "Book Not Found!" });
});

module.exports.general = public_users;

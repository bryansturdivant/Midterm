//routing module 

const express = require('express');
const router = express.Router();

//const {comments, users} = require('../data');

const db = require('../databases/database');
//This allows user info to be passed in to every route without doing it for each one
  
//Routes
router.get('/', (req, res) => {
  res.render('index');
});

router.get('/login', (req, res)=>{
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.get('/comments', (req, res)=> {
  //res.render('comments', {comments: comments});// comments:comments is passing the comments into view
  const comments = db.prepare(
    `SELECT comments.comment, comments.timestamp AS date, users.username
    FROM comments
    LEFT JOIN users ON users.id = comments.userId
    ORDER BY comments.timestamp DESC`
  ).all();

  res.render('comments', {comments});
});

router.get('/comment/new', (req, res) => {
  if(req.session.userId){
    res.render('comment_new');
  }
  else{
    return res.render('login', {
      error: "You must be logged in to post a comment!",
    });
  }
});




//Posting comments 
router.post('/comments', (req, res) => {



  if(!req.session.userId){
    return res.render('login', {error:"You must be logged in to post a comment"});
  }
  //prepares a new comment 
  const insertComment = db.prepare(
    `INSERT INTO comments (userId, comment) VALUES (?, ?)`
  )
  //inserts the new comment into the comments table 
  insertComment.run(req.session.userId, req.body.comment);

  res.redirect('/comments'); //shows the updated list/page
  });
  
router.post('/register', (req, res) => {


  const {username, email, password, display_name} = req.body;
  //check if username exists

  const existingUser = db.prepare(
    `SELECT * FROM users WHERE username = ?`
  ).get(username);


  if (existingUser) {
    return res.render('register', {
      error: "Username already exists. Please choose a different username.",
    });
  }

  db.prepare(
    `INSERT INTO users (username, email, password, display_name) 
    VALUES (?, ?, ?, ?)`
  ).run(username, email, password, display_name);
  res.redirect('/login');
});

//login

router.post('/login', (req, res) => {

  const {username, password} = req.body; //fasthand instead of listing out both

  // const user = users.find(u => u.username === username && u.password === password);// finds users in the user aray

  const user = db.prepare(
    `SELECT * FROM users WHERE username = ? AND password = ?`
  ).get(username, password);

  if (user) {
    req.session.userId = user.id;
    req.session.username = user.username;
    return res.redirect('/comments');//maybe make a welcome 'user name' at homepage instead
  }
  else{
    console.log("login failed for: ", username);
    return res.render('login', {
      error: "Username or Password is incorrect. Please try again.",
    });

  }
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy();
  console.log('User logged out');
  res.redirect('/');
});

module.exports = router; 
//routing module 

const express = require('express');
const router = express.Router();
const path = require('path');

const db = require('../databases/database');
const {validatePassword, hashPassword, comparePassword} = require('./auth');

  
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

router.get('/profile', (req, res) => {
  const user = db.prepare(
    `SELECT id, username, display_name, email FROM users WHERE id = ?
    `
  ).get(req.session.userId);

  res.render('profile', {user});
});

router.get('/comments', (req, res)=> {
  //res.render('comments', {comments: comments});// comments:comments is passing the comments into view
  const comments = db.prepare(
    `SELECT comments.comment, comments.timestamp AS date, users.username, users.display_name
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
  
router.post('/register', async (req, res) => {


  const {username, email, password, display_name} = req.body;


  // Validate password requirements
  const validation = validatePassword(password);
  if (!validation.valid) {
    //const errorsText = validation.errors.join(', ');
    return res.render('register', {
      error: "Password does not meet the requirements",
      errorList: validation.errors
    });
  }
  //check if username exists

  const existingUser = db.prepare(
    `SELECT * FROM users WHERE username = ?`
  ).get(username);


  if (existingUser) {
    return res.render('register', {
      error: "Username already exists. Please choose a different username.",
    });
  }
  // Hash the password before storing
  const passwordHash = await hashPassword(password);

  db.prepare(
    `INSERT INTO users (username, email, password, display_name) 
    VALUES (?, ?, ?, ?)`
  ).run(username, email, passwordHash, display_name);
  res.redirect('/login');
});

//login

router.post('/login', async (req, res) => {

  const {username, password} = req.body; //fasthand instead of listing out both

  // const user = users.find(u => u.username === username && u.password === password);// finds users in the user aray

  const user = db.prepare(
    `SELECT * FROM users WHERE username = ?`
  ).get(username);


  if (!user) {
    return res.render('login', {
      error: "Username or Password is incorrect. Please try again."
    })
  }
  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch){
    return res.render('login', {
      error: "Username or Password is incorrect. Please try again."
    })
  }
  //update last login???
  // db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
  // .run(user.id);

  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/comments');
});

// Logout route
router.get('/logout', (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error('Error destroying session:', error);
      return res.status(500).send('Internal Server error')
    }
  console.log('User logged out');
  res.redirect('/');
  });
});

router.post('/logout', (req, res) => {

  req.session.destroy(error => {
    if (error) {
      console.error('Error destroying sesssion', error);
      return res.status(500).send('Internal Server error')
    }
    res.redirect('/');
  });

});


router.post('/profile', async (req, res) => {
  const username = req.session.username;
  
  if(req.body.newPassword){
    const currentPass = req.body.currentPassword;

    const user = db.prepare(
      `SELECT * FROM users WHERE username = ?`
    ).get(username);
    
    const comparedPassword = await comparePassword(currentPass, user.password);
    
    if(!comparedPassword){
      return res.render('profile', {
        error: "Must enter correct password to change to a new password",
        user
      });
    }
    
    const validatedPassword = validatePassword(req.body.newPassword);
    if (!validatedPassword.valid){
      return res.render('profile', {
        error: "Must enter a password that fulfills all requirements",
        errorList: validatedPassword.errors,
        user
      });
    }
    
    const hashedPassword = await hashPassword(req.body.newPassword);
    db.prepare('UPDATE users SET password = ? WHERE username = ?')
      .run(hashedPassword, username);
    
    const updatedUser = db.prepare('SELECT id, username, display_name, email FROM users WHERE username = ?')
      .get(username);
    
    return res.render('profile', {
      success: "Password successfully updated", 
      user: updatedUser
    });
  }
  
  res.redirect('/profile');
});
module.exports = router; 
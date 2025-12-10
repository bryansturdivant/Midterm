//routing module 

const express = require('express');
const router = express.Router();

const {comments, users} = require('../data');
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
  res.render('comments', {comments: comments});// comments:comments is passing the comments into view
});

router.get('/comment/new', (req, res) => {
  if(req.session.user){
    res.render('comment_new');
  }
  else{
    return res.render('login', {
      error: "You must be logged in to post a comment!",
    });
  }




//Posting comments 

router.post('/comments', (req, res) => {
    const newComment = {
      username: req.session.user || "Guest", //Username if logged in, guest if not - all from session
      comment: req.body.comment,  // Also from the form 
      date: new Date().toLocaleDateString()
    };
    comments.push(newComment); //adds our new comment to the array
    res.redirect('/comments'); //shows the updated list/page
  });
  
router.post('/register', (req, res) => {

  //check if username exists

  const {username, password} = req.body;
  const existinguser = users.find(u => u.username === username)

  if (existinguser) {
    return res.render('register', {
      error: "Username already exists. Please choose a different username.",
    });
  }



  const newUser = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    favoriteGenre: req.body['favorite-genre']
  };
  users.push(newUser);
  console.log('New user registered: ', newUser);
  console.log('All users: ', users);

  res.redirect('/login');
});

//login

router.post('/login', (req, res) => {

  const {username, password} = req.body; //fasthand instead of listing out both

  const user = users.find(u => u.username === username && u.password === password);// finds users in the user aray

  if (user) {
    req.session.user = username;

    console.log("User logged in: ", username);
    console.log("Session ID: ", req.session.id);
    res.redirect('/comments');//maybe make a welcome 'user name' at homepage instead
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


});

module.exports = router; 
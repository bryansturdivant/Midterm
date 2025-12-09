//Testing for cyberduck
// node server.js
//ssh -L 3000:localhost:3000 bsturdivant@143.198.9.242// In separate terminal while the server is running in another
//then: http://localhost:3000/Home.html in browser 
const express = require('express');
const {engine} = require('express-handlebars');
const session = require('express-session')

const app = express();
const PORT = process.env.PORT || 3000;


//data for comments and users - all needs to be replaced with sql db stuff - to do later 

const comments = [{username: "StephenKingSucks", comment: "I hate Stephen King", date: "10/25"}, {username: "IAmStephenKing", comment: "I love Stephen King", date: "11/25"}];
const users = [];

// Configure Handlebars
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: false,
  partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');
app.set('views', './views');

//middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));


//allows me to serve all static files from the public directly 
app.use(express.static('public'));

//session middleware to handle cookies automatically
app.use(session({
  secret: 'book-lovers-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

//This allows user info to be passed in to every route without doing it for each one
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

//Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res)=>{
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/comments', (req, res)=> {
  res.render('comments', {comments: comments});// comments:comments is passing the comments into view
});

app.get('/comment/new', (req, res) => {
  if(req.session.user){
    res.render('comment_new');
  }
  else{
    return res.render('login', {
      error: "You must be logged in to post a comment!",
    });
  }

});

app.post('/comments', (req, res) => {
  const newComment = {
    username: req.session.user || "Guest", //Username if logged in, guest if not - all from session
    comment: req.body.comment,  // Also from the form 
    date: new Date().toLocaleDateString()
  };
  comments.push(newComment); //adds our new comment to the array
  res.redirect('/comments'); //shows the updated list/page
});

app.post('/register', (req, res) => {

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

app.post('/login', (req, res) => {

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
app.get('/logout', (req, res) => {
  req.session.destroy();
  console.log('User logged out');
  res.redirect('/');
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//runs the app 
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on http://<143.198.9.242>:${PORT}`);
});

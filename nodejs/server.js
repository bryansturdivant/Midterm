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

const routes = require('./modules/routes');

app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//runs the app 
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on http://<143.198.9.242>:${PORT}`);
});

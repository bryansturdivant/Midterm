
const express = require('express');
const {engine} = require('express-handlebars');
const session = require('express-session')
const SQLiteStore = require('./databases/sessions');
const path = require('path');
const authRoutes = require('./modules/auth');
const {handleError, notFound} = require('./modules/error-handler')

const app = express();
const PORT = process.env.PORT || 3000;

const sessionStore = new SQLiteStore({
  db: path.join(__dirname, 'databases', 'sessions.db'),
  table: 'sessions'
});
console.log('Full database path:', path.join(__dirname, 'databases', 'sessions.db'));


// Configure Handlebars
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: false,
  partialsDir: __dirname + '/views/partials'
}));
app.set('view engine', 'hbs');
app.set('views', './views');
app.set('trust proxy', 1);

//middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

//session middleware to handle cookies automatically
app.use(session({
  store: sessionStore, //stores sessions in sqlite 
  secret: 'book-lovers-key-2025',//session secret
  resave: false,
  saveUninitialized: false,
  cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

//This allows user info to be passed in to every route without doing it for each one
app.use((req, res, next) => {
  res.locals.user = req.session.username || null;
  res.locals.userId = req.session.userId || null;
  next();
});

const routes = require('./modules/routes');

app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});
// Error handlers must be last
app.use(notFound);        // 404 handler
app.use(handleError);     // General error handler

//runs the app 
app.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on http://<143.198.9.242>:${PORT}`);
});

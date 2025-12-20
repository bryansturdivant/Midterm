
const express = require('express');
const {engine} = require('express-handlebars');
const session = require('express-session')
const SQLiteStore = require('./databases/sessions');
const path = require('path');
const authRoutes = require('./modules/auth');
const {handleError, notFound} = require('./modules/error-handler')
const {Server} = require('socket.io');
const http = require('http');
const db = require('./databases/database');



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
  partialsDir: __dirname + '/views/partials',
  helpers: {
    add: (a,b) => a + b,
    subtract: (a,b) => a - b
  }
}));
app.set('view engine', 'hbs');
app.set('views', './views');
app.set('trust proxy', 1);

//middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

//session middleware to handle cookies automatically
const sessionMiddleware = session({
  store: sessionStore,
  secret: 'book-lovers-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
});

app.use(sessionMiddleware);


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




const httpServer = http.createServer(app); // wrap express app in HTTP server

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Share session with Socket.IO (official method)
io.engine.use(sessionMiddleware);

// Add Socket.IO event handlers
io.on('connection', (socket) => {
  const session = socket.request.session;
  const userId = session.userId;
  const username = session.username;
  const displayName = session.displayName;
  const isLoggedIn = session.isLoggedIn;
  console.log('Client connected:', socket.id);
  console.log('User:', username, 'ID: ', userId);
    // Authentication check
    if (!isLoggedIn) {
        socket.emit('error', { message: 'Authentication required' });
        socket.disconnect();
        return;
    }

  socket.on('requestData', (data) => {
      socket.emit('response', {
          success: true,
          message: `Hello ${username}`,
          userId: userId,
          data:data
      });
  });
  // Chat event
  socket.on('chat', (message) => {
    console.log(`Received message from client: ${message}`);
      db.prepare(`INSERT INTO chat_messages (userId, message, displayName, created_at) VALUES (?, ?, ?, ?)`).run(userId, message, displayName, new Date().toISOString());

      console.log('Inserted into DB: ', userId, displayName, message);
      io.emit('chat', {
          user: displayName,
          message: message,
          timestamp: new Date().toISOString()
      });
      console.log('Messaged has been displayed');
  });

  socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
  });
});





//runs the app 
httpServer.listen(PORT, '0.0.0.0',() => {
  console.log(`Server is running on http://<143.198.9.242>:${PORT}`);
});

const Database = require('better-sqlite3');
const path = require('path');

//This is how we connect to the database file

const dbPath = path.join(__dirname, 'myapp.db');
const db = new Database(dbPath);

console.log("Printing from the top");

// WARNING: This deletes ALL users! Use only for development/testing
db.exec(`DROP TABLE IF EXISTS users;`);
//Creates the users table 
db.exec(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        customization_field TEXT,
        account_lockout TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        password_reset_token TEXT,
        password_reset_expire INTEGER,
        profile_color TEXT NOT NULL DEFAULT '#000000')`
);

const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
if (userCount === 0) {
    const insert = db.prepare('INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)');
    insert.run('testUser', 'testEmail', 'testPassword9~', 'testDisplay');
    insert.run('blahS', 'boop@gmail.com', 'password', 'blahSDisplay0');
    insert.run('blahZZZ', 'boop1@gmail.com', 'password', 'blahSDisplay1');
    insert.run('blahIII', 'boop2@gmail.com', 'password', 'blahSDisplay2');
    insert.run('blahXXX', 'boop3@gmail.com', 'password', 'blahSDisplay3');
    insert.run('blahXYZ', 'boop4@gmail.com', 'password', 'blahSDisplay4');
    console.log('Inserted initial test users.');
}


//Creates the sessions table
db.exec(
    `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        userId INTEGER REFERENCES users(id)
    )`
);


//Creates the comments table 
db.exec(
    `CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER REFERENCES users(id),
        comment TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`
);

const commentCount = db.prepare('SELECT COUNT(*) AS count FROM comments').get().count;
if (commentCount === 0) {
    db.prepare('INSERT INTO comments (userId, comment) VALUES (?, ?)').run(1, 'This is the first comment!');
    console.log('Inserted initial comment.');
}

//Login attempts table 
db.exec(
    `CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT NOT NULL,
        username TEXT NOT NULL,
        attempt_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        success INTEGER DEFAULT 0
        )`
);



// Create index for faster lookups on IP address and username combination
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_username 
  ON login_attempts(ip_address, username, attempt_time)
`);


//for resetting passwords
db.exec(
    `CREATE TABLE IF NOT EXISTS reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER REFERENCES users(id)
        )`
);


//chat messages table 
db.exec(
    `CREATE TABLE IF NOT EXISTS chat_messages(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL REFERENCES users(id),
        message TEXT NOT NULL,
        displayName TEXT NOT NULL,
        created_at TEXT NOT NULL)`
);


console.log('Database initialized succesfully');

module.exports = db;

//Users: username, pasword(hashed), email, display name, profile customization fields, account lockout fields
//Sessions: session data linked to users
//Comments: author(linked to user), text, timestamps, etc
//Login Attempts: username, IP adress, timestamp, success/failure status
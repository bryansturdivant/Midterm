const Database = require('better-sqlite3');
const path = require('path');

//This is how we connect to the database file

const dbPath = path.join(__dirname, 'myapp.db');
const db = new Database(dbPath);

db.exec(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT UNIQE NOT NULL,
        customization_field TEXT,
        account_lockout TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
);

db.exec(
    `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        session_data INT
    )`
);

db.exec(
    `CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        author TEXT FOREIGN KEY REFERENCES users(display_name)
        text TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`
);

db.exec(
    `CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT FOREIGN KEY REFERENCES users(username),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        success/failured TEXT)`
);

module.exports = db;
//Users: username, pasword(hashed), email, display name, profile customization fields, account lockout fields
//Sessions: session data linked to users
//Comments: author(linked to user), text, timestamps, etc
//Login Attempts: username, IP adress, timestamp, success/failure status
const Database = require('better-sqlite3');
const path = require('path');

//This is how we connect to the database file

const dbPath = path.join(__dirname, 'myapp.db');
const db = new Database(dbPath);

console.log("Printing from the top");


//JUST FOR TESTING, MAKE SURE TO REMOVE LATER TO AVOID HEADACHE
db.exec(`DROP TABLE IF EXISTS comments;`);
db.exec(`DROP TABLE IF EXISTS sessions;`);
db.exec(`DROP TABLE IF EXISTS login_attempts;`);
db.exec(`DROP TABLE IF EXISTS reset_tokens;`);
db.exec(`DROP TABLE IF EXISTS users;`);



db.exec(
    `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT NOT NULL,
        display_name TEXT NOT NULL,
        customization_field TEXT,
        account_lockout TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`
);

db.prepare(
    `INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)`
).run("testuser", "testemail", "testpassword", "testdisplayname");



console.log("printing after users table");


db.exec(
    `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT, 
        userId INTEGER REFERENCES users(id)
    )`
);



console.log("Printing after sessions")



db.exec(
    `CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER REFERENCES users(id),
        comment TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)`
);

db.prepare(
    `INSERT INTO comments (userId, comment) VALUES (?, ?)`
).run(1, "This is the first comment!");

console.log("printing after comments")

db.exec(
    `CREATE TABLE IF NOT EXISTS login_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER REFERENCES users(id),
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        success_failure TEXT
        )`
);

console.log('printing after login attempts')

//for resetting passwords - i'll have to look into this a little bit more 
db.exec(
    `CREATE TABLE IF NOT EXISTS reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER REFERENCES users(id)
        )`
);

console.log("printing after resetting password");

const insert = db.prepare('INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)');
insert.run('blahS', 'boop@gmail.com', 'password', 'blahSDisplay0');
console.log('inserted');
insert.run('blahZZZ', 'boop1@gmail.com', 'password', 'blahSDisplay1');
console.log('inserted');
insert.run('blahIII', 'boop2@gmail.com', 'password', 'blahSDisplay2');
console.log('inserted');
insert.run('blahXXX', 'boop3@gmail.com', 'password', 'blahSDisplay3');
console.log('inserted');
insert.run('blahXYZ', 'boop4@gmail.com', 'password', 'blahSDisplay4');


const users = db.prepare('SELECT * FROM users').all();


users.forEach((user) => {
    console.log(`ID: ${user.id}, username: ${user.email}, email: ${user.email}, password: ${user.password}, Display Name: ${user.display_name}, created at: ${user.created_at}`);
});





module.exports = db;

//Users: username, pasword(hashed), email, display name, profile customization fields, account lockout fields
//Sessions: session data linked to users
//Comments: author(linked to user), text, timestamps, etc
//Login Attempts: username, IP adress, timestamp, success/failure status
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

//inserting users for testing 
const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
if (userCount === 0) {
    const insert = db.prepare('INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)');
    insert.run('bookworm42', 'reader1@gmail.com', 'testPass123!', 'Literary Explorer');
    insert.run('pageturner88', 'reader2@gmail.com', 'testPass123!', 'Chapter Chaser');
    insert.run('novel_fan', 'reader3@gmail.com', 'testPass123!', 'Fiction Lover');
    insert.run('scifi_guru', 'reader4@gmail.com', 'testPass123!', 'Galaxy Reader');
    insert.run('mystery_buff', 'reader5@gmail.com', 'testPass123!', 'Detective Mind');
    insert.run('fantasy_knight', 'reader6@gmail.com', 'testPass123!', 'Epic Seeker');
    insert.run('classic_reader', 'reader7@gmail.com', 'testPass123!', 'Timeless Tales');
    insert.run('poetry_soul', 'reader8@gmail.com', 'testPass123!', 'Verse Enthusiast');
    insert.run('thriller_addict', 'reader9@gmail.com', 'testPass123!', 'Suspense Fan');
    insert.run('romance_heart', 'reader10@gmail.com', 'testPass123!', 'Love Story');
    insert.run('history_nerd', 'reader11@gmail.com', 'testPass123!', 'Time Traveler');
    insert.run('bio_reader', 'reader12@gmail.com', 'testPass123!', 'Life Stories');
    insert.run('comic_collector', 'reader13@gmail.com', 'testPass123!', 'Panel Expert');
    insert.run('audiobook_pro', 'reader14@gmail.com', 'testPass123!', 'Sound Reader');
    insert.run('library_mouse', 'reader15@gmail.com', 'testPass123!', 'Quiet Corner');
    insert.run('speed_reader', 'reader16@gmail.com', 'testPass123!', 'Quick Pages');
    insert.run('book_club_host', 'reader17@gmail.com', 'testPass123!', 'Discussion Lead');
    insert.run('rare_books', 'reader18@gmail.com', 'testPass123!', 'Collector');
    insert.run('young_adult_fan', 'reader19@gmail.com', 'testPass123!', 'YA Explorer');
    insert.run('non_fiction_mind', 'reader20@gmail.com', 'testPass123!', 'Truth Seeker');
    console.log('Inserted 20 test users.');
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

//inserting comments for pagination testing 
const commentCount = db.prepare('SELECT COUNT(*) AS count FROM comments').get().count;
if (commentCount === 0) {
    for(let i = 1; i < 21; i++ ){
        db.prepare('INSERT INTO comments (userId, comment) VALUES (?, ?)').run(i, `This is test comment #${i}. This is a test comment`);
        console.log(`Inserting comment number ${i}`);
    }
    
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

//export the db module 
module.exports = db;

